"use client";
import { useEffect, useRef, useState } from 'react';
import styles from './Bingo.module.css';

interface CalledNumber {
  letter: string;
  number: number;
}

// Returns B, I, N, G, or O based on the numeric range
function getBingoLetter(num: number): string {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  return 'O';
}

function generateAllNumbers(): number[] {
  return Array.from({ length: 75 }, (_, i) => i + 1);
}

export default function BingoPage() {
  const [allNumbers, setAllNumbers] = useState<number[]>(generateAllNumbers);

  const [calledNumbers, setCalledNumbers] = useState<CalledNumber[]>([]);
  const [currentNumber, setCurrentNumber] = useState<CalledNumber | null>(null);

  const [timerId, setTimerId] = useState<number | null>(null);
  const [callDelay, setCallDelay] = useState<number>(5);

  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [gameMode, setGameMode] = useState<string>('Regular');

  const beepRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    beepRef.current?.load();
  }, []);

  const callNextNumber = () => {
    if (allNumbers.length === 0) return;
    const idx = Math.floor(Math.random() * allNumbers.length);
    const num = allNumbers[idx];
    const letter = getBingoLetter(num);

    const updated = [...allNumbers];
    updated.splice(idx, 1);

    const newCalled = { letter, number: num };
    setCurrentNumber(newCalled);
    setCalledNumbers((prev) => [...prev, newCalled]);
    setAllNumbers(updated);

    if (beepRef.current) {
      beepRef.current.currentTime = 0;
      beepRef.current.play().catch(() => {});
    }
  };

  const startGame = () => {
    if (timerId) return; 
    const id = window.setInterval(callNextNumber, callDelay * 1000);
    setTimerId(id);
  };

  const pauseGame = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  };

  const togglePlayPause = () => {
    if (timerId) {
      pauseGame();
    } else {
      startGame();
    }
  };

  const resetGame = () => {
    pauseGame();
    setAllNumbers(generateAllNumbers());
    setCalledNumbers([]);
    setCurrentNumber(null);
  };

  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 5;
    setCallDelay(val);

    if (timerId) {
      clearInterval(timerId);
      const id = window.setInterval(callNextNumber, val * 1000);
      setTimerId(id);
    }
  };

  const previousCalls = calledNumbers.slice(-5, -1);

  const formatCell = (num: number) => `${getBingoLetter(num)}-${num}`;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.previousCalls}>
          {previousCalls.map((item, i) => (
            <div key={i} className={styles.prevCircle}>
              {item.letter}-{item.number}
            </div>
          ))}
        </div>

        <div className={styles.currentCircle}>
          {currentNumber ? `${currentNumber.letter}-${currentNumber.number}` : '--'}
        </div>

        {/* Display Game Mode in the top right */}
        <div className={styles.gameModeDisplay}>
          Game Mode: {gameMode}
        </div>

        <button
          className={styles.settingsToggle}
          onClick={() => setShowSettings(!showSettings)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#fff"
            width="1.8em"
            height="1.8em"
            viewBox="0 0 24 24"
          >
            <path d="M19.14,12.94a7.09,7.09,0,0,0,0-1.88l2-1.54a.51.51,0,0,0,.12-.64l-2-3.46a.5.5,0,0,0-.62-.2l-2.35,1a6.65,6.65,0,0,0-1.62-.94l-.36-2.5a.48.48,0,0,0-.5-.42H9.2a.48.48,0,0,0-.49.42l-.36,2.5a6.71,6.71,0,0,0-1.62.94l-2.35-1a.5.5,0,0,0-.62.2l-2,3.46a.49.49,0,0,0,.12.64l2,1.54a7.09,7.09,0,0,0,0,1.88l-2,1.54a.51.51,0,0,0-.12.64l2,3.46a.5.5,0,0,0,.62.2l2.35-1a6.65,6.65,0,0,0,1.62.94l.36,2.5a.48.48,0,0,0,.5.42h4.07a.48.48,0,0,0,.49-.42l.36-2.5a6.71,6.71,0,0,0,1.62-.94l2.35,1a.5.5,0,0,0,.62-.2l2-3.46a.49.49,0,0,0-.12-.64Zm-7.14,1.63A2.57,2.57,0,1,1,14.57,12,2.57,2.57,0,0,1,12,14.57Z" />
          </svg>
        </button>

        {showSettings && (
          <div className={styles.settingsPanel}>
            <div className={styles.settingsLine}>
              <label>Game Mode:</label>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
              >
                <option>Regular</option>
                <option>X</option>
                <option>H</option>
                <option>Blackout</option>
              </select>
            </div>
            <div className={styles.settingsLine}>
              <label>Auto‐call (sec):</label>
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={callDelay}
                onChange={handleDelayChange}
              />
              <span>{callDelay} sec</span>
            </div>
            <div className={styles.settingsButtons}>
              <button onClick={togglePlayPause}>
                {timerId ? 'Pause' : 'Play'}
              </button>
              <button onClick={resetGame}>Reset</button>
            </div>
          </div>
        )}
      </div>

      {/* The board */}
      <div className={styles.board}>
        {[...Array(5)].map((_, rowIndex) =>
          [...Array(15)].map((_, colIndex) => {
            const n = rowIndex * 15 + colIndex + 1; // 1..75
            const isCalled = calledNumbers.some((c) => c.number === n);
            return (
              <div
                key={n}
                className={isCalled ? styles.boardCellCalled : styles.boardCell}
              >
                {formatCell(n)}
              </div>
            );
          })
        )}
      </div>

      {/* Beep audio */}
      <audio ref={beepRef}>
        <source
          src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
          type="audio/wav"
        />
      </audio>
    </div>
  );
}
