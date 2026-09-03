import type { ReactNode } from "react";
import { CODE_COLORS } from "../data/pythonData";

/** Minimal Python syntax tokenizer -> styled spans. */
export function highlightPython(code: string): ReactNode[] {
  const re =
    /(#.*$)|("""[\s\S]*?"""|'''[\s\S]*?''')|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(\b(?:def|return|if|elif|else|for|while|in|not|and|or|print|import|from|as|with|open|try|except|finally|global|lambda|True|False|None|class|pass|break|continue)\b)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()|(\s+)|(.)/g;
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  let key = 0;
  const push = (text: string, color: string) => {
    if (!text) return;
    out.push(
      <span key={key++} style={{ color }}>
        {text}
      </span>,
    );
  };
  while ((m = re.exec(code)) !== null) {
    if (m[1]) push(m[1], CODE_COLORS.comment);
    else if (m[2] || m[3]) push(m[2] || m[3], CODE_COLORS.string);
    else if (m[4]) push(m[4], CODE_COLORS.keyword);
    else if (m[5]) push(m[5], CODE_COLORS.number);
    else if (m[6]) push(m[6], CODE_COLORS.function);
    else if (m[7]) push(m[7], "#3b4355");
    else if (m[8]) push(m[8], CODE_COLORS.plain);
  }
  return out;
}

interface CodeBlockProps {
  code: string;
  title?: string;
  maxHeight?: number;
  onTryIt?: () => void;
}

/** Dark fintech code card with line numbers + syntax highlight. */
const NL_CHAR = String.fromCharCode(10);

export default function CodeBlock({ code, title, maxHeight = 260, onTryIt }: CodeBlockProps) {
  const lines = code.split(NL_CHAR);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1f2937] bg-[#0b1120]">
      <div className="flex items-center justify-between border-b border-[#1f2937] bg-[#111827] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          {title ? <span className="ml-2 font-mono text-[11px] text-[#8b949e]">{title}.py</span> : null}
        </div>
        {onTryIt ? (
          <button
            onClick={onTryIt}
            className="rounded-lg border border-[#22d3ee]/40 bg-[#22d3ee]/10 px-2.5 py-1 text-[11px] font-semibold text-[#67e8f9] transition active:scale-95"
          >
            Try it
          </button>
        ) : null}
      </div>
      <div className="overflow-auto p-3" style={{ maxHeight }}>
        {lines.map((line, i) => (
          <div key={i} className="flex font-mono text-[12px] leading-[1.7]">
            <span className="w-7 shrink-0 select-none text-right text-[#4b5563]">{i + 1}</span>
            <pre className="ml-3 flex-1 whitespace-pre" style={{ color: CODE_COLORS.plain }}>
              {highlightPython(line)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}