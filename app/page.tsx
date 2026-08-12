"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { HOUSE_PLAN, PlanRect } from "./housePlan";

type ViewMode = "arrival" | "ground" | "living" | "upper";

type SceneApi = {
  setMode: (mode: ViewMode) => void;
  setNight: (isNight: boolean) => void;
  setAutoRotate: (isAutoRotating: boolean) => void;
  setPlanOverlay: (enabled: boolean) => void;
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

function addBed(parent: THREE.Object3D, palette: Palette, x: number, y: number, z: number, width = 1.9, depth = 1.35) {
  box(parent, [width + 0.12, 0.24, depth + 0.12], [x, y + 0.14, z], palette.wood, { rounded: 0.06 });
  box(parent, [width, 0.18, depth], [x, y + 0.34, z], palette.plaster, { rounded: 0.05 });
  box(parent, [width, 0.7, 0.08], [x, y + 0.60, z + depth / 2 - 0.05], palette.wood, { rounded: 0.025 });
  box(parent, [width * 0.42, 0.12, 0.38], [x - width * 0.22, y + 0.49, z - depth * 0.22], palette.limestone, { rounded: 0.05 });
  box(parent, [width * 0.42, 0.12, 0.38], [x + width * 0.22, y + 0.49, z - depth * 0.22], palette.limestone, { rounded: 0.05 });
}

function addCar(parent: THREE.Object3D, palette: Palette, x: number, z: number) {
  box(parent, [4.05, 0.42, 2.05], [x, 0.78, z], palette.black, { rounded: 0.16 });
  box(parent, [1.72, 0.38, 1.38], [x + 0.18, 1.14, z], palette.glass, { rounded: 0.12, cast: false });
  box(parent, [1.78, 0.08, 1.42], [x + 0.18, 1.36, z], palette.black, { rounded: 0.04, cast: false });
  for (const wheelX of [x - 1.35, x + 1.35]) {
    for (const wheelZ of [z - 0.68, z + 0.68]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 16), palette.black);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 0.48, wheelZ);
      wheel.castShadow = true;
      parent.add(wheel);
    }
  }
  for (const lightX of [x - 1.15, x + 1.15]) {
    box(parent, [0.34, 0.07, 0.06], [lightX, 0.94, z - 0.99], palette.light, { rounded: 0.02, cast: false });
  }
}

const planCenter = (rect: Pick<PlanRect, "x1" | "y1" | "x2" | "y2">): [number, number] => [
  (rect.x1 + rect.x2) / 2 - HOUSE_PLAN.site.width / 2,
  (rect.y1 + rect.y2) / 2 - HOUSE_PLAN.site.depth / 2,
];

const planSize = (rect: Pick<PlanRect, "x1" | "y1" | "x2" | "y2">): [number, number] => [
  rect.x2 - rect.x1,
  rect.y2 - rect.y1,
];

function planBox(
  parent: THREE.Object3D,
  rect: Pick<PlanRect, "x1" | "y1" | "x2" | "y2">,
  floorY: number,
  height: number,
  material: THREE.Material,
  options: { rounded?: number; cast?: boolean; receive?: boolean } = {},
) {
  const [x, z] = planCenter(rect);
  const [width, depth] = planSize(rect);
  return box(parent, [width, height, depth], [x, floorY + height / 2, z], material, options);
}

function planSlab(parent: THREE.Object3D, rect: Pick<PlanRect, "x1" | "y1" | "x2" | "y2">, y: number, material: THREE.Material) {
  const [x, z] = planCenter(rect);
  const [width, depth] = planSize(rect);
  return box(parent, [width, 0.16, depth], [x, y, z], material, { cast: false });
}

function roomMaterial(palette: Palette, material: string) {
  const map: Record<string, THREE.Material> = {
    garage: palette.darkPlaster,
    entry: palette.woodLight,
    office: palette.wood,
    circulation: palette.limestone,
    tatami: palette.woodLight,
    water: palette.glass,
    storage: palette.wood,
    ldk: palette.plaster,
    living: palette.plaster,
    dining: palette.plaster,
    kitchen: palette.wood,
    service: palette.limestone,
    courtyard: palette.water,
    bedroom: palette.wood,
  };
  return map[material] ?? palette.plaster;
}

function addPlanRoomMasses(parent: THREE.Object3D, palette: Palette, rooms: readonly PlanRect[], floorY: number, mode: "ground" | "living" | "half") {
  rooms.forEach((room) => {
    if (room.key === "courtyard") return;
    const outerMaterial = roomMaterial(palette, room.material);
    const roomHeight = mode === "half" ? 0.10 : 0.14;
    const roomMesh = planBox(parent, room, floorY, roomHeight, outerMaterial, { rounded: 0.035, cast: false });
    roomMesh.name = `PLAN_${mode}_${room.key}`;
  });
}

function addLowVoidGuard(parent: THREE.Object3D, palette: Palette, rect: Pick<PlanRect, "x1" | "y1" | "x2" | "y2">, floorY: number) {
  const guardHeight = 0.88;
  addPlanWall(parent, palette, [rect.x1, rect.y1], [rect.x2, rect.y1], floorY, guardHeight, palette.bronze, 0.055);
  addPlanWall(parent, palette, [rect.x1, rect.y1], [rect.x1, rect.y2], floorY, guardHeight, palette.bronze, 0.055);
  addPlanWall(parent, palette, [rect.x2, rect.y1], [rect.x2, rect.y2], floorY, guardHeight, palette.bronze, 0.055);
  addPlanWall(parent, palette, [rect.x1, rect.y2], [rect.x2, rect.y2], floorY, guardHeight, palette.bronze, 0.055);
}

function addPlanWall(parent: THREE.Object3D, palette: Palette, a: [number, number], b: [number, number], y: number, height: number, material: THREE.Material, thickness = 0.12) {
  const ax = a[0] - HOUSE_PLAN.site.width / 2;
  const az = a[1] - HOUSE_PLAN.site.depth / 2;
  const bx = b[0] - HOUSE_PLAN.site.width / 2;
  const bz = b[1] - HOUSE_PLAN.site.depth / 2;
  const dx = bx - ax;
  const dz = bz - az;
  const length = Math.hypot(dx, dz);
  const wall = box(parent, [length, height, thickness], [(ax + bx) / 2, y + height / 2, (az + bz) / 2], material, { rounded: 0.025 });
  wall.rotation.y = -Math.atan2(dz, dx);
  return wall;
}

function addShallowRoof(parent: THREE.Object3D, palette: Palette, rect: Pick<PlanRect, "x1" | "y1" | "x2" | "y2">, y: number, slope: number) {
  const [x, z] = planCenter(rect);
  const [width, depth] = planSize(rect);
  const roof = box(parent, [width, 0.18, depth], [x, y, z], palette.darkPlaster, { rounded: 0.035, cast: true });
  roof.rotation.z = slope;
  const soffit = box(parent, [width - 0.12, 0.07, depth - 0.12], [x, y - 0.14, z], palette.wood, { rounded: 0.02, cast: false });
  soffit.rotation.z = slope;
  return roof;
}

function addRoofOutline(parent: THREE.Object3D, palette: Palette, rect: Pick<PlanRect, "x1" | "y1" | "x2" | "y2">, y: number) {
  const roofMaterial = palette.darkPlaster;
  addPlanWall(parent, palette, [rect.x1, rect.y1], [rect.x2, rect.y1], y, 0.16, roofMaterial, 0.12);
  addPlanWall(parent, palette, [rect.x2, rect.y1], [rect.x2, rect.y2], y, 0.16, roofMaterial, 0.12);
  addPlanWall(parent, palette, [rect.x2, rect.y2], [rect.x1, rect.y2], y, 0.16, roofMaterial, 0.12);
  addPlanWall(parent, palette, [rect.x1, rect.y2], [rect.x1, rect.y1], y, 0.16, roofMaterial, 0.12);
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
  const roofCapGroup = new THREE.Group();
  const furnitureGroup = new THREE.Group();
  const groundFurnitureGroup = new THREE.Group();
  const upperFurnitureGroup = new THREE.Group();
  scene.add(siteGroup, groundGroup, upperGroup, roofGroup, roofCapGroup, furnitureGroup, groundFurnitureGroup, upperFurnitureGroup);

  const siteRect = { x1: 0, y1: 0, x2: HOUSE_PLAN.site.width, y2: HOUSE_PLAN.site.depth };
  planSlab(siteGroup, siteRect, -0.09, palette.gravel);
  const pathRect = { x1: 0, y1: 0, x2: HOUSE_PLAN.footprint.x1, y2: HOUSE_PLAN.site.depth };
  planSlab(siteGroup, pathRect, 0.03, palette.limestone);
  const court = HOUSE_PLAN.courtyard;
  const courtCenter = planCenter(court);
  addPlanter(siteGroup, palette, -6.75, 0.05, 3.52, 2.8, 0.55);
  addPlanter(siteGroup, palette, 0.2, 0.05, 4.03, 5.8, 0.55);
  addPlanter(siteGroup, palette, 6.95, 0.05, 2.25, 0.42, 4.2);
  createTree(siteGroup, palette, [-7.2, 0, 4.35], 1.08);
  createTree(siteGroup, palette, [7.25, 0, 4.45], 0.92, true);
  createTree(siteGroup, palette, [7.35, 0, -4.45], 0.8);
  createTree(siteGroup, palette, [-7.25, 0, -4.35], 0.62);
  createTree(siteGroup, palette, [courtCenter[0] + 1.0, 0.08, courtCenter[1] + 1.25], 0.7);

  addPlanRoomMasses(groundGroup, palette, HOUSE_PLAN.rooms.one, HOUSE_PLAN.levels.one.floor, "ground");
  const garage = HOUSE_PLAN.rooms.one.find((room) => room.key === "garage")!;
  planSlab(groundGroup, garage, 0.2, palette.darkPlaster);
  planBox(groundGroup, { x1: garage.x1, y1: garage.y1, x2: garage.x1 + 0.1, y2: garage.y2 }, 0.2, 2.45, palette.black, { cast: false });
  planBox(groundGroup, { x1: garage.x1 + 0.12, y1: garage.y1 + 0.14, x2: garage.x1 + 0.18, y2: garage.y2 - 0.14 }, 0.2, 2.22, palette.wood, { cast: false });
  addPlanWall(groundGroup, palette, [6.8, 3.2], [6.8, 8.2], 0.2, 2.9, palette.darkPlaster, 0.14);
  addPlanWall(groundGroup, palette, [13.2, 1.8], [13.2, 3.4], 0.2, 2.9, palette.plaster, 0.12);
  addPlanWall(groundGroup, palette, [13.2, 6.2], [13.2, 8.2], 0.2, 2.9, palette.plaster, 0.12);
  const entry = HOUSE_PLAN.rooms.one.find((room) => room.key === "entry")!;
  planBox(groundGroup, { x1: entry.x1, y1: entry.y1, x2: entry.x2, y2: entry.y1 + 0.08 }, 0.2, 2.7, palette.wood, { rounded: 0.02 });
  addPlanWall(groundGroup, palette, [1, 1.8], [6.8, 1.8], 0.2, 2.9, palette.limestone, 0.14);

  addPlanRoomMasses(upperGroup, palette, HOUSE_PLAN.rooms.two, HOUSE_PLAN.levels.two.floor, "living");
  const ldk = HOUSE_PLAN.rooms.two.find((room) => room.key === "ldk")!;
  planSlab(upperGroup, { x1: ldk.x1, y1: ldk.y1, x2: ldk.x2, y2: ldk.y2 }, 3.3, palette.plaster);
  const voidRect = HOUSE_PLAN.void2f;
  planSlab(upperGroup, voidRect, 3.42, palette.rug);
  planSlab(upperGroup, court, 3.38, palette.darkPlaster);
  const courtWater = planSlab(upperGroup, {
    x1: court.x1 + 0.08,
    y1: court.y1 + 0.08,
    x2: court.x2 - 0.08,
    y2: court.y2 - 0.08,
  }, 3.47, palette.water);
  addLowVoidGuard(upperGroup, palette, voidRect, 3.3);
  addPlanWall(upperGroup, palette, [court.x2, court.y1], [court.x2, court.y2], 3.3, 2.18, palette.darkPlaster, 0.18);
  addPlanWall(upperGroup, palette, [court.x1, court.y1], [court.x2, court.y1], 3.3, 0.42, palette.darkPlaster, 0.18);
  addPlanWall(upperGroup, palette, [court.x1, court.y2], [court.x2, court.y2], 3.3, 2.18, palette.darkPlaster, 0.18);
  addWoodFins(upperGroup, palette, -5.1, 0.15, 4.55, -3.95, 2.08, 12, 0.12);
  addWoodFins(upperGroup, palette, 4.25, 5.2, 4.55, 3.98, 2.12, 4, 0.12);

  addPlanRoomMasses(roofGroup, palette, HOUSE_PLAN.rooms.half, HOUSE_PLAN.levels.half.floor, "half");
  const upperSlab = { x1: 1.0, y1: 5.5, x2: 15.0, y2: 8.2 };
  planSlab(roofGroup, upperSlab, 6.4, palette.darkPlaster);
  const halfHall = HOUSE_PLAN.rooms.half.find((room) => room.key === "hall_25f")!;
  planSlab(roofGroup, halfHall, 6.42, palette.wood);
  addPlanWall(roofGroup, palette, [1, 5.5], [15, 5.5], 6.4, 2.8, palette.darkPlaster, 0.16);
  addPlanWall(roofGroup, palette, [7.8, 5.5], [7.8, 8.2], 6.4, 2.8, palette.wood, 0.12);
  addPlanWall(roofGroup, palette, [11.4, 5.5], [11.4, 8.2], 6.4, 2.8, palette.wood, 0.12);
  addGlassWall(roofGroup, palette, -1.3, 7.25, 1.0, 5.6, 1.02, 0.07);
  addWoodFins(roofGroup, palette, -3.95, 1.35, 7.25, 0.96, 1.18, 10, 0.1);
  const lantern = { x1: 6.8, y1: 3.2, x2: 8.6, y2: 5.5 };
  const lanternCenter = planCenter(lantern);
  box(roofGroup, [1.75, 0.08, 2.2], [lanternCenter[0], 9.27, lanternCenter[1]], palette.bronze, { cast: false });
  addPlanWall(roofGroup, palette, [6.8, 3.2], [8.6, 3.2], 6.42, 2.7, palette.glass, 0.06);
  addPlanWall(roofGroup, palette, [6.8, 5.5], [8.6, 5.5], 6.42, 2.7, palette.glass, 0.06);
  const roofFootprint = { x1: HOUSE_PLAN.footprint.x1 - 0.12, y1: HOUSE_PLAN.footprint.y1 - 0.12, x2: HOUSE_PLAN.footprint.x2 + 0.12, y2: HOUSE_PLAN.footprint.y2 + 0.12 };
  addShallowRoof(roofCapGroup, palette, roofFootprint, 9.32, -0.028);
  addRoofOutline(roofCapGroup, palette, roofFootprint, 9.32);

  const planOverlay = new THREE.Group();
  planOverlay.name = "PLAN_OVERLAY";
  planOverlay.visible = false;
  scene.add(planOverlay);
  const overlayMaterial = new THREE.MeshBasicMaterial({ color: 0xb27854, transparent: true, opacity: 0.35, depthWrite: false });
  const overlayLine = new THREE.LineBasicMaterial({ color: 0x192321, transparent: true, opacity: 0.75 });
  const overlaySite = { x1: 0, y1: 0, x2: HOUSE_PLAN.site.width, y2: HOUSE_PLAN.site.depth };
  planSlab(planOverlay, overlaySite, 9.28, new THREE.MeshBasicMaterial({ color: 0xe9e6dd, transparent: true, opacity: 0.32, depthWrite: false }));
  const overlayFootprint = HOUSE_PLAN.footprint;
  addPlanWall(planOverlay, palette, [overlayFootprint.x1, overlayFootprint.y1], [overlayFootprint.x2, overlayFootprint.y1], 9.34, 0.025, overlayLine, 0.015);
  addPlanWall(planOverlay, palette, [overlayFootprint.x2, overlayFootprint.y1], [overlayFootprint.x2, overlayFootprint.y2], 9.34, 0.025, overlayLine, 0.015);
  addPlanWall(planOverlay, palette, [overlayFootprint.x2, overlayFootprint.y2], [overlayFootprint.x1, overlayFootprint.y2], 9.34, 0.025, overlayLine, 0.015);
  addPlanWall(planOverlay, palette, [overlayFootprint.x1, overlayFootprint.y2], [overlayFootprint.x1, overlayFootprint.y1], 9.34, 0.025, overlayLine, 0.015);
  [HOUSE_PLAN.rooms.one, HOUSE_PLAN.rooms.two, HOUSE_PLAN.rooms.half].forEach((rooms) => rooms.forEach((room) => {
    const material = room.key === "courtyard" ? overlayMaterial : overlayLine;
    addPlanWall(planOverlay, palette, [room.x1, room.y1], [room.x2, room.y1], 9.34, 0.018, material, 0.012);
    addPlanWall(planOverlay, palette, [room.x2, room.y1], [room.x2, room.y2], 9.34, 0.018, material, 0.012);
    addPlanWall(planOverlay, palette, [room.x2, room.y2], [room.x1, room.y2], 9.34, 0.018, material, 0.012);
    addPlanWall(planOverlay, palette, [room.x1, room.y2], [room.x1, room.y1], 9.34, 0.018, material, 0.012);
  }));
  addPlanWall(planOverlay, palette, [HOUSE_PLAN.void2f.x1, HOUSE_PLAN.void2f.y1], [HOUSE_PLAN.void2f.x2, HOUSE_PLAN.void2f.y1], 9.38, 0.025, overlayMaterial, 0.025);
  addPlanWall(planOverlay, palette, [HOUSE_PLAN.void2f.x2, HOUSE_PLAN.void2f.y1], [HOUSE_PLAN.void2f.x2, HOUSE_PLAN.void2f.y2], 9.38, 0.025, overlayMaterial, 0.025);
  addPlanWall(planOverlay, palette, [HOUSE_PLAN.void2f.x2, HOUSE_PLAN.void2f.y2], [HOUSE_PLAN.void2f.x1, HOUSE_PLAN.void2f.y2], 9.38, 0.025, overlayMaterial, 0.025);
  addPlanWall(planOverlay, palette, [HOUSE_PLAN.void2f.x1, HOUSE_PLAN.void2f.y2], [HOUSE_PLAN.void2f.x1, HOUSE_PLAN.void2f.y1], 9.38, 0.025, overlayMaterial, 0.025);

  const twoPlan = HOUSE_PLAN.furniture.two;
  const sofaPlan = twoPlan.find((item) => item.kind === "sofa")!;
  const diningPlan = twoPlan.find((item) => item.kind === "dining")!;
  const islandPlan = twoPlan.find((item) => item.kind === "island")!;
  const [sofaX, sofaZ] = planCenter(sofaPlan);
  const [diningX, diningZ] = planCenter(diningPlan);
  const [islandX, islandZ] = planCenter(islandPlan);
  addSofa(furnitureGroup, palette, sofaX, 3.42, sofaZ);
  addDiningSet(furnitureGroup, palette, diningX, 3.42, diningZ);
  addKitchen(furnitureGroup, palette, islandX, 3.42, islandZ);
  addPendant(furnitureGroup, palette, diningX - 0.55, 5.05, diningZ);
  addPendant(furnitureGroup, palette, diningX + 0.55, 5.05, diningZ);
  addPendant(furnitureGroup, palette, islandX, 5.05, islandZ);
  const [stairX, stairZ] = planCenter(HOUSE_PLAN.stairCore);
  addStair(furnitureGroup, palette, stairX, 3.38, stairZ - 0.72);
  addPlanWall(furnitureGroup, palette, [6.8, 3.2], [9.9, 3.2], 3.3, 0.74, palette.bronze, 0.06);
  const deskPlan = HOUSE_PLAN.furniture.one.find((item) => item.kind === "desk")!;
  const [deskX, deskZ] = planCenter(deskPlan);
  box(groundFurnitureGroup, [deskPlan.x2 - deskPlan.x1, 0.12, deskPlan.y2 - deskPlan.y1], [deskX, 1.18, deskZ], palette.woodLight, { rounded: 0.06 });
  const shelfPlan = HOUSE_PLAN.furniture.one.find((item) => item.kind === "shelf")!;
  const [shelfX, shelfZ] = planCenter(shelfPlan);
  box(groundFurnitureGroup, [shelfPlan.x2 - shelfPlan.x1, 1.55, shelfPlan.y2 - shelfPlan.y1], [shelfX, 0.98, shelfZ], palette.wood, { cast: false });
  const washPlan = HOUSE_PLAN.furniture.one.find((item) => item.kind === "washer")!;
  const [washX, washZ] = planCenter(washPlan);
  box(groundFurnitureGroup, [washPlan.x2 - washPlan.x1, 0.92, washPlan.y2 - washPlan.y1], [washX, 0.66, washZ], palette.black, { rounded: 0.03 });
  const tubPlan = HOUSE_PLAN.furniture.one.find((item) => item.kind === "tub")!;
  const [tubX, tubZ] = planCenter(tubPlan);
  box(groundFurnitureGroup, [tubPlan.x2 - tubPlan.x1, 0.48, tubPlan.y2 - tubPlan.y1], [tubX, 0.46, tubZ], palette.water, { rounded: 0.09 });
  const [carX] = planCenter(garage);
  const [carOneX, carOneZ] = planCenter({ x1: garage.x1, y1: 3.0, x2: garage.x2, y2: 3.9 });
  const [, carTwoZ] = planCenter({ x1: garage.x1, y1: 6.1, x2: garage.x2, y2: 7.0 });
  addCar(groundFurnitureGroup, palette, carOneX, carOneZ);
  addCar(groundFurnitureGroup, palette, carX, carTwoZ);
  const halfBeds = HOUSE_PLAN.furniture.half.filter((item) => item.kind === "bed");
  halfBeds.forEach((bed, index) => {
    const [bedX, bedZ] = planCenter(bed);
    addBed(upperFurnitureGroup, palette, bedX, 6.42, bedZ, index === 0 ? 2.05 : 1.55, index === 0 ? 1.45 : 1.18);
  });
  const addPoint = (position: [number, number, number], color: number, intensity: number, distance: number) => {
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(...position);
    light.castShadow = true;
    warmLights.push(light);
    scene.add(light);
  };
  addPoint([-0.72, 3.85, -2.0], 0xffa45d, 1.3, 5);
  addPoint([-0.8, 2.2, -3.0], 0xff9a55, 0.9, 4);
  addPoint([courtCenter[0], 4.0, courtCenter[1]], 0x9de1ce, 1.2, 7);
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

  const setPlanOverlay = (enabled: boolean) => {
    const existing = scene.getObjectByName("PLAN_OVERLAY");
    if (existing) existing.visible = enabled;
  };

  const modeTargets: Record<ViewMode, { position: THREE.Vector3; target: THREE.Vector3 }> = {
    arrival: { position: v3(17.5, 13.5, 18.5), target: v3(0, 2.25, 0) },
    ground: { position: v3(14.5, 10.8, 15.2), target: v3(0.0, 1.45, 0.0) },
    living: { position: v3(11.2, 8.4, 12.8), target: v3(-0.15, 4.3, 0.3) },
    upper: { position: v3(13.2, 10.6, 13.6), target: v3(0.0, 7.15, 0.25) },
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
    groundGroup.visible = next !== "living" && next !== "upper";
    upperGroup.visible = next !== "ground" && next !== "upper";
    roofGroup.visible = next === "arrival" || next === "upper";
    roofCapGroup.visible = next === "arrival";
    setLdkCutaway(next === "living");
    furnitureGroup.visible = next !== "ground" && next !== "upper";
    groundFurnitureGroup.visible = next !== "living" && next !== "upper";
    upperFurnitureGroup.visible = next === "arrival" || next === "upper";
    siteGroup.visible = true;
    setPlanOverlay(false);
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
    courtWater.position.y = 3.47 + Math.sin(elapsed * 0.65) * 0.008;
    controls.update();
    renderer.render(scene, camera);
    animationFrame = requestAnimationFrame(animate);
  };
  animate();

  return {
    setMode: tweenCamera,
    setNight: toggleNight,
    setAutoRotate: (isAutoRotating: boolean) => { controls.autoRotate = isAutoRotating; },
    setPlanOverlay,
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
  { id: "upper", label: "2.5F", number: "04" },
];

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>("arrival");
  const [isNight, setIsNight] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showPlan, setShowPlan] = useState(false);

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
    setShowPlan(false);
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

  const changePlan = () => {
    const next = !showPlan;
    setShowPlan(next);
    apiRef.current?.setPlanOverlay(next);
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
          <button className={showPlan ? "view-button active plan-button" : "view-button plan-button"} onClick={changePlan}>
            <span>⌗</span>PLAN
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
