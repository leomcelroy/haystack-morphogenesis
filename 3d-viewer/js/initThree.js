import * as THREE from "../libs/three.module.js";
import { OrbitControls } from "../libs/orbit-controls.js";
// import { ViewHelper as vh } from "../libs/trimmed-view-helper.js";

import { STLLoader } from "../libs/STLLoader.js";

export function initThree() {
	const target = document.getElementById("three-target");
	const width = target.clientWidth;
	const height = target.clientHeight;

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );

	const renderer = new THREE.WebGLRenderer();

	const raycaster = new THREE.Raycaster();
	const cameramouse = new THREE.Vector2();
	const mouse = new THREE.Vector2();


	// controls
	const controls = new OrbitControls( camera, renderer.domElement );
	// const helper = vh( camera, renderer.domElement );

	function resizeCanvasToDisplaySize() {
		// look up the size the canvas is being displayed
		const target = document.getElementById("three-target");
		const width = target.clientWidth;
		const height = target.clientHeight;
		console.log(width, height);

		
		// update the size
	    renderer.setSize(width, height)

	    // update the camera
	    const canvas = renderer.domElement
	    camera.aspect = canvas.clientWidth/canvas.clientHeight
	    camera.updateProjectionMatrix()
	}

	window.addEventListener("resize", resizeCanvasToDisplaySize);

	function onMouseMove( event ) {
		let target = document.querySelector(".camera-angle");
		var rect = event.target.getBoundingClientRect();
		var x = event.clientX - rect.left; //x position within the element.
		var y = event.clientY - rect.top;  //y position within the element.
		let width = target.clientWidth;
		let height = target.clientHeight;


		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components

		cameramouse.x = ( x / width ) * 2 - 1;
		cameramouse.y = - ( y / height ) * 2 + 1;

		target = document.querySelector("#three-target");
		rect = event.target.getBoundingClientRect();
		x = event.clientX - rect.left; //x position within the element.
		y = event.clientY - rect.top;  //y position within the element.
		width = target.clientWidth;
		height = target.clientHeight;


		// calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components

		mouse.x = ( x / width ) * 2 - 1;
		mouse.y = - ( y / height ) * 2 + 1;
	}

	target.addEventListener("pointermove", onMouseMove);

	renderer.setSize( width, height );
	target.appendChild( renderer.domElement );

	const size = 10;
	const divisions = 10;

	const gridHelper = new THREE.GridHelper( size, divisions );

	// var spotLight = new THREE.SpotLight(0xffffff);
	// var light = new THREE.DirectionalLight(0xffffff, 1);
	var light = new THREE.AmbientLight(0xffffff, 1);

	// light.rotation.z = 30;
	// spotLight.position.set(200, 400, 300);
	scene.add(light);

    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshLambertMaterial({color: 0xff00ff})	
    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)

    var loader = new STLLoader();
    var group = new THREE.Object3D();
    loader.load("/assets/test.stl", function (geometry) {
        console.log(geometry);
        const material = new THREE.MeshLambertMaterial({color: 0xff00ff})	
        group = new THREE.Mesh(geometry, material);
        // group.rotation.x = -0.5 * Math.PI;
        group.scale.set(0.01, 0.01, 0.01);
        scene.add(group);
        renderer.render( scene, camera );
    });

	camera.position.z = 5;

	const overlay = f => {
		renderer.autoClear = false;
		f();
		renderer.autoClear = true;
	}

	let INTERSECTED0 = null;
	let INTERSECTED1 = null;

	function animate() {
		requestAnimationFrame( animate );

		// raycaster.setFromCamera( mouse, camera );
		// // calculate objects intersecting the picking ray
		// let intersects0 = raycaster.intersectObjects( scene.children );
		// if ( intersects0.length > 0 ) {
		// 	if ( INTERSECTED0 != intersects0[ 0 ].object ) {
		// 		if ( INTERSECTED0 ) INTERSECTED0.material.color.set( INTERSECTED0.currentColor );

		// 		INTERSECTED0 = intersects0[ 0 ].object;
		// 		INTERSECTED0.currentColor = INTERSECTED0.material.color.getHex();
		// 		INTERSECTED0.material.color.set( "rgb(255, 255, 0)" );
		// 	}
		// } else {
		// 	if ( INTERSECTED0 ) INTERSECTED0.material.color.set( INTERSECTED0.currentColor );
		// 	INTERSECTED0 = null;
		// }

		renderer.setViewport( 0, 0, target.clientWidth, target.clientHeight );
		scene.add( gridHelper );
		renderer.render( scene, camera );
		scene.remove( gridHelper );

		// update the picking ray with the camera and cameramouse position
		// var dim = 128;
		// var x = target.offsetWidth - dim;
		// renderer.setViewport( x, 0, dim, dim );

		// raycaster.setFromCamera( cameramouse, helper.camera );
		// // calculate objects intersecting the picking ray
		// let intersects1 = raycaster.intersectObjects( helper.children );
		// if ( intersects1.length > 0 ) {
		// 	if ( INTERSECTED1 != intersects1[ 0 ].object && intersects1[ 0 ].object.type === "Sprite") {
		// 		if ( INTERSECTED1 ) INTERSECTED1.material = INTERSECTED1.currentMaterial;

		// 		INTERSECTED1 = intersects1[ 0 ].object;
		// 		INTERSECTED1.currentMaterial = INTERSECTED1.material;
		// 		INTERSECTED1.material = helper.highlightMaterial;

		// 	}
		// } else {
		// 	if ( INTERSECTED1 ) INTERSECTED1.material = INTERSECTED1.currentMaterial;

		// 	INTERSECTED1 = null;
		// }

		// overlay(() => helper.render(renderer))

	}

	animate();

	return { scene }
}