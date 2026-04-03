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

// --- ESTADO DEL JUEGO ---
let hasKey = false;
let drawerOpen = false;
let hasFlashlight = false; // ¿La tenemos en el inventario?
let flashlightOn = false;  // ¿Está encendida?
let keys = {};
const textureLoader = new THREE.TextureLoader();

// --- CARGA DE TEXTURAS ---
const wallTexture = textureLoader.load('pared.jpg'); 
const woodTexture = textureLoader.load('madera.jpg');

const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, color: 0x888877, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ map: woodTexture, color: 0x554433, roughness: 0.9 });

// --- LUCES ---
const ambient = new THREE.AmbientLight(0xffffff, 0.01);
scene.add(ambient);

const orangeLight = new THREE.PointLight(0xff6600, 15, 15);
orangeLight.position.set(0, 3.5, 0);
orangeLight.castShadow = true;
scene.add(orangeLight);

// LA LUZ DE LA LINTERNA (SpotLight para efecto de cono)
const flashlightBeam = new THREE.SpotLight(0xffffff, 0, 15, Math.PI / 6, 0.5, 1);
flashlightBeam.castShadow = true;
scene.add(flashlightBeam);
scene.add(flashlightBeam.target); // El objetivo de la luz

// --- OBJETOS ---
const room = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), wallMat);
room.position.y = 4;
scene.add(room);

// Mesita de noche
const standGroup = new THREE.Group();
standGroup.position.set(-1.2, 0.6, -2.5);
scene.add(standGroup);
const standBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), woodMat);
standGroup.add(standBody);

// El cajón
const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), new THREE.MeshStandardMaterial({color: 0x332211}));
drawer.position.set(0, 0.3, 0.05); 
drawer.name = "cajon"; 
standGroup.add(drawer);

// LA LINTERNA (Objeto físico sobre la mesa)
const flashlightProp = new THREE.Group();
flashlightProp.name = "linterna_obj";
const bodyGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
bodyMesh.rotation.z = Math.PI / 2;
flashlightProp.add(bodyMesh);
flashlightProp.position.set(0, 0.7, 0); // Sobre la mesita
standGroup.add(flashlightProp);

// --- INTERACCIÓN (RAYCASTER) ---
const raycaster = new THREE.Raycaster();
const centerMouse = new THREE.Vector2(0, 0);

function handleInteraction() {
    raycaster.setFromCamera(centerMouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        let obj = intersects[0].object;
        let parent = obj.parent;

        // Agarrar linterna con "E"
        if ((obj.name === "linterna_obj" || parent.name === "linterna_obj") && !hasFlashlight) {
            hasFlashlight = true;
            flashlightProp.visible = false; // Desaparece de la mesa
            document.getElementById('instruction').innerText = "Linterna recogida. Presiona 'F' para usarla.";
        }
        
        // Abrir cajón (click o E)
        if (obj.name === "cajon" && !drawerOpen) {
            drawerOpen = true;
            document.getElementById('instruction').innerText = "Cajón abierto.";
        }
    }
}

// --- CONTROLES DE TECLADO ---
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    // Tecla E: Interactuar / Agarrar
    if (e.code === 'KeyE') {
        handleInteraction();
    }

    // Tecla F: Prender/Apagar linterna
    if (e.code === 'KeyF' && hasFlashlight) {
        flashlightOn = !flashlightOn;
        flashlightBeam.intensity = flashlightOn ? 40 : 0;
    }
});
document.addEventListener('keyup', (e) => keys[e.code] = false);

// --- MOVIMIENTO Y RATÓN ---
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

// --- BUCLE DE ANIMACIÓN ---
camera.position.set(0, 1.7, 4);

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

    // Hacer que la luz de la linterna siga a la cámara si la tenemos
    if (hasFlashlight) {
        flashlightBeam.position.copy(camera.position);
        // El objetivo de la luz se mueve un poco hacia adelante de donde mira la cámara
        const targetPos = new THREE.Vector3(0, 0, -1);
        targetPos.applyQuaternion(camera.quaternion);
        targetPos.add(camera.position);
        flashlightBeam.target.position.copy(targetPos);
    }

    if (drawerOpen && drawer.position.z < 0.5) drawer.position.z += 0.02;

    orangeLight.intensity = 15 + Math.random() * 5;
    renderer.render(scene, camera);
}
animate();
