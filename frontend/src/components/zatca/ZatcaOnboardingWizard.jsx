import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ArrowRight, ArrowLeft, Check, Loader2, KeyRound, Upload,
  FileText, ShieldCheck, AlertCircle, Copy, CheckCheck,
} from 'lucide-react'
import api from '../../lib/api'

const STEPS = [
  { id: 0, title: 'Generate Keys', icon: KeyRound },
  { id: 1, title: 'Create CSR', icon: FileText },
  { id: 2, title: 'Upload Certificate', icon: Upload },
  { id: 3, title: 'Verify & Complete', icon: ShieldCheck },
]

export default function ZatcaOnboardingWizard({ tenantId, tenantName, onClose, onComplete }) {
  const [step, setStep] = useState(0)
  const [csrData, setCsrData] = useState(null)
  const [csrForm, setCsrForm] = useState({
    commonName: tenantName || '',
    organization: tenantName || '',
    organizationalUnit: '',
    country: 'SA',
    locality: 'Riyadh',
    state: 'Riyadh',
  })
  const [certInput, setCertInput] = useState('')
  const [csidInput, setCsidInput] = useState('')
  const [environment, setEnvironment] = useState('production')
  const [copied, setCopied] = useState('')
  const queryClient = useQueryClient()

  const generateCsrMutation = useMutation({
    mutationFn: (data) => api.post(`/super-admin/zatca/tenant/${tenantId}/generate-csr`, data).then(res => res.data),
    onSuccess: (data) => {
      setCsrData(data)
      setStep(1)
    },
  })

  const uploadCertMutation = useMutation({
    mutationFn: (data) => api.post(`/super-admin/zatca/tenant/${tenantId}/upload-certificate`, data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zatca-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['zatca-stats'] })
      setStep(3)
    },
  })

  const handleCopy = (field, value) => {
    navigator.clipboard.writeText(value)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  const canProceedFromStep0 = Boolean(csrForm.commonName)
  const canProceedFromStep2 = Boolean(certInput)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">ZATCA Phase 2 Onboarding</h3>
              <p className="text-xs text-gray-500">{tenantName}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200 dark:border-dark-700">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className={`flex items-center gap-2 ${isActive ? 'text-primary-600' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : isDone ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-dark-600'}`}>
                      {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-primary-600' : isDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-dark-600'}`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Generate Keys */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Step 1: Generate Key Pair & CSR</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Fill in the organization details. An ECDSA secp256k1 key pair will be generated server-side.
                      The private key never leaves the server.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Common Name (CN) *</label>
                      <input
                        value={csrForm.commonName}
                        onChange={(e) => setCsrForm({ ...csrForm, commonName: e.target.value })}
                        className="input"
                        placeholder="e.g. 300000000000003"
                      />
                    </div>
                    <div>
                      <label className="label">Organization (O)</label>
                      <input
                        value={csrForm.organization}
                        onChange={(e) => setCsrForm({ ...csrForm, organization: e.target.value })}
                        className="input"
                        placeholder="Company Name"
                      />
                    </div>
                    <div>
                      <label className="label">Organizational Unit (OU)</label>
                      <input
                        value={csrForm.organizationalUnit}
                        onChange={(e) => setCsrForm({ ...csrForm, organizationalUnit: e.target.value })}
                        className="input"
                        placeholder="e.g. IT Department"
                      />
                    </div>
                    <div>
                      <label className="label">Country</label>
                      <input
                        value={csrForm.country}
                        onChange={(e) => setCsrForm({ ...csrForm, country: e.target.value })}
                        className="input"
                        placeholder="SA"
                      />
                    </div>
                    <div>
                      <label className="label">Locality (L)</label>
                      <input
                        value={csrForm.locality}
                        onChange={(e) => setCsrForm({ ...csrForm, locality: e.target.value })}
                        className="input"
                        placeholder="Riyadh"
                      />
                    </div>
                    <div>
                      <label className="label">State (ST)</label>
                      <input
                        value={csrForm.state}
                        onChange={(e) => setCsrForm({ ...csrForm, state: e.target.value })}
                        className="input"
                        placeholder="Riyadh Province"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: CSR Result */}
              {step === 1 && csrData && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Step 2: Submit CSR to ZATCA</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Copy the CSR below and submit it to the ZATCA Fatoora portal to get your compliance certificate.
                      Once you receive the certificate, proceed to the next step.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label">Certificate Signing Request (CSR)</label>
                      <button onClick={() => handleCopy('csr', csrData.csr)} className="btn btn-secondary btn-sm flex items-center gap-1">
                        {copied === 'csr' ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copied === 'csr' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <textarea readOnly value={csrData.csr} className="input font-mono text-xs" rows={6} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="label">Public Key</label>
                      <button onClick={() => handleCopy('pubkey', csrData.publicKey)} className="btn btn-secondary btn-sm flex items-center gap-1">
                        {copied === 'pubkey' ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copied === 'pubkey' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <textarea readOnly value={csrData.publicKey} className="input font-mono text-xs" rows={4} />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        The private key has been stored securely on the server. Do NOT share it.
                        After receiving the certificate from ZATCA, proceed to upload it.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Upload Certificate */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Step 3: Upload ZATCA Certificate</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Paste the X.509 certificate issued by ZATCA and the CSID (base64 encoded credential).
                    </p>
                  </div>

                  <div>
                    <label className="label">Environment</label>
                    <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className="select">
                      <option value="production">Production</option>
                      <option value="compliance">Compliance (Sandbox)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">X.509 Certificate (PEM) *</label>
                    <textarea
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      className="input font-mono text-xs"
                      rows={6}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                    />
                  </div>

                  <div>
                    <label className="label">CSID (Base64)</label>
                    <textarea
                      value={csidInput}
                      onChange={(e) => setCsidInput(e.target.value)}
                      className="input font-mono text-xs"
                      rows={3}
                      placeholder="Base64 encoded CSID from ZATCA"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Complete */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Onboarding Complete!</h4>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    The tenant is now onboarded for ZATCA Phase 2. The certificate has been stored and parsed.
                    Invoices can now be submitted for clearance/reporting.
                  </p>
                  {uploadCertMutation.data?.certificateInfo && (
                    <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-dark-900/50 text-left max-w-sm mx-auto">
                      <p className="text-xs text-gray-500 mb-2">Certificate Details:</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Valid From</span>
                          <span className="text-gray-700 dark:text-gray-300">{new Date(uploadCertMutation.data.certificateInfo.validFrom).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Valid To</span>
                          <span className="text-gray-700 dark:text-gray-300">{new Date(uploadCertMutation.data.certificateInfo.validTo).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Days Left</span>
                          <span className={`font-medium ${uploadCertMutation.data.certificateInfo.daysUntilExpiry < 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {uploadCertMutation.data.certificateInfo.daysUntilExpiry} days
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-dark-700">
            <button
              onClick={() => step > 0 && step < 3 && setStep(step - 1)}
              disabled={step === 0 || step === 3}
              className="btn btn-secondary flex items-center gap-1.5 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              {step === 3 ? (
                <button onClick={onComplete || onClose} className="btn btn-action-dark flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Done
                </button>
              ) : step === 0 ? (
                <button
                  onClick={() => generateCsrMutation.mutate(csrForm)}
                  disabled={!canProceedFromStep0 || generateCsrMutation.isPending}
                  className="btn btn-action-dark flex items-center gap-1.5"
                >
                  {generateCsrMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  Generate Keys & CSR
                </button>
              ) : step === 1 ? (
                <button onClick={() => setStep(2)} className="btn btn-action-dark flex items-center gap-1.5">
                  I have the certificate
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : step === 2 ? (
                <button
                  onClick={() => uploadCertMutation.mutate({ certificate: certInput, csid: csidInput, environment })}
                  disabled={!canProceedFromStep2 || uploadCertMutation.isPending}
                  className="btn btn-action-dark flex items-center gap-1.5"
                >
                  {uploadCertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Certificate
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
