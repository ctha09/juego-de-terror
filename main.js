import * as THREE from 'three';

// --- VARIABLES GLOBALES ---
let scene, camera, renderer;
let ui_estado = 'NORMAL'; // Estado inicial

const keys = {
    W: false, A: false, S: false, D: false, 
    E: false, F: false, Shift: false
};

// --- INICIALIZACIÓN ---
init();
animate();

function init() {
    // Escena y Cámara
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // --- SECCION GRAFICOS (Iluminación y Ayudas) ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    scene.fog = null;

    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
    scene.add(gridHelper);

    // --- SECCION DISEÑO (Arquitectura y Objetos) ---
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        roughness: 0.9, 
        side: THREE.BackSide 
    });

    const room = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 10), wallMat);
    room.position.y = 2.5;
    room.receiveShadow = true;
    scene.add(room);

    // Mesa
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-3.5, 0, -3.5);
    scene.add(tableGroup);

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 1.5), new THREE.MeshStandardMaterial({color: 0x111111, metalness: 0.8}));
    tableTop.position.y = 1;
    tableTop.castShadow = true;
    tableGroup.add(tableTop);

    const legGeo = new THREE.BoxGeometry(0.1, 1, 0.1);
    const legMat = new THREE.MeshStandardMaterial({color: 0x050505});
    [[0.9, -0.6], [0.9, 0.6], [-0.9, -0.6], [-0.9, 0.6]].forEach(pos => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(pos[0], 0.5, pos[1]);
        tableGroup.add(leg);
    });

    // Ropero y Linterna
    const closetGroup = new THREE.Group();
    closetGroup.position.set(4, 0, -4);
    closetGroup.rotation.y = -Math.PI / 4;
    scene.add(closetGroup);

    const closetBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.8, 0.8), new THREE.MeshStandardMaterial({color: 0x1a0f00}));
    closetBody.position.y = 1.9;
    closetBody.castShadow = true;
    closetGroup.add(closetBody);

    const doorL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 3.7, 0.05), new THREE.MeshStandardMaterial({color: 0x2a1a0a}));
    doorL.position.set(-0.55, 1.9, 0.41);
    doorL.name = "interactable_closet";
    closetGroup.add(doorL);

    const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.25), new THREE.MeshStandardMaterial({color: 0x111, emissive: 0x111}));
    fl.rotation.x = Math.PI / 2;
    fl.position.set(0, 2, 0);
    fl.name = "interactable_fl";
    closetGroup.add(fl);

    configurarMouse();
    window.addEventListener('resize', onWindowResize, false);
}

// --- SECCION FUNCIONES (Lógica) ---
window.addEventListener('keydown', (e) => {
    const key = e.code.replace('Key', '');
    if (keys.hasOwnProperty(key)) keys[key] = true;
    if (e.code === 'ShiftLeft') keys.Shift = true;
    
    if (e.code === 'KeyE') console.log("Interacción ejecutada"); 
    if (e.code === 'KeyF') console.log("Linterna toggled");
});

window.addEventListener('keyup', (e) => {
    const key = e.code.replace('Key', '');
    if (keys.hasOwnProperty(key)) keys[key] = false;
    if (e.code === 'ShiftLeft') keys.Shift = false;
});

function procesarMovimiento() {
    if (!document.pointerLockElement) return;
    const basuraVel = keys.Shift ? 0.12 : 0.06;
    
    if (keys.W) camera.translateZ(-basuraVel);
    if (keys.S) camera.translateZ(basuraVel);
    if (keys.A) camera.translateX(-basuraVel);
    if (keys.D) camera.translateX(basuraVel);
    camera.position.y = 1.7; 
}

function configurarMouse() {
    renderer.domElement.addEventListener('mousedown', () => {
        if (ui_estado !== 'KEYPAD_VISIBLE') {
            renderer.domElement.requestPointerLock();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement) {
            const sensibilidad = 0.002;
            camera.rotation.y -= e.movementX * sensibilidad;
            camera.rotation.x -= e.movementY * sensibilidad;
            camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    procesarMovimiento();
    renderer.render(scene, camera);
}
