import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, PaletteThemeId, SoundThemeId, PlayerStats, UnlockItem } from './types';
import { PALETTES } from './rendering/themes';
import { AudioEngine } from './core/AudioEngine';
import { StorageService } from './persistence/DB';
import { MenuScene } from './components/MenuScene';
import { GameScene } from './components/GameScene';
import { ResultScene } from './components/ResultScene';
import { StatsModal } from './components/StatsModal';
import { UnlocksModal } from './components/UnlocksModal';
import { SettingsModal } from './components/SettingsModal';

type Scene = 'MENU' | 'GAME' | 'RESULT';

export function App() {
  const [currentScene, setCurrentScene] = useState<Scene>('MENU');
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');

  // Themes & Preferences
  const [paletteId, setPaletteId] = useState<PaletteThemeId>(StorageService.getSavedPalette());
  const [soundId, setSoundId] = useState<SoundThemeId>(StorageService.getSavedSound());
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(StorageService.getHapticsEnabled());
  const [showKeyHints, setShowKeyHints] = useState<boolean>(true);

  // Persistence data
  const [stats, setStats] = useState<PlayerStats>({
    totalGames: { classic: 0, liveboard: 0, reverse: 0, zen: 0 },
    bestScore: { classic: 0, liveboard: 0, reverse: 0, zen: 0 },
    bestTime: { classic: undefined, liveboard: undefined, reverse: undefined, zen: undefined },
    totalSequencesCompleted: 0,
    lastSessions: []
  });
  const [unlocks, setUnlocks] = useState<UnlockItem[]>([]);

  // Result state
  const [lastScore, setLastScore] = useState<number>(0);
  const [lastPreviousBest, setLastPreviousBest] = useState<number>(0);
  const [lastIsNewRecord, setLastIsNewRecord] = useState<boolean>(false);
  const [lastTimeElapsedMs, setLastTimeElapsedMs] = useState<number>(0);

  // Modals
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isUnlocksOpen, setIsUnlocksOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const audioEngine = AudioEngine.getInstance();

  // Load database & initial stats
  const refreshStats = useCallback(async () => {
    await StorageService.init();
    const loadedStats = await StorageService.getPlayerStats();
    setStats(loadedStats);
    const loadedUnlocks = await StorageService.getUnlocks();
    setUnlocks(loadedUnlocks);
  }, []);

  useEffect(() => {
    refreshStats();
    audioEngine.setSoundTheme(soundId);
    audioEngine.setVolume(volume);

    // Resume AudioContext on first user touch / keydown
    const handleFirstGesture = () => {
      audioEngine.init();
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [refreshStats, soundId, volume, audioEngine]);

  // Palette switch
  const handleSelectPalette = (id: PaletteThemeId) => {
    setPaletteId(id);
    StorageService.setSavedPalette(id);
  };

  // Sound theme switch
  const handleSelectSound = (id: SoundThemeId) => {
    setSoundId(id);
    audioEngine.setSoundTheme(id);
    StorageService.setSavedSound(id);
  };

  // Volume change
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
    if (isMuted && vol > 0) {
      setIsMuted(false);
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  // Haptics toggle
  const handleToggleHaptics = (enabled: boolean) => {
    setHapticsEnabled(enabled);
    StorageService.setHapticsEnabled(enabled);
  };

  // Fullscreen toggle
  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        if (screen.orientation && 'lock' in screen.orientation) {
          (screen.orientation as any).lock('portrait').catch(() => {});
        }
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored
    }
  };

  // Game lifecycle
  const handleStartGame = (mode: GameMode) => {
    audioEngine.resumeContext();
    setSelectedMode(mode);
    setCurrentScene('GAME');
  };

  const handleFinishGame = (finalScore: number, isNewRecord: boolean, timeElapsedMs: number) => {
    setLastScore(finalScore);
    setLastPreviousBest(stats.bestScore[selectedMode] || 0);
    setLastIsNewRecord(isNewRecord);
    setLastTimeElapsedMs(timeElapsedMs);
    setCurrentScene('RESULT');
    refreshStats();
  };

  const handlePlayAgain = () => {
    audioEngine.resumeContext();
    setCurrentScene('GAME');
  };

  const handleBackToMenu = () => {
    setCurrentScene('MENU');
    refreshStats();
  };

  const activePalette = PALETTES[paletteId] || PALETTES.default;

  return (
    <div className="min-h-[100dvh] w-full bg-[#050509] text-[#E8ECF2] flex flex-col justify-between overflow-x-hidden select-none pb-[env(safe-area-inset-bottom)]">
      {/* Background Subtle Atmosphere */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111422] via-[#050509] to-[#020205] pointer-events-none -z-10" />

      {/* Main Scene Switcher */}
      {currentScene === 'MENU' && (
        <MenuScene
          palette={activePalette}
          stats={stats}
          onStartGame={handleStartGame}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenUnlocks={() => setIsUnlocksOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {currentScene === 'GAME' && (
        <GameScene
          mode={selectedMode}
          palette={activePalette}
          previousBest={stats.bestScore[selectedMode] || 0}
          hapticsEnabled={hapticsEnabled}
          showKeyHints={showKeyHints}
          onFinishGame={handleFinishGame}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {currentScene === 'RESULT' && (
        <ResultScene
          score={lastScore}
          previousBest={lastPreviousBest}
          isNewRecord={lastIsNewRecord}
          mode={selectedMode}
          palette={activePalette}
          timeElapsedMs={lastTimeElapsedMs}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {/* Modals */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
      />

      <UnlocksModal
        isOpen={isUnlocksOpen}
        onClose={() => setIsUnlocksOpen(false)}
        unlocks={unlocks}
        currentPalette={paletteId}
        currentSound={soundId}
        onSelectPalette={handleSelectPalette}
        onSelectSound={handleSelectSound}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={handleToggleHaptics}
        showKeyHints={showKeyHints}
        onToggleKeyHints={setShowKeyHints}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </div>
  );
}

export default App;
