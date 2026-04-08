import { Link, useLocation } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  Swords, 
  Trophy, 
  Play,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Target,
  Dumbbell,
  Activity,
  Calendar,
  CalendarDays,
  Shirt,
  ArrowRightLeft,
  UserCircle,
  Save,
  Globe,
  Flag,
  GraduationCap,
  Sun,
  Moon,
  Tv,
  Monitor
} from 'lucide-react';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Fixtures', url: '/fixtures', icon: CalendarDays },
  { title: 'Squad', url: '/squad', icon: Users },
  { title: 'Transfers', url: '/transfers', icon: ArrowRightLeft },
  { title: 'Team Settings', url: '/team-settings', icon: Shirt },
  { title: 'Academy', url: '/academy', icon: GraduationCap },
  { title: 'Tactics', url: '/tactics', icon: Swords },
  { title: 'Strike Plays', url: '/strike-plays', icon: Target },
  { title: 'Training', url: '/training', icon: Dumbbell },
  { title: 'S&C', url: '/strength-conditioning', icon: Activity },
  { title: 'Periodization', url: '/periodization', icon: Calendar },
  { title: 'Match', url: '/match', icon: Play },
  { title: 'Standings', url: '/standings', icon: Trophy },
  { title: 'European Cups', url: '/european', icon: Globe },
  { title: 'Six Nations', url: '/six-nations', icon: Flag },
];

export function AppSidebar() {
  const location = useLocation();
  const { getMyTeam } = useGame();
  const { state, toggleSidebar } = useSidebar();
  const { isAuthenticated } = useAuth();
  const { mode, skin, toggleMode, toggleSkin } = useTheme();
  const team = getMyTeam();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RM</span>
              </div>
              <div>
                <h2 className="font-bold text-sm">Rugby Manager</h2>
                <p className="text-xs text-muted-foreground">Season 1</p>
              </div>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link 
                        to={item.url} 
                        className={`flex items-center gap-3 ${isActive ? 'text-primary' : ''}`}
                      >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {team && !isCollapsed && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="default">{team.shortName}</Badge>
              <span className="text-sm font-medium truncate">{team.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{team.league}</p>
          </div>
        )}

        {/* Theme toggles */}
        {!isCollapsed && (
          <div className="flex gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-center gap-1.5 text-xs"
              onClick={toggleMode}
              title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {mode === 'light' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              {mode === 'light' ? 'Dark' : 'Light'}
            </Button>
            <Button
              variant={skin === 'broadcast' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1 justify-center gap-1.5 text-xs"
              onClick={toggleSkin}
              title={skin === 'default' ? 'Switch to Broadcast Mode' : 'Switch to Default Mode'}
            >
              {skin === 'broadcast' ? <Monitor className="h-3.5 w-3.5" /> : <Tv className="h-3.5 w-3.5" />}
              {skin === 'broadcast' ? 'Default' : 'Broadcast'}
            </Button>
          </div>
        )}
        {isCollapsed && (
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 mx-auto" onClick={toggleMode}>
              {mode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Button variant={skin === 'broadcast' ? 'default' : 'ghost'} size="icon" className="h-8 w-8 mx-auto" onClick={toggleSkin}>
              <Tv className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!isCollapsed && (
          <div className="space-y-1 mt-2">
            <Link to="/coach">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                {isAuthenticated ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save / Load
                  </>
                ) : (
                  <>
                    <UserCircle className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Change Team
              </Button>
            </Link>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
