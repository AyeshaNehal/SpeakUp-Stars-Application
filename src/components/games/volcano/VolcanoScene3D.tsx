/**
 * CHILD PRIVACY & 3D VISUALS NOTE (Rule 1, Rule 6):
 * - Volume Volcano 3D Scene using React Three Fiber
 * - Lightweight, procedural low-poly geometry (zero external asset weight).
 * - Real-time audio reactive: Crater glow, rising magma, eruption particles, and dancing mascot.
 * - Touch-drag rotate on phone, mouse drag on desktop.
 * - Tap mascot for cheerful celebration reaction.
 * - Low-graphics mode toggle + auto-detection for weak devices.
 */

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface VolcanoScene3DProps {
  volume: number; // 0 to 1
  isErupting: boolean;
  lowGraphics?: boolean;
  onMascotTap?: () => void;
}

// ----------------------------------------------------------------------------
// 1. PROCEDURAL ERUPTION PARTICLE SYSTEM
// ----------------------------------------------------------------------------
interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

const EruptionParticles: React.FC<{ volume: number; isErupting: boolean; lowGraphics: boolean }> = ({
  volume,
  isErupting,
  lowGraphics,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const maxParticles = lowGraphics ? 25 : 80;

  // Initialize pool of particles
  const particles = useMemo<Particle[]>(() => {
    const list: Particle[] = [];
    const colors = [
      new THREE.Color('#ff3b00'),
      new THREE.Color('#ff7700'),
      new THREE.Color('#ffd000'),
      new THREE.Color('#ff2a6d'),
      new THREE.Color('#ffb703'),
    ];

    for (let i = 0; i < 80; i++) {
      list.push({
        position: new THREE.Vector3(0, 1.8, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        color: colors[i % colors.length],
        size: 0.12 + Math.random() * 0.12,
        life: 0,
        maxLife: 40 + Math.random() * 30,
      });
    }
    return list;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    // Spawn rate depends on volume
    const spawnRate = isErupting ? (lowGraphics ? 2 : 5) : volume > 0.25 ? 1 : 0;

    let spawned = 0;
    for (let i = 0; i < maxParticles; i++) {
      const p = particles[i];

      if (p.life <= 0) {
        if (spawned < spawnRate) {
          p.life = p.maxLife;
          p.position.set(
            (Math.random() - 0.5) * 0.6,
            1.85,
            (Math.random() - 0.5) * 0.6
          );
          // Eruption velocity
          const speed = (0.08 + volume * 0.14) * (isErupting ? 1.6 : 1.0);
          p.velocity.set(
            (Math.random() - 0.5) * 0.08,
            speed + Math.random() * 0.06,
            (Math.random() - 0.5) * 0.08
          );
          spawned++;
        } else {
          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }
      } else {
        // Update physics
        p.position.add(p.velocity);
        p.velocity.y -= 0.0035; // Gravity
        p.life--;

        // Scale shrinks as life decays
        const progress = p.life / p.maxLife;
        const currentScale = p.size * progress;

        dummy.position.copy(p.position);
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.rotation.x += 0.05;
        dummy.rotation.y += 0.05;
        dummy.updateMatrix();

        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, p.color);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxParticles]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        roughness={0.2}
        metalness={0.1}
        emissive="#ff5500"
        emissiveIntensity={isErupting ? 1.8 : 0.8}
      />
    </instancedMesh>
  );
};

// ----------------------------------------------------------------------------
// 2. 3D VOLCANO & FLOATING ISLAND TERRAIN
// ----------------------------------------------------------------------------
const VolcanoIsland: React.FC<{ volume: number; isErupting: boolean }> = ({ volume, isErupting }) => {
  const magmaRef = useRef<THREE.Mesh>(null);
  const smokeRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Magma pulsing and rising
    if (magmaRef.current) {
      const baseHeight = 1.75;
      const riseAmount = volume * 0.22;
      magmaRef.current.position.y = baseHeight + riseAmount + Math.sin(t * 5) * 0.02;

      const mat = magmaRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = 0.6 + volume * 1.8 + (isErupting ? 1.0 : 0);
      }
    }

    // Gentle smoke rotation
    if (smokeRef.current) {
      smokeRef.current.rotation.y = t * 0.3;
    }
  });

  return (
    <group position={[0, -0.6, 0]}>
      {/* Floating Island Ground (Lush green moss top) */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[3.2, 3.4, 0.4, 16]} />
        <meshStandardMaterial color="#4ade80" roughness={0.8} />
      </mesh>

      {/* Island Underbelly (Earthy brown low-poly rocks) */}
      <mesh position={[0, -0.7, 0]}>
        <coneGeometry args={[3.3, 1.2, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} flatShading />
      </mesh>

      {/* Main Volcano Cone (Truncated crag cone) */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.7, 2.3, 1.8, 12]} />
        <meshStandardMaterial color="#44403c" roughness={0.9} flatShading />
      </mesh>

      {/* Volcano Crater Dark Rim */}
      <mesh position={[0, 1.76, 0]}>
        <torusGeometry args={[0.7, 0.12, 8, 16]} />
        <meshStandardMaterial color="#292524" roughness={0.9} />
      </mesh>

      {/* Glowing Magma / Lava Pool in Crater */}
      <mesh ref={magmaRef} position={[0, 1.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 16]} />
        <meshStandardMaterial
          color="#ff3b00"
          emissive="#ff2200"
          emissiveIntensity={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* Decorative Island Crystals / Flowers */}
      <mesh position={[1.8, 0.25, 0.8]} rotation={[0.2, 0.5, 0]}>
        <octahedronGeometry args={[0.25]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} emissive="#0284c7" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[-1.7, 0.25, 1.1]} rotation={[0.1, 0.8, -0.1]}>
        <octahedronGeometry args={[0.2]} />
        <meshStandardMaterial color="#ec4899" roughness={0.2} emissive="#be185d" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.4, 0.2, 2.2]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#facc15" roughness={0.5} />
      </mesh>

      {/* Floating Soft Cloud Puffs around island */}
      <group ref={smokeRef} position={[0, 2.3, 0]}>
        <mesh position={[0.2, 0, 0.2]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#f1f5f9" transparent opacity={0.35} />
        </mesh>
        <mesh position={[-0.2, 0.25, -0.1]}>
          <sphereGeometry args={[0.35, 8, 8]} />
          <meshStandardMaterial color="#cbd5e1" transparent opacity={0.3} />
        </mesh>
      </group>
    </group>
  );
};

// ----------------------------------------------------------------------------
// 3. 3D SPARKY MASCOT (ON-ISLAND CHEERING COMPANION)
// ----------------------------------------------------------------------------
const Sparky3DMascot: React.FC<{
  volume: number;
  isErupting: boolean;
  onTap?: () => void;
}> = ({ volume, isErupting, onTap }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [isTapped, setIsTapped] = useState(false);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 800);
    if (onTap) onTap();
  };

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // Cheerful bouncing reaction to volume and tap
    const bounceHeight = isTapped
      ? Math.sin(t * 16) * 0.4
      : isErupting
      ? Math.abs(Math.sin(t * 10)) * 0.25
      : Math.sin(t * 3) * 0.05 + volume * 0.15;

    groupRef.current.position.y = 0.1 + bounceHeight;

    // Joyful wiggle
    if (isErupting || isTapped) {
      groupRef.current.rotation.y = Math.sin(t * 8) * 0.3;
    } else {
      groupRef.current.rotation.y = Math.sin(t * 1.5) * 0.1;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[1.9, 0.1, 1.4]}
      onClick={handleClick}
      scale={[0.75, 0.75, 0.75]}
    >
      {/* Fluffy Mascot Body */}
      <mesh>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshStandardMaterial color="#ffd12e" roughness={0.5} />
      </mesh>

      {/* Rosy Cheeks */}
      <mesh position={[-0.25, -0.05, 0.45]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#ff8a80" roughness={0.4} />
      </mesh>
      <mesh position={[0.25, -0.05, 0.45]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#ff8a80" roughness={0.4} />
      </mesh>

      {/* Cheerful Eyes */}
      <mesh position={[-0.18, 0.12, 0.48]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.1} />
      </mesh>
      <mesh position={[0.18, 0.12, 0.48]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.1} />
      </mesh>

      {/* Cute Little Star Antenna */}
      <mesh position={[0, 0.65, 0]}>
        <octahedronGeometry args={[0.16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#fbbf24" emissiveIntensity={0.6} />
      </mesh>

      {/* Tiny Waving Paws */}
      <mesh position={[-0.45, 0, 0.2]} rotation={[0, 0, -0.4]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
      <mesh position={[0.45, 0.1, 0.2]} rotation={[0, 0, 0.6]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.6} />
      </mesh>
    </group>
  );
};

// ----------------------------------------------------------------------------
// 4. MAIN EXPORTED COMPONENT
// ----------------------------------------------------------------------------
export const VolcanoScene3D: React.FC<VolcanoScene3DProps> = ({
  volume,
  isErupting,
  lowGraphics = false,
  onMascotTap,
}) => {
  return (
    <div className="relative w-full h-full min-h-[340px] select-none touch-none">
      <Canvas
        camera={{ position: [0, 3.2, 5.8], fov: 46 }}
        dpr={lowGraphics ? [1, 1] : [1, 1.5]}
        gl={{
          antialias: !lowGraphics,
          powerPreference: 'high-performance',
        }}
      >
        {/* Soft Warm Sky Ambient & Directional Sun */}
        <ambientLight intensity={lowGraphics ? 1.0 : 0.75} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={lowGraphics ? 1.0 : 1.4}
          color="#fffbeb"
        />

        {/* Crater Point Light: Intensifies with vocal volume */}
        <pointLight
          position={[0, 1.9, 0]}
          color="#ff4500"
          intensity={0.8 + volume * 3.5 + (isErupting ? 3.0 : 0)}
          distance={8}
        />

        {/* 3D Floating Volcano Island */}
        <VolcanoIsland volume={volume} isErupting={isErupting} />

        {/* Dynamic Eruption Particles */}
        <EruptionParticles volume={volume} isErupting={isErupting} lowGraphics={lowGraphics} />

        {/* Cheering 3D Mascot */}
        <Sparky3DMascot volume={volume} isErupting={isErupting} onTap={onMascotTap} />

        {/* Orbit Controls: Touch-drag on phone, mouse orbit on laptop */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4.5}
          maxPolarAngle={Math.PI / 2.2}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
};
