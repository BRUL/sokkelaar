import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';

let camera, scene, renderer, object;
let cutlist;

init();
render();

function init() {

	// INPUT DIMENSIONS VIA URL
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	const URLLength = urlParams.get('l');
	const URLWidth = urlParams.get('w');
	const URLHeight = urlParams.get('h');
	const URLThickness = urlParams.get('t');

	const soccleLength = parseInt(URLLength) || 800;
	const soccleWidth = parseInt(URLWidth) || 500;
	const soccleHeight = parseInt(URLHeight) || 95;
	const soccleThickness = parseInt(URLThickness) || 18;

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xf0f0f0 );

	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(2000, 5000, 3000);
	scene.add(directionalLight);

	// Setting up camera
	camera = new THREE.PerspectiveCamera( 44, 2, 1, 10000 );

	const zf = 0.8; // Zoom factor
	camera.position.set(-(soccleLength/2)*zf, soccleLength*zf, soccleLength*2*zf);

	// Set up renderer
	renderer = new THREE.WebGLRenderer({ canvas: document.querySelector(".app canvas"), antialias: true });
	renderer.setPixelRatio( window.devicePixelRatio );

	const resizeObserver = new ResizeObserver(resizeCanvasToDisplaySize);
	resizeObserver.observe(renderer.domElement, {box: 'content-box'});

	const controls = new OrbitControls( camera, renderer.domElement );
					controls.screenSpacePanning = true;
					controls.addEventListener( 'change', render ); // use if there is no animation loop
					controls.minDistance = 1000;
					controls.maxDistance = 10000;
					controls.enableZoom = true;
					controls.update();



	const soccle = createSoccle(soccleLength,soccleWidth,soccleHeight,soccleThickness);
	scene.add(soccle);

	document.querySelector(".data #length").innerHTML = soccleLength;
	document.querySelector(".data #width").innerHTML = soccleWidth;
	document.querySelector(".data #height").innerHTML = soccleHeight;

	cutlist.splice(0,0, ["Lengte","Breedte","Aantal"]);
	document.body.insertAdjacentHTML('beforeend', createTable(cutlist));
}

function render() {
    renderer.render(scene, camera)
}

function resizeCanvasToDisplaySize() {
	// Lookup the size the browser is displaying the canvas in CSS pixels.
	const canvas = renderer.domElement;
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  const needResize = canvas.width  !== displayWidth ||
                     canvas.height !== displayHeight;

  if (needResize) {
    // Make the canvas the same size
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
		renderer.setSize(displayWidth, displayHeight, false);
		camera.aspect = displayWidth / displayHeight;
		camera.updateProjectionMatrix();
  }

	render();
  return needResize;

}

function createSoccle(length, width, height, thickness, nailerWidth = 100, maxDistance = 600){
  const material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
	const wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, transparent: true } );

	const group = new THREE.Group();
	cutlist = [];

	const gFront = new THREE.Mesh(new THREE.BoxGeometry(length, height, thickness) ,material);
	gFront.position.x = length/2;
	gFront.position.y = height/2;
	gFront.position.z = thickness/2;
	group.add( gFront );

	const gBack = gFront.clone();
	gBack.position.z = thickness/2 + width -thickness;
	group.add( gBack );

	cutlist.push([length, height, 2]);

	let gAcross;

	if(length < (nailerWidth * 3)) {
		gAcross = new THREE.Mesh(new THREE.BoxGeometry(length,thickness, width - 2 * thickness) ,material);
		gAcross.position.x = length/2;
		gAcross.position.y = height - thickness/2;
		gAcross.position.z = width/2;
		group.add( gAcross );
		cutlist.push([width - 2 * thickness, length, 1]);
	} else {
		for(let i = 0; i < Math.ceil(length/maxDistance)+1; i++) {
			gAcross = new THREE.Mesh(new THREE.BoxGeometry(nailerWidth, thickness, width - 2 * thickness) ,material);

			gAcross.position.x = i * (length/(Math.ceil(length/maxDistance)));
			if(i == 0){
				gAcross.position.x = nailerWidth/2;
			}
			if(i == Math.ceil(length/maxDistance)) {
				gAcross.position.x = length - nailerWidth/2;
			}

			gAcross.position.y = height - thickness/2;
			gAcross.position.z = width/2;
			group.add( gAcross );
		}
		cutlist.push([width - 2 * thickness, nailerWidth, Math.ceil(length/maxDistance)+1]);
	}

	for(let i = 0; i < Math.ceil(length/maxDistance)+1; i++) {
		gAcross = new THREE.Mesh(new THREE.BoxGeometry(thickness, height - thickness, width - 2 * thickness) ,material);
		gAcross.position.x = i * ((length-thickness)/(Math.ceil(length/maxDistance))) + thickness/2;
		gAcross.position.y = (height - thickness)/2;
		gAcross.position.z = width/2;
		group.add( gAcross );
	}
	cutlist.push([width - 2 * thickness, height - thickness, Math.ceil(length/maxDistance)+1]);

	group.position.x = -length/2;
	group.position.y = 0;
	group.position.z = -width/2;

  return group;
}

function getCells(data, type) {
  return data.map(cell => `<${type}>${cell}</${type}>`).join('');
}

function createBody(data) {
  return data.map(row => `<tr>${getCells(row, 'td')}</tr>`).join('');
}

function createTable(tableData) {
	console.table(tableData);

  // Destructure the headings (first row) from
  // all the rows
  const [headings, ...rows] = tableData;

  // Return some HTML that uses `getCells` to create
  // some headings, but also to create the rows
  // in the tbody.
  return `
    <table>
      <thead>${getCells(headings, 'th')}</thead>
      <tbody>${createBody(rows)}</tbody>
    </table>
  `;
}
