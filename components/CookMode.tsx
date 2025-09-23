import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { XIcon } from './icons/XIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { BellOffIcon } from './icons/BellOffIcon';
import type { Instruction } from '../services/geminiService';

interface CookModeProps {
  recipeName: string;
  instructions: Instruction[];
  onExit: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const playBeep = () => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    oscillator.start(audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    oscillator.stop(audioCtx.currentTime + 0.5);
    setTimeout(() => audioCtx.state !== 'closed' && audioCtx.close(), 1000);
};

const CookMode: React.FC<CookModeProps> = ({ recipeName, instructions, onExit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [alarmIntervalId, setAlarmIntervalId] = useState<NodeJS.Timeout | null>(null);

  const currentInstruction = useMemo(() => instructions[currentStep], [currentStep, instructions]);
  const initialDuration = useMemo(() => currentInstruction?.timerInSeconds, [currentInstruction]);
  
  const [timeLeft, setTimeLeft] = useState(initialDuration || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalId) {
      clearInterval(alarmIntervalId);
      setAlarmIntervalId(null);
    }
  }, [alarmIntervalId]);

  const startAlarm = () => {
    stopAlarm(); // Ensure no multiple alarms
    playBeep();
    const interval = setInterval(playBeep, 1500); // Repeat beep every 1.5s
    setAlarmIntervalId(interval);
  };

  // Reset timer state when step changes
  useEffect(() => {
    stopAlarm();
    setIsTimerRunning(false);
    setTimeLeft(initialDuration || 0);
  }, [currentStep, initialDuration, stopAlarm]);

  // Timer countdown logic
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && isTimerRunning) {
        // Timer just finished
        setIsTimerRunning(false);
        startAlarm();
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 2000); // Flash for 2 seconds
      }
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => Math.max(0, prevTime - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isTimerRunning, timeLeft]);
  
  // Cleanup alarm on unmount
  useEffect(() => {
    return () => stopAlarm();
  }, [stopAlarm]);

  const handleNext = useCallback(() => {
    if (currentStep < instructions.length - 1) {
      stopAlarm();
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, instructions.length, stopAlarm]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      stopAlarm();
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, stopAlarm]);
  
  const handleResetTimer = () => {
      stopAlarm();
      setTimeLeft(initialDuration || 0);
  };
  
  const isLastStep = currentStep === instructions.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
          isLastStep ? onExit() : handleNext();
        } else if (e.key === 'ArrowLeft') {
          handlePrev();
        } else if (e.key === 'Escape') {
          onExit();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLastStep, onExit, handleNext, handlePrev]);

  const isFirstStep = currentStep === 0;
  const hasTimer = initialDuration && initialDuration > 0;
  const timerFinished = hasTimer && timeLeft <= 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col p-4 sm:p-8" aria-modal="true" role="dialog">
      <header className="flex-shrink-0 flex items-center justify-between text-white">
        <div>
            <h2 className="text-xl sm:text-2xl font-bold truncate pr-4" title={recipeName}>{recipeName}</h2>
            <p className="text-base sm:text-lg text-white/80">Step {currentStep + 1} of {instructions.length}</p>
        </div>
        <button onClick={onExit} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="Exit cook mode">
          <XIcon className="w-6 h-6" />
        </button>
      </header>
      
      <main className={`flex-grow flex flex-col items-center justify-center gap-8 transition-colors duration-300 ease-in-out rounded-2xl ${isFlashing ? 'bg-red-600/60' : isTimerRunning && timeLeft > 0 ? 'bg-white/10' : ''}`}>
        <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center max-w-4xl leading-tight sm:leading-tight md:leading-tight p-4">
          {currentInstruction.text}
        </p>

        {hasTimer && (
            <div className={`p-4 rounded-2xl transition-colors ${timerFinished && !alarmIntervalId ? 'bg-green-500' : 'bg-white/10'}`}>
                <p className={`text-5xl sm:text-6xl font-mono text-white tracking-widest ${isTimerRunning && timeLeft > 0 ? 'animate-pulse' : ''}`}>{formatTime(timeLeft)}</p>
                <div className="flex justify-center gap-3 mt-4">
                    {alarmIntervalId ? (
                        <button onClick={stopAlarm} className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white font-semibold">
                            <BellOffIcon className="w-5 h-5" />
                            <span>Dismiss Alarm</span>
                        </button>
                    ) : !isTimerRunning ? (
                        <button onClick={() => setIsTimerRunning(true)} disabled={timerFinished} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                            <PlayIcon className="w-5 h-5" />
                            <span>{timerFinished ? 'Done!' : 'Start'}</span>
                        </button>
                    ) : (
                        <button onClick={() => setIsTimerRunning(false)} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white font-semibold">
                           <PauseIcon className="w-5 h-5" />
                           <span>Pause</span>
                        </button>
                    )}
                    {!alarmIntervalId && (
                     <button onClick={handleResetTimer} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-white text-sm font-semibold">
                        Reset
                    </button>
                    )}
                </div>
            </div>
        )}
      </main>
      
      <footer className="flex-shrink-0 flex items-center justify-between pt-4">
        <button
          onClick={handlePrev}
          disabled={isFirstStep}
          className="flex items-center gap-2 px-4 py-3 sm:px-6 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          aria-label="Previous step"
        >
          <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          onClick={isLastStep ? onExit : handleNext}
          className="flex items-center gap-2 px-4 py-3 sm:px-6 rounded-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-bold transition-all"
          aria-label={isLastStep ? 'Finish cooking' : 'Next step'}
        >
          <span className="font-bold">{isLastStep ? 'Finish' : 'Next'}</span>
          {!isLastStep && <ArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </footer>
    </div>
  );
};

export default CookMode;