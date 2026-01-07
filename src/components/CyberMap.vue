<template>
  <div ref="containerRef" class="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700/50">
    <div 
      class="absolute inset-0 opacity-20 pointer-events-none"
      :style="{
        backgroundImage: `url(${mapImageUrl})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'invert(1) sepia(1) hue-rotate(95deg) saturate(2) brightness(0.4) contrast(1.5)' 
      }"
    />
    <canvas ref="canvasRef" class="absolute inset-0 block w-full h-full z-10" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  activeAttacks: {
    type: Array,
    required: true
  }
})

const mapImageUrl = "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg"

const canvasRef = ref(null)
const containerRef = ref(null)

// Refs for animation state (not reactive for performance)
const particles = []
const ripples = []
const labels = []

// Helper: Project Lat/Lon to X/Y (Plate Carrée)
const project = (lat, lon, width, height) => {
  const x = (lon + 180) * (width / 360)
  const y = (90 - lat) * (height / 180)
  return { x, y }
}

// Watch for new attacks
watch(() => props.activeAttacks, (newAttacks) => {
  newAttacks.forEach(att => {
    // Avoid duplicates using ID
    if (particles.find(p => p.id === att.id)) return

    // Add source label
    labels.push({ 
      text: att.source.name, 
      lat: att.source.lat, 
      lon: att.source.lon, 
      life: 1.0, 
      color: att.type.color 
    })

    // Add particle
    particles.push({ 
      id: att.id, 
      source: att.source, 
      destination: att.destination, 
      color: att.type.color, 
      progress: 0, 
      speed: 0.003 + (Math.random() * 0.003) 
    })
  })
}, { deep: true })

let animationId

const render = () => {
  if (!canvasRef.value || !containerRef.value) return

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  const { offsetWidth: w, offsetHeight: h } = containerRef.value

  // Handle resizing
  if (w === 0 || h === 0) { 
    animationId = requestAnimationFrame(render)
    return 
  }
  if (canvas.width !== w || canvas.height !== h) { 
    canvas.width = w
    canvas.height = h 
  }

  // Clear canvas
  ctx.clearRect(0, 0, w, h)

  // Update & Draw Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.progress += p.speed
    const startPos = project(p.source.lat, p.source.lon, w, h)
    const endPos = project(p.destination.lat, p.destination.lon, w, h)

    // Reached destination?
    if (p.progress >= 1) {
      // Add destination label
      labels.push({ 
        text: p.destination.name, 
        lat: p.destination.lat, 
        lon: p.destination.lon, 
        life: 1.0, 
        color: p.color 
      })
      // Add ripple
      ripples.push({ 
        x: endPos.x, 
        y: endPos.y, 
        radius: 0, 
        maxRadius: 20, 
        alpha: 0.8, 
        color: p.color 
      })
      
      particles.splice(i, 1)
      continue
    }

    // Bezier Curve
    const dx = endPos.x - startPos.x
    const dy = endPos.y - startPos.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    // Control point for curve
    const controlX = ((startPos.x + endPos.x) / 2) + (-dy / (dist || 1) * Math.min(dist * 0.25, 120))
    const controlY = ((startPos.y + endPos.y) / 2) + (dx / (dist || 1) * Math.min(dist * 0.25, 120))

    const t = p.progress
    const x = (1-t)**2 * startPos.x + 2*(1-t)*t * controlX + t**2 * endPos.x
    const y = (1-t)**2 * startPos.y + 2*(1-t)*t * controlY + t**2 * endPos.y

    const gradient = ctx.createLinearGradient(startPos.x, startPos.y, endPos.x, endPos.y)
    gradient.addColorStop(0, p.color)
    gradient.addColorStop(1, p.color + "22") // Transparent end

    ctx.beginPath()
    ctx.moveTo(startPos.x, startPos.y)
    ctx.quadraticCurveTo(controlX, controlY, x, y)
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.5
    ctx.stroke()
    
    // Glowing Head
    ctx.beginPath()
    ctx.fillStyle = p.color
    ctx.shadowBlur = 10
    ctx.shadowColor = p.color
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1.0
  }

  // Update & Draw Ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i]
    r.radius += 0.4
    r.alpha -= 0.02

    if (r.alpha <= 0) {
      ripples.splice(i, 1)
      continue
    }

    ctx.beginPath()
    ctx.strokeStyle = r.color
    ctx.globalAlpha = r.alpha
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1.0
  }

  // Update & Draw Labels
  ctx.textAlign = 'center'
  ctx.font = 'bold 12px "JetBrains Mono", monospace'
  
  for (let i = labels.length - 1; i >= 0; i--) {
    const l = labels[i]
    l.life -= 0.008 // Decay

    if (l.life <= 0) {
      labels.splice(i, 1)
      continue
    }

    const pos = project(l.lat, l.lon, w, h)
    ctx.globalAlpha = l.life
    ctx.fillStyle = l.color
    ctx.shadowBlur = 4
    ctx.shadowColor = 'rgba(0,0,0,1)'
    
    const labelText = l.text.split(',')[0].toUpperCase()
    ctx.fillText(labelText, pos.x, pos.y - 15 - (1.0 - l.life) * 20)
    
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1.0
  }

  animationId = requestAnimationFrame(render)
}

onMounted(() => {
  render()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
})
</script>
