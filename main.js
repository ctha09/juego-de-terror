import * as THREE from 'three';

// --- 1. CONFIGURACIÓN DE LA ESCENA Y RENDERER ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x111111, 0.15); // Niebla para ambiente hostil

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ'; // Orden de rotación para FPS

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- 2. ILUMINACIÓN ---
const ambientLight = new THREE.AmbientLight(0x404040, 0.3); 
scene.add(ambientLight);

const orangeLight = new THREE.PointLight(0xff6600, 20, 15);
orangeLight.position.set(0, 3.8, 0);
orangeLight.castShadow = true;
orangeLight.shadow.mapSize.width = 1024;
orangeLight.shadow.mapSize.height = 1024;
scene.add(orangeLight);

// --- 3. MATERIALES ---
const woodMat = new THREE.MeshPhongMaterial({ color: 0x3d2817 });
const wallMat = new THREE.MeshStandardMaterial({ color: 0x555544, side: THREE.BackSide });
const bedMat = new THREE.MeshPhongMaterial({ color: 0xd9d0c7 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });

// --- 4. CONSTRUCCIÓN DEL MUNDO (PROCEDURAL) ---

// Habitación
const room = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), wallMat);
room.receiveShadow = true;
scene.add(room);

// Ventilador de Techo
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.9, 0);
const bladeGeo = new THREE.BoxGeometry(2.5, 0.02, 0.4);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(bladeGeo, metalMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

// Cama
const bedGroup = new THREE.Group();
bedGroup.position.set(-2.5, 0, -2);
const mattress = new THREE.Mesh(new THREE.BoxGeometry(4, 0.6, 2.5), bedMat);
mattress.position.y = 0.6;
mattress.castShadow = true;
bedGroup.add(mattress);
scene.add(bedGroup);

// Ropero
const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2, 4.5, 1.2), woodMat);
wardrobe.position.set(2, 2.25, -3.5);
wardrobe.castShadow = true;
scene.add(wardrobe);

// Mesitas de Noche
function createStand(x, z) {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), woodMat);
    stand.position.set(x, 0.4, z);
    stand.castShadow = true;
    scene.add(stand);
}
createStand(-0.8, -2); // Izquierda (donde estará la llave)
createStand(-4.2, -2); // Derecha

// --- 5. LÓGICA DE MOVIMIENTO Y CONTROLES ---
let moveF = false, moveB = false, moveL = false, moveR = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

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

document.body.addEventListener('click', () => {
    document.body.requestPointerLock();
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, camera.rotation.x));
    }
});

// --- 6. BUCLE DE ANIMACIÓN (GAME LOOP) ---
camera.position.set(0, 1.7, 4);
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (document.pointerLockElement === document.body) {
        // Física de movimiento
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveF) - Number(moveB);
        direction.x = Number(moveR) - Number(moveL);
        direction.normalize();

        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();
        const sideDir = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();

        if (moveF || moveB) velocity.z -= direction.z * 80.0 * delta;
        if (moveL || moveR) velocity.x -= direction.x * 80.0 * delta;

        camera.position.addScaledVector(camDir, -velocity.z * delta * 0.05);
        camera.position.addScaledVector(sideDir, velocity.x * delta * 0.05);

        // Colisiones con paredes
        camera.position.x = Math.max(-4.5, Math.min(4.5, camera.position.x));
        camera.position.z = Math.max(-4.5, Math.min(4.5, camera.position.z));
    }

    // Animaciones de ambiente
    fanGroup.rotation.y += 0.1;
    if (Math.random() > 0.97) orangeLight.intensity = 10 + Math.random() * 30;

    prevTime = time;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
