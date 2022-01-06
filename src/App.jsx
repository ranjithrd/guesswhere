import React, { useEffect, useState } from "react"
import { Route, BrowserRouter, Switch } from "react-router-dom"
import Home from "./pages/Home"
import Game from "./pages/Game"
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"

function App() {
	const [initialised, setInitialised] = useState(false)

	useEffect(() => {
		const firebaseConfig = {
			apiKey: "AIzaSyAu7zq5CML0gVZinf8KAFQrw2NvxhldozI",
			authDomain: "guesswhere-1.firebaseapp.com",
			projectId: "guesswhere-1",
			storageBucket: "guesswhere-1.appspot.com",
			messagingSenderId: "949545805765",
			appId: "1:949545805765:web:7f193081069a7ad7920dac",
			measurementId: "G-4JZ9FQM5V4",
		}
		const app = initializeApp(firebaseConfig)
		const analytics = getAnalytics(app)
		if (app) {
			setInitialised(true)
		}
		console.log("Initialised Firebase.")
	}, [])

	if (!initialised) {
		return (
			<div className="h-screen w-screen flex flex-col justify-center text-center">
				<p>Loading...</p>
			</div>
		)
	}

	return (
		<div className="w-screen h-screen overflow-none bg-gray-50">
			<BrowserRouter>
				<Switch>
					<Route path="/game/:code" children={<Game />} />
					<Route path="/" children={<Home />} />
				</Switch>
			</BrowserRouter>
		</div>
	)
}

export default App
