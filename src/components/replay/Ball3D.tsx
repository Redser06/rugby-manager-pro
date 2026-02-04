import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BallState } from '@/types/replay';

interface Ball3DProps {
  state: BallState;
  targetState?: BallState;
  interpolation: number;
}

export function Ball3D({ state, targetState, interpolation }: Ball3DProps) {
  const ballRef = useRef<THREE.Mesh>(null);
  
  // Don't render if ball is with a player
  if (state.carrier || (targetState?.carrier && interpolation > 0.5)) {
    return null;
  }
  
  const currentPos = targetState && !targetState.carrier ? {
    x: THREE.MathUtils.lerp(state.position.x, targetState.position.x, interpolation),
    y: THREE.MathUtils.lerp(state.position.y, targetState.position.y, interpolation),
    z: THREE.MathUtils.lerp(state.position.z, targetState.position.z, interpolation),
  } : state.position;
  
  useFrame((_, delta) => {
    if (ballRef.current) {
      ballRef.current.position.set(currentPos.x, currentPos.y, currentPos.z);
      // Spin the ball if it's in the air
      if (currentPos.y > 0.5) {
        ballRef.current.rotation.x += delta * 5;
        ballRef.current.rotation.z += delta * 3;
      }
    }
  });
  
  return (
    <mesh ref={ballRef} castShadow>
      {/* Rugby ball - elongated sphere */}
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial color="#8B4513" />
      {/* White stripes */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.055, 0.008, 4, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </mesh>
  );
}
