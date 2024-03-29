module.exports = {
	purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
	darkMode: false, // or 'media' or 'class'
	theme: {
		extend: {},
		fontFamily: {
			sans: ["Rubik", "ui-sans-serif", "system-ui", "sans-serif"],
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
	mode: "jit",
}
