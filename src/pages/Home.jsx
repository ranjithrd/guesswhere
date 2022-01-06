import React, { useState } from "react"
import { useHistory } from "react-router-dom"
import { GameService } from "../Service"

function Home() {
	const history = useHistory()

	const [code, setCode] = useState("")
	const [error, setError] = useState()

	async function handleCode() {
		setError("Loading...")
		const existingGame = await GameService.findGameWithCode(code)
		if (existingGame) {
			history.push(`/game/${code}`)
		} else {
			setError("Game not found.")
		}
	}

	async function handleCreate() { }

	return (
		<div className="h-full w-full p-16 flex flex-col justify-between">
			<h1 className="font-bold text-2xl text-center">Guesswhere</h1>
			<div>
				<input
					id="number"
					type="number"
					value={code}
					onChange={(e) => setCode(parseInt(e.target.value))}
					className="w-full monospace text-xl mt-2 text-center font-bold"
					placeholder="Enter a code"
				/>
				<div className="h-4"></div>
				<button onClick={handleCode} className="filled">Enter</button>
				<p className="text-red-500">{error}</p>
			</div>
			<button onClick={handleCreate} className="filled">Create a Game</button>
		</div>
	)
}

export default Home
