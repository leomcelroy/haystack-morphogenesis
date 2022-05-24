import { flattenSVG } from "./flattenSVG.js";

const svgToPls = (txt) => {
  const temp = document.querySelector("#temp");
  temp.innerHTML = txt;
  const paths = flattenSVG(temp);

  return paths;
}

const txt = `
<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <defs></defs>
  <rect x="125.416" y="157.158" width="139.829" height="128.616" style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);"></rect>
  <ellipse style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);" cx="122.464" cy="337.43" rx="39.083" ry="68.669" transform="matrix(0.863453, 0.504429, -0.504429, 0.863453, 177.543336, -38.921051)"></ellipse>
  <ellipse style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);" cx="249.315" cy="307.758" rx="45.31" ry="85.108"></ellipse>
  <path style="fill: rgb(216, 216, 216); stroke: rgb(0, 0, 0);" d="M 139.689 168.038 C 139.689 157.677 116.359 120.229 120.347 110.676 C 135.182 75.139 189.054 51.974 225.105 68.474 C 254.616 81.98 267.069 109.053 280.582 136.078 C 283.284 141.482 247.839 170.031 247.839 175.444"></path>
</svg>

`

console.log(svgToPls(txt));