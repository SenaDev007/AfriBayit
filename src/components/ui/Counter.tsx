'use client'

import { useState, useEffect } from 'react'

interface CounterProps {
  end: number
  suffix?: string
  duration?: number
  delay?: number
  trigger?: boolean
  className?: string
}

export function Counter({ 
  end, 
  suffix = '', 
  duration = 2, 
  delay = 0,
  trigger = true,
  className = ''
}: CounterProps) {
  const [count, setCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!trigger) return

    const timer = setTimeout(() => {
      setIsAnimating(true)
      
      const startTime = Date.now()
      const startValue = 0
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / (duration * 1000), 1)
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        const currentValue = Math.floor(startValue + (end - startValue) * easeOutCubic)
        
        setCount(currentValue)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setCount(end)
          setIsAnimating(false)
        }
      }
      
      requestAnimationFrame(animate)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [end, duration, delay, trigger])

  return (
    <span className={className}>
      {count.toLocaleString('fr-FR')}{suffix}
    </span>
  )
}
