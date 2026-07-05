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

// @route   POST /api/payments/create-payment
// @desc    Create a Moyasar payment intent for demo user upgrade
// @access  Private (demo users only)
router.post('/create-payment', protect, async (req, res) => {
  try {
    const { amount, currency = 'SAR', plan = 'professional', billingCycle = 'monthly' } = req.body

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

    const finalAmount = Math.round(Number(amount) * 100)

    const callbackUrl = `${req.protocol}://${req.get('host')}/api/payments/callback`

    const response = await fetch(`${MOYASAR_API_BASE}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(config.secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        amount: finalAmount,
        currency,
        description: `Maqder ERP - ${plan} plan (${billingCycle}) upgrade for ${tenant.demoEmail || tenant.name}`,
        callback_url: callbackUrl,
        source: {
          type: 'creditcard',
        },
        metadata: {
          tenantId: String(tenant._id),
          demoEmail: tenant.demoEmail || '',
          plan,
          billingCycle,
        },
      }),
    })

    const paymentData = await response.json()

    if (!response.ok) {
      return res.status(400).json({ error: paymentData?.message || 'Failed to create payment' })
    }

    res.json({
      id: paymentData.id,
      status: paymentData.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      source: paymentData.source,
      callbackUrl,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// @route   GET /api/payments/callback
// @desc    Moyasar payment callback - redirect to frontend
// @access  Public
router.get('/callback', async (req, res) => {
  const { id, status, tenantId } = req.query
  const frontendUrl = process.env.FRONTEND_URL || 'https://maqder.com'
  res.redirect(`${frontendUrl}/payment-result?id=${id}&status=${status}&tenantId=${tenantId || ''}`)
})

// @route   POST /api/payments/webhook
// @desc    Moyasar webhook handler
// @access  Public (verified by webhook secret)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const config = await getMoyasarConfig()
    if (!config.enabled) {
      return res.status(200).json({ received: true, reason: 'payments_disabled' })
    }

    const body = JSON.parse(req.body.toString())

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
