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
}); function setupButton(buttonId, targetPosition, targetRotation, imgSrc, annotations) {
    document.getElementById(buttonId).addEventListener('click', () => {
        moveToPosition(targetPosition, targetRotation);

        const imageElement = document.getElementById('highlightedImage');
        // Remove existing annotations
        document.querySelectorAll('.imageAnnotation').forEach(el => el.remove());

        // Create and append new annotations
        annotations.forEach(annotation => {
            const annotationDiv = document.createElement('div');
            annotationDiv.classList.add('imageAnnotation'); // Use class for multiple annotations
            // Directly use CSS for styling, remove inline style setting here
            annotationDiv.style.left = annotation.position.left; // Specify position
            annotationDiv.style.top = annotation.position.top;
            annotationDiv.innerHTML = annotation.text;

            document.querySelector('.display-flex').appendChild(annotationDiv); // Adjust the container if necessary
        });

        imageElement.style.opacity = '0'; // Start fade out

        setTimeout(() => {
            imageElement.src = imgSrc; // Change the image source
            requestAnimationFrame(() => {
                setTimeout(() => {
                    imageElement.onload = () => {
                        imageElement.style.opacity = '1'; // Start fade in
                        // Show annotations after the image has faded in
                        document.querySelectorAll('.imageAnnotation').forEach(annotationDiv => {
                            annotationDiv.style.display = 'block';
                            setTimeout(() => {
                                annotationDiv.style.opacity = '1';
                            }, 20); // Small delay to ensure transition plays
                        });
                    };
                    // Fallback for cached images
                    if (imageElement.complete) {
                        imageElement.style.opacity = '1';
                    }
                }, 20);
            });
        }, 1000); // Wait for the fade-out transition
    });
}
// Assuming the setupButton function or similar setup where annotations are added
document.getElementById('highlightHands').addEventListener('click', () => {
    const targetPosition = [-0.0660334144529682, 0.6502196321957312, 0.32696100830758873];
    const targetRotation = [-1.1024588704293636, -0.0308862259681673, -0.06096955204728574];
    moveToPosition(targetPosition, targetRotation);

    const imgSrc = document.getElementById('highlightHands').getAttribute('data-img-src');
    const imageElement = document.getElementById('highlightedImage');

    // Create and add the annotation for "The Hands"
    const annotationText = `With sculpture, you have to be pretty cognizant of your scale. It's a small child of roughly correct dimension with more of a man-sized hands. Many people are in prison for actions they took when they were young sometimes the deeds of a child can have adult-sized consequences.`;
    const annotationDiv = document.createElement('div');
    annotationDiv.classList.add('imageAnnotation'); // Apply the CSS class
    annotationDiv.innerHTML = annotationText;
    // Set position dynamically if needed, or use predefined positions in CSS classes
    annotationDiv.style.left = '20px';
    annotationDiv.style.top = '20px';
    document.querySelector('.display-flex').appendChild(annotationDiv);

    imageElement.style.opacity = '0'; // Start fade out

    setTimeout(() => {
        imageElement.src = imgSrc; // Change the image source
        requestAnimationFrame(() => {
            setTimeout(() => {
                // Only start the fade-in after the image is loaded to avoid a blink
                imageElement.onload = () => {
                    imageElement.style.opacity = '1';
                    annotationDiv.style.display = 'block'; // Make the annotation visible
                };
                imageElement.style.opacity = '1'; // Fallback for cached images
            }, 20);
        });
    }, 1000); // Match this with the CSS transition time to ensure a smooth fade out before changing the image
});


// document.getElementById('highlightHands').addEventListener('click', () => {
//     const targetPosition = [-0.0660334144529682, 0.6502196321957312, 0.32696100830758873];
//     const targetRotation = [-1.1024588704293636, -0.0308862259681673, -0.06096955204728574];
//     moveToPosition(targetPosition, targetRotation);

//     const imgSrc = document.getElementById('highlightHands').getAttribute('data-img-src');
//     const imageElement = document.getElementById('highlightedImage');

//     // Ensure fade out is seen
//     imageElement.style.opacity = '0';

//     // Delay changing the image source until after the fade-out transition has had time to play
//     setTimeout(() => {
//         imageElement.src = imgSrc;
//         // Wait for the next frame to ensure the src has been set
//         requestAnimationFrame(() => {
//             // Now, delay the fade-in to ensure it's smooth
//             setTimeout(() => {
//                 // Only start the fade-in after the image is loaded to avoid a blink
//                 imageElement.onload = () => {
//                     imageElement.style.opacity = '1';
//                 };
//                 // If the image is cached, the load event might not trigger after changing the src,
//                 // so directly setting opacity might be necessary.
//                 // This is a fallback in case the image loads too fast
//                 imageElement.style.opacity = '1';
//             }, 20); // Short delay to ensure the opacity change is recognized as a transition
//         });
//     }, 1000); // Match this with the CSS transition time to ensure a smooth fade out before changing the image
// });


// document.getElementById('highlightSplash').addEventListener('click', () => {
//     const targetPosition = [0.09135275057812703, 0.42109411760641313, 0.40722327997076607];
//     const targetRotation = [-0.691460007477806, 0.4341025015581536, 0.3350408722453509];
//     moveToPosition(targetPosition, targetRotation);

//     const imgSrc = document.getElementById('highlightSplash').getAttribute('data-img-src');
//     const imageElement = document.getElementById('highlightedImage');

//     // Ensure fade out is seen
//     imageElement.style.opacity = '0';

//     // Delay changing the image source until after the fade-out transition has had time to play
//     setTimeout(() => {
//         imageElement.src = imgSrc;
//         // Wait for the next frame to ensure the src has been set
//         requestAnimationFrame(() => {
//             // Now, delay the fade-in to ensure it's smooth
//             setTimeout(() => {
//                 // Only start the fade-in after the image is loaded to avoid a blink
//                 imageElement.onload = () => {
//                     imageElement.style.opacity = '1';
//                 };
//                 // If the image is cached, the load event might not trigger after changing the src,
//                 // so directly setting opacity might be necessary.
//                 // This is a fallback in case the image loads too fast
//                 imageElement.style.opacity = '1';
//             }, 20); // Short delay to ensure the opacity change is recognized as a transition
//         });
//     }, 1000); // Match this with the CSS transition time to ensure a smooth fade out before changing the image
// });

// setupButton(
//     'highlightHands',
//     [-0.0660334144529682, 0.6502196321957312, 0.32696100830758873],
//     [-1.1024588704293636, -0.0308862259681673, -0.06096955204728574],
//     'hands.jpg',
//     [
//         {
//             text: "With sculpture, you have to be pretty cognizant of your scale. It's a small child of roughly correct dimension with more of a man-sized hands.",
//             position: { left: '20px', top: '20px' }
//         },
//         {
//             text: "Many people are in prison for actions they took when they were young; sometimes the deeds of a child can have adult-sized consequences.",
//             position: { left: '20px', top: '100px' } // Adjust positioning as needed
//         }
//     ]
// );

const splashAnnotations = [
    {
        text: "Annotation 1 for Splash.",
        position: { left: '20px', top: '20px' } // Adjust positioning as needed
    },
    {
        text: "Annotation 2 for Splash.",
        position: { left: '20px', top: '100px' } // Adjust positioning as needed
    }
    // Add more annotations as needed
];

setupButton(
    'highlightSplash',
    [0.09135275057812703, 0.42109411760641313, 0.40722327997076607],
    [-0.691460007477806, 0.4341025015581536, 0.3350408722453509],
    'fillourselves.jpg',
    splashAnnotations
);


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



