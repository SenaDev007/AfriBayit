'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Mail, Shield, CheckCircle, AlertCircle, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Step = 'email' | 'verification' | 'password' | 'success'

export default function ForgotPasswordPage() {
    const [currentStep, setCurrentStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [showPasswordReuseModal, setShowPasswordReuseModal] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [canResend, setCanResend] = useState(false)
    // Password strength state (mirror register page UX)
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        feedback: ''
    })

    // Password validator (same rules as registration)
    const validatePassword = (password: string) => {
        const minLength = 12
        const hasUpperCase = /[A-Z]/.test(password)
        const hasLowerCase = /[a-z]/.test(password)
        const hasNumber = /\d/.test(password)
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        const hasSpace = /\s/.test(password)

        let score = 0
        let feedback = ''

        if (password.length < minLength) {
            feedback = `Le mot de passe doit contenir au moins ${minLength} caractères.`
            return { score: 0, feedback }
        }

        if (hasSpace) {
            feedback = "Le mot de passe ne doit pas contenir d'espaces."
            return { score: 0, feedback }
        }

        if (!hasUpperCase) {
            feedback = 'Le mot de passe doit contenir au moins une lettre majuscule.'
            return { score: 0, feedback }
        }

        if (!hasLowerCase) {
            feedback = 'Le mot de passe doit contenir au moins une lettre minuscule.'
            return { score: 0, feedback }
        }

        if (hasUpperCase) score++
        if (hasLowerCase) score++
        if (hasNumber) score++
        if (hasSpecialChar) score++

        if (score === 4) {
            feedback = 'Mot de passe très fort !'
        } else if (score === 3) {
            feedback = 'Mot de passe fort. Ajoutez des caractères spéciaux pour plus de sécurité.'
        } else if (score === 2) {
            feedback = 'Mot de passe moyen. Ajoutez des chiffres et des caractères spéciaux.'
        } else if (score === 1) {
            feedback = 'Mot de passe faible. Ajoutez des chiffres et des caractères spéciaux.'
        } else {
            feedback = 'Mot de passe très faible. Ajoutez des majuscules, minuscules, chiffres et caractères spéciaux.'
        }

        return { score, feedback }
    }

    const steps = [
        { id: 'email', title: 'Email', description: 'Vérifiez votre email' },
        { id: 'verification', title: 'Code', description: 'Entrez le code' },
        { id: 'password', title: 'Nouveau mot de passe', description: 'Créez un nouveau mot de passe' }
    ]

    // Countdown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1)
            }, 1000)
            return () => clearTimeout(timer)
        } else if (resendCooldown === 0 && currentStep === 'verification') {
            setCanResend(true)
            // Clear success message when countdown finishes
            setSuccess('')
        }
    }, [resendCooldown, currentStep])

    // Clear errors when moving to password step
    useEffect(() => {
        if (currentStep === 'password') {
            setError('')
        }
    }, [currentStep])

    // On password step, auto-hide success message after 5 seconds
    useEffect(() => {
        if (currentStep === 'password' && success) {
            const timer = setTimeout(() => {
                setSuccess('')
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [currentStep, success])

    // Success message persists; it will be cleared when countdown finishes (see above)

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/forgot-password/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de la vérification de l\'email')
            }

            // Ensure exactly 2 seconds loading time
            await new Promise(resolve => setTimeout(resolve, 2000))

            setCurrentStep('verification')
            setResendCooldown(180) // 3 minutes
            setCanResend(false)
            setSuccess('Code de vérification envoyé à votre email !')
        } catch (error: any) {
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerificationSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/forgot-password/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: verificationCode })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Code de vérification invalide')
            }

            setCurrentStep('password')
            setSuccess('Code vérifié avec succès !')
            setError('') // Clear any previous errors
        } catch (error: any) {
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendCode = async () => {
        if (!canResend) return

        setError('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/forgot-password/resend-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de l\'envoi du code')
            }

            setResendCooldown(180) // Reset to 3 minutes
            setCanResend(false)
            setSuccess('Nouveau code envoyé à votre email !')
        } catch (error: any) {
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Client-side rules identical to register
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return
        }

        // Enforce strength rules
        if (newPassword.length < 12) { setError('Le mot de passe doit contenir au moins 12 caractères'); return }
        if (!/[A-Z]/.test(newPassword)) { setError('Le mot de passe doit contenir au moins une lettre majuscule'); return }
        if (!/[a-z]/.test(newPassword)) { setError('Le mot de passe doit contenir au moins une lettre minuscule'); return }
        if (!/\d/.test(newPassword)) { setError('Le mot de passe doit contenir au moins un chiffre'); return }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) { setError('Le mot de passe doit contenir au moins un caractère spécial'); return }
        if (/\s/.test(newPassword)) { setError("Le mot de passe ne doit pas contenir d'espaces"); return }

        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/forgot-password/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: verificationCode, newPassword })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de la réinitialisation du mot de passe')
            }

            setShowSuccessModal(true)
            setSuccess('Mot de passe réinitialisé avec succès !')
        } catch (error: any) {
            // Check if it's a password reuse error
            if (error.message.includes('réutiliser') || error.message.includes('reuse')) {
                setShowPasswordReuseModal(true)
                setError('')
            } else {
                setError(error.message)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const getStepContent = () => {
        switch (currentStep) {
            case 'email':
                return (
                    <form onSubmit={handleEmailSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Adresse email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        const value = e.target.value
                                        setEmail(value)
                                        if (value.trim() === '' || error) {
                                            setError('')
                                            setSuccess('')
                                        }
                                    }}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                    placeholder="votre@email.com"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                            Vérifier l'email
                        </Button>
                    </form>
                )

            case 'verification':
                return (
                    <form onSubmit={handleVerificationSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4 text-center">
                                Code de vérification à 6 chiffres
                            </label>

                            {/* 6 individual input boxes */}
                            <div className="flex justify-center space-x-3 mb-4">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]"
                                        maxLength={1}
                                        value={verificationCode[index] || ''}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '')
                                            if (value.length <= 1) {
                                                const newCode = verificationCode.split('')
                                                newCode[index] = value
                                                setVerificationCode(newCode.join(''))

                                                // Clear success and error messages when user starts typing the code
                                                if (value) {
                                                    setSuccess('')
                                                    setError('')
                                                } else {
                                                    // Clear error when user clears the box
                                                    setError('')
                                                }

                                                // Auto-focus next input
                                                if (value && index < 5) {
                                                    const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement
                                                    nextInput?.focus()
                                                }
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            // Handle backspace to go to previous input
                                            if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                                                const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement
                                                prevInput?.focus()
                                            }
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault()
                                            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
                                            setVerificationCode(pastedData)

                                            if (pastedData.length > 0) {
                                                setSuccess('')
                                                setError('')
                                            } else {
                                                // Clear error when pasting empty data
                                                setError('')
                                            }

                                            // Focus the last filled input or the next empty one
                                            const lastIndex = Math.min(pastedData.length - 1, 5)
                                            const nextInput = document.querySelector(`input[data-index="${lastIndex}"]`) as HTMLInputElement
                                            nextInput?.focus()
                                        }}
                                        data-index={index}
                                        className="w-12 h-12 text-center text-xl font-semibold border-2 border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400 transition-colors"
                                    />
                                ))}
                            </div>

                        </div>

                        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                            Vérifier le code
                        </Button>

                        <div className="flex items-center justify-between mt-4">
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                Code non reçu?
                            </span>

                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={!canResend || isLoading}
                                className={`text-sm font-medium transition-colors ${canResend
                                    ? 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300'
                                    : 'text-neutral-400 cursor-not-allowed dark:text-neutral-500'
                                    }`}
                            >
                                {canResend ? (
                                    'Renvoyer'
                                ) : (
                                    `Renvoyer dans ${Math.floor(resendCooldown / 60)}:${(resendCooldown % 60).toString().padStart(2, '0')}`
                                )}
                            </button>
                        </div>
                    </form>
                )

            case 'password':
                return (
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value)
                                        if (error) setError('')
                                        const res = validatePassword(e.target.value)
                                        setPasswordStrength(res)
                                    }}
                                    autoComplete="new-password"
                                    required
                                    className="w-full pl-10 pr-12 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {newPassword && (
                                <div className="mt-2">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.score === 4 ? 'bg-green-500' :
                                                    passwordStrength.score === 3 ? 'bg-yellow-500' :
                                                        passwordStrength.score === 2 ? 'bg-orange-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                                            />
                                        </div>
                                        <span className={`text-xs font-medium ${passwordStrength.score === 4 ? 'text-green-600 dark:text-green-400' :
                                            passwordStrength.score === 3 ? 'text-yellow-600 dark:text-yellow-400' :
                                                passwordStrength.score === 2 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {passwordStrength.score === 4 ? 'Très fort' :
                                                passwordStrength.score === 3 ? 'Fort' :
                                                    passwordStrength.score === 2 ? 'Moyen' : 'Faible'}
                                        </span>
                                    </div>
                                    <p className={`text-xs ${passwordStrength.score >= 2 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {passwordStrength.feedback}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value)
                                        if (error) setError('')
                                    }}
                                    autoComplete="new-password"
                                    required
                                    className="w-full pl-10 pr-12 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" size="lg" loading={isLoading}>
                            Réinitialiser le mot de passe
                        </Button>
                    </form>
                )


            default:
                return null
        }
    }

    const getStepTitle = () => {
        switch (currentStep) {
            case 'email':
                return 'Vérification de l\'email'
            case 'verification':
                return 'Code de vérification'
            case 'password':
                return 'Nouveau mot de passe'
            default:
                return ''
        }
    }

    const getStepDescription = () => {
        switch (currentStep) {
            case 'email':
                return 'Entrez l\'adresse email associée à votre compte. Nous vous enverrons un code de vérification.'
            case 'verification':
                return `Entrez le code à 6 chiffres que nous avons envoyé à ${email}.`
            case 'password':
                return 'Créez un nouveau mot de passe sécurisé pour votre compte.'
            default:
                return ''
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center py-4 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <Link href="/auth/login" className="inline-block mb-6">
                        <ArrowLeft className="w-6 h-6 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100" />
                    </Link>

                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                        Réinitialisation de mot de passe
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-300">
                        Suivez les étapes pour réinitialiser votre mot de passe en toute sécurité
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const stepIndex = steps.findIndex(s => s.id === currentStep)
                            const isCompleted = index < stepIndex
                            const isCurrent = index === stepIndex

                            return (
                                <div key={step.id} className="flex items-center">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isCompleted
                                            ? 'bg-green-500 text-white'
                                            : isCurrent
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                                            }`}
                                    >
                                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`w-16 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-neutral-200 dark:bg-neutral-700'
                                                }`}
                                        />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 sm:p-8"
                >
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            {currentStep === 'email' && <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
                            {currentStep === 'verification' && <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
                            {currentStep === 'password' && <Lock className="w-6 h-6 text-primary-600 dark:text-primary-400" />}
                            {currentStep === 'success' && <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />}
                        </div>
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                            {getStepTitle()}
                        </h2>
                        <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                            {getStepDescription()}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Success Message - only show for non-success steps */}
                    {success && currentStep !== 'success' && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
                            </div>
                        </div>
                    )}

                    {getStepContent()}

                    {/* Registration Link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="text-center mt-6"
                    >
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Pas encore de compte ?{' '}
                            <Link
                                href="/auth/register"
                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors duration-200"
                            >
                                Créer un compte
                            </Link>
                        </p>
                    </motion.div>
                </motion.div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>

                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                Mot de passe réinitialisé !
                            </h3>

                            <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                                Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.
                            </p>

                            <Link href="/auth/login">
                                <Button className="w-full" size="lg" onClick={() => setShowSuccessModal(false)}>
                                    Se connecter
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Password Reuse Warning Modal */}
            {showPasswordReuseModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                Mot de passe déjà utilisé
                            </h3>

                            <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                                Vous ne pouvez pas réutiliser un mot de passe que vous avez déjà utilisé précédemment. Choisissez un nouveau mot de passe unique pour votre sécurité.
                            </p>

                            <button
                                onClick={() => setShowPasswordReuseModal(false)}
                                className="w-full px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200"
                            >
                                Compris
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}