import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
// Niebla muy baja para que no bloquee la vista inicial
scene.fog = new THREE.FogExp2(0x050505, 0.05);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- LUCES PARA EVITAR PANTALLA NEGRA ---
const ambient = new THREE.AmbientLight(0xffffff, 0.05); // Luz mínima general
scene.add(ambient);

const roomLight = new THREE.PointLight(0xffaa00, 15, 10); // Luz naranja de la pieza
roomLight.position.set(0, 3.5, 0);
scene.add(roomLight);

// --- OBJETOS ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const room = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
room.position.y = 2;
room.receiveShadow = true;
scene.add(room);

// Ropero
const closetGroup = new THREE.Group();
closetGroup.position.set(0, 0, -3.5);
scene.add(closetGroup);

const closetBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.8), new THREE.MeshStandardMaterial({color: 0x221100}));
closetBody.position.y = 1.6;
closetGroup.add(closetBody);

const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.1, 0.05), new THREE.MeshStandardMaterial({color: 0x332211}));
doorL.position.set(-0.55, 1.6, 0.4);
doorL.name = "interactable_closet";
closetGroup.add(doorL);

// Linterna (fl)
const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3), new THREE.MeshStandardMaterial({color: 0x000, emissive: 0x222}));
fl.position.set(0, 1.5, -0.1);
fl.name = "interactable_fl";
closetGroup.add(fl);

// --- LÓGICA DE RATÓN Y MOVIMIENTO ---
let keys = {}, hasFlashlight = false, flashlightOn = false, closetOpen = false;

// CORRECCIÓN: El clic debe activar el PointerLock
window.addEventListener('mousedown', () => {
    if (document.getElementById('keypad-ui').style.display !== 'block') {
        renderer.domElement.requestPointerLock();
        document.getElementById('instruction').innerText = "Presiona 'E' para interactuar";
    }
});

// Función de Raycaster corregida
function interact() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        console.log("Interactuando con:", obj.name);

        if (obj.name === "interactable_closet") {
            closetOpen = !closetOpen;
            // Animación simple de apertura
            obj.parent.position.z += closetOpen ? 0.2 : -0.2; 
        }

        if (obj.name === "interactable_fl") {
            hasFlashlight = true;
            obj.visible = false;
            document.getElementById('instruction').innerText = "Linterna equipada (F)";
        }
    }
}

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyE') interact();
    if (e.code === 'KeyF' && hasFlashlight) {
        flashlightOn = !flashlightOn;
        // Aquí podrías añadir un SpotLight atado a la cámara
    }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

// Bucle de animación
camera.position.set(0, 1.7, 3);
function animate() {
    requestAnimationFrame(animate);
    if (document.pointerLockElement) {
        const speed = 0.06;
        if (keys['KeyW']) camera.translateZ(-speed);
        if (keys['KeyS']) camera.translateZ(speed);
        if (keys['KeyA']) camera.translateX(-speed);
        if (keys['KeyD']) camera.translateX(speed);
        camera.position.y = 1.7; // Mantener altura
    }
    renderer.render(scene, camera);
}
animate();
