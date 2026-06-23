"use client";

import { forwardRef, useRef, useState } from "react";
import { Group } from "three";
import { useGLTF, Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ModelFallback } from "./ModelFallback";

// ─── Local model paths ───────────────────────────────────────────────────────
// All models are loaded from the public/models directory
const PRIMARY_MODEL = "/models/burger.glb";
const FALLBACK_MODEL = "/models/fallback.glb";

// ─── Model cache to prevent duplicate loading ───────────────────────────────
const modelCache = new Map<string, any>();

/**
 * Loads a model from a local path with graceful fallback handling.
 * First tries the primary model, then fallback, then renders fallback component.
 */
function loadModelSafely(modelPath: string) {
  try {
    // Check cache first
    if (modelCache.has(modelPath)) {
      return modelCache.get(modelPath);
    }

    const gltf = useGLTF(modelPath);
    modelCache.set(modelPath, gltf);
    return gltf;
  } catch (error) {
    console.warn(
      `[ShowcaseItem] Failed to load model at ${modelPath}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

export const ShowcaseItem = forwardRef<Group>((_, ref) => {
  const innerRef = useRef<Group>(null);
  const [useFallbackComponent, setUseFallbackComponent] = useState(false);

  // Try to load primary model
  let modelData = loadModelSafely(PRIMARY_MODEL);

  // If primary fails, try fallback model
  if (!modelData) {
    modelData = loadModelSafely(FALLBACK_MODEL);
  }

  // If both fail, use fallback component
  if (!modelData) {
    setUseFallbackComponent(true);
  }

  // Slow passive Y-rotation so the model always shows its best side
  useFrame((_, delta) => {
    if (innerRef.current) {
      innerRef.current.rotation.y += delta * 0.35;
    }
  });

  // If using fallback component
  if (useFallbackComponent || !modelData) {
    return <ModelFallback ref={ref} />;
  }

  // Render loaded model
  return (
    <group ref={ref}>
      <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.4}>
        <group ref={innerRef} scale={2.2} position={[0, -0.4, 0]}>
          <primitive object={modelData.scene} />
        </group>
      </Float>
    </group>
  );
});

ShowcaseItem.displayName = "ShowcaseItem";

// Pre-warm local assets
try {
  useGLTF.preload(PRIMARY_MODEL);
} catch {
  console.warn(
    `[ShowcaseItem] Could not preload ${PRIMARY_MODEL}, will fall back to component`
  );
}
