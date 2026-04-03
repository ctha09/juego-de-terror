import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- ESTADO DEL JUEGO ---
let hasKey = false;
let drawerOpen = false;

// --- LUCES ---
const ambient = new THREE.AmbientLight(0x404040, 0.1); 
scene.add(ambient);

const orangeLight = new THREE.PointLight(0xff4400, 35, 15);
orangeLight.position.set(0, 3.5, 0);
orangeLight.castShadow = true;
scene.add(orangeLight);

const lightningLight = new THREE.DirectionalLight(0xffffff, 0);
lightningLight.position.set(5, 3, -5);
scene.add(lightningLight);

// --- HABITACIÓN ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x444433, side: THREE.BackSide });
const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), wallMat);
walls.receiveShadow = true;
scene.add(walls);

// --- VENTILADOR ---
const fan = new THREE.Group();
fan.position.set(0, 3.8, 0);
const bladeGeo = new THREE.BoxGeometry(3.5, 0.05, 0.5);
const woodMat = new THREE.MeshStandardMaterial({ color: 0x221105 });
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(bladeGeo, woodMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fan.add(blade);
}
scene.add(fan);

// --- MESITA Y CAJÓN (Interactivo) ---
const standGroup = new THREE.Group();
standGroup.position.set(-1.2, 0.5, -2.5);

const standBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), woodMat);
standBody.castShadow = true;
standGroup.add(standBody);

// El cajón es un objeto separado para poder moverlo
const drawerGeo = new THREE.BoxGeometry(0.7, 0.2, 0.7);
const drawerMat = new THREE.MeshStandardMaterial({ color: 0x332211 });
const drawer = new THREE.Mesh(drawerGeo, drawerMat);
drawer.position.set(0, 0.2, 0.05); // Posición inicial cerrado
drawer.name = "cajon"; // Nombre para detectarlo con el Raycaster
standGroup.add(drawer);

// La Llave (pequeño cubo dorado dentro del cajón)
const keyGeo = new THREE.BoxGeometry(0.1, 0.02, 0.2);
const keyMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xffd700, emissiveIntensity: 0.2 });
const key = new THREE.Mesh(keyGeo, keyMat);
key.position.set(0, 0.15, 0);
key.visible = true;
key.name = "llave";
drawer.add(key); // La llave se mueve junto con el cajón

scene.add(standGroup);

// --- RAYCASTER (Para detectar clicks en objetos) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); // El centro de la pantalla

// --- CONTROLES ---
let keys = {};
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);
document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== document.body) {
        document.body.requestPointerLock();
    } else {
        // Intentar interactuar cuando hacemos click
        checkInteraction();
    }
});

function checkInteraction() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;

        if (object.name === "cajon" && !drawerOpen) {
            drawerOpen = true;
            document.getElementById('instruction').innerText = "Cajón abierto... ¿Qué hay dentro?";
        } else if (object.name === "llave" && drawerOpen && !hasKey) {
            hasKey = true;
            object.visible = false;
            document.getElementById('instruction').innerText = "Has obtenido la llave antigua.";
            setTimeout(() => {
                document.getElementById('instruction').innerText = "Busca la salida en el piso de abajo.";
            }, 3000);
        }
    }
}

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

camera.position.set(0, 1.7, 4);

// --- BUCLE PRINCIPAL ---
function animate() {
    requestAnimationFrame(animate);

    if (document.pointerLockElement === document.body) {
        const speed = 0.08;
        if (keys['KeyW']) camera.translateZ(-speed);
        if (keys['KeyS']) camera.translateZ(speed);
        if (keys['KeyA']) camera.translateX(-speed);
        if (keys['KeyD']) camera.translateX(speed);
        camera.position.y = 1.7; 
    }

    // Animación del cajón abriéndose
    if (drawerOpen && drawer.position.z < 0.5) {
        drawer.position.z += 0.02;
    }

    fan.rotation.y += 0.15;

    // Relámpagos
    if (Math.random() > 0.985) {
        lightningLight.intensity = 3;
        setTimeout(() => { lightningLight.intensity = 0; }, 150);
    }

    orangeLight.intensity = 30 + Math.random() * 15;

    renderer.render(scene, camera);
}
animate();
