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
let closetOpen = false, doorUnlocked = false, doorMoving = false;
let keys = {};

const getTex = (path, r) => {
    const t = loader.load(path);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(r, r);
    return t;
};

// Materiales
const wallMat = new THREE.MeshStandardMaterial({ map: getTex('pared.jpg', 3), color: 0x444444, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ map: getTex('madera.jpg', 1), color: 0x2d1f16 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });

// Habitación
const room = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// Iluminación parpadeante (Ventilador)
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.8, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.02, 0.5), woodMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

const light = new THREE.PointLight(0xff4400, 15, 12);
light.position.set(0, 3.9, 0);
light.castShadow = true;
scene.add(light);

// --- CAMA ---
const bed = new THREE.Group();
bed.position.set(-2.5, 0, -1.5);
scene.add(bed);

const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.6, 4), new THREE.MeshStandardMaterial({color: 0x111111}));
mattress.position.y = 0.3;
mattress.receiveShadow = true;
bed.add(mattress);

// --- ROPERO ---
const closet = new THREE.Group();
closet.position.set(2, 0, -3.5);
scene.add(closet);

const closetBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 0.8), woodMat);
closetBody.position.y = 1.75;
closetBody.castShadow = true;
closet.add(closetBody);

// Puerta del ropero (lo que se abre)
const closetDoor = new THREE.Group();
closetDoor.position.set(0, 1.75, 0.4);
closetDoor.name = "closet_target";
closet.add(closetDoor);

const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 3.3, 0.05), woodMat.clone());
doorPanel.name = "closet_target";
closetDoor.add(doorPanel);

// --- PUERTA BLINDADA ---
const armorDoorGroup = new THREE.Group();
armorDoorGroup.position.set(3.9, 1.6, 1.5);
scene.add(armorDoorGroup);

const armorDoor = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.2, 1.8), metalMat);
armorDoor.name = "door_target";
armorDoorGroup.add(armorDoor);

// Pantalla de código en la puerta
const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.2), new THREE.MeshBasicMaterial({color: 0x003300}));
screen.position.set(-0.08, 0.5, 0);
screen.rotation.y = -Math.PI/2;
armorDoorGroup.add(screen);

// --- INTERACCIÓN ---
function interact() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(scene.children, true);
    
    if(hits.length > 0) {
        const obj = hits[0].object;
        
        if(obj.name === "closet_target") {
            closetOpen = !closetOpen;
            document.getElementById('instruction').innerText = closetOpen ? "Ropero abierto" : "Ropero cerrado";
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
    document.getElementById('instruction').innerText = "Cerradura desactivada. Presiona E para abrir.";
});

// Controles básicos
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') interact();
});
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousedown', () => {
    if(document.getElementById('keypad-ui').style.display !== 'block') {
        document.body.requestPointerLock();
    }
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

    // Animación Ropero
    if(closetOpen && closetDoor.rotation.y < 1.5) closetDoor.rotation.y += 0.05;
    if(!closetOpen && closetDoor.rotation.y > 0) closetDoor.rotation.y -= 0.05;

    // Animación Puerta Blindada
    if(doorMoving && armorDoorGroup.position.z < 3.5) {
        armorDoorGroup.position.z += 0.05;
    }

    fanGroup.rotation.y += 0.2;
    renderer.render(scene, camera);
}
animate();
