import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- CONFIGURACIÓN ---
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
let hasKey = false, drawerOpen = false, hasFlashlight = false, flashlightOn = false;
let doorOpen = false;
let keys = {};

const getTex = (path, r) => {
    const t = loader.load(path);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(r, r);
    return t;
};

// --- MATERIALES ---
const wallMat = new THREE.MeshStandardMaterial({ map: getTex('pared.jpg', 3), color: 0x555555, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ map: getTex('madera.jpg', 1), color: 0x2d1f16 });

// --- HABITACIÓN ---
const room = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// VENTILADOR (Para sombras dinámicas)
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.7, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.02, 0.5), woodMat.clone());
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

const light = new THREE.PointLight(0xff6600, 20, 15);
light.position.set(0, 3.9, 0);
light.castShadow = true;
scene.add(light);

// --- NUEVA MESITA DE LUZ ---
const standGroup = new THREE.Group();
standGroup.position.set(-1.2, 0, -3);
scene.add(standGroup);

// Cuerpo de la mesita
const standBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.7), woodMat);
standBody.position.y = 0.5;
standBody.castShadow = true;
standGroup.add(standBody);

// El Cajón (Objeto separado para animar)
const drawerGroup = new THREE.Group();
drawerGroup.position.set(0, 0.65, 0.05); // Posición inicial cerrado
standGroup.add(drawerGroup);

const drawerFace = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.05), woodMat.clone());
drawerFace.name = "cajon_target"; // A esto le daremos click
drawerGroup.add(drawerFace);

const drawerBottom = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.5), woodMat.clone());
drawerBottom.position.set(0, -0.14, -0.25);
drawerGroup.add(drawerBottom);

// Llave dentro del cajón
const key = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.05), new THREE.MeshStandardMaterial({color: 0xffd700}));
key.position.set(0, -0.1, -0.25);
key.name = "llave_target";
key.visible = false;
drawerGroup.add(key);

// Linterna sobre la mesita
const flashlightItem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25), new THREE.MeshStandardMaterial({color: 0x000000}));
flashlightItem.rotation.z = Math.PI / 2;
flashlightItem.position.set(0, 1.05, -0.1);
flashlightItem.name = "linterna_target";
standGroup.add(flashlightItem);

// --- PUERTA ---
const doorFrame = new THREE.Group();
doorFrame.position.set(3.9, 1.5, 0);
scene.add(doorFrame);

const door = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 1.5), new THREE.MeshStandardMaterial({color: 0x1a0a00}));
door.name = "puerta_target";
door.position.z = 0.75; // Pivote para que abra como una puerta real
doorFrame.add(door);

// --- LINTERNA (LUZ) ---
const spot = new THREE.SpotLight(0xffffff, 0, 20, Math.PI / 6);
spot.castShadow = true;
scene.add(spot);
scene.add(spot.target);

// --- INTERACCIÓN ---
function interact() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    
    if(hits.length > 0) {
        const obj = hits[0].object;
        
        if(obj.name === "linterna_target") {
            hasFlashlight = true; obj.visible = false;
            document.getElementById('instruction').innerText = "Linterna recogida (Presiona F)";
        }
        if(obj.name === "cajon_target" && !drawerOpen) {
            drawerOpen = true; key.visible = true;
            document.getElementById('instruction').innerText = "Cajón abierto. Toma la llave.";
        }
        if(obj.name === "llave_target" && drawerOpen) {
            hasKey = true; obj.visible = false;
            document.getElementById('instruction').innerText = "¡Tienes la llave! Busca la puerta.";
        }
        if(obj.name === "puerta_target") {
            if(hasKey) {
                doorOpen = true;
                document.getElementById('instruction').innerText = "Puerta abierta.";
            } else {
                document.getElementById('instruction').innerText = "Está cerrada con llave.";
            }
        }
    }
}

// --- CONTROLES ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') interact();
    if(e.code === 'KeyF' && hasFlashlight) {
        flashlightOn = !flashlightOn;
        spot.intensity = flashlightOn ? 80 : 0;
    }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousedown', () => document.body.requestPointerLock());
window.addEventListener('mousemove', (e) => {
    if(document.pointerLockElement) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

// --- ANIMACIÓN ---
camera.position.set(0, 1.7, 3);
function animate() {
    requestAnimationFrame(animate);
    
    if(document.pointerLockElement) {
        const speed = 0.07;
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

    // Animación de apertura del cajón
    if(drawerOpen && drawerGroup.position.z < 0.5) {
        drawerGroup.position.z += 0.03;
    }

    // Animación de apertura de puerta
    if(doorOpen && doorFrame.rotation.y < 1.5) {
        doorFrame.rotation.y += 0.05;
    }

    fanGroup.rotation.y += 0.15;
    renderer.render(scene, camera);
}
animate();
