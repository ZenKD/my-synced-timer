'use client';

import { useState, useEffect } from 'react';

interface Timer {
  id: string;
  label: string;
  durationMs: number;
  targetTime: number;
  remainingMs: number;
  status: 'RUNNING' | 'PAUSED';
}

export default function Home() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [label, setLabel] = useState('Shared Timer');
  const [mins, setMins] = useState(15);

  // 1. Poll database every 2 seconds to sync changes with your friend
  useEffect(() => {
    const fetchTimers = async () => {
      const res = await fetch('/api/timer');
      const data = await res.json();
      if (data) setTimers(data);
    };

    fetchTimers();
    const syncInterval = setInterval(fetchTimers, 2000);
    return () => clearInterval(syncInterval);
  }, []);

  // 2. Local loop to run smooth 1s UI countdown
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimers((prevTimers) =>
        prevTimers.map((t) => {
          if (t.status === 'RUNNING') {
            const rem = Math.max(0, t.targetTime - Date.now());
            return { ...t, remainingMs: rem };
          }
          return t;
        })
      );
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // Sync updated list to database
  const saveToDb = async (updated: Timer[]) => {
    setTimers(updated);
    await fetch('/api/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timers: updated }),
    });
  };

  const addTimer = () => {
    const totalMs = mins * 60 * 1000;
    const newTimer: Timer = {
      id: 'timer-' + Date.now(),
      label,
      durationMs: totalMs,
      targetTime: Date.now() + totalMs,
      remainingMs: totalMs,
      status: 'RUNNING',
    };
    saveToDb([...timers, newTimer]);
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Synced Multi-Timer</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <input value={label} onChange={(e) => setLabel(e.target.value)} />
        <input type="number" value={mins} onChange={(e) => setMins(Number(e.target.value))} />
        <button onClick={addTimer}>Start Shared Timer</button>
      </div>

      <div>
        {timers.map((t) => (
          <div key={t.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '0.5rem 0' }}>
            <h3>{t.label}</h3>
            <h2>{formatTime(t.remainingMs)}</h2>
          </div>
        ))}
      </div>
    </main>
  );
}