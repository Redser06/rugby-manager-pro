import { useMemo } from 'react';
import { PITCH_DIMENSIONS, SCENE_SCALE } from '@/types/replay';
import * as THREE from 'three';

interface RugbyPitch3DProps {
  homeColor?: string;
  awayColor?: string;
}

export function RugbyPitch3D({ homeColor = '#1e40af', awayColor = '#dc2626' }: RugbyPitch3DProps) {
  const scale = SCENE_SCALE;
  const pitchLength = PITCH_DIMENSIONS.totalLength * scale;
  const pitchWidth = PITCH_DIMENSIONS.width * scale;
  const playingLength = PITCH_DIMENSIONS.length * scale;
  const inGoalDepth = PITCH_DIMENSIONS.inGoalDepth * scale;
  
  // Line positions
  const halfwayZ = 0;
  const twentyTwoZ = PITCH_DIMENSIONS.twentyTwoLine * scale;
  const tenMeterZ = PITCH_DIMENSIONS.tenMeterLine * scale;
  const fiveMetreX = PITCH_DIMENSIONS.fiveMetreLine * scale;
  const fifteenMetreX = PITCH_DIMENSIONS.fifteenMeterLine * scale;
  
  const lineGeometry = useMemo(() => {
    const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];
    const halfWidth = pitchWidth / 2;
    const halfLength = playingLength / 2;
    
    // Touchlines (sidelines)
    lines.push({ start: [-halfWidth, 0.01, -halfLength - inGoalDepth], end: [-halfWidth, 0.01, halfLength + inGoalDepth] });
    lines.push({ start: [halfWidth, 0.01, -halfLength - inGoalDepth], end: [halfWidth, 0.01, halfLength + inGoalDepth] });
    
    // Try lines
    lines.push({ start: [-halfWidth, 0.01, -halfLength], end: [halfWidth, 0.01, -halfLength] });
    lines.push({ start: [-halfWidth, 0.01, halfLength], end: [halfWidth, 0.01, halfLength] });
    
    // Dead ball lines
    lines.push({ start: [-halfWidth, 0.01, -halfLength - inGoalDepth], end: [halfWidth, 0.01, -halfLength - inGoalDepth] });
    lines.push({ start: [-halfWidth, 0.01, halfLength + inGoalDepth], end: [halfWidth, 0.01, halfLength + inGoalDepth] });
    
    // Halfway line
    lines.push({ start: [-halfWidth, 0.01, halfwayZ], end: [halfWidth, 0.01, halfwayZ] });
    
    // 22m lines
    lines.push({ start: [-halfWidth, 0.01, -twentyTwoZ], end: [halfWidth, 0.01, -twentyTwoZ] });
    lines.push({ start: [-halfWidth, 0.01, twentyTwoZ], end: [halfWidth, 0.01, twentyTwoZ] });
    
    // 10m lines (dashed in reality, solid here for simplicity)
    lines.push({ start: [-halfWidth, 0.01, -tenMeterZ], end: [halfWidth, 0.01, -tenMeterZ] });
    lines.push({ start: [-halfWidth, 0.01, tenMeterZ], end: [halfWidth, 0.01, tenMeterZ] });
    
    // 5m lines (parallel to touchlines)
    lines.push({ start: [-halfWidth + fiveMetreX, 0.01, -halfLength], end: [-halfWidth + fiveMetreX, 0.01, halfLength] });
    lines.push({ start: [halfWidth - fiveMetreX, 0.01, -halfLength], end: [halfWidth - fiveMetreX, 0.01, halfLength] });
    
    // 15m lines (parallel to touchlines, for lineouts)
    lines.push({ start: [-halfWidth + fifteenMetreX, 0.01, -halfLength], end: [-halfWidth + fifteenMetreX, 0.01, halfLength] });
    lines.push({ start: [halfWidth - fifteenMetreX, 0.01, -halfLength], end: [halfWidth - fifteenMetreX, 0.01, halfLength] });
    
    return lines;
  }, [pitchWidth, playingLength, inGoalDepth, twentyTwoZ, tenMeterZ, fiveMetreX, fifteenMetreX]);
  
  return (
    <group>
      {/* Main playing surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[pitchWidth, playingLength]} />
        <meshStandardMaterial color="#2d5a27" />
      </mesh>
      
      {/* In-goal areas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -(playingLength / 2 + inGoalDepth / 2)]} receiveShadow>
        <planeGeometry args={[pitchWidth, inGoalDepth]} />
        <meshStandardMaterial color={homeColor} opacity={0.3} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, playingLength / 2 + inGoalDepth / 2]} receiveShadow>
        <planeGeometry args={[pitchWidth, inGoalDepth]} />
        <meshStandardMaterial color={awayColor} opacity={0.3} transparent />
      </mesh>
      
      {/* Pitch lines */}
      {lineGeometry.map((line, index) => {
        const points = [
          new THREE.Vector3(...line.start),
          new THREE.Vector3(...line.end),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <line key={index}>
            <bufferGeometry attach="geometry" {...geometry} />
            <lineBasicMaterial attach="material" color="white" linewidth={2} />
          </line>
        );
      })}
      
      {/* Goal posts - Home end */}
      <GoalPosts position={[0, 0, -(playingLength / 2)]} />
      
      {/* Goal posts - Away end */}
      <GoalPosts position={[0, 0, playingLength / 2]} />
    </group>
  );
}

function GoalPosts({ position }: { position: [number, number, number] }) {
  const postHeight = 1.5; // Scaled height
  const crossbarWidth = 0.56; // 5.6m scaled
  const crossbarHeight = 0.3; // 3m scaled
  
  return (
    <group position={position}>
      {/* Left post */}
      <mesh position={[-crossbarWidth / 2, postHeight / 2 + crossbarHeight, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, postHeight, 8]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      
      {/* Right post */}
      <mesh position={[crossbarWidth / 2, postHeight / 2 + crossbarHeight, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, postHeight, 8]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      
      {/* Crossbar */}
      <mesh position={[0, crossbarHeight, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, crossbarWidth, 8]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      
      {/* Padding */}
      <mesh position={[-crossbarWidth / 2, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
      <mesh position={[crossbarWidth / 2, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 8]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
    </group>
  );
}
