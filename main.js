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
                    // Example values from your logs
                    camera.position.set(-0.8586429836901076, 2.1050869546067896, -2.540819389359814);
                    camera.rotation.set(-2.857360838307505, -0.3473951555829288, -3.0424591272689696);
                    controls.target.set(0.20397166403308944, 1.2821221258870192, 0.2761865928121297);
                    controls.update(); // To ensure the controls' internal state matches the camera and target

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
controls.addEventListener('change', () => renderer.render(scene, camera));
controls.minDistance = 0.05;
controls.maxDistance = 10;
controls.target.set(0, 0, 0);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

function moveToPosition(targetPosition, targetRotation, newControlTarget, duration = 2000) {
    const startPosition = camera.position.clone();
    const startQuaternion = camera.quaternion.clone();
    const startControlTarget = controls.target.clone();

    const endPosition = new THREE.Vector3(...targetPosition);
    const endQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...targetRotation));
    const endControlTarget = new THREE.Vector3(...newControlTarget);

    const startTime = performance.now();

    function animate(time) {
        const elapsedTime = time - startTime;
        const fraction = elapsedTime / duration;

        if (fraction < 1) {
            camera.position.lerpVectors(startPosition, endPosition, fraction);
            camera.quaternion.copy(startQuaternion).slerp(endQuaternion, fraction);
            controls.target.lerpVectors(startControlTarget, endControlTarget, fraction);

            requestAnimationFrame(animate);
        } else {
            // Ensure the final positions are exactly as specified once the animation completes
            camera.position.copy(endPosition);
            camera.quaternion.copy(endQuaternion);
            controls.target.copy(endControlTarget);
        }

        controls.update(); // This is necessary to make the controls aware of the new camera and target positions
        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
}


loadOBJModel('textured.obj', 'textured.mtl');

//button to give camera orientation - use in development to choose a highlight position!  
document.getElementById('logCamera').addEventListener('click', () => {
    console.log(`Camera Position: ${camera.position.x}, ${camera.position.y}, ${camera.position.z}`);
    console.log(`Camera Rotation: ${camera.rotation.x}, ${camera.rotation.y}, ${camera.rotation.z}`);
    console.log(`OrbitControls Target: ${controls.target.x}, ${controls.target.y}, ${controls.target.z}`);
});

function setupButton(buttonId, targetPosition, targetRotation, controlTarget, imgSrc, annotations) {
    document.getElementById(buttonId).addEventListener('click', () => {
        moveToPosition(targetPosition, targetRotation, controlTarget);

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
    setupButton('highlightIntro',
        [-0.8586429836901076, 2.1050869546067896, -2.540819389359814],
        [-2.857360838307505, -0.3473951555829288, -3.0424591272689696],
        [0.20397166403308944, 1.2821221258870192, 0.2761865928121297],
        'introduction.png',
        [
            {
                text: "Pabulum, meaning intellectual substance, serves as the keystone piece in a larger collaborative art project between incarcerated individuals and Stanford students, Prison Renaissance.", top: 10, left: 0
            },
            {
                text: "The sculpture depicts a child knelt in a river, enriching itself with the words exchanged as seemingly disparate groups explored their shared humanity through art.", top: 65
                , left: 0
            }
        ]
    );
});

document.addEventListener('DOMContentLoaded', (event) => {
    setupButton('highlightHands',
        [-0.3241209098036478, 2.2763584817843983, -0.2867519966435057],
        [-2.227809023812474, -0.04558634375904463, -3.08258070400209],
        [-0.26989449162194695, 1.3351154178310811, 0.4392563561836019],
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

document.addEventListener('DOMContentLoaded', (event) => {
    setupButton('highlightRiver',
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

document.addEventListener('DOMContentLoaded', (event) => {
    setupButton('highlightSplash',
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

document.addEventListener('DOMContentLoaded', (event) => {
    setupButton('highlightSplash',
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
            },
            {
                text: "It's also a symbol of our shared humanity- we are all flawed. - Steve Hann", top: 43
                , left: 60
            }
        ]
    );
});

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