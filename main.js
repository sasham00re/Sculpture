import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
// want issues to commit
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

function onWindowResize() {
    // Identify both containers
    const canvasContainer = document.getElementById('canvas-container');
    const imageContainer = document.getElementById('highlightedImage'); // Assuming this is the img inside .image-container

    // Define maximum dimensions based on window size
    const maxDimension = Math.min(window.innerWidth, window.innerHeight, 600); // Adjust max size as needed

    // Compute size to maintain aspect ratio and not exceed max dimensions
    const size = Math.min(window.innerWidth, window.innerHeight, maxDimension);

    // Set dimensions for both the canvas and image containers
    canvasContainer.style.width = `${size}px`;
    canvasContainer.style.height = `${size}px`;
    imageContainer.style.width = `${size}px`;
    imageContainer.style.height = `${size}px`;

    // Adjust renderer for the canvas container
    if (renderer) {
        renderer.setSize(size, size);
        camera.aspect = 1; // Since it's square
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
    }
}

// Listen for window resize events
window.addEventListener('resize', onWindowResize, false);

// Call initially to set sizes correctly from the start
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

function setupButton(buttonId, targetPosition, targetRotation, imgSrc, annotations) {
    document.getElementById(buttonId).addEventListener('click', () => {
        moveToPosition(targetPosition, targetRotation);

        const imageElement = document.getElementById('highlightedImage');
        const annotationContainer = document.getElementById('imageAnnotationContainer');
        clearAnnotations(annotationContainer); // Clear existing annotations

        // Fade out image
        imageElement.style.opacity = '0';

        // Delay changing the image source until after the fade-out transition has played
        setTimeout(() => {
            imageElement.src = imgSrc;
            requestAnimationFrame(() => {
                setTimeout(() => {
                    // Check if the image is already loaded or wait for the load event
                    if (imageElement.complete) {
                        addAnnotations(annotationContainer, annotations);
                        imageElement.style.opacity = '1';
                    } else {
                        imageElement.onload = () => {
                            addAnnotations(annotationContainer, annotations);
                            imageElement.style.opacity = '1';
                        };
                    }
                }, 20);
            });
        }, 1000);

    });
}

function clearAnnotations(container) {
    container.querySelectorAll('.annotation').forEach(annotation => annotation.remove());
}

function addAnnotations(container, annotations) {
    annotations.forEach((annotation, index) => {
        console.log("getting here");
        const elem = document.createElement('div');
        elem.classList.add('annotation');
        elem.textContent = annotation.text;
        elem.style.top = `${annotation.top}%`;
        elem.style.left = `${annotation.left}%`;

        // Append and fade in with delay
        container.appendChild(elem);
        setTimeout(() => {
            elem.style.opacity = '1';
        }, 1000 * (index + 1)); // Delay subsequent annotations
    });
    console.log("annotations added");
}

document.addEventListener('DOMContentLoaded', (event) => {
    setupButton('highlightHands',
        [-0.0660334144529682, 0.6502196321957312, 0.32696100830758873],
        [-1.1024588704293636, -0.0308862259681673, -0.06096955204728574],
        'hands.jpg',
        [
            {
                text: "With sculpture, you have to be pretty cognizant of your scale. It's a small child of roughly correct dimension with man-sized hands. Many people are inprison for actions they took when they were young sometimes the deeds of a child can have adult.sized consequences.", top: 10, left: 0
            },
            {
                text: "Inscription: A way to give voice to the voiceless", top: 43
                , left: 60
            }
        ]
    );
});

// Setup event listeners for each button
//setupButton('highlightHands', [-0.0660334144529682, 0.6502196321957312, 0.32696100830758873], [-1.1024588704293636, -0.0308862259681673, -0.06096955204728574], 'hands.jpg');
//setupButton('highlightSplash', [0.09135275057812703, 0.42109411760641313, 0.40722327997076607], [-0.691460007477806, 0.4341025015581536, 0.3350408722453509], 'fillourselves.jpg');
// Repeat for other buttons as necessary


document.getElementById('menuIcon').addEventListener('click', function () {
    const menuIcon = this;
    const dynamicMenu = document.getElementById('dynamicMenu');
    // Toggle the display of the dynamic menu
    if (dynamicMenu.style.display === 'none') {
        dynamicMenu.style.display = 'block';
        menuIcon.classList.add('active'); // Indicate the menu is open
    } else {
        dynamicMenu.style.display = 'none';
        menuIcon.classList.remove('active'); // Remove indication when menu is closed
    }
});

// Optional: Close menu when a link is clicked
document.querySelectorAll('#dynamicMenu ul li a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('dynamicMenu').style.display = 'none';
        document.getElementById('menuIcon').classList.remove('active');
    });
});



