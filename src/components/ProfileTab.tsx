import { useMemo, useState } from "react";
import { Download, Fire, GameController, GearSix, Trophy, UserCircle } from "@phosphor-icons/react";
import AcrylicIcon from "./AcrylicIcon";
import { ACHIEVEMENTS, TOPICS } from "../data/pythonData";
import { levelFromXp, useHub } from "../hooks/useHub.tsx";

export default function ProfileTab() {
  const { profile, resetProgress } = useHub();
  const lvl = levelFromXp(profile.xp);
  const [confirmReset, setConfirmReset] = useState(false);

  const unlocked = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.check(profile)).map((a) => a.id),
    [profile],
  );

  const startPct = useMemo(() => {
    if (!profile.lastActive) return 0;
    const day = profile.lastActive;
    const highs = Object.values(profile.highScores);
    const best = highs.length ? Math.max(...highs) : 0;
    return best;
  }, [profile]);

  const saveCodeFiles = () => {
    const code = localStorage.getItem("python3hub_last_script") ?? 'print("Hello from Python 3 Hub!")';
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my_python3hub_script.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  const installPwa = () => {
      const e = (window as unknown as { __deferredInstallPrompt?: { prompt?: () => Promise<void> } }).__deferredInstallPrompt;
  if (e) {
    e.prompt?.();
    return;
  }
    alert("Install the app from your browser menu (Add to Home Screen).");
  };

  return (
    <div className="space-y-5">
      {/* Avatar header */}
      <div className="flex items-center gap-4 rounded-[20px] border border-[#1f2937] bg-[#111827] p-4">
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #3776ab, #ffffff)",
            boxShadow: "0 8px 24px -8px #3776abbb",
          }}
        >
          <span className="text-xl font-black text-[#0a0e1a]">Py</span>
          <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-[#111827] bg-[#22d3ee] p-1.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-white">
            Level {lvl.level}
            <span className="rounded-full border border-[#f472b6]/40 bg-[#f472b6]/10 px-2 py-0.5 text-[10px] font-bold text-[#f472b6]">
              <Fire size={10} weight="fill" className="mr-0.5 inline" />
              {profile.streak} day streak
            </span>
          </h2>
          <p className="text-xs text-[#8b949e]">{profile.xp} total XP</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#0a0e1a]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3776ab] via-[#22d3ee] to-[#2dd4bf] shadow-[0_0_10px_#22d3ee88] transition-all duration-700"
              style={{ width: `${lvl.pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Topics", value: profile.completedTopics.length, icon: <UserCircle size={16} weight="duotone" className="text-[#22d3ee]" />, glow: "cyan" },
          { label: "Runs", value: profile.totalRuns, icon: <GearSix size={16} weight="duotone" className="text-[#4ade80]" />, glow: "green" },
          { label: "Games", value: profile.gamesPlayed, icon: <GameController size={16} weight="duotone" className="text-[#f472b6]" />, glow: "pink" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#1f2937] bg-[#111827] p-3 text-center">
            <div className="mx-auto mb-1.5 flex w-fit items-center gap-1 text-xs font-semibold text-[#9ca3af]">
              {s.icon}
              {s.label}
            </div>
            <p className="text-lg font-extrabold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-3">
          <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#9ca3af]">
            <Trophy size={13} weight="duotone" className="text-[#fbbf24]" /> Best score
          </p>
          <p className="text-lg font-extrabold text-white">{startPct}</p>
          <p className="text-[10px] text-[#6b7280]">across all games</p>
        </div>
        <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-3">
          <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#9ca3af]">
            <Fire size={13} weight="duotone" className="text-[#f472b6]" /> Daily streak
          </p>
          <p className="text-lg font-extrabold text-white">{profile.streak} days</p>
          <p className="text-[10px] text-[#6b7280]">{profile.lastActive}</p>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="mb-2.5 text-sm font-bold text-white">Achievements</h3>
        <div className="grid grid-cols-4 gap-2.5">
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.includes(a.id);
            return (
              <div key={a.id} className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition ${isUnlocked ? "border-[#22d3ee]/40 bg-[#111827]" : "border-[#1f2937] bg-[#111827]/50 opacity-55"}`}>
                <AcrylicIcon name={a.name} glow={isUnlocked ? a.icon : "silver"} size={44}>
                  <Trophy size={20} weight={isUnlocked ? "fill" : "duotone"} />
                </AcrylicIcon>
                <p className="text-[10px] font-bold leading-tight text-white">{a.name}</p>
                <p className="text-[9px] leading-tight text-[#6b7280]">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings */}
      <div>
        <h3 className="mb-2.5 text-sm font-bold text-white">Settings</h3>
        <div className="space-y-2.5">
          <button onClick={saveCodeFiles} className="flex w-full items-center gap-3 rounded-2xl border border-[#1f2937] bg-[#111827] p-3 text-left transition active:scale-[0.985]">
            <AcrylicIcon name="Export scripts" glow="green" size={40}>
              <Download size={18} weight="duotone" />
            </AcrylicIcon>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Export saved code</p>
              <p className="text-[11px] text-[#8b949e]">Download your latest script as a .py file</p>
            </div>
          </button>
          <button onClick={installPwa} className="flex w-full items-center gap-3 rounded-2xl border border-[#1f2937] bg-[#111827] p-3 text-left transition active:scale-[0.985]">
            <AcrylicIcon name="Install app" glow="cyan" size={40}>
              <Download size={18} weight="duotone" />
            </AcrylicIcon>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Install Python 3 Hub</p>
              <p className="text-[11px] text-[#8b949e]">Add this PWA to your home screen</p>
            </div>
          </button>
          <button onClick={() => setConfirmReset(true)} className="flex w-full items-center gap-3 rounded-2xl border border-[#fb7185]/30 bg-[#111827] p-3 text-left transition active:scale-[0.985]">
            <AcrylicIcon name="Reset progress" glow="pink" size={40}>
              <Fire size={18} weight="duotone" />
            </AcrylicIcon>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#fda4af]">Reset progress</p>
              <p className="text-[11px] text-[#8b949e]">Clear XP, topics, and high scores</p>
            </div>
          </button>
        </div>
      </div>

      <p className="pb-2 text-center text-[10px] text-[#4b5563]">
        {TOPICS.length} topics - progress saved locally on this device
      </p>

      {confirmReset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmReset(false)} />
          <div className="relative w-full max-w-xs rounded-[20px] border border-[#1f2937] bg-[#111827] p-5 text-center">
            <h4 className="text-base font-bold text-white">Reset all progress?</h4>
            <p className="mt-1.5 text-xs text-[#8b949e]">This cannot be undone. XP, topics, streaks, and scores will be cleared.</p>
            <div className="mt-4 flex gap-2.5">
              <button onClick={() => setConfirmReset(false)} className="flex-1 rounded-xl border border-[#1f2937] bg-[#0a0e1a] py-2.5 text-sm font-semibold text-[#cbd5e1] transition active:scale-95">
                Cancel
              </button>
              <button
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#fb7185] to-[#f472b6] py-2.5 text-sm font-bold text-white transition active:scale-95"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}