import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CaretRight,
  Check,
  GameController,
  MagnifyingGlass,
  RocketLaunch,
  X,
} from "@phosphor-icons/react";
import AcrylicIcon from "./AcrylicIcon";
import CodeBlock from "./CodeBlock";
import { CATEGORIES, GAMES, TOPICS } from "../data/pythonData";
import { levelFromXp, useHub } from "../hooks/useHub.tsx";
import type { Topic } from "../types";

interface Props {
  onOpenPlayground: (code?: string) => void;
  onGoGames: () => void;
}

export default function HomeTab({ onOpenPlayground, onGoGames }: Props) {
  const { profile } = useHub();
  const lvl = levelFromXp(profile.xp);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Topic | null>(null);

  const cats = useMemo(() => ["All", ...CATEGORIES], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOPICS.filter((t) => {
      const inCat = category === "All" || t.category === category;
      const inQuery = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return inCat && inQuery;
    });
  }, [category, query]);

  const pct = Math.round((profile.completedTopics.length / TOPICS.length) * 100);

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <div
          className="relative flex h-11 w-11 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #3776ab, #ffffff)",
            boxShadow: "0 4px 14px -4px #3776ab88",
          }}
        >
          <span className="text-sm font-black text-[#0a0e1a]">Py</span>
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#0a0e1a] bg-[#22d3ee] p-1" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight text-white">Python 3 Hub</h1>
          <p className="text-xs text-[#8b949e]">
            Level {lvl.level} - {lvl.xpInLevel}/{lvl.xpNext} XP
          </p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#1f2937]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3776ab] to-[#22d3ee] transition-all"
              style={{ width: `${lvl.pct}%` }}
            />
          </div>
        </div>
        <button className="relative rounded-full border border-[#1f2937] bg-[#111827] p-2.5 text-[#cbd5e1] transition active:scale-95">
          <Bell size={18} weight="duotone" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#f472b6]" />
        </button>
      </div>

      {/* Hero Card */}
      <div
        className="relative overflow-hidden rounded-[20px] border border-[#1f2937] p-5"
        style={{ background: "linear-gradient(135deg, #16203a 0%, #0a0e1a 70%)" }}
      >
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#3776ab]/30 blur-3xl" />
        <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-[#22d3ee]/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[#67e8f9]">
            <RocketLaunch size={14} weight="fill" />
            Finish the dictionary
          </div>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white">
            {profile.completedTopics.length}/{TOPICS.length} topics learned
          </h2>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#0a0e1a]/80 border border-[#1f2937]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#3776ab] via-[#22d3ee] to-[#2dd4bf] shadow-[0_0_12px_#22d3ee88] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-4 flex gap-2.5">
            <button className="rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] px-4 py-2 text-sm font-semibold text-[#04101a] shadow-[0_6px_18px_-6px_#22d3ee99] transition active:scale-95">
              Resume
            </button>
            <button className="rounded-xl border border-[#1f2937] bg-[#111827]/80 px-4 py-2 text-sm font-semibold text-[#cbd5e1] transition active:scale-95">
              History
            </button>
          </div>
        </div>
      </div>

      {/* Quick Games */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Quick games</h3>
          <button onClick={onGoGames} className="flex items-center gap-0.5 text-xs font-semibold text-[#67e8f9]">
            View all <CaretRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-2.5">
          {GAMES.slice(0, 5).map((g) => (
            <button key={g.id} onClick={onGoGames} className="group flex flex-col items-center gap-1.5">
              <AcrylicIcon name={g.name} glow={g.icon} size={50}>
                <GameController size={24} weight="duotone" className="transition-transform group-active:scale-90" />
              </AcrylicIcon>
              <span className="text-[10px] font-medium leading-none text-[#cbd5e1]" style={{ color: g.color }}>
                {g.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Topic Dictionary */}
      <div>
        <h3 className="mb-2.5 text-sm font-bold text-white">Topic dictionary</h3>
        <div className="relative mb-3">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics..."
            className="w-full rounded-2xl border border-[#1f2937] bg-[#111827] py-2.5 pl-9 pr-3 text-sm text-white placeholder-[#6b7280] outline-none focus:border-[#22d3ee]/50"
          />
        </div>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                category === c
                  ? "border-[#22d3ee]/60 bg-[#22d3ee]/15 text-[#67e8f9]"
                  : "border-[#1f2937] bg-[#111827] text-[#9ca3af]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#1f2937] bg-[#111827]/50 px-4 py-8 text-center text-sm text-[#6b7280]">
            No topics found for "{query}"
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((t) => {
              const done = profile.completedTopics.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[#1f2937] bg-[#111827] p-3 text-left transition hover:border-[#374151] active:scale-[0.985]"
                >
                  <AcrylicIcon name={t.title} glow={t.icon} size={44}>
                    <BookOpen size={20} weight="duotone" />
                  </AcrylicIcon>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                      <span className="truncate">{t.title}</span>
                      {done && <Check size={13} weight="bold" className="shrink-0 text-[#4ade80]" />}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-[10px] uppercase tracking-wide text-[#6b7280]">{t.category}</span>
                      <span className="flex gap-0.5">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-1 w-1 rounded-full ${i < t.difficulty ? "bg-[#22d3ee]" : "bg-[#374151]"}`}
                          />
                        ))}
                      </span>
                    </p>
                  </div>
                  <CaretRight size={16} className="shrink-0 text-[#4b5563]" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Topic Detail Modal */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-[24px] border border-[#1f2937] bg-[#0d1424] p-5 pb-8 sm:rounded-[24px]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <AcrylicIcon name={selected.title} glow={selected.icon} size={46}>
                  <BookOpen size={20} weight="duotone" />
                </AcrylicIcon>
                <div>
                  <h3 className="text-base font-bold text-white">{selected.title}</h3>
                  <p className="text-[11px] text-[#8b949e]">
                    {selected.category} - {selected.difficulty}/4 difficulty
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full border border-[#1f2937] bg-[#111827] p-1.5 text-[#9ca3af] transition active:scale-90"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-[#cbd5e1]">{selected.description}</p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {selected.concepts.map((c) => (
                <span key={c} className="rounded-lg border border-[#22d3ee]/25 bg-[#22d3ee]/10 px-2 py-1 text-[11px] font-medium text-[#67e8f9]">
                  {c}
                </span>
              ))}
            </div>
            <div className="space-y-3">
              {selected.examples.map((ex) => (
                <div key={ex.title}>
                  <p className="mb-1.5 text-xs font-semibold text-[#9ca3af]">{ex.title}</p>
                  <CodeBlock code={ex.code} title={ex.title.toLowerCase().replace(/\s+/g, "-")} onTryIt={() => onOpenPlayground(ex.code)} />
                </div>
              ))}
            </div>
            <button
              onClick={() => onOpenPlayground(selected.examples[0]?.code)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] py-3 text-sm font-bold text-[#04101a] shadow-[0_8px_22px_-8px_#22d3eebb] transition active:scale-[0.98]"
            >
              Mark complete & open playground
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}