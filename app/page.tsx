'use client';

import { useState, useEffect } from 'react';

interface Timer {
  id: string;
  label: string;
  durationMs: number;
  targetTime: number;
  status: 'RUNNING' | 'PAUSED';
  pausedRemainingMs?: number;
}

export default function Home() {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [label, setLabel] = useState('Timer');
  const [hours, setHours] = useState(0);
  const [mins, setMins] = useState(15);
  const [secs, setSecs] = useState(0);
  const [now, setNow] = useState(Date.now());

  // 1. Poll database every 2 seconds to keep timers synced across clients
  useEffect(() => {
    const fetchTimers = async () => {
      try {
        const res = await fetch('/api/timer');
        const data = await res.json();
        if (data && Array.isArray(data)) setTimers(data);
      } catch (e) {
        console.error('Sync error:', e);
      }
    };

    fetchTimers();
    const syncInterval = setInterval(fetchTimers, 2000);
    return () => clearInterval(syncInterval);
  }, []);

  // 2. Smooth 1-second local render trigger
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  const saveToDb = async (updated: Timer[]) => {
    setTimers(updated);
    await fetch('/api/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timers: updated }),
    });
  };

  const addTimer = () => {
    const totalMs = (hours * 3600 + mins * 60 + secs) * 1000;
    if (totalMs <= 0) return;

    const newTimer: Timer = {
      id: 'timer-' + Date.now(),
      label: label.trim() || 'Timer',
      durationMs: totalMs,
      targetTime: Date.now() + totalMs,
      status: 'RUNNING',
    };

    saveToDb([...timers, newTimer]);
  };

  const togglePause = (id: string) => {
    const updated = timers.map((t) => {
      if (t.id === id) {
        if (t.status === 'RUNNING') {
          const remaining = Math.max(0, t.targetTime - Date.now());
          return { ...t, status: 'PAUSED' as const, pausedRemainingMs: remaining };
        } else {
          const newTarget = Date.now() + (t.pausedRemainingMs || 0);
          return { ...t, status: 'RUNNING' as const, targetTime: newTarget, pausedRemainingMs: undefined };
        }
      }
      return t;
    });
    saveToDb(updated);
  };

  const resetTimer = (id: string) => {
    const updated = timers.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status: 'RUNNING' as const,
          targetTime: Date.now() + t.durationMs,
          pausedRemainingMs: undefined,
        };
      }
      return t;
    });
    saveToDb(updated);
  };

  const deleteTimer = (id: string) => {
    const updated = timers.filter((t) => t.id !== id);
    saveToDb(updated);
  };

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return (
    <main className="min-h-screen bg-[#0d1322] text-[#94a3b8] p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Multi-Timer Tracker
        </h1>

        {/* Input Card matching image UI */}
        <div className="bg-[#151d30] border border-[#232f48] rounded-xl p-6 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            
            {/* Timer Label Input */}
            <div className="sm:col-span-5 space-y-2">
              <label className="block text-sm text-[#94a3b8]">Timer Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-[#0d1322] border border-[#232f48] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Hours Input */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm text-[#94a3b8]">Hours</label>
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full bg-[#0d1322] border border-[#232f48] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Minutes Input */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm text-[#94a3b8]">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={mins}
                onChange={(e) => setMins(Number(e.target.value))}
                className="w-full bg-[#0d1322] border border-[#232f48] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Seconds Input */}
            <div className="sm:col-span-1 space-y-2">
              <label className="block text-sm text-[#94a3b8]">Seconds</label>
              <input
                type="number"
                min="0"
                max="59"
                value={secs}
                onChange={(e) => setSecs(Number(e.target.value))}
                className="w-full bg-[#0d1322] border border-[#232f48] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            {/* Start Timer Button matching image styling */}
            <div className="sm:col-span-2">
              <button
                onClick={addTimer}
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium py-2.5 px-4 rounded-lg transition text-sm text-center"
              >
                Start Timer
              </button>
            </div>

          </div>
        </div>

        {/* Empty State / Active Timers Container matching image styling */}
        <div>
          {timers.length === 0 ? (
            <div className="border border-dashed border-[#232f48] rounded-xl p-12 text-center text-[#94a3b8]">
              No timers running. Add one above!
            </div>
          ) : (
            <div className="space-y-4">
              {timers.map((t) => {
                const remainingMs =
                  t.status === 'PAUSED'
                    ? t.pausedRemainingMs || 0
                    : Math.max(0, t.targetTime - now);

                const isExpired = remainingMs <= 0;
                const isPaused = t.status === 'PAUSED';

                return (
                  <div
                    key={t.id}
                    className="bg-[#151d30] border border-[#232f48] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-white font-semibold text-lg mb-1">{t.label}</div>
                      <div className="font-mono text-3xl font-bold text-blue-400">
                        {formatTime(remainingMs)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isExpired && (
                        <button
                          onClick={() => togglePause(t.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
                            isPaused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
                          }`}
                        >
                          {isPaused ? 'Resume' : 'Pause'}
                        </button>
                      )}
                      <button
                        onClick={() => resetTimer(t.id)}
                        className="bg-[#232f48] hover:bg-[#2d3c5c] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => deleteTimer(t.id)}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}