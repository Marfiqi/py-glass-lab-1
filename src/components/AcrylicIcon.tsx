import { ReactNode } from "react";

interface Props {
  name: string;
  glow: string;
  size?: number;
  className?: string;
  children: ReactNode;
}

export default function AcrylicIcon({ name, glow, size = 48, children }: Props) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl border border-[#1f2937] bg-[#111827]/80 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur"
      style={{ width: size, height: size, boxShadow: `0 6px 16px -6px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px ${glow}33` }}
    >
      {children}
    </div>
  );
}