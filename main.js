import * as THREE from 'three';

let scene, camera, renderer;
const keys = { W: false, A: false, S: false, D: false, E: false, F: false, Shift: false };

init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // --- DISEÑO: PASILLO Y AMBIENTE ---
    const hallwayGroup = new THREE.Group();
    hallwayGroup.position.set(0, 0, -5);
    scene.add(hallwayGroup);

    const hallwayMat = new THREE.MeshStandardMaterial({ color: 0x151515, side: THREE.BackSide });
    const hallway = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4, 15), hallwayMat);
    hallway.position.set(0, 2, -7.5);
    hallway.receiveShadow = true;
    hallwayGroup.add(hallway);

    // --- ILUMINACIÓN DEL PASILLO ---
    const lightFixtureGeo = new THREE.BoxGeometry(0.5, 0.1, 0.5);
    const lightFixtureMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0dd, emissiveIntensity: 2 });

    for (let i = 1; i <= 3; i++) {
        const fixture = new THREE.Mesh(lightFixtureGeo, lightFixtureMat);
        fixture.position.set(0, 3.9, -i * 4);
        hallwayGroup.add(fixture);

        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), bulbMat);
        bulb.position.set(0, 3.8, -i * 4);
        hallwayGroup.add(bulb);

        const pLight = new THREE.PointLight(0xfff0dd, 5, 6);
        pLight.position.set(0, 3.5, -i * 4);
        pLight.castShadow = true;
        hallwayGroup.add(pLight);
    }

    // --- DETALLES: TABLONES ---
    const plankGeo = new THREE.BoxGeometry(2.2, 0.05, 0.3);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x0a0500 });
    for (let j = 0; j < 10; j++) {
        const plank = new THREE.Mesh(plankGeo, plankMat);
        plank.position.set(0, 0.02, -j * 1.5);
        hallwayGroup.add(plank);
    }

    // --- OBJETOS INTERACTUABLES (Ejemplo para que el código funcione) ---
    // Mueble/Ropero
    const mueble = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.5), new THREE.MeshStandardMaterial({color: 0x442200}));
    mueble.name = "int_mueble";
    mueble.position.set(-2, 1, -2);
    mueble.userData = { abierto: false };
    scene.add(mueble);

    configurarControlesMouse();
    setupKeyboard();
}

// --- FUNCIONES: INTERACCIÓN Y LÓGICA ---

function ejecutarInteraccion() {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    raycaster.far = 3.5;

    const objetosTocados = raycaster.intersectObjects(scene.children, true);

    if (objetosTocados.length > 0) {
        let obj = objetosTocados[0].object;

        while (obj.parent && !obj.name.includes("int_")) {
            obj = obj.parent;
        }

        console.log("Mirando a:", obj.name);

        if (obj.name === "int_mueble") {
            obj.userData.abierto = !obj.userData.abierto;
            // actualizarInstruccion() debe estar definida en tu UI
        }
        if (obj.name === "int_puerta_pasillo") {
            obj.userData.abierta = !obj.userData.abierta;
        }
        if (obj.name === "int_puerta_blindada") {
            // abrirInterfazCodigo(); 
        }
        if (obj.name === "int_linterna") {
            // recogerObjeto(obj);
        }
    }
}

function actualizarAnimacionesObjetos() {
    scene.traverse((obj) => {
        if (obj.name === "int_mueble") {
            const rotacionObjetivo = obj.userData.abierto ? 1.8 : 0;
            obj.rotation.y += (rotacionObjetivo - obj.rotation.y) * 0.1;
        }
        if (obj.name === "int_puerta_pasillo") {
            const rotacionObjetivo = obj.userData.abierta ? Math.PI / 2 : 0;
            obj.rotation.y += (rotacionObjetivo - obj.rotation.y) * 0.1;
        }
    });
}

function configurarControlesMouse() {
    document.addEventListener('mousedown', () => {
        const keypad = document.getElementById('keypad-ui');
        const keypadVisible = keypad && keypad.style.display === 'block';
        
        if (!keypadVisible) {
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

function procesarMovimientoManual() {
    if (!document.pointerLockElement) return;
    const vel = keys.Shift ? 0.12 : 0.06;
    if (keys.W) camera.translateZ(-vel);
    if (keys.S) camera.translateZ(vel);
    if (keys.A) camera.translateX(-vel);
    if (keys.D) camera.translateX(vel);
    camera.position.y = 1.7;
}

function animate() {
    requestAnimationFrame(animate);
    procesarMovimientoManual();
    actualizarAnimacionesObjetos();
    renderer.render(scene, camera);
}
