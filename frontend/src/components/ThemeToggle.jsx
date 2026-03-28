import React, { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  function toggle() {
    setIsDark(!isDark)
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      style={{
        position:       'fixed',
        top:            20,
        right:          24,
        zIndex:         999,
        background:     'var(--surface)',
        border:         '1px solid var(--border)',
        borderRadius:   10,
        width:          42,
        height:         42,
        cursor:         'pointer',
        fontSize:       18,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        transition:     'all 0.2s',
        color:          'var(--text)',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
// ```
// ---

// ## How the priority works
// ```
// 1. User has manually toggled before  →  use localStorage value
// 2. First time visit, no saved pref   →  use system/browser setting
// 3. System has no preference set      →  defaults to dark