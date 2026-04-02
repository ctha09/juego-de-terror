import * as THREE from 'three';
// Importamos el cargador de modelos 3D
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505); // Fondo casi negro

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
document.body.appendChild(renderer.domElement);

// --- 1. ILUMINACIÓN AMBIENTAL ---
// Una luz muy tenue para que nada sea 100% negro
const ambientLight = new THREE.AmbientLight(0x404040, 0.5); 
scene.add(ambientLight);

// Luz Naranja del Ventilador (Punto central)
const orangeLight = new THREE.PointLight(0xff6600, 10, 15);
orangeLight.position.set(0, 3.5, 0);
orangeLight.castShadow = true;
scene.add(orangeLight);

// --- 2. PAREDES CON TEXTURA (Moho y Papel Viejo) ---
const loader = new THREE.TextureLoader();
// Nota: Necesitarás imágenes reales en tu repo para que esto cargue
const wallTexture = loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg'); 

const roomGeometry = new THREE.BoxGeometry(10, 8, 10);
const roomMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555544, // Color base "sucio"
    side: THREE.BackSide,
    map: wallTexture // Aquí irá tu textura de papel empapelado
});
const room = new THREE.Mesh(roomGeometry, roomMaterial);
room.receiveShadow = true;
scene.add(room);

// --- 3. CARGA DE OBJETOS (Cama, Ropero, Ventilador) ---
const gltfLoader = new GLTFLoader();

// Función para cargar modelos (Debes subir los archivos .glb a tu carpeta /assets)
function loadModel(path, position, scale) {
    gltfLoader.load(path, (gltf) => {
        const model = gltf.scene;
        model.position.set(position.x, position.y, position.z);
        model.scale.set(scale, scale, scale);
        model.traverse(n => {
            if (n.isMesh) {
                n.castShadow = true;
                n.receiveShadow = true;
            }
        });
        scene.add(model);
    }, undefined, (error) => {
        console.error("Error cargando modelo:", error);
    });
}

// Ejemplo de posición para tus objetos:
// loadModel('./assets/cama.glb', {x: -2, y: 0, z: -2}, 1);
// loadModel('./assets/ropero.glb', {x: 2, y: 0, z: -3}, 1.2);

// --- 4. CONTROLES DE MOVIMIENTO ---
camera.position.set(0, 1.7, 4);

function animate() {
    requestAnimationFrame(animate);
    
    // Efecto de parpadeo realista
    if (Math.random() > 0.95) {
        orangeLight.intensity = 5 + Math.random() * 10;
    }

    renderer.render(scene, camera);
}
animate();
