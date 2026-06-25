import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Keyboard } from 'lucide-react';

interface GameLayoutProps {
  children: ReactNode;
}

function ShortcutHelp() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Keyboard shortcuts (?)">
          <Keyboard className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 text-sm">
        <p className="font-semibold mb-2">Keyboard shortcuts</p>
        <ul className="space-y-1">
          <li className="flex justify-between"><span>Advance week</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">N</kbd></li>
          <li className="flex justify-between"><span>Dashboard</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">1</kbd></li>
          <li className="flex justify-between"><span>Fixtures</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">2</kbd></li>
          <li className="flex justify-between"><span>Squad</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">3</kbd></li>
          <li className="flex justify-between"><span>Tactics</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">4</kbd></li>
          <li className="flex justify-between"><span>Training</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">5</kbd></li>
          <li className="flex justify-between"><span>Match</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">6</kbd></li>
          <li className="flex justify-between"><span>Standings</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">7</kbd></li>
          <li className="flex justify-between"><span>Transfers</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">8</kbd></li>
          <li className="flex justify-between"><span>Six Nations</span><kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">9</kbd></li>
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function LayoutInner({ children }: GameLayoutProps) {
  useKeyboardShortcuts();
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <SidebarInset className="flex-1 min-w-0">
        {/* Mobile / utility header — collapses the sidebar to a drawer on small screens */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-border/40 bg-background/80 backdrop-blur px-3 py-2 md:px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <span className="text-sm font-semibold text-muted-foreground hidden sm:inline">On the Gain Line</span>
          </div>
          <ShortcutHelp />
        </header>
        <main className="min-h-[calc(100vh-3rem)] bg-background">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
