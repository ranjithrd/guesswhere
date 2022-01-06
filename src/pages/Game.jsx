import React, { useEffect, useState } from "react"
import "ol/ol.css"
import MapWrapper from "./Map"
import { useHistory, useParams } from "react-router-dom"
import { GameService } from "../Service"
import Fingerprint from "@fingerprintjs/fingerprintjs"

function Game() {
	const [latLongZoom, setLatLongZoom] = useState()
	const [game, setGame] = useState(null)
	const [id, setId] = useState(null)
	const [guess, setGuess] = useState("")
	const [error, setError] = useState("")
	const [sentGuess, setSentGuess] = useState(false)

	const history = useHistory()
	const params = useParams()

	// game data
	useEffect(() => {
		Fingerprint.load().then((fp) =>
			fp.get().then((f) => setId(f.visitorId))
		)
		if (params.code) {
			const findGame = GameService.findGameWithCode(params.code)
			if (findGame) {
				GameService.listenToGame(params.code, (g) => setGame(g))
			} else {
				history.replace("/")
			}
		} else {
			history.replace("/")
		}
	}, [])

	// listen and add id if necessary
	useEffect(() => {
		console.log([id, game])
		if (id && game) {
			const players = JSON.parse(game.players ?? "[]")
			if (!players.includes(id)) {
				console.log("Updating")
				GameService.updateGame(params.code, {
					players: JSON.stringify([...players, id]),
				})
			}
		}
	}, [id, game])

	async function handleSendQ() {
		setError("Loading...")
		await GameService.updateGame(params.code, {
			lastLink: {
				latlong: latLongZoom[0],
				zoom: latLongZoom[1],
				answer: null,
			},
			lastCorrect: null,
			lastQuestioner: id,
			wouldStart: null,
		})
		setError("Sent the question!")
	}

	async function handleSendA() {
		setError("Loading...")
		const answer = guess
		if (!answer) {
			setError("Fill in a guess!")
		}
		await GameService.updateGame(params.code, {
			lastLink: {
				...game.lastLink,
				answer,
			},
			lastAnswerer: id,
			lastCorrect: null,
		})
		setError("Sent guess!")
		console.log(sentGuess)
		setSentGuess(true)
		setGuess("")
	}

	function handleCorrect(correct) {
		return async () => {
			await GameService.updateGame(
				params.code,
				correct
					? {
							lastCorrect: true,
							lastLink: {},
					  }
					: {
							lastCorrect: false,
							lastLink: { ...game.lastLink, answer: null },
					  }
			)
		}
	}

	async function handleRemoveCorrection() {
		await GameService.updateGame(params.code, {
			lastCorrect: null,
		})
	}

	async function handleReady() {
		if (JSON.parse(game.players ?? "[]").length === 2) {
			await GameService.updateGame(params.code, {
				started: true,
				lastQuestioner: id,
				lastAnswerer: id,
			})
		} else {
			setError("2 players are needed to start this game!")
		}
	}

	// loading
	if (!game || !id) {
		return (
			<div className="h-screen w-screen flex flex-col justify-center text-center">
				<p>Loading...</p>
			</div>
		)
	}

	// not started yet
	if (!game.started) {
		const gameUrl = window.location.href
		function copy() {
			navigator.clipboard.writeText(gameUrl)
		}
		return (
			<div className="h-screen w-screen flex flex-col justify-center text-center p-8">
				<p>
					2 players are needed to start the game. Share the link below
					with a friend and start playing!
				</p>
				<div className="h-4"></div>
				<code>{gameUrl}</code>
				<div className="h-2"></div>
				<button className="text" onClick={copy}>
					Copy URL
				</button>
				<div className="h-4"></div>
				<div className="text-xs">OR</div>
				<div className="h-2"></div>
				<p>Use the code</p>
				<div className="text-2xl">{params.code}</div>
				<div className="h-4"></div>
				<button className="filled" onClick={handleReady}>
					Start!
				</button>
				<div className="h-4"></div>
				<p>{error}</p>
			</div>
		)
	}

	// figure out what to show
	let status
	// is there already a question?
	// if alice asked...
	if (game.lastLink?.latlong) {
		if (game.lastQuestioner === id) {
			// alice
			if (game.lastCorrect === true) {
				// bob has got the correction. waiting for him...
				status = "wait_for_question"
			} else if (game.lastCorrect === false) {
				// alice said it's wrong, waiting for bob's answer
				status = "wait_for_answer"
			} else {
				// alice has not corrected
				if (game.lastLink?.answer) {
					// alice has got the answer, needs to correct
					status = "correct"
				} else {
					// alice hasn't got any answer yet
					// if ()
					status = "wait_for_answer"
				}
			}
		} else {
			// bob
			if (game.lastCorrect === true) {
				// alice said the answer is correct
				status = "ask"
			} else if (game.lastCorrect === false) {
				// alice said the answer is wrong
				status = "answer"
			} else {
				// alice hasn't got back yet
				if (game.lastLink?.answer) {
					// bob is waiting for correction
					status = "wait_for_correction"
				} else {
					// bob didn't send any answer yet either
					status = "answer"
				}
			}
		}
		// // am i responsible to answer?
		// if (game.lastQuestioner === id) {
		// 	// is the question unanswered?
		// 	if (game.lastAnswerer === id) {
		// 		status = "wait_for_answer"
		// 	} else {
		// 		status = "correct"
		// 	}
		// } else {
		// 	// did i finish answering
		// 	if (game.lastAnswerer === id) {
		// 		status = "wait_for_correction"
		// 	} else {
		// 		status = "answer"
		// 	}
		// }
	} else {
		// am i responsible for it?
		if (game.lastQuestioner === id) {
			status = "wait_for_question"
		} else {
			status = "ask"
		}
	}

	if (game.wouldStart && !game.lastLink?.latlong && game.started) {
		if (game.wouldStart === id) {
			status = "ask"
		} else {
			status = "wait_for_question"
		}
	}

	console.log(status)

	switch (status) {
		case "wait_for_answer":
			return (
				<div className="h-screen w-screen flex flex-col justify-center text-center">
					<p>Waiting for the other player to answer...</p>
				</div>
			)
		case "correct":
			return (
				<div className="h-screen w-screen flex flex-col justify-center text-center p-4">
					<MapWrapper
						defaultLatLong={[
							game.lastLink.latlong,
							game.lastLink.zoom,
						]}
						showOverlay={true}
					/>
					<p>Check this answer:</p>
					<h4 className="text-xl font-bold">
						{game.lastLink?.answer}
					</h4>
					<div className="h-2"></div>
					<div className="flex flex-row">
						<button
							className="filled"
							onClick={handleCorrect(true)}
						>
							Correct
						</button>
						<div className="w-2"></div>
						<button
							className="filled"
							onClick={handleCorrect(false)}
						>
							Wrong
						</button>
					</div>
				</div>
			)
		case "wait_for_correction":
			return (
				<div className="h-screen w-screen flex flex-col justify-center text-center">
					<p>Waiting for the other player to correct...</p>
				</div>
			)
		case "answer":
			break
		case "ask":
			break
		case "wait_for_question":
			return (
				<div className="h-screen w-screen flex flex-col justify-center text-center">
					<p>
						Waiting for the other player to send you a question...
					</p>
				</div>
			)
		default:
			return <p>You broke logic</p>
	}

	// if (sentGuess && game.lastCorrect === false) {
	// 	setError("Wrong answer! Try again.")
	// }

	if (sentGuess && game.lastCorrect === true) {
		alert("You got that question right!")
		setSentGuess(false)
	}

	return (
		<div className="h-full w-full p-16">
			<div className="flex flex-row justify-between items-center">
				<h1 className="text-2xl font-bold">Guesswhere</h1>
				{/* <button className="text">Add Someone</button> */}
			</div>
			<div className="h-2"></div>
			{status === "ask" ? (
				<>
					<div>
						<MapWrapper
							handleLatLongZoom={(p) => setLatLongZoom(p)}
							showOverlay={true}
						/>
						{latLongZoom ? (
							<div>
								<div className="h-2"></div>
								<p>{latLongZoom[0]}</p>
								<p className="text-xs">
									Drag and pinch to move around
								</p>
							</div>
						) : (
							<p>Choose a place on the map</p>
						)}
					</div>
					<div className="h-2"></div>
					<button className="filled" onClick={handleSendQ}>
						Send!
					</button>
				</>
			) : (
				<>
					<div>
						<MapWrapper
							defaultLatLong={[
								game.lastLink.latlong,
								game.lastLink.zoom,
							]}
						/>
						<div className="h-8"></div>
						<p>Type in where you think this is</p>
						<p className="text-xs">
							The other player will review this
						</p>
						<div className="h-4"></div>
						<input
							type="text"
							placeholder="E.g New York"
							className="w-full"
							value={guess}
							onChange={(e) => setGuess(e.target.value)}
						/>
						<div className="h-4"></div>
						<button className="filled" onClick={handleSendA}>
							Guess!
						</button>
					</div>
				</>
			)}
			<p className="margin-2 text-red-500 font-bold">{error}</p>
		</div>
	)
}

export default Game
