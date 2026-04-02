import * as THREE from 'three';

// --- 1. ESCENA Y RENDERER ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.Fog(0x0a0a0a, 1, 15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- 2. ILUMINACIÓN CORREGIDA ---
// Luz de apoyo (para ver siluetas)
const hemiLight = new THREE.HemisphereLight(0x444444, 0x000000, 0.6);
scene.add(hemiLight);

// Luz Naranja Principal (Ventilador)
const orangeLight = new THREE.PointLight(0xff6600, 40, 20); // Subí la intensidad a 40
orangeLight.position.set(0, 3.5, 0);
orangeLight.castShadow = true;
scene.add(orangeLight);

// --- 3. MATERIALES DE ALTA VISIBILIDAD ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x666655, side: THREE.BackSide, roughness: 0.8 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a321f, roughness: 0.9 });
const bedMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.7 });

// --- 4. CONSTRUCCIÓN DE OBJETOS ---

// Habitación (Caja grande)
const room = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), wallMat);
room.receiveShadow = true;
scene.add(room);

// Ventilador
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.8, 0);
const bladeGeo = new THREE.BoxGeometry(3, 0.05, 0.5);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(bladeGeo, metalMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

// Cama (Posicionada a un lado)
const bed = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 5), bedMat);
bed.position.set(-3, 0.4, -2);
bed.castShadow = true;
bed.receiveShadow = true;
scene.add(bed);

// Ropero
const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 1.5), woodMat);
wardrobe.position.set(3, 2.5, -3);
wardrobe.castShadow = true;
scene.add(wardrobe);

// Mesita de noche (Izquierda)
const stand = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), woodMat);
stand.position.set(-1, 0.5, -2);
stand.castShadow = true;
scene.add(stand);

// --- 5. MOVIMIENTO Y CÁMARA ---
camera.position.set(0, 1.7, 3); // Empezamos en el centro

let moveF = false, moveB = false, moveL = false, moveR = false;
const velocity = new THREE.Vector3();

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

document.body.addEventListener('click', () => { document.body.requestPointerLock(); });

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

// --- 6. GAME LOOP ---
let prevTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (document.pointerLockElement === document.body) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0; camDir.normalize();
        const sideDir = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();

        if (moveF) velocity.z += 80 * delta;
        if (moveB) velocity.z -= 80 * delta;
        if (moveL) velocity.x += 80 * delta;
        if (moveR) velocity.x -= 80 * delta;

        camera.position.addScaledVector(camDir, velocity.z * delta * 0.05);
        camera.position.addScaledVector(sideDir, -velocity.x * delta * 0.05);
        
        // Límites
        camera.position.x = Math.max(-4.5, Math.min(4.5, camera.position.x));
        camera.position.z = Math.max(-4.5, Math.min(4.5, camera.position.z));
    }

    fanGroup.rotation.y += 0.05;
    if (Math.random() > 0.95) orangeLight.intensity = 20 + Math.random() * 40;

    prevTime = time;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
