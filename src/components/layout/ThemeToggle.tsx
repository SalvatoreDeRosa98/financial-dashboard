import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      type="button"
    >
      <span>{isDark ? 'Tema chiaro' : 'Tema scuro'}</span>
      <span className={`toggle-indicator ${isDark ? 'is-dark' : ''}`} />
    </button>
  )
}
