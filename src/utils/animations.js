/**
 * Animation and transition utilities
 */

/**
 * Easing functions for smooth animations
 */
export const easing = {
  // Linear
  linear: (t) => t,

  // Quad
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * (t - 2)) * (2 * (t - 2)) + 1,

  // Quart
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Quint
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

  // Sine
  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Expo
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,

  // Circ
  easeInCirc: (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  easeOutCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: (t) => t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Back
  easeInBack: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t
  },
  easeOutBack: (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158
    const c2 = c1 * 1.525
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
  },

  // Elastic
  easeInElastic: (t) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
  },
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
  easeInOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5
    return t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1
  },

  // Bounce
  easeOutBounce: (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  },
  easeInBounce: (t) => 1 - this.easeOutBounce(1 - t),
  easeInOutBounce: (t) => t < 0.5 ? (1 - this.easeOutBounce(1 - 2 * t)) / 2 : (1 + this.easeOutBounce(2 * t - 1)) / 2
}

/**
 * Animate a value from start to end
 */
export const animateValue = (start, end, duration = 1000, easingFn = easing.easeOutCubic, onUpdate) => {
  const startTime = Date.now()
  const startValue = start
  const endValue = end
  const totalChange = endValue - startValue

  const animate = () => {
    const currentTime = Date.now()
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easingFn(progress)
    const currentValue = startValue + totalChange * easedProgress

    if (onUpdate) {
      onUpdate(currentValue)
    }

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  animate()
}

/**
 * Animate element opacity
 */
export const fadeIn = (element, duration = 300, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.opacity = '0'
      element.style.transition = `opacity ${duration}ms ease-out`
      element.offsetHeight // Trigger reflow
      element.style.opacity = '1'
      setTimeout(resolve, duration)
    }, delay)
  })
}

/**
 * Animate element fade out
 */
export const fadeOut = (element, duration = 300, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.transition = `opacity ${duration}ms ease-out`
      element.style.opacity = '0'
      setTimeout(resolve, duration)
    }, delay)
  })
}

/**
 * Slide in animation
 */
export const slideIn = (element, direction = 'left', duration = 300, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const translateMap = {
        left: 'translateX(-100%)',
        right: 'translateX(100%)',
        up: 'translateY(-100%)',
        down: 'translateY(100%)'
      }

      element.style.transform = translateMap[direction] || translateMap.left
      element.style.opacity = '0'
      element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`
      element.offsetHeight // Trigger reflow
      element.style.transform = 'translate(0)'
      element.style.opacity = '1'
      setTimeout(resolve, duration)
    }, delay)
  })
}

/**
 * Slide out animation
 */
export const slideOut = (element, direction = 'left', duration = 300, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const translateMap = {
        left: 'translateX(-100%)',
        right: 'translateX(100%)',
        up: 'translateY(-100%)',
        down: 'translateY(100%)'
      }

      element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`
      element.style.transform = translateMap[direction] || translateMap.left
      element.style.opacity = '0'
      setTimeout(resolve, duration)
    }, delay)
  })
}

/**
 * Scale animation
 */
export const scale = (element, fromScale = 0.8, toScale = 1, duration = 300, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.transform = `scale(${fromScale})`
      element.style.opacity = '0'
      element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`
      element.offsetHeight // Trigger reflow
      element.style.transform = `scale(${toScale})`
      element.style.opacity = '1'
      setTimeout(resolve, duration)
    }, delay)
  })
}

/**
 * Pulse animation
 */
export const pulse = (element, duration = 1000) => {
  element.style.animation = `pulse ${duration}ms ease-in-out infinite`
}

/**
 * Stop animation
 */
export const stopAnimation = (element) => {
  element.style.animation = 'none'
  element.style.transition = 'none'
}

/**
 * Stagger animations for multiple elements
 */
export const staggerAnimation = (elements, animationFn, staggerDelay = 100) => {
  return Promise.all(
    elements.map((element, index) =>
      animationFn(element, staggerDelay * index)
    )
  )
}

/**
 * Bounce animation
 */
export const bounce = (element, duration = 600, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.animation = `bounce ${duration}ms ease-in-out`
      setTimeout(resolve, duration)
    }, delay)
  })
}

/**
 * Shake animation
 */
export const shake = (element, duration = 500, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.animation = `shake ${duration}ms ease-in-out`
      setTimeout(resolve, duration)
    }, delay)
  })
}

/**
 * Flip animation
 */
export const flip = (element, duration = 600, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      element.style.animation = `flip ${duration}ms ease-in-out`
      setTimeout(resolve, duration)
    }, delay)
  })
}
