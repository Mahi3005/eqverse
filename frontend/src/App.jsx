import { useState, useEffect } from 'react';
import ArenaHome from './components/ArenaHome';
import BattleArena from './components/BattleArena';
import BattleReport from './components/BattleReport';
import AuthScreen from './components/AuthScreen';
import Navbar from './components/Navbar';
import CinematicIntro from './components/CinematicIntro';
import { isAuthenticated, getStoredUser, logoutUser, getProfile } from './services/api';

/**
 * EQverse - AI Roleplay Arena
 * Main Application Component
 * 
 * Manages app-level navigation state:
 * - auth → Login/Register screen
 * - intro → Cinematic AAA Studio bumper sequence
 * - arena → Boss selection home screen
 * - briefing → Pre-battle boss briefing modal (handled within ArenaHome)
 * - battle → Live battle chat arena
 * - report → Post-battle EQ report card
 */
function App() {
  const [currentView, setCurrentView] = useState(isAuthenticated() ? 'arena' : 'auth');
  const [user, setUser] = useState(getStoredUser());
  const [activeBattle, setActiveBattle] = useState(null);  // Current battle session data
  const [battleResult, setBattleResult] = useState(null);   // Post-battle evaluation data
  const [showIntro, setShowIntro] = useState(false);

  // Sync user profile from backend to ensure XP and stats are always fresh
  useEffect(() => {
    if (isAuthenticated()) {
      getProfile()
        .then((data) => {
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('eqverse_user', JSON.stringify(data.user));
          }
        })
        .catch((err) => {
          console.warn('Could not sync user profile:', err);
        });
    }
  }, [currentView]);

  // Expose replay intro helper for dev/testing
  useEffect(() => {
    window.replayIntro = () => setShowIntro(true);
  }, []);

  // ── Auth Handlers ──────────────────────────────────────
  const handleAuthSuccess = (userData) => {
    setUser(userData);
    const introPlayed = sessionStorage.getItem('eqverse_intro_played');
    if (!introPlayed) {
      setShowIntro(true);
    } else {
      setCurrentView('arena');
    }
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem('eqverse_intro_played', 'true');
    setShowIntro(false);
    setCurrentView('arena');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('eqverse_intro_played');
    logoutUser();
    setUser(null);
    setActiveBattle(null);
    setBattleResult(null);
    setShowIntro(false);
    setCurrentView('auth');
  };

  // ── Navigation Handlers ────────────────────────────────
  const handleStartBattle = (battleData) => {
    setActiveBattle(battleData);
    setBattleResult(null);
    setCurrentView('battle');
  };

  const handleBattleEnd = (result) => {
    setBattleResult(result);
    setCurrentView('report');
  };

  const handleBackToArena = () => {
    setActiveBattle(null);
    setBattleResult(null);
    setCurrentView('arena');
  };

  // ── Render Current View ────────────────────────────────
  const renderView = () => {
    switch (currentView) {
      case 'auth':
        return <AuthScreen onAuthSuccess={handleAuthSuccess} />;

      case 'arena':
        return (
          <ArenaHome
            user={user}
            onStartBattle={handleStartBattle}
          />
        );

      case 'battle':
        return (
          <BattleArena
            battleData={activeBattle}
            onBattleEnd={handleBattleEnd}
            onForfeit={handleBackToArena}
          />
        );

      case 'report':
        return (
          <BattleReport
            result={battleResult}
            onBackToArena={handleBackToArena}
          />
        );

      default:
        return <ArenaHome user={user} onStartBattle={handleStartBattle} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0B0E] arena-bg flex flex-col text-[#E2E2EA]">
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      {currentView !== 'auth' && (
        <Navbar user={user} onLogout={handleLogout} onHome={handleBackToArena} />
      )}
      <main className="flex-1 w-full flex flex-col">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
