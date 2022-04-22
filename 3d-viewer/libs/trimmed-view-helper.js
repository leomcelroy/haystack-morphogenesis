// adopted https://raw.githubusercontent.com/mrdoob/three.js/dev/editor/js/Viewport.ViewHelper.js

import * as THREE from './three.module.js';

function getSpriteMaterial( color, text = null ) {

	var canvas = document.createElement( 'canvas' );
	canvas.width = 64;
	canvas.height = 64;

	var context = canvas.getContext( '2d' );
	context.beginPath();
	context.arc( 32, 32, 16, 0, 2 * Math.PI );
	context.closePath();
	context.fillStyle = color.getStyle();
	context.fill();

	if ( text !== null ) {

		context.font = '24px Arial';
		context.textAlign = 'center';
		context.fillStyle = '#000000';
		context.fillText( text, 32, 41 );

	}

	var texture = new THREE.CanvasTexture( canvas );

	return new THREE.SpriteMaterial( { map: texture, toneMapped: false } );

}

function getAxisMaterial( color ) {

	return new THREE.MeshBasicMaterial( { color: color, toneMapped: false } );

}

function ViewHelper( editorCamera, container ) {

	const group = new THREE.Object3D();

	var color1 = new THREE.Color( '#ff3653' );
	var color2 = new THREE.Color( '#8adb00' );
	var color3 = new THREE.Color( '#2c8fff' );

	// highlight sprite
	var highlight = new THREE.Color( '#ffff00' );
	var highlightMaterial = getSpriteMaterial( highlight );
	group.highlightMaterial = highlightMaterial;


	var camera = new THREE.OrthographicCamera( - 2, 2, 2, - 2, 0, 4 );
	group.camera = camera;
	camera.position.set( 0, 0, 2 );

	var geometry = new THREE.BoxGeometry( 0.8, 0.05, 0.05 ).translate( 0.4, 0, 0 );

	var xAxis = new THREE.Mesh( geometry, getAxisMaterial( color1 ) );
	var yAxis = new THREE.Mesh( geometry, getAxisMaterial( color2 ) );
	var zAxis = new THREE.Mesh( geometry, getAxisMaterial( color3 ) );

	yAxis.rotation.z = Math.PI / 2;
	zAxis.rotation.y = - Math.PI / 2;

	group.add( xAxis );
	group.add( zAxis );
	group.add( yAxis );

	var posXAxisHelper = new THREE.Sprite( getSpriteMaterial( color1, 'X' ) );
	posXAxisHelper.userData.type = 'posX';
	var posYAxisHelper = new THREE.Sprite( getSpriteMaterial( color2, 'Y' ) );
	posYAxisHelper.userData.type = 'posY';
	var posZAxisHelper = new THREE.Sprite( getSpriteMaterial( color3, 'Z' ) );
	posZAxisHelper.userData.type = 'posZ';
	var negXAxisHelper = new THREE.Sprite( getSpriteMaterial( color1 ) );
	negXAxisHelper.userData.type = 'negX';
	var negYAxisHelper = new THREE.Sprite( getSpriteMaterial( color2 ) );
	negYAxisHelper.userData.type = 'negY';
	var negZAxisHelper = new THREE.Sprite( getSpriteMaterial( color3 ) );
	negZAxisHelper.userData.type = 'negZ';

	posXAxisHelper.position.x = 1;
	posYAxisHelper.position.y = 1;
	posZAxisHelper.position.z = 1;
	negXAxisHelper.position.x = - 1;
	negXAxisHelper.scale.setScalar( 0.8 );
	negYAxisHelper.position.y = - 1;
	negYAxisHelper.scale.setScalar( 0.8 );
	negZAxisHelper.position.z = - 1;
	negZAxisHelper.scale.setScalar( 0.8 );

	group.add( posXAxisHelper );
	group.add( posYAxisHelper );
	group.add( posZAxisHelper );
	group.add( negXAxisHelper );
	group.add( negYAxisHelper );
	group.add( negZAxisHelper );

	var point = new THREE.Vector3();
	var dim = 128;
	var turnRate = 2 * Math.PI; // turn rate in angles per second

	group.render = function ( renderer ) {

		group.quaternion.copy( editorCamera.quaternion ).invert();
		group.updateMatrixWorld();

		point.set( 0, 0, 1 );
		point.applyQuaternion( editorCamera.quaternion );

		if ( point.x >= 0 ) {

			posXAxisHelper.material.opacity = 1;
			negXAxisHelper.material.opacity = 0.5;

		} else {

			posXAxisHelper.material.opacity = 0.5;
			negXAxisHelper.material.opacity = 1;

		}

		if ( point.y >= 0 ) {

			posYAxisHelper.material.opacity = 1;
			negYAxisHelper.material.opacity = 0.5;

		} else {

			posYAxisHelper.material.opacity = 0.5;
			negYAxisHelper.material.opacity = 1;

		}

		if ( point.z >= 0 ) {

			posZAxisHelper.material.opacity = 1;
			negZAxisHelper.material.opacity = 0.5;

		} else {

			posZAxisHelper.material.opacity = 0.5;
			negZAxisHelper.material.opacity = 1;

		}

		var x = container.offsetWidth - dim;

		renderer.clearDepth();
		renderer.setViewport( x, 0, dim, dim );
		renderer.render( group, camera );

	};

	return group;
}

export { ViewHelper };
