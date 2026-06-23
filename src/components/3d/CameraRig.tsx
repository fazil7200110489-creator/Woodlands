"use client";

import { forwardRef } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { Group } from "three";

export const CameraRig = forwardRef<Group>((_, ref) => {
  return (
    <group ref={ref} name="CameraRig">
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
    </group>
  );
});

CameraRig.displayName = "CameraRig";
