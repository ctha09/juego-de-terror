import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.15); // Niebla espesa

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- 1. LUCES ---
const ambient = new THREE.AmbientLight(0x404040, 0.2); 
scene.add(ambient);

// Luz del Ventilador (Naranja)
const orangeLight = new THREE.PointLight(0xff4400, 30, 15);
orangeLight.position.set(0, 3.5, 0);
orangeLight.castShadow = true;
scene.add(orangeLight);

// Luz de Relámpago (Blanca, viene de la ventana)
const lightningLight = new THREE.DirectionalLight(0xffffff, 0);
lightningLight.position.set(5, 3, -5);
scene.add(lightningLight);

// --- 2. CONSTRUCCIÓN DE LA CASA ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x555544, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x221105 });

// Habitación con hueco para ventana
const roomGroup = new THREE.Group();
const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), wallMat);
walls.receiveShadow = true;
roomGroup.add(walls);

// La Ventana (Un plano oscuro afuera)
const windowGeo = new THREE.PlaneGeometry(2, 3);
const windowMat = new THREE.MeshBasicMaterial({ color: 0x000011 });
const windowMesh = new THREE.Mesh(windowGeo, windowMat);
windowMesh.position.set(-4.99, 2, -1); // En la pared izquierda
windowMesh.rotation.y = Math.PI / 2;
scene.add(windowMesh);
scene.add(roomGroup);

// --- 3. MUEBLES DETALLADOS ---
// Cama con patas
const bedGroup = new THREE.Group();
const mattress = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 5), new THREE.MeshStandardMaterial({color: 0x999988}));
mattress.position.set(-3, 0.6, -2);
mattress.castShadow = true;
bedGroup.add(mattress);
scene.add(bedGroup);

// Ropero
const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 1.2), woodMat);
wardrobe.position.set(3, 2.5, -3.5);
wardrobe.castShadow = true;
scene.add(wardrobe);

// Mesita Izquierda (Con el cajón de la llave)
const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), woodMat);
nightstand.position.set(-1.2, 0.5, -2);
nightstand.castShadow = true;
scene.add(nightstand);

// Ventilador con paletas reales
const fan = new THREE.Group();
fan.position.set(0, 3.8, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 0.5), woodMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fan.add(blade);
}
scene.add(fan);

// --- 4. CONTROLES ---
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);
document.addEventListener('mousedown', () => document.body.requestPointerLock());

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

camera.position.set(0, 1.7, 4);

// --- 5. LÓGICA DE TORMENTA Y ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);

    if (document.pointerLockElement === document.body) {
        const speed = 0.08;
        if (keys['KeyW']) camera.translateZ(-speed);
        if (keys['KeyS']) camera.translateZ(speed);
        if (keys['KeyA']) camera.translateX(-speed);
        if (keys['KeyD']) camera.translateX(speed);
        camera.position.y = 1.7; 
    }

    // Movimiento del ventilador
    fan.rotation.y += 0.15;

    // Relámpagos aleatorios
    if (Math.random() > 0.98) {
        lightningLight.intensity = 2 + Math.random() * 3;
        setTimeout(() => { lightningLight.intensity = 0; }, 100);
    }

    // Parpadeo luz naranja
    orangeLight.intensity = 25 + Math.random() * 10;

    renderer.render(scene, camera);
}
animate();
