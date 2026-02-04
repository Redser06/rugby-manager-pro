import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerReplayState, PLAYER_DIMENSIONS } from '@/types/replay';

interface Player3DProps {
  state: PlayerReplayState;
  teamColor: string;
  secondaryColor: string;
  targetState?: PlayerReplayState;
  interpolation: number;
}

export function Player3D({ 
  state, 
  teamColor, 
  secondaryColor,
  targetState,
  interpolation 
}: Player3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Interpolate position if target is provided
  const currentPos = targetState ? {
    x: THREE.MathUtils.lerp(state.position.x, targetState.position.x, interpolation),
    y: THREE.MathUtils.lerp(state.position.y, targetState.position.y, interpolation),
    z: THREE.MathUtils.lerp(state.position.z, targetState.position.z, interpolation),
  } : state.position;
  
  const currentRotation = targetState 
    ? THREE.MathUtils.lerp(state.rotation, targetState.rotation, interpolation)
    : state.rotation;
  
  const hasBall = targetState 
    ? (interpolation > 0.5 ? targetState.hasBall : state.hasBall)
    : state.hasBall;
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(currentPos.x, currentPos.y, currentPos.z);
      groupRef.current.rotation.y = currentRotation;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Body capsule */}
      <mesh castShadow position={[0, PLAYER_DIMENSIONS.height / 4, 0]}>
        <capsuleGeometry args={[PLAYER_DIMENSIONS.radius * 0.15, PLAYER_DIMENSIONS.height * 0.25, 4, 8]} />
        <meshStandardMaterial 
          color={teamColor} 
          emissive={state.isActive ? teamColor : '#000000'}
          emissiveIntensity={state.isActive ? 0.3 : 0}
        />
      </mesh>
      
      {/* Jersey stripe/band */}
      <mesh castShadow position={[0, PLAYER_DIMENSIONS.height / 4, 0]}>
        <torusGeometry args={[PLAYER_DIMENSIONS.radius * 0.16, 0.02, 8, 16]} />
        <meshStandardMaterial color={secondaryColor} />
      </mesh>
      
      {/* Head */}
      <mesh castShadow position={[0, PLAYER_DIMENSIONS.height * 0.45, 0]}>
        <sphereGeometry args={[PLAYER_DIMENSIONS.radius * 0.12, 8, 8]} />
        <meshStandardMaterial color="#f5d0c5" />
      </mesh>
      
      {/* Jersey number */}
      <Text
        position={[0, PLAYER_DIMENSIONS.height / 4, PLAYER_DIMENSIONS.radius * 0.16]}
        fontSize={0.08}
        color={secondaryColor}
        anchorX="center"
        anchorY="middle"
      >
        {state.jerseyNumber}
      </Text>
      
      {/* Ball indicator */}
      {hasBall && (
        <mesh position={[0.15, PLAYER_DIMENSIONS.height / 3, 0.1]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      )}
      
      {/* Active player glow */}
      {state.isActive && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 16]} />
          <meshBasicMaterial color={teamColor} opacity={0.4} transparent />
        </mesh>
      )}
    </group>
  );
}
