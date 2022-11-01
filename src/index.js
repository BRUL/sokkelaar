'use strict';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';

let camera, scene, renderer, object;
let cutlist;

const defaultMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });

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

	const modelLength = parseInt(URLLength) || 600;
	const modelWidth = parseInt(URLWidth) || 500;
	const modelHeight = parseInt(URLHeight) || 700;
	const modelThickness = parseInt(URLThickness) || 18;

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xf0f0f0 );

	const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
	scene.add(ambientLight);

	const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
	directionalLight.position.set(2000, 5000, 3000);
	scene.add(directionalLight);

	// Setting up camera
	camera = new THREE.PerspectiveCamera( 44, 2, 1, 10000 );

	const zf = 1; // Zoom factor
	//camera.position.set(-(soccleLength/2)*zf, soccleLength*zf, soccleLength*2*zf);
	let distance = Math.max(Math.max(modelLength,modelWidth,modelHeight),100);
	console.log(distance);
	camera.position.set(-distance*zf, distance*2*zf, distance*3*zf);

	// Set up renderer
	renderer = new THREE.WebGLRenderer({ canvas: document.querySelector(".app canvas"), antialias: true });
	renderer.setPixelRatio( window.devicePixelRatio );

	const resizeObserver = new ResizeObserver(resizeCanvasToDisplaySize);
	resizeObserver.observe(renderer.domElement, {box: 'content-box'});

	const controls = new OrbitControls( camera, renderer.domElement );
					controls.target = new THREE.Vector3( 0, modelHeight/2, 0);
					controls.screenSpacePanning = true;
					controls.addEventListener( 'change', render ); // use if there is no animation loop
					controls.minDistance = 100;
					controls.maxDistance = 10000;
					controls.enableZoom = true;
					controls.update();

	//const soccle = createSoccle(soccleLength,soccleWidth,soccleHeight,soccleThickness);
	//scene.add(soccle);

	const modelParameters = {
		width: modelLength,
		depth: modelWidth,
		height: modelHeight
	};

	// loadModel
	scene.add(loadModel(modelParameters));

	// input form
	document.body.appendChild(displayData(modelLength, modelWidth, modelHeight));

	// Display cutlist data
	// cutlist.splice(0,0, ["Lengte","Breedte","Aantal"]);
	// document.body.insertAdjacentHTML('beforeend', createTable(cutlist));

	// Display URL copier
	document.body.appendChild(copyForm());

	// const axesHelper = new THREE.AxesHelper( 100 );
	// scene.add( axesHelper );
}

function displayData(modelLength, modelWidth, modelHeight) {
	const dL = document.createElement('input');
	dL.setAttribute("type", "number");
	dL.setAttribute("id", "l");
	dL.setAttribute("name", "l");
	dL.setAttribute("value", modelLength);
	const dLl = document.createElement("Label");
	dLl.setAttribute("for","l");
	dLl.innerText = "Lengte";
	const dLd = document.createElement("fieldset");
	dLd.append(dLl,dL);

	const dW = document.createElement('input');
	dW.setAttribute("type", "number");
	dW.setAttribute("id", "w");
	dW.setAttribute("name", "w");
	dW.setAttribute("value", modelWidth);
	const dWl = document.createElement("Label");
	dWl.setAttribute("for","w");
	dWl.innerText = "Breedte";
	const dWd = document.createElement("fieldset");
	dWd.append(dWl,dW);

	const dH = document.createElement('input');
	dH.setAttribute("type", "number");
	dH.setAttribute("id", "h");
	dH.setAttribute("name", "h");
	dH.setAttribute("value", modelHeight);
	const dHl = document.createElement("Label");
	dHl.setAttribute("for","h");
	dHl.innerText = "Hoogte";
	const dHd = document.createElement("fieldset");
	dHd.append(dHl,dH);

	const bttn = document.createElement('input');
	bttn.setAttribute("type", "submit");
	bttn.setAttribute("id", "go");
	bttn.setAttribute("value", ">");

	// display model data
	const displayData = document.createElement("form");
	displayData.setAttribute("id","dimensions");
	displayData.setAttribute("class","table");
	displayData.setAttribute("method","GET");
	displayData.append(dLd,dWd,dHd,bttn);
	return displayData;
}

function loadModel( data ) {

	data = Object.assign({
		width: 100,
		depth: 100,
		height: 100,
		thicknessCorpus: 18,
		thicknessBack: 8,
		backRabet: 6,
		backInset: 20,
		shelves: -1,
		minShelveDistance: 300,
		shelveSetback: 10,
		material: defaultMaterial
	}, data);

	console.table(data);

	const group = new THREE.Group();
	cutlist = [];

	group.translateX(-data.width / 2);

	// Onderregel
	group.add( newPartFromData({
		x: data.width - (2 * data.thicknessCorpus),
		y: data.thicknessCorpus,
		z: data.depth,
		px: data.thicknessCorpus
	}));

	// Bovenregel
	group.add( newPartFromData({
		x: data.width - (2 * data.thicknessCorpus),
		y: data.thicknessCorpus,
		z: data.depth,
		px: data.thicknessCorpus,
		py: data.height - data.thicknessCorpus
	}));
	// Linkerstijl
	group.add( newPartFromData({
		x: data.thicknessCorpus,
		y: data.height,
		z: data.depth
	}));
	// Rechterstijl
	group.add( newPartFromData({
		x: data.thicknessCorpus,
		y: data.height,
		z: data.depth,
		px: data.width - data.thicknessCorpus
	}));

	// Rug
	group.add( newPartFromData({
		x: data.width - 2 * (data.thicknessCorpus - data.backRabet),
		y: data.height - 2 * (data.thicknessCorpus - data.backRabet),
		z: data.thicknessBack,
		px: (data.thicknessCorpus - data.backRabet),
		py: (data.thicknessCorpus - data.backRabet),
		pz: data.backInset - data.thicknessBack
	}));

	// Legborden
	let shelves = 0;
	if(data.shelves < 0 && data.minShelveDistance > 0) {
		// calculate amount of shelves
		shelves = Math.floor((data.height - (2 * data.thicknessCorpus)) / data.minShelveDistance);
		//console.log("Calculated shelves!", shelves);
	}
	if(data.shelves > 0) {
		shelves = data.shelves;
		//console.log("Determined shelves!", shelves);
	}
	if(shelves != 0) {
		// draw shelves
		for(let i = 1; i <= shelves; i++) {
			let shelvePosY = data.thicknessCorpus + round(i * (data.height - (2 * data.thicknessCorpus)) / (shelves + 1), 2);
			console.log("Shelve %s of %s at %s", i, shelves, shelvePosY);
			group.add( newPartFromData({
				x: data.width - (2 * data.thicknessCorpus),
				y: data.thicknessCorpus,
				z: data.depth-data.shelveSetback - data.backInset,
				px: data.thicknessCorpus,
				py: shelvePosY,
				pz: data.backInset
			}));
		}
	}

	return group;
}

function newPart(x, y, z, posx, posy, posz, material) {
	if(!x) console.warn("No x value for part given.", this.x);
	if(!y) console.warn("No y value for part given.", this.y);
	if(!z) console.warn("No z value for part given.", this.z);

	const part = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), (material ? material : new THREE.MeshLambertMaterial({ color: "#" + Math.floor(Math.random()*16777215).toString(16) })));

	part.position.x = x/2 + (posx ? posx : 0);
	part.position.y = y/2 + (posy ? posy : 0);
	part.position.z = z/2 + (posz ? posz : 0);
	return part;
}

//
function newPartFromData(inputData) {
	let data = Object.assign({
						x: 100,
						y: 100,
						z: 18,
						px: 0,
						py: 0,
						pz: 0,
						material: new THREE.MeshLambertMaterial({ color: "#aaaaaa" })
					}, inputData);
	if(!inputData.x || !inputData.y || !inputData.z) {
		data.material = new THREE.MeshLambertMaterial({ color: "#ffaaaa" });
	}
	const part = newPart(data.x, data.y, data.z, data.px, data.py, data.pz, data.material);
	return part;
}

function render() {
    renderer.render(scene, camera)
}

function CopyToClipboard(url, feedbackElement = null) {
	navigator.clipboard.writeText(url).then(function() {
		if(feedbackElement) {
			feedbackElement.innerText = "Gekopiëerd!"
		}
	}, function() {
	});
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

function copyForm() {

	const copyLabel = document.createElement("Label");
	copyLabel.setAttribute("for", "url");
	copyLabel.setAttribute("id", "url-label");
	copyLabel.innerText = "Delen";

	let url = document.location.href;
	const textArea = document.createElement("input");
	textArea.setAttribute("class","copy");
	textArea.setAttribute("id","url");
	textArea.setAttribute("name","url");
	textArea.setAttribute("type","url");
	textArea.setAttribute("value",url);

	const copyForm = document.createElement("form");
	copyForm.setAttribute("class","table share");
	copyForm.appendChild(copyLabel);
	copyForm.appendChild(textArea);

	// Interaction
	textArea.addEventListener("click", () => CopyToClipboard(url, copyLabel));
	textArea.addEventListener("click", function() {textArea.focus(); textArea.select(); });

	return copyForm;
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

function createTable(table, title = "") {
  // Destructure the headings (first row) from
  // all the rows
  const [headings, ...rows] = table;

  // Return some HTML that uses `getCells` to create
  // some headings, but also to create the rows
  // in the tbody.
  return `
    <table class="data">
		 	<caption>${title}</caption>
      <thead>${getCells(headings, 'th')}</thead>
      <tbody>${createBody(rows)}</tbody>
    </table>
  `;
}

/**
 * Round half away from zero ('commercial' rounding)
 * Uses correction to offset floating-point inaccuracies.
 * Works symmetrically for positive and negative numbers.
 */
function round(num, decimalPlaces = 0) {
    var p = Math.pow(10, decimalPlaces);
    var n = (num * p) * (1 + Number.EPSILON);
    return Math.round(n) / p;
}
