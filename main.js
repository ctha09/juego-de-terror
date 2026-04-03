import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- 1. CONFIGURACIÓN ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- ESTADO ---
let hasKey = false;
let drawerOpen = false;
let hasFlashlight = false;
let flashlightOn = false;
let keys = {};
const textureLoader = new THREE.TextureLoader();

// --- TEXTURAS ---
const wallTex = textureLoader.load('pared.jpg');
const woodTex = textureLoader.load('madera.jpg');

const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, color: 0x888877, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, color: 0x554433 });

// --- LUCES ---
const orangeLight = new THREE.PointLight(0xff6600, 15, 10);
orangeLight.position.set(0, 2.8, 0);
orangeLight.castShadow = true;
scene.add(orangeLight);

const flashlightBeam = new THREE.SpotLight(0xffffff, 0, 15, Math.PI / 6, 0.5, 1);
flashlightBeam.castShadow = true;
scene.add(flashlightBeam);
scene.add(flashlightBeam.target);

// --- ARQUITECTURA (CUARTO PEQUEÑO) ---
// Reducido a 6x6 para que sea más tenso
const room = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), wallMat);
room.position.y = 2;
scene.add(room);

// Ventana (Hueco de luz)
const winGeo = new THREE.PlaneGeometry(1, 1.5);
const winMat = new THREE.MeshBasicMaterial({ color: 0x000022 });
const windowMesh = new THREE.Mesh(winGeo, winMat);
windowMesh.position.set(-2.98, 2, 0);
windowMesh.rotation.y = Math.PI / 2;
scene.add(windowMesh);

// Ventilador
const fan = new THREE.Group();
fan.position.set(0, 3.8, 0);
for(let i=0; i<4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(2, 0.05, 0.3), woodMat);
    b.rotation.y = (Math.PI / 2) * i;
    fan.add(b);
}
scene.add(fan);

// Cama
const bed = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 3.5), new THREE.MeshStandardMaterial({color: 0x555544}));
bed.position.set(-1.8, 0.25, -1);
scene.add(bed);

// MESITA DE LUZ + CAJÓN + LLAVE
const standGroup = new THREE.Group();
standGroup.position.set(-0.5, 0.5, -2);
scene.add(standGroup);

const standBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.6), woodMat);
standGroup.add(standBody);

const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), new THREE.MeshStandardMaterial({color: 0x221105}));
drawer.position.set(0, 0.2, 0.05);
drawer.name = "cajon_obj";
standGroup.add(drawer);

const key = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 0.1), new THREE.MeshStandardMaterial({color: 0xffd700}));
key.position.set(0, 0.1, 0);
key.name = "llave_obj";
key.visible = false; // Solo se ve al abrir
drawer.add(key);

// Linterna sobre la mesa
const flProp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2), new THREE.MeshStandardMaterial({color: 0x111111}));
flProp.rotation.z = Math.PI/2;
flProp.position.set(0, 0.55, 0);
flProp.name = "linterna_obj";
standGroup.add(flProp);

// --- INTERACCIÓN CON "E" ---
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0,0);

function interact() {
    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    
    if (hits.length > 0) {
        let obj = hits[0].object;
        
        // 1. Agarrar Linterna
        if (obj.name === "linterna_obj" && !hasFlashlight) {
            hasFlashlight = true;
            obj.visible = false;
            document.getElementById('instruction').innerText = "Linterna recogida (F para prender)";
        }
        // 2. Abrir Cajón
        else if (obj.name === "cajon_obj" && !drawerOpen) {
            drawerOpen = true;
            key.visible = true; // Revelar la llave
            document.getElementById('instruction').innerText = "Cajón abierto. Hay algo adentro...";
        }
        // 3. Agarrar Llave
        else if (obj.name === "llave_obj" && drawerOpen && !hasKey) {
            hasKey = true;
            obj.visible = false;
            document.getElementById('instruction').innerText = "¡Tienes la llave!";
        }
    }
}

// --- CONTROLES ---
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyE') interact();
    if (e.code === 'KeyF' && hasFlashlight) {
        flashlightOn = !flashlightOn;
        flashlightBeam.intensity = flashlightOn ? 40 : 0;
    }
});
document.addEventListener('keyup', (e) => keys[e.code] = false);

document.addEventListener('mousedown', () => {
    if (document.pointerLockElement !== document.body) document.body.requestPointerLock();
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

// --- LOOP ---
camera.position.set(0, 1.7, 2);

function animate() {
    requestAnimationFrame(animate);
    if (document.pointerLockElement === document.body) {
        const s = 0.05;
        if (keys['KeyW']) camera.translateZ(-s);
        if (keys['KeyS']) camera.translateZ(s);
        if (keys['KeyA']) camera.translateX(-s);
        if (keys['KeyD']) camera.translateX(s);
        camera.position.y = 1.7;
    }
    
    if (hasFlashlight) {
        flashlightBeam.position.copy(camera.position);
        const t = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).add(camera.position);
        flashlightBeam.target.position.copy(t);
    }
    
    if (drawerOpen && drawer.position.z < 0.4) drawer.position.z += 0.02;
    fan.rotation.y += 0.1;
    renderer.render(scene, camera);
}
animate();
