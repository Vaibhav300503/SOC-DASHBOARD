/**
 * Accessibility utilities and WCAG compliance helpers
 */

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export const getContrastRatio = (color1, color2) => {
  const lum1 = getRelativeLuminance(color1)
  const lum2 = getRelativeLuminance(color2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Get relative luminance of a color
 */
export const getRelativeLuminance = (color) => {
  const rgb = hexToRgb(color)
  if (!rgb) return 0

  const [r, g, b] = rgb.map(val => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null
}

/**
 * Check if contrast ratio meets WCAG AA standard
 * WCAG AA requires 4.5:1 for normal text, 3:1 for large text
 */
export const meetsWCAGAA = (color1, color2, isLargeText = false) => {
  const ratio = getContrastRatio(color1, color2)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 * WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
 */
export const meetsWCAGAAA = (color1, color2, isLargeText = false) => {
  const ratio = getContrastRatio(color1, color2)
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  },

  /**
   * Restore focus to previously focused element
   */
  restoreFocus: (previousElement) => {
    if (previousElement && previousElement.focus) {
      previousElement.focus()
    }
  },

  /**
   * Move focus to element
   */
  moveFocus: (element) => {
    if (element && element.focus) {
      element.focus()
    }
  }
}

/**
 * Keyboard navigation utilities
 */
export const keyboardNavigation = {
  /**
   * Handle arrow key navigation
   */
  handleArrowKeys: (items, currentIndex, onSelect) => {
    return (e) => {
      let newIndex = currentIndex

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          newIndex = (currentIndex - 1 + items.length) % items.length
          e.preventDefault()
          break
        case 'ArrowDown':
        case 'ArrowRight':
          newIndex = (currentIndex + 1) % items.length
          e.preventDefault()
          break
        case 'Home':
          newIndex = 0
          e.preventDefault()
          break
        case 'End':
          newIndex = items.length - 1
          e.preventDefault()
          break
        default:
          return
      }

      onSelect(newIndex)
    }
  },

  /**
   * Handle Enter/Space key activation
   */
  handleActivationKeys: (onActivate) => {
    return (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onActivate()
      }
    }
  },

  /**
   * Handle Escape key
   */
  handleEscapeKey: (onEscape) => {
    return (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape()
      }
    }
  }
}

/**
 * ARIA utilities
 */
export const aria = {
  /**
   * Set ARIA label
   */
  setLabel: (element, label) => {
    element.setAttribute('aria-label', label)
  },

  /**
   * Set ARIA description
   */
  setDescription: (element, description) => {
    element.setAttribute('aria-description', description)
  },

  /**
   * Set ARIA live region
   */
  setLiveRegion: (element, priority = 'polite', atomic = true) => {
    element.setAttribute('aria-live', priority)
    element.setAttribute('aria-atomic', atomic.toString())
  },

  /**
   * Set ARIA disabled state
   */
  setDisabled: (element, disabled = true) => {
    element.setAttribute('aria-disabled', disabled.toString())
  },

  /**
   * Set ARIA expanded state
   */
  setExpanded: (element, expanded = true) => {
    element.setAttribute('aria-expanded', expanded.toString())
  },

  /**
   * Set ARIA hidden state
   */
  setHidden: (element, hidden = true) => {
    element.setAttribute('aria-hidden', hidden.toString())
  },

  /**
   * Set ARIA selected state
   */
  setSelected: (element, selected = true) => {
    element.setAttribute('aria-selected', selected.toString())
  },

  /**
   * Set ARIA current state
   */
  setCurrent: (element, current = 'page') => {
    element.setAttribute('aria-current', current)
  },

  /**
   * Set ARIA controls
   */
  setControls: (element, controlId) => {
    element.setAttribute('aria-controls', controlId)
  },

  /**
   * Set ARIA owns
   */
  setOwns: (element, ownId) => {
    element.setAttribute('aria-owns', ownId)
  }
}

/**
 * Semantic HTML utilities
 */
export const semantic = {
  /**
   * Create semantic heading
   */
  createHeading: (level, text, id = '') => {
    const heading = document.createElement(`h${level}`)
    heading.textContent = text
    if (id) heading.id = id
    return heading
  },

  /**
   * Create semantic button
   */
  createButton: (text, onClick, ariaLabel = '') => {
    const button = document.createElement('button')
    button.textContent = text
    button.addEventListener('click', onClick)
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel)
    return button
  },

  /**
   * Create semantic link
   */
  createLink: (text, href, ariaLabel = '') => {
    const link = document.createElement('a')
    link.textContent = text
    link.href = href
    if (ariaLabel) link.setAttribute('aria-label', ariaLabel)
    return link
  }
}

/**
 * Skip link utilities
 */
export const skipLinks = {
  /**
   * Create skip to main content link
   */
  createSkipLink: () => {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-content'
    skipLink.textContent = 'Skip to main content'
    skipLink.className = 'sr-only focus:not-sr-only'
    return skipLink
  },

  /**
   * Create skip to navigation link
   */
  createSkipNavLink: () => {
    const skipLink = document.createElement('a')
    skipLink.href = '#main-nav'
    skipLink.textContent = 'Skip to navigation'
    skipLink.className = 'sr-only focus:not-sr-only'
    return skipLink
  }
}

/**
 * Color blindness simulation
 */
export const colorBlindnessSimulation = {
  /**
   * Simulate protanopia (red-blind)
   */
  protanopia: (color) => {
    const rgb = hexToRgb(color)
    if (!rgb) return color
    const [r, g, b] = rgb
    return rgbToHex(
      Math.round(0.567 * r + 0.433 * g),
      Math.round(0.558 * r + 0.442 * g),
      Math.round(0.242 * r + 0.758 * b)
    )
  },

  /**
   * Simulate deuteranopia (green-blind)
   */
  deuteranopia: (color) => {
    const rgb = hexToRgb(color)
    if (!rgb) return color
    const [r, g, b] = rgb
    return rgbToHex(
      Math.round(0.625 * r + 0.375 * g),
      Math.round(0.7 * r + 0.3 * g),
      Math.round(0.3 * b)
    )
  },

  /**
   * Simulate tritanopia (blue-yellow blind)
   */
  tritanopia: (color) => {
    const rgb = hexToRgb(color)
    if (!rgb) return color
    const [r, g, b] = rgb
    return rgbToHex(
      Math.round(0.95 * r + 0.05 * b),
      Math.round(0.433 * g + 0.567 * b),
      Math.round(0.475 * b)
    )
  }
}

/**
 * Convert RGB to hex
 */
export const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Reduce motion preferences
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Dark mode preferences
 */
export const prefersDarkMode = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * High contrast preferences
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: more)').matches
}
