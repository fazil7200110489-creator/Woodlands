"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";

import { CameraRig } from "./CameraRig";
import { ScrollManager } from "./ScrollManager";
import { ShowcaseItem } from "./ShowcaseItem";
import { ModelFallback } from "./ModelFallback";
import { ModelErrorBoundary } from "./ModelErrorBoundary";

/**
 * Fallback component shown during loading or if model fails
 */
function SceneLoadingFallback() {
  return null; // Silent loading state to avoid layout shift
}

export function Scene() {
  const cameraRigRef = useRef<THREE.Group>(null);
  const showcaseRef = useRef<THREE.Group>(null);

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] h-screen w-screen">
      <Canvas
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
        }}
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 45 }}
      >
        <Suspense fallback={<SceneLoadingFallback />}>
          <CameraRig ref={cameraRigRef} />

          {/* Neutral soft lighting that complements cream backgrounds */}
          <ambientLight intensity={2.5} color="#fff8f0" />
          <directionalLight
            position={[4, 6, 4]}
            intensity={2}
            color="#ffe4b5"
            castShadow
          />
          <directionalLight
            position={[-4, 2, -2]}
            intensity={0.6}
            color="#d4c5b0"
          />

          {/* Warm apartment environment for natural PBR reflections */}
          <Environment preset="apartment" environmentIntensity={0.8} />

          {/* Soft contact shadow on an invisible floor plane */}
          <ContactShadows
            position={[0, -1.8, 0]}
            opacity={0.18}
            scale={10}
            blur={2.5}
            far={3}
            color="#8B6914"
          />

          {/* The single food showcase object with error boundary */}
          <ModelErrorBoundary fallback={<ModelFallback ref={showcaseRef} />}>
            <ShowcaseItem ref={showcaseRef} />
          </ModelErrorBoundary>

          {/* GSAP scroll orchestrator */}
          <ScrollManager
            cameraRigRef={cameraRigRef}
            showcaseRef={showcaseRef}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
