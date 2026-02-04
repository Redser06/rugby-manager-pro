import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { RugbyPitch3D } from './RugbyPitch3D';
import { Player3D } from './Player3D';
import { Ball3D } from './Ball3D';
import { ReplayKeyframe, ReplayMatch } from '@/types/replay';

interface ReplaySceneProps {
  match: ReplayMatch;
  currentKeyframe: ReplayKeyframe;
  nextKeyframe?: ReplayKeyframe;
  interpolation: number;
  cameraPosition?: [number, number, number];
}

export function ReplayScene({ 
  match, 
  currentKeyframe, 
  nextKeyframe,
  interpolation,
  cameraPosition = [0, 8, 12]
}: ReplaySceneProps) {
  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden bg-background border">
      <Canvas shadows>
        {/* Camera - Fixed broadcast angle */}
        <PerspectiveCamera 
          makeDefault 
          position={cameraPosition} 
          fov={50}
          near={0.1}
          far={100}
        />
        
        {/* Limited orbit for slight adjustments */}
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight position={[-10, 20, -10]} intensity={0.4} />
        
        {/* Sky color */}
        <color attach="background" args={['#87CEEB']} />
        
        {/* Pitch */}
        <RugbyPitch3D 
          homeColor={match.homeTeam.primaryColor} 
          awayColor={match.awayTeam.primaryColor} 
        />
        
        {/* Home players */}
        {currentKeyframe.players.home.map((player, index) => {
          const targetPlayer = nextKeyframe?.players.home.find(
            p => p.playerId === player.playerId
          );
          return (
            <Player3D
              key={player.playerId}
              state={player}
              teamColor={match.homeTeam.primaryColor}
              secondaryColor={match.homeTeam.secondaryColor}
              targetState={targetPlayer}
              interpolation={interpolation}
            />
          );
        })}
        
        {/* Away players */}
        {currentKeyframe.players.away.map((player, index) => {
          const targetPlayer = nextKeyframe?.players.away.find(
            p => p.playerId === player.playerId
          );
          return (
            <Player3D
              key={player.playerId}
              state={player}
              teamColor={match.awayTeam.primaryColor}
              secondaryColor={match.awayTeam.secondaryColor}
              targetState={targetPlayer}
              interpolation={interpolation}
            />
          );
        })}
        
        {/* Ball */}
        <Ball3D 
          state={currentKeyframe.ball}
          targetState={nextKeyframe?.ball}
          interpolation={interpolation}
        />
      </Canvas>
    </div>
  );
}
