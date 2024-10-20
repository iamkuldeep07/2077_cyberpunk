import './style.css'
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import gsap from 'gsap';
// Locomotive Scroll CDN
import LocomotiveScroll from 'locomotive-scroll';

const scroll = new LocomotiveScroll();

// scene
const scene = new THREE.Scene();
// camera
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3.5;
// renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#canvas"),
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
// HDRI loader
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.0030;
composer.addPass(rgbShiftPass);

let model;

new RGBELoader()
  .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/pond_bridge_night_1k.hdr', function(texture) {
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    scene.environment = envMap;
    texture.dispose();
    pmremGenerator.dispose();

    const loader = new GLTFLoader();
    loader.load(
      './DamagedHelmet.gltf',
      (gltf) => {
        model = gltf.scene; 
        scene.add(model);
        console.log('Model loaded successfully');
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('An error occurred while loading the GLTF model:', error);
      }
    );
  });

window.addEventListener("mousemove", (e) => {
  if(model){
    const rotationX = (e.clientX / window.innerWidth - .5) * (Math.PI * .2);
    const rotationY = (e.clientY / window.innerHeight - .5) * (Math.PI * .2);
    gsap.to(model.rotation, {
      x: rotationY,
      y: rotationX,
      duration: 0.9,
      ease: "power2.out"
    });
  }
  
});
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// render
function animate() {
  window.requestAnimationFrame(animate);
  if (model) {
    // Only render if the model is loaded
    composer.render();
  }
}
animate();
