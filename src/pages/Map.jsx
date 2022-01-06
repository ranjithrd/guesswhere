import React, { useState, useRef, useEffect } from "react"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import XYZ from "ol/source/XYZ"
import { defaults } from "ol/interaction"
import { toStringXY } from "ol/coordinate"

function coord3857To4326(coord) {
	const e_value = 2.7182818284
	const X = 20037508.34

	const lat3857 = coord[1]
	const long3857 = coord[0]

	//converting the longitute from epsg 3857 to 4326
	const long4326 = (long3857 * 180) / X

	//converting the latitude from epsg 3857 to 4326 split in multiple lines for readability
	let lat4326 = lat3857 / (X / 180)
	const exponent = (Math.PI / 180) * lat4326

	lat4326 = Math.atan(Math.pow(e_value, exponent))
	lat4326 = lat4326 / (Math.PI / 360) // Here is the fixed line
	lat4326 = lat4326 - 90

	return [lat4326, long4326]
}

function coord4326To3857(coord) {
	const X = 20037508.34

	let long3857 = (coord.lng * X) / 180

	let lat3857 = parseFloat(coord.lat) + 90
	lat3857 = lat3857 * (Math.PI / 360)
	lat3857 = Math.tan(lat3857)
	lat3857 = Math.log(lat3857)
	lat3857 = lat3857 / (Math.PI / 180)

	lat3857 = (lat3857 * X) / 180

	// return {lat:lat3857, lng:long3857};
	return [long3857, lat3857]
}

function MapWrapper({ handleLatLongZoom, defaultLatLong }) {
	// set intial state - used to track references to OpenLayers
	//  objects for use in hooks, event handlers, etc.
	const [map, setMap] = useState()
	const [featuresLayer, setFeaturesLayer] = useState()

	// get ref to div element - OpenLayers will render into this div
	const mapElement = useRef()

	function changedMap(e) {
		console.log("Changed")
		const state = e.frameState.viewState
		const coordinates = coord3857To4326(state.center)
		const latlong = toStringXY(coordinates, 5)
		if (handleLatLongZoom) {
			handleLatLongZoom([latlong, state.zoom])
		}
	}

	useEffect(() => {
		// create and add vector source layer
		const initalFeaturesLayer = new VectorLayer({
			source: new VectorSource(),
		})

		// create map
		const initialMap = new Map({
			target: mapElement.current,
			layers: [
				// USGS Topo
				new TileLayer({
					source: new XYZ({
						url:
							"https://services.arcgisonline.com/arcgis/rest/services/" +
							"ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}",
						maxZoom: 15,
						projection: "EPSG:4326",
						tileSize: 512, // the tile size supported by the ArcGIS tile service
						maxResolution: 180 / 512, // Esri's tile grid fits 180 degrees on one 512 px tile
						wrapX: true,
					}),
				}),

				initalFeaturesLayer,
			],
			view: defaultLatLong
				? new View({
						projection: "EPSG:3857",
						center: coord4326To3857({
							lat: defaultLatLong[0].split(", ")[0],
							lng: defaultLatLong[0].split(", ")[1],
						}),
						// center: [1, 1],
						constrainOnlyCenter: true,
						zoom: defaultLatLong[1],
				  })
				: new View({
						projection: "EPSG:3857",
						center: [0, 0],
						zoom: 2,
				  }),
			controls: [],
			interactions: defaultLatLong ? [] : defaults(),
		})

		if (defaultLatLong) {
		} else {
			initialMap.on("moveend", changedMap)
			initialMap.on("change:size", changedMap)
			initialMap.on("change:view", changedMap)
		}

		// save map and vector layer references to state
		setMap(initialMap)
		setFeaturesLayer(initalFeaturesLayer)
	}, [])

	return (
		<div
			ref={mapElement}
			className={defaultLatLong ? "inactive" : "map-container"}
		></div>
	)
}

export default MapWrapper
