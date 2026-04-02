import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- ESCENA Y MOTOR ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- LUCES ---
const ambient = new THREE.AmbientLight(0xffffff, 0.1); 
scene.add(ambient);

const orangeLight = new THREE.PointLight(0xff6600, 50, 20);
orangeLight.position.set(0, 3.5, 0);
orangeLight.castShadow = true;
scene.add(orangeLight);

// --- MATERIALES ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x555544, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
const bedMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

// --- OBJETOS ---
// Cuarto
const room = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), wallMat);
room.receiveShadow = true;
scene.add(room);

// Cama
const bed = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 5), bedMat);
bed.position.set(-3, 0.5, -2);
bed.castShadow = true;
scene.add(bed);

// Ropero
const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 1.5), woodMat);
wardrobe.position.set(3, 2.5, -3);
wardrobe.castShadow = true;
scene.add(wardrobe);

// Mesita (Donde estará la llave)
const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), woodMat);
stand.position.set(-1, 0.6, -2);
stand.castShadow = true;
scene.add(stand);

// Ventilador
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.9, 0);
const blade = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 0.5), woodMat);
fanGroup.add(blade);
scene.add(fanGroup);

// --- MOVIMIENTO ---
camera.position.set(0, 1.7, 4);
let moveF = false, moveB = false, moveL = false, moveR = false;

document.addEventListener('keydown', (e) => {
    if(e.code === 'KeyW') moveF = true;
    if(e.code === 'KeyS') moveB = true;
    if(e.code === 'KeyA') moveL = true;
    if(e.code === 'KeyD') moveR = true;
});
document.addEventListener('keyup', (e) => {
    if(e.code === 'KeyW') moveF = false;
    if(e.code === 'KeyS') moveB = false;
    if(e.code === 'KeyA') moveL = false;
    if(e.code === 'KeyD') moveR = false;
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

document.body.onclick = () => document.body.requestPointerLock();

// --- BUCLE ---
function animate() {
    requestAnimationFrame(animate);
    
    if (document.pointerLockElement === document.body) {
        const speed = 0.1;
        if(moveF) camera.translateZ(-speed);
        if(moveB) camera.translateZ(speed);
        if(moveL) camera.translateX(-speed);
        if(moveR) camera.translateX(speed);
        camera.position.y = 1.7; // Mantener altura
    }

    fanGroup.rotation.y += 0.1;
    if(Math.random() > 0.95) orangeLight.intensity = 30 + Math.random() * 40;
    
    renderer.render(scene, camera);
}
animate();
