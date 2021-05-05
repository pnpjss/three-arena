import './style.css';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Capsule } from 'three/examples/jsm/math/Capsule';
import { Octree } from 'three/examples/jsm/math/Octree';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const body = document.querySelector('body');
const canvas = document.querySelector('canvas.webgl');
const gui = new dat.GUI();
const clock = new THREE.Clock();

// FPS, render time, drawcalls
const stats = new Stats();
let drawCallPanel = stats.addPanel(
    new Stats.Panel('drawcalls', '#ff8', '#221')
);
stats.showPanel(0, 1, 3);
document.body.appendChild(stats.domElement);
body.appendChild(stats.domElement);

const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 2);
// scene.add(camera);

const Key = {};

// Movement Control
document.addEventListener('keydown', (event) => {
    Key[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    Key[event.key] = false;
});

// Vectors
const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);

// https://wickedengine.net/2020/04/26/capsule-collision-detection/
const playerCapsule = new Capsule(
    new THREE.Vector3(),
    new THREE.Vector3(),
    0.5
);

// Inputs
let playerSpeed = 0.05;
function playerControl() {
    if (Key['w']) {
        // console.log(lookVector());
        playerVelocity.add(lookVector().multiplyScalar(playerSpeed));
    }
    if (Key['a']) {
        // console.log('A');
        playerVelocity.add(
            playerDirection.crossVectors(
                upVector,
                lookVector().multiplyScalar(playerSpeed)
            )
        );
    }
    if (Key['s']) {
        // console.log('S');
        playerVelocity.add(lookVector().negate().multiplyScalar(playerSpeed));
    }
    if (Key['d']) {
        // console.log('D');
        playerVelocity.add(
            playerDirection.crossVectors(
                upVector,
                lookVector().negate().multiplyScalar(playerSpeed)
            )
        );
    }
    if (Key[' ']) {
        // console.log('Spacebar');
        playerVelocity.y += playerSpeed;
    }
    if (Key['Control']) {
        // console.log('CTRL');
        playerVelocity.y -= playerSpeed;
    }
    if (Key['e']) {
        playerVelocity.set(0, 0, 0);
    }
}

// Input functions
function lookVector() {
    return camera.getWorldDirection(playerDirection);
}

function updateMovement() {
    const deltaPosition = playerVelocity.clone().multiplyScalar(0.01);

    // This can be used for movement without momentum
    // camera.position.copy(deltaPosition);

    // This is movement with momentum.
    playerCapsule.translate(deltaPosition);
    camera.position.copy(playerCapsule.end);
}

// First person camera
document.addEventListener('mousedown', () => {
    document.body.requestPointerLock();
});

camera.rotation.order = 'YXZ';
document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === document.body) {
        // if (camera.rotation.x > 1.55) {
        //     camera.rotation.x = 1.55;
        // }
        // if (camera.rotation.x < -1.55) {
        //     camera.rotation.x = -1.55;
        // }
        camera.rotation.x -= event.movementY / 700;
        camera.rotation.y -= event.movementX / 700;
    }
});

// Skybox
scene.background = new THREE.CubeTextureLoader().load([
    'skybox/bluecloud_rt.jpg',
    'skybox/bluecloud_lf.jpg',
    'skybox/bluecloud_up.jpg',
    'skybox/bluecloud_dn.jpg',
    'skybox/bluecloud_ft.jpg',
    'skybox/bluecloud_bk.jpg',
]);

// Model
const gltfLoader = new GLTFLoader().setPath('models/');
gltfLoader.load('smile.glb', (gltf) => {
    gltf.scene.traverse((model) => {
        model.castShadow = true;
    });
    gltf.scene.position.z = 1;

    // gltf.scene.scale = 10;
    scene.add(gltf.scene);
});

// Objects
const geometry = new THREE.IcosahedronGeometry(1);
const floorGeometry = new THREE.BoxGeometry(10, 0.5, 10);
const wallGeometry = new THREE.BoxGeometry(10, 5, 0.5);

// Materials
const floorMaterial = new THREE.MeshPhongMaterial();
floorMaterial.color = new THREE.Color(0xff111111);
const material = new THREE.MeshPhongMaterial();
material.color = new THREE.Color(0xff109000);

// Mesh
const sphere = new THREE.Mesh(geometry, material);
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
const wall = new THREE.Mesh(wallGeometry, floorMaterial);

floor.position.set(0, -3, 0);
wall.position.set(0, -0.5, -5);

sphere.castShadow = true; //default
floor.receiveShadow = true; //default
scene.add(wall);
scene.add(floor);
scene.add(sphere);

// Lights
const pointLight = new THREE.PointLight(0xffffff, 0.1);
const pointLight2 = new THREE.PointLight(0xffffff, 0.1);
pointLight.castShadow = true;

pointLight.position.set(3, 5, -1);
pointLight2.position.set(-3, 2, 1);
pointLight.power = 20;
pointLight2.power = 0;
scene.add(pointLight, pointLight2);

const pointLightHelper = new THREE.PointLightHelper(pointLight);
const pointLightHelper2 = new THREE.PointLightHelper(pointLight2);
scene.add(pointLightHelper);
scene.add(pointLightHelper2);

const helper = new THREE.CameraHelper(pointLight.shadow.camera);
scene.add(helper);

// Resize
window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Shadow renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// time init
let lastTime = performance.now();

let velocityStats = document.querySelector('.velocity-stats');
let positionStats = document.querySelector('.position-stats');

function roundStat(data) {
    return Math.round(data * 100) / 100;
}

// Animate
const tick = () => {
    const delta = clock.getDelta();

    // Call tick again on the next frame
    requestAnimationFrame(tick);

    playerControl();

    // Update objects
    sphere.rotation.y += 0.5 * delta;

    updateMovement();

    stats.update();

    // Render
    renderer.render(scene, camera);

    // Stats
    velocityStats.innerHTML = `
    X: ${roundStat(playerVelocity.x)} <br> 
    Y: ${roundStat(playerVelocity.y)} <br> 
    Z: ${roundStat(playerVelocity.z)}`;

    positionStats.innerHTML = `
    X: ${roundStat(camera.position.x)} <br> 
    Y: ${roundStat(camera.position.y)} <br> 
    Z: ${roundStat(camera.position.z)}`;

    if (performance.now() - lastTime < 1000 / 1) return;
    lastTime = performance.now();
    drawCallPanel.update(renderer.info.render.calls);
};

tick();
