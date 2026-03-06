import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Viseme mouth shapes mapped to phoneme groups ─── */
const VISEME_SHAPES: Record<string, { jawOpen: number; lipWidth: number; lipRound: number }> = {
  rest: { jawOpen: 0, lipWidth: 0, lipRound: 0 },
  A: { jawOpen: 0.7, lipWidth: 0.3, lipRound: 0 },
  E: { jawOpen: 0.4, lipWidth: 0.6, lipRound: 0 },
  I: { jawOpen: 0.2, lipWidth: 0.7, lipRound: 0 },
  O: { jawOpen: 0.6, lipWidth: 0, lipRound: 0.8 },
  U: { jawOpen: 0.3, lipWidth: 0, lipRound: 1 },
  M: { jawOpen: 0.02, lipWidth: 0, lipRound: 0.2 },
  F: { jawOpen: 0.1, lipWidth: 0.3, lipRound: 0 },
  TH: { jawOpen: 0.15, lipWidth: 0.2, lipRound: 0 },
};

const VISEME_SEQUENCE = ["rest", "A", "E", "O", "M", "I", "U", "F", "TH", "A", "E", "rest"];

interface AvatarHeadProps {
  speaking: boolean;
}

const AvatarHead = ({ speaking }: AvatarHeadProps) => {
  const groupRef = useRef<THREE.Group>(null);

  /* Refs for animated parts */
  const jawRef = useRef<THREE.Mesh>(null);
  const lowerLipRef = useRef<THREE.Mesh>(null);
  const upperLipRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftIrisRef = useRef<THREE.Mesh>(null);
  const rightIrisRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);

  /* Holographic head material */
  const headMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("hsl(185, 80%, 55%)") },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec2 vUv;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying vec2 vUv;
          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
            float scanline = sin(vPosition.y * 40.0 + uTime * 2.0) * 0.5 + 0.5;
            float grid = step(0.97, fract(vPosition.y * 20.0)) * 0.3;
            vec3 color = uColor * (0.3 + fresnel * 0.7);
            color += grid * uColor * 0.5;
            float alpha = 0.08 + fresnel * 0.5 + scanline * 0.03;
            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    []
  );

  const jawMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("hsl(185, 80%, 55%)"),
        transparent: true,
        opacity: 0.15,
        wireframe: true,
      }),
    []
  );

  const eyeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("hsl(185, 90%, 70%)"),
        transparent: true,
        opacity: 0.6,
      }),
    []
  );

  const irisMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("hsl(270, 80%, 65%)"),
        transparent: true,
        opacity: 0.8,
      }),
    []
  );

  /* Current viseme state */
  const visemeState = useRef({ jawOpen: 0, lipWidth: 0, lipRound: 0 });
  const blinkTimer = useRef(0);
  const blinkState = useRef(1); // 1 = open

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    headMat.uniforms.uTime.value += delta;

    /* Subtle head movement */
    groupRef.current.rotation.y = Math.sin(headMat.uniforms.uTime.value * 0.3) * 0.08;
    groupRef.current.rotation.x = Math.sin(headMat.uniforms.uTime.value * 0.2) * 0.03 - 0.05;

    /* ── Lip sync ── */
    if (speaking) {
      const t = headMat.uniforms.uTime.value * 6;
      const idx = Math.floor(t) % VISEME_SEQUENCE.length;
      const nextIdx = (idx + 1) % VISEME_SEQUENCE.length;
      const blend = t % 1;

      const curr = VISEME_SHAPES[VISEME_SEQUENCE[idx]];
      const next = VISEME_SHAPES[VISEME_SEQUENCE[nextIdx]];

      visemeState.current.jawOpen = THREE.MathUtils.lerp(curr.jawOpen, next.jawOpen, blend);
      visemeState.current.lipWidth = THREE.MathUtils.lerp(curr.lipWidth, next.lipWidth, blend);
      visemeState.current.lipRound = THREE.MathUtils.lerp(curr.lipRound, next.lipRound, blend);
    } else {
      visemeState.current.jawOpen = THREE.MathUtils.lerp(visemeState.current.jawOpen, 0, delta * 5);
      visemeState.current.lipWidth = THREE.MathUtils.lerp(visemeState.current.lipWidth, 0, delta * 5);
      visemeState.current.lipRound = THREE.MathUtils.lerp(visemeState.current.lipRound, 0, delta * 5);
    }

    /* Apply jaw */
    if (jawRef.current) {
      jawRef.current.position.y = -0.55 - visemeState.current.jawOpen * 0.12;
      jawRef.current.scale.x = 1 + visemeState.current.lipWidth * 0.15 - visemeState.current.lipRound * 0.1;
    }

    /* Apply lips */
    if (lowerLipRef.current) {
      lowerLipRef.current.position.y = -0.52 - visemeState.current.jawOpen * 0.1;
      lowerLipRef.current.scale.x = 1 + visemeState.current.lipWidth * 0.2 - visemeState.current.lipRound * 0.15;
      lowerLipRef.current.scale.y = 1 + visemeState.current.lipRound * 0.3;
    }
    if (upperLipRef.current) {
      upperLipRef.current.scale.x = 1 + visemeState.current.lipWidth * 0.15 - visemeState.current.lipRound * 0.1;
    }

    /* ── Blinking ── */
    blinkTimer.current += delta;
    if (blinkTimer.current > 3 + Math.random() * 2) {
      blinkTimer.current = 0;
      blinkState.current = 0;
    }
    blinkState.current = THREE.MathUtils.lerp(
      blinkState.current,
      blinkTimer.current < 0.15 ? 0.05 : 1,
      delta * 15
    );

    if (leftEyeRef.current) leftEyeRef.current.scale.y = blinkState.current;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blinkState.current;

    /* ── Eye tracking (subtle) ── */
    const eyeX = Math.sin(headMat.uniforms.uTime.value * 0.5) * 0.015;
    const eyeY = Math.cos(headMat.uniforms.uTime.value * 0.3) * 0.01;
    if (leftIrisRef.current) {
      leftIrisRef.current.position.x = -0.22 + eyeX;
      leftIrisRef.current.position.y = 0.12 + eyeY;
    }
    if (rightIrisRef.current) {
      rightIrisRef.current.position.x = 0.22 + eyeX;
      rightIrisRef.current.position.y = 0.12 + eyeY;
    }

    /* Brow micro-expressions */
    const browLift = speaking ? Math.sin(headMat.uniforms.uTime.value * 1.5) * 0.02 : 0;
    if (leftBrowRef.current) leftBrowRef.current.position.y = 0.38 + browLift;
    if (rightBrowRef.current) rightBrowRef.current.position.y = 0.38 + browLift;
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {/* Cranium */}
      <mesh material={headMat}>
        <sphereGeometry args={[0.7, 32, 32]} />
      </mesh>

      {/* Wireframe overlay for sci-fi look */}
      <mesh>
        <sphereGeometry args={[0.71, 16, 16]} />
        <meshBasicMaterial color="hsl(185, 80%, 55%)" wireframe transparent opacity={0.04} />
      </mesh>

      {/* Chin / jaw area */}
      <mesh position={[0, -0.35, 0.25]} material={headMat}>
        <sphereGeometry args={[0.35, 24, 24]} />
      </mesh>

      {/* ── Eyes ── */}
      {/* Left eye socket */}
      <mesh ref={leftEyeRef} position={[-0.22, 0.12, 0.6]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <primitive object={eyeMat} attach="material" />
      </mesh>
      {/* Left iris */}
      <mesh ref={leftIrisRef} position={[-0.22, 0.12, 0.68]}>
        <circleGeometry args={[0.045, 16]} />
        <primitive object={irisMat} attach="material" />
      </mesh>

      {/* Right eye socket */}
      <mesh ref={rightEyeRef} position={[0.22, 0.12, 0.6]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <primitive object={eyeMat} attach="material" />
      </mesh>
      {/* Right iris */}
      <mesh ref={rightIrisRef} position={[0.22, 0.12, 0.68]}>
        <circleGeometry args={[0.045, 16]} />
        <primitive object={irisMat} attach="material" />
      </mesh>

      {/* ── Eyebrows ── */}
      <mesh ref={leftBrowRef} position={[-0.22, 0.38, 0.58]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.18, 0.02, 0.02]} />
        <meshBasicMaterial color="hsl(185, 80%, 55%)" transparent opacity={0.5} />
      </mesh>
      <mesh ref={rightBrowRef} position={[0.22, 0.38, 0.58]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.18, 0.02, 0.02]} />
        <meshBasicMaterial color="hsl(185, 80%, 55%)" transparent opacity={0.5} />
      </mesh>

      {/* ── Nose bridge ── */}
      <mesh position={[0, -0.05, 0.65]}>
        <boxGeometry args={[0.04, 0.18, 0.04]} />
        <meshBasicMaterial color="hsl(185, 80%, 55%)" transparent opacity={0.12} />
      </mesh>

      {/* ── Mouth / Jaw ── */}
      {/* Upper lip */}
      <mesh ref={upperLipRef} position={[0, -0.42, 0.6]}>
        <boxGeometry args={[0.22, 0.025, 0.06]} />
        <meshBasicMaterial color="hsl(185, 90%, 60%)" transparent opacity={0.35} />
      </mesh>
      {/* Lower lip (moves with jaw) */}
      <mesh ref={lowerLipRef} position={[0, -0.52, 0.58]}>
        <boxGeometry args={[0.2, 0.03, 0.05]} />
        <meshBasicMaterial color="hsl(185, 90%, 60%)" transparent opacity={0.3} />
      </mesh>
      {/* Jaw pivot */}
      <mesh ref={jawRef} position={[0, -0.55, 0.3]} material={jawMat}>
        <sphereGeometry args={[0.28, 16, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.4, 12]} />
        <meshBasicMaterial color="hsl(185, 80%, 55%)" wireframe transparent opacity={0.06} />
      </mesh>

      {/* Holographic ring around head */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <torusGeometry args={[0.85, 0.008, 8, 64]} />
        <meshBasicMaterial color="hsl(270, 80%, 65%)" transparent opacity={0.15} />
      </mesh>
    </group>
  );
};

export default AvatarHead;
