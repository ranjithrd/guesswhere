import {
	getDatabase,
	ref,
	get,
	child,
	update,
	onValue,
} from "firebase/database"

export class GameService {
	static async findGameWithCode(code) {
		const db = ref(getDatabase())
		const gameR = await get(child(db, `/games/${code}`))
		console.log(gameR.val())
		return gameR.val()
	}

	static async updateGame(code, data) {
		const db = ref(getDatabase())
		await update(child(db, `/games/${code}`), data)
		const gameR = await get(child(db, `/games/${code}`))
		console.log(gameR.val())
		return gameR.val()
	}

	static async listenToGame(code, listener) {
		const db = ref(getDatabase())
		const r = child(db, `/games/${code}`)
		onValue(r, (snapshot) => {
			listener(snapshot.val())
		})
	}
}
