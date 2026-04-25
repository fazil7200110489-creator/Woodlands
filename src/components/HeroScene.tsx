"use client";

import { Canvas } from "@react-three/fiber";
import { Sphere, Float, Environment, MeshDistortMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { Vector2 } from "three";
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

function RenderController({ isInView }: { isInView: boolean }) {
  const { gl } = useThree();

  useEffect(() => {
    if (!isInView) {
      gl.setAnimationLoop(null);
    }
  }, [gl, isInView]);

  return null;
}

export default function HeroScene({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} frameloop="demand">
        <RenderController isInView={active} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#d4a853" />
        <pointLight position={[-10, -5, -5]} intensity={0.5} color="#c9b99a" />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <Sphere args={[1.5, 64, 64]}>
            <MeshDistortMaterial color="#1a1a1a" roughness={0.1} metalness={0.9} distort={0.3} speed={2} />
          </Sphere>
        </Float>

        {Array.from({ length: 5 }).map((_, i) => (
          <Float key={i} speed={1 + i * 0.3} floatIntensity={0.5}>
            <Sphere args={[0.15, 32, 32]} position={[Math.cos(i * 1.26) * 3, Math.sin(i * 1.26) * 1.5, Math.sin(i * 0.8)]}>
              <meshStandardMaterial color="#d4a853" roughness={0.2} metalness={0.8} />
            </Sphere>
          </Float>
        ))}

        <EffectComposer>
          <Bloom luminanceThreshold={0.2} intensity={0.8} />
          <ChromaticAberration offset={new Vector2(0.002, 0.002)} />
        </EffectComposer>

        <Environment preset="night" />
      </Canvas>
    </div>
  );
}
