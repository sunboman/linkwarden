/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// iOS-inspired neutral palette
				glass: {
					light: 'rgba(255, 255, 255, 0.72)',
					dark: 'rgba(30, 30, 30, 0.72)',
				},
				surface: {
					light: '#f5f5f7',
					dark: '#0a0a0a',
				},
				card: {
					light: 'rgba(255, 255, 255, 0.8)',
					dark: 'rgba(44, 44, 46, 0.8)',
				},
			},
			backdropBlur: {
				glass: '20px',
			},
			boxShadow: {
				glass: '0 8px 32px rgba(0, 0, 0, 0.12)',
				'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4)',
			},
			borderRadius: {
				'xl': '16px',
				'2xl': '20px',
				'3xl': '24px',
			},
			fontFamily: {
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'SF Pro Display',
					'Segoe UI',
					'Roboto',
					'sans-serif'
				],
			},
		},
	},
	plugins: [],
}
