import React, { useState } from "react"
import { useHistory } from "react-router-dom"
import { GameService } from "../Service"
import Fingerprint from "@fingerprintjs/fingerprintjs"

function Home() {
	const history = useHistory()

	const [code, setCode] = useState("")
	const [error, setError] = useState()

	async function handleCode() {
		if (code < 100000 || code > 1000000) {
			setError("Invalid code.")
		}
		setError("Loading...")
		const existingGame = await GameService.findGameWithCode(code)
		if (existingGame) {
			history.push(`/game/${code}`)
		} else {
			setError("Game not found.")
		}
	}

	async function handleCreate() {
		let randomNumber = 0
		while (
			randomNumber < 100000 ||
			randomNumber > 1000000 ||
			(await GameService.findGameWithCode(randomNumber)) !== null
		) {
			randomNumber = Math.ceil(Math.random() * 1000000)
		}
		const fp = await Fingerprint.load()
		const id = (await fp.get()).visitorId

		await GameService.updateGame(randomNumber, {
			code: randomNumber,
			expires: "2022-0-0",
			// lastAnswerer: id,
			lastQuestioner: id,
			players: JSON.stringify([id]),
			started: false,
			wouldStart: id,
		})

		history.push(`/game/${randomNumber}`)
	}

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
				<button onClick={handleCode} className="filled">
					Enter
				</button>
				<p className="text-red-500">{error}</p>
			</div>
			<button onClick={handleCreate} className="filled">
				Create a Game
			</button>
		</div>
	)
}

export default Home
