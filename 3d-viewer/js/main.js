import { initThree } from "./initThree.js";
import * as THREE from "../libs/three.module.js";
import { addDropUpload } from "./addDropUpload.js";
import { createLayers } from "./createLayers.js";

window.addEventListener("load", () => {
	const { scene } = initThree();
	addDropUpload(createLayers(scene));
});