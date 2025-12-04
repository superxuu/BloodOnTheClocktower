/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                void: 'var(--color-void)',
                night: 'var(--color-night)',
                blood: 'var(--color-blood)',
                gold: 'var(--color-gold)',
                'gold-light': '#f0d060',
                ghost: 'var(--color-ghost)',
                mist: 'var(--color-mist)',
                'glass-border': 'var(--glass-border)',
            },
            fontFamily: {
                serif: ['Cinzel', 'serif'],
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                fadeIn: 'fadeIn 0.3s ease-out forwards',
            },
        },
    },
    plugins: [],
}
