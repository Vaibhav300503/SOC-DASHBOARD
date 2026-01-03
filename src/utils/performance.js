/**
 * Performance optimization utilities
 */

/**
 * Debounce function - delays execution until after specified time has passed
 */
export const debounce = (func, wait = 300, immediate = false) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

/**
 * Throttle function - limits execution to once per specified time interval
 */
export const throttle = (func, limit = 300) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Request animation frame throttle
 */
export const rafThrottle = (func) => {
  let rafId = null
  return function(...args) {
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
      func.apply(this, args)
      rafId = null
    })
  }
}

/**
 * Lazy load images
 */
export const lazyLoadImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          img.src = img.dataset.src
          img.classList.remove('lazy')
          imageObserver.unobserve(img)
        }
      })
    })

    document.querySelectorAll('img.lazy').forEach(img => imageObserver.observe(img))
  }
}

/**
 * Lazy load components
 */
export const lazyLoadComponent = (importFunc) => {
  return () => ({
    component: importFunc(),
    loading: null,
    error: null,
    delay: 200,
    timeout: 10000
  })
}

/**
 * Virtual scrolling helper
 */
export const createVirtualScroller = (items, itemHeight, containerHeight) => {
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const totalCount = items.length

  return {
    getVisibleItems: (scrollTop) => {
      const startIndex = Math.floor(scrollTop / itemHeight)
      const endIndex = Math.min(startIndex + visibleCount + 1, totalCount)
      return {
        items: items.slice(startIndex, endIndex),
        startIndex,
        endIndex,
        offsetY: startIndex * itemHeight
      }
    },
    getTotalHeight: () => totalCount * itemHeight
  }
}

/**
 * Memoization helper
 */
export const memoize = (func, options = {}) => {
  const cache = new Map()
  const maxSize = options.maxSize || 100

  return function(...args) {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)
    }

    const result = func.apply(this, args)

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    cache.set(key, result)
    return result
  }
}

/**
 * Performance monitoring
 */
export const performanceMonitor = {
  /**
   * Measure function execution time
   */
  measure: async (name, func) => {
    const start = performance.now()
    const result = await func()
    const end = performance.now()
    const duration = end - start

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)

    return { result, duration }
  },

  /**
   * Mark performance checkpoint
   */
  mark: (name) => {
    performance.mark(name)
  },

  /**
   * Measure between two marks
   */
  measureBetween: (name, startMark, endMark) => {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name)[0]
    console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`)
    return measure.duration
  },

  /**
   * Get memory usage
   */
  getMemoryUsage: () => {
    if (performance.memory) {
      return {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      }
    }
    return null
  },

  /**
   * Get navigation timing
   */
  getNavigationTiming: () => {
    const timing = performance.getEntriesByType('navigation')[0]
    if (timing) {
      return {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - timing.requestStart,
        download: timing.responseEnd - timing.responseStart,
        domInteractive: timing.domInteractive - timing.fetchStart,
        domComplete: timing.domComplete - timing.fetchStart,
        loadComplete: timing.loadEventEnd - timing.fetchStart
      }
    }
    return null
  }
}

/**
 * Request idle callback polyfill
 */
export const requestIdleCallback = window.requestIdleCallback || ((cb) => {
  const start = Date.now()
  return setTimeout(() => {
    cb({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
    })
  }, 1)
})

/**
 * Cancel idle callback polyfill
 */
export const cancelIdleCallback = window.cancelIdleCallback || ((id) => {
  clearTimeout(id)
})

/**
 * Batch DOM updates
 */
export const batchDOMUpdates = (updates) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}

/**
 * Optimize list rendering
 */
export const optimizeListRendering = (items, renderItem, container) => {
  const fragment = document.createDocumentFragment()
  items.forEach(item => {
    fragment.appendChild(renderItem(item))
  })
  container.appendChild(fragment)
}

/**
 * Intersection observer helper
 */
export const observeElements = (selector, callback, options = {}) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry)
      }
    })
  }, {
    threshold: 0.1,
    ...options
  })

  document.querySelectorAll(selector).forEach(el => observer.observe(el))

  return observer
}

/**
 * Resize observer helper
 */
export const observeResize = (element, callback) => {
  const observer = new ResizeObserver((entries) => {
    entries.forEach(entry => {
      callback(entry)
    })
  })

  observer.observe(element)

  return observer
}

/**
 * Mutation observer helper
 */
export const observeMutations = (element, callback, options = {}) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      callback(mutation)
    })
  })

  observer.observe(element, {
    childList: true,
    subtree: true,
    attributes: true,
    ...options
  })

  return observer
}

/**
 * Web Worker helper
 */
export const createWorker = (func) => {
  const blob = new Blob([`self.onmessage = function(e) { self.postMessage((${func.toString()})(e.data)); }`], {
    type: 'application/javascript'
  })
  const worker = new Worker(URL.createObjectURL(blob))
  return worker
}

/**
 * Cache API helper
 */
export const cacheHelper = {
  /**
   * Cache fetch response
   */
  cacheFetch: async (url, options = {}) => {
    const cache = await caches.open('v1')
    let response = await cache.match(url)

    if (!response) {
      response = await fetch(url, options)
      cache.put(url, response.clone())
    }

    return response
  },

  /**
   * Clear cache
   */
  clearCache: async (cacheName = 'v1') => {
    await caches.delete(cacheName)
  },

  /**
   * Get cached response
   */
  getCached: async (url) => {
    const cache = await caches.open('v1')
    return cache.match(url)
  }
}

/**
 * Local storage helper with expiration
 */
export const storageHelper = {
  /**
   * Set item with expiration
   */
  setWithExpiration: (key, value, expirationMinutes = 60) => {
    const item = {
      value,
      expiration: Date.now() + expirationMinutes * 60 * 1000
    }
    localStorage.setItem(key, JSON.stringify(item))
  },

  /**
   * Get item with expiration check
   */
  getWithExpiration: (key) => {
    const item = localStorage.getItem(key)
    if (!item) return null

    const parsed = JSON.parse(item)
    if (Date.now() > parsed.expiration) {
      localStorage.removeItem(key)
      return null
    }

    return parsed.value
  },

  /**
   * Clear expired items
   */
  clearExpired: () => {
    Object.keys(localStorage).forEach(key => {
      const item = localStorage.getItem(key)
      try {
        const parsed = JSON.parse(item)
        if (parsed.expiration && Date.now() > parsed.expiration) {
          localStorage.removeItem(key)
        }
      } catch (e) {
        // Not a JSON item, skip
      }
    })
  }
}
