import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

camera.position.set(1, 1, 1); // Adjust as needed
camera.lookAt(scene.position);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
//document.body.appendChild(renderer.domElement);

// outputs to an html canvas instead! 
const container = document.getElementById('canvas-container');

//adjust renderer to fit container
const width = container.clientWidth;
const height = container.clientHeight;
renderer.setSize(width, height);
camera.aspect = width / height;
camera.updateProjectionMatrix();

container.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

function loadOBJModel(objPath, mtlPath) {
    console.log("Loading OBJ model with MTL");

    new MTLLoader()
        .load(mtlPath, function (materials) {
            materials.preload();

            var objLoader = new OBJLoader();
            objLoader.setMaterials(materials);

            objLoader.load(
                objPath,
                function (object) {
                    object.position.set(0, 0, 0);
                    scene.add(object);
                    console.log("OBJ loaded successfully!");
                },
                function (xhr) {
                    console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`);
                },
                function (error) {
                    console.error('An error happened during the OBJ loading');
                }
            );
        },
            function (xhr) {
                console.log(`MTL loading progress: ${(xhr.loaded / xhr.total * 100)}% loaded`);
            },
            function (error) {
                console.error('An error happened during the MTL loading');
            }
        );
}

// Event listener for window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    // Update container dimensions
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Update renderer size to fill the container
    renderer.setSize(width, height);

    // Update camera aspect ratio and projection matrix
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Render the scene again with the new sizes
    renderer.render(scene, camera);
}

// Initial call to make sure everything is sized correctly from the start
onWindowResize();


// orbitControls for interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', () => renderer.render(scene, camera)); // Use if there's no animation loop
controls.minDistance = 0.1;
controls.maxDistance = 10;
controls.target.set(0, 0, 0);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

function moveToPosition(targetPosition, targetRotation, duration = 2000) {
    const startPosition = camera.position.clone();
    const startQuaternion = camera.quaternion.clone();
    const endPosition = new THREE.Vector3(...targetPosition);
    const endQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...targetRotation));

    const startTime = performance.now();

    function animate(time) {
        const elapsedTime = time - startTime;
        const fraction = elapsedTime / duration;

        if (fraction < 1) {
            camera.position.lerpVectors(startPosition, endPosition, fraction);
            camera.quaternion.copy(startQuaternion).slerp(endQuaternion, fraction);
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        } else {
            camera.position.copy(endPosition);
            camera.quaternion.copy(endQuaternion);
            controls.update();
            renderer.render(scene, camera);
        }
    }

    requestAnimationFrame(animate);
}

loadOBJModel('textured.obj', 'textured.mtl');

//button to give camera orientation - use in development to choose a highlight position!  
document.getElementById('logCamera').addEventListener('click', () => {
    console.log(`Camera Position: ${camera.position.x}, ${camera.position.y}, ${camera.position.z}`);
    console.log(`Camera Rotation: ${camera.rotation.x}, ${camera.rotation.y}, ${camera.rotation.z}`);
});

document.getElementById('highlightPart1').addEventListener('click', () => {
    // Example target position and rotation for the camera
    const targetPosition = [1.2886779542406064, 1.2886779542406066, 1.2886779542406066];
    const targetRotation = [-0.7853981633974482, 0.6154797086703871, 0.5235987755982987];
    moveToPosition(targetPosition, targetRotation);

    // Retrieve the image source from the button's data attribute
    const imgSrc = document.getElementById('highlightPart1').getAttribute('data-img-src');
    console.log(imgSrc);

    // Get the image element
    const imageElement = document.getElementById('highlightedImage');

    // fade out current image
    imageElement.style.opacity = '0';

    // wait for a brief moment before changing the image and fading it in:
    setTimeout(() => {
        imageElement.src = imgSrc;

        // when the new image has loaded
        imageElement.onload = () => {
            // fade in new image
            imageElement.style.opacity = '1';
        };
    }, 100); // delay of 100ms 
});
