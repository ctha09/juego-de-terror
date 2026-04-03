import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- 1. CONFIGURACIÓN DE ESCENA ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.15);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- 2. ESTADO DEL JUEGO ---
let hasKey = false;
let drawerOpen = false;
let keys = {};

// --- 3. LUCES ---
const ambient = new THREE.AmbientLight(0x404040, 0.1); 
scene.add(ambient);

const orangeLight = new THREE.PointLight(0xff4400, 35, 15);
orangeLight.position.set(0, 3.5, 0);
orangeLight.castShadow = true;
scene.add(orangeLight);

const lightningLight = new THREE.DirectionalLight(0xffffff, 0);
lightningLight.position.set(5, 3, -5);
scene.add(lightningLight);

// --- 4. MATERIALES ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x444433, side: THREE.BackSide });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x221105 });
const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });

// --- 5. OBJETOS ---
// Habitación
const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 10), wallMat);
walls.receiveShadow = true;
scene.add(walls);

// Ventilador
const fan = new THREE.Group();
fan.position.set(0, 3.8, 0);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.05, 0.5), metalMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fan.add(blade);
}
scene.add(fan);

// Cama
const bed = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 5), new THREE.MeshStandardMaterial({color: 0x777766}));
bed.position.set(-3, 0.4, -2);
bed.castShadow = true;
scene.add(bed);

// Ropero
const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 1.5), woodMat);
wardrobe.position.set(3, 2.5, -3);
wardrobe.castShadow = true;
scene.add(wardrobe);

// Mesita de noche interactiva
const standGroup = new THREE.Group();
standGroup.position.set(-1.2, 0.5, -2.5);
scene.add(standGroup);

const standBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.8), woodMat);
standBody.castShadow = true;
standGroup.add(standBody);

// EL CAJÓN (Importante: nombre "cajon")
const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), new THREE.MeshStandardMaterial({color: 0x332211}));
drawer.position.set(0, 0.2, 0.05); 
drawer.name = "cajon"; 
standGroup.add(drawer);

// LA LLAVE (Importante: nombre "llave")
const key = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.2), new THREE.MeshStandardMaterial({color: 0xffd700}));
key.position.set(0, 0.15, 0);
key.name = "llave";
drawer.add(key);

// --- 6. RAYCASTER E INTERACCIÓN ---
const raycaster = new THREE.Raycaster();
const centerMouse = new THREE.Vector2(0, 0); 

function interact() {
    raycaster.setFromCamera(centerMouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        let obj = intersects[0].object;
        console.log("Mirando a:", obj.name);

        if (obj.name === "cajon" && !drawerOpen) {
            drawerOpen = true;
            document.getElementById('instruction').innerText = "Abriste el cajón. Mira adentro.";
        } 
        else if (obj.name === "llave" && drawerOpen && !hasKey) {
            hasKey = true;
            obj.visible = false;
            document.getElementById('instruction').innerText = "¡Tienes la llave! Ahora busca la puerta.";
        }
    }
}

// --- 7. CONTROLES DE USUARIO ---
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

document.addEventListener('mousedown', () => {
    if (document.pointerLockElement === document.body) {
        interact();
    } else {
        document.body.requestPointerLock();
    }
});

document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

// --- 8. BUCLE DE JUEGO ---
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

    // Animación del cajón
    if (drawerOpen && drawer.position.z < 0.5) {
        drawer.position.z += 0.02;
    }

    // Ambiente
    fan.rotation.y += 0.15;
    if (Math.random() > 0.985) {
        lightningLight.intensity = 4;
        setTimeout(() => lightningLight.intensity = 0, 100);
    }
    orangeLight.intensity = 30 + Math.random() * 15;

    renderer.render(scene, camera);
}
animate();

window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
