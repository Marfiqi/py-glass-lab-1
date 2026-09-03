import { useEffect, useRef, useState } from "react";
import { ArrowClockwise, Play, Plus, TerminalWindow, X } from "@phosphor-icons/react";
import { PRESETS } from "../data/pythonData";
import { useHub } from "../hooks/useHub.tsx";
import { executePython } from "../lib/pythonInterpreter";

interface Props {
  initialCode?: string;
  onClear: () => void;
}

const NL = String.fromCharCode(10);
const SYMBOLS = ["(", ")", "[", "]", "{", "}", ":", "=", "+", "-", "*", "/", "%", "print(", "for", "if", "def", "return", "True", "False", "input("];

const tokenRe = /(#.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(\b(?:def|return|if|elif|else|for|while|in|not|and|or|print|import|from|as|with|open|try|except|finally|global|lambda|True|False|None|pop|append)\b)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|(\s+)|(.)/g;

function tokenize(code: string): { text: string; color: string }[] {
  const out: { text: string; color: string }[] = [];
  let m: RegExpExecArray | null;
  tokenRe.lastIndex = 0;
  while ((m = tokenRe.exec(code)) !== null) {
    let color = "#e6edf3";
    if (m[1]) color = "#8b949e";
    else if (m[2]) color = "#a5d6ff";
    else if (m[3]) color = "#ff7b72";
    else if (m[4]) color = "#79c0ff";
    else if (m[5]) color = "#d2a8ff";
    else if (m[6]) color = "#3b4355";
    out.push({ text: m[0], color });
  }
  return out;
}

function trimOutput(s: string): string {
  const threePlus = new RegExp(NL + "{3,}", "g");
  return s.replace(threePlus, NL + NL).trim();
}

const NL_CHAR2 = String.fromCharCode(10);

export default function PlaygroundTab({ initialCode, onClear }: Props) {
  const { profile, registerRun, completeTopic } = useHub();
  const [code, setCode] = useState(initialCode ?? PRESETS["Hello World"]);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [presetName, setPresetName] = useState("Hello World");
  const [saved, setSaved] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialCode !== undefined) setCode(initialCode);
  }, [initialCode]);

  const run = () => {
    setRunning(true);
    setError(null);
    setOutput("");
    setTimeout(() => {
      try {
        const result = executePython(code, (l) => setOutput((p) => p + l + NL));
        if (result.hasReturn && result.lastValue !== undefined) {
          setOutput((p) => p + String(result.lastValue) + NL);
        }
        registerRun();
        completeTopic("hello-world");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setRunning(false);
        setSaved(false);
      }
    }, 80);
  };

  const save = () => {
    localStorage.setItem("python3hub_last_script", code);
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  const exportPy = () => {
    const blob = new Blob([code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "python3hub_script.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  const lines = code.split(NL_CHAR2);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#1f2937] bg-[#111827]">
          <TerminalWindow size={20} weight="duotone" className="text-[#67e8f9]" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-white">Playground</h2>
          <p className="text-[11px] text-[#8b949e]">{profile.totalRuns} runs total</p>
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => {
              setCode(PRESETS[name]);
              setPresetName(name);
              setOutput("");
              setError(null);
            }}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
              presetName === name
                ? "border-[#22d3ee]/60 bg-[#22d3ee]/15 text-[#67e8f9]"
                : "border-[#1f2937] bg-[#111827] text-[#9ca3af]"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#0b1120]">
        <div className="flex items-center justify-between border-b border-[#1f2937] bg-[#111827] px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            <span className="ml-2 font-mono text-[11px] text-[#8b949e]">{presetName}.py</span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={onClear} className="rounded-lg p-1.5 text-[#6b7280] transition hover:text-[#9ca3af]" title="Clear">
              <X size={15} />
            </button>
            <button onClick={exportPy} className="rounded-lg border border-[#1f2937] px-2 py-1 text-[11px] font-semibold text-[#cbd5e1] transition active:scale-95">
              Export .py
            </button>
          </div>
        </div>
        <div className="relative">
          <pre aria-hidden className="pointer-events-none min-h-[220px] overflow-auto p-3 font-mono text-[12.5px] leading-[1.7]">
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span className="w-7 shrink-0 select-none text-right text-[#4b5563]">{i + 1}</span>
                <span className="ml-3 flex-1 whitespace-pre">
                  {tokenize(line).map((tk, j) => (
                    <span key={j} style={{ color: tk.color }}>
                      {tk.text}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </pre>
          <textarea
            ref={taRef}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setSaved(false);
            }}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === "Enter") {
                e.preventDefault();
                run();
              }
              if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
                e.preventDefault();
                save();
              }
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="absolute inset-0 h-full w-full resize-none bg-transparent p-3 pl-[54px] font-mono text-[12.5px] leading-[1.7] text-transparent caret-[#22d3ee] outline-none selection:bg-[#22d3ee]/30"
            style={{ whiteSpace: "pre", overflowWrap: "normal", overflowX: "auto" }}
          />
        </div>
      </div>

      {/* Symbol bar */}
      <div className="flex flex-wrap gap-1.5">
        {SYMBOLS.map((s) => (
          <button
            key={s}
            onClick={() => {
              const el = taRef.current;
              if (!el) return;
              const start = el.selectionStart ?? code.length;
              const end = el.selectionEnd ?? code.length;
              const next = code.slice(0, start) + s + code.slice(end);
              setCode(next);
              requestAnimationFrame(() => {
                el.focus();
                el.setSelectionRange(start + s.length, start + s.length);
              });
            }}
            className="rounded-lg border border-[#1f2937] bg-[#111827] px-2 py-1 font-mono text-[11px] text-[#cbd5e1] transition active:scale-90"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2.5">
        <button
          onClick={run}
          disabled={running}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#22d3ee] to-[#3b82f6] py-3 text-sm font-bold text-[#04101a] shadow-[0_8px_22px_-8px_#22d3eebb] transition active:scale-[0.98] disabled:opacity-60"
        >
          {running ? <ArrowClockwise size={16} className="animate-spin" /> : <Play size={16} weight="fill" />}
          Run (Ctrl+Enter)
        </button>
        <button
          onClick={save}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-semibold transition active:scale-95 ${
            saved ? "border-[#4ade80]/50 bg-[#4ade80]/10 text-[#4ade80]" : "border-[#1f2937] bg-[#111827] text-[#cbd5e1]"
          }`}
        >
          <Plus size={15} weight="bold" />
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      <p className="text-center text-[10px] text-[#4b5563]">Ctrl+S saves - runs execute in your browser</p>

      {/* Console */}
      <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#060a14]">
        <div className="flex items-center gap-2 border-b border-[#1f2937] bg-[#111827] px-3 py-2">
          <TerminalWindow size={14} className="text-[#4ade80]" />
          <span className="font-mono text-[11px] text-[#8b949e]">console</span>
        </div>
        <div className="max-h-56 overflow-auto p-3 font-mono text-[12px] leading-[1.7]">
          {error ? (
            <p className="text-[#ff7b72]">Traceback (most recent call last): {error}</p>
          ) : output ? (
            <pre className="whitespace-pre-wrap text-[#e6edf3]">{trimOutput(output)}</pre>
          ) : (
            <p className="text-[#4b5563]">// Output appears here. Try running the script</p>
          )}
        </div>
      </div>
    </div>
  );
}