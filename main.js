import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.08);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
let keys = {}, doorMoving = false, hasFlashlight = false, flashlightOn = false;
const interactables = [];

// Materiales
const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
const roomMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f });

// --- HABITACIÓN INICIAL (Igual que antes) ---
const room = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), wallMat);
room.position.y = 2;
scene.add(room);
const light = new THREE.PointLight(0xff5500, 15, 10);
light.position.set(0, 3.8, 0);
scene.add(light);

// --- PASILLO EXTENDIDO ---
const corridorGroup = new THREE.Group();
corridorGroup.position.set(16, 2, 1.5);
scene.add(corridorGroup);

const corridorGeo = new THREE.BoxGeometry(30, 4, 4);
const corridor = new THREE.Mesh(corridorGeo, new THREE.MeshStandardMaterial({color: 0x111, side: THREE.BackSide}));
corridorGroup.add(corridor);

// Luces LED Blancas Centrales
for(let i = -14; i <= 14; i += 4) {
    const pLight = new THREE.PointLight(0xffffff, 5, 6);
    pLight.position.set(i, 1.8, 0);
    corridorGroup.add(pLight);
}

// --- GENERACIÓN DE PUERTAS Y HABITACIONES ---
function createRoom(x, side, isControlCenter = false) {
    const zPos = side === "left" ? -2 : 2;
    const yRot = side === "left" ? 0 : Math.PI;

    // Puerta
    const doorGroup = new THREE.Group();
    doorGroup.position.set(x, -0.4, zPos);
    doorGroup.userData = { open: false, type: "door" };
    corridorGroup.add(doorGroup);

    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.2, 1.8), woodMat);
    doorMesh.position.z = 0.9 * (side === "left" ? 1 : -1);
    doorMesh.name = "interactable_door";
    doorGroup.add(doorMesh);
    interactables.push(doorMesh);

    // Habitación detrás de la puerta
    const rGeo = new THREE.BoxGeometry(4, 4, 4);
    const rMesh = new THREE.Mesh(rGeo, isControlCenter ? new THREE.MeshStandardMaterial({color:0x051111, side:THREE.BackSide}) : roomMat);
    rMesh.position.set(x, 0, zPos * 2.5);
    corridorGroup.add(rMesh);

    // Luz de la habitación
    const rLight = new THREE.PointLight(isControlCenter ? 0x00ffff : 0xffffff, 10, 5);
    rLight.position.set(x, 1, zPos * 2.5);
    corridorGroup.add(rLight);

    if(isControlCenter) {
        // Simular Televisores (Centro de Control)
        const tv = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 1.2), new THREE.MeshBasicMaterial({color: 0x22ffaa}));
        tv.position.set(x + 1, 0.5, zPos * 3);
        corridorGroup.add(tv);
    }
}

// Lado Izquierdo (4 puertas)
for(let i=0; i<4; i++) createRoom(-10 + (i*4), "left");

// Lado Derecho (3 puertas, la primera es Centro de Control)
createRoom(-10, "right", true);
createRoom(-6, "right");
createRoom(-2, "right");

// --- PUERTA BLINDADA INICIAL ---
const armorDoorGroup = new THREE.Group();
armorDoorGroup.position.set(3.9, 1.6, 1.5);
scene.add(armorDoorGroup);
const armorDoor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 2.5), new THREE.MeshStandardMaterial({color: 0x111, metalness: 0.9}));
armorDoor.name = "armor_door";
scene.add(armorDoorGroup); 
interactables.push(armorDoor);

// Linterna Jugador
const spot = new THREE.SpotLight(0xffffff, 0, 25, Math.PI/6, 0.5);
scene.add(spot); scene.add(spot.target);

// --- SISTEMA DE INTERACCIÓN ---
function interact() {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0,0), camera);
    const hits = ray.intersectObjects(scene.children, true);
    
    if(hits.length > 0) {
        const obj = hits[0].object;
        if(obj.name === "interactable_door") {
            const group = obj.parent;
            group.userData.open = !group.userData.open;
        }
        if(obj.name === "armor_door") {
            document.exitPointerLock();
            document.getElementById('keypad-ui').style.display='block';
        }
        // Lógica de linterna (simplificada)
        if(obj.name === "fl") { hasFlashlight = true; obj.visible = false; }
    }
}

window.addEventListener('openBlindDoor', () => { doorMoving = true; });
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if(e.code === 'KeyE') interact();
    if(e.code === 'KeyF' && hasFlashlight) { flashlightOn = !flashlightOn; spot.intensity = flashlightOn ? 100 : 0; }
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Render loop
camera.position.set(0, 1.7, 4);
function animate() {
    requestAnimationFrame(animate);
    if(document.pointerLockElement) {
        const speed = 0.08;
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

    // Animación de puertas del pasillo
    scene.traverse((obj) => {
        if(obj.userData && obj.userData.type === "door") {
            const targetRot = obj.userData.open ? Math.PI/2 : 0;
            obj.rotation.y += (targetRot - obj.rotation.y) * 0.1;
        }
    });

    if(doorMoving && armorDoorGroup.position.x < 8) armorDoorGroup.position.x += 0.05;
    
    renderer.render(scene, camera);
}
animate();
