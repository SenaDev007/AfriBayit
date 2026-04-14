'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
    const { t } = useLanguage()
    const { login, isLoading } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    })

    // Clear password field on mount to prevent auto-fill
    useEffect(() => {
        setFormData(prev => ({ ...prev, password: '' }))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        // Basic validation
        if (!formData.email || !formData.password) {
            setError('Veuillez saisir votre email et mot de passe')
            return
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            setError('L\'adresse email n\'est pas valide. Veuillez vérifier votre saisie.')
            return
        }

        console.log('Form data being submitted:', formData)
        console.log('Email:', formData.email)
        console.log('Password:', formData.password)

        try {
            await login(formData.email, formData.password, formData.rememberMe)
            // Navigation is handled by the AuthProvider
        } catch (error: any) {
            console.error('Login form error:', error)

            // Handle specific error cases with intelligent guidance
            if (error.message.includes('Identifiants invalides') || error.message.includes('invalid credentials')) {
                setError('Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un nouveau compte.')
                setShowErrorModal(true)
            } else if (error.message.includes('compte') && error.message.includes('existe pas')) {
                setError('Aucun compte trouvé avec cet email. Créez un nouveau compte pour commencer.')
                setShowErrorModal(true)
            } else if (error.message.includes('compte') && error.message.includes('désactivé')) {
                setError('Votre compte a été désactivé. Contactez le support pour plus d\'informations.')
                setShowErrorModal(true)
            } else if (error.message.includes('email') && error.message.includes('vérifié')) {
                setError('Veuillez vérifier votre email avant de vous connecter. Vérifiez votre boîte de réception.')
                setShowErrorModal(true)
            } else if (error.message.includes('trop') && error.message.includes('tentatives')) {
                setError('Trop de tentatives de connexion. Attendez quelques minutes avant de réessayer.')
                setShowErrorModal(true)
            } else {
                setError(error.message || 'Une erreur est survenue lors de la connexion. Veuillez réessayer.')
                setShowErrorModal(true)
            }
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <Link href="/" className="inline-block mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl flex items-center justify-center mx-auto">
                            <span className="text-2xl font-bold text-white">A</span>
                        </div>
                    </Link>

                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                        {t('nav.login')}
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-300">
                        Connectez-vous à votre compte AfriBayit
                    </p>

                </motion.div>

                {/* Login Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-green-600 dark:text-green-400 text-sm font-medium">{success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Adresse email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                    placeholder="votre@email.com"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Mot de passe
                            </label>
                            <div className="relative password-field">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-12 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    data-form-type="other"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 z-10"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.rememberMe}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
                                    className="w-4 h-4 text-primary-600 bg-neutral-100 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 rounded focus:ring-primary-500 dark:focus:ring-primary-400"
                                />
                                <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-300">
                                    Se souvenir de moi
                                </span>
                            </label>
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-200"
                            >
                                Mot de passe oublié ?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-center text-sm text-neutral-600 dark:text-neutral-300">
                            Pas encore de compte ?{' '}
                            <Link
                                href="/auth/register"
                                className="text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 font-medium"
                            >
                                Créer un compte
                            </Link>
                        </p>
                    </div>
                </motion.div>

                {/* Back to Home */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center mt-6"
                >
                    <Link
                        href="/"
                        className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    >
                        ← Retour à l'accueil
                    </Link>
                </motion.div>
            </div>

            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                Erreur de connexion
                            </h3>

                            <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                                {error}
                            </p>

                            <div className="flex flex-col space-y-3">
                                {(error.includes('incorrect') || error.includes('existe pas')) && (
                                    <Link
                                        href="/auth/register"
                                        className="w-full px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                        onClick={() => setShowErrorModal(false)}
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Créer un nouveau compte
                                    </Link>
                                )}

                                <button
                                    onClick={() => {
                                        setShowErrorModal(false)
                                        setError('')
                                        setFormData(prev => ({ ...prev, password: '' }))
                                    }}
                                    className="w-full px-4 py-2 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Réessayer
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
