import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
	theme: ResolvedTheme
	themePreference: Theme
	setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [themePreference, setThemePreference] = useState<Theme>(() => {
		const stored = localStorage.getItem('theme') as Theme
		return stored || 'system'
	})

	const [theme, setResolvedTheme] = useState<ResolvedTheme>('dark')

	useEffect(() => {
		const updateTheme = () => {
			let resolved: ResolvedTheme
			if (themePreference === 'system') {
				resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
			} else {
				resolved = themePreference
			}
			setResolvedTheme(resolved)

			// Apply to DOM
			if (resolved === 'dark') {
				document.documentElement.classList.add('dark')
			} else {
				document.documentElement.classList.remove('dark')
			}
		}

		updateTheme()

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
		mediaQuery.addEventListener('change', updateTheme)
		return () => mediaQuery.removeEventListener('change', updateTheme)
	}, [themePreference])

	const setTheme = (newTheme: Theme) => {
		setThemePreference(newTheme)
		localStorage.setItem('theme', newTheme)
	}

	return (
		<ThemeContext.Provider value= {{ theme, themePreference, setTheme }
}>
	{ children }
	</ThemeContext.Provider>
  )
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}
	return context
}
