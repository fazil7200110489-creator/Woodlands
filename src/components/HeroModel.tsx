"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, useTexture } from "@react-three/drei";
import { Group, Mesh } from "three";
import { ModelErrorBoundary } from "./3d/ModelErrorBoundary";

/** 3D Rotisserie Chicken Component */
function RotisserieChicken() {
  const texture = useTexture("/images/hero-grill.png");
  const groupRef = useRef<Group>(null);
  const fireLightRef = useRef<any>(null);

  // Animate rotation and flickering firelight
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotate around the horizontal spit axis (Y-axis of local cylinder, which is rotated)
      // Since cylinder is rotated Z by PI/2, local Y-axis corresponds to global X-axis.
      // So rotating local Y will spin it like a spit rod.
      const childMesh = groupRef.current.children[0] as Mesh;
      if (childMesh) {
        childMesh.rotation.y -= delta * 0.45;
      }
    }

    // Flicker firelight
    if (fireLightRef.current) {
      fireLightRef.current.intensity =
        1.5 + Math.sin(state.clock.elapsedTime * 12) * 0.35 + Math.random() * 0.2;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
      <group ref={groupRef} scale={1.2} position={[0, 0.1, 0]}>
        {/* Main Chicken Cylinder (Horizontal) */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.3, 3.4, 64, 1, true]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.4}
            metalness={0.1}
            transparent={false}
          />
        </mesh>

        {/* Metal End Caps (to look like spit plates) */}
        <mesh position={[-1.72, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[1.32, 1.32, 0.08, 32]} />
          <meshStandardMaterial
            color="#a89a80"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[1.72, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[1.32, 1.32, 0.08, 32]} />
          <meshStandardMaterial
            color="#a89a80"
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>

        {/* Spit Rod (Thru the middle, extending out) */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 5.0, 16]} />
          <meshStandardMaterial
            color="#dcdcdc"
            metalness={0.95}
            roughness={0.1}
          />
        </mesh>

        {/* Spit Handles / Screws at ends */}
        <mesh position={[-1.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 16]} />
          <meshStandardMaterial
            color="#8c8c8c"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>
        <mesh position={[1.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 16]} />
          <meshStandardMaterial
            color="#8c8c8c"
            metalness={0.9}
            roughness={0.15}
          />
        </mesh>

        {/* Flickering fire glow point light below the chicken */}
        <pointLight
          ref={fireLightRef}
          position={[0, -2.5, 0.5]}
          distance={8}
          intensity={2.0}
          color="#ff5900"
        />
      </group>
    </Float>
  );
}

// Pre-load the chicken texture
try {
  useTexture.preload("/images/hero-grill.png");
} catch {
  /* silent */
}

/** Fallback if texture fails to load */
function FallbackChicken() {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={ref} scale={1.5}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.7} />
      </mesh>
    </group>
  );
}

export default function HeroModel() {
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 5.5], fov: 42 }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <Suspense fallback={null}>
        {/* Ambient lighting */}
        <ambientLight intensity={1.2} color="#fff1e0" />

        {/* Dynamic spotlights highlighting the rotisserie metal and chicken */}
        <directionalLight
          position={[5, 4, 3]}
          intensity={2.5}
          color="#ffe4b5"
          castShadow
        />
        <directionalLight
          position={[-5, 2, -3]}
          intensity={0.8}
          color="#d4c5b0"
        />

        {/* Warm sunset/apartment lighting environment */}
        <Environment preset="sunset" environmentIntensity={0.8} />

        {/* Soft shadow */}
        <ContactShadows
          position={[0, -1.8, 0]}
          opacity={0.35}
          scale={8}
          blur={2.4}
          far={3.0}
          color="#2e1403"
        />

        <ModelErrorBoundary fallback={<FallbackChicken />}>
          <RotisserieChicken />
        </ModelErrorBoundary>
      </Suspense>
    </Canvas>
  );
}
