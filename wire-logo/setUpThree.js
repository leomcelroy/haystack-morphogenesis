
export function setUpThree(state) {
  const scene = new THREE.Scene();
  state.scene = scene;
  const camera = new THREE.PerspectiveCamera( 75, 1, 0.0001, 10000 );
  state.camera = camera;
  // camera.position.z = 100;
  const renderer = new THREE.WebGLRenderer({});
  state.renderer = renderer;
  renderer.setSize( 512,512 );
  const container = document.querySelector(".model");
  container.appendChild( renderer.domElement );
  const material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});
  const controls = new THREE.OrbitControls( camera, renderer.domElement );


  camera.position.set(0,0,100);
  controls.update();

  function resizeCanvasToDisplaySize() {
    // look up the size the canvas is being displayed
    const container = document.querySelector(".model");
    let rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // update the size
    renderer.setSize(width, height);

    // update the camera
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth/canvas.clientHeight;
    camera.updateProjectionMatrix();

    camera.position.set(0,0,100);
    controls.update();
  }

  window.addEventListener("resize", resizeCanvasToDisplaySize); 

  // why?, idk
  setTimeout(resizeCanvasToDisplaySize, 10);
}