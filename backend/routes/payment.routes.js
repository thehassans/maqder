import express from 'express'
import SystemSettings from '../models/SystemSettings.js'
import Tenant from '../models/Tenant.js'
import DemoUser from '../models/DemoUser.js'
import { protect } from '../middleware/auth.js'
import { sendUpgradeWelcomeEmail } from '../utils/emailService.js'

const router = express.Router()

const getMoyasarConfig = async () => {
  const settings = await SystemSettings.findOne({ key: 'global' })
  const payment = settings?.payment?.toObject?.() || settings?.payment || {}
  const moyasar = payment?.moyasar || {}
  return {
    enabled: moyasar.enabled === true,
    publishableKey: moyasar.publishableKey || '',
    secretKey: moyasar.secretKey || '',
    webhookSecret: moyasar.webhookSecret || '',
    environment: moyasar.environment || 'test',
  }
}

const MOYASAR_API_BASE = 'https://api.moyasar.com'

const applyTenantUpgrade = async ({ tenantId, demoEmail, plan, billingCycle, amountHalalas, currency, paymentId }) => {
  if (!tenantId) return

  const now = new Date()
  const endDate = new Date(now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)

  await Tenant.findByIdAndUpdate(tenantId, {
    isDemo: false,
    demoUpgraded: true,
    'subscription.plan': plan,
    'subscription.status': 'active',
    'subscription.startDate': now,
    'subscription.endDate': endDate,
    'subscription.billingCycle': billingCycle,
    'subscription.price': Number(amountHalalas) / 100,
  })

  if (demoEmail) {
    await DemoUser.findOneAndUpdate(
      { email: demoEmail },
      {
        isUpgraded: true,
        upgradedAt: now,
        paymentId,
        amount: Number(amountHalalas) / 100,
        currency,
        plan,
        billingCycle,
      }
    )
  }

  const upgradedTenant = await Tenant.findById(tenantId).lean()
  sendUpgradeWelcomeEmail({
    email: demoEmail || upgradedTenant?.demoEmail || '',
    tenant: upgradedTenant,
    plan,
    billingCycle,
    amount: Number(amountHalalas) / 100,
    currency,
  }).catch(() => {})
}

// @route   POST /api/payments/create-payment
// @desc    Create a Moyasar hosted invoice for demo user upgrade
// @access  Private (demo users only)
router.post('/create-payment', protect, async (req, res) => {
  try {
    const { amount, currency = 'SAR', plan = 'professional', billingCycle = 'monthly', paymentMethod = 'creditcard' } = req.body

    const tenant = await Tenant.findById(req.user.tenantId)
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' })
    }

    if (!tenant.isDemo) {
      return res.status(400).json({ error: 'Only demo accounts can upgrade' })
    }

    const config = await getMoyasarConfig()
    if (!config.enabled || !config.secretKey) {
      return res.status(400).json({ error: 'Payment gateway is not configured' })
    }

    if (paymentMethod === 'stcpay') {
      return res.status(400).json({ error: 'STC Pay integration is coming soon. Please use Credit Card or Apple Pay.' })
    }

    const finalAmount = Math.round(Number(amount) * 100)

    if (!finalAmount || finalAmount < 100) {
      return res.status(400).json({ error: `Invalid amount: ${amount} (converted to ${finalAmount} halalas)` })
    }

    const frontendUrl = (process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`).split(',')[0].trim().replace(/\/$/, '')
    const callbackUrl = `${frontendUrl}/api/payments/invoice-webhook`
    const successUrl = `${frontendUrl}/payment-result?status=paid&tenantId=${tenant._id}`
    const backUrl = `${frontendUrl}/demo-checkout`

    const requestBody = {
      amount: finalAmount,
      currency,
      description: `Maqder ERP - ${plan} plan (${billingCycle}) upgrade for ${tenant.demoEmail || tenant.name}`,
      callback_url: callbackUrl,
      success_url: successUrl,
      back_url: backUrl,
      metadata: {
        tenantId: String(tenant._id),
        demoEmail: tenant.demoEmail || '',
        plan,
        billingCycle,
      },
    }

    const response = await fetch(`${MOYASAR_API_BASE}/v1/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(config.secretKey.trim() + ':').toString('base64')}`,
      },
      body: JSON.stringify(requestBody),
    })

    const invoiceData = await response.json()

    if (!response.ok) {
      console.error('[Moyasar] Invoice creation failed:', response.status, JSON.stringify(invoiceData))
      return res.status(400).json({
        error: invoiceData?.message || 'Failed to create invoice',
        moyasarError: invoiceData,
      })
    }

    res.json({
      id: invoiceData.id,
      status: invoiceData.status,
      url: invoiceData.url,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// @route   POST /api/payments/invoice-webhook
// @desc    Moyasar invoice webhook — invoked with the invoice object when paid
// @access  Public
router.post('/invoice-webhook', async (req, res) => {
  try {
    const invoice = req.body

    if (invoice?.status === 'paid') {
      await applyTenantUpgrade({
        tenantId: invoice?.metadata?.tenantId,
        demoEmail: invoice?.metadata?.demoEmail,
        plan: invoice?.metadata?.plan || 'professional',
        billingCycle: invoice?.metadata?.billingCycle || 'monthly',
        amountHalalas: invoice.amount,
        currency: invoice.currency,
        paymentId: invoice.id,
      })
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('[Moyasar] Invoice webhook error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// @route   GET /api/payments/callback
// @desc    Legacy Moyasar payment callback - redirect to frontend
// @access  Public
router.get('/callback', async (req, res) => {
  const { id, status, tenantId } = req.query
  const frontendUrl = process.env.FRONTEND_URL || 'https://maqder.com'
  res.redirect(`${frontendUrl}/payment-result?id=${id}&status=${status}&tenantId=${tenantId || ''}`)
})

// @route   POST /api/payments/webhook
// @desc    Moyasar webhook handler
// @access  Public (verified by webhook secret)
router.post('/webhook', async (req, res) => {
  try {
    const config = await getMoyasarConfig()
    if (!config.enabled) {
      return res.status(200).json({ received: true, reason: 'payments_disabled' })
    }

    const body = req.body

    if (body?.type === 'payment.created' || body?.type === 'payment.updated') {
      const payment = body?.data || body
      const paymentStatus = payment?.status

      if (paymentStatus === 'paid') {
        const tenantId = payment?.metadata?.tenantId
        const demoEmail = payment?.metadata?.demoEmail
        const plan = payment?.metadata?.plan || 'professional'
        const billingCycle = payment?.metadata?.billingCycle || 'monthly'

        if (tenantId) {
          const now = new Date()
          const endDate = new Date(now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)

          await Tenant.findByIdAndUpdate(tenantId, {
            isDemo: false,
            demoUpgraded: true,
            'subscription.plan': plan,
            'subscription.status': 'active',
            'subscription.startDate': now,
            'subscription.endDate': endDate,
            'subscription.billingCycle': billingCycle,
            'subscription.price': Number(payment.amount) / 100,
          })

          if (demoEmail) {
            await DemoUser.findOneAndUpdate(
              { email: demoEmail },
              {
                isUpgraded: true,
                upgradedAt: now,
                paymentId: payment.id,
                amount: Number(payment.amount) / 100,
                currency: payment.currency,
                plan,
                billingCycle,
              }
            )
          }

          // Send upgrade welcome email
          const upgradedTenant = await Tenant.findById(tenantId).lean()
          sendUpgradeWelcomeEmail({
            email: demoEmail || upgradedTenant?.demoEmail || '',
            tenant: upgradedTenant,
            plan,
            billingCycle,
            amount: Number(payment.amount) / 100,
            currency: payment.currency,
          }).catch(() => {})
        }
      }
    }

    res.status(200).json({ received: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// @route   GET /api/payments/invoice/:id
// @desc    Fetch invoice status directly from Moyasar and apply tenant upgrade if paid
//          (fallback in case the invoice-webhook can't reach this server)
// @access  Private
router.get('/invoice/:id', protect, async (req, res) => {
  try {
    const config = await getMoyasarConfig()
    if (!config.enabled || !config.secretKey) {
      return res.status(400).json({ error: 'Payment gateway is not configured' })
    }

    const response = await fetch(`${MOYASAR_API_BASE}/v1/invoices/${req.params.id}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(config.secretKey.trim() + ':').toString('base64')}`,
      },
    })

    const invoice = await response.json()

    if (!response.ok) {
      return res.status(400).json({ error: invoice?.message || 'Failed to fetch invoice' })
    }

    if (invoice.status === 'paid') {
      await applyTenantUpgrade({
        tenantId: invoice?.metadata?.tenantId,
        demoEmail: invoice?.metadata?.demoEmail,
        plan: invoice?.metadata?.plan || 'professional',
        billingCycle: invoice?.metadata?.billingCycle || 'monthly',
        amountHalalas: invoice.amount,
        currency: invoice.currency,
        paymentId: invoice.id,
      })
    }

    res.json({ id: invoice.id, status: invoice.status })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// @route   GET /api/payments/tenant-status/:tenantId
// @desc    Check whether a tenant has been upgraded (used by the payment result page
//          for the invoice-based flow, since the invoice ID isn't returned to the browser)
// @access  Private
router.get('/tenant-status/:tenantId', protect, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.tenantId).select('isDemo demoUpgraded subscription').lean()
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' })
    }
    res.json({
      isDemo: tenant.isDemo,
      demoUpgraded: tenant.demoUpgraded === true,
      subscription: tenant.subscription,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// @route   GET /api/payments/:id
// @desc    Get payment status by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const config = await getMoyasarConfig()
    if (!config.enabled || !config.secretKey) {
      return res.status(400).json({ error: 'Payment gateway is not configured' })
    }

    const response = await fetch(`${MOYASAR_API_BASE}/v1/payments/${req.params.id}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(config.secretKey + ':').toString('base64')}`,
      },
    })

    const paymentData = await response.json()

    if (!response.ok) {
      return res.status(400).json({ error: paymentData?.message || 'Failed to fetch payment' })
    }

    if (paymentData.status === 'paid') {
      const tenantId = paymentData?.metadata?.tenantId
      const demoEmail = paymentData?.metadata?.demoEmail
      const plan = paymentData?.metadata?.plan || 'professional'
      const billingCycle = paymentData?.metadata?.billingCycle || 'monthly'

      if (tenantId) {
        const now = new Date()
        const endDate = new Date(now.getTime() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)

        await Tenant.findByIdAndUpdate(tenantId, {
          isDemo: false,
          demoUpgraded: true,
          'subscription.plan': plan,
          'subscription.status': 'active',
          'subscription.startDate': now,
          'subscription.endDate': endDate,
          'subscription.billingCycle': billingCycle,
          'subscription.price': Number(paymentData.amount) / 100,
        })

        if (demoEmail) {
          await DemoUser.findOneAndUpdate(
            { email: demoEmail },
            {
              isUpgraded: true,
              upgradedAt: now,
              paymentId: paymentData.id,
              amount: Number(paymentData.amount) / 100,
              currency: paymentData.currency,
              plan,
              billingCycle,
            }
          )
        }

        // Send upgrade welcome email
        const upgradedTenant = await Tenant.findById(tenantId).lean()
        sendUpgradeWelcomeEmail({
          email: demoEmail || upgradedTenant?.demoEmail || '',
          tenant: upgradedTenant,
          plan,
          billingCycle,
          amount: Number(paymentData.amount) / 100,
          currency: paymentData.currency,
        }).catch(() => {})
      }
    }

    res.json({
      id: paymentData.id,
      status: paymentData.status,
      amount: Number(paymentData.amount) / 100,
      currency: paymentData.currency,
      source: paymentData.source,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
