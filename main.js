import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// --- CONFIGURACIÓN ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0a0a, 0.1); // Niebla espesa

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// --- ESTADO Y CARGADORES ---
let hasKey = false;
let drawerOpen = false;
let keys = {};
const textureLoader = new THREE.TextureLoader();

// --- 1. CARGA DE TEXTURAS (LA CLAVE DEL ÉXITO) ---
// NOTA: Asegúrate de que pared.jpg y madera.jpg estén en tu repo.
// He añadido un color de respaldo por si la imagen tarda en cargar.
const wallTexture = textureLoader.load('pared.jpg');
const woodTexture = textureLoader.load('madera.jpg');

// --- 2. MATERIALES DETALLADOS ---
// Paredes con textura de papel mohozo
const wallMat = new THREE.MeshStandardMaterial({ 
    map: wallTexture, 
    color: 0x888877, // Tinte base para que no se vea blanca
    side: THREE.BackSide,
    roughness: 1
});

// Muebles con textura de madera podrida
const woodMat = new THREE.MeshStandardMaterial({ 
    map: woodTexture,
    color: 0x554433, // Tinte oscuro de respaldo
    roughness: 0.9
});

// Suelo con la misma madera, pero más oscuro
const floorMat = new THREE.MeshStandardMaterial({ 
    map: woodTexture,
    color: 0x221105,
    roughness: 1
});

// --- 3. LUCES ---
const ambient = new THREE.AmbientLight(0xffffff, 0.02); // Luz mínima para siluetas
scene.add(ambient);

// Luz del Ventilador (Bajada de intensidad para no 'quemar' las texturas)
const orangeLight = new THREE.PointLight(0xff6600, 20, 15);
orangeLight.position.set(0, 3.5, 0);
orangeLight.castShadow = true;
scene.add(orangeLight);

// Luz de Relámpago (Blanca)
const lightningLight = new THREE.DirectionalLight(0xffffff, 0);
lightningLight.position.set(5, 3, -5);
scene.add(lightningLight);

// --- 4. CONSTRUCCIÓN DETALLADA ---
// Habitación
const roomGeo = new THREE.BoxGeometry(10, 8, 10);
const room = new THREE.Mesh(roomGeo, wallMat);
room.position.y = 4; // Subimos el cuarto para que el suelo esté en y=0
room.receiveShadow = true;
scene.add(room);

// Suelo (Plano separado para mejor textura)
const floorGeo = new THREE.PlaneGeometry(10, 10);
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0.01; // Justo encima del fondo de la caja
floor.receiveShadow = true;
scene.add(floor);

// Ventilador
const fan = new THREE.Group();
fan.position.set(0, 7.8, 0); // En el techo
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.05, 0.5), woodMat);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.castShadow = true;
    fan.add(blade);
}
scene.add(fan);

// Cama (Ahora tiene patas para separarla del suelo negro)
const bedGroup = new THREE.Group();
const mattress = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 5), new THREE.MeshStandardMaterial({color: 0xaaaa99}));
mattress.position.set(-3, 0.6, -2);
mattress.castShadow = true;
bedGroup.add(mattress);
const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.2, 5.1), woodMat);
bedFrame.position.set(-3, 0.3, -2);
bedGroup.add(bedFrame);
scene.add(bedGroup);

// Ropero
const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 1.5), woodMat);
wardrobe.position.set(3, 3, -3);
wardrobe.castShadow = true;
scene.add(wardrobe);

// Mesita de noche interactiva
const standGroup = new THREE.Group();
standGroup.position.set(-1.2, 0.6, -2.5);
scene.add(standGroup);
const standBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.8), woodMat);
standBody.castShadow = true;
standGroup.add(standBody);

const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), new THREE.MeshStandardMaterial({color: 0x332211, roughness: 1}));
drawer.position.set(0, 0.3, 0.05); 
drawer.name = "cajon"; 
standGroup.add(drawer);

const key = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.2), new THREE.MeshStandardMaterial({color: 0xffd700}));
key.position.set(0, 0.15, 0);
key.name = "llave";
drawer.add(key);

// --- 5. RAYCASTER E INTERACCIÓN ---
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
            document.getElementById('instruction').innerText = "Cajón abierto. Mira adentro.";
        } 
        else if (obj.name === "llave" && drawerOpen && !hasKey) {
            hasKey = true;
            obj.visible = false;
            document.getElementById('instruction').innerText = "¡Tienes la llave! Busca la puerta.";
        }
    }
}

// --- 6. CONTROLES ---
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);
document.addEventListener('mousedown', () => {
    if (document.pointerLockElement === document.body) { interact(); } 
    else { document.body.requestPointerLock(); }
});
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
    }
});

// --- 7. BUCLE DE JUEGO ---
camera.position.set(0, 1.7, 4);

function animate() {
    requestAnimationFrame(animate);
    if (document.pointerLockElement === document.body) {
        const speed = 0.08;
        if (keys['KeyW']) camera.translateZ(-speed);
        if (keys['KeyS']) camera.translateZ(speed);
        if (keys['KeyA']) camera.translateX(-speed);
        if (keys['KeyD']) camera.translateX(speed);
        camera.position.y = 1.7; // Altura fija
    }
    if (drawerOpen && drawer.position.z < 0.5) { drawer.position.z += 0.02; }
    fan.rotation.y += 0.15;
    if (Math.random() > 0.985) {
        lightningLight.intensity = 4;
        setTimeout(() => lightningLight.intensity = 0, 100);
    }
    orangeLight.intensity = 18 + Math.random() * 8; // Menor parpadeo para no marear
    renderer.render(scene, camera);
}
animate();

window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
