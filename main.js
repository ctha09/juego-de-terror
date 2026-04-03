import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.12);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
let closetOpen = false, doorUnlocked = false, doorMoving = false;
let hasFlashlight = false, flashlightOn = false;
let keys = {};

const getTex = (path, r) => {
    const t = loader.load(path);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(r, r);
    return t;
};

// MATERIALES
const wallMat = new THREE.MeshStandardMaterial({ map: getTex('pared.jpg', 3), color: 0x444444, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ map: getTex('madera.jpg', 1), color: 0x3d2b1f });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });

// HABITACIÓN
const room = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// LUZ CENTRAL Y VENTILADOR
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.6, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.03, 0.6), woodMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

const ceilingLight = new THREE.PointLight(0xff5500, 15, 12);
ceilingLight.position.set(0, 3.9, 0);
ceilingLight.castShadow = true;
scene.add(ceilingLight);

// CAMA
const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 4.2), new THREE.MeshStandardMaterial({color: 0x0a0a0a}));
bed.position.set(-2.6, 0.3, -1);
bed.receiveShadow = true;
scene.add(bed);

// --- ROPERO CON COMPARTIMIENTO ---
const closet = new THREE.Group();
closet.position.set(2.2, 0, -3.4);
scene.add(closet);

// Cuerpo principal
const closetBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.6, 0.9), woodMat);
closetBody.position.y = 1.8;
closetBody.castShadow = true;
closetBody.receiveShadow = true;
closet.add(closetBody);

// COMPARTIMIENTO (Estante interno)
const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 0.7), woodMat.clone());
shelf.position.set(0, 1.2, -0.05); // Altura media dentro del ropero
shelf.receiveShadow = true;
closet.add(shelf);

// Puerta del ropero
const closetDoor = new THREE.Group();
closetDoor.position.set(0, 1.8, 0.45);
closetDoor.name = "closet_target";
closet.add(closetDoor);

const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.05), woodMat.clone());
doorPanel.name = "closet_target";
closetDoor.add(doorPanel);

// LINTERNA (Apoyada sobre el estante)
const flashlightObj = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22), new THREE.MeshStandardMaterial({color: 0x000000}));
flashlightObj.position.set(0, 1.28, -0.15); // Justo arriba del shelf
flashlightObj.rotation.z = Math.PI / 2;
flashlightObj.name = "flashlight_pickup";
closet.add(flashlightObj);

// PUERTA BLINDADA
const armorDoorGroup = new THREE.Group();
armorDoorGroup.position.set(3.9, 1.6, 1.5);
scene.add(armorDoorGroup);

const armorDoor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.2, 1.8), metalMat);
armorDoor.name = "door_target";
armorDoorGroup.add(armorDoor);

// LINTERNA LUZ (SpotLight)
const spot = new THREE.SpotLight(0xffffff, 0, 25, Math.PI/6, 0.5);
spot.castShadow = true;
scene.add(spot);
scene.add(spot.target);

// INTERACCIÓN
function interact() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(scene.children, true);
    
    if(hits.length > 0) {
        const obj = hits[0].object;
        if(obj.name === "closet_target") closetOpen = !closetOpen;
        if(obj.name === "flashlight_pickup" && closetOpen) {
            hasFlashlight = true; obj.visible = false;
            document.getElementById('battery-ui').style.display = 'block';
            document.getElementById('instruction').innerText = "Linterna equipada (F)";
        }
        if(obj.name === "door_target") {
            if(!doorUnlocked) {
                document.exitPointerLock();
                document.getElementById('keypad-ui').style.display = 'block';
            } else {
                doorMoving = true;
            }
        }
    }
}

window.addEventListener('unlockDoor', () => {
    doorUnlocked = true;
    document.getElementById('instruction').innerText = "Código correcto. Abre la puerta blindada.";
});

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') interact();
    if(e.code === 'KeyF' && hasFlashlight) {
        flashlightOn = !flashlightOn;
        spot.intensity = flashlightOn ? 100 : 0;
    }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousedown', () => {
    if(document.getElementById('keypad-ui').style.display !== 'block') document.body.requestPointerLock();
});
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
    if(closetOpen && closetDoor.rotation.y < 1.6) closetDoor.rotation.y += 0.05;
    if(!closetOpen && closetDoor.rotation.y > 0) closetDoor.rotation.y -= 0.05;
    if(doorMoving && armorDoorGroup.position.z < 3.8) armorDoorGroup.position.z += 0.04;
    fanGroup.rotation.y += 0.2;
    renderer.render(scene, camera);
}
animate();
