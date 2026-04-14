'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, Filter, X, Mic, MicOff, Volume2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  className?: string
  showFilters?: boolean
  suggestions?: string[]
}

export function SearchBar({
  placeholder = "Rechercher...",
  onSearch,
  className,
  showFilters = true,
  suggestions = []
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Voice search states
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [detectedLanguage, setDetectedLanguage] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  )

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'fr-FR'
        recognition.maxAlternatives = 1
        // Optimize for faster response
        if ('serviceURI' in recognition) {
          recognition.serviceURI = 'wss://www.google.com/speech-api/v2/recognize'
        }

        recognition.onstart = () => {
          console.log('Speech recognition started')
          setIsListening(true)
          setTranscript('')
          setDetectedLanguage('')
          setQuery('') // Clear search input on start
        }

        recognition.onresult = (event) => {
          let interimTranscript = ''
          let finalTranscript = ''

          // Get the most recent result for instant updates
          const lastResult = event.results[event.results.length - 1]
          const currentTranscript = lastResult[0].transcript

          // Update immediately without any delays
          setTranscript(currentTranscript)
          setQuery(currentTranscript)

          // Quick language detection
          if (currentTranscript) {
            const text = currentTranscript.toLowerCase()
            if (text.includes('je') || text.includes('nous') || text.includes('vous') || text.includes('une') || text.includes('des') || text.includes('le') || text.includes('la') || text.includes('les') || text.includes('du') || text.includes('de') || text.includes('et') || text.includes('est') || text.includes('avec') || text.includes('pour') || text.includes('dans') || text.includes('sur')) {
              setDetectedLanguage('Français')
            } else if (text.includes('the') || text.includes('and') || text.includes('is') || text.includes('a') || text.includes('an') || text.includes('in') || text.includes('of') || text.includes('to') || text.includes('for') || text.includes('with') || text.includes('on') || text.includes('at') || text.includes('by') || text.includes('from')) {
              setDetectedLanguage('English')
            } else {
              setDetectedLanguage('Auto-détecté')
            }
          }
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          setTranscript('')
        }

        recognition.onend = () => {
          console.log('Speech recognition ended')
          setIsListening(false)
          if (transcript.trim()) {
            console.log('Final transcript for search:', transcript.trim())
            handleSearch(transcript.trim())
          }
        }

        recognitionRef.current = recognition
      } else {
        console.log('Speech recognition not supported')
        setIsSupported(false)
      }
    }
  }, [])

  const startListening = () => {
    console.log('startListening called, isListening:', isListening)
    if (!isListening) {
      console.log('Starting voice recognition...')
      setTranscript('')
      setDetectedLanguage('')
      setQuery('') // Clear the search input as well

      // Create a fresh recognition instance each time
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'fr-FR'
        recognition.maxAlternatives = 1

        // Optimize for fastest response
        // Note: SpeechGrammarList is not supported as a constructor in most browsers
        // We use it only as a type declaration

        recognition.onstart = () => {
          console.log('Speech recognition started')
          setIsListening(true)
        }

        recognition.onresult = (event) => {
          let interimTranscript = ''
          let finalTranscript = ''

          // Get the most recent result for instant updates
          const lastResult = event.results[event.results.length - 1]
          const currentTranscript = lastResult[0].transcript

          // Update immediately without any delays
          setTranscript(currentTranscript)
          setQuery(currentTranscript)

          // Quick language detection
          if (currentTranscript) {
            const text = currentTranscript.toLowerCase()
            if (text.includes('je') || text.includes('nous') || text.includes('vous') || text.includes('une') || text.includes('des') || text.includes('le') || text.includes('la') || text.includes('les') || text.includes('du') || text.includes('de') || text.includes('et') || text.includes('est') || text.includes('avec') || text.includes('pour') || text.includes('dans') || text.includes('sur')) {
              setDetectedLanguage('Français')
            } else if (text.includes('the') || text.includes('and') || text.includes('is') || text.includes('a') || text.includes('an') || text.includes('in') || text.includes('of') || text.includes('to') || text.includes('for') || text.includes('with') || text.includes('on') || text.includes('at') || text.includes('by') || text.includes('from')) {
              setDetectedLanguage('English')
            } else {
              setDetectedLanguage('Auto-détecté')
            }
          }
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          setTranscript('')
        }

        recognition.onend = () => {
          console.log('Speech recognition ended')
          setIsListening(false)
          if (transcript.trim()) {
            console.log('Final transcript for search:', transcript.trim())
            handleSearch(transcript.trim())
          }
        }

        recognitionRef.current = recognition

        try {
          recognition.start()
        } catch (error) {
          console.error('Error starting speech recognition:', error)
          setIsListening(false)
        }
      }
    }
  }

  const stopListening = () => {
    console.log('stopListening called, isListening:', isListening, 'recognitionRef:', recognitionRef.current)

    // Always reset the state immediately
    setIsListening(false)
    setTranscript('')
    setDetectedLanguage('')

    if (recognitionRef.current) {
      console.log('Stopping voice recognition...')
      try {
        recognitionRef.current.stop()
        // Force stop after a short delay if it doesn't stop naturally
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.abort()
            } catch (error) {
              console.log('Recognition already stopped')
            }
            recognitionRef.current = null
          }
        }, 100)
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
        recognitionRef.current = null
      }
    }
  }

  const handleSearch = (searchQuery: string = query) => {
    console.log('handleSearch called with:', searchQuery, 'onSearch prop:', !!onSearch)

    if (!searchQuery.trim()) {
      // Show validation message for empty search
      setShowValidation(true)
      setTimeout(() => setShowValidation(false), 3000)
      return
    }

    if (onSearch && searchQuery.trim()) {
      console.log('Calling onSearch with:', searchQuery.trim())
      onSearch(searchQuery.trim())
    } else {
      console.log('Search not triggered - onSearch:', !!onSearch, 'query:', searchQuery.trim())
    }
    setShowSuggestions(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    console.log('Key pressed:', e.key, 'Current query:', query)
    if (e.key === 'Enter') {
      console.log('Enter key pressed, calling handleSearch')
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    handleSearch(suggestion)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  return (
    <div className={cn('relative w-full', className)}>
      {/* Validation Message */}
      <AnimatePresence>
        {showValidation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-16 left-0 right-0 z-50"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Veuillez entrer un terme de recherche
                </span>
              </div>
              <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                Ou utilisez les filtres pour une recherche plus précise
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 z-10">
            <Search className="w-5 h-5 text-neutral-400" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(e.target.value.length > 0)
            }}
            onFocus={() => {
              setIsFocused(true)
              setShowSuggestions(query.length > 0)
            }}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className={cn(
              'w-full pl-12 pr-4 py-4 text-lg border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl',
              'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
              'placeholder-neutral-500 dark:placeholder-neutral-400',
              'focus:outline-none focus:ring-0 focus:border-primary-500 dark:focus:border-primary-400',
              'transition-all duration-200',
              isFocused && 'shadow-lg',
              className
            )}
          />

          {query && (
            <button
              onClick={() => {
                setQuery('')
                setShowSuggestions(false)
                inputRef.current?.focus()
              }}
              className="absolute right-16 p-1 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="absolute right-2 flex items-center space-x-1">
            {/* Voice Search Button */}
            {isSupported && (
              <button
                onClick={() => {
                  if (isProcessing) return // Prevent multiple clicks
                  console.log('Voice button clicked, isListening:', isListening)
                  setIsProcessing(true)
                  if (isListening) {
                    stopListening()
                  } else {
                    startListening()
                  }
                  setTimeout(() => setIsProcessing(false), 200) // Reset after 200ms
                }}
                className={cn(
                  'p-2 rounded-xl transition-all duration-200 relative overflow-hidden',
                  isListening
                    ? 'bg-red-500 text-white animate-voice-pulse'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                )}
                title={isListening ? "Arrêter l'écoute" : "Recherche vocale"}
              >
                {isListening && (
                  <div className="absolute inset-0 bg-red-400 rounded-xl animate-voice-wave"></div>
                )}
                <div className="relative z-10">
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </div>
              </button>
            )}

            {showFilters && (
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  'p-2 rounded-xl transition-all duration-200',
                  showAdvancedFilters
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                )}
                title="Filtres avancés"
              >
                <Filter className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => handleSearch()}
              className="btn btn-primary px-6 py-2 text-sm"
            >
              Rechercher
            </button>
          </div>
        </div>

        {/* Voice Search Feedback */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl border border-primary-200 dark:border-primary-700 z-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Écoute en cours...
                    </span>
                  </div>
                  {detectedLanguage && (
                    <div className="flex items-center space-x-1 text-xs text-neutral-600 dark:text-neutral-400">
                      <Volume2 className="w-3 h-3" />
                      <span>{detectedLanguage}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (isProcessing) return // Prevent multiple clicks
                    console.log('Arrêter button clicked')
                    setIsProcessing(true)
                    stopListening()
                    setTimeout(() => setIsProcessing(false), 200) // Reset after 200ms
                  }}
                  className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  Arrêter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 max-h-60 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <MapPin className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  <span className="text-neutral-700 dark:text-neutral-300">{suggestion}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Type de propriété
                </label>
                <select className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400">
                  <option value="">Tous les types</option>
                  <option value="villa">Villa</option>
                  <option value="apartment">Appartement</option>
                  <option value="house">Maison</option>
                  <option value="land">Terrain</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Prix
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Localisation
                </label>
                <input
                  type="text"
                  placeholder="Ville, quartier..."
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                />
              </div>

              {/* Surface */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Surface (m²)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors duration-200"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  handleSearch()
                  setShowAdvancedFilters(false)
                }}
                className="btn btn-primary"
              >
                Appliquer les filtres
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
