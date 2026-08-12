"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type ViewMode = "arrival" | "ground" | "living";

type SceneApi = {
  setMode: (mode: ViewMode) => void;
  setNight: (isNight: boolean) => void;
  setAutoRotate: (isAutoRotating: boolean) => void;
  dispose: () => void;
};

type Palette = {
  limestone: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  darkPlaster: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  woodLight: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
  black: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  water: THREE.MeshPhysicalMaterial;
  clay: THREE.MeshStandardMaterial;
  gravel: THREE.MeshStandardMaterial;
  planting: THREE.MeshStandardMaterial;
  leaf: THREE.MeshStandardMaterial;
  light: THREE.MeshStandardMaterial;
  rug: THREE.MeshStandardMaterial;
};

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function materialPalette(): Palette {
  return {
    limestone: new THREE.MeshStandardMaterial({ color: 0xd8d0c1, roughness: 0.82, metalness: 0.02 }),
    plaster: new THREE.MeshStandardMaterial({ color: 0xe9e6dd, roughness: 0.7, metalness: 0.01 }),
    darkPlaster: new THREE.MeshStandardMaterial({ color: 0x2d3838, roughness: 0.72, metalness: 0.08 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x5c3929, roughness: 0.52, metalness: 0.04 }),
    woodLight: new THREE.MeshStandardMaterial({ color: 0xa97655, roughness: 0.58, metalness: 0.02 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x7f6243, roughness: 0.3, metalness: 0.67 }),
    black: new THREE.MeshStandardMaterial({ color: 0x11191a, roughness: 0.27, metalness: 0.66 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x9eb9b4,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.18,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: 0x4b8581,
      roughness: 0.08,
      metalness: 0.22,
      transmission: 0.12,
      transparent: true,
      opacity: 0.72,
    }),
    clay: new THREE.MeshStandardMaterial({ color: 0x9e6655, roughness: 0.82, metalness: 0.01 }),
    gravel: new THREE.MeshStandardMaterial({ color: 0x9d9b8d, roughness: 0.97, metalness: 0 }),
    planting: new THREE.MeshStandardMaterial({ color: 0x3f5146, roughness: 0.98, metalness: 0 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x667c63, roughness: 0.9, metalness: 0 }),
    light: new THREE.MeshStandardMaterial({ color: 0xffb36c, emissive: 0xff8a3d, emissiveIntensity: 1.4, roughness: 0.36 }),
    rug: new THREE.MeshStandardMaterial({ color: 0x6e766e, roughness: 1, metalness: 0 }),
  };
}

function box(
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
  options: { rounded?: number; cast?: boolean; receive?: boolean } = {},
) {
  const geometry = options.rounded
    ? new RoundedBoxGeometry(size[0], size[1], size[2], 4, options.rounded)
    : new THREE.BoxGeometry(size[0], size[1], size[2]);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = options.cast ?? true;
  mesh.receiveShadow = options.receive ?? true;
  parent.add(mesh);
  return mesh;
}

function cylinder(
  parent: THREE.Object3D,
  radius: number,
  height: number,
  position: [number, number, number],
  material: THREE.Material,
  radialSegments = 12,
) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, height, radialSegments), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sphere(
  parent: THREE.Object3D,
  radius: number,
  position: [number, number, number],
  material: THREE.Material,
  scale: [number, number, number] = [1, 1, 1],
) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), material);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addPendant(parent: THREE.Object3D, palette: Palette, x: number, y: number, z: number) {
  box(parent, [0.018, 0.36, 0.018], [x, y + 0.18, z], palette.black, { cast: false, receive: false });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.27, 0.13, 24), palette.light);
  shade.position.set(x, y - 0.03, z);
  shade.castShadow = false;
  shade.receiveShadow = false;
  parent.add(shade);
}

function createTree(parent: THREE.Object3D, palette: Palette, position: [number, number, number], scale = 1, warm = false) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.scale.setScalar(scale);
  parent.add(group);
  cylinder(group, 0.08, 1.1, [0, 0.55, 0], palette.wood, 8);
  sphere(group, 0.55, [0, 1.3, 0], warm ? palette.woodLight : palette.leaf, [0.78, 1.18, 0.78]);
  sphere(group, 0.36, [-0.32, 1.55, 0.05], warm ? palette.woodLight : palette.leaf, [0.84, 1.1, 0.84]);
  sphere(group, 0.34, [0.34, 1.63, -0.05], warm ? palette.woodLight : palette.leaf, [0.9, 1.08, 0.9]);
  return group;
}

function addStoneCourse(parent: THREE.Object3D, palette: Palette, x: number, y: number, z: number, width: number, depth: number, rows: number) {
  for (let row = 0; row < rows; row += 1) {
    const stoneHeight = 0.22;
    const gap = 0.07;
    const count = Math.max(3, Math.round(width / 0.78));
    const stoneWidth = (width - gap * (count - 1)) / count;
    for (let index = 0; index < count; index += 1) {
      const offset = row % 2 === 0 ? 0 : stoneWidth * 0.48;
      const stoneX = x - width / 2 + index * (stoneWidth + gap) + stoneWidth / 2 - offset;
      if (stoneX < x - width / 2 - 0.3 || stoneX > x + width / 2 + 0.3) continue;
      box(parent, [stoneWidth * 0.92, stoneHeight, depth], [stoneX, y + row * (stoneHeight + 0.03), z], row % 3 === 0 ? palette.limestone : palette.plaster, { rounded: 0.03 });
    }
  }
}

function addWoodFins(parent: THREE.Object3D, palette: Palette, xStart: number, xEnd: number, y: number, z: number, height: number, count: number, depth = 0.13) {
  for (let index = 0; index < count; index += 1) {
    const x = THREE.MathUtils.lerp(xStart, xEnd, index / Math.max(1, count - 1));
    box(parent, [0.08, height, depth], [x, y, z], palette.wood, { rounded: 0.025 });
  }
}

function addGlassWall(parent: THREE.Object3D, palette: Palette, x: number, y: number, z: number, width: number, height: number, depth = 0.06) {
  box(parent, [width, height, depth], [x, y, z], palette.glass, { cast: false, receive: true });
  const frameMaterial = palette.black;
  box(parent, [0.06, height, 0.08], [x - width / 2, y, z], frameMaterial);
  box(parent, [0.06, height, 0.08], [x + width / 2, y, z], frameMaterial);
  box(parent, [width, 0.06, 0.08], [x, y - height / 2, z], frameMaterial);
  box(parent, [width, 0.06, 0.08], [x, y + height / 2, z], frameMaterial);
  box(parent, [0.04, height, 0.08], [x, y, z], frameMaterial);
}

function addPlanter(parent: THREE.Object3D, palette: Palette, x: number, y: number, z: number, width: number, depth: number) {
  box(parent, [width, 0.34, depth], [x, y + 0.17, z], palette.clay, { rounded: 0.05 });
  box(parent, [width * 0.82, 0.05, depth * 0.7], [x, y + 0.36, z], palette.planting, { cast: false });
  for (let index = 0; index < Math.max(3, Math.round(width / 0.45)); index += 1) {
    const offset = (index - 1) * (width / 4);
    box(parent, [0.035, 0.3 + (index % 3) * 0.1, 0.035], [x + offset, y + 0.55, z], palette.leaf);
  }
}

function addDiningSet(parent: THREE.Object3D, palette: Palette, x: number, y: number, z: number) {
  box(parent, [2.45, 0.12, 1.02], [x, y + 0.92, z], palette.woodLight, { rounded: 0.07 });
  for (const px of [-0.85, 0.85]) {
    for (const pz of [-0.34, 0.34]) box(parent, [0.08, 0.88, 0.08], [x + px, y + 0.45, z + pz], palette.black, { rounded: 0.02 });
  }
  for (const px of [-0.92, 0, 0.92]) {
    for (const pz of [-0.82, 0.82]) {
      box(parent, [0.48, 0.08, 0.46], [x + px, y + 0.5, z + pz], palette.wood, { rounded: 0.08 });
      box(parent, [0.38, 0.45, 0.08], [x + px, y + 0.3, z + pz - (pz > 0 ? -0.16 : 0.16)], palette.black, { rounded: 0.04 });
    }
  }
}

function addSofa(parent: THREE.Object3D, palette: Palette, x: number, y: number, z: number) {
  box(parent, [3.2, 0.42, 0.92], [x, y + 0.38, z], palette.plaster, { rounded: 0.12 });
  box(parent, [3.2, 0.82, 0.22], [x, y + 0.87, z + 0.34], palette.darkPlaster, { rounded: 0.1 });
  for (const offset of [-0.92, 0, 0.92]) box(parent, [0.82, 0.26, 0.72], [x + offset, y + 0.78, z - 0.04], palette.woodLight, { rounded: 0.12 });
}

function addKitchen(parent: THREE.Object3D, palette: Palette, x: number, y: number, z: number) {
  box(parent, [3.6, 0.8, 0.72], [x, y + 0.4, z], palette.wood, { rounded: 0.08 });
  box(parent, [3.68, 0.07, 0.78], [x, y + 0.84, z], palette.limestone, { rounded: 0.025 });
  box(parent, [0.92, 0.78, 0.64], [x - 1.05, y + 0.4, z], palette.black, { rounded: 0.03 });
  box(parent, [0.42, 0.025, 0.42], [x + 0.68, y + 0.88, z], palette.black, { rounded: 0.01 });
  for (const pz of [-0.18, 0.18]) box(parent, [0.15, 0.025, 0.15], [x + 0.15, y + 0.88, z + pz], palette.bronze, { rounded: 0.02 });
  box(parent, [3.35, 0.02, 0.03], [x, y + 0.18, z - 0.37], palette.bronze);
}

function addStair(parent: THREE.Object3D, palette: Palette, x: number, y: number, z: number) {
  const treadCount = 12;
  for (let index = 0; index < treadCount; index += 1) {
    const stepHeight = 0.16;
    box(parent, [1.25, stepHeight, 0.38], [x, y + stepHeight * (index + 0.5), z + index * 0.32], index % 2 === 0 ? palette.woodLight : palette.limestone, { rounded: 0.025 });
  }
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 4.25, 8), palette.black);
  rail.rotation.x = Math.PI / 2 - 0.36;
  rail.position.set(x + 0.68, y + 1.3, z + 1.62);
  rail.castShadow = true;
  parent.add(rail);
  for (let index = 0; index < 6; index += 1) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.3, 8), palette.black);
    post.position.set(x + 0.68, y + 0.65 + index * 0.18, z + 0.24 + index * 0.64);
    post.castShadow = true;
    parent.add(post);
  }
}

function buildScene(container: HTMLDivElement): SceneApi {
  const scene = new THREE.Scene();
  const palette = materialPalette();
  scene.background = new THREE.Color(0xd5d0c4);
  scene.fog = new THREE.Fog(0xd5d0c4, 22, 48);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(17.5, 13.5, 18.5);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.domElement.setAttribute("aria-label", "ATELIER COURTの3D建築モデル");
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 8;
  controls.maxDistance = 31;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 2.25, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.42;

  const ambient = new THREE.HemisphereLight(0xf5efe3, 0x52605b, 1.6);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xfff0d1, 3.2);
  keyLight.position.set(-10, 18, 9);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -18;
  keyLight.shadow.camera.right = 18;
  keyLight.shadow.camera.top = 18;
  keyLight.shadow.camera.bottom = -18;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x9dc7c1, 1.6);
  rimLight.position.set(12, 10, -14);
  scene.add(rimLight);
  const warmLights: THREE.PointLight[] = [];

  const siteGroup = new THREE.Group();
  const groundGroup = new THREE.Group();
  const upperGroup = new THREE.Group();
  const roofGroup = new THREE.Group();
  const furnitureGroup = new THREE.Group();
  const groundFurnitureGroup = new THREE.Group();
  scene.add(siteGroup, groundGroup, upperGroup, roofGroup, furnitureGroup, groundFurnitureGroup);

  box(siteGroup, [17.2, 0.18, 10.9], [0, -0.09, 0], palette.gravel, { cast: false });
  box(siteGroup, [5.5, 0.05, 2.45], [-4.15, 0.03, -4.15], palette.limestone, { cast: false });
  box(siteGroup, [3.35, 0.04, 1.5], [4.75, 0.03, 4.18], palette.wood, { cast: false });
  box(siteGroup, [3.15, 0.025, 2.7], [4.82, 0.04, 2.18], palette.darkPlaster, { cast: false, receive: true });
  box(siteGroup, [3.12, 0.04, 2.66], [4.82, 0.05, 2.18], palette.water, { cast: false, receive: true });
  box(siteGroup, [0.05, 0.08, 2.7], [3.27, 0.1, 2.18], palette.bronze, { cast: false });
  box(siteGroup, [0.05, 0.08, 2.7], [6.37, 0.1, 2.18], palette.bronze, { cast: false });
  box(siteGroup, [3.15, 0.08, 0.05], [4.82, 0.1, 0.86], palette.bronze, { cast: false });
  box(siteGroup, [3.15, 0.08, 0.05], [4.82, 0.1, 3.5], palette.bronze, { cast: false });
  addPlanter(siteGroup, palette, -6.75, 0.05, 3.52, 2.8, 0.55);
  addPlanter(siteGroup, palette, 0.2, 0.05, 4.03, 5.8, 0.55);
  addPlanter(siteGroup, palette, 6.95, 0.05, 2.25, 0.42, 4.2);
  createTree(siteGroup, palette, [-7.2, 0, 4.35], 1.08);
  createTree(siteGroup, palette, [7.25, 0, 4.45], 0.92, true);
  createTree(siteGroup, palette, [7.35, 0, -4.45], 0.8);
  createTree(siteGroup, palette, [-7.25, 0, -4.35], 0.62);
  createTree(siteGroup, palette, [5.95, 0.05, 3.7], 0.72);
  for (let index = 0; index < 9; index += 1) sphere(siteGroup, 0.16 + (index % 2) * 0.04, [3.65 + index * 0.36, 0.18, 3.56 + (index % 3) * 0.07], palette.leaf, [0.75, 1.4, 0.75]);

  box(groundGroup, [5.4, 2.75, 6.55], [-3.85, 1.42, 0.22], palette.limestone, { rounded: 0.08 });
  box(groundGroup, [6.55, 2.75, 6.55], [2.05, 1.42, 0.22], palette.plaster, { rounded: 0.08 });
  box(groundGroup, [0.42, 2.2, 6.65], [-0.57, 1.58, 0.22], palette.darkPlaster, { rounded: 0.02 });
  addStoneCourse(groundGroup, palette, -3.85, 0.06, -3.08, 5.28, 0.16, 3);
  box(groundGroup, [5.02, 2.32, 0.08], [-3.85, 1.28, -3.13], palette.black, { cast: false });
  box(groundGroup, [4.58, 2.12, 0.08], [-3.85, 1.27, -3.2], palette.wood, { rounded: 0.02 });
  for (let index = 0; index < 8; index += 1) box(groundGroup, [0.025, 2.02, 0.025], [-6.05 + index * 0.63, 1.28, -3.26], palette.bronze, { cast: false });
  box(groundGroup, [1.58, 2.7, 0.3], [-0.72, 1.47, -3.05], palette.wood, { rounded: 0.035 });
  box(groundGroup, [1.22, 2.32, 0.05], [-0.72, 1.33, -3.22], palette.woodLight, { rounded: 0.015 });
  box(groundGroup, [1.28, 0.08, 0.08], [-0.72, 2.43, -3.28], palette.bronze, { cast: false });
  box(groundGroup, [0.58, 0.035, 0.035], [-0.72, 1.34, -3.28], palette.bronze, { cast: false });
  box(groundGroup, [0.025, 1.7, 0.025], [-0.43, 1.35, -3.3], palette.bronze, { cast: false });
  addPlanter(siteGroup, palette, 1.2, 0.05, -3.22, 1.4, 0.42);
  addGlassWall(groundGroup, palette, 5.05, 1.55, 3.48, 4.1, 2.24);
  addWoodFins(groundGroup, palette, 3.35, 6.75, 1.52, 3.37, 2.35, 10, 0.11);
  box(groundGroup, [5.35, 0.18, 0.22], [3.95, 2.58, 3.3], palette.wood, { rounded: 0.04 });

  box(upperGroup, [10.3, 2.28, 4.65], [-1.55, 4.05, 0.62], palette.plaster, { rounded: 0.08 });
  box(upperGroup, [10.05, 0.16, 1.08], [-1.55, 2.93, -1.72], palette.wood, { rounded: 0.035 });
  box(upperGroup, [10.65, 0.18, 0.22], [-1.55, 5.16, 0.55], palette.darkPlaster, { rounded: 0.035 });
  box(upperGroup, [9.52, 1.85, 0.07], [-1.55, 4.06, -1.76], palette.glass, { cast: false });
  box(upperGroup, [0.08, 1.98, 0.12], [-6.62, 4.06, -1.82], palette.black);
  box(upperGroup, [0.08, 1.98, 0.12], [3.52, 4.06, -1.82], palette.black);
  addWoodFins(upperGroup, palette, -5.95, 2.8, 4.1, -1.86, 2.08, 13, 0.12);
  addGlassWall(upperGroup, palette, 3.56, 4.07, 0.65, 0.08, 2.04);
  box(upperGroup, [0.18, 2.08, 4.62], [3.38, 4.06, 0.62], palette.darkPlaster, { rounded: 0.03 });
  box(upperGroup, [0.2, 1.4, 2.7], [3.27, 4.07, 1.1], palette.black, { cast: false });
  addWoodFins(upperGroup, palette, 3.44, 3.8, 4.1, 1.1, 1.78, 4, 0.12);

  box(roofGroup, [12.35, 0.26, 5.2], [-0.2, 5.32, 0.62], palette.darkPlaster, { rounded: 0.05 });
  box(roofGroup, [6.8, 1.55, 2.02], [-2.22, 6.1, 1.62], palette.wood, { rounded: 0.06 });
  box(roofGroup, [2.58, 1.55, 2.02], [2.4, 6.1, -0.74], palette.plaster, { rounded: 0.06 });
  addGlassWall(roofGroup, palette, -2.22, 6.1, 0.58, 6.18, 1.12, 0.07);
  addWoodFins(roofGroup, palette, -5.3, 0.86, 6.1, 0.51, 1.22, 11, 0.1);
  box(roofGroup, [2.75, 0.12, 2.55], [1.15, 6.58, 0.64], palette.bronze, { cast: false });
  addGlassWall(roofGroup, palette, 1.15, 6.96, 0.64, 2.42, 0.82, 0.06);
  addWoodFins(roofGroup, palette, 0.05, 2.25, 6.98, 0.64, 0.8, 8, 0.08);
  box(roofGroup, [3.18, 0.18, 2.98], [1.15, 7.45, 0.64], palette.plaster, { rounded: 0.04 });

  box(furnitureGroup, [8.0, 0.06, 3.8], [-0.75, 3.0, 0.36], palette.limestone, { cast: false });
  box(furnitureGroup, [2.75, 0.035, 1.8], [-1.6, 3.04, 0.72], palette.rug, { cast: false });
  addSofa(furnitureGroup, palette, -1.6, 3.06, -0.07);
  addDiningSet(furnitureGroup, palette, 0.9, 3.06, 0.98);
  addKitchen(furnitureGroup, palette, -0.7, 3.06, 1.92);
  addPendant(furnitureGroup, palette, 0.35, 4.78, 0.98);
  addPendant(furnitureGroup, palette, 1.4, 4.78, 0.98);
  addPendant(furnitureGroup, palette, -0.7, 4.78, 1.92);
  addStair(furnitureGroup, palette, 2.18, 0.18, -0.1);
  box(furnitureGroup, [0.16, 0.82, 0.16], [2.18, 0.62, -0.3], palette.bronze, { rounded: 0.04 });
  box(furnitureGroup, [0.16, 0.82, 0.16], [2.18, 0.62, 0.34], palette.bronze, { rounded: 0.04 });
  box(groundFurnitureGroup, [2.0, 0.12, 0.7], [-1.7, 1.05, 0.7], palette.woodLight, { rounded: 0.06 });
  box(groundFurnitureGroup, [0.08, 0.88, 0.08], [-2.45, 0.56, 0.45], palette.black, { rounded: 0.02 });
  box(groundFurnitureGroup, [0.08, 0.88, 0.08], [-0.95, 0.56, 0.45], palette.black, { rounded: 0.02 });
  box(groundFurnitureGroup, [1.72, 0.08, 2.2], [1.85, 0.76, 2.0], palette.wood, { cast: false });
  for (let index = 0; index < 5; index += 1) box(groundFurnitureGroup, [0.06, 0.48, 0.18], [1.2 + index * 0.28, 1.08, 1.25], palette.leaf, { cast: false });
  const addPoint = (position: [number, number, number], color: number, intensity: number, distance: number) => {
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(...position);
    light.castShadow = true;
    warmLights.push(light);
    scene.add(light);
  };
  addPoint([-0.72, 3.85, -2.0], 0xffa45d, 1.3, 5);
  addPoint([-0.8, 2.2, -3.0], 0xff9a55, 0.9, 4);
  addPoint([4.8, 1.15, 2.18], 0x9de1ce, 1.2, 7);
  addPoint([1.15, 6.9, 0.64], 0xffad68, 1.4, 4);
  addPoint([0.85, 4.45, 0.98], 0xffa45d, 2.1, 5);
  warmLights.forEach((light) => { light.visible = false; });

  const ldkGhosts: Array<{ mesh: THREE.Mesh; material: THREE.Material; ghost: THREE.Material }> = [];
  const setLdkCutaway = (enabled: boolean) => {
    if (enabled) {
      upperGroup.traverse((object) => {
        if (!(object instanceof THREE.Mesh) || ldkGhosts.some((entry) => entry.mesh === object)) return;
        const original = object.material as THREE.Material;
        const ghost = original.clone();
        ghost.transparent = true;
        ghost.opacity = original === palette.glass ? 0.12 : 0.16;
        ghost.depthWrite = false;
        object.material = ghost;
        ldkGhosts.push({ mesh: object, material: original, ghost });
      });
      return;
    }
    ldkGhosts.forEach(({ mesh, material, ghost }) => {
      mesh.material = material;
      ghost.dispose();
    });
    ldkGhosts.length = 0;
  };

  const modeTargets: Record<ViewMode, { position: THREE.Vector3; target: THREE.Vector3 }> = {
    arrival: { position: v3(17.5, 13.5, 18.5), target: v3(0, 2.25, 0) },
    ground: { position: v3(13.8, 10.8, 14.5), target: v3(-0.7, 1.1, -0.05) },
    living: { position: v3(10.8, 7.8, 12.4), target: v3(-0.3, 3.55, 0.45) },
  };
  let animationFrame = 0;

  const tweenCamera = (next: ViewMode) => {
    const destination = modeTargets[next];
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const startedAt = performance.now();
    const duration = 760;
    const animateCamera = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      camera.position.lerpVectors(startPosition, destination.position, eased);
      controls.target.lerpVectors(startTarget, destination.target, eased);
      if (progress < 1) requestAnimationFrame(animateCamera);
    };
    requestAnimationFrame(animateCamera);
    groundGroup.visible = next !== "living";
    upperGroup.visible = next !== "ground";
    roofGroup.visible = next === "arrival";
    setLdkCutaway(next === "living");
    furnitureGroup.visible = next !== "ground";
    groundFurnitureGroup.visible = next !== "living";
    siteGroup.visible = true;
  };

  const toggleNight = (next: boolean) => {
    scene.background = new THREE.Color(next ? 0x101716 : 0xd5d0c4);
    scene.fog = new THREE.Fog(next ? 0x101716 : 0xd5d0c4, 22, 48);
    ambient.intensity = next ? 0.35 : 1.6;
    keyLight.intensity = next ? 0.38 : 3.2;
    rimLight.intensity = next ? 0.62 : 1.6;
    warmLights.forEach((light) => { light.visible = next; });
    palette.glass.emissive.set(next ? 0x365c57 : 0x000000);
    palette.glass.emissiveIntensity = next ? 0.42 : 0;
    renderer.toneMappingExposure = next ? 1.34 : 1.12;
  };

  const resize = () => {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  window.addEventListener("resize", resize);

  const timer = new THREE.Timer();
  timer.connect(document);
  const animate = (now?: number) => {
    timer.update(now);
    const elapsed = timer.getElapsed();
    const water = siteGroup.children[5];
    if (water instanceof THREE.Mesh) water.position.y = 0.05 + Math.sin(elapsed * 0.65) * 0.008;
    controls.update();
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(animate);
  };
  animate();

  return {
    setMode: tweenCamera,
    setNight: toggleNight,
    setAutoRotate: (isAutoRotating: boolean) => { controls.autoRotate = isAutoRotating; },
    dispose: () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resize);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      timer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      setLdkCutaway(false);
    },
  };
}

const viewOptions: { id: ViewMode; label: string; number: string }[] = [
  { id: "arrival", label: "全体", number: "01" },
  { id: "ground", label: "1F", number: "02" },
  { id: "living", label: "LDK", number: "03" },
];

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>("arrival");
  const [isNight, setIsNight] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;
    const api = buildScene(mountRef.current);
    apiRef.current = api;
    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  const changeView = (mode: ViewMode) => {
    setActiveView(mode);
    apiRef.current?.setMode(mode);
  };

  const changeNight = () => {
    const next = !isNight;
    setIsNight(next);
    apiRef.current?.setNight(next);
  };

  const changeRotation = () => {
    const next = !autoRotate;
    setAutoRotate(next);
    apiRef.current?.setAutoRotate(next);
  };

  return (
    <main className="experience-shell">
      <div ref={mountRef} className="scene-mount" />
      <div className="scene-vignette" aria-hidden="true" />

      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand-name">ATELIER COURT</span>
          <span className="brand-index">/ 06</span>
        </div>
        <div className="topbar-status"><span className="status-dot" /> THREE.JS STUDY <span className="status-rule" /> 2026</div>
      </header>

      <section className="hero-copy" aria-label="設計コンセプト">
        <p className="eyebrow">A HOUSE WITHIN A GARDEN</p>
        <h1>Shadow<br /><em>Garden</em></h1>
        <p className="hero-description">街に対しては静かに、内側には光と緑を抱く。<br />石の基壇に、浮遊する木のリボンを重ねた都市住宅。</p>
      </section>

      <aside className="spec-card">
        <div className="spec-heading"><span>PROJECT DATA</span><span>01—06</span></div>
        <div className="spec-row"><span>FLOOR AREA</span><strong>201.2<span>㎡</span></strong></div>
        <div className="spec-row"><span>COURTYARD</span><strong>01<span> open sky</span></strong></div>
        <div className="spec-row"><span>GARAGE</span><strong>02<span> cars</span></strong></div>
        <div className="spec-row"><span>PRIVACY</span><strong>100<span>%</span></strong></div>
      </aside>

      <div className="interaction-hint"><span className="mouse-icon"><i /></span><span>ドラッグで回転<br />スクロールでズーム</span></div>

      <nav className="view-dock" aria-label="モデル表示切替">
        <div className="dock-label">EXPLORE MODEL</div>
        <div className="view-buttons">
          {viewOptions.map((option) => (
            <button key={option.id} className={activeView === option.id ? "view-button active" : "view-button"} onClick={() => changeView(option.id)}>
              <span>{option.number}</span>{option.label}
            </button>
          ))}
          <button className={isNight ? "view-button active night-button" : "view-button night-button"} onClick={changeNight}>
            <span>{isNight ? "☼" : "☾"}</span>{isNight ? "DAY" : "NIGHT"}
          </button>
        </div>
      </nav>

      <div className="lower-meta">
        <div><span className="meta-label">CONCEPT</span><span>quiet street / vivid court</span></div>
        <button className="rotate-toggle" onClick={changeRotation} aria-pressed={autoRotate}><span className={autoRotate ? "toggle-dot on" : "toggle-dot"} />AUTO ROTATE {autoRotate ? "ON" : "OFF"}</button>
      </div>

      <div className="floor-marker" aria-hidden="true"><span>01</span><i /><span>02</span><i /><span>2.5</span></div>
    </main>
  );
}
