import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- ESTADO ---
let hasKey = false, drawerOpen = false, hasFlashlight = false, flashlightOn = false;
let keys = {};
const loader = new THREE.TextureLoader();

// --- FUNCIÓN PARA MEJORAR TEXTURAS ---
function prepareTex(tex, repeatX, repeatY) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    return tex;
}

// --- MATERIALES (AHORA CON MÁS DETALLE) ---
// Repetimos la textura 3 veces para que se note más el detalle
const wallMat = new THREE.MeshStandardMaterial({ 
    map: prepareTex(loader.load('pared.jpg'), 3, 2), 
    color: 0x777777, 
    side: THREE.BackSide,
    roughness: 0.8
});

const woodMat = new THREE.MeshStandardMaterial({ 
    map: prepareTex(loader.load('madera.jpg'), 1, 1), 
    color: 0x443322,
    roughness: 0.9
});

// --- MUNDO ---
const room = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// Ventilador
const fan = new THREE.Group();
fan.position.set(0, 3.8, 0);
for(let i=0; i<4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.3), woodMat);
    b.rotation.y = (Math.PI / 2) * i;
    fan.add(b);
}
scene.add(fan);

// Cama
const bed = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 3.5), new THREE.MeshStandardMaterial({color: 0x222222}));
bed.position.set(-1.8, 0.3, -1);
scene.add(bed);

// --- MESITA + CAJÓN (MEJORADO) ---
const stand = new THREE.Group();
stand.position.set(-0.8, 0.5, -2);
scene.add(stand);

const standBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.6), woodMat);
standBody.castShadow = true;
stand.add(standBody);

// El Cajón (Aseguramos el nombre en el Mesh)
const drawerGeo = new THREE.BoxGeometry(0.5, 0.2, 0.5);
const drawerMat = new THREE.MeshStandardMaterial({color: 0x1a0d00});
const drawer = new THREE.Mesh(drawerGeo, drawerMat);
drawer.position.set(0, 0.2, 0.05);
drawer.name = "cajon"; // CRÍTICO PARA LA INTERACCIÓN
stand.add(drawer);

const key = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.01, 0.04), new THREE.MeshStandardMaterial({color: 0xffd700}));
key.position.set(0, 0.05, 0);
key.name = "llave";
key.visible = false;
drawer.add(key);

const flProp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2), new THREE.MeshStandardMaterial({color: 0x050505}));
flProp.rotation.z = Math.PI/2;
flProp.position.y = 0.55;
flProp.name = "linterna";
stand.add(flProp);

// --- LUCES ---
const light = new THREE.PointLight(0xff6600, 12, 10);
light.position.set(0, 2.5, 0);
light.castShadow = true;
scene.add(light);

const flashlight = new THREE.SpotLight(0xffffff, 0, 20, Math.PI/7, 0.4);
flashlight.castShadow = true;
scene.add(flashlight);
scene.add(flashlight.target);

// --- INTERACCIÓN ---
function interact() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    
    if (hits.length > 0) {
        let obj = hits[0].object;
        console.log("Tocado:", obj.name); // Mira la consola para ver qué tocas

        if (obj.name === "linterna" && !hasFlashlight) {
            hasFlashlight = true; obj.visible = false;
            document.getElementById('instruction').innerText = "Linterna recogida (F)";
        } 
        else if (obj.name === "cajon" && !drawerOpen) {
            drawerOpen = true; 
            key.visible = true;
            document.getElementById('instruction').innerText = "Cajón abierto. Toma la llave.";
        } 
        else if (obj.name === "llave" && drawerOpen && !hasKey) {
            hasKey = true; obj.visible = false;
            document.getElementById('instruction').innerText = "¡Tienes la llave!";
        }
    }
}

// --- CONTROLES ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') interact();
    if(e.code === 'KeyF' && hasFlashlight) {
        flashlightOn = !flashlightOn;
        flashlight.intensity = flashlightOn ? 50 : 0;
    }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);
window.addEventListener('mousedown', () => document.body.requestPointerLock());
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

// --- LOOP ---
camera.position.set(0, 1.7, 2);
function animate() {
    requestAnimationFrame(animate);
    if (document.pointerLockElement) {
        const s = 0.06;
        if (keys['KeyW']) camera.translateZ(-s);
        if (keys['KeyS']) camera.translateZ(s);
        if (keys['KeyA']) camera.translateX(-s);
        if (keys['KeyD']) camera.translateX(s);
        camera.position.y = 1.7;
    }
    if (hasFlashlight) {
        flashlight.position.copy(camera.position);
        const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
        flashlight.target.position.copy(camera.position).add(dir);
    }
    if (drawerOpen && drawer.position.z < 0.4) drawer.position.z += 0.02;
    fan.rotation.y += 0.12;
    renderer.render(scene, camera);
}
animate();
