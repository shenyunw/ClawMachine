/*
 * COMP 3490 A1 Skeleton for Claw Machine (Barebones Edition) 
 * Note that you may make use of the skeleton provided, or start from scratch.
 * The choice is up to you.
 * Read the assignment directions carefully
 * Your claw mechanism should be created such that it is represented hierarchically
 * You might consider looking at THREE.Group and THREE.Object3D for reference
 * If you want to play around with the canvas position, or other HTML/JS level constructs
 * you are welcome to do so.
 * 
 * COMP3490 Assignment 2
 * Shenyun Wang
 * 7766614

 /*global variables, coordinates, clock etc.  */
 Physijs.scripts.worker = '/js/physijs_worker.js';
 Physijs.scripts.ammo = '/js/ammo.js';
var camera, scene, renderer;
var cameraControls;
var bar, unit, wire, claw, stickBase;
var dynamicObjects = [];
var clock = new THREE.Clock();
var collisionConfiguration, dispatcher, braodphase, solver, physicsWorld;
var balls,ground;
var viewCheck = false;
var xAxis = new THREE.Vector3(1,0,0);
var yAxis = new THREE.Vector3(0,1,0);
var zAxis = new THREE.Vector3(0,0,1);
//clawstate: 0 = stationary, 1 = going down, 2 = going up
var clawState = 0;

function fillScene() {
	scene = new Physijs.Scene;
	scene.background = new THREE.Color(0x393e44);
	scene.setGravity(new THREE.Vector3(0,-100,0));
	scene.add(new THREE.DirectionalLight( 0xffffff, 2 ));
	var light = new THREE.SpotLight(0xffffff,1,1500, Math.PI/6);
	light.position.set(0,1000,-900);
	light.lookAt(0,0,200);
	scene.add(light);
 drawClawMachine();
}

function drawClawMachine() {
	var loader = new THREE.TextureLoader();
	var bodyMaterial = Physijs.createMaterial(
		new THREE.MeshPhongMaterial( {
		 map:loader.load('images/darkMarble.jpg')}, 
		.8,.4));
	bodyMaterial.map.wrapS = bodyMaterial.map.wrapT = THREE.RepeatWrapping;
	bodyMaterial.map.repeat.set(2.5,2.5);
	var buttonMaterial = new THREE.MeshPhongMaterial({
		color:0xffd700, specular:0x996633,shininess:100
	})
	var frameMaterial = new THREE.MeshLambertMaterial();
	frameMaterial.color.setRGB( 0.529, 0.69, 0.729 );
	glassMaterial = Physijs.createMaterial(new THREE.MeshPhongMaterial({
		color: 0xffffff,
		opacity: 0.3,
		reflectivity: .8,
		shininess:100,
		transparent:true
	}));
	var base;
	
	// This is where the model gets created. Add the appropriate geometry to create your machine
	// You are not limited to using BoxGeometry, and likely want to use other types of geometry for pieces of your submission
	// Note that the actual shape, size and other factors are up to you, provided constraints listed in the assignment description are met
	//ground
	var reflection = THREE.CubeTextureLoader(['images/reflection.PNG','images/reflection.PNG','images/reflection.PNG','images/reflection.PNG'])
	ground_material = Physijs.createMaterial(
		new THREE.MeshPhongMaterial({
			map:loader.load('images/floor.jpg'), reflectivity: .8,shininess:100,transparent:true})
	);
	ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
	ground = new Physijs.BoxMesh(
		new THREE.BoxGeometry(2000, 1, 2000),ground_material, 0 // mass
	);
	ground.receiveShadow = true;
	scene.add( ground );
 //The base
	base = new Physijs.BoxMesh(
		new THREE.BoxGeometry( 300, 400, 300 ),bodyMaterial);
	base.position.set(0,200,0);
	hole1 = new Physijs.Mesh(
		new THREE.BoxGeometry(80,200, 80), bodyMaterial);
	hole1.position.set(-90,300,-110);
	hole1BSP = new ThreeBSP(hole1);
	baseBSP = new ThreeBSP(base);
	subtract = baseBSP.subtract(hole1BSP);
	newBase = subtract.toMesh();
	base = new Physijs.BoxMesh(newBase.geometry, bodyMaterial,0);
	base.position.set(0,200,0);

	// supporting arms
	stand1 = new Physijs.BoxMesh( //left front arm
		new THREE.BoxGeometry( 30, 400, 30 ), bodyMaterial,0 );
		stand1.position.set(-135,400,-135);
		base.add( stand1 );
	stand2 = new Physijs.BoxMesh(//left back
		new THREE.BoxGeometry( 30, 400, 30 ), bodyMaterial,0 );
		stand2.position.set(-135,400,135);
		base.add(stand2);
	stand3 = new Physijs.BoxMesh( //front right
		new THREE.BoxGeometry( 30, 400, 30 ), bodyMaterial,0 );
		stand3.position.set(135,400,135);
		base.add(stand3);
	stand4 = new Physijs.BoxMesh( //back right
		new THREE.BoxGeometry( 30, 400, 30 ), bodyMaterial,0 );
		stand4.position.set(135,400,-135);
		base.add(stand4);
	
	//guard
	guard = new Physijs.BoxMesh(new THREE.BoxGeometry(100, 70, 5), glassMaterial,0);
	guard.position.set(-95,235,-65);
	guard2 = new Physijs.BoxMesh(new THREE.BoxGeometry(86, 70, 5),glassMaterial,0);
	guard2.rotateY(-Math.PI/2);
	guard2.position.set(-45,235,-105);
	base.add(guard2);
	base.add(guard);

	//glass
	glass1 = new Physijs.BoxMesh(new THREE.BoxGeometry(240, 400, 5), glassMaterial);
	glass1.position.set(0,400,-147.5);
		base.add(glass1);
	glass2 = new Physijs.BoxMesh(glass1.geometry,glassMaterial,0);
		glass2.position.set(0,400,-147.5);
		glass2.rotateY(Math.PI/2);
		rotateAboutWorldAxis(glass2, yAxis, Math.PI/2);
		base.add(glass2);
	glass3 = new Physijs.BoxMesh(glass1.geometry, glassMaterial,0);
		glass3.position.set(0,400,-147.5);
		rotateAboutWorldAxis(glass3, yAxis, Math.PI);
		base.add(glass3);
	glass4 = new Physijs.BoxMesh(glass1.geometry,glassMaterial,0);
		glass4.position.set(147.5,400,0);
		glass4.rotateY(Math.PI/2);
		base.add(glass4);
//roof
	roof = new Physijs.BoxMesh(new THREE.BoxGeometry(300, 80, 300), bodyMaterial);
	roof.position.set(0,640,0);	
		base.add(roof);
		scene.add( base );
	triangle = new THREE.Geometry();
	triangle.vertices.push(
		new THREE.Vector3(-150, 400, -150),
		new THREE.Vector3(150, 400, -150),
		new THREE.Vector3(150, 360, -150),
		new THREE.Vector3(-150, 360, -150),
		new THREE.Vector3(-150, 360, -210),
		new THREE.Vector3(150, 360, -210)
	);
	triangle.faces.push(
		new THREE.Face3(0, 1, 4),
		new THREE.Face3(4, 1, 5),
		new THREE.Face3(0, 4, 3), 
		new THREE.Face3(1, 2, 5),
		new THREE.Face3(2,3,5),
		new THREE.Face3(3,4,5),
		new THREE.Face3(3,2,1),
		new THREE.Face3(1,0,3)
	)
	triangle.computeFaceNormals();
	triangleMesh = new Physijs.Mesh(triangle, bodyMaterial);
	triangleMesh.position.set(0,-200,0);
	base.add(triangleMesh);

	var bigButton = new THREE.Mesh(new THREE.CylinderGeometry(15,15,7,30),buttonMaterial);
	bigButton.rotateX(-Math.PI/5);
	bigButton.position.set(80,180,-185);
	lightBB = new THREE.PointLight(0xffd700,5,50);
	lightBB.position.set(0,10,-5);
	bigButton.add(lightBB);
	base.add(bigButton);
	frontBox = new Physijs.BoxMesh(new THREE.BoxGeometry(300, 360, 60), bodyMaterial);
	frontBox.position.set(0,180,-180);

	hole2 = new THREE.Mesh(new THREE.BoxGeometry(80, 80, 60), bodyMaterial);
	hole2.position.set(-90,240,-180);

		hole2BSP = new ThreeBSP(hole2);
		extensionBSP = new ThreeBSP(frontBox);
		subtract2 = extensionBSP.subtract(hole2BSP);
		newFrontBox = subtract2.toMesh();
		frontBox = new Physijs.BoxMesh(
			newFrontBox.geometry, bodyMaterial, 0
		);
		frontBox.position.set(0,-20,-180);

		//coinSlot
		var coinSlot = new THREE.Mesh(new THREE.BoxGeometry(8,15,3),buttonMaterial);
		coinTop = new THREE.Mesh(new THREE.BoxGeometry(2,2.5,3),buttonMaterial);
		coinBottom = new THREE.Mesh(new THREE.BoxGeometry(2,2.5,3),buttonMaterial);
		coinRight = new THREE.Mesh(new THREE.BoxGeometry(8,15,3),buttonMaterial);
		coinTop.position.set(5,6.25,0);
		coinBottom.position.set(5,-6.25,0);
		coinRight.position.set(10,0,0);
		coinSlot.add(coinTop,coinBottom,coinRight);
		coinSlot.position.set(80,120,-31.5);
		coinLight = new THREE.PointLight(0xffd700,5,50);
		coinLight.position.set(0,0,-30);
		coinSlot.add(coinLight);
		frontBox.add(coinSlot);

		var button = new THREE.Mesh(new THREE.CylinderGeometry(7,5,5,30),buttonMaterial);
		button.rotateX(Math.PI/2);
		button.position.set(110,120,-31);
		var buttonLight = new THREE.PointLight(0xffd700,3,50);
		buttonLight.position.set(0,-10,3);
		button.add(buttonLight);
		frontBox.add(button);
		base.add(frontBox);
	//joystick
	stickBase = new THREE.Mesh(new THREE.SphereGeometry(30, 20,20), bodyMaterial);
	stickBase.position.set(0,375,-175);

	var rod = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 5, 50),
	bodyMaterial);
		rod.position.set(0,40,-20);
		rod.rotation.x = -(Math.PI/6);
	var rodTip = new THREE.Mesh(new THREE.SphereGeometry(7, 10, 10), bodyMaterial);
		rodTip.position.set(0,20,0);	
		rod.add(rodTip);
		stickBase.add(rod);
		scene.add(stickBase);
	//claw part
	var frame = new THREE.Mesh(new THREE.BoxGeometry(300, 10, 20), frameMaterial);
		frame.position.set(0,780,-110);
	frame1 = frame.clone();
		frame1.position.set(0,0,220);
	frame2 = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 200), frameMaterial)
		frame2.position.set(140,0,110);	
	frame3 = frame2.clone();
		frame3.position.set(-280,0,0);
		frame2.add(frame3);
		frame.add(frame1);
		frame.add(frame2);
		scene.add(frame);

	//moving parts
	bar = new Physijs.Mesh(new THREE.BoxGeometry(290, 10, 15), frameMaterial);
		bar.position.set(0,10,110);
	unit = new THREE.Mesh(new THREE.BoxGeometry(20, 15, 20), frameMaterial);
		unit.position.y = 0;
	wire = new THREE.Mesh(new THREE.CylinderGeometry(2,2,20),frameMaterial);
		wire.position.y = -18;
	claw = new THREE.Mesh(new THREE.SphereGeometry(10,10, 30), frameMaterial);

	var clawPart = new THREE.Mesh(new THREE.CylinderGeometry(3,3,35),frameMaterial);
	var clawJoint = new THREE.Mesh(new THREE.SphereGeometry(5,10,10),frameMaterial);
	clawJoint.position.set(0,-20,0);
	clawPart.add(clawJoint);
	var part2 = new THREE.Mesh(new THREE.CylinderGeometry(3,3,30),frameMaterial);
	part2.position.set(-5,-30,0);
	tipJoint =  clawJoint.clone();
	tipJoint.position.set(0,-15,0);
	part2.add(tipJoint);
	part2.rotateZ(-Math.PI/6);
	clawPart.add(part2);
	clawPart.position.set(10,-10,0);
	clawPart.rotateZ(Math.PI/4);
	var clawPart2 = clawPart.clone();
	clawPart2.rotateY(Math.PI);
	clawPart2.rotateZ(Math.PI/2);
	clawPart2.position.set(-10,-10,0);
	claw.add(clawPart2);
	claw.add(clawPart);
		claw.position.y = -30;
	var wireClaw = new THREE.Group();
		wireClaw.add(wire);
		wireClaw.add(claw);
		unit.add(wireClaw);
		unit.material.color.setRGB(0.16, 0.157, 0.15);
		bar.add(unit);
		frame.add(bar);
	//objects
	for(var i=0; i<25; i++){
		balls = new Physijs.SphereMesh(
			new THREE.SphereGeometry(25,20,20),createObjectMaterial(), 100, {restitution: 0}
		);
		balls.position.set(((i*25)-150)%150,(Math.random()*300)+420,Math.random()*100);
		scene.add(balls);
		if(i%5 == 0){
			var squares = new Physijs.BoxMesh(
				new THREE.BoxGeometry(50,50,50), createObjectMaterial()
			);
			squares.position.set(Math.random()*120,(Math.random()*300)+420,Math.random()*120);
			scene.add(squares);
		}
	}

	//marquee
	var loader = new THREE.FontLoader();
	loader.load( 'font.json', function ( font ) {
		var xMid, text;
		var textShape = new THREE.BufferGeometry();
		var matLite = new THREE.MeshPhongMaterial( {
			color: 0xffd700, specular:0x996633, shininess:100,
			side: THREE.DoubleSide
		} );
		var message = "CHOMP";
		var shapes = font.generateShapes( message, 30, 2 );
		var geometry = new THREE.ShapeGeometry( shapes );
		geometry.computeBoundingBox();
		xMid = - 0.5 * ( geometry.boundingBox.max.x - geometry.boundingBox.min.x );
		geometry.translate( xMid, 0, 0 );
		textShape.fromGeometry( geometry );
		text = new THREE.Mesh( textShape, matLite );
		text.position.set(0,810,-151);
		text.rotateY(Math.PI);
		scene.add( text );
		var marquee1 = new THREE.PointLight(0xffd700,5,50);
		marquee1.position.set(0,5,20);
		text.add(marquee1);
		var marquee2 = new THREE.PointLight(0xffd700,5,50);
		marquee2.position.set(-50,5,20);
		text.add(marquee2);
		var marquee3 = new THREE.PointLight(0xffd700,5,50);
		marquee3.position.set(60,5,20);
		text.add(marquee3);
	} ); 

	//machine spotlight
	var spotlight1 = new THREE.SpotLight(0xffd700,5,350,Math.PI/4);
	spotlight1.position.set(-135,770,-135);
	spotlight1.lookAt(130,350,130);
	scene.add(spotlight1);
	var spotlight2 = new THREE.SpotLight(0xffd700,5,350,Math.PI/4)
	spotlight2.position.set(135,770,135);
	spotlight2.lookAt(-130,300,-130);
	scene.add(spotlight2);
}//drawClawMachine

//sets egocentric view
function loadView(x, y, z){
	camera.position.set(x, y, z);
	cameraControls.target.set(0,550,0);
	requestAnimationFrame(render);
    webGLRenderer.render(scene, camera);
}
//rotate objects
function rotateAboutWorldAxis(object, axis, angle) {
	var rotationMatrix = new THREE.Matrix4();
	rotationMatrix.makeRotationAxis( axis.normalize(), angle );
	var currentPos = new THREE.Vector4(object.position.x, object.position.y, object.position.z, 1);
	var newPos = currentPos.applyMatrix4(rotationMatrix);
	object.position.set(newPos.x, newPos.y, newPos.z);
  }

//keyboard presses
document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event){
	var keyCode = event.which;
	if(keyCode == 87 || keyCode == 38){
		if(keyCode == 38){
			//up arrow
			if(stickBase.rotation.x < Math.PI/6){
				stickBase.rotation.x += 0.05;
			}
		}
		if(bar.position.z < 205)
			bar.position.z += 2;
	}
	else if(keyCode == 83 || keyCode == 40){//s
		if(keyCode == 40){
			//down arrow
			if(stickBase.rotation.x > -Math.PI/6)
				stickBase.rotation.x -= 0.05;
		}
		if(bar.position.z > 12)
			bar.position.z -= 2;
	}
	else if(keyCode == 65 || keyCode == 37){//left
		
		if(keyCode == 37){
			if(stickBase.rotation.z > -Math.PI/6)
				stickBase.rotation.z -= 0.05;
		}
		if(unit.position.x <110)
			unit.position.x += 2;
	}
	else if(keyCode == 68 || keyCode == 39){//right
		if(keyCode == 39){
			//left arrow
			if(stickBase.rotation.z < Math.PI/6)
				stickBase.rotation.z += .05;
		}
		if(unit.position.x >-110)
			unit.position.x -= 2;
	}
	else if(keyCode == 86){
		//v is pressed
		if(!viewCheck){
			loadView(0, 600, -650);
			viewCheck = true;
		}
		if(viewCheck){
			loadView(0,600,-1000);
			viewCheck = false;
		}
	}
	else if(keyCode == 32){//spacebar
		if(clawState == 0){
			clawState = 1;
		}
	}
	document.addEventListener("keyup",keyUp,true);
	function keyUp(event){
		if(stickBase.rotation.x > 0){
			stickBase.rotation.x -= 0.05;
		}
		if(stickBase.rotation.x < 0){
			stickBase.rotation.x += 0.05;
		}
		if(stickBase.rotation.z > 0){
			stickBase.rotation.z -= 0.05;
		}
		if(stickBase.rotation.z < 0){
			stickBase.rotation.z += 0.05;
		}
	}
	render();
}

function createObjectMaterial() {
	var c = Math.floor( Math.random() * ( 1 << 24 ) );
	return new THREE.MeshPhongMaterial( { color: c } );
}

// Initialization. Define the size of the canvas and store the aspect ratio
// You can change these as well
function init() {
	var canvasWidth = 980;
	var canvasHeight = 600;
	var canvasRatio = canvasWidth / canvasHeight;

	// Set up a renderer. This will allow WebGL to make your scene appear
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );
	renderer.shadowMap.enabled = true;

	// You also want a camera. The camera has a default position, but you most likely want to change this.
	// You'll also want to allow a viewpoint that is reminiscent of using the machine as described in the pdf
	// This might include a different position and/or a different field of view etc.
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 4000 );
	// Moving the camera with the mouse is simple enough - so this is provided. However, note that by default,
	// the keyboard moves the viewpoint as well
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set( -900, 800, -600);
	cameraControls.target.set(4,401,92);
	camera.lookAt(new THREE.Vector3(0,2000,0));
	cameraControls.noPan = true;
}

	// We want our document object model (a javascript / HTML construct) to include our canvas
	// These allow for easy integration of webGL and HTML
function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
}

	// This is a browser callback for repainting
	// Since you might change view, or move things
	// We cant to update what appears
function animate() {
	window.requestAnimationFrame(animate);
	render();
}

	// getDelta comes from THREE.js - this tells how much time passed since this was last called
	// This might be useful if time is needed to make things appear smooth, in any animation, or calculation
	// The following function stores this, and also renders the scene based on the defined scene and camera
function render() {
	scene.simulate();
	var delta = clock.getDelta();
	cameraControls.update(delta);
	clock = new THREE.Clock();
	time = clock.getElapsedTime();
	//claw movement
	if(clawState == 1){
		wire.scale.y += .1;
		claw.position.y -= 1.99;
		wire.position.y -= 1;
		if(claw.position.y < -330){
			clawState = 2;
		}
	}
	else if(clawState == 2){
		wire.scale.y -= .1;
		claw.position.y += 1.99;
		wire.position.y += 1;
		if(claw.position.y >= -30){
			clawState = 0;
		}
	}
	renderer.render(scene, camera);	
}

	// Since we're such talented programmers, we include some exception handeling in case we break something
	// a try and catch accomplished this as it often does
	// The sequence below includes initialization, filling up the scene, adding this to the DOM, and animating (updating what appears)
try {
  init();
  fillScene();
  addToDOM();
  animate();
} catch(error) {
    console.log("You did something bordering on utter madness. Error was:");
    console.log(error);
}