# Computer Graphics - Exercise 6 - WebGL Basketball Court

## Getting Started
1. Clone this repository to your local machine
2. Make sure you have Node.js installed
3. Start the local web server: `node index.js`
4. Open your browser and go to http://localhost:8000

## 🎮 Detailed Control Specifications

| **Control** | **Function**             | **Implementation Details** |
|-------------|--------------------------|-----------------------------|
| **Arrow Keys** | Move Basketball | • Left/Right: Move ball horizontally across court  <br> • Up/Down: Move ball forward/backward on court  <br> • Smooth movement with appropriate speed  <br> • Keep ball within court boundaries |
| **W / S Keys** | Adjust Shot Power | • W: Increase shot power (stronger shot)  <br> • S: Decrease shot power (weaker shot)  <br> • Visual indicator showing current power level  <br> • Power range: 0% to 100% |
| **Spacebar** | Shoot Basketball | • Launch ball toward nearest hoop  <br> • Use current power level for initial velocity  <br> • Calculate trajectory to reach hoop  <br> • Apply physics simulation after launch |
| **R Key** | Reset Basketball | • Return ball to center court position  <br> • Reset ball velocity to zero  <br> • Reset shot power to default (50%)  <br> • Clear any physics state |
| **O Key** | Toggle Camera | • Enable/disable orbit camera controls  <br> |


### Basketball being moved around the court using arrow keys with shot power adjustment
![Screenshot](Screenshots/Basketball1.png)

### Shooting with rotation animation
![Screenshot](Screenshots/Basketball2.png)

### Shot with score update
![Screenshot](Screenshots/Basketball3.png)

### 🎥 Demo Video
[![Watch the video](https://img.youtube.com/vi/DztSwigDshw/0.jpg)](https://youtu.be/DztSwigDshw)

## Group Members
- Guy Ben Ari 203020623
- Niv Ben Salamon 315073346

## Technical Details
- Run the server with: `node index.js`
- Access at http://localhost:8000 in your web browser
