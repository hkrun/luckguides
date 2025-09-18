'use client'

import { useState, useRef, useEffect } from 'react'

interface BeforeAfterComparisonProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
  autoPlay?: boolean
  autoPlayDuration?: number
  instructionText?: string
  instructionTextMobile?: string
}

export default function BeforeAfterComparison({
  beforeImage,
  afterImage,
  beforeLabel = "Original",
  afterLabel = "After Face Swap",
  className = "",
  autoPlay = false,
  autoPlayDuration = 3000,
  instructionText = "拖拽滑块查看换脸前后对比",
  instructionTextMobile = "拖拽查看对比"
}: BeforeAfterComparisonProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setIsAutoPlaying(false)
    updateSliderPosition(e)
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'IMG') {
      setIsAutoPlaying(false)
      updateSliderPosition(e)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition(prev => Math.max(0, prev - 5))
    } else if (e.key === 'ArrowRight') {
      setSliderPosition(prev => Math.min(100, prev + 5))
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    updateSliderPosition(e)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    updateSliderPosition(e.touches[0])
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    updateSliderPosition(e.touches[0])
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const updateSliderPosition = (e: { clientX: number }) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging])

  // Auto play effect
  useEffect(() => {
    if (isAutoPlaying && !isDragging) {
      autoPlayRef.current = setInterval(() => {
        setSliderPosition(prev => {
          const next = prev + 1
          if (next >= 100) {
            return 0
          }
          return next
        })
      }, autoPlayDuration / 100)
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
        autoPlayRef.current = null
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [isAutoPlaying, isDragging, autoPlayDuration])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-xl ${className}`}
      style={{ aspectRatio: '2/1' }}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="拖拽滑块查看换脸前后对比"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={sliderPosition}
    >
      {/* Before Image (Background) */}
      <div className="absolute inset-0">
        <img 
          src={beforeImage} 
          alt="Before" 
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* After Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          transition: isDragging ? 'none' : 'clip-path 0.1s ease-out'
        }}
      >
        <img
          src={afterImage}
          alt="After"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Slider Line */}
      <div
        className={`absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize z-10 ${isDragging ? 'w-1' : ''}`}
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
          transition: isDragging ? 'none' : 'all 0.1s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Slider Handle */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-xl border-2 border-blue-500 flex items-center justify-center cursor-ew-resize transition-all duration-200 hover:scale-110 ${isDragging ? 'scale-110 shadow-2xl bg-blue-50' : ''}`}>
          <div className="flex items-center space-x-1">
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="text-blue-500">
              <path d="M2 2L0 6L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 2L8 6L6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm z-20 md:top-4 md:left-4 md:text-sm md:px-3 md:py-1.5 md:rounded-lg md:border md:border-white/20">
        <span className="sm:hidden">{beforeLabel.includes('原始') ? '原始' : beforeLabel.includes('Original') ? 'Before' : beforeLabel}</span>
        <span className="hidden sm:inline">{beforeLabel}</span>
      </div>
      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm z-20 md:top-4 md:right-4 md:text-sm md:px-3 md:py-1.5 md:rounded-lg md:border md:border-white/20">
        <span className="sm:hidden">{afterLabel.includes('AI换脸') ? 'AI换脸' : afterLabel.includes('After') ? 'After' : afterLabel}</span>
        <span className="hidden sm:inline">{afterLabel}</span>
      </div>

      {/* Instruction Text */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-20 md:px-4 md:py-2 md:rounded-lg md:border md:border-white/20">
        <div className="flex items-center space-x-1 md:space-x-2">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-white md:w-4 md:h-4">
            <path d="M6 4L2 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 4L14 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">{instructionText}</span>
          <span className="sm:hidden">{instructionTextMobile}</span>
        </div>
      </div>
    </div>
  )
}
