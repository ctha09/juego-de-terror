import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- CONFIGURACIÓN ESCENA ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- VARIABLES DE ESTADO ---
let hasKey = false, drawerOpen = false, hasFlashlight = false, flashlightOn = false;
let keys = {};
const loader = new THREE.TextureLoader();

// Función para texturas nítidas y repetidas
const getTex = (path, r) => {
    const t = loader.load(path);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(r, r);
    return t;
};

// --- MATERIALES ---
const wallMat = new THREE.MeshStandardMaterial({ map: getTex('pared.jpg', 3), color: 0x777777, side: THREE.BackSide, roughness: 0.8 });
const woodMat = new THREE.MeshStandardMaterial({ map: getTex('madera.jpg', 1), color: 0x3d2b1f, roughness: 0.9 });

// --- OBJETOS ---

// Habitación
const room = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 7), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// Ventilador (Genera luz entrecortada)
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.5, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.02, 0.4), woodMat.clone());
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fanGroup.add(blade);
}
scene.add(fanGroup);

// Cama
const bed = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 3.8), new THREE.MeshStandardMaterial({color: 0x151515}));
bed.position.set(-2.2, 0.3, -1.2);
bed.receiveShadow = true;
scene.add(bed);

// Mesita de luz (Separada de la cama)
const stand = new THREE.Group();
stand.position.set(-0.6, 0.5, -2.8); 
scene.add(stand);

const standBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.6), woodMat.clone());
standBody.castShadow = true;
stand.add(standBody);

// EL CAJÓN (Objetivo de interacción)
const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.5), new THREE.MeshStandardMaterial({color: 0x1a0d00}));
drawer.position.set(0, 0.2, 0.05);
drawer.name = "cajon_target"; // Nombre para el Raycaster
stand.add(drawer);

const key = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.05), new THREE.MeshStandardMaterial({color: 0xffd700}));
key.position.set(0, 0.1, 0);
key.name = "llave_target";
key.visible = false;
drawer.add(key);

const flItem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), new THREE.MeshStandardMaterial({color: 0x000000}));
flItem.rotation.z = Math.PI/2;
flItem.position.y = 0.55;
flItem.name = "flashlight_target";
stand.add(flItem);

// --- LUCES ---
const ceilingLight = new THREE.PointLight(0xff6600, 18, 12);
ceilingLight.position.set(0, 3.9, 0); // Arriba del ventilador
ceilingLight.castShadow = true;
scene.add(ceilingLight);

const spot = new THREE.SpotLight(0xffffff, 0, 20, Math.PI/7);
spot.castShadow = true;
scene.add(spot);
scene.add(spot.target);

// --- SISTEMA DE INTERACCIÓN ---
function interact() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(scene.children, true);
    
    if(hits.length > 0) {
        const obj = hits[0].object;
        
        if(obj.name === "cajon_target" && !drawerOpen) {
            drawerOpen = true;
            key.visible = true;
            document.getElementById('instruction').innerText = "Cajón abierto. Toma la llave con 'E'.";
        }
        else if(obj.name === "llave_target" && drawerOpen) {
            hasKey = true;
            obj.visible = false;
            document.getElementById('instruction').innerText = "¡Tienes la llave!";
        }
        else if(obj.name === "flashlight_target" && !hasFlashlight) {
            hasFlashlight = true;
            obj.visible = false;
            document.getElementById('instruction').innerText = "Linterna recogida (Presiona F)";
        }
    }
}

// --- CONTROLES ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') interact();
    if(e.code === 'KeyF' && hasFlashlight) {
        flashlightOn = !flashlightOn;
        spot.intensity = flashlightOn ? 60 : 0;
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

// --- BUCLE DE ANIMACIÓN ---
camera.position.set(0, 1.7, 2);
function animate() {
    requestAnimationFrame(animate);
    
    if(document.pointerLockElement) {
        const s = 0.06;
        if(keys['KeyW']) camera.translateZ(-s);
        if(keys['KeyS']) camera.translateZ(s);
        if(keys['KeyA']) camera.translateX(-s);
        if(keys['KeyD']) camera.translateX(s);
        camera.position.y = 1.7; // Mantener altura
    }

    if(hasFlashlight) {
        spot.position.copy(camera.position);
        spot.target.position.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
    }

    if(drawerOpen && drawer.position.z < 0.45) {
        drawer.position.z += 0.02;
    }

    fanGroup.rotation.y += 0.2; // Velocidad del ventilador
    renderer.render(scene, camera);
}
animate();
