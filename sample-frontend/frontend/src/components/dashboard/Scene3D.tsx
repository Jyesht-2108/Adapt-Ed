import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function FloatingShape({ position, color, speed = 1, distort = 0.3, size = 1 }: { 
  position: [number, number, number]; 
  color: string; 
  speed?: number; 
  distort?: number;
  size?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} scale={size}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.2}
          metalness={0.8}
          distort={distort}
          speed={2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-3, 2, 4]} color="#6366f1" intensity={2} />
      <pointLight position={[3, -2, -4]} color="#0ea5e9" intensity={1.5} />
      
      <FloatingShape position={[-1.5, 0.8, 0]} color="#6366f1" speed={0.8} distort={0.4} size={0.7} />
      <FloatingShape position={[1.8, -0.5, -1]} color="#0ea5e9" speed={1.2} distort={0.3} size={0.5} />
      <FloatingShape position={[0, 1.5, -2]} color="#22c55e" speed={0.6} distort={0.5} size={0.4} />
      <FloatingShape position={[-2, -1, -1.5]} color="#f59e0b" speed={1} distort={0.2} size={0.35} />
    </>
  );
}

export function Scene3D() {
  return (
    <div className="absolute inset-0 opacity-30 pointer-events-none">
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}
