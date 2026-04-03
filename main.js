import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.1);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
let closetOpen = false, doorMoving = false, hasFlashlight = false, flashlightOn = false;
let keys = {};

// Materiales
const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.BackSide });
const corridorMat = new THREE.MeshStandardMaterial({ color: 0x151515, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f });

// --- HABITACIÓN INICIAL ---
const room = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// Luz Naranja y Ventilador
const light = new THREE.PointLight(0xff5500, 15, 10);
light.position.set(0, 3.8, 0);
light.castShadow = true;
scene.add(light);

const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.7, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.02, 0.5), woodMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

// Muebles
const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 4), new THREE.MeshStandardMaterial({color: 0x050505}));
bed.position.set(-2.5, 0.3, -1);
scene.add(bed);

// Ropero Doble Puerta
const closet = new THREE.Group();
closet.position.set(0, 0, -3.5);
scene.add(closet);
const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.8), woodMat);
body.position.y = 1.6;
closet.add(body);

const doorL = new THREE.Group(); doorL.position.set(-1.05, 1.6, 0.4); closet.add(doorL);
const pL = new THREE.Mesh(new THREE.BoxGeometry(1.05, 3.1, 0.05), woodMat); pL.position.x = 0.525; pL.name="closet"; doorL.add(pL);
const doorR = new THREE.Group(); doorR.position.set(1.05, 1.6, 0.4); closet.add(doorR);
const pR = new THREE.Mesh(new THREE.BoxGeometry(1.05, 3.1, 0.05), woodMat); pR.position.x = -0.525; pR.name="closet"; doorR.add(pR);

const flObj = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2), new THREE.MeshStandardMaterial({color: 0x000}));
flObj.position.set(0, 1.5, -0.1); flObj.rotation.z = Math.PI/2; flObj.name = "fl"; closet.add(flObj);

// --- EL PASILLO ABANDONADO ---
const corridorGroup = new THREE.Group();
corridorGroup.position.set(14, 2, 1.5); // Posicionado detrás de la puerta blindada
scene.add(corridorGroup);

const corridor = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 3), corridorMat);
corridor.receiveShadow = true;
corridorGroup.add(corridor);

// Luces LED Blancas en línea (Pasillo)
for(let i = -8; i <= 8; i += 3) {
    const led = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({color: 0xffffff}));
    led.position.set(i, 1.99, 0);
    led.rotation.x = Math.PI / 2;
    corridorGroup.add(led);

    const pLight = new THREE.PointLight(0xffffff, 8, 5);
    pLight.position.set(i, 1.8, 0);
    pLight.castShadow = true;
    corridorGroup.add(pLight);
}

// --- PUERTA BLINDADA ---
const armorDoorGroup = new THREE.Group();
armorDoorGroup.position.set(3.9, 1.6, 1.5);
scene.add(armorDoorGroup);
const armorDoor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 2.5), new THREE.MeshStandardMaterial({color: 0x111, metalness: 0.9}));
armorDoor.name = "door_target";
armorDoorGroup.add(armorDoor);

// Linterna Jugador
const spot = new THREE.SpotLight(0xffffff, 0, 25, Math.PI/6, 0.5);
scene.add(spot); scene.add(spot.target);

// Lógica
function interact() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(scene.children, true);
    if(hits.length > 0) {
        const n = hits[0].object.name;
        if(n === "closet") closetOpen = !closetOpen;
        if(n === "fl" && closetOpen) { hasFlashlight = true; hits[0].object.visible = false; }
        if(n === "door_target") { document.exitPointerLock(); document.getElementById('keypad-ui').style.display='block'; }
    }
}

window.addEventListener('openBlindDoor', () => { doorMoving = true; });
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') interact();
    if(e.code === 'KeyF' && hasFlashlight) { flashlightOn = !flashlightOn; spot.intensity = flashlightOn ? 100 : 0; }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousedown', () => { if(document.getElementById('keypad-ui').style.display !== 'block') document.body.requestPointerLock(); });
window.addEventListener('mousemove', (e) => {
    if(document.pointerLockElement) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

camera.position.set(0, 1.7, 4);
function animate() {
    requestAnimationFrame(animate);
    if(document.pointerLockElement) {
        const speed = 0.06;
        if(keys['KeyW']) camera.translateZ(-speed);
        if(keys['KeyS']) camera.translateZ(speed);
        if(keys['KeyA']) camera.translateX(-speed);
        if(keys['KeyD']) camera.translateX(speed);
        camera.position.y = 1.7;
    }
    if(hasFlashlight) {
        spot.position.copy(camera.position);
        spot.target.position.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
    }
    // Animaciones
    const tRot = closetOpen ? 2 : 0;
    doorL.rotation.y += (tRot - doorL.rotation.y) * 0.1;
    doorR.rotation.y += (-tRot - doorR.rotation.y) * 0.1;
    if(doorMoving && armorDoorGroup.position.x < 7) armorDoorGroup.position.x += 0.05;
    fanGroup.rotation.y += 0.2;
    renderer.render(scene, camera);
}
animate();
