"use client";

import { useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";

interface UseLocalModelOptions {
  modelPath: string;
  fallbackCallback?: () => void;
}

/**
 * Custom hook for safely loading local GLB/GLTF models.
 * Handles missing files gracefully and provides fallback support.
 */
export function useLocalModel({ modelPath, fallbackCallback }: UseLocalModelOptions) {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate that the path is local
  if (modelPath.startsWith("http://") || modelPath.startsWith("https://")) {
    console.warn(
      "[useLocalModel] External URLs are not supported. Use local paths only.",
      modelPath
    );
    if (fallbackCallback) fallbackCallback();
    return { scene: null, error: new Error("External URLs not supported") };
  }

  try {
    // Use Drei's useGLTF hook with local path
    const gltf = useGLTF(modelPath);

    useEffect(() => {
      setIsLoading(false);
    }, []);

    return { scene: gltf.scene, error: null, isLoading: false };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("Unknown model loading error");

    useEffect(() => {
      console.warn(
        `[Model Loading] Failed to load model at ${modelPath}:`,
        error.message
      );
      if (fallbackCallback) fallbackCallback();
      setError(error);
      setIsLoading(false);
    }, []);

    return { scene: null, error, isLoading: false };
  }
}
