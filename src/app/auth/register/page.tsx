'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle, AlertCircle, Phone, Globe, Shield, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/components/providers/AuthProvider'

interface Country {
    code: string
    name: string
    flag: string
    phoneCode: string
    phonePattern: RegExp
}

const africanCountries: Country[] = [
    { code: 'DZ', name: 'Algérie', flag: '🇩🇿', phoneCode: '+213', phonePattern: /^(\+213|0)[5-7][0-9]{8}$/ },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', phoneCode: '+244', phonePattern: /^(\+244|0)[9][1-9][0-9]{7}$/ },
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯', phoneCode: '+229', phonePattern: /^(\+229\s?01[0-9]{8}|01[0-9]{8})$/ },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼', phoneCode: '+267', phonePattern: /^(\+267|0)[7][0-9]{7}$/ },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', phoneCode: '+226', phonePattern: /^(\+226|0)[6-7][0-9]{7}$/ },
    { code: 'BI', name: 'Burundi', flag: '🇧🇮', phoneCode: '+257', phonePattern: /^(\+257|0)[6-7][0-9]{7}$/ },
    { code: 'CM', name: 'Cameroun', flag: '🇨🇲', phoneCode: '+237', phonePattern: /^(\+237|0)[6-7][0-9]{8}$/ },
    { code: 'CV', name: 'Cap-Vert', flag: '🇨🇻', phoneCode: '+238', phonePattern: /^(\+238|0)[9][0-9]{7}$/ },
    { code: 'CF', name: 'République centrafricaine', flag: '🇨🇫', phoneCode: '+236', phonePattern: /^(\+236|0)[6-7][0-9]{7}$/ },
    { code: 'TD', name: 'Tchad', flag: '🇹🇩', phoneCode: '+235', phonePattern: /^(\+235|0)[6-7][0-9]{7}$/ },
    { code: 'KM', name: 'Comores', flag: '🇰🇲', phoneCode: '+269', phonePattern: /^(\+269|0)[3][0-9]{7}$/ },
    { code: 'CG', name: 'République du Congo', flag: '🇨🇬', phoneCode: '+242', phonePattern: /^(\+242|0)[6-7][0-9]{7}$/ },
    { code: 'CD', name: 'République démocratique du Congo', flag: '🇨🇩', phoneCode: '+243', phonePattern: /^(\+243|0)[8-9][0-9]{8}$/ },
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', phoneCode: '+225', phonePattern: /^(\+225|0)[6-7][0-9]{7}$/ },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', phoneCode: '+253', phonePattern: /^(\+253|0)[7][0-9]{7}$/ },
    { code: 'EG', name: 'Égypte', flag: '🇪🇬', phoneCode: '+20', phonePattern: /^(\+20|0)[1][0-9]{9}$/ },
    { code: 'GQ', name: 'Guinée équatoriale', flag: '🇬🇶', phoneCode: '+240', phonePattern: /^(\+240|0)[2][0-9]{7}$/ },
    { code: 'ER', name: 'Érythrée', flag: '🇪🇷', phoneCode: '+291', phonePattern: /^(\+291|0)[7][0-9]{7}$/ },
    { code: 'ET', name: 'Éthiopie', flag: '🇪🇹', phoneCode: '+251', phonePattern: /^(\+251|0)[9][0-9]{8}$/ },
    { code: 'GA', name: 'Gabon', flag: '🇬🇦', phoneCode: '+241', phonePattern: /^(\+241|0)[6-7][0-9]{7}$/ },
    { code: 'GM', name: 'Gambie', flag: '🇬🇲', phoneCode: '+220', phonePattern: /^(\+220|0)[7][0-9]{7}$/ },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', phoneCode: '+233', phonePattern: /^(\+233|0)[2-5][0-9]{8}$/ },
    { code: 'GN', name: 'Guinée', flag: '🇬🇳', phoneCode: '+224', phonePattern: /^(\+224|0)[6-7][0-9]{7}$/ },
    { code: 'GW', name: 'Guinée-Bissau', flag: '🇬🇼', phoneCode: '+245', phonePattern: /^(\+245|0)[9][0-9]{7}$/ },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', phoneCode: '+254', phonePattern: /^(\+254|0)[7][0-9]{8}$/ },
    { code: 'LS', name: 'Lesotho', flag: '🇱🇸', phoneCode: '+266', phonePattern: /^(\+266|0)[5-6][0-9]{7}$/ },
    { code: 'LR', name: 'Libéria', flag: '🇱🇷', phoneCode: '+231', phonePattern: /^(\+231|0)[4-7][0-9]{7}$/ },
    { code: 'LY', name: 'Libye', flag: '🇱🇾', phoneCode: '+218', phonePattern: /^(\+218|0)[9][0-9]{8}$/ },
    { code: 'MG', name: 'Madagascar', flag: '🇲🇬', phoneCode: '+261', phonePattern: /^(\+261|0)[3][0-9]{8}$/ },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼', phoneCode: '+265', phonePattern: /^(\+265|0)[9][0-9]{8}$/ },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', phoneCode: '+223', phonePattern: /^(\+223|0)[6-7][0-9]{7}$/ },
    { code: 'MR', name: 'Mauritanie', flag: '🇲🇷', phoneCode: '+222', phonePattern: /^(\+222|0)[4-6][0-9]{7}$/ },
    { code: 'MU', name: 'Maurice', flag: '🇲🇺', phoneCode: '+230', phonePattern: /^(\+230|0)[5-7][0-9]{7}$/ },
    { code: 'MA', name: 'Maroc', flag: '🇲🇦', phoneCode: '+212', phonePattern: /^(\+212|0)[6-7][0-9]{8}$/ },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', phoneCode: '+258', phonePattern: /^(\+258|0)[8][0-9]{8}$/ },
    { code: 'NA', name: 'Namibie', flag: '🇳🇦', phoneCode: '+264', phonePattern: /^(\+264|0)[8][0-9]{8}$/ },
    { code: 'NE', name: 'Niger', flag: '🇳🇪', phoneCode: '+227', phonePattern: /^(\+227|0)[9][0-9]{7}$/ },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', phoneCode: '+234', phonePattern: /^(\+234|0)[8-9][0-9]{8}$/ },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', phoneCode: '+250', phonePattern: /^(\+250|0)[7][0-9]{8}$/ },
    { code: 'ST', name: 'Sao Tomé-et-Principe', flag: '🇸🇹', phoneCode: '+239', phonePattern: /^(\+239|0)[9][0-9]{7}$/ },
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', phoneCode: '+221', phonePattern: /^(\+221|0)[7][0-9]{8}$/ },
    { code: 'SC', name: 'Seychelles', flag: '🇸🇨', phoneCode: '+248', phonePattern: /^(\+248|0)[2][0-9]{6}$/ },
    { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', phoneCode: '+232', phonePattern: /^(\+232|0)[7][0-9]{7}$/ },
    { code: 'SO', name: 'Somalie', flag: '🇸🇴', phoneCode: '+252', phonePattern: /^(\+252|0)[6-7][0-9]{7}$/ },
    { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦', phoneCode: '+27', phonePattern: /^(\+27|0)[6-8][0-9]{8}$/ },
    { code: 'SS', name: 'Soudan du Sud', flag: '🇸🇸', phoneCode: '+211', phonePattern: /^(\+211|0)[9][0-9]{7}$/ },
    { code: 'SD', name: 'Soudan', flag: '🇸🇩', phoneCode: '+249', phonePattern: /^(\+249|0)[9][0-9]{8}$/ },
    { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', phoneCode: '+268', phonePattern: /^(\+268|0)[7][0-9]{7}$/ },
    { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿', phoneCode: '+255', phonePattern: /^(\+255|0)[6-7][0-9]{8}$/ },
    { code: 'TG', name: 'Togo', flag: '🇹🇬', phoneCode: '+228', phonePattern: /^(\+228|0)[9][0-9]{7}$/ },
    { code: 'TN', name: 'Tunisie', flag: '🇹🇳', phoneCode: '+216', phonePattern: /^(\+216|0)[2-5][0-9]{7}$/ },
    { code: 'UG', name: 'Ouganda', flag: '🇺🇬', phoneCode: '+256', phonePattern: /^(\+256|0)[7][0-9]{8}$/ },
    { code: 'ZM', name: 'Zambie', flag: '🇿🇲', phoneCode: '+260', phonePattern: /^(\+260|0)[9][0-9]{8}$/ },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', phoneCode: '+263', phonePattern: /^(\+263|0)[7][0-9]{8}$/ }
]

export default function RegisterPage() {
    const { t } = useLanguage()
    const { register, isLoading } = useAuth()
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        country: '',
        acceptTerms: false
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [showCountryDropdown, setShowCountryDropdown] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
    const [countrySearchQuery, setCountrySearchQuery] = useState('')
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        feedback: ''
    })

    // Password strength validation
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
            feedback = 'Le mot de passe ne doit pas contenir d\'espaces.'
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

    // Real-time validation
    useEffect(() => {
        const errors: Record<string, string> = {}

        // First name validation
        if (formData.firstName && !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.firstName)) {
            errors.firstName = 'Le prénom ne peut contenir que des lettres, des espaces, des apostrophes et des tirets.'
        }

        // Last name validation
        if (formData.lastName && !/^[a-zA-ZÀ-ÿ\s'-]+$/.test(formData.lastName)) {
            errors.lastName = 'Le nom de famille ne peut contenir que des lettres, des espaces, des apostrophes et des tirets.'
        }

        // Email validation
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'L\'adresse email n\'est pas valide. Exemple : votre.nom@exemple.com'
        }

        // Phone validation - only show errors when user has finished typing or number is clearly invalid
        if (formData.phone && selectedCountry) {
            const phoneDigits = formData.phone.replace(/\D/g, '') // Remove all non-digits
            const expectedLength = getMaxPhoneDigits(selectedCountry.code)

            // Special validation for Benin - check for "01" prefix
            if (selectedCountry.code === 'BJ') {
                // Extract digits after country code for Benin
                // The phone format is: +229 01 XX XX XX XX
                // We need to extract just the digits after +229
                const phoneWithoutCountryCode = formData.phone.replace(/^\+229\s?/, '') // Remove +229 and optional space
                const phoneDigitsAfterCountry = phoneWithoutCountryCode.replace(/\D/g, '') // Remove all non-digits

                // Only show error if user has entered enough digits to be clearly wrong
                if (phoneDigitsAfterCountry.length >= 2 && !phoneDigitsAfterCountry.startsWith('01')) {
                    errors.phone = `Le numéro de téléphone pour le Bénin doit commencer par "01". Format attendu : ${selectedCountry.phoneCode} 01 XX XX XX XX`
                } else if (phoneDigitsAfterCountry.length > expectedLength) {
                    errors.phone = `Le numéro de téléphone doit contenir exactement ${expectedLength} chiffres pour ${selectedCountry.name}. Format attendu : ${selectedCountry.phoneCode} 01 XX XX XX XX`
                } else if (phoneDigitsAfterCountry.length === expectedLength && !selectedCountry.phonePattern.test(formData.phone)) {
                    errors.phone = `Le numéro de téléphone n'est pas valide pour ${selectedCountry.name}. Format attendu : ${selectedCountry.phoneCode} 01 XX XX XX XX`
                }
            } else {
                // Regular validation for other countries - same intelligent behavior as Benin
                // Extract digits after country code for other countries
                // Remove country code and optional space, then extract digits
                const phoneWithoutCountryCode = formData.phone.replace(new RegExp(`^\\${selectedCountry.phoneCode}\\s?`), '') // Remove country code and optional space
                const phoneDigitsAfterCountry = phoneWithoutCountryCode.replace(/\D/g, '') // Remove all non-digits

                // Only show error if user has entered enough digits to be clearly wrong
                if (phoneDigitsAfterCountry.length > expectedLength) {
                    errors.phone = `Le numéro de téléphone doit contenir exactement ${expectedLength} chiffres pour ${selectedCountry.name}. Format attendu : ${selectedCountry.phoneCode} ${'X'.repeat(expectedLength).replace(/(.{2})/g, '$1 ').trim()}`
                } else if (phoneDigitsAfterCountry.length === expectedLength && !selectedCountry.phonePattern.test(formData.phone)) {
                    errors.phone = `Le numéro de téléphone n'est pas valide pour ${selectedCountry.name}. Format attendu : ${selectedCountry.phoneCode} ${'X'.repeat(expectedLength).replace(/(.{2})/g, '$1 ').trim()}`
                } else if (phoneDigitsAfterCountry.length < expectedLength && phoneDigitsAfterCountry.length > 0) {
                    // Show error if user has started typing but hasn't entered enough digits
                    errors.phone = `Le numéro de téléphone doit contenir exactement ${expectedLength} chiffres pour ${selectedCountry.name}. Format attendu : ${selectedCountry.phoneCode} ${'X'.repeat(expectedLength).replace(/(.{2})/g, '$1 ').trim()}`
                }
            }
        }

        // Password validation
        if (formData.password) {
            const passwordValidation = validatePassword(formData.password)
            setPasswordStrength(passwordValidation)
            // Don't set validationErrors.password since passwordStrength.feedback is already displayed
        }

        // Confirm password validation
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Les mots de passe ne correspondent pas. Veuillez saisir le même mot de passe.'
        }

        setValidationErrors(errors)
    }, [formData, selectedCountry])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        // Check for validation errors
        if (Object.keys(validationErrors).length > 0) {
            setError('Veuillez corriger les erreurs dans le formulaire.')
            return
        }

        // Check required fields
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || !formData.country || !formData.phone) {
            setError('Tous les champs sont obligatoires.')
            return
        }

        if (!formData.acceptTerms) {
            setError('Vous devez accepter les conditions d\'utilisation et la politique de confidentialité.')
            return
        }

        try {
            await register({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                country: formData.country,
                profileType: 'BUYER' // Default profile type
            })
        } catch (error: any) {
            console.error('Registration error:', error)

            if (error.message.includes('existe déjà') || error.message.includes('already exists')) {
                setError('Un compte avec cet email existe déjà. Vous pouvez vous connecter avec ces identifiants ou utiliser un autre email.')
                setShowErrorModal(true)
            } else if (error.message.includes('email') && error.message.includes('invalid')) {
                setError('L\'adresse email n\'est pas valide. Veuillez vérifier votre saisie.')
            } else if (error.message.includes('password') && error.message.includes('weak')) {
                setError('Le mot de passe est trop faible. Utilisez au moins 12 caractères avec des lettres, des chiffres et des caractères spéciaux.')
            } else {
                setError(error.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.')
            }
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target

        // Prevent numbers in first name and last name
        if ((name === 'firstName' || name === 'lastName') && /\d/.test(value)) {
            return // Don't update if contains numbers
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        })
    }

    const handleCountrySelect = (country: Country) => {
        setSelectedCountry(country)
        setFormData(prev => ({ ...prev, country: country.name }))
        setShowCountryDropdown(false)
        setCountrySearchQuery('')

        // Auto-format phone number with country code
        if (formData.phone && !formData.phone.startsWith(country.phoneCode)) {
            setFormData(prev => ({
                ...prev,
                phone: country.phoneCode + ' ' + formData.phone.replace(/^\+\d+\s?/, '')
            }))
        }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value
        const cursorPosition = e.target.selectionStart || 0

        // Only allow numbers, spaces, and + sign
        value = value.replace(/[^0-9+\s]/g, '')

        // Auto-add country code if not present
        if (selectedCountry && !value.startsWith(selectedCountry.phoneCode)) {
            if (value.startsWith('+')) {
                // Remove existing country code and add new one
                value = selectedCountry.phoneCode + ' ' + value.replace(/^\+\d+\s?/, '')
            } else if (value.startsWith('0')) {
                // Replace leading 0 with country code
                value = selectedCountry.phoneCode + ' ' + value.substring(1)
            } else {
                // Add country code
                value = selectedCountry.phoneCode + ' ' + value
            }
        }

        // Prevent deletion of the space between country code and phone number
        if (selectedCountry) {
            const countryCodeWithSpace = selectedCountry.phoneCode + ' '
            if (value.length < countryCodeWithSpace.length) {
                // If user tries to delete the space or country code, restore it
                value = countryCodeWithSpace
            } else if (value.length === countryCodeWithSpace.length && !value.endsWith(' ')) {
                // If user tries to delete just the space, restore it
                value = countryCodeWithSpace
            }
        }

        // Limit length based on country's phone number format
        if (selectedCountry) {
            const maxLength = selectedCountry.phoneCode.length + 1 + getMaxPhoneDigits(selectedCountry.code)
            if (value.length > maxLength) {
                value = value.substring(0, maxLength)
            }
        }

        setFormData(prev => ({ ...prev, phone: value }))

        // Set cursor position after the country code if user tries to position it within the country code
        setTimeout(() => {
            if (selectedCountry) {
                const countryCodeWithSpace = selectedCountry.phoneCode + ' '
                const minCursorPosition = countryCodeWithSpace.length

                if (cursorPosition < minCursorPosition) {
                    e.target.setSelectionRange(minCursorPosition, minCursorPosition)
                }
            }
        }, 0)
    }

    const handlePhoneClick = (e: React.MouseEvent<HTMLInputElement>) => {
        if (selectedCountry) {
            const countryCodeWithSpace = selectedCountry.phoneCode + ' '
            const minCursorPosition = countryCodeWithSpace.length

            // If user clicks within the country code area, move cursor to after the country code
            if (e.currentTarget.selectionStart && e.currentTarget.selectionStart < minCursorPosition) {
                e.currentTarget.setSelectionRange(minCursorPosition, minCursorPosition)
            }
        }
    }

    // Filter countries based on search query
    const filteredCountries = africanCountries.filter(country =>
        country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
    )

    // Note: Click-outside functionality removed as requested

    // Get maximum phone digits for each country
    const getMaxPhoneDigits = (countryCode: string) => {
        const phoneLengths: Record<string, number> = {
            'BJ': 10, // Benin: 01 XX XX XX XX (10 digits total including 01 prefix)
            'CI': 8,  // Côte d'Ivoire: +225 XX XX XX XX (8 digits after country code)
            'SN': 9,  // Senegal: +221 XXX XXX XXX (9 digits after country code)
            'ML': 8,  // Mali: +223 XX XX XX XX (8 digits after country code)
            'BF': 8,  // Burkina Faso: +226 XX XX XX XX (8 digits after country code)
            'NE': 8,  // Niger: +227 XX XX XX XX (8 digits after country code)
            'TG': 8,  // Togo: +228 XX XX XX XX (8 digits after country code)
            'GH': 9,  // Ghana: +233 XXX XXX XXX (9 digits after country code)
            'NG': 10, // Nigeria: +234 XXX XXX XXXX (10 digits after country code - mobile numbers)
            'KE': 9,  // Kenya: +254 XXX XXX XXX (9 digits after country code)
            'ZA': 9,  // South Africa: +27 XXX XXX XXX (9 digits after country code)
            'EG': 10, // Egypt: +20 XXX XXX XXXX (10 digits after country code)
            'MA': 9,  // Morocco: +212 XXX XXX XXX (9 digits after country code)
            'DZ': 9,  // Algeria: +213 XXX XXX XXX (9 digits after country code)
            'TN': 8,  // Tunisia: +216 XX XXX XXX (8 digits after country code)
            'LY': 9,  // Libya: +218 XXX XXX XXX (9 digits after country code)
            'SD': 9,  // Sudan: +249 XXX XXX XXX (9 digits after country code)
            'ET': 9,  // Ethiopia: +251 XXX XXX XXX (9 digits after country code)
            'UG': 9,  // Uganda: +256 XXX XXX XXX (9 digits after country code)
            'TZ': 9,  // Tanzania: +255 XXX XXX XXX (9 digits after country code)
            'RW': 9,  // Rwanda: +250 XXX XXX XXX (9 digits after country code)
            'MW': 9,  // Malawi: +265 XXX XXX XXX (9 digits after country code)
            'ZM': 9,  // Zambia: +260 XXX XXX XXX (9 digits after country code)
            'ZW': 9,  // Zimbabwe: +263 XXX XXX XXX (9 digits after country code)
            'BW': 8,  // Botswana: +267 XX XXX XXX (8 digits after country code)
            'NA': 9,  // Namibia: +264 XXX XXX XXX (9 digits after country code)
            'SZ': 8,  // Eswatini: +268 XX XXX XXX (8 digits after country code)
            'LS': 8,  // Lesotho: +266 XX XXX XXX (8 digits after country code)
            'MG': 9,  // Madagascar: +261 XXX XXX XXX (9 digits after country code)
            'MU': 8,  // Mauritius: +230 XX XXX XXX (8 digits after country code)
            'SC': 7,  // Seychelles: +248 XXX XXXX (7 digits after country code)
            'KM': 8,  // Comoros: +269 XX XXX XXX (8 digits after country code)
            'CV': 8,  // Cape Verde: +238 XXX XXX XXX (8 digits after country code)
            'ST': 8,  // São Tomé and Príncipe: +239 XX XXX XXX (8 digits after country code)
            'GQ': 8,  // Equatorial Guinea: +240 XX XXX XXX (8 digits after country code)
            'GA': 8,  // Gabon: +241 XX XXX XXX (8 digits after country code)
            'CG': 8,  // Republic of the Congo: +242 XX XXX XXX (8 digits after country code)
            'CD': 9,  // Democratic Republic of the Congo: +243 XXX XXX XXX (9 digits after country code)
            'AO': 9,  // Angola: +244 XXX XXX XXX (9 digits after country code)
            'GW': 8,  // Guinea-Bissau: +245 XX XXX XXX (8 digits after country code)
            'GN': 8,  // Guinea: +224 XX XXX XXX (8 digits after country code)
            'SL': 8,  // Sierra Leone: +232 XX XXX XXX (8 digits after country code)
            'LR': 8,  // Liberia: +231 XX XXX XXX (8 digits after country code)
            'GM': 8,  // Gambia: +220 XX XXX XXX (8 digits after country code)
            'DJ': 8,  // Djibouti: +253 XX XXX XXX (8 digits after country code)
            'SO': 8,  // Somalia: +252 XX XXX XXX (8 digits after country code)
            'ER': 8,  // Eritrea: +291 XX XXX XXX (8 digits after country code)
            'SS': 8,  // South Sudan: +211 XX XXX XXX (8 digits after country code)
            'CF': 8,  // Central African Republic: +236 XX XXX XXX (8 digits after country code)
            'TD': 8,  // Chad: +235 XX XXX XXX (8 digits after country code)
            'CM': 9,  // Cameroon: +237 XXX XXX XXX (9 digits after country code)
            'MZ': 9,  // Mozambique: +258 XXX XXX XXX (9 digits after country code)
        }

        return phoneLengths[countryCode] || 8 // Default to 8 digits if country not found
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center py-4 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl relative overflow-visible">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-6 sm:mb-8"
                >
                    <Link href="/" className="inline-block mb-4 sm:mb-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto">
                            <span className="text-lg sm:text-2xl font-bold text-white">A</span>
                        </div>
                    </Link>

                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 px-4">
                        Créer un compte
                    </h1>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 px-4 max-w-2xl mx-auto">
                        Rejoignez la communauté AfriBayit et découvrez les meilleures opportunités immobilières d'Afrique
                    </p>
                </motion.div>

                {/* Register Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        {/* Error Message */}
                        {error && !error.includes('existe déjà') && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                                <div className="flex items-start space-x-2 sm:space-x-3">
                                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium break-words">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {isLoading && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium">
                                            Compte créé avec succès ! Redirection en cours...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Name Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
                                    Prénom *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 ${validationErrors.firstName
                                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                                            : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 dark:focus:ring-primary-400'
                                            }`}
                                        placeholder="Jean"
                                    />
                                </div>
                                {validationErrors.firstName && (
                                    <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start">
                                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 mt-0.5 flex-shrink-0" />
                                        <span className="break-words">{validationErrors.firstName}</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Nom de famille *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 ${validationErrors.lastName
                                            ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                                            : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 dark:focus:ring-primary-400'
                                            }`}
                                        placeholder="Dupont"
                                    />
                                </div>
                                {validationErrors.lastName && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        {validationErrors.lastName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Adresse email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 ${validationErrors.email
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                                        : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 dark:focus:ring-primary-400'
                                        }`}
                                    placeholder="votre@email.com"
                                />
                            </div>
                            {validationErrors.email && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {validationErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Country Field */}
                        <div className="relative">
                            <label className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
                                Pays *
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                    className={`w-full pl-3 pr-8 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 text-left cursor-pointer ${validationErrors.country
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                                        : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 dark:focus:ring-primary-400'
                                        }`}
                                >
                                    <span className="flex items-center justify-between w-full">
                                        <span className="flex items-center">
                                            {selectedCountry ? (
                                                <>
                                                    <span className="text-base sm:text-lg mr-2 flag-emoji">{selectedCountry.flag}</span>
                                                    <span className="truncate">{selectedCountry.name}</span>
                                                    <span className="text-neutral-500 ml-2 text-xs sm:text-sm">({selectedCountry.phoneCode})</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-neutral-400" />
                                                    <span className="text-neutral-500">Sélectionnez votre pays</span>
                                                </>
                                            )}
                                        </span>
                                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 flex-shrink-0" />
                                    </span>
                                </button>
                            </div>

                            {showCountryDropdown && (
                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-48 sm:max-h-56 overflow-hidden max-w-full">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-neutral-200 dark:border-neutral-600">
                                        <input
                                            type="text"
                                            placeholder="Rechercher un pays..."
                                            value={countrySearchQuery}
                                            onChange={(e) => setCountrySearchQuery(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 min-w-0"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Countries List */}
                                    <div className="max-h-32 sm:max-h-40 overflow-y-auto">
                                        {filteredCountries.length > 0 ? (
                                            filteredCountries.map((country) => (
                                                <button
                                                    key={country.code}
                                                    type="button"
                                                    onClick={() => handleCountrySelect(country)}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-600 flex items-center space-x-2 sm:space-x-3 text-sm sm:text-base min-w-0"
                                                >
                                                    <span className="text-base sm:text-lg flag-emoji flex-shrink-0">{country.flag}</span>
                                                    <span className="text-neutral-900 dark:text-neutral-100 truncate flex-1 min-w-0">{country.name}</span>
                                                    <span className="text-neutral-500 text-xs sm:text-sm flex-shrink-0">({country.phoneCode})</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                                                Aucun pays trouvé
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Phone Field */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 sm:mb-2">
                                Numéro WhatsApp *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    onClick={handlePhoneClick}
                                    required
                                    maxLength={selectedCountry ? selectedCountry.phoneCode.length + 1 + getMaxPhoneDigits(selectedCountry.code) : 20}
                                    className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 ${validationErrors.phone
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                                        : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 dark:focus:ring-primary-400'
                                        }`}
                                    placeholder={selectedCountry ? `${selectedCountry.phoneCode} ${'X'.repeat(getMaxPhoneDigits(selectedCountry.code)).replace(/(.{2})/g, '$1 ').trim()}` : "Sélectionnez d'abord votre pays"}
                                    disabled={!selectedCountry}
                                />
                            </div>
                            {validationErrors.phone && (
                                <p className="mt-1 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start">
                                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 mt-0.5 flex-shrink-0" />
                                    <span className="break-words">{validationErrors.phone}</span>
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Mot de passe *
                            </label>
                            <div className="relative password-field">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className={`w-full pl-10 pr-12 py-3 border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 ${validationErrors.password
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                                        : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 dark:focus:ring-primary-400'
                                        }`}
                                    placeholder="••••••••••••"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 z-10"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.password && (
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
                                    <p className={`text-xs ${passwordStrength.score >= 2 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {passwordStrength.feedback}
                                    </p>
                                </div>
                            )}

                            {validationErrors.password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {validationErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Confirmer le mot de passe *
                            </label>
                            <div className="relative password-field">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className={`w-full pl-10 pr-12 py-3 border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 ${validationErrors.confirmPassword
                                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                                        : 'border-neutral-300 dark:border-neutral-600 focus:ring-primary-500 dark:focus:ring-primary-400'
                                        }`}
                                    placeholder="••••••••••••"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 z-10"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {validationErrors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {validationErrors.confirmPassword}
                                </p>
                            )}
                        </div>

                        {/* Terms and Conditions */}
                        <div>
                            <label className="flex items-start">
                                <input
                                    type="checkbox"
                                    name="acceptTerms"
                                    checked={formData.acceptTerms}
                                    onChange={handleChange}
                                    required
                                    className="w-4 h-4 text-primary-600 bg-neutral-100 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600 rounded focus:ring-primary-500 dark:focus:ring-primary-400 mt-1"
                                />
                                <span className="ml-3 text-sm text-neutral-600 dark:text-neutral-300">
                                    J'accepte les{' '}
                                    <Link href="/terms" className="text-primary-600 hover:text-primary-700 dark:hover:text-primary-400">
                                        conditions d'utilisation
                                    </Link>{' '}
                                    et la{' '}
                                    <Link href="/privacy" className="text-primary-600 hover:text-primary-700 dark:hover:text-primary-400">
                                        politique de confidentialité
                                    </Link>
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            loading={isLoading}
                            disabled={isLoading || Object.keys(validationErrors).length > 0}
                        >
                            {isLoading ? 'Création du compte en cours...' : 'Créer mon compte'}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-center text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                            Déjà un compte ?{' '}
                            <Link
                                href="/auth/login"
                                className="text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 font-medium"
                            >
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </motion.div>

                {/* Back to Home */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center mt-4 sm:mt-6"
                >
                    <Link
                        href="/"
                        className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
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
                                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>

                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                Compte existant
                            </h3>

                            <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                                Un compte avec cet email existe déjà. Que souhaitez-vous faire ?
                            </p>

                            <div className="flex flex-col space-y-3">
                                <Link
                                    href="/auth/login"
                                    className="w-full px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200"
                                    onClick={() => setShowErrorModal(false)}
                                >
                                    Se connecter avec cet email
                                </Link>
                                <button
                                    onClick={() => {
                                        setShowErrorModal(false)
                                        setError('')
                                        setFormData(prev => ({ ...prev, email: '' }))
                                    }}
                                    className="w-full px-4 py-2 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors duration-200"
                                >
                                    Utiliser un autre email
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}