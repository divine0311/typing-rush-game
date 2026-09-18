import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameCanvas } from './components/GameCanvas';
import { GameEngine } from './lib/GameEngine';
import { UIState } from './types';
import { audio } from './lib/audio';
import { Play, RotateCcw, ChevronLeft, LogOut, Pause, Volume2, VolumeX, Keyboard, Rabbit, Settings, X } from 'lucide-react';
import { MobileKeyboard } from './components/MobileKeyboard';


const TypewriterText = ({ text, className, style }: { text: string, className?: string, style?: any }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let i = 0;
    let isDeleting = false;
    let timeoutId: any;
    
    const type = () => {
      setDisplayText(text.substring(0, i));
      
      if (!isDeleting && i === text.length) {
        timeoutId = setTimeout(() => {
          isDeleting = true;
          type();
        }, 2000);
      } else if (isDeleting && i === 0) {
        isDeleting = false;
        timeoutId = setTimeout(type, 500);
      } else {
        if (isDeleting) {
          i--;
          timeoutId = setTimeout(type, 50);
        } else {
          i++;
          timeoutId = setTimeout(type, 150);
        }
      }
    };
    
    timeoutId = setTimeout(type, 500);
    return () => clearTimeout(timeoutId);
  }, [text]);

  return (
    <span className={className} style={style}>
      {displayText}
      <span className="animate-pulse border-r-[0.15em] border-current ml-1" style={{ display: 'inline-block', height: '0.9em', transform: 'translateY(0.1em)' }}></span>
    </span>
  );
};

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const [uiState, setUiState] = useState<UIState>({
    state: 'START',
    score: 0,
    lives: 3,
    level: 1,
    combo: 0,
    accuracy: 100,
    wpm: 0,
  });

  // Local high score and max level persistence
  const [highScore, setHighScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState(1);
  const [showSplash, setShowSplash] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [volume, setVolumeState] = useState(50);
  const [showTouchKeyboard, setShowTouchKeyboard] = useState(false);
  const [isKeyboardCollapsed, setIsKeyboardCollapsed] = useState(false);

  const handleVolumeChange = (newVal: number) => {
    setVolumeState(newVal);
    audio.setVolume(newVal / 100);
    if (newVal > 0 && !isAudioEnabled) {
      setIsAudioEnabled(audio.toggleMute());
    }
  };

  // Auto-detect mobile / touch devices
  useEffect(() => {
    const checkTouch = () => {
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth <= 820;
      setShowTouchKeyboard(isTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  // Sync player position & bottom margin with GameEngine when keyboard is visible
  useEffect(() => {
    if (engineRef.current) {
      if (showTouchKeyboard && !isKeyboardCollapsed && uiState.state === 'PLAYING') {
        engineRef.current.setBottomPadding(240);
      } else {
        engineRef.current.setBottomPadding(70);
      }
    }
  }, [showTouchKeyboard, isKeyboardCollapsed, uiState.state]);

  useEffect(() => {
    const handleGlobalInteraction = () => {
      if (isAudioEnabled) {
        audio.init();
      }
    };
    window.addEventListener('click', handleGlobalInteraction);
    window.addEventListener('keydown', handleGlobalInteraction);
    window.addEventListener('touchstart', handleGlobalInteraction, { passive: true });
    return () => {
      window.removeEventListener('click', handleGlobalInteraction);
      window.removeEventListener('keydown', handleGlobalInteraction);
      window.removeEventListener('touchstart', handleGlobalInteraction);
    };
  }, [isAudioEnabled]);

  useEffect(() => {
    const storedScore = localStorage.getItem('typing_rush_high_score') || localStorage.getItem('cosmic_high_score');
    if (storedScore) {
      setHighScore(parseInt(storedScore, 10));
    }
    const storedLevel = localStorage.getItem('typing_rush_max_level') || localStorage.getItem('cosmic_max_level');
    if (storedLevel) {
      setMaxLevel(parseInt(storedLevel, 10));
    }
  }, []);

  useEffect(() => {
    if (uiState.state === 'GAME_OVER' && uiState.score > highScore) {
      setHighScore(uiState.score);
      localStorage.setItem('typing_rush_high_score', uiState.score.toString());
    }
    if (uiState.level > maxLevel) {
      setMaxLevel(uiState.level);
      localStorage.setItem('typing_rush_max_level', uiState.level.toString());
    }
  }, [uiState.state, uiState.score, highScore, uiState.level, maxLevel]);

  const showLevelSelect = () => {
    engineRef.current?.setLevelSelect();
  };

  const startGame = (level: number = 1) => {
    audio.init();
    audio.playGameStart();
    engineRef.current?.startGame(level);
  };

  const resumeGame = () => {
    engineRef.current?.togglePause();
  };

  const openNativeKeyboard = () => {
    hiddenInputRef.current?.focus();
  };

  // Safe defaults for buffers
  const freezeActive = (uiState.activeBuffs?.freeze ?? 0) > 0;
  const freezePercent = freezeActive ? ((uiState.activeBuffs?.freeze ?? 0) / 5000) * 100 : 0;
  const bombReady = true; // For visual sake in this theme
  const hasShield = uiState.activeBuffs?.shield ?? false;
  const doubleActive = (uiState.activeBuffs?.double ?? 0) > 0;
  
  const untypedCommand = uiState.targetWord && uiState.typedWord 
    ? uiState.targetWord.substring(uiState.typedWord.length)
    : '_ _ _ _ _ _ _';

  return (
    <div
      className="w-full h-screen bg-[#060415] text-white font-mono overflow-hidden relative select-none"
    >
      {/* Background Lighting Effects */}
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Righteous&family=Press+Start+2P&display=swap');
        .font-design {
          font-family: 'Righteous', cursive;
        }
      `}</style>
<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Deep Space Ambient Nebulas */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 0.9, 1.1, 1],
            opacity: [0.15, 0.35, 0.2, 0.3, 0.15],
            x: [-30, 30, -15, 15, -30],
            y: [-20, 20, 30, -30, -20]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-25%] left-[-25%] w-[90%] h-[90%] bg-gradient-to-tr from-purple-600/25 via-pink-500/10 to-indigo-800/20 rounded-full blur-[140px] mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            scale: [1.1, 0.85, 1.2, 1, 1.1],
            opacity: [0.1, 0.3, 0.15, 0.25, 0.1],
            x: [30, -30, 20, -20, 30],
            y: [20, -20, -10, 10, 20]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-gradient-to-br from-cyan-500/20 via-blue-600/15 to-purple-900/20 rounded-full blur-[140px] mix-blend-screen"
        />

        {/* Cybernetic Grid Layer with Perspective */}
        <div 
          className="absolute inset-0 z-0 opacity-25" 
          style={{
            backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.18) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(139, 92, 246, 0.18) 1.5px, transparent 1.5px)',
            backgroundSize: '45px 45px',
            maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)'
          }}
        />

        {/* Deep Starfield Grids */}
        <div className="absolute top-0 left-0 w-full h-full opacity-15" style={{ backgroundImage: 'radial-gradient(#ffffff 1.2px, transparent 1.2px)', backgroundSize: '60px 60px' }}></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5" style={{ backgroundImage: 'radial-gradient(#ffffff 0.8px, transparent 0.8px)', backgroundSize: '25px 25px' }}></div>

        {/* Floating Twinkling Stars (Drifting Clusters) */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_8px_#fff]"
            style={{
              top: `${10 + i * 8}%`,
              left: `${5 + (i * 13) % 90}%`,
            }}
            animate={{
              scale: [0.2, 1.2, 0.2],
              opacity: [0.15, 0.95, 0.15],
              y: [-8, 8, -8]
            }}
            transition={{
              duration: 2.5 + (i % 4) * 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4
            }}
          />
        ))}
      </div>
      
      {/* Game Canvas */}
      <div className="absolute inset-0 z-10">
        <GameCanvas onUIUpdate={setUiState} engineRef={engineRef} />
      </div>

      {/* Global Top-Right Settings & Volume Control (Visible on EVERY page EXCEPT the hero splash page) */}
      <AnimatePresence>
      {!showSplash && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-2 sm:top-3 right-2.5 sm:right-4 z-[90] flex flex-col items-end pointer-events-auto select-none"
        >
          <div className="flex items-center gap-1 p-1 bg-black/80 backdrop-blur-md border border-cyan-500/40 rounded-lg shadow-[0_0_20px_rgba(0,242,255,0.25)]">
            {/* Quick Volume On/Off toggle icon button */}
            <button
              onClick={() => {
                audio.playButtonClick();
                setIsAudioEnabled(audio.toggleMute());
              }}
              onMouseEnter={() => audio.playButtonHover()}
              className={`p-1.5 sm:p-2 rounded transition-all flex items-center justify-center cursor-pointer ${
                isAudioEnabled 
                  ? 'text-cyan-400 hover:text-white hover:bg-cyan-500/20' 
                  : 'text-red-400 hover:text-red-300 hover:bg-red-500/20 bg-red-950/40'
              }`}
              title={isAudioEnabled ? "Sound: ON (Click to turn off)" : "Sound: OFF (Click to turn on)"}
              aria-label="Toggle Sound"
            >
              {isAudioEnabled ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              )}
            </button>

            <div className="w-px h-4 bg-cyan-500/30"></div>

            {/* Settings button */}
            <button
              onClick={() => {
                audio.playButtonClick();
                setShowSettingsModal(prev => !prev);
              }}
              onMouseEnter={() => audio.playButtonHover()}
              className={`p-1.5 sm:p-2 rounded transition-all flex items-center gap-1 cursor-pointer ${
                showSettingsModal 
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/80 shadow-[0_0_10px_rgba(0,242,255,0.4)]' 
                  : 'text-cyan-400 hover:text-white hover:bg-cyan-500/20'
              }`}
              title="Settings / Audio Options"
              aria-label="Open Settings"
            >
              <Settings className={`w-4 h-4 sm:w-5 sm:h-5 ${showSettingsModal ? 'rotate-90 text-cyan-300' : ''} transition-transform duration-300`} />
            </button>
          </div>

          {/* Cyberpunk Audio Settings Modal / Popover */}
          <AnimatePresence>
            {showSettingsModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ duration: 0.2 }}
                className="mt-2 w-72 sm:w-80 bg-[#0a0720]/95 backdrop-blur-xl border-2 border-cyan-500/50 p-4 sm:p-5 rounded-lg shadow-[0_0_35px_rgba(0,242,255,0.3)] text-left relative overflow-hidden"
              >
                {/* Tech corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>

                <div className="flex items-center justify-between pb-2 mb-3 border-b border-cyan-500/30">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400 tracking-widest uppercase">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <span>SYSTEM AUDIO</span>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
                    title="Close Settings"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume ON/OFF Toggle Button */}
                <div className="mb-4">
                  <div className="text-[10px] uppercase font-mono text-cyan-400/80 tracking-widest mb-1.5">Master Sound State</div>
                  <button
                    onClick={() => {
                      audio.playButtonClick();
                      setIsAudioEnabled(audio.toggleMute());
                    }}
                    className={`w-full py-2.5 px-3 rounded flex items-center justify-between font-mono text-xs font-bold tracking-wider transition-all border cursor-pointer ${
                      isAudioEnabled
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                        : 'bg-red-950/40 border-red-500/50 text-red-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isAudioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400 fill-current" /> : <VolumeX className="w-4 h-4 text-red-400 fill-current" />}
                      <span>AUDIO OUTPUT</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      isAudioEnabled ? 'bg-cyan-400 text-black' : 'bg-red-500 text-white'
                    }`}>
                      {isAudioEnabled ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>

                {/* Volume Level Slider */}
                <div className="mb-2">
                  <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-slate-300 mb-1.5">
                    <span className="uppercase text-cyan-400/80">Master Volume:</span>
                    <span className="text-cyan-400 font-bold">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="text-[9px] font-mono text-cyan-400/60 mt-3 pt-2 border-t border-cyan-500/20 text-center uppercase tracking-widest">
                  Music starts from 0.15s in loop
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Top HUD: Mission Header */}
      <AnimatePresence>
      {uiState.state !== 'START' && uiState.state !== 'LEVEL_SELECT' && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="absolute top-0 left-0 w-full h-14 sm:h-16 border-b border-cyan-500/30 bg-black/60 backdrop-blur-md flex items-center justify-between px-2.5 sm:px-6 md:px-8 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            <button 
              onClick={() => { audio.playButtonClick(); engineRef.current?.setStartScreen(); }}
              onMouseEnter={() => audio.playButtonHover()}
              className="p-1 sm:p-1.5 text-cyan-400/70 hover:text-cyan-400 pointer-events-auto transition-colors rounded hover:bg-cyan-950/40"
              title="Main Menu"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            <motion.div 
              animate={{
                filter: [
                  'drop-shadow(0 0 5px rgba(56, 189, 248, 0.5))',
                  'drop-shadow(0 0 15px rgba(56, 189, 248, 0.9))',
                  'drop-shadow(0 0 5px rgba(56, 189, 248, 0.5))'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-sky-400 text-lg sm:text-2xl md:text-3xl font-design tracking-wide"
            >
              <TypewriterText text="Typing Rush" />
            </motion.div>
            <div className="hidden sm:block h-6 sm:h-8 w-px bg-cyan-500/30"></div>
            <div className="hidden sm:flex flex-col">
              <span className="text-[9px] text-cyan-400/60 uppercase tracking-widest">Mission Task</span>
              <span className="text-xs sm:text-sm font-bold">TASK {uiState.level.toString().padStart(2, '0')} // NEBULA REACH</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 md:gap-8 pointer-events-auto pr-24 sm:pr-28">
            <div className="text-right sm:text-center">
              <div className="text-[9px] text-cyan-400/60 uppercase">Score</div>
              <div className="text-base sm:text-xl md:text-2xl font-bold text-white leading-none">{uiState.score.toLocaleString()}</div>
            </div>
            
            <div className="hidden lg:block text-center">
              <div className="text-[9px] text-cyan-400/60 uppercase">High Score</div>
              <div className="text-lg font-bold text-cyan-200/50 leading-none">{highScore.toLocaleString()}</div>
            </div>

            <div className="flex gap-1 items-center">
              {Array.from({ length: Math.max(3, uiState.lives) }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 sm:w-3 h-4 sm:h-6 ${i < uiState.lives ? 'bg-cyan-500 shadow-[0_0_8px_#00f2ff]' : 'border border-cyan-500/30'}`}
                ></div>
              ))}
              <span className="ml-1 text-[11px] sm:text-xs text-cyan-400 hidden xs:inline">x{uiState.lives}</span>
            </div>

            {/* Mobile / Touch On-Screen Keyboard Toggle */}
            <button
              onClick={() => {
                audio.playButtonClick();
                setShowTouchKeyboard(prev => !prev);
              }}
              onMouseEnter={() => audio.playButtonHover()}
              className={`p-1.5 sm:p-2 border rounded pointer-events-auto transition-all text-xs shadow-[0_0_15px_rgba(0,242,255,0.15)] ${
                showTouchKeyboard
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                  : 'bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-500/30 text-cyan-400/60 hover:text-white'
              }`}
              title={showTouchKeyboard ? "Hide Touch Keypad" : "Show Touch Keypad"}
            >
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {(uiState.state === 'PLAYING' || uiState.state === 'PAUSED') && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { audio.playButtonClick(); engineRef.current?.togglePause(); }}
                onMouseEnter={() => audio.playButtonHover()}
                className="p-1.5 sm:p-2 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white rounded pointer-events-auto transition-all flex items-center gap-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(0,242,255,0.15)]"
                title={uiState.state === 'PAUSED' ? "Resume Game" : "Pause Game"}
              >
                {uiState.state === 'PAUSED' ? (
                  <>
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-green-400 animate-pulse" />
                    <span className="hidden xs:inline">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-yellow-400" />
                    <span className="hidden xs:inline">Pause</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Mobile Mini Telemetry Ribbon (< md screens) */}
      <AnimatePresence>
      {uiState.state !== 'START' && uiState.state !== 'LEVEL_SELECT' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex md:hidden absolute top-14 left-0 w-full h-7 px-3 bg-black/70 backdrop-blur-sm border-b border-cyan-500/20 items-center justify-between z-40 text-[10px] text-slate-300 pointer-events-none"
        >
          <div className="flex items-center gap-3">
            <div>ACC: <span className="text-magenta-400 font-bold">{uiState.accuracy}%</span></div>
            <div>WPM: <span className="text-blue-400 font-bold">{uiState.wpm}</span></div>
            <div>COMBO: <span className="text-yellow-400 font-bold">x{uiState.combo}</span></div>
          </div>
          <div className="flex items-center gap-1.5">
            {freezeActive && <span className="px-1 py-0.5 bg-cyan-500/30 border border-cyan-400 text-cyan-300 rounded text-[9px] font-bold">FRZ</span>}
            {doubleActive && <span className="px-1 py-0.5 bg-yellow-500/30 border border-yellow-400 text-yellow-300 rounded text-[9px] font-bold">2X</span>}
            {hasShield && <span className="px-1 py-0.5 bg-purple-500/30 border border-purple-400 text-purple-300 rounded text-[9px] font-bold">SHD</span>}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Left Sidebar: Performance Stats (Desktop md+) */}
      <AnimatePresence>
      {uiState.state !== 'START' && uiState.state !== 'LEVEL_SELECT' && (
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:flex absolute top-24 left-4 md:left-6 w-44 md:w-48 flex-col gap-4 z-40 pointer-events-none"
        >
          <div className="p-3 border-l-2 border-magenta-500 bg-black/40 backdrop-blur-sm">
            <div className="text-[10px] text-magenta-400 uppercase">Accuracy</div>
            <div className="text-2xl font-bold">{uiState.accuracy}<span className="text-xs opacity-50">%</span></div>
            <div className="w-full bg-gray-800 h-1 mt-1">
              <div className="bg-magenta-500 h-full" style={{ width: `${uiState.accuracy}%` }}></div>
            </div>
          </div>
          <div className="p-3 border-l-2 border-blue-400 bg-black/40 backdrop-blur-sm">
            <div className="text-[10px] text-blue-400 uppercase">WPM</div>
            <div className="text-2xl font-bold">{uiState.wpm}</div>
          </div>
          <div className="p-3 border-l-2 border-yellow-400 bg-black/40 backdrop-blur-sm">
            <div className="text-[10px] text-yellow-400 uppercase">Combo</div>
            <div className="text-3xl font-black text-yellow-400 italic">x{uiState.combo}</div>
            {uiState.combo < 10 && (
              <div className="text-[10px] text-white/40 mt-1">NEXT MULTIPLIER: {10 - uiState.combo} HITS</div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Right Sidebar: Powerups & Telemetry (Desktop md+) */}
      <AnimatePresence>
      {uiState.state !== 'START' && uiState.state !== 'LEVEL_SELECT' && (
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:flex absolute top-24 right-4 md:right-6 w-44 md:w-48 flex-col gap-4 z-40 pointer-events-none"
        >
          <div className="text-[10px] text-cyan-400/60 uppercase tracking-widest mb-1">Active Buffs</div>
          
          <div className={`flex items-center gap-3 p-2 border rounded ${freezeActive ? 'bg-cyan-500/20 border-cyan-500/40' : 'border-white/10 opacity-40'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${freezeActive ? 'border-cyan-400 animate-pulse' : 'border-white/20'}`}>
              <span className="text-xs">FRZ</span>
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold">FREEZE {freezeActive ? 'TIME' : '(READY)'}</div>
              {freezeActive && (
                <div className="w-full bg-cyan-900/50 h-1 mt-1">
                  <div className="bg-cyan-400 h-full transition-all" style={{ width: `${freezePercent}%` }}></div>
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-3 p-2 border rounded ${doubleActive ? 'bg-yellow-500/20 border-yellow-500/40' : 'border-white/10 opacity-40'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${doubleActive ? 'border-yellow-400 animate-pulse' : 'border-white/20'}`}>
              <span className="text-xs">DBL</span>
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold">DOUBLE DMG</div>
              {doubleActive && (
                <div className="w-full bg-yellow-900/50 h-1 mt-1">
                  <div className="bg-yellow-400 h-full transition-all" style={{ width: `${((uiState.activeBuffs?.double ?? 0) / 10000) * 100}%` }}></div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Hidden Native Mobile Keyboard Input Handler */}
      <input
        ref={hiddenInputRef}
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Typing input field"
        className="opacity-0 absolute -top-96 left-0 pointer-events-none w-1 h-1"
        onChange={(e) => {
          const val = e.target.value;
          if (val.length > 0) {
            const lastChar = val[val.length - 1];
            engineRef.current?.typeLetter(lastChar);
            e.target.value = '';
          }
        }}
      />

      {/* Player: Core Ship UI (Bottom Command Bar & Mobile Keypad) */}
      <AnimatePresence>
      {uiState.state === 'PLAYING' && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`absolute left-0 right-0 z-40 flex flex-col items-center pointer-events-none transition-all duration-300 ${
            showTouchKeyboard && !isKeyboardCollapsed ? 'bottom-2 px-2' : 'bottom-4 sm:bottom-8 px-2'
          }`}
        >
          {/* Decorative Shield / Core UI */}
          {!showTouchKeyboard && (
            <div className="relative mb-2 sm:mb-4 hidden sm:block">
              <div className={`w-24 h-24 sm:w-32 sm:h-32 border-2 rounded-full flex items-center justify-center ${hasShield ? 'border-purple-500/60 shadow-[0_0_20px_#a855f7]' : 'border-cyan-500/20'}`}>
                <div className="w-18 h-18 sm:w-24 sm:h-24 border border-cyan-500/40 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '8s' }}>
                   <div className="w-2 h-2 bg-cyan-400 absolute top-0 rounded-full"></div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-10 h-14 sm:w-12 sm:h-16 bg-cyan-500 shadow-[0_0_30px_#a855f7] flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%)' }}>
                 </div>
              </div>
            </div>
          )}

          {/* Command Input Bar */}
          <div 
            onClick={openNativeKeyboard}
            className={`w-[96vw] max-w-md sm:w-96 h-12 sm:h-14 bg-black/80 border-2 flex items-center px-3 sm:px-4 gap-3 pointer-events-auto cursor-pointer rounded transition-all ${
              uiState.targetWord 
                ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,242,255,0.4)]' 
                : 'border-cyan-500/50 shadow-[0_0_15px_rgba(0,242,255,0.15)]'
            }`}
          >
            <div className="text-cyan-400 animate-pulse shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div className="flex-1 text-lg sm:text-2xl font-black tracking-widest flex items-center overflow-hidden">
              <span className="text-cyan-400">{uiState.typedWord?.toUpperCase()}</span>
              {uiState.typedWord && <div className="w-[2px] sm:w-[3px] h-6 sm:h-8 bg-cyan-400 mx-1 animate-pulse"></div>}
              <span className="opacity-25 whitespace-nowrap">{untypedCommand.toUpperCase().split('').join(' ')}</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-cyan-400/60 font-bold shrink-0">
              INPUT.SYS
            </div>
          </div>

          {/* Touch Cyber Keyboard on Mobile / Tablet */}
          {showTouchKeyboard && (
            <div className="w-full mt-1.5 sm:mt-2">
              <MobileKeyboard
                onKeyPress={(char) => engineRef.current?.typeLetter(char)}
                onTogglePause={() => engineRef.current?.togglePause()}
                isPaused={uiState.state === 'PAUSED'}
                targetWord={uiState.targetWord}
                typedWord={uiState.typedWord}
                onOpenNativeKeyboard={openNativeKeyboard}
                isCollapsed={isKeyboardCollapsed}
                onToggleCollapse={() => setIsKeyboardCollapsed(prev => !prev)}
              />
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Bottom Peripheral Info */}
      <AnimatePresence>
      {uiState.state !== 'START' && uiState.state !== 'LEVEL_SELECT' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-4 left-0 w-full px-8 flex items-center justify-between z-40 pointer-events-none"
        >
          <div className="text-[9px] uppercase tracking-[0.4em]">System Status: Nominal // Signal: 100% // Frame: 60FPS</div>
          <div className="text-[9px] uppercase tracking-[0.4em]">Encryption: Active // Buffer: Clear</div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

      {/* Center Message */}
      <AnimatePresence>
      {uiState.message && uiState.state === 'PLAYING' && (
        <motion.div 
          initial={{ scale: 0.5, opacity: 0, y: '-50%', x: '-50%' }}
          animate={{ scale: 1, opacity: 1, y: '-50%', x: '-50%' }}
          exit={{ scale: 1.5, opacity: 0, y: '-50%', x: '-50%' }}
          className="absolute top-1/3 left-1/2 pointer-events-none z-50"
        >
          <h2 className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse font-mono">
            {uiState.message}
          </h2>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Start Screen Overlays */}
      <AnimatePresence mode="wait">
      {uiState.state === 'START' && (
        showSplash ? (
          <motion.div 
            key="splash-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-[#060415]/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 overflow-hidden cursor-pointer"
            onClick={() => { audio.playButtonClick(); setShowSplash(false); }}
            onMouseEnter={() => audio.playButtonHover()}
          >
            {/* Animated Background Lights */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 90, 0]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" 
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.5, 0.2],
                rotate: [0, -90, 0]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute w-[500px] h-[500px] bg-gradient-to-bl from-amber-300/10 via-rose-400/20 to-fuchsia-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" 
            />
            
            <div className="flex flex-col items-center gap-6 relative z-10 p-6 select-none text-center">
              {/* Dynamic decorative line */}
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 240, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#00f2ff]"
              />

              {/* Magnificent Multi-layer Glowing Game Title */}
              <div className="flex flex-col items-center relative px-2">
                {/* Cute Rabbit Icon bouncing */}
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: [0, -15, 0], opacity: 1 }}
                  transition={{ 
                    y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                    opacity: { duration: 1 }
                  }}
                  className="mb-2 sm:mb-4 text-cyan-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                >
                  <Rabbit className="w-12 h-12 sm:w-16 sm:h-16" />
                </motion.div>

                {/* Staggered Word/Letter Animation */}
                <div className="flex gap-2 sm:gap-4 md:gap-6 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-tighter uppercase select-none relative z-10">
                  <div className="flex">
                    {"TYPING".split('').map((char, i) => (
                      <motion.span
                        key={'t-'+i}
                        initial={{ opacity: 0, y: -40, rotateX: 90 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 150, damping: 10 }}
                        className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-500 drop-shadow-[0_0_25px_rgba(168,85,247,0.7)] inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                  <div className="flex">
                    {"RUSH".split('').map((char, i) => (
                      <motion.span
                        key={'r-'+i}
                        initial={{ opacity: 0, y: -40, rotateX: 90 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ delay: 0.6 + (i * 0.1), type: "spring", stiffness: 150, damping: 10 }}
                        className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-500 drop-shadow-[0_0_25px_rgba(168,85,247,0.7)] inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Back glow shadow text (animated similarly) */}
                <div className="flex gap-2 sm:gap-4 md:gap-6 text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-mono tracking-tighter uppercase select-none absolute top-[45px] sm:top-[65px] md:top-[80px] pointer-events-none opacity-50 blur-[10px] sm:blur-[12px]">
                  <div className="flex">
                    {"TYPING".split('').map((char, i) => (
                      <motion.span
                        key={'tb-'+i}
                        initial={{ opacity: 0, y: -40, rotateX: 90 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ delay: i * 0.1, type: "spring", stiffness: 150, damping: 10 }}
                        className="text-cyan-400 inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                  <div className="flex">
                    {"RUSH".split('').map((char, i) => (
                      <motion.span
                        key={'rb-'+i}
                        initial={{ opacity: 0, y: -40, rotateX: 90 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ delay: 0.6 + (i * 0.1), type: "spring", stiffness: 150, damping: 10 }}
                        className="text-cyan-400 inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic decorative line */}
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent shadow-[0_0_15px_#a855f7]"
              />

              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: [0.9, 1, 0.9],
                  scale: [1, 1.08, 1],
                  boxShadow: [
                    "0 0 20px rgba(0,242,255,0.4), inset 0 0 10px rgba(0,242,255,0.2)", 
                    "0 0 50px rgba(0,242,255,0.9), inset 0 0 20px rgba(0,242,255,0.5)", 
                    "0 0 20px rgba(0,242,255,0.4), inset 0 0 10px rgba(0,242,255,0.2)"
                  ]
                }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                className="mt-6 sm:mt-10 px-6 sm:px-10 py-3 sm:py-4 bg-cyan-900/60 border-2 border-cyan-400 rounded-full flex items-center justify-center gap-3 sm:gap-5 cursor-pointer hover:bg-cyan-800 transition-colors pointer-events-auto group"
                onClick={(e) => {
                  e.stopPropagation();
                  audio.playButtonClick();
                  setShowSplash(false);
                }}
              >
                <span className="text-white font-black text-xl sm:text-3xl tracking-[0.15em] uppercase drop-shadow-[0_0_12px_rgba(0,242,255,1)]">
                  CLICK ON ME
                </span>
                <motion.span 
                  animate={{ y: [-8, 8], rotate: [-10, 10], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                  className="text-4xl sm:text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] inline-block"
                >
                  🐱
                </motion.span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="start-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-[#060415]/75 backdrop-blur-xl flex flex-col items-center justify-center z-50 overflow-hidden p-3 sm:p-6"
          >
            {/* Animated Background Scanlines for Start Screen */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 bg-[linear-gradient(rgba(0,242,255,0)_50%,rgba(0,242,255,0.2)_50%)] bg-[length:100%_4px] animate-[scan_10s_linear_infinite]"></div>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex flex-col items-center gap-5 sm:gap-8 w-[95vw] max-w-2xl text-center p-5 sm:p-8 md:p-12 border border-cyan-500/30 bg-black/75 shadow-[0_0_50px_rgba(0,242,255,0.15)] relative backdrop-blur-xl z-10 max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              {/* Corner decorations */}
              <motion.div initial={{ x: -20, y: -20, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-500"></motion.div>
              <motion.div initial={{ x: 20, y: -20, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-500"></motion.div>
              <motion.div initial={{ x: -20, y: 20, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-500"></motion.div>
              <motion.div initial={{ x: 20, y: 20, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-500"></motion.div>

              <motion.h1 
                initial={{ y: -20, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  filter: [
                    'drop-shadow(0 0 15px rgba(56, 189, 248, 0.5))',
                    'drop-shadow(0 0 35px rgba(56, 189, 248, 0.9))',
                    'drop-shadow(0 0 15px rgba(56, 189, 248, 0.5))'
                  ]
                }}
                transition={{ 
                  delay: 0.1,
                  filter: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="text-4xl sm:text-6xl md:text-7xl font-design text-sky-400 tracking-wider"
              >
                <TypewriterText text="TYPING RUSH" />
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-cyan-400/80 text-xs sm:text-sm tracking-widest uppercase flex items-center gap-2 sm:gap-4"
              >
                <span className="w-8 sm:w-12 h-px bg-cyan-500/50"></span>
                Your Mission 👇
                <span className="w-8 sm:w-12 h-px bg-cyan-500/50"></span>
              </motion.p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 text-left text-xs font-mono text-slate-300 w-full mb-3 sm:mb-6 mt-2">
                <motion.div 
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(8, 145, 178, 0.3)" }}
                  className="p-3.5 sm:p-5 border border-cyan-500/30 bg-cyan-950/30 cursor-default transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 border-b border-cyan-500/30 pb-2">
                    <div className="w-2 h-2 bg-cyan-400 animate-pulse"></div>
                    <h3 className="text-cyan-400 font-bold tracking-widest text-xs sm:text-sm">TARGETING.SYS</h3>
                  </div>
                  <p className="leading-relaxed opacity-80">Type the first letter of an enemy to lock on. You must finish the word to target another.</p>
                </motion.div>
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.02, backgroundColor: "rgba(217, 70, 239, 0.15)" }}
                  className="p-3.5 sm:p-5 border border-magenta-500/30 bg-magenta-950/20 cursor-default transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 border-b border-magenta-500/30 pb-2">
                    <div className="w-2 h-2 bg-magenta-400 animate-pulse"></div>
                    <h3 className="text-magenta-400 font-bold tracking-widest text-xs sm:text-sm">POWERUPS.SYS</h3>
                  </div>
                  <p className="leading-relaxed opacity-80">Type the words on powerup orbs to activate them (Shield, Bomb, Freeze, Double).</p>
                </motion.div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2">
                {/* Back Button (Returns to 1st interface / Hero Welcome Screen) */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(255,255,255,0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { audio.playButtonClick(); setShowSplash(true); }}
                  onMouseEnter={() => audio.playButtonHover()}
                  className="px-6 sm:px-9 py-3.5 sm:py-5 bg-slate-900/80 border-2 border-white/20 hover:border-cyan-400 hover:bg-cyan-950/40 text-white/80 hover:text-white font-bold text-lg sm:text-xl transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center gap-2 sm:gap-3 uppercase tracking-[0.15em] rounded cursor-pointer"
                  title="Back to Hero Page"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  Back
                </motion.button>

                {/* Start Button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0,242,255,0.6)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { audio.playButtonClick(); showLevelSelect(); }}
                  onMouseEnter={() => audio.playButtonHover()}
                  className="group relative px-10 sm:px-14 py-3.5 sm:py-5 bg-transparent border-2 border-cyan-400 hover:bg-cyan-400/20 text-cyan-400 font-bold text-xl sm:text-2xl transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)] flex items-center gap-3 sm:gap-4 uppercase tracking-[0.2em] rounded cursor-pointer"
                >
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current group-hover:animate-ping absolute left-6 opacity-0 group-hover:opacity-50" />
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current relative z-10" />
                  Start
                </motion.button>
              </div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-[10px] text-cyan-400/50 uppercase tracking-[0.3em] mt-1"
              >
                Tap on-screen keypad or use keyboard to play
              </motion.p>
            </motion.div>
          </motion.div>
        )
      )}
      </AnimatePresence>

      {/* Level Select Screen */}
      <AnimatePresence>
      {uiState.state === 'LEVEL_SELECT' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, type: "spring", damping: 20 }}
          className="absolute inset-0 bg-[#060415]/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-2 sm:p-4"
        >
          <div 
            className="flex flex-col items-center gap-4 sm:gap-6 w-[96vw] max-w-5xl text-center p-4 sm:p-6 md:p-8 bg-[#0a0720]/90 relative max-h-[92vh] overflow-hidden"
            style={{
              clipPath: 'polygon(3% 0%, 97% 0%, 100% 3%, 100% 97%, 97% 100%, 3% 100%, 0% 97%, 0% 3%)',
              border: '1px solid rgba(0, 242, 255, 0.3)',
              boxShadow: 'inset 0 0 40px rgba(0, 242, 255, 0.1), 0 0 60px rgba(0, 242, 255, 0.2)'
            }}
          >
            {/* Tech borders */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/80 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-purple-400/80 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/80 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-400/80 rounded-br-lg"></div>
            
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5"></div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-mono text-sky-400 tracking-[0.15em] sm:tracking-[0.2em] drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">
              SELECT MISSION TASK
            </h1>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2 sm:gap-3 md:gap-4 w-full mt-2 max-h-[62vh] overflow-y-auto pr-1 sm:pr-4 custom-scrollbar">
              {Array.from({ length: 50 }).map((_, i) => {
                const level = i + 1;
                const isUnlocked = level <= maxLevel;
                
                // Difficulty tier styling
                let tierLabel = 'EASY';
                let tierPrimary = '#10b981';
                let tierSecondary = '#047857';
                
                if (level % 10 === 0) {
                  tierLabel = 'BOSS';
                  tierPrimary = '#f43f5e';
                  tierSecondary = '#be123c';
                } else if (level > 10 && level < 20) {
                  tierLabel = 'MED';
                  tierPrimary = '#f59e0b';
                  tierSecondary = '#b45309';
                } else if (level > 20 && level < 30) {
                  tierLabel = 'HARD';
                  tierPrimary = '#d946ef';
                  tierSecondary = '#a21caf';
                } else if (level > 30 && level < 40) {
                  tierLabel = 'EXP';
                  tierPrimary = '#0ea5e9';
                  tierSecondary = '#0369a1';
                } else if (level > 40 && level < 50) {
                  tierLabel = 'PRO';
                  tierPrimary = '#a855f7';
                  tierSecondary = '#7e22ce';
                } else if (level >= 4 && level < 10) {
                  if (level >= 7) {
                    tierLabel = 'HARD';
                    tierPrimary = '#d946ef';
                    tierSecondary = '#a21caf';
                  } else {
                    tierLabel = 'MED';
                    tierPrimary = '#f59e0b';
                    tierSecondary = '#b45309';
                  }
                }

                return (
                  <motion.button
                    whileHover={isUnlocked ? { scale: 1.05, y: -2, boxShadow: `0 10px 20px -5px ${tierPrimary}60` } : {}}
                    whileTap={isUnlocked ? { scale: 0.95 } : {}}
                    key={level}
                    onClick={() => { if (isUnlocked) { audio.playButtonClick(); startGame(level); } }}
                    onMouseEnter={() => { if (isUnlocked) audio.playButtonHover(); }}
                    disabled={!isUnlocked}
                    style={{
                      borderTop: `2px solid ${isUnlocked ? tierPrimary : '#334155'}`,
                      borderBottom: `2px solid ${isUnlocked ? tierSecondary : '#1e293b'}`,
                      background: isUnlocked 
                        ? `linear-gradient(135deg, ${tierSecondary}30 0%, ${tierPrimary}10 100%)`
                        : 'rgba(15, 23, 42, 0.6)'
                    }}
                    className={`flex flex-col items-center justify-center p-2 sm:p-3 transition-all duration-300 group relative min-h-[72px] sm:min-h-[85px] md:min-h-[95px] w-full rounded-lg ${
                      isUnlocked 
                        ? `cursor-pointer hover:z-10 bg-slate-900/50 backdrop-blur-sm` 
                        : 'opacity-40 cursor-not-allowed grayscale'
                    }`}
                  >
                    {isUnlocked && (
                      <>
                        <div className="absolute top-1 left-1 w-2 h-2 rounded-tl-[4px]" style={{ borderTop: `2px solid ${tierPrimary}`, borderLeft: `2px solid ${tierPrimary}` }}></div>
                        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-br-[4px]" style={{ borderBottom: `2px solid ${tierSecondary}`, borderRight: `2px solid ${tierSecondary}` }}></div>
                      </>
                    )}

                    <div className="flex flex-col items-center z-10">
                      <div 
                        className={`text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black mb-0.5 sm:mb-1`}
                        style={{ color: isUnlocked ? tierPrimary : '#64748b', textShadow: isUnlocked ? `0 0 10px ${tierPrimary}80` : 'none' }}
                      >
                        {isUnlocked ? tierLabel : 'LOCKED'}
                      </div>
                      
                      <div className="flex items-center justify-center my-0.5 sm:my-1">
                        <span 
                          className="text-2xl sm:text-3xl font-black font-sans italic tracking-tighter"
                          style={{ 
                            color: isUnlocked ? '#ffffff' : '#475569',
                            WebkitTextStroke: isUnlocked ? `1px ${tierPrimary}` : '1px #334155',
                            textShadow: isUnlocked ? `2px 2px 0px ${tierSecondary}` : 'none'
                          }}
                        >
                          {level.toString().padStart(2, '0')}
                        </span>
                      </div>
                      
                      <div className="flex gap-1 mt-0.5 opacity-80">
                        <div className="w-3 sm:w-4 h-1 rounded-full" style={{ backgroundColor: isUnlocked ? tierPrimary : '#334155' }}></div>
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: isUnlocked ? tierSecondary : '#334155' }}></div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { audio.playButtonClick(); engineRef.current?.setStartScreen(); }}
              onMouseEnter={() => audio.playButtonHover()}
              className="mt-2 px-6 sm:px-8 py-2.5 sm:py-3 border border-white/20 text-white/60 hover:bg-white/10 hover:text-white font-bold tracking-widest transition-all flex items-center gap-2 uppercase text-xs sm:text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Main Menu
            </motion.button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Pause Screen */}
      <AnimatePresence>
      {uiState.state === 'PAUSED' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#060415]/75 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4"
        >
          <div 
            className="flex flex-col items-center gap-5 sm:gap-6 p-6 sm:p-10 md:p-12 bg-[#0a0720]/90 relative max-w-[94vw] sm:max-w-lg w-full text-center"
            style={{
              clipPath: 'polygon(15px 0%, calc(100% - 15px) 0%, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0% calc(100% - 15px), 0% 15px)',
              border: '1px solid rgba(0, 242, 255, 0.4)',
              boxShadow: 'inset 0 0 40px rgba(0, 242, 255, 0.1), 0 0 50px rgba(0, 242, 255, 0.2)'
            }}
          >
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-cyan-400/80"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-cyan-400/80"></div>
            <h2 className="text-2xl sm:text-4xl font-bold font-mono text-sky-400 tracking-[0.2em] sm:tracking-[0.3em] drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
              SYSTEM PAUSED
            </h2>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-3 sm:mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { audio.playButtonClick(); resumeGame(); }}
                onMouseEnter={() => audio.playButtonHover()}
                className="px-5 sm:px-8 py-2.5 sm:py-3 border-2 border-sky-400 text-sky-400 hover:bg-sky-400/20 font-bold tracking-widest transition-all flex items-center gap-2 uppercase text-xs sm:text-sm"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                Resume
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { audio.playButtonClick(); showLevelSelect(); }}
                onMouseEnter={() => audio.playButtonHover()}
                className="px-5 sm:px-8 py-2.5 sm:py-3 border border-white/20 text-white/60 hover:bg-white/10 hover:text-white font-bold tracking-widest transition-all flex items-center gap-2 uppercase text-xs sm:text-sm"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                Restart
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { audio.playButtonClick(); engineRef.current?.setStartScreen(); }}
                onMouseEnter={() => audio.playButtonHover()}
                className="px-5 sm:px-8 py-2.5 sm:py-3 border border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold tracking-widest transition-all flex items-center gap-2 uppercase text-xs sm:text-sm"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                Menu
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
      {uiState.state === 'GAME_OVER' && (
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#060415]/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4"
        >
          <div 
            className="flex flex-col items-center gap-5 sm:gap-8 p-6 sm:p-10 md:p-12 bg-[#0a0720]/95 max-w-[94vw] sm:max-w-lg w-full text-center relative overflow-hidden"
            style={{
              clipPath: 'polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)',
              border: '2px solid rgba(244, 63, 94, 0.4)',
              boxShadow: 'inset 0 0 50px rgba(244, 63, 94, 0.15), 0 0 60px rgba(244, 63, 94, 0.3)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(244,63,94,0.3)_10px,rgba(244,63,94,0.3)_20px)]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(244,63,94,0.3)_10px,rgba(244,63,94,0.3)_20px)]"></div>
            
            <h2 className="text-3xl sm:text-5xl font-black font-mono text-sky-400 tracking-widest drop-shadow-[0_0_20px_rgba(56,189,248,0.7)]">
              LEVEL FAILED
            </h2>
            
            <div className="w-full bg-sky-400/5 p-4 sm:p-6 border border-sky-400/20">
              <div className="text-2xl sm:text-4xl font-bold text-cyan-400 font-mono mb-4 sm:mb-6 tracking-widest">
                SCORE: {uiState.score.toString().padStart(6, '0')}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4 text-left font-mono text-xs sm:text-sm tracking-widest">
                <div className="text-slate-400 uppercase">Level Reached:</div>
                <div className="text-white text-right">{uiState.level}</div>
                <div className="text-slate-400 uppercase">Final Accuracy:</div>
                <div className="text-purple-400 text-right">{uiState.accuracy}%</div>
                <div className="text-slate-400 uppercase">Typing Speed:</div>
                <div className="text-pink-400 text-right">{uiState.wpm} WPM</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { audio.playButtonClick(); engineRef.current?.setStartScreen(); }}
                onMouseEnter={() => audio.playButtonHover()}
                className="px-5 sm:px-6 py-3 border border-white/20 text-white/60 hover:bg-white/10 hover:text-white font-bold transition-all flex items-center gap-2 uppercase tracking-widest text-xs sm:text-sm"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                Menu
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { audio.playButtonClick(); showLevelSelect(); }}
                onMouseEnter={() => audio.playButtonHover()}
                className="px-6 sm:px-10 py-3 border-2 border-white text-white hover:bg-white/20 font-bold text-sm sm:text-lg transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 sm:gap-3 uppercase tracking-[0.15em] sm:tracking-[0.2em]"
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                Replay
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Level Complete Screen */}
      <AnimatePresence>
      {uiState.state === 'LEVEL_COMPLETE' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="absolute inset-0 bg-[#060415]/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4"
        >
          <div 
            className="flex flex-col items-center gap-5 sm:gap-6 p-6 sm:p-10 bg-[#0a0720]/95 relative max-w-[94vw] sm:max-w-lg w-full"
            style={{
              clipPath: 'polygon(0% 10%, 10% 0%, 100% 0%, 100% 90%, 90% 100%, 0% 100%)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              boxShadow: 'inset 0 0 50px rgba(16, 185, 129, 0.1), 0 0 80px rgba(16, 185, 129, 0.25)'
            }}
          >
            {/* Tech accents */}
            <div className="absolute top-0 left-0 w-12 sm:w-16 h-12 sm:h-16 border-t-4 border-l-4 border-emerald-400/50"></div>
            <div className="absolute bottom-0 right-0 w-12 sm:w-16 h-12 sm:h-16 border-b-4 border-r-4 border-emerald-400/50"></div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono text-sky-400 tracking-widest drop-shadow-[0_0_20px_rgba(56,189,248,0.6)] text-center">
              TASK CLEARED
            </h2>
            <div className="text-xs sm:text-sm md:text-base text-slate-300 font-mono text-center w-full">
              <p>Excellent work. Task {uiState.level} is secure.</p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div className="bg-cyan-950/45 p-3 sm:p-4 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col items-center justify-center">
                  <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest">Score</div>
                  <div className="text-xl sm:text-2xl text-cyan-400 font-bold">{uiState.score}</div>
                </div>
                <div className="bg-cyan-950/45 p-3 sm:p-4 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex flex-col items-center justify-center">
                  <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest">Accuracy</div>
                  <div className="text-xl sm:text-2xl text-purple-400 font-bold">{Math.round(uiState.accuracy)}%</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 sm:mt-4 w-full justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { audio.playButtonClick(); engineRef.current?.setStartScreen(); }}
                onMouseEnter={() => audio.playButtonHover()}
                className="px-4 py-2.5 sm:py-3 border border-white/20 text-white/60 hover:bg-white/10 hover:text-white font-bold transition-all flex items-center gap-2 uppercase tracking-widest text-xs sm:text-sm"
              >
                <LogOut className="w-4 h-4" />
                Menu
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { audio.playButtonClick(); engineRef.current?.startNextLevel(); }}
                onMouseEnter={() => audio.playButtonHover()}
                className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/20 font-bold text-sm sm:text-base transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2 uppercase tracking-widest"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                Next Task
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Victory Screen */}
      <AnimatePresence>
      {uiState.state === 'VICTORY' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="absolute inset-0 bg-sky-950/70 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-4"
        >
          <div className="flex flex-col items-center gap-5 sm:gap-6 p-6 sm:p-10 md:p-12 bg-black/80 border border-sky-400/50 shadow-[0_0_100px_rgba(56,189,248,0.4)] relative max-w-[94vw] sm:max-w-xl w-full text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black font-mono text-sky-400 tracking-widest drop-shadow-[0_0_30px_rgba(56,189,248,0.6)] text-center animate-pulse">
              VICTORY
            </h2>
            <div className="text-xs sm:text-sm md:text-base text-slate-300 font-mono text-center w-full mt-2 sm:mt-4">
              <p>You have defended the galaxy. All 50 tasks are secure.</p>
              <div className="w-full bg-black/40 p-4 sm:p-6 border border-white/20 mt-4 sm:mt-6">
                <div className="text-2xl sm:text-4xl font-bold text-yellow-400 font-mono mb-4 sm:mb-6 tracking-widest">
                  FINAL SCORE: {uiState.score.toString().padStart(6, '0')}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-left font-mono text-xs sm:text-sm tracking-widest">
                  <div className="text-slate-400 uppercase">Final Accuracy:</div>
                  <div className="text-purple-400 text-right">{uiState.accuracy}%</div>
                  <div className="text-slate-400 uppercase">Peak Typing Speed:</div>
                  <div className="text-pink-400 text-right">{uiState.wpm} WPM</div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-4 sm:mt-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { audio.playButtonClick(); engineRef.current?.setStartScreen(); }}
                onMouseEnter={() => audio.playButtonHover()}
                className="px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white hover:bg-white/10 font-bold transition-all flex items-center gap-2 uppercase tracking-widest text-xs sm:text-sm"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                Return to Base
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

