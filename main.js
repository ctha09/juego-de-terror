import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Sombra activada
document.body.appendChild(renderer.domElement);

// --- CARGA DE ASSETS ---
const loader = new THREE.TextureLoader();
let hasKey = false, drawerOpen = false, hasFlashlight = false, flashlightOn = false;
let keys = {};

// Función para evitar la mezcla de texturas
const getTex = (path, r) => {
    const t = loader.load(path);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(r, r);
    return t;
};

const wallMat = new THREE.MeshStandardMaterial({ map: getTex('pared.jpg', 3), color: 0x666666, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ map: getTex('madera.jpg', 1), color: 0x3d2b1f });

// --- CONSTRUCCIÓN ---
// Habitación
const room = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 7), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// VENTILADOR (Con sombras dinámicas)
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.8, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 0.4), woodMat.clone());
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

// CAMA (Restaurada)
const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 3.8), new THREE.MeshStandardMaterial({color: 0x222222}));
bed.position.set(-2, 0.3, -1);
bed.receiveShadow = true;
scene.add(bed);

// MESITA Y CAJÓN
const stand = new THREE.Group();
stand.position.set(-0.8, 0.5, -2.5);
scene.add(stand);

const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.6), woodMat.clone());
body.castShadow = true;
stand.add(body);

const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), new THREE.MeshStandardMaterial({color: 0x1a0d00}));
drawer.position.set(0, 0.2, 0.05);
drawer.name = "cajon_target"; // Nombre único para el raycaster
stand.add(drawer);

const key = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.05), new THREE.MeshStandardMaterial({color: 0xffd700}));
key.position.set(0, 0.1, 0);
key.name = "llave_target";
key.visible = false;
drawer.add(key);

const flMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), new THREE.MeshStandardMaterial({color: 0x000000}));
flMesh.rotation.z = Math.PI/2;
flMesh.position.y = 0.55;
flMesh.name = "flashlight_target";
stand.add(flMesh);

// --- ILUMINACIÓN ---
const light = new THREE.PointLight(0xff6600, 15, 12);
light.position.set(0, 3, 0);
light.castShadow = true;
scene.add(light);

const spot = new THREE.SpotLight(0xffffff, 0, 15, Math.PI/7);
scene.add(spot);
scene.add(spot.target);

// --- LÓGICA DE INTERACCIÓN CON "E" ---
function checkInteraction() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(scene.children, true);
    
    if(hits.length > 0) {
        const obj = hits[0].object;
        if(obj.name === "flashlight_target" && !hasFlashlight) {
            hasFlashlight = true; obj.visible = false;
            document.getElementById('instruction').innerText = "Linterna recogida (F)";
        }
        if(obj.name === "cajon_target" && !drawerOpen) {
            drawerOpen = true; key.visible = true;
            document.getElementById('instruction').innerText = "Cajón abierto. Toma la llave.";
        }
        if(obj.name === "llave_target" && drawerOpen) {
            hasKey = true; obj.visible = false;
            document.getElementById('instruction').innerText = "¡Tienes la llave!";
        }
    }
}

// --- CONTROLES ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') checkInteraction();
    if(e.code === 'KeyF' && hasFlashlight) {
        flashlightOn = !flashlightOn;
        spot.intensity = flashlightOn ? 50 : 0;
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
camera.position.set(0, 1.7, 2);
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
    if(drawerOpen && drawer.position.z < 0.4) drawer.position.z += 0.02;
    fanGroup.rotation.y += 0.15; // El ventilador gira
    renderer.render(scene, camera);
}
animate();
