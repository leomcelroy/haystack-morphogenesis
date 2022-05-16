import { render, html, svg } from 'https://unpkg.com/uhtml?module';

import { fragl } from "../helpers/fragl.js";


const state = {}

const view = state => html`
	<style>
		html, body {
			margin: 0px;
			width: 100vw;
			height: 100vh;
		}

		.root {
			width: 100%;
			height: 100%;
			display: flex;
			justify-content: center;
    	align-items: center;
		}

		.c {
			border: solid black 2px;
		}
	</style>
	<div class="root">
		<canvas class="c"></canvas>
	</div>
`

const r = () => {
	render(document.body, view(state));
}

r(document.body, view(state));
const canvas = document.querySelector(".c");
// const ctx = canvas.getContext("2d");

const WIDTH = 300;
const HEIGHT = 300;

canvas.width = WIDTH;
canvas.height = HEIGHT;

const { createFunction, createTexture } = fragl(canvas);

console.log(canvas);

const channels = 4
const dataInt8 = new Uint8ClampedArray(WIDTH*HEIGHT*channels);

for (let x = 0; x < WIDTH; x += 1) {
	for (let y = 0; y < HEIGHT; y += 1) {
		const i = (y*WIDTH+x)*channels;
		dataInt8[i + 0] = x < 100 ? 255 : 0;
		dataInt8[i + 1] = x < 200 ? 255 : 0;
		dataInt8[i + 2] = y < 150 ? 140 : 0;
		dataInt8[i + 3] = 255;
	}
}

const dataFloat = new Float32Array(WIDTH*HEIGHT);

for (let x = 0; x < WIDTH; x += 1) {
	for (let y = 0; y < HEIGHT; y += 1) {
		const i = (y*WIDTH+x)*channels;
		dataFloat[i] = x < 100 ? 1.0 : 0;
	}
}

const tex0 = createTexture(dataInt8);

const testFragl = createFunction({
	frag: `#version 300 es
    precision mediump float;
    precision highp sampler2D;

    uniform sampler2D tex0;
    uniform sampler2D last;
    uniform vec2 resolution;
    // uniform int widthBytes;

    out vec4 outColor;

    void main() {

    	float x = (gl_FragCoord.x - 2.0 + 1.0)/resolution.x;
    	float y = (gl_FragCoord.y - 2.0 + 1.0)/resolution.y;

    	vec4 texColor = texture(tex0, vec2(x, y));
    	vec4 lastColor = texture(last, vec2(x, y));

    	float r = texColor.r;
    	float g = texColor.g;
    	float b = texColor.b;
    	float a = texColor.a;

    	// if (lastColor.r > 0.0) {
    	// 	r = lastColor.r;
    	// }

    	outColor = vec4(r, g, b, a);
    }
	`,
	uniforms: [ // 1 2 3 4 | i f | tex
		["resolution", "2f"], 
		["tex0", "tex"]
	],
	useLast: "last"
})

setInterval(() => {
	testFragl({
		resolution: [canvas.width, canvas.height],
		tex0
	})
}, 100)





