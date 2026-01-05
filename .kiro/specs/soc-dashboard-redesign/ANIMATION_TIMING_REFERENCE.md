# Animation Timing Reference

## Complete Animation Timeline

### Page Load Sequence (Total Duration: ~2.4 seconds)

```
Timeline (ms)  Element                          Animation              Duration  Easing
─────────────────────────────────────────────────────────────────────────────────────
0              Page Header                      fadeIn                 600ms     ease-out
0              Title                            slideInLeft            600ms     ease-out
100            Subtitle                         slideInLeft            600ms     ease-out
200            Action Buttons                   slideInUp              600ms     ease-out
300            Stats Card 1 (Total Events)      slideInUp              600ms     ease-out
400            Stats Card 2 (Critical)          slideInUp              600ms     ease-out
500            Stats Card 3 (High Priority)     slideInUp              600ms     ease-out
600            Stats Card 4 (Active Hosts)      slideInUp              600ms     ease-out
700            Alert Metric 1 (Total Alerts)    slideInUp              600ms     ease-out
800            Alert Metric 2 (Critical Alerts) slideInUp              600ms     ease-out
900            Alert Metric 3 (Analyzed Alerts) slideInUp              600ms     ease-out
1000           Main Visualizations              slideInUp              600ms     ease-out
1100           Log Distribution Card            slideInUp              600ms     ease-out
1200           Log Type Card 1                  slideInUp              600ms     ease-out
1250           Log Type Card 2                  slideInUp              600ms     ease-out
1300           Log Type Card 3                  slideInUp              600ms     ease-out
1350           Log Type Card 4                  slideInUp              600ms     ease-out
1400           Log Type Card 5                  slideInUp              600ms     ease-out
1300           Geographic Map                   slideInUp              600ms     ease-out
1400           IP Table 1 (Source IPs)          slideInUp              600ms     ease-out
1500           IP Table 2 (Destination IPs)     slideInUp              600ms     ease-out
1600           Network Activity Summary         slideInUp              600ms     ease-out
1700           Real-time Logs                   slideInUp              600ms     ease-out
1800           Recent Cases                     slideInUp              600ms     ease-out
1900           Case Item 1                      slideInUp              600ms     ease-out
1950           Case Item 2                      slideInUp              600ms     ease-out
2000           Case Item 3                      slideInUp              600ms     ease-out
2050           Case Item 4                      slideInUp              600ms     ease-out
2100           Case Item 5                      slideInUp              600ms     ease-out
```

## Hover Animation Timings

### Button Hover Effects
```
Element                Duration  Easing      Properties
─────────────────────────────────────────────────────────
Refresh Button         300ms     ease-out    border-color, shadow, overlay opacity
Export Button          300ms     ease-out    border-color, shadow, overlay opacity
```

### Card Hover Effects
```
Element                Duration  Easing      Properties
─────────────────────────────────────────────────────────
Stat Card              300ms     ease-out    icon scale, value scale, overlay opacity
Dashboard Card         300ms     ease-out    title color, shadow, overlay opacity
Log Type Card          300ms     ease-out    border color, shadow, overlay opacity
Case Item              300ms     ease-out    border color, shadow, overlay opacity
```

### Icon Animations
```
Element                Duration  Easing      Properties
─────────────────────────────────────────────────────────
Stat Card Icon         300ms     ease-out    scale (1 → 1.1), shadow
Change Arrow           300ms     ease-out    translateY (±2px)
Error Icon             infinite  ease-in-out opacity (pulse)
```

## Stagger Delay Patterns

### Stats Cards (First Row)
```
Card 1: 300ms
Card 2: 400ms (300ms + 100ms)
Card 3: 500ms (300ms + 200ms)
Card 4: 600ms (300ms + 300ms)
```

### Alert Metrics (Second Row)
```
Metric 1: 700ms
Metric 2: 800ms (700ms + 100ms)
Metric 3: 900ms (700ms + 200ms)
```

### Log Type Cards (Grid)
```
Card 1: 1200ms
Card 2: 1250ms (1200ms + 50ms)
Card 3: 1300ms (1200ms + 100ms)
Card 4: 1350ms (1200ms + 150ms)
Card 5: 1400ms (1200ms + 200ms)
```

### Recent Cases (List)
```
Case 1: 1900ms
Case 2: 1950ms (1900ms + 50ms)
Case 3: 2000ms (1900ms + 100ms)
Case 4: 2050ms (1900ms + 150ms)
Case 5: 2100ms (1900ms + 200ms)
```

## Animation Keyframes

### fadeIn
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
Duration: 600ms
Easing: ease-out
```

### slideInLeft
```css
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
Duration: 600ms
Easing: ease-out
Distance: 30px
```

### slideInUp
```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
Duration: 600ms
Easing: ease-out
Distance: 20px
```

### slideInRight
```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
Duration: 600ms
Easing: ease-out
Distance: 30px
```

### glow
```css
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(0, 225, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 225, 255, 0.6);
  }
}
Duration: 2000ms
Easing: ease-in-out
Infinite: true
```

### pulse
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
Duration: 2000ms
Easing: ease-in-out
Infinite: true
```

### shimmer
```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
Duration: 2000ms
Easing: linear
Infinite: true
Background Size: 1000px 100%
```

## Transition Timings

### Fast Transitions (Immediate Feedback)
```
Duration: 150ms - 300ms
Easing: ease-out
Use Cases: Hover effects, color changes, small transforms
```

### Medium Transitions (Smooth Animations)
```
Duration: 300ms - 500ms
Easing: ease-out
Use Cases: Page transitions, card animations, major transforms
```

### Slow Transitions (Emphasis)
```
Duration: 500ms - 1000ms
Easing: ease-in-out
Use Cases: Loading states, important state changes, emphasis effects
```

## Easing Functions

### ease-out
```
Starts fast, ends slow
Best for: Entrance animations, user-initiated actions
Curve: cubic-bezier(0.0, 0.0, 0.58, 1.0)
```

### ease-in-out
```
Starts slow, speeds up, ends slow
Best for: Continuous animations, loops, emphasis effects
Curve: cubic-bezier(0.42, 0.0, 0.58, 1.0)
```

### linear
```
Constant speed throughout
Best for: Continuous animations, shimmer effects, rotations
Curve: cubic-bezier(0.0, 0.0, 1.0, 1.0)
```

## Performance Considerations

### Animation Optimization
```
Property              GPU Accelerated  Repaints  Recommended
─────────────────────────────────────────────────────────────
transform             Yes              No        ✅ Use
opacity               Yes              No        ✅ Use
box-shadow            No               Yes       ⚠️ Use sparingly
background-color      No               Yes       ⚠️ Use sparingly
width/height          No               Yes       ❌ Avoid
left/top              No               Yes       ❌ Avoid
```

### Stagger Delay Strategy
```
Interval: 50ms - 100ms
Reason: Prevents layout thrashing
Effect: Creates visual progression
Performance: Minimal impact
```

## Browser Rendering Timeline

### Typical Page Load with Animations
```
0ms     - Page starts loading
100ms   - HTML parsed
200ms   - CSS parsed
300ms   - JavaScript executed
400ms   - First paint
500ms   - First contentful paint
600ms   - Animations begin
2400ms  - All animations complete
3000ms  - Page fully interactive
```

## Mobile Optimization

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Mobile Animation Adjustments
```
Desktop Duration: 600ms
Mobile Duration: 400ms (faster for better UX)

Desktop Stagger: 100ms
Mobile Stagger: 50ms (tighter for mobile)

Desktop Delay: 0-2400ms
Mobile Delay: 0-1600ms (shorter total time)
```

## Testing Checklist

### Animation Timing
- [ ] Page header fades in at 0ms
- [ ] Title slides in at 0ms
- [ ] Subtitle slides in at 100ms
- [ ] Stats cards stagger correctly (100ms intervals)
- [ ] All animations complete by 2400ms
- [ ] Hover effects respond immediately (300ms)

### Performance
- [ ] Animations run at 60fps
- [ ] No jank or stuttering
- [ ] GPU acceleration active
- [ ] Memory usage stable
- [ ] CPU usage reasonable

### Accessibility
- [ ] prefers-reduced-motion respected
- [ ] Animations don't interfere with focus
- [ ] Keyboard navigation smooth
- [ ] Screen readers work correctly

## Debugging Tips

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Rendering tab
3. Enable "Paint flashing" to see repaints
4. Check Animations panel for timing
5. Use Performance tab to profile

### Firefox DevTools
1. Open DevTools (F12)
2. Go to Inspector tab
3. Use Animations sidebar
4. Check Performance tab
5. Monitor frame rates

### Animation Timing Verification
```javascript
// Check animation timing in console
const element = document.querySelector('.animate-slide-in-up');
const style = window.getComputedStyle(element);
console.log('Animation:', style.animation);
console.log('Duration:', style.animationDuration);
console.log('Delay:', style.animationDelay);
```

## Conclusion

This reference provides comprehensive timing information for all animations in the SOC dashboard redesign. Use this guide for:
- Verifying animation timing
- Debugging animation issues
- Optimizing performance
- Testing accessibility
- Implementing similar animations

All timings are optimized for smooth 60fps performance while maintaining visual polish and user engagement.
