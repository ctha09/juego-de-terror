import * as THREE from 'three';

// 1. ESCENA Y CÁMARA
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x111111, 0.1); // Niebla para ambiente hostil

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Activar sombras
document.body.appendChild(renderer.domElement);

// 2. ILUMINACIÓN NARANJA (Punto de luz del ventilador)
const roomLight = new THREE.PointLight(0xffaa33, 1, 10);
roomLight.position.set(0, 2.5, 0); // En el techo
roomLight.castShadow = true;
scene.add(roomLight);

// 3. EL VENTILADOR (Simulación básica con aspas)
const fanGroup = new THREE.Group();
const bladeGeometry = new THREE.BoxGeometry(2, 0.05, 0.5);
const bladeMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });

for(let i=0; i<4; i++) {
    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
    blade.rotation.y = (Math.PI / 2) * i;
    blade.position.y = 2.4;
    blade.castShadow = true; 
    fanGroup.add(blade);
}
scene.add(fanGroup);

// 4. HABITACIÓN (Cubo invertido para paredes)
const roomGeo = new THREE.BoxGeometry(10, 5, 10);
const roomMat = new THREE.MeshPhongMaterial({ 
    color: 0x888877, 
    side: THREE.BackSide // Ver desde adentro
});
const room = new THREE.Mesh(roomGeo, roomMat);
room.receiveShadow = true;
scene.add(room);

// 5. LÓGICA DE INTERACCIÓN BÁSICA
camera.position.set(0, 1.6, 3); // Altura de los ojos

function animate() {
    requestAnimationFrame(animate);

    // Hacer girar el ventilador para las sombras
    fanGroup.rotation.y += 0.1;

    // Simular parpadeo de luz
    if (Math.random() > 0.98) {
        roomLight.intensity = Math.random() * 1.5;
    }

    renderer.render(scene, camera);
}

// Ajuste de pantalla
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
