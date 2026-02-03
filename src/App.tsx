import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { TransferProvider } from "@/contexts/TransferContext";
import { GameLayout } from "@/components/GameLayout";
import TeamSelection from "./pages/TeamSelection";
import Dashboard from "./pages/Dashboard";
import Squad from "./pages/Squad";
import Tactics from "./pages/Tactics";
import Standings from "./pages/Standings";
import MatchSimulation from "./pages/MatchSimulation";
import StrikePlayEditor from "./pages/StrikePlayEditor";
import Training from "./pages/Training";
import StrengthConditioning from "./pages/StrengthConditioning";
import Periodization from "./pages/Periodization";
import TeamSettings from "./pages/TeamSettings";
import Transfers from "./pages/Transfers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { getMyTeam } = useGame();
  const team = getMyTeam();
  
  if (!team) {
    return <Navigate to="/" replace />;
  }
  
  return <GameLayout>{children}</GameLayout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TeamSelection />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/squad" element={<ProtectedRoute><Squad /></ProtectedRoute>} />
      <Route path="/tactics" element={<ProtectedRoute><Tactics /></ProtectedRoute>} />
      <Route path="/strike-plays" element={<ProtectedRoute><StrikePlayEditor /></ProtectedRoute>} />
      <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
      <Route path="/strength-conditioning" element={<ProtectedRoute><StrengthConditioning /></ProtectedRoute>} />
      <Route path="/periodization" element={<ProtectedRoute><Periodization /></ProtectedRoute>} />
      <Route path="/team-settings" element={<ProtectedRoute><TeamSettings /></ProtectedRoute>} />
      <Route path="/transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
      <Route path="/standings" element={<ProtectedRoute><Standings /></ProtectedRoute>} />
      <Route path="/match" element={<ProtectedRoute><MatchSimulation /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <GameProvider>
          <TransferProvider>
            <AppRoutes />
          </TransferProvider>
        </GameProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
