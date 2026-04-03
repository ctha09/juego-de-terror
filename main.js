import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
let closetOpen = false, doorUnlocked = false, doorMoving = false, hasFlashlight = false, flashlightOn = false;
let keys = {};

// --- MATERIALES ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });

// HABITACIÓN
const room = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// VENTILADOR Y LUZ NARANJA (Como la imagen)
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.8, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.02, 0.5), woodMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

const light = new THREE.PointLight(0xff5500, 25, 15); // Luz naranja intensa
light.position.set(0, 3.9, 0);
light.castShadow = true;
scene.add(light);

// CAMA
const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 4), new THREE.MeshStandardMaterial({color: 0x050505}));
bed.position.set(-2.5, 0.3, -1);
bed.receiveShadow = true;
scene.add(bed);

// --- ROPERO DE DOBLE PUERTA (ESTILO IMAGEN) ---
const closet = new THREE.Group();
closet.position.set(0, 0, -3.5); // Centrado al fondo
scene.add(closet);

// Cuerpo (Caja abierta por delante)
const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.8), woodMat);
body.position.y = 1.6;
body.castShadow = true;
body.receiveShadow = true;
closet.add(body);

// Estante interior (Compartimiento)
const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.7), woodMat);
shelf.position.set(0, 1.4, -0.05);
shelf.receiveShadow = true;
closet.add(shelf);

// Puerta Izquierda
const doorL = new THREE.Group();
doorL.position.set(-1.05, 1.6, 0.4);
closet.add(doorL);
const panelL = new THREE.Mesh(new THREE.BoxGeometry(1.05, 3.1, 0.05), woodMat.clone());
panelL.position.x = 0.525;
panelL.name = "closet_target";
doorL.add(panelL);

// Puerta Derecha
const doorR = new THREE.Group();
doorR.position.set(1.05, 1.6, 0.4);
closet.add(doorR);
const panelR = new THREE.Mesh(new THREE.BoxGeometry(1.05, 3.1, 0.05), woodMat.clone());
panelR.position.x = -0.525;
panelR.name = "closet_target";
doorR.add(panelR);

// LINTERNA (Apoyada en el estante)
const flashlightObj = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.25), new THREE.MeshStandardMaterial({color: 0x000000, emissive: 0x111111}));
flashlightObj.position.set(0, 1.5, -0.1);
flashlightObj.rotation.z = Math.PI/2;
flashlightObj.name = "flashlight_pickup";
closet.add(flashlightObj);

// --- PUERTA BLINDADA ---
const armorDoorGroup = new THREE.Group();
armorDoorGroup.position.set(3.9, 1.6, 1.5);
scene.add(armorDoorGroup);
const armorDoor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.2, 1.8), metalMat);
armorDoor.name = "door_target";
armorDoorGroup.add(armorDoor);

// LUZ LINTERNA (SpotLight)
const spot = new THREE.SpotLight(0xffffff, 0, 25, Math.PI/6, 0.5);
spot.castShadow = true;
scene.add(spot);
scene.add(spot.target);

// --- LÓGICA ---
function interact() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(scene.children, true);
    
    if(hits.length > 0) {
        const obj = hits[0].object;
        if(obj.name === "closet_target") closetOpen = !closetOpen;
        if(obj.name === "flashlight_pickup" && closetOpen) {
            hasFlashlight = true; obj.visible = false;
            document.getElementById('instruction').innerText = "Linterna recogida. Úsala con 'F'";
        }
        if(obj.name === "door_target") {
            if(!doorUnlocked) {
                document.exitPointerLock();
                document.getElementById('keypad-ui').style.display = 'block';
            } else { doorMoving = true; }
        }
    }
}

window.addEventListener('unlockDoor', () => { doorUnlocked = true; });
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') interact();
    if(e.code === 'KeyF' && hasFlashlight) {
        flashlightOn = !flashlightOn;
        spot.intensity = flashlightOn ? 100 : 0;
    }
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
    // Animación Doble Puerta
    const targetRot = closetOpen ? 1.8 : 0;
    doorL.rotation.y += (targetRot - doorL.rotation.y) * 0.1;
    doorR.rotation.y += (-targetRot - doorR.rotation.y) * 0.1;

    if(doorMoving && armorDoorGroup.position.z < 3.8) armorDoorGroup.position.z += 0.04;
    fanGroup.rotation.y += 0.25;
    renderer.render(scene, camera);
}
animate();
