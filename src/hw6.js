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

////////////////////////// HTML /////////////////////////////////////

const orbitControlsHTML = `
  <h3>Controls:</h3>
  <p>O - Change to game controls</p>
  <p>Left Click + drag to rotate</p>
  <p>Right Click + drag to pan</p>
  <p>Arrow Keys to pan</p>
  <p>Scroll to zoom</p>
  <hr></hr>
  <p>W / S to adjust shot power</p>
  <p>Spacebar to shot ball</p>
  <p>R Keys to reset ball location</p>
`;

const gameControlsHTML = `
  <h3>Controls:</h3>
  <p>O - Change to camera orbit controls</p>
  <p>Arrow Keys to move ball</p>
  <hr></hr>
  <p>W / S to adjust shot power</p>
  <p>Spacebar to shot ball</p>
  <p>R Keys to reset ball location</p>
`;

// --------------------- Global Vars ----------------------------------

// game
let isShootingMode = false;
let isCurrentShotThreePoints = false;
let ShootDirection = 0;
let ShotState = 0;
let shotsAttempts = 0;
let shotsSuccesses= 0;
let scorePoints= 0;

// court
const courtWidth = 15
const courtLength = 28

// ball
const ballRadius = 0.24; // standard basketball radius
const ballStartHeight = 0;

// rim
const rimDiameter = 0.45;
const rimThickness = 0.02;

// Objects
const basketballGroup = new THREE.Group();
let ballSphereMesh;
let courtMesh;
let forwardHoopGroup;
let backHoopGroup;

// ball smooth input movement
const ballMoveSpeed = 0.1;
let ballMoveDirectionX = 0;
let ballMoveDirectionZ = 0;
const ballMinClamp = new THREE.Vector3(-courtLength / 2, ballStartHeight, -courtWidth / 2);
const ballMaxClamp = new THREE.Vector3(courtLength / 2, ballStartHeight, courtWidth / 2);

// power
let shotPower = 0.85; // value between 0.0 and 1.0
const minPower = 0.7;
const maxPower = 1.0;
const powerStep = 0.025;
const maxPowerVelocityScalar = 0.4;

// physics
const gravityAcceleration = new THREE.Vector3(0, -0.01, 0);
let ballVelocity = new THREE.Vector3(0, 0, 0);
const ballRestitution = 0.8;


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

  courtMesh = new THREE.Mesh(courtGeometry, courtFloorMat);
  courtMesh.position.y -= courtThickness / 2
  courtMesh.receiveShadow = true;
  courtGeometry.computeBoundingBox();
  scene.add(courtMesh);

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

  const NetNumOfSegments = 16
  const netHeight = 0.6;
  const NetInnerDiameter = rimDiameter * 0.6


  backHoopGroup = createSingleHoop(-courtLength / 2 - supportPoleThickness / 2,false);
  forwardHoopGroup =  createSingleHoop(courtLength / 2 + supportPoleThickness / 2,true);

  function createSingleHoop(xPos, flip) {
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
    backboard.name = "backboard";
    backboardGeometry.computeBoundingBox();
    hoopGroup.add(backboard);

    // Rim
    const rimXPos = backboardOffset + rimDiameter + backboardThickness - 2 * rimThickness;
    const rimGeometry = new THREE.TorusGeometry(rimDiameter, rimThickness, 6, 64);
    const rim = new THREE.Mesh(rimGeometry, rimMat);
    rim.castShadow = true;
    rim.name = "rim";
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
    return hoopGroup;
  }
}

function createStaticBall(){
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 64, 64);
  const ballMaterial = new THREE.MeshPhongMaterial({ color: 0xee6c30 }); // orange-brown

  ballSphereMesh = new THREE.Mesh(ballGeometry, ballMaterial);
  ballSphereMesh.castShadow = true;
  ballSphereMesh.position.set(0, ballRadius, 0);
  ballSphereMesh.name = "sphere";
  basketballGroup.add(ballSphereMesh);

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

resetBall();

// Set camera position for better view
const cameraTranslate = new THREE.Matrix4();
cameraTranslate.makeTranslation(0, 15, 30);
camera.applyMatrix4(cameraTranslate);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
let isOrbitEnabled = false;

// added to enable keyboard
controls.listenToKeyEvents(document)

// Instructions display
const instructionsElement = document.createElement('div');
instructionsElement.id='controls-display';
instructionsElement.innerHTML = gameControlsHTML;
document.body.appendChild(instructionsElement);

// Main UI container
const uiContainer = document.createElement('div');
uiContainer.id = 'ui-container';
document.body.appendChild(uiContainer);

// Power bar container
const powerBarContainer = document.createElement('div');
powerBarContainer.id = 'power-bar-container';
// Score display
const scoreDisplay = document.createElement('div');
scoreDisplay.id = 'score-display';
uiContainer.appendChild(scoreDisplay);



const powerBarFill = document.createElement('div');
powerBarFill.id = 'power-bar-fill';

powerBarContainer.appendChild(powerBarFill);
uiContainer.appendChild(powerBarContainer);

function resetBall(){

  if (isShootingMode && ShotState === 0)
        shotsAttempts++;

  ballVelocity.set(0,0,0)
  basketballGroup.position.set(0,ballStartHeight,0)
  isShootingMode = false;


}

function applyTrajectoryVelocityToBall(targetPosition) {
  let originPosition = ballSphereMesh.getWorldPosition(new THREE.Vector3());

  let velocityScalar = shotPower * maxPowerVelocityScalar;

  // h - vertical difference
  let h = targetPosition.y - originPosition.y;

  // d - horizontal distance in XZ plane
  const originXZ = originPosition.clone().setY(0);
  const targetXZ = targetPosition.clone().setY(0);
  let d = originXZ.distanceTo(targetXZ);

  const g = Math.abs(gravityAcceleration.y); // gravity magnitude

  const v = velocityScalar;
  const v2 = v * v;

  let discriminant = v2 * v2 - g * (g * d * d + 2 * h * v2);

  let tanAlpha;

  if (discriminant < 0) {
    discriminant = 0;
  }

  tanAlpha = (v2 + Math.sqrt(discriminant)) / (g * d); // high arc


  const alpha = Math.atan(tanAlpha); // launch angle in radians

  // Step 1: Horizontal direction unit vector (XZ)
  const dirXZ = targetXZ.clone().sub(originXZ).normalize();

  // Step 2: Compute time to target (t = d / (v * cos(α)))
  const horizontalSpeed = Math.cos(alpha) * v;
  const flightTime = d / horizontalSpeed;

  // Step 3: Full velocity vector
  const velocity = new THREE.Vector3(
    dirXZ.x * horizontalSpeed,
    Math.sin(alpha) * v,
    dirXZ.z * horizontalSpeed
  );

    // Add tiny random deviation
  const deviationStrength =  0.002; // adjust for more or less randomness
  velocity.x += (Math.random() * 2 - 1) * deviationStrength;
  velocity.y += (Math.random() * 2 - 1) * deviationStrength;
  velocity.z += (Math.random() * 2 - 1) * deviationStrength;

  // Set ball velocity to reach target
  ballVelocity.copy(velocity);
}


function shootBallToNearestHoop(){

  isShootingMode = true;
  ShotState = 0;

  let rimMesh;
  if (basketballGroup.position.x >= 0)
  {
    rimMesh = forwardHoopGroup.getObjectByName("rim");
    ShootDirection = 1;
    }
  else {
    rimMesh = backHoopGroup.getObjectByName("rim");
    ShootDirection = -1;
  }

  applyTrajectoryVelocityToBall(rimMesh.getWorldPosition());
}


// Handle key events
function handleKeyDown(e) {
  // toggle controls orbit/game
  if (e.key === "o") {
    isOrbitEnabled = !isOrbitEnabled;

    if (isOrbitEnabled) {
      instructionsElement.innerHTML = orbitControlsHTML;
      ballMoveDirectionX = 0;
      ballMoveDirectionZ = 0;
    } else
      instructionsElement.innerHTML = gameControlsHTML;
  }

  if (!isOrbitEnabled) {
    // arrow keys
    switch (e.key) {
      case "ArrowUp":
        ballMoveDirectionX = 1;
        break;

      case "ArrowDown":
        ballMoveDirectionX = -1;
        break;

      case "ArrowLeft":
        ballMoveDirectionZ = -1;
        break;

      case "ArrowRight":
        ballMoveDirectionZ = 1;
        break;

    }
  }

  switch (e.key) {
    case "w":
      shotPower = Math.min(maxPower, shotPower + powerStep);
      break;
    case "s":
      shotPower = Math.max(minPower, shotPower - powerStep);
      break;
    case " ":
      if (!isShootingMode){
        shootBallToNearestHoop();
      }
      break;
    case "r":
      resetBall();
      break;
  }

}
function handleKeyUp(e) {
    // arrow keys
  switch (e.key) {
    case "ArrowUp":
    case "ArrowDown":
      ballMoveDirectionX = 0;
      break;

    case "ArrowLeft":
    case "ArrowRight":
      ballMoveDirectionZ = 0;
      break;

  }
}

function animateBallSmoothInputMovement(){

  if (!isShootingMode) {
    // Move ball smooth
    basketballGroup.position.x += ballMoveDirectionX * ballMoveSpeed;
    basketballGroup.position.z += ballMoveDirectionZ * ballMoveSpeed;

    // clamp position inside court
    basketballGroup.position.clamp(ballMinClamp,ballMaxClamp);
  }
}

function updateUI() {
  // Update power bar
  let shotFillRatio = (shotPower - minPower) / (maxPower - minPower);
  powerBarFill.style.width = `${shotFillRatio * 100}%`;


  const percentage = shotsAttempts > 0
      ? ((shotsSuccesses / shotsAttempts) * 100).toFixed(1)
      : "0";

  let ShoteStateText = "Shot!";

  scoreDisplay.innerHTML = `
    <strong>${ShoteStateText}</strong> <br>
    <strong>Total Score:</strong> ${scorePoints}<br>
    <strong>Success Rate:</strong> ${shotsSuccesses} / ${shotsAttempts} (${percentage}%)<br>
  `;
}

function simulatePhysics_Gravity(){
  if (isShootingMode){
    ballVelocity.add(gravityAcceleration);
  }
}

function simulatePhysics_Velocity(){
  basketballGroup.position.add(ballVelocity);
}

function handleBallCollision(CollisionNormal) {
  ballVelocity = ballVelocity.reflect(CollisionNormal);
  ballVelocity.multiplyScalar(ballRestitution);
}

function simulatePhysics_BackboardCollision(backboardMesh, ballBoundingSphere,direction) {
  const BackboardGBoundingBox = backboardMesh.geometry.boundingBox;
  const BackboardGMeshPosition = backboardMesh.getWorldPosition(new THREE.Vector3());

  if (BackboardGBoundingBox.intersectsSphere(ballBoundingSphere)) {
    handleBallCollision(new THREE.Vector3(direction, 0, 0));
  }
}

function simulatePhysics_RimCollision(rimMesh, ballBoundingSphere) {
  const rimCenter = rimMesh.getWorldPosition(new THREE.Vector3());
  const ballCenter = ballBoundingSphere.center;

  // Compute the vector from rim center to ball center (full 3D)
  const collisionVector = new THREE.Vector3().subVectors(ballCenter, rimCenter);
  const distance = collisionVector.length();

  // Use a tighter threshold to allow for realistic bounce
  const rimCollisionRadius = rimDiameter / 2 + ballRadius - 0.01; // tweak as needed

  // Check if ball is overlapping with rim space
  if (distance <= rimCollisionRadius) {
    const normal = collisionVector.normalize(); // full 3D normal
    handleBallCollision(normal);
  }
}


function detectScore(rimMesh, ballBoundingSphere) {

  if (ShotState === 0) {
    const rimPos = rimMesh.getWorldPosition(new THREE.Vector3());
    const ballPos = ballBoundingSphere.center;
    if (ballPos.y <= rimPos.y && ballVelocity.y < 0) {
      let distanceFromRimCenter = ballBoundingSphere.center.sub(rimPos);
      let horizontalDistanceFromRimCenter = new THREE.Vector3(distanceFromRimCenter.x, 0, distanceFromRimCenter.z);

      if (horizontalDistanceFromRimCenter.length() <= rimDiameter / 2 - rimThickness)
        ShotState = 1;
      else
        ShotState = -1;

      return true;
    }
  }

  return false;
}

function simulatePhysics_Collision() {

  let ballBoundingSphere = ballSphereMesh.geometry.boundingSphere;
  ballBoundingSphere.center = ballSphereMesh.getWorldPosition(new THREE.Vector3())

  let courtBoundingBox = courtMesh.geometry.boundingBox;

  if (courtBoundingBox.intersectsSphere(ballBoundingSphere)) {
    // change ball y immediately to prevent the ball from being stuck inside the collision
    basketballGroup.position.y = 0;
    handleBallCollision(new THREE.Vector3(0, 1, 0));
  }

  let backboardMesh;
  let rimMesh;

  if (ShootDirection === 1) {
    backboardMesh = forwardHoopGroup.getObjectByName("backboard");
    rimMesh = forwardHoopGroup.getObjectByName("rim")
  }

  if (ShootDirection === -1) {
    backboardMesh = backHoopGroup.getObjectByName("backboard");
    rimMesh = backHoopGroup.getObjectByName("rim")
  }

  simulatePhysics_BackboardCollision(backboardMesh, ballBoundingSphere, ShootDirection * -1);
  //simulatePhysics_RimCollision(rimMesh, ballBoundingSphere);

  if (detectScore(rimMesh, ballBoundingSphere)) {
    shotsAttempts++;

    if (ShotState === 1) {
      shotsSuccesses++;

      if (isCurrentShotThreePoints)
        scorePoints += 3;
      else
        scorePoints += 2;
    }
  }
}

function simulatePhysics(){
  if (isShootingMode) {
    simulatePhysics_Gravity();
    simulatePhysics_Velocity();
    simulatePhysics_Collision();
  }
}


document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
// Animation function
function animate() {
  requestAnimationFrame(animate);
  
  // Update controls
  controls.enabled = isOrbitEnabled;
  controls.update();

  renderer.render(scene, camera);

  animateBallSmoothInputMovement();
  updateUI();
  simulatePhysics();

  if (isShootingMode){
    // if ball stops moving or fell out of court -> reset ball
    if (ballVelocity.length() < 0.01 || ballSphereMesh.getWorldPosition(new THREE.Vector3()).y < -3) {
      resetBall();
    }
  }
}

animate();


////////////////////////// css /////////////////////////////////////

const style = document.createElement('style');
style.innerHTML = `
  #ui-container {
    position: absolute;
    width: 99%;
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
    transform: translateX(-50%);
  }

  #controls-display {
    position: absolute;
    bottom: 20px;
    left: 20px;
    font-size: 16px;
    font-family: Arial;
    textAlign: left;
    background: rgba(0, 0, 0, 0.5);
    padding: 10px 16px;
    color: yellow;
    border-radius: 6px;
    max-width: 250px;
    pointer-events: auto;
    
  }
  
  #power-bar-container {
  width: 400px;
  height: 60px;
  left: 1000px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid white;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 60px;
}

  #power-bar-fill {
    height: 100%;
    width: 0%;
    background: red;
    transition: width 0.1s ease-out;
    border-radius: 10px;
}

`;
document.head.appendChild(style);
