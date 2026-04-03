import * as THREE from 'three';

let scene, camera, renderer;
const keys = { W: false, A: false, S: false, D: false, E: false, F: false, Shift: false };

init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 2); // Posición inicial del jugador

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // --- 1. HABITACIÓN PRINCIPAL (Arquitectura por paredes) ---
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({color: 0x111111}));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), wallMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4;
    roomGroup.add(ceiling);

    const wallGeo = new THREE.BoxGeometry(10, 4, 0.2);
    // Paredes laterales y frontal
    const wallLeft = new THREE.Mesh(wallGeo, wallMat);
    wallLeft.position.set(-5, 2, 0);
    wallLeft.rotation.y = Math.PI / 2;
    roomGroup.add(wallLeft);

    const wallRight = new THREE.Mesh(wallGeo, wallMat);
    wallRight.position.set(5, 2, 0);
    wallRight.rotation.y = -Math.PI / 2;
    roomGroup.add(wallRight);

    const wallFront = new THREE.Mesh(wallGeo, wallMat);
    wallFront.position.set(0, 2, 5);
    roomGroup.add(wallFront);

    // PARED DEL FONDO (Hueco para pasillo)
    const sideWallGeo = new THREE.BoxGeometry(3.75, 4, 0.2);
    const wallBackL = new THREE.Mesh(sideWallGeo, wallMat);
    wallBackL.position.set(-3.125, 2, -5);
    roomGroup.add(wallBackL);

    const wallBackR = new THREE.Mesh(sideWallGeo, wallMat);
    wallBackR.position.set(3.125, 2, -5);
    roomGroup.add(wallBackR);

    const wallTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 0.2), wallMat);
    wallTop.position.set(0, 3.5, -5);
    roomGroup.add(wallTop);

    // --- 2. EL PASILLO (Conectado al hueco) ---
    const hallwayGroup = new THREE.Group();
    hallwayGroup.position.set(0, 0, -5);
    scene.add(hallwayGroup);

    const hallwayMat = new THREE.MeshStandardMaterial({ color: 0x151515, side: THREE.BackSide });
    const hallway = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4, 20), hallwayMat);
    hallway.position.set(0, 2, -10); 
    hallway.receiveShadow = true;
    hallwayGroup.add(hallway);

    // --- 3. ILUMINACIÓN DEL PASILLO ---
    for (let i = 1; i <= 4; i++) {
        const pLight = new THREE.PointLight(0xfff0dd, 4, 7);
        pLight.position.set(0, 3.5, -i * 4.5);
        pLight.castShadow = true;
        hallwayGroup.add(pLight);
        
        const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.4), new THREE.MeshStandardMaterial({color:0x333}));
        fixture.position.set(0, 3.95, -i * 4.5);
        hallwayGroup.add(fixture);
    }

    // Luces de apoyo en la habitación principal
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemiLight);

    configurarControlesMouse();
    setupKeyboard();
}

// --- FUNCIONES Y LÓGICA (Ensamblado) ---

function configurarControlesMouse() {
    document.addEventListener('mousedown', () => {
        const keypad = document.getElementById('keypad-ui');
        if (keypad && keypad.style.display !== 'block') {
            renderer.domElement.requestPointerLock();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement) {
            const sens = 0.002;
            camera.rotation.y -= e.movementX * sens;
            camera.rotation.x -= e.movementY * sens;
            camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x));
        }
    });
}

function setupKeyboard() {
    window.addEventListener('keydown', (e) => {
        const key = e.code.replace('Key', '');
        if (keys.hasOwnProperty(key)) keys[key] = true;
        if (e.code === 'KeyE') ejecutarInteraccion();
    });
    window.addEventListener('keyup', (e) => {
        const key = e.code.replace('Key', '');
        if (keys.hasOwnProperty(key)) keys[key] = false;
    });
}

function ejecutarInteraccion() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    raycaster.far = 3.5;
    const tocados = raycaster.intersectObjects(scene.children, true);
    if (tocados.length > 0) {
        let obj = tocados[0].object;
        while (obj.parent && !obj.name.includes("int_")) obj = obj.parent;
        console.log("Interactuando con:", obj.name);
        // Aquí puedes añadir los if (obj.name === ...) según necesites
    }
}

function procesarMovimiento() {
    if (!document.pointerLockElement) return;
    const vel = keys.Shift ? 0.12 : 0.06;
    if (keys.W) camera.translateZ(-vel);
    if (keys.S) camera.translateZ(vel);
    if (keys.A) camera.translateX(-vel);
    if (keys.D) camera.translateX(vel);
    camera.position.y = 1.7; // Altura fija del jugador
}

function animate() {
    requestAnimationFrame(animate);
    procesarMovimiento();
    renderer.render(scene, camera);
}
