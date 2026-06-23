"use client";

import { Group } from "three";
import { forwardRef } from "react";
import { Float } from "@react-three/drei";

/**
 * Fallback placeholder component when model fails to load.
 * Shows a simple geometric shape instead of crashing the app.
 */
export const ModelFallback = forwardRef<Group>((_, ref) => {
  return (
    <group ref={ref}>
      <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.4}>
        <group scale={2.2} position={[0, -0.4, 0]}>
          {/* Fallback box with warm color */}
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[1, 1.2, 0.8]} />
            <meshStandardMaterial
              color="#D4A574"
              metalness={0.3}
              roughness={0.6}
              envMapIntensity={0.5}
            />
          </mesh>

          {/* Accent cylinder */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.35, 0.3, 32]} />
            <meshStandardMaterial
              color="#E8B88A"
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
});

ModelFallback.displayName = "ModelFallback";
