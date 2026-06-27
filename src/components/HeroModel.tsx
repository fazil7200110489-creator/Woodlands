"use client";

import { Suspense, useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, useTexture, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ModelErrorBoundary } from "./3d/ModelErrorBoundary";

/** Subtle smoke particles drifting upwards from the hot burner bed */
function SmokeParticles({ count = 20 }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useRef<Array<{
    speedY: number;
    speedX: number;
    speedZ: number;
    initialY: number;
    resetAtY: number;
    horizontalRange: number;
  }>>([]);

  useEffect(() => {
    particles.current = Array.from({ length: count }).map(() => ({
      speedY: 0.5 + Math.random() * 0.6,
      speedX: (Math.random() - 0.5) * 0.12,
      speedZ: (Math.random() - 0.5) * 0.12,
      initialY: -1.35 - Math.random() * 0.4,
      resetAtY: 1.2 + Math.random() * 0.4,
      horizontalRange: 0.2 + Math.random() * 0.2,
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    particles.current.forEach((p, idx) => {
      const mesh = groupRef.current?.children[idx] as THREE.Mesh;
      if (!mesh) return;

      mesh.position.y += p.speedY * delta;
      mesh.position.x = Math.sin(time * 1.5 + idx) * p.horizontalRange + p.speedX * (mesh.position.y + 1.35);
      mesh.position.z = Math.cos(time * 1.1 + idx) * p.horizontalRange * 0.4 + p.speedZ * (mesh.position.y + 1.35);

      const lifeRange = p.resetAtY - p.initialY;
      const currentLife = mesh.position.y - p.initialY;
      const pct = THREE.MathUtils.clamp(currentLife / lifeRange, 0, 1);

      let opacity = 0;
      if (pct < 0.15) {
        opacity = (pct / 0.15) * 0.08;
      } else {
        opacity = (1 - pct) * 0.08;
      }

      // Smoke diffuses (scales up) as it rises
      const scale = 0.2 + pct * 0.75;
      mesh.scale.setScalar(scale);

      if (mesh.material) {
        (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      }

      if (mesh.position.y >= p.resetAtY) {
        mesh.position.y = p.initialY;
        mesh.position.x = 0;
        mesh.position.z = 0;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, idx) => (
        <mesh key={idx} position={[0, -1.35, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial
            color="#e8dfd5"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Ember/spark particles rising rapidly from the charcoal bed */
function EmberParticles({ count = 25 }) {
  const groupRef = useRef<THREE.Group>(null);
  const embers = useRef<Array<{
    speedY: number;
    speedX: number;
    speedZ: number;
    initialY: number;
    resetAtY: number;
    swaySpeed: number;
  }>>([]);

  useEffect(() => {
    embers.current = Array.from({ length: count }).map(() => ({
      speedY: 1.2 + Math.random() * 1.8,
      speedX: (Math.random() - 0.5) * 0.3,
      speedZ: (Math.random() - 0.5) * 0.3,
      initialY: -1.4,
      resetAtY: 0.8 + Math.random() * 0.7,
      swaySpeed: 3.0 + Math.random() * 4.0,
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    embers.current.forEach((emb, idx) => {
      const mesh = groupRef.current?.children[idx] as THREE.Mesh;
      if (!mesh) return;

      mesh.position.y += emb.speedY * delta;
      mesh.position.x += (emb.speedX + Math.sin(time * emb.swaySpeed + idx) * 0.25) * delta;
      mesh.position.z += (emb.speedZ + Math.cos(time * emb.swaySpeed * 0.8 + idx) * 0.25) * delta;

      const pct = THREE.MathUtils.clamp((mesh.position.y - emb.initialY) / (emb.resetAtY - emb.initialY), 0, 1);
      
      // Embers shrink to nothing near the top
      const scale = Math.max(0, 0.035 * (1.0 - pct));
      mesh.scale.setScalar(scale);

      if (mesh.position.y >= emb.resetAtY) {
        mesh.position.y = emb.initialY;
        mesh.position.x = -1.6 + Math.random() * 3.2;
        mesh.position.z = -0.4 + Math.random() * 0.8;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, idx) => (
        <mesh key={idx} position={[-1.6 + Math.random() * 3.2, -1.4, -0.4 + Math.random() * 0.8]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color="#ffbb22"
            transparent
            opacity={0.85}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Volumetric, animated shader-based flames */
function FlameBillboard({ position, scale = [1, 1, 1], id = 0 }: { position: [number, number, number]; scale?: [number, number, number]; id?: number }) {
  const meshRef1 = useRef<THREE.Mesh>(null);
  const meshRef2 = useRef<THREE.Mesh>(null);
  
  const uniforms = useRef({
    uTime: { value: 0 },
    uColorRed: { value: new THREE.Color("#ff1800") },
    uColorOrange: { value: new THREE.Color("#ff6200") },
    uColorYellow: { value: id % 2 === 0 ? new THREE.Color("#ffa500") : new THREE.Color("#ffe044") },
    uSeed: { value: Math.random() * 123.45 },
  });

  useFrame((state) => {
    uniforms.current.uTime.value = state.clock.getElapsedTime();
  });

  const vertexShader = `
    uniform float uTime;
    uniform float uSeed;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      // organic wave wiggle
      float phase = uTime * 6.5 + uSeed + pos.y * 4.0;
      float wiggle = sin(phase) * 0.15 * pos.y;
      pos.x += wiggle;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uSeed;
    uniform vec3 uColorRed;
    uniform vec3 uColorOrange;
    uniform vec3 uColorYellow;
    varying vec2 vUv;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float smoothNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 3; ++i) {
        v += a * smoothNoise(p);
        p = p * 2.0 + vec2(50.0);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      
      // vertical flow
      vec2 noiseUv = uv * vec2(2.4, 1.5) - vec2(0.0, uTime * 2.8 + uSeed * 0.15);
      
      // teardrop mask shape
      float distToCenter = abs(uv.x - 0.5);
      float shape = smoothstep(0.5, 0.04, distToCenter) * (1.0 - uv.y);
      
      float n = fbm(noiseUv);
      float fire = shape * (n * 2.2);

      vec3 finalColor = mix(uColorRed, uColorOrange, uv.y * 0.7);
      finalColor = mix(finalColor, uColorYellow, fire * 0.85);
      
      float alpha = smoothstep(0.04, 0.25, fire);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return (
    <group position={position} scale={scale}>
      <mesh ref={meshRef1} castShadow={false} receiveShadow={false}>
        <planeGeometry args={[0.6, 1.0]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms.current}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={meshRef2} rotation={[0, Math.PI / 2, 0]} castShadow={false} receiveShadow={false}>
        <planeGeometry args={[0.6, 1.0]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms.current}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Glowing charcoal bed of random chunks */
function CharcoalBed({ coalMaterial }: { coalMaterial: THREE.MeshStandardMaterial }) {
  const charcoals = useMemo(() => {
    const list = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 8; j++) {
        const x = -1.6 + i * 0.8 + (Math.random() - 0.5) * 0.28;
        const z = -0.45 + j * 0.13 + (Math.random() - 0.5) * 0.04;
        const y = -1.46 + (Math.random() - 0.5) * 0.03;
        const scale: [number, number, number] = [
          0.12 + Math.random() * 0.06,
          0.07 + Math.random() * 0.04,
          0.12 + Math.random() * 0.06
        ];
        const rotation: [number, number, number] = [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ];
        list.push({ x, y, z, scale, rotation });
      }
    }
    return list;
  }, []);

  return (
    <group>
      {charcoals.map((coal, idx) => (
        <mesh
          key={idx}
          position={[coal.x, coal.y, coal.z]}
          scale={coal.scale}
          rotation={coal.rotation}
          material={coalMaterial}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  );
}

interface GrillHousingProps {
  steelMaterial: THREE.MeshPhysicalMaterial;
  darkSteelMaterial: THREE.MeshStandardMaterial;
  glassMaterial: THREE.MeshPhysicalMaterial;
  brassMaterial: THREE.MeshStandardMaterial;
}

/** Structured stainless steel rotisserie enclosure with mechanical and visual details */
function GrillHousing({ steelMaterial, darkSteelMaterial, glassMaterial, brassMaterial }: GrillHousingProps) {
  const ribs = useMemo(() => [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8], []);
  const ventSlots = useMemo(() => [-1.2, -0.6, 0, 0.6, 1.2], []);

  return (
    <group>
      {/* ── Outer Shell ── */}
      {/* Backplate */}
      <mesh position={[0, 0, -1.4]} material={steelMaterial} castShadow receiveShadow>
        <boxGeometry args={[4.4, 3.2, 0.08]} />
      </mesh>
      
      {/* Back Wall Vertical Ribs (Reflectors) */}
      {ribs.map((xVal, idx) => (
        <mesh key={idx} position={[xVal, 0, -1.35]} material={steelMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[0.016, 0.016, 3.1, 8]} />
        </mesh>
      ))}

      {/* Left Wall */}
      <mesh position={[-2.15, 0, -0.6]} material={steelMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.08, 3.2, 1.6]} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[2.15, 0, -0.6]} material={steelMaterial} castShadow receiveShadow>
        <boxGeometry args={[0.08, 3.2, 1.6]} />
      </mesh>

      {/* Top Hood */}
      <mesh position={[0, 1.56, -0.6]} material={steelMaterial} castShadow receiveShadow>
        <boxGeometry args={[4.38, 0.08, 1.6]} />
      </mesh>
      
      {/* Vent Slots (Cutouts on top) */}
      {ventSlots.map((xVal, idx) => (
        <mesh key={idx} position={[xVal, 1.605, -0.6]} material={darkSteelMaterial}>
          <boxGeometry args={[0.26, 0.01, 0.04]} />
        </mesh>
      ))}

      {/* Bottom Base */}
      <mesh position={[0, -1.56, -0.6]} material={steelMaterial} castShadow receiveShadow>
        <boxGeometry args={[4.38, 0.12, 1.6]} />
      </mesh>

      {/* ── Volumetric Front Corner Trim ── */}
      <mesh position={[-2.15, 0, 0.2]} material={steelMaterial} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 3.2, 16]} />
      </mesh>
      <mesh position={[2.15, 0, 0.2]} material={steelMaterial} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 3.2, 16]} />
      </mesh>

      {/* ── Collection Tray (Drip Pan) ── */}
      <group position={[0, 0.02, 0]}>
        {/* Tray base */}
        <mesh position={[0, -1.5, 0]} material={darkSteelMaterial} receiveShadow>
          <boxGeometry args={[3.4, 0.02, 1.1]} />
        </mesh>
        {/* Lips */}
        <mesh position={[0, -1.46, 0.55]} material={darkSteelMaterial} castShadow>
          <boxGeometry args={[3.4, 0.08, 0.02]} />
        </mesh>
        <mesh position={[0, -1.46, -0.55]} material={darkSteelMaterial}>
          <boxGeometry args={[3.4, 0.08, 0.02]} />
        </mesh>
        <mesh position={[-1.7, -1.46, 0]} material={darkSteelMaterial} castShadow>
          <boxGeometry args={[0.02, 0.08, 1.1]} />
        </mesh>
        <mesh position={[1.7, -1.46, 0]} material={darkSteelMaterial} castShadow>
          <boxGeometry args={[0.02, 0.08, 1.1]} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, -1.46, 0.57]} material={brassMaterial} castShadow>
          <boxGeometry args={[0.3, 0.02, 0.02]} />
        </mesh>
      </group>

      {/* ── Motor & Controls Housing ── */}
      <group position={[-2.32, 0, 0]}>
        <mesh material={darkSteelMaterial} castShadow>
          <boxGeometry args={[0.3, 1.2, 0.7]} />
        </mesh>
        {/* Knobs */}
        <mesh position={[-0.16, 0.3, 0.15]} rotation={[0, 0, Math.PI / 2]} material={steelMaterial} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
        </mesh>
        <mesh position={[-0.16, 0.0, 0.15]} rotation={[0, 0, Math.PI / 2]} material={steelMaterial} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
        </mesh>
        <mesh position={[-0.16, -0.3, 0.15]} rotation={[0, 0, Math.PI / 2]} material={steelMaterial} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
        </mesh>
        {/* Power switch */}
        <mesh position={[-0.16, -0.5, 0.15]} rotation={[0, 0, Math.PI / 2]} material={brassMaterial} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.05, 8]} />
        </mesh>
        {/* Red LED (Power) */}
        <mesh position={[-0.16, 0.3, -0.15]} castShadow>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2.0} />
        </mesh>
        {/* Green LED (Motor) */}
        <mesh position={[-0.16, 0.0, -0.15]} castShadow>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2.0} />
        </mesh>
        {/* Soft light cast from green indicator */}
        <pointLight position={[-0.2, 0, -0.2]} intensity={0.15} distance={0.5} color="#00ff00" />
      </group>

      {/* ── Spit Support Brackets ── */}
      <mesh position={[-2.1, 0, 0]} material={steelMaterial} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
      </mesh>
      <mesh position={[2.1, 0, 0]} material={steelMaterial} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.12]} />
      </mesh>

      {/* ── Front Glass Door ── */}
      <group>
        {/* Glass Sheet */}
        <mesh position={[0, 0, 0.25]} material={glassMaterial} receiveShadow>
          <planeGeometry args={[4.0, 2.9]} />
        </mesh>
        {/* Metal door frame */}
        <mesh position={[0, 1.5, 0.25]} material={steelMaterial} castShadow>
          <boxGeometry args={[4.26, 0.08, 0.03]} />
        </mesh>
        <mesh position={[0, -1.5, 0.25]} material={steelMaterial} castShadow>
          <boxGeometry args={[4.26, 0.08, 0.03]} />
        </mesh>
        <mesh position={[-2.1, 0, 0.25]} material={steelMaterial} castShadow>
          <boxGeometry args={[0.08, 2.92, 0.03]} />
        </mesh>
        <mesh position={[2.1, 0, 0.25]} material={steelMaterial} castShadow>
          <boxGeometry args={[0.08, 2.92, 0.03]} />
        </mesh>
        
        {/* Handles */}
        <group position={[1.88, 0, 0.32]}>
          <mesh material={brassMaterial} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.3, 16]} />
          </mesh>
          <mesh position={[0, 0.5, -0.04]} rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
          </mesh>
          <mesh position={[0, -0.5, -0.04]} rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.08, 8]} />
          </mesh>
        </group>

        {/* Hinges */}
        <mesh position={[-2.1, 1.1, 0.27]} material={brassMaterial} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.12, 12]} />
        </mesh>
        <mesh position={[-2.1, -1.1, 0.27]} material={brassMaterial} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.12, 12]} />
        </mesh>
      </group>
    </group>
  );
}

interface SpitAssemblyProps {
  yPos: number;
  rotationOffset?: number;
  steelMaterial: THREE.MeshPhysicalMaterial;
  brassMaterial: THREE.MeshStandardMaterial;
  chickenScene?: THREE.Group | null;
  texture?: THREE.Texture;
}

/** Rotating assembly including spit rod, locking collars, clamping prongs, and rotisserie plates */
function SpitAssembly({
  yPos,
  rotationOffset = 0,
  steelMaterial,
  brassMaterial,
  chickenScene,
  texture,
}: SpitAssemblyProps) {
  const spitRef = useRef<THREE.Group>(null);

  // Set initial rotation offset
  useEffect(() => {
    if (spitRef.current) {
      spitRef.current.rotation.z = rotationOffset;
    }
  }, [rotationOffset]);

  useFrame((state, delta) => {
    if (spitRef.current) {
      spitRef.current.rotation.z -= delta * 0.45;
    }
  });

  return (
    <group position={[0, yPos, 0]}>
      {/* Central Spit Rod */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 4.3, 16]} />
      </mesh>

      {/* End Plates */}
      <mesh position={[0, 0, -1.62]} rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.04, 32]} />
      </mesh>
      <mesh position={[0, 0, 1.62]} rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
        <cylinderGeometry args={[1.05, 1.05, 0.04, 32]} />
      </mesh>

      {/* Left Skewer Fork */}
      <group position={[0, 0, -0.92]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.15, 16]} />
        </mesh>
        <mesh position={[0, 0.09, 0]} material={brassMaterial} castShadow>
          <boxGeometry args={[0.03, 0.05, 0.03]} />
        </mesh>
        {[-0.2, 0.2].map((xOffset) => (
          <group key={xOffset} position={[xOffset, 0, 0.15]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
              <cylinderGeometry args={[0.014, 0.014, 0.3, 8]} />
            </mesh>
            <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
              <coneGeometry args={[0.014, 0.04, 8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Right Skewer Fork */}
      <group position={[0, 0, 0.92]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
          <cylinderGeometry args={[0.075, 0.075, 0.15, 16]} />
        </mesh>
        <mesh position={[0, 0.09, 0]} material={brassMaterial} castShadow>
          <boxGeometry args={[0.03, 0.05, 0.03]} />
        </mesh>
        {[-0.2, 0.2].map((xOffset) => (
          <group key={xOffset} position={[xOffset, 0, -0.15]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
              <cylinderGeometry args={[0.014, 0.014, 0.3, 8]} />
            </mesh>
            <mesh position={[0, 0, -0.15]} rotation={[-Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
              <coneGeometry args={[0.014, 0.04, 8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* End support spindles */}
      <mesh position={[0, 0, -1.78]} rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
      </mesh>
      <mesh position={[0, 0, 1.78]} rotation={[Math.PI / 2, 0, 0]} material={steelMaterial} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
      </mesh>

      {/* Rotating chicken or cylinder content */}
      <group>
        {chickenScene ? (
          <primitive object={chickenScene} />
        ) : texture ? (
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.0, 1.0, 3.2, 64, 1, true]} />
            <meshStandardMaterial map={texture} roughness={0.4} metalness={0.1} transparent={false} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
}

interface SingleGrillProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  steelMaterial: THREE.MeshPhysicalMaterial;
  darkSteelMaterial: THREE.MeshStandardMaterial;
  glassMaterial: THREE.MeshPhysicalMaterial;
  brassMaterial: THREE.MeshStandardMaterial;
  coalMaterial: THREE.MeshStandardMaterial;
  chickenScene?: THREE.Group | null;
  texture?: THREE.Texture;
  rotationOffset?: number;
}

/** Complete functional rotisserie grill oven unit */
function SingleGrill({
  position,
  rotation = [0, 0, 0],
  scale = 1.0,
  steelMaterial,
  darkSteelMaterial,
  glassMaterial,
  brassMaterial,
  coalMaterial,
  chickenScene,
  texture,
  rotationOffset = 0,
}: SingleGrillProps) {
  const fireLightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (fireLightRef.current) {
      const elapsed = state.clock.getElapsedTime();
      fireLightRef.current.intensity =
        2.2 + Math.sin(elapsed * 14) * 0.55 + Math.cos(elapsed * 6) * 0.25 + Math.random() * 0.15;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Enclosure cabinet structure */}
      <GrillHousing
        steelMaterial={steelMaterial}
        darkSteelMaterial={darkSteelMaterial}
        glassMaterial={glassMaterial}
        brassMaterial={brassMaterial}
      />

      {/* Glowing Coals */}
      <CharcoalBed coalMaterial={coalMaterial} />

      {/* Volumetric Flame Shaders */}
      <FlameBillboard position={[-1.3, -1.05, 0.1]} id={0} />
      <FlameBillboard position={[-0.6, -1.05, -0.15]} id={1} />
      <FlameBillboard position={[0.0, -1.05, 0.2]} id={2} />
      <FlameBillboard position={[0.6, -1.05, -0.1]} id={3} />
      <FlameBillboard position={[1.3, -1.05, 0.05]} id={4} />

      {/* Embers/Sparks particles */}
      <EmberParticles count={25} />

      {/* Smoke particles */}
      <SmokeParticles count={15} />

      {/* Rotating Spit and Chicken */}
      <group rotation={[0, Math.PI / 2, 0]}>
        <SpitAssembly
          yPos={0.0}
          rotationOffset={rotationOffset}
          steelMaterial={steelMaterial}
          brassMaterial={brassMaterial}
          chickenScene={chickenScene}
          texture={texture}
        />
      </group>

      {/* Dynamic warm fire point light */}
      <pointLight
        ref={fireLightRef}
        position={[0, -1.2, 0.25]}
        distance={6.5}
        intensity={2.2}
        color="#ff5500"
        castShadow
      />

      {/* Halogen ceiling light */}
      <group>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        <mesh position={[0, 1.47, 0]}>
          <sphereGeometry args={[0.06, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#ffffd5" />
        </mesh>
        <pointLight
          position={[0, 1.35, 0]}
          intensity={1.8}
          distance={4.5}
          color="#ffe9b5"
          castShadow
        />
      </group>
    </group>
  );
}

/** High fidelity model loaded version with 3 grills side-by-side */
function RotisserieChicken() {
  const { scene } = useGLTF("/models/roast_chicken.glb");

  // Materials definition to share across meshes
  const steelMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#dedede"),
    metalness: 0.95,
    roughness: 0.16,
    clearcoat: 0.7,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.6,
  }), []);

  const darkSteelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#202020"),
    metalness: 0.85,
    roughness: 0.35,
  }), []);

  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    transparent: true,
    opacity: 0.15,
    roughness: 0.04,
    metalness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    thickness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
  }), []);

  const brassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#bf976a"),
    metalness: 0.92,
    roughness: 0.15,
  }), []);

  const coalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#161616"),
    roughness: 0.95,
    metalness: 0.05,
    emissive: new THREE.Color("#ff2200"),
    emissiveIntensity: 2.0,
  }), []);

  // Update materials, center original chicken scene, and clone 3 instances for the spits
  const clones = useMemo(() => {
    if (!scene) return [];

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        if (mesh.material) {
          const mat = mesh.material as any;
          mat.roughness = 0.23;
          mat.metalness = 0.05;
          mat.clearcoat = 1.0;
          mat.clearcoatRoughness = 0.22;
          mat.envMapIntensity = 2.2;
          
          mat.emissive = new THREE.Color("#4a1a00");
          mat.emissiveIntensity = 0.3;
        }
      }
    });

    scene.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    if (!isNaN(center.x) && !isNaN(center.y) && !isNaN(center.z)) {
      scene.position.set(-center.x, -center.y, -center.z);
    }

    const c1 = scene.clone();
    const c2 = scene.clone();
    const c3 = scene.clone();

    // Scale wrapper groups
    const w1 = new THREE.Group();
    w1.scale.setScalar(1.12);
    w1.add(c1);

    const w2 = new THREE.Group();
    w2.scale.setScalar(1.12);
    w2.add(c2);

    const w3 = new THREE.Group();
    w3.scale.setScalar(1.12);
    w3.add(c3);

    return [w1, w2, w3];
  }, [scene]);

  useFrame((state) => {
    // Slow burning ember flicker
    const elapsed = state.clock.getElapsedTime();
    const coalFlicker = 1.0 + Math.sin(elapsed * 5.5) * 0.2 + Math.cos(elapsed * 11) * 0.15;
    coalMaterial.emissiveIntensity = Math.max(0.6, coalFlicker * 2.2);
  });

  return (
    <Float speed={1.0} rotationIntensity={0.05} floatIntensity={0.15}>
      <group scale={1.25} position={[0, 0.08, 0]}>
        
        {/* Render 3 grills in curved bay row configuration */}
        {clones.length === 3 && (
          <group>
            {/* Left Grill */}
            <SingleGrill
              position={[-4.2, 0, -0.8]}
              rotation={[0, 0.3, 0]}
              steelMaterial={steelMaterial}
              darkSteelMaterial={darkSteelMaterial}
              glassMaterial={glassMaterial}
              brassMaterial={brassMaterial}
              coalMaterial={coalMaterial}
              chickenScene={clones[0]}
              rotationOffset={0}
            />

            {/* Middle Grill */}
            <SingleGrill
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              steelMaterial={steelMaterial}
              darkSteelMaterial={darkSteelMaterial}
              glassMaterial={glassMaterial}
              brassMaterial={brassMaterial}
              coalMaterial={coalMaterial}
              chickenScene={clones[1]}
              rotationOffset={Math.PI * 0.67}
            />

            {/* Right Grill */}
            <SingleGrill
              position={[4.2, 0, -0.8]}
              rotation={[0, -0.3, 0]}
              steelMaterial={steelMaterial}
              darkSteelMaterial={darkSteelMaterial}
              glassMaterial={glassMaterial}
              brassMaterial={brassMaterial}
              coalMaterial={coalMaterial}
              chickenScene={clones[2]}
              rotationOffset={Math.PI * 1.33}
            />
          </group>
        )}

      </group>
    </Float>
  );
}

/** Fallback cylinder version with 3 grills side-by-side */
function OriginalRotisserie() {
  const texture = useTexture("/images/hero-grill.png");

  const steelMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#dedede"),
    metalness: 0.95,
    roughness: 0.16,
    clearcoat: 0.7,
    clearcoatRoughness: 0.15,
    envMapIntensity: 1.6,
  }), []);

  const darkSteelMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#202020"),
    metalness: 0.85,
    roughness: 0.35,
  }), []);

  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    transparent: true,
    opacity: 0.15,
    roughness: 0.04,
    metalness: 0.05,
    transmission: 0.95,
    ior: 1.5,
    thickness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
  }), []);

  const brassMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#bf976a"),
    metalness: 0.92,
    roughness: 0.15,
  }), []);

  const coalMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#161616"),
    roughness: 0.95,
    metalness: 0.05,
    emissive: new THREE.Color("#ff2200"),
    emissiveIntensity: 2.0,
  }), []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const coalFlicker = 1.0 + Math.sin(elapsed * 5.5) * 0.2 + Math.cos(elapsed * 11) * 0.15;
    coalMaterial.emissiveIntensity = Math.max(0.6, coalFlicker * 2.2);
  });

  return (
    <Float speed={1.0} rotationIntensity={0.05} floatIntensity={0.15}>
      <group scale={1.25} position={[0, 0.08, 0]}>
        
        {/* Render 3 grills in curved bay row configuration */}
        <group>
          {/* Left Grill */}
          <SingleGrill
            position={[-4.2, 0, -0.8]}
            rotation={[0, 0.3, 0]}
            steelMaterial={steelMaterial}
            darkSteelMaterial={darkSteelMaterial}
            glassMaterial={glassMaterial}
            brassMaterial={brassMaterial}
            coalMaterial={coalMaterial}
            texture={texture}
            rotationOffset={0}
          />

          {/* Middle Grill */}
          <SingleGrill
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            steelMaterial={steelMaterial}
            darkSteelMaterial={darkSteelMaterial}
            glassMaterial={glassMaterial}
            brassMaterial={brassMaterial}
            coalMaterial={coalMaterial}
            texture={texture}
            rotationOffset={Math.PI * 0.67}
          />

          {/* Right Grill */}
          <SingleGrill
            position={[4.2, 0, -0.8]}
            rotation={[0, -0.3, 0]}
            steelMaterial={steelMaterial}
            darkSteelMaterial={darkSteelMaterial}
            glassMaterial={glassMaterial}
            brassMaterial={brassMaterial}
            coalMaterial={coalMaterial}
            texture={texture}
            rotationOffset={Math.PI * 1.33}
          />
        </group>

      </group>
    </Float>
  );
}

// Pre-load assets
try {
  useTexture.preload("/images/hero-grill.png");
  useGLTF.preload("/models/roast_chicken.glb");
} catch {
  /* silent */
}

export default function HeroModel() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 5.5], fov: 42 }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%", display: "block" }}
      shadows
    >
      <Suspense fallback={null}>
        {/* Ambient lighting */}
        <ambientLight intensity={0.9} color="#fff1e0" />

        {/* Dynamic spotlights highlighting the rotisserie metal and chicken */}
        <directionalLight
          position={[5, 4, 3]}
          intensity={2.2}
          color="#ffe4b5"
          castShadow
        />
        <directionalLight
          position={[-5, 2, -3]}
          intensity={0.7}
          color="#d4c5b0"
        />

        {/* Premium Warm Orange Key Light for golden grilled texture */}
        <directionalLight
          position={[3, -2, 4]}
          intensity={1.4}
          color="#ff7a00"
          castShadow
        />

        {/* Soft rim light */}
        <directionalLight
          position={[0, 5, -4]}
          intensity={0.8}
          color="#ffd2a1"
        />

        {/* Warm sunset environment for realism and soft PBR reflections */}
        <Environment preset="sunset" environmentIntensity={0.9} />

        {/* Soft shadow */}
        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.32}
          scale={8}
          blur={2.2}
          far={3.0}
          color="#2e1403"
        />

        <ModelErrorBoundary fallback={<OriginalRotisserie />}>
          <RotisserieChicken />
        </ModelErrorBoundary>
      </Suspense>
    </Canvas>
  );
}
