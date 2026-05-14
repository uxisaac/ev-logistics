'use client'

import { useEffect, useState } from 'react'

export function useCSSColor(variable: string, fallback: string): string {
  const [color, setColor] = useState(fallback)
  useEffect(() => {
    function resolve() {
      const el = document.createElement('div')
      el.style.cssText = `color: var(${variable}); position: absolute; visibility: hidden;`
      document.body.appendChild(el)
      const resolved = getComputedStyle(el).color
      document.body.removeChild(el)
      if (resolved) setColor(resolved)
    }
    resolve()
    const observer = new MutationObserver(resolve)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [variable])
  return color
}
