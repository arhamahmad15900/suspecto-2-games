/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { GameProvider, useGame } from './context/GameContext.js';
import { SketchioProvider, useSketchio } from './context/SketchioContext.js';
import { Navbar } from './components/Navbar.js';
import { HomePage } from './components/HomePage.js';
import { PictoPage } from './components/PictoPage.js';
import { SketchioPage } from './components/SketchioPage.js';
import { SketchioLobbyView } from './components/sketchio/SketchioLobbyView.js';
import { SketchioWordSelectView } from './components/sketchio/SketchioWordSelectView.js';
import { SketchioDrawingView } from './components/sketchio/SketchioDrawingView.js';
import { SketchioRoundResultsView } from './components/sketchio/SketchioRoundResultsView.js';
import { SketchioGameOverView } from './components/sketchio/SketchioGameOverView.js';
import { LobbyView } from './components/LobbyView.js';
import { RoleRevealView } from './components/RoleRevealView.js';
import { DrawingCanvas } from './components/DrawingCanvas.js';
import { VotingView } from './components/VotingView.js';
import { VoteResultsView } from './components/VoteResultsView.js';
import { ImposterGuessView } from './components/ImposterGuessView.js';
import { GameOverView } from './components/GameOverView.js';
import { CustomCursor } from './components/CustomCursor.js';
import { RegisterPage } from './components/RegisterPage.js';
import { AuthModal } from './components/AuthModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { CreateRoomModal } from './components/CreateRoomModal.js';
import { JoinRoomModal } from './components/JoinRoomModal.js';
import { HowToPlayModal } from './components/HowToPlayModal.js';
import { RulesModal } from './components/RulesModal.js';
import { MatchHistoryModal } from './components/MatchHistoryModal.js';
import { RoomChat } from './components/RoomChat.js';
import { useAuth } from './context/AuthContext.js';
import { AlertCircle, X } from 'lucide-react';

// Top-level pages (outside any active game room)
type MainPage = 'home' | 'picto' | 'sketchio';

const GameContent: React.FC = () => {
  const { user } = useAuth();
  const { roomState, errorMessage, clearError, connectionStatus } = useGame();
  const { skRoomState, skLeave } = useSketchio();

  // ── Page navigation state ──────────────────────────────────────────────
  const [mainPage, setMainPage] = useState<MainPage>('home');

  // ── Auth / register flow ───────────────────────────────────────────────
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isRegisterPageOpen, setIsRegisterPageOpen] = useState(false);
  const [registerInitialMode, setRegisterInitialMode] = useState<'register' | 'login'>('register');
  const [pendingAction, setPendingAction] = useState<
    { type: 'create' } | { type: 'join'; code: string } | null
  >(null);

  // ── Modal visibility ───────────────────────────────────────────────────
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinInitialCode, setJoinInitialCode] = useState('');
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // ── URL param handling: ?room=CODE or ?view=register ───────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const clean = roomParam.toUpperCase();
      setJoinInitialCode(clean);
      // Deep-link into Picto so the join flow is in the right context
      setMainPage('picto');
      if (!user) {
        setAuthNotice(`You must be logged in to join room ${clean}. Please sign in or create an account.`);
        setPendingAction({ type: 'join', code: clean });
        setIsAuthOpen(true);
      } else {
        setIsJoinOpen(true);
      }
    }

    const viewParam = params.get('view');
    if (viewParam === 'register' || viewParam === 'login' || viewParam === 'signup') {
      setRegisterInitialMode(viewParam === 'login' ? 'login' : 'register');
      setIsRegisterPageOpen(true);
    }
  }, [user]);

  // ── Shared action handlers ─────────────────────────────────────────────
  const handleOpenCreate = () => {
    if (!user) {
      setAuthNotice('You must be logged in to create and host a game room. Please sign in or register.');
      setPendingAction({ type: 'create' });
      setIsAuthOpen(true);
      return;
    }
    setIsCreateOpen(true);
  };

  const openJoinWithCode = (code?: string) => {
    const targetCode = code || '';
    if (!user) {
      setAuthNotice(
        targetCode
          ? `You must be logged in to join room ${targetCode}. Please sign in or register.`
          : 'You must be logged in to join a game room. Please sign in or register.'
      );
      setPendingAction({ type: 'join', code: targetCode });
      setIsAuthOpen(true);
      return;
    }
    setJoinInitialCode(targetCode);
    setIsJoinOpen(true);
  };

  const handleAuthSuccess = () => {
    if (pendingAction) {
      if (pendingAction.type === 'create') {
        setIsCreateOpen(true);
      } else if (pendingAction.type === 'join') {
        setJoinInitialCode(pendingAction.code);
        setIsJoinOpen(true);
      }
      setPendingAction(null);
    }
    setAuthNotice(null);
  };

  const openAuthAsLogin = (msg?: string) => {
    setAuthNotice(msg || 'Please sign in or register to host or join a room.');
    setRegisterInitialMode('login');
    setIsRegisterPageOpen(true);
  };

  // ── Main view router ───────────────────────────────────────────────────
  const renderMainView = () => {
    // Sketchio active game — takes priority over page navigation
    if (skRoomState) {
      switch (skRoomState.phase) {
        case 'LOBBY':         return <SketchioLobbyView />;
        case 'WORD_SELECT':   return <SketchioWordSelectView />;
        case 'DRAWING':       return <SketchioDrawingView />;
        case 'ROUND_RESULTS': return <SketchioRoundResultsView />;
        case 'GAME_OVER':     return <SketchioGameOverView onGoHome={() => setMainPage('home')} />;
        default:              return <SketchioLobbyView />;
      }
    }

    // Picto active game room — phases take full priority
    if (roomState) {
      switch (roomState.phase) {
        case 'LOBBY':          return <LobbyView />;
        case 'ROLE_REVEAL':    return <RoleRevealView />;
        case 'DRAWING':        return <DrawingCanvas />;
        case 'VOTING':         return <VotingView />;
        case 'VOTE_RESULTS':   return <VoteResultsView />;
        case 'IMPOSTER_GUESS': return <ImposterGuessView />;
        case 'GAME_OVER':      return <GameOverView />;
        default:               return <LobbyView />;
      }
    }

    // Auth / register overlay (sits above both landing pages)
    if (isRegisterPageOpen) {
      return (
        <RegisterPage
          onBackToHome={() => setIsRegisterPageOpen(false)}
          onSuccessRedirect={() => {
            setIsRegisterPageOpen(false);
            handleAuthSuccess();
          }}
          initialMode={registerInitialMode}
        />
      );
    }

    // Sketchio landing page
    if (mainPage === 'sketchio') {
      return (
        <SketchioPage
          onGoHome={() => setMainPage('home')}
          onOpenRegister={() => { setRegisterInitialMode('register'); setIsRegisterPageOpen(true); }}
          onOpenAuth={openAuthAsLogin}
        />
      );
    }

    // Picto game lobby
    if (mainPage === 'picto') {
      return (
        <PictoPage
          onOpenCreate={handleOpenCreate}
          onOpenJoin={openJoinWithCode}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenAuth={openAuthAsLogin}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenRegister={() => {
            setRegisterInitialMode('register');
            setIsRegisterPageOpen(true);
          }}
          onGoHome={() => setMainPage('home')}
        />
      );
    }

    // Main landing page (default)
    return (
      <HomePage
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAuth={openAuthAsLogin}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenRegister={() => {
          setRegisterInitialMode('register');
          setIsRegisterPageOpen(true);
        }}
        onEnterPicto={() => setMainPage('picto')}
        onEnterSketchio={() => setMainPage('sketchio')}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#0F1217] text-[#E6E8EC] flex flex-col selection:bg-[#FFB800] selection:text-[#0F1217]">
      <CustomCursor />
      <Navbar
        onOpenAuth={() => {
          setRegisterInitialMode('login');
          setIsRegisterPageOpen(true);
        }}
        onOpenRegister={() => {
          setRegisterInitialMode('register');
          setIsRegisterPageOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onGoHome={() => {
          setMainPage('home');
          setIsRegisterPageOpen(false);
          skLeave();
        }}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-[#E63946]/15 border-b border-[#E63946]/30 px-4 py-2.5 text-xs text-[#FF9AA2] flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
            <AlertCircle size={16} className="text-[#E63946] shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={clearError}
            className="p-1 hover:bg-[#E63946]/20 rounded cursor-pointer text-[#9AA0AD] hover:text-[#E6E8EC]"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Connection Notice */}
      {connectionStatus === 'connecting' && (
        <div className="bg-[#FFB800]/10 border-b border-[#FFB800]/20 px-4 py-1.5 text-center text-xs text-[#FFB800] font-mono">
          Connecting to real-time game server...
        </div>
      )}

      {/* Main View */}
      <main className="flex-1 flex flex-col">{renderMainView()}</main>

      {/* Global Room Chat Drawer */}
      {roomState && <RoomChat />}

      {/* ── Modals ── */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => { setIsAuthOpen(false); setAuthNotice(null); }}
        message={authNotice}
        onSuccess={handleAuthSuccess}
        onOpenFullRegister={() => {
          setRegisterInitialMode('register');
          setIsRegisterPageOpen(true);
        }}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenAuth={() => {
          setIsProfileOpen(false);
          setAuthNotice(null);
          setIsAuthOpen(true);
        }}
      />
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onRequireAuth={() => {
          setAuthNotice('You must be logged in to create and host a game room.');
          setPendingAction({ type: 'create' });
          setIsAuthOpen(true);
        }}
      />
      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        initialCode={joinInitialCode}
        onRequireAuth={() => {
          setAuthNotice(
            joinInitialCode
              ? `You must be logged in to join room ${joinInitialCode}.`
              : 'You must be logged in to join a game room.'
          );
          setPendingAction({ type: 'join', code: joinInitialCode });
          setIsAuthOpen(true);
        }}
      />
      <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <MatchHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <SketchioProvider>
          <GameContent />
        </SketchioProvider>
      </GameProvider>
    </AuthProvider>
  );
}
