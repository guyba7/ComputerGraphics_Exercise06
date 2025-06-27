import {OrbitControls} from './OrbitControls.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Set background color
scene.background = new THREE.Color(0x000000);

// Add lights to the scene
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff,0.8);
directionalLight.position.set(10, 20, 15);

scene.add(directionalLight);

// Enable shadows
renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;

function degrees_to_radians(degrees) {
  var pi = Math.PI;
  return degrees * (pi/180);
}

// --------------------- Global Vars ----------------------------------

const courtWidth = 15
const courtLength = 28

// --------------------- All Materials --------------------------------
// court floor
const courtFloorMat = new THREE.MeshPhongMaterial({
  color: 0xc68642,  // Brown wood color
  shininess: 50
});

// court floor white markings
const courtFloorMarkingsMat = new THREE.LineBasicMaterial({
  color: 0xdddddd, // white
  shininess: 0
});

// support pole
const supportPoleMat = new THREE.MeshPhongMaterial({
  color: 0x333333,
  shininess: 100
});

// backboard
const backboardMat = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.4
});

// rim
const rimMat = new THREE.MeshPhongMaterial({
  color: 0xff5000, // orange
  shininess: 100
});

// net
const netMaterial = new THREE.LineBasicMaterial({
  color: 0xcccccc
});

const ballSeamMaterial = new THREE.MeshPhongMaterial({
  color: 0x111111
});

// Create basketball court
function createBasketballCourt() {

  createCourtFloor();
  createHoops();
  createStaticBall();
}

function createCourtFloor(){

  // court constants
  const courtOuterBounds = 1;
  const courtThickness = 0.2;
  const courtMarkingsThickness = 0.1;
  const courtMarkingsYPos = 0.001;
  const threePointsMarkingsRadius = (courtWidth - 1.8) / 2;
  const threePointsMarkingsRadiusCenterOffset = 1.57;
  const arcInnerRadius = threePointsMarkingsRadius - courtMarkingsThickness / 2;
  const arcOuterRadius = threePointsMarkingsRadius + courtMarkingsThickness / 2;
  const arcSegments = 64;
  const circleRadius = 1.8;
  const penaltyDistance = 5.79;


  // Court floor - just a simple brown surface
  const courtGeometry = new THREE.BoxGeometry(courtLength + courtOuterBounds * 2, courtThickness, courtWidth + courtOuterBounds * 2);

  const court = new THREE.Mesh(courtGeometry, courtFloorMat);
  court.position.y -= courtThickness / 2
  court.receiveShadow = true;

  scene.add(court);

  function createCircleMarking(radius, thickness, x,y,z) {

    const ringGeometry = new THREE.RingGeometry(
      radius - thickness / 2,
      radius + thickness / 2,
      64);

    const ring = new THREE.Mesh(ringGeometry, courtFloorMarkingsMat);

    ring.rotation.x = -Math.PI / 2; // lay flat on the floor
    ring.position.set(x, y, z);

    scene.add(ring);
  }

  // Helper to create a marking line
  function createLineMarking(width, height, x, y, z, rotationY = 0) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const line = new THREE.Mesh(geometry, courtFloorMarkingsMat);
    line.rotation.x = -Math.PI / 2; // lay flat on floor
    line.position.set(x, courtMarkingsYPos, z);
    scene.add(line);

    return line;
  }

  function createThreePointArc(xPos, flip) {
    const arcShape = new THREE.RingGeometry(arcInnerRadius, arcOuterRadius, arcSegments, 1, degrees_to_radians(270), degrees_to_radians(180));
    const arc = new THREE.Mesh(arcShape, courtFloorMarkingsMat);
    arc.rotation.x = -Math.PI / 2;
    arc.position.set(xPos, courtMarkingsYPos , 0);
    if (flip) arc.rotation.z = Math.PI;
    scene.add(arc);

    // arc  sidelines
    if (flip)
      xPos += threePointsMarkingsRadiusCenterOffset / 2;
    else
      xPos -= threePointsMarkingsRadiusCenterOffset / 2;

    createLineMarking(threePointsMarkingsRadiusCenterOffset, courtMarkingsThickness, xPos , courtMarkingsYPos , threePointsMarkingsRadius)
    createLineMarking(threePointsMarkingsRadiusCenterOffset, courtMarkingsThickness, xPos , courtMarkingsYPos , -threePointsMarkingsRadius)
  }

  // Center line marking
  createLineMarking(courtMarkingsThickness, courtWidth, 0, courtMarkingsYPos, 0);

  // center circle
  createCircleMarking(circleRadius,courtMarkingsThickness,0,courtMarkingsYPos,0)

  // three point arcs
  createThreePointArc(-courtLength/2 + threePointsMarkingsRadiusCenterOffset, false);
  createThreePointArc(courtLength/2 - threePointsMarkingsRadiusCenterOffset, true);

  // three point side borders
  createLineMarking(courtLength, courtMarkingsThickness, 0, courtMarkingsYPos, -courtWidth / 2);

  // penalty circle
  createCircleMarking(circleRadius,courtMarkingsThickness,-courtLength / 2 + penaltyDistance,courtMarkingsYPos,0)
  createCircleMarking(circleRadius,courtMarkingsThickness,courtLength / 2 - penaltyDistance,courtMarkingsYPos,0)

  // penalty rectangle
  createLineMarking(courtMarkingsThickness, circleRadius * 2, -courtLength / 2 + penaltyDistance, courtMarkingsYPos, 0);
  createLineMarking(penaltyDistance, courtMarkingsThickness, -courtLength / 2 + penaltyDistance / 2, courtMarkingsYPos, circleRadius);
  createLineMarking(penaltyDistance, courtMarkingsThickness, -courtLength / 2 + penaltyDistance / 2, courtMarkingsYPos, -circleRadius);

  createLineMarking(courtMarkingsThickness, circleRadius * 2, courtLength / 2 - penaltyDistance, courtMarkingsYPos, 0);
  createLineMarking(penaltyDistance, courtMarkingsThickness, courtLength / 2 - penaltyDistance / 2, courtMarkingsYPos, circleRadius);
  createLineMarking(penaltyDistance, courtMarkingsThickness, courtLength / 2 - penaltyDistance / 2, courtMarkingsYPos, -circleRadius);

  // Sidelines (length-wise, at left and right edges)
  createLineMarking(courtLength, courtMarkingsThickness, 0, courtMarkingsYPos, -courtWidth / 2); // back baseline
  createLineMarking(courtLength, courtMarkingsThickness, 0, courtMarkingsYPos, courtWidth / 2);  // front baseline

  // Baselines (width-wise, at each end)
  createLineMarking(courtMarkingsThickness, courtWidth, -courtLength / 2, courtMarkingsYPos, 0); // left sideline
  createLineMarking(courtMarkingsThickness, courtWidth, courtLength / 2, courtMarkingsYPos, 0);  // right sideline

}


function createHoops(){

  const rimHeight = 3.05;

  const backboardWidth = 1.829;
  const backboardHeight = 1.06;
  const backboardThickness = 0.1;
  const backboardOffset = 1.22;

  const supportPoleThickness = 0.3
  const supportPoleHeight = 3.8

  const supportPoleArmHeight = 3.4
  const supportPoleArmThickness = 0.22

  const rimDiameter = 0.45
  const rimThickness = 0.02

  const NetNumOfSegments = 16
  const netHeight = 0.6;
  const NetInnerDiameter = rimDiameter * 0.6


  createSingHoop(-courtLength / 2 - supportPoleThickness / 2,false);
  createSingHoop(courtLength / 2 + supportPoleThickness / 2,true);

  function createSingHoop(xPos, flip) {
    const hoopGroup = new THREE.Group();


    // Support Pole
    const supportPoleGeometry = new THREE.BoxGeometry(supportPoleThickness, supportPoleHeight, supportPoleThickness);
    const pole = new THREE.Mesh(supportPoleGeometry, supportPoleMat);
    pole.position.set(0, supportPoleHeight / 2, 0);
    supportPoleGeometry.castShadow = true;
    hoopGroup.add(pole);

    // Support Pole Arm
    const supportPoleArGeometry = new THREE.BoxGeometry(supportPoleArmThickness, backboardOffset, supportPoleArmThickness);
    const poleArm = new THREE.Mesh(supportPoleArGeometry, supportPoleMat);
    poleArm.position.set(backboardOffset / 2, supportPoleArmHeight, 0);
    poleArm.rotation.z = -Math.PI / 2;
    poleArm.castShadow = true;
    hoopGroup.add(poleArm);

    // Backboard
    const backboardGeometry = new THREE.BoxGeometry(backboardWidth, backboardHeight, backboardThickness);
    const backboard = new THREE.Mesh(backboardGeometry, backboardMat);
    backboard.position.set(backboardOffset, rimHeight + backboardHeight / 2 - supportPoleArmThickness, 0);
    backboard.rotation.y = Math.PI / 2;
    backboard.castShadow = true;
    hoopGroup.add(backboard);

    // Rim
    const rimXPos = backboardOffset + rimDiameter + backboardThickness - 2 * rimThickness;
    const rimGeometry = new THREE.TorusGeometry(rimDiameter, rimThickness, 6, 64);
    const rim = new THREE.Mesh(rimGeometry, rimMat);
    rim.castShadow = true;
    rim.position.set(rimXPos, rimHeight, 0);
    rim.rotation.x = Math.PI / 2;
    hoopGroup.add(rim);

    // Net
    const netCirclePoints = [];

    for (let i = 0; i < NetNumOfSegments; i++) {
      const angle = (i / NetNumOfSegments) * Math.PI * 2;
      const x_rim = rimDiameter * Math.cos(angle);
      const z_rim = rimDiameter * Math.sin(angle);
      const x_inner = NetInnerDiameter * Math.cos(angle);
      const z_inner = NetInnerDiameter * Math.sin(angle);

      const netGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(rimXPos + x_rim, rimHeight, z_rim),
        new THREE.Vector3(rimXPos + x_inner, rimHeight - netHeight, z_inner)
      ]);

      netCirclePoints.push(new THREE.Vector3(rimXPos + x_inner, rimHeight - netHeight, z_inner));

      const netLine = new THREE.Line(netGeometry, netMaterial);

      hoopGroup.add(netLine);
    }

    // add net circle
    const netCircleGeometry = new THREE.BufferGeometry().setFromPoints(netCirclePoints);
    const netCircleLine = new THREE.LineLoop(netCircleGeometry, netMaterial);
    hoopGroup.add(netCircleLine);

    // add entire hoop group to scene
    hoopGroup.position.x = xPos;

    if (flip)
      hoopGroup.rotation.y += Math.PI
    scene.add(hoopGroup);
  }
}

function createStaticBall(){
  var ballRadius = 0.24; // standard basketball radius
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 64);
  const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xee6c30 }); // orange-brown

  const basketballGroup = new THREE.Group();

  const basketball = new THREE.Mesh(ballGeometry, ballMaterial);
  basketball.castShadow = true;
  basketball.position.set(0, ballRadius, 0);
  basketballGroup.add(basketball);

  // Seam using TubeGeometry (controllable width)
  const seamRadius = ballRadius;
  const seamWidth = 0.01; // thickness of the seam (tube radius)
  const seamSegments = 128;

  const seamCurvePoints = [];
  for (let i = 0; i <= seamSegments; i++) {
    const theta = (i / Math.max(seamSegments, 1)) * Math.PI * 2;
    const x = seamRadius * Math.cos(theta);
    const y = seamRadius * Math.sin(theta);
    seamCurvePoints.push(new THREE.Vector3(x, y, 0));
  }

  const seamCurve = new THREE.CatmullRomCurve3(seamCurvePoints);
  const tubeGeometry = new THREE.TubeGeometry(seamCurve, 128, seamWidth, 2, true);

  const circumVerticalSeamMesh = new THREE.Mesh(tubeGeometry, ballSeamMaterial);
  circumVerticalSeamMesh.position.y = ballRadius;
  basketballGroup.add(circumVerticalSeamMesh);

  // clone vertical and rotate to be horizontal
  const circumHorizontalSeamMesh =  circumVerticalSeamMesh.clone();
  circumHorizontalSeamMesh.rotation.x += Math.PI / 2;
  basketballGroup.add(circumHorizontalSeamMesh);

  // for hemisphere seams, reduce radius by seam width so the tube mesh non-flat and still only protrude slightly from the ball sphere
  const ballRadiusHemispheres = ballRadius - seamWidth;
  const seamHemisphereCurvePoints = [];

  const seamAngleDeg_lat = 30;
  const seamAngleRad_lat = degrees_to_radians(seamAngleDeg_lat);

  const seamAngleDeg_long = 70;
  const seamAngleRad_long = degrees_to_radians(seamAngleDeg_long);

  // compute the vertical height (y) at this latitude
  const y_lat = ballRadiusHemispheres * (seamAngleRad_lat / (Math.PI /2));

  // compute the vertical height (y) at this longtitude
  const y_long = ballRadiusHemispheres * (seamAngleRad_long / (Math.PI /2));

  for (let i = 0; i <= seamSegments; i++) {
    const theta = (i / Math.max(seamSegments, 1)) * Math.PI * 2;

    const lerpAlpha= (Math.cos(theta * 2) + 1) / 2;

    // lerp height according to angle
    const y = lerp(y_lat, y_long, lerpAlpha**1.3);

    // calculate radius according to lerped height
    const r = Math.sqrt(ballRadiusHemispheres ** 2 - (y-ballRadiusHemispheres)**2);

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);

    seamHemisphereCurvePoints.push(new THREE.Vector3(x, y, z));
  }

  const seamSouthHemisphereCurve = new THREE.CatmullRomCurve3(seamHemisphereCurvePoints);
  const tubeHemisphereGeometry = new THREE.TubeGeometry(seamSouthHemisphereCurve, 128, seamWidth, 8, true);

  const southHemisphereSeamMesh = new THREE.Mesh(tubeHemisphereGeometry, ballSeamMaterial);
  basketballGroup.add(southHemisphereSeamMesh);

    // clone south hemisphere, rotate and offset to be north hemisphere
  const northHemisphereSeamMesh =  southHemisphereSeamMesh.clone();
  northHemisphereSeamMesh.rotation.z += Math.PI ;
  northHemisphereSeamMesh.position.y += ballRadius * 2;
  basketballGroup.add(northHemisphereSeamMesh);

  // add the entire group to the scene
  scene.add(basketballGroup);
  
}

function lerp(a, b, alpha) {
  return a + (b - a) * alpha;
}

// Create all elements
createBasketballCourt();

// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = true;

// added to enable keyboard
controls.listenToKeyEvents(document)

// Instructions display
const instructionsElement = document.createElement('div');
instructionsElement.style.position = 'absolute';
instructionsElement.style.bottom = '20px';
instructionsElement.style.left = '20px';
instructionsElement.style.color = 'white';
instructionsElement.style.fontSize = '16px';
instructionsElement.style.fontFamily = 'Arial, sans-serif';
instructionsElement.style.textAlign = 'left';
instructionsElement.innerHTML = `
  <h3>Controls:</h3>
  <p>O - Toggle orbit camera</p>
  <p>Left Click + drag to rotate</p>
  <p>Right Click + drag to pan</p>
  <p>Arrow Keys to pan</p>
  <p>Scroll to zoom</p>
`;
document.body.appendChild(instructionsElement);

// Main UI container
const uiContainer = document.createElement('div');
uiContainer.id = 'ui-container';
document.body.appendChild(uiContainer);

// Score display
const scoreDisplay = document.createElement('div');
scoreDisplay.id = 'score-display';
scoreDisplay.innerHTML = 'Score: 0 - 0';
uiContainer.appendChild(scoreDisplay);

// Handle key events
function handleKeyDown(e) {
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;
  }

}

document.addEventListener('keydown', handleKeyDown);

// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();

  
  renderer.render(scene, camera);
}

animate();



const style = document.createElement('style');
style.innerHTML = `
  #ui-container {
    position: absolute;
    top: 10px;
    left: 10px;
    color: white;
    font-family: Arial, sans-serif;
    font-size: 16px;
    z-index: 10;
    pointer-events: none;
  }

  #score-display {
    position: absolute;
    top: 20px;
    left: 50%;
    background: rgba(0, 0, 0, 0.6);
    padding: 16px 32px;
    border-radius: 10px;
    font-size: 28px;
    font-weight: bold;
    color: white;
    pointer-events: none;
    z-index: 10;
  }


  #controls-display {
    background: rgba(0, 0, 0, 0.5);
    padding: 10px 16px;
    border-radius: 6px;
    max-width: 250px;
    pointer-events: auto;
  }
`;
document.head.appendChild(style);
