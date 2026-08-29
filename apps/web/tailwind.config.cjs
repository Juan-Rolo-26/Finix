/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: { "2xl": "1400px" },
        },
        extend: {
            /* ── Typography scale (Inter-optimised) ── */
            fontSize: {
                '2xs': ['11px', { lineHeight: '1.4', letterSpacing: '0.01em' }],
                xs: ['12px', { lineHeight: '1.5' }],
                sm: ['13px', { lineHeight: '1.5' }],
                base: ['14px', { lineHeight: '1.6' }],
                md: ['15px', { lineHeight: '1.6' }],
                lg: ['16px', { lineHeight: '1.55' }],
                xl: ['18px', { lineHeight: '1.45' }],
                '2xl': ['20px', { lineHeight: '1.4' }],
                '3xl': ['24px', { lineHeight: '1.3' }],
                '4xl': ['30px', { lineHeight: '1.2' }],
                '5xl': ['36px', { lineHeight: '1.15' }],
                '6xl': ['48px', { lineHeight: '1.1' }],
                '7xl': ['56px', { lineHeight: '1.05' }],
            },
            /* ── Font families ── */
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
                heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            /* ── Design tokens → Tailwind utilities ── */
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                brand: {
                    DEFAULT: "hsl(var(--brand))",
                    foreground: "hsl(var(--brand-foreground))",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                },
                danger: {
                    DEFAULT: "hsl(var(--danger))",
                    foreground: "hsl(var(--danger-foreground))",
                },
                info: {
                    DEFAULT: "hsl(var(--info))",
                    foreground: "hsl(var(--info-foreground))",
                },
            },
            backgroundImage: {
                'gradient-hero': 'var(--gradient-hero)',
                'gradient-card': 'var(--gradient-card)',
                'gradient-accent': 'var(--gradient-accent)',
                'gradient-primary-glow': 'var(--gradient-primary-glow)',
            },
            boxShadow: {
                'glow': 'var(--shadow-glow)',
                'card': 'var(--shadow-card)',
                'elevated': 'var(--shadow-elevated)',
                'intense': 'var(--shadow-intense)',
            },
            borderRadius: {
                '2xs': '4px',
                xs: '6px',
                sm: '8px',
                DEFAULT: '10px',
                md: '12px',
                lg: 'var(--radius)',          /* 14px */
                xl: 'calc(var(--radius) + 4px)', /* 18px */
                '2xl': 'calc(var(--radius) + 8px)', /* 22px */
                '3xl': '24px',
                full: '9999px',
            },
            spacing: {
                '4.5': '18px',
                '13': '52px',
                '15': '60px',
                '18': '72px',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "spin-slow": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                },
                "fade-in": {
                    from: { opacity: "0", transform: "translateY(6px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "scale-in": {
                    from: { opacity: "0", transform: "scale(0.95)" },
                    to: { opacity: "1", transform: "scale(1)" },
                },
                "slide-up": {
                    from: { opacity: "0", transform: "translateY(12px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
                "slide-in-left": {
                    from: { opacity: "0", transform: "translateX(-8px)" },
                    to: { opacity: "1", transform: "translateX(0)" },
                },
                "pulse-subtle": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.6" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "spin-slow": "spin-slow 3s linear infinite",
                "fade-in": "fade-in 0.3s ease-out both",
                "scale-in": "scale-in 0.2s ease-out both",
                "slide-up": "slide-up 0.32s ease-out both",
                "slide-in-left": "slide-in-left 0.28s ease-out both",
                "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
            },
            transitionTimingFunction: {
                'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
