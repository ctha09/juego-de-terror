import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.2);

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

// Materiales
const wallMat = new THREE.MeshStandardMaterial({ map: getTex('pared.jpg', 3), color: 0x333333, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ map: getTex('madera.jpg', 1), color: 0x2d1f16 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });

// Habitación
const room = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// Ventilador y Luz Central
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.8, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.02, 0.5), woodMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

const light = new THREE.PointLight(0xff3300, 8, 10);
light.position.set(0, 3.9, 0);
light.castShadow = true;
scene.add(light);

// CAMA
const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 4), new THREE.MeshStandardMaterial({color: 0x0a0a0a}));
bed.position.set(-2.5, 0.3, -1.5);
bed.receiveShadow = true;
scene.add(bed);

// ROPERO
const closet = new THREE.Group();
closet.position.set(2, 0, -3.5);
scene.add(closet);

const closetBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 0.8), woodMat);
closetBody.position.y = 1.75;
closetBody.castShadow = true;
closet.add(closetBody);

const closetDoor = new THREE.Group();
closetDoor.position.set(0, 1.75, 0.4);
closetDoor.name = "closet_target";
closet.add(closetDoor);

const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.3, 0.05), woodMat.clone());
doorPanel.name = "closet_target";
closetDoor.add(doorPanel);

// LINTERNA (Dentro del ropero)
const flashlightObj = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2), new THREE.MeshStandardMaterial({color: 0x000000}));
flashlightObj.position.set(0, 1, -0.2); // Escondida adentro
flashlightObj.name = "flashlight_pickup";
closet.add(flashlightObj);

// PUERTA BLINDADA
const armorDoorGroup = new THREE.Group();
armorDoorGroup.position.set(3.9, 1.6, 1.5);
scene.add(armorDoorGroup);

const armorDoor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.2, 1.8), metalMat);
armorDoor.name = "door_target";
armorDoorGroup.add(armorDoor);

// LUZ DE LINTERNA (SpotLight)
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
        
        if(obj.name === "closet_target") {
            closetOpen = !closetOpen;
        }
        
        if(obj.name === "flashlight_pickup") {
            hasFlashlight = true;
            obj.visible = false;
            document.getElementById('battery-ui').style.display = 'block';
            document.getElementById('instruction').innerText = "Linterna obtenida. Presiona F";
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
    document.getElementById('instruction').innerText = "Puerta desbloqueada. Ábrela.";
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

    if(doorMoving && armorDoorGroup.position.z < 3.5) armorDoorGroup.position.z += 0.04;

    fanGroup.rotation.y += 0.25;
    renderer.render(scene, camera);
}
animate();
