import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, ChevronDown, ChevronUp, Pause, Play } from 'lucide-react';
import { audio } from '../lib/audio';

interface MobileKeyboardProps {
  onKeyPress: (char: string) => void;
  onTogglePause?: () => void;
  isPaused?: boolean;
  targetWord?: string;
  typedWord?: string;
  onOpenNativeKeyboard?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

export const MobileKeyboard: React.FC<MobileKeyboardProps> = ({
  onKeyPress,
  onTogglePause,
  isPaused = false,
  targetWord,
  typedWord,
  onOpenNativeKeyboard,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // Determine next expected char for targeting lock animation
  const nextTargetChar = targetWord && typedWord !== undefined && typedWord.length < targetWord.length
    ? targetWord[typedWord.length].toLowerCase()
    : null;

  const handleKeyTouch = (key: string, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // ignore vibrate restrictions
      }
    }
    audio.playButtonClick();
    onKeyPress(key);
  };

  return (
    <div className="w-full max-w-lg mx-auto select-none pointer-events-auto transition-all">
      {/* Top mini-bar for keyboard controls */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/70 border-t border-x border-cyan-500/30 backdrop-blur-md rounded-t-lg text-[11px] font-mono text-cyan-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-bold tracking-wider">CYBER_KEYPAD</span>
          {nextTargetChar && (
            <span className="ml-1 px-1.5 py-0.5 bg-pink-500/30 text-pink-300 border border-pink-500/40 rounded text-[10px] animate-pulse">
              LOCK: {nextTargetChar.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenNativeKeyboard && (
            <button
              type="button"
              onClick={onOpenNativeKeyboard}
              className="px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded text-cyan-300 flex items-center gap-1 active:scale-95 transition-all"
              title="Open Device OS Keyboard"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden xs:inline text-[10px]">OS Keypad</span>
            </button>
          )}

          {onTogglePause && (
            <button
              type="button"
              onClick={onTogglePause}
              className="px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded text-cyan-300 flex items-center gap-1 active:scale-95 transition-all"
              title={isPaused ? "Resume Game" : "Pause Game"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-green-400" /> : <Pause className="w-3.5 h-3.5 text-yellow-400" />}
            </button>
          )}

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 text-cyan-400 hover:text-white rounded hover:bg-white/10 active:scale-95 transition-all"
              title={isCollapsed ? "Expand Keyboard" : "Collapse Keyboard"}
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Keyboard Keys Area */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-1.5 sm:p-2 bg-[#060415]/95 backdrop-blur-xl border-x border-b border-cyan-500/40 rounded-b-lg shadow-[0_0_30px_rgba(0,242,255,0.15)] flex flex-col gap-1.5 touch-manipulation"
          >
            {ROWS.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex justify-center items-center gap-1 sm:gap-1.5 w-full"
              >
                {/* Visual spacer on 2nd row for realistic QWERTY offset */}
                {rowIndex === 1 && <div className="w-[2%] shrink-0"></div>}

                {row.map((char) => {
                  const isNextLock = nextTargetChar === char;

                  return (
                    <button
                      key={char}
                      type="button"
                      onTouchStart={(e) => handleKeyTouch(char, e)}
                      onClick={(e) => handleKeyTouch(char, e)}
                      style={{
                        touchAction: 'manipulation'
                      }}
                      className={`relative flex-1 min-w-0 h-11 sm:h-12 flex items-center justify-center rounded font-mono font-bold text-base sm:text-lg transition-all duration-100 uppercase select-none active:scale-90 active:bg-cyan-400 active:text-black ${
                        isNextLock
                          ? 'bg-gradient-to-b from-pink-500/40 to-pink-900/60 border-2 border-pink-400 text-white shadow-[0_0_15px_rgba(255,0,127,0.8)] scale-[1.03] z-10 animate-pulse'
                          : 'bg-[#0f0b29]/80 hover:bg-[#1a1442] border border-cyan-500/30 text-cyan-200 hover:border-cyan-400 shadow-[0_0_8px_rgba(0,242,255,0.08)]'
                      }`}
                    >
                      {/* Corner cyber pip */}
                      <span className={`absolute top-0.5 left-0.5 w-1 h-1 rounded-full ${isNextLock ? 'bg-pink-300' : 'bg-cyan-400/40'}`}></span>
                      {char}
                    </button>
                  );
                })}

                {rowIndex === 1 && <div className="w-[2%] shrink-0"></div>}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
