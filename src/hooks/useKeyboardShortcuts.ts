import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { toast } from 'sonner';

const NUMBER_ROUTES: Record<string, string> = {
  '1': '/dashboard',
  '2': '/fixtures',
  '3': '/squad',
  '4': '/tactics',
  '5': '/training',
  '6': '/match',
  '7': '/standings',
  '8': '/transfers',
  '9': '/six-nations',
};

/**
 * Global keyboard shortcuts:
 *  - "n"  → advance week (only when a team is selected)
 *  - 1-9  → jump to nav section
 *  - "?"  → show shortcut cheatsheet toast
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { advanceWeek, getMyTeam } = useGame();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // ignore when typing in inputs / editable surfaces
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'n' || e.key === 'N') {
        if (getMyTeam()) {
          advanceWeek();
          toast.success('Advanced one week');
        }
      } else if (e.key === '?') {
        toast.message('Keyboard shortcuts', {
          description: 'N: advance week · 1-9: jump to section · ?: this help',
        });
      } else if (NUMBER_ROUTES[e.key]) {
        navigate(NUMBER_ROUTES[e.key]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advanceWeek, getMyTeam, navigate]);
}
