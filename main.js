import * as THREE from 'three';

// 1. CONFIGURACIÓN BÁSICA DE LA ESCENA
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x111111, 0.1); // Niebla hostil

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // ACTIVAR SOMBRAS
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
document.body.appendChild(renderer.domElement);

// --- 2. ILUMINACIÓN ---
// Luz ambiental muy tenue (para que no sea 100% negro)
const ambientLight = new THREE.AmbientLight(0x404040, 0.4); 
scene.add(ambientLight);

// Luz Naranja del Ventilador (fuerte, central y proyecta sombras)
const orangeLight = new THREE.PointLight(0xff6600, 25, 12);
orangeLight.position.set(0, 3.8, 0); // En el techo
orangeLight.castShadow = true;
// Configuración fina de sombras para que se vean las paletas
orangeLight.shadow.mapSize.width = 1024; 
orangeLight.shadow.mapSize.height = 1024;
orangeLight.shadow.camera.near = 0.5;
orangeLight.shadow.camera.far = 15;
scene.add(orangeLight);

// --- 3. MATERIALES BÁSICOS ---
// Material para muebles de madera vieja
const woodMaterial = new THREE.MeshPhongMaterial({ color: 0x3d2817, shininess: 10 });
// Material para el colchón
const bedMaterial = new THREE.MeshPhongMaterial({ color: 0xd9d0c7, shininess: 5 });
// Material para las paletas del ventilador
const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });

// --- 4. CONSTRUCCIÓN DE OBJETOS PROCEDURALES ---

// A. LA HABITACIÓN (Paredes)
const roomGeometry = new THREE.BoxGeometry(10, 8, 10);
const roomMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555544, // Color claro pero sucio
    side: THREE.BackSide 
});
const room = new THREE.Mesh(roomGeometry, roomMaterial);
room.receiveShadow = true;
scene.add(room);

// B. EL VENTILADOR DE TECHO
const fanGroup = new THREE.Group();
fanGroup.position.set(0, 3.9, 0);

// Eje central
const shaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
const shaft = new THREE.Mesh(shaftGeo, metalMaterial);
fanGroup.add(shaft);

// Paletas (4 cubos aplastados y alargados)
const bladeGeo = new THREE.BoxGeometry(2.5, 0.02, 0.4);
for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(bladeGeo, metalMaterial);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.position.y = -0.15;
    blade.castShadow = true; // IMPORTANTE: Las paletas proyectan sombras
    fanGroup.add(blade);
}
scene.add(fanGroup);

// C. LA CAMA (Cubo aplastado sobre patas)
const bedGroup = new THREE.Group();
bedGroup.position.set(-2.5, 0, -2); // Esquina izquierda al fondo

// Colchón
const mattressGeo = new THREE.BoxGeometry(4, 0.5, 2.5);
const mattress = new THREE.Mesh(mattressGeo, bedMaterial);
mattress.position.y = 0.5;
mattress.receiveShadow = true;
mattress.castShadow = true;
bedGroup.add(mattress);

// Estructura y patas de madera
const frameGeo = new THREE.BoxGeometry(4.1, 0.2, 2.6);
const frame = new THREE.Mesh(frameGeo, woodMaterial);
frame.position.y = 0.3;
bedGroup.add(frame);

for(let i=0; i<4; i++) {
    const legGeo = new THREE.BoxGeometry(0.15, 0.3, 0.15);
    const leg = new THREE.Mesh(legGeo, woodMaterial);
    leg.position.set( (i<2 ? 1.8 : -1.8), 0.15, (i%2==0 ? 1.1 : -1.1) );
    bedGroup.add(leg);
}
scene.add(bedGroup);

// D. MESITAS DE NOCHE (Cubos con patas)
function createNightstand(x, z) {
    const standGroup = new THREE.Group();
    standGroup.position.set(x, 0, z);

    // Cuerpo principal
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 0.8);
    const body = new THREE.Mesh(bodyGeo, woodMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    standGroup.add(body);

    // Patas
    for(let i=0; i<4; i++) {
        const legGeo = new THREE.BoxGeometry(0.1, 0.2, 0.1);
        const leg = new THREE.Mesh(legGeo, woodMaterial);
        leg.position.set( (i<2 ? 0.3 : -0.3), 0.1, (i%2==0 ? 0.3 : -0.3) );
        standGroup.add(leg);
    }
    return standGroup;
}
scene.add(createNightstand(-0.8, -2)); // Mesita Izquierda
scene.add(createNightstand(-4.2, -2)); // Mesita Derecha

// E. EL ROPERO (Un cubo alto y estrecho)
const wardrobeGeo = new THREE.BoxGeometry(2, 4.5, 1.2);
const wardrobe = new THREE.Mesh(wardrobeGeo, woodMaterial);
wardrobe.position.set(2, 2.25, -3); // Fondo a la derecha
wardrobe.castShadow = true;
wardrobe.receiveShadow = true;
scene.add(wardrobe);

// --- 5. LÓGICA DE ANIMACIÓN ---
camera.position.set(0, 1.7, 5); // Altura de los ojos

function animate() {
    requestAnimationFrame(animate);

    // Giro del ventilador para las sombras dinámicas
    fanGroup.rotation.y += 0.08;

    // Efecto de parpadeo realista
    if (Math.random() > 0.96) {
        orangeLight.intensity = 15 + Math.random() * 20;
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
