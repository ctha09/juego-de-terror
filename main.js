import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- ESTADO Y CARGA ---
let hasKey = false, drawerOpen = false, hasFlashlight = false, flashlightOn = false;
let keys = {};
const loader = new THREE.TextureLoader();

// Función para que la textura se repita y se vea nítida
const loadTex = (path, repeat) => {
    const t = loader.load(path);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    return t;
};

// --- MATERIALES ---
const wallMat = new THREE.MeshStandardMaterial({ map: loadTex('pared.jpg', 4), color: 0x777777, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ map: loadTex('madera.jpg', 1), color: 0x443322 });

// --- MUNDO ---
const room = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), wallMat);
room.position.y = 2;
scene.add(room);

const stand = new THREE.Group();
stand.position.set(-0.8, 0.5, -2);
scene.add(stand);

const standBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.6), woodMat);
stand.add(standBody);

// EL CAJÓN (Aseguramos que el nombre esté en el Mesh)
const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5), new THREE.MeshStandardMaterial({color: 0x1a0d00}));
drawer.position.set(0, 0.2, 0.05);
drawer.name = "cajon"; // <--- ESTO ES LO QUE BUSCA EL CLICK
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
const light = new THREE.PointLight(0xff6600, 10, 10);
light.position.set(0, 2.5, 0);
scene.add(light);

const flashlight = new THREE.SpotLight(0xffffff, 0, 20, Math.PI/7);
scene.add(flashlight);
scene.add(flashlight.target);

// --- INTERACCIÓN MEJORADA ---
function interact() {
    const raycaster = new THREE.Raycaster();
    // Lanzamos el rayo desde el centro exacto de la pantalla (la cruz +)
    raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    
    if (hits.length > 0) {
        // Buscamos el objeto o su padre por nombre
        let target = hits[0].object;
        
        if (target.name === "linterna" && !hasFlashlight) {
            hasFlashlight = true; target.visible = false;
            document.getElementById('instruction').innerText = "Linterna recogida (F)";
        } 
        else if (target.name === "cajon" && !drawerOpen) {
            drawerOpen = true; 
            key.visible = true;
            document.getElementById('instruction').innerText = "Cajón abierto. Toma la llave con E.";
        } 
        else if (target.name === "llave" && drawerOpen && !hasKey) {
            hasKey = true; target.visible = false;
            document.getElementById('instruction').innerText = "¡Tienes la llave!";
        }
    }
}

// --- CONTROLES Y LOOP ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') interact(); // <--- LA TECLA E DISPARA LA FUNCIÓN
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

function animate() {
    requestAnimationFrame(animate);
    if (document.pointerLockElement) {
        const s = 0.05;
        if (keys['KeyW']) camera.translateZ(-s);
        if (keys['KeyS']) camera.translateZ(s);
        if (keys['KeyA']) camera.translateX(-s);
        if (keys['KeyD']) camera.translateX(s);
        camera.position.y = 1.7;
    }
    if (hasFlashlight) {
        flashlight.position.copy(camera.position);
        flashlight.target.position.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()));
    }
    // Animación física del cajón
    if (drawerOpen && drawer.position.z < 0.45) {
        drawer.position.z += 0.02;
    }
    renderer.render(scene, camera);
}
animate();
