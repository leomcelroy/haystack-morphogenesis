import { renderApp } from "./index.js";

function init(state) {
  renderApp();
  addEvents(state);

  const anim = document.querySelector(".sequence-anim");
  anim.width = state.image_width;
  anim.height = state.image_height;

  const scene = new THREE.Scene();
  state.scene = scene;
  const camera = new THREE.PerspectiveCamera( 75, 1, 0.0001, 10000 );
  // camera.position.z = 100;
  const renderer = new THREE.WebGLRenderer({});
  renderer.setSize( 512,512 );
  const container = document.querySelector(".model-container");
  container.appendChild( renderer.domElement );
  const material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});
  const controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.set(0,0,100);
  controls.update();

  function resizeCanvasToDisplaySize() {
    // look up the size the canvas is being displayed
    const container = document.querySelector(".model-container");
    let rect = container.getBoundingClientRect();
    const container2 = document.querySelector(".model-viewer");
    let rect2 = container2.getBoundingClientRect();
    console.log(rect);
    const width = rect.width;
    const height = rect.height;
    // console.log(width, height);

    // update the size
    renderer.setSize(width, height);

    // update the camera
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth/canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  window.addEventListener("resize", resizeCanvasToDisplaySize); 

  // why?, idk
  setTimeout(resizeCanvasToDisplaySize, 10);
}