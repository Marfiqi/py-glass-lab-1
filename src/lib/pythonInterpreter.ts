import type { ReactNode } from "react";

/* ── Client-side Python interpreter ─────────────────── */
interface RunResult {
  hasReturn: boolean;
  lastValue?: unknown;
}

const NL = String.fromCharCode(10);
const NL_RE = String.fromCharCode(10);

export function executePython(src: string, out: (line: string) => void): RunResult {
  const globalEnv = new Map<string, unknown>();
  let activeEnv: Map<string, unknown> = globalEnv;

  const valueOf = (n: unknown): number => {
    if (typeof n === "number") return n;
    if (typeof n === "string") {
      const p = parseFloat(n);
      if (Number.isNaN(p)) throw new Error("TypeError: can't do math with '" + n + "'");
      return p;
    }
    throw new Error("TypeError: unsupported operand");
  };
  const isTruthy = (v: unknown): boolean => {
    if (v === undefined || v === null) return false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") return v.length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (v instanceof Map) return v.size > 0;
    return true;
  };
  const asList = (v: unknown): unknown[] => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") return Array.from(v);
    if (v instanceof Map) return Array.from(v.values());
    throw new Error("TypeError: '" + String(v) + "' is not iterable");
  };

  const rangeFn = (a: unknown, b?: unknown, step?: unknown): number[] => {
    let start = 0, end = 0, st = 1;
    if (b === undefined) end = valueOf(a);
    else { start = valueOf(a); end = valueOf(b); }
    if (step !== undefined) st = valueOf(step);
    if (st === 0) throw new Error("ValueError: range() arg 3 must not be zero");
    const res: number[] = [];
    if (st > 0) for (let i = start; i < end; i += st) res.push(i);
    else for (let i = start; i > end; i += st) res.push(i);
    return res;
  };

  const fnBuiltin: Record<string, (...args: unknown[]) => unknown> = {
    print: (...args: unknown[]) => { out(args.map((a) => stringify(a)).join(" ")); return undefined; },
    len: (v: unknown) => (typeof v === "string" || Array.isArray(v) ? v.length : asList(v).length),
    int: (v: unknown) => Math.trunc(valueOf(v)),
    float: (v: unknown) => valueOf(v),
    str: (v: unknown) => stringify(v),
    bool: (v: unknown) => isTruthy(v),
    abs: (v: unknown) => Math.abs(valueOf(v)),
    min: (...vs: unknown[]) => Math.min(...vs.map(valueOf)),
    max: (...vs: unknown[]) => Math.max(...vs.map(valueOf)),
    sum: (v: unknown) => asList(v).reduce((a: number, c) => a + valueOf(c), 0),
    round: (v: unknown, d?: unknown) => (d === undefined ? Math.round(valueOf(v)) : Number(valueOf(v).toFixed(valueOf(d)))),
    pow: (a: unknown, b: unknown) => Math.pow(valueOf(a), valueOf(b)),
    range: rangeFn,
    sorted: (v: unknown, reverse?: unknown) => {
      const arr = [...asList(v)].sort((x, y) => { if (x instanceof Map || y instanceof Map) return 0; return x < y ? -1 : x > y ? 1 : 0; });
      return reverse ? arr.reverse() : arr;
    },
    list: (v?: unknown) => (v === undefined ? [] : asList(v)),
    tuple: (v: unknown) => Object.freeze([...asList(v)]),
    set: (v?: unknown) => new Map((v === undefined ? [] : asList(v)).map((x) => [stringify(x), x])),
    dict: () => new Map<string, unknown>(),
    enumerate: (v: unknown, start?: unknown) => asList(v).map((x, i) => [i + (start === undefined ? 0 : valueOf(start)), x]),
    zip: (...cols: unknown[]) => {
      const lists = cols.map(asList);
      const n = Math.min(...lists.map((l) => l.length));
      return Array.from({ length: n }, (_, i) => lists.map((l) => l[i]));
    },
    input: (prompt?: unknown) => { if (prompt !== undefined) out(stringify(prompt)); return ""; },
    open: (name: unknown, mode: string = "r") => {
      const fileName = stringify(name);
      const key = "pyfile:" + fileName;
      if (mode.includes("w")) globalEnv.set(key, "");
      return {
        write: (s: unknown) => { const cur = (globalEnv.get(key) as string) ?? ""; if (stringify(mode).includes("a")) globalEnv.set(key, cur + stringify(s)); else globalEnv.set(key, stringify(s)); },
        read: () => (globalEnv.get(key) as string) ?? "",
        readlines: () => ((globalEnv.get(key) as string) ?? "").split(NL_RE).map((l) => l + NL),
        close: () => undefined,
      };
    },
    divmod: (a: unknown, b: unknown) => [Math.trunc(valueOf(a) / valueOf(b)), valueOf(a) % valueOf(b)],
    chr: (n: unknown) => String.fromCharCode(valueOf(n)),
    ord: (s: unknown) => (typeof s === "string" ? s.charCodeAt(0) : 0),
    repr: (v: unknown) => stringify(v),
  };

  function stringify(v: unknown): string {
    if (v === undefined || v === null) return "None";
    if (typeof v === "string") return v;
    if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
    if (typeof v === "boolean") return v ? "True" : "False";
    if (Array.isArray(v)) return "[" + v.map(stringify).join(", ") + "]";
    if (v instanceof Map) return "{" + Array.from(v.entries()).map(([k, val]) => `${k}: ${stringify(val)}`).join(", ") + "}";
    return String(v);
  }

  /* ── Variable lookup (activeEnv chain) ── */
  function getVar(name: string): unknown {
    let e: Map<string, unknown> | null = activeEnv;
    while (e) {
      if (e.has(name)) return e.get(name);
      e = (e as any)._parent ?? null;
    }
    throw new Error("NameError: name '" + name + "' is not defined");
  }

  function setVar(name: string, val: unknown): void {
    activeEnv.set(name, val);
  }

  /* ── Indexing / slicing support ── */
  function resolveIndex(base: unknown, idx: unknown): unknown {
    if (Array.isArray(base)) {
      let i = valueOf(idx);
      if (i < 0) i = base.length + i;
      if (i < 0 || i >= base.length) throw new Error("IndexError: list index out of range");
      return base[i];
    }
    if (typeof base === "string") {
      let i = valueOf(idx);
      if (i < 0) i = base.length + i;
      if (i < 0 || i >= base.length) throw new Error("IndexError: string index out of range");
      return base[i];
    }
    if (base instanceof Map) {
      const key = stringify(idx);
      if (!base.has(key)) throw new Error("KeyError: '" + key + "'");
      return base.get(key);
    }
    throw new Error("TypeError: object is not subscriptable");
  }

  function setIndex(base: unknown, idx: unknown, val: unknown): void {
    if (Array.isArray(base)) {
      let i = valueOf(idx);
      if (i < 0) i = base.length + i;
      base[i] = val;
    } else if (typeof base === "string") {
      throw new Error("TypeError: 'str' does not support item assignment");
    } else if (base instanceof Map) {
      base.set(stringify(idx), val);
    } else {
      throw new Error("TypeError: object does not support item assignment");
    }
  }

  function sliceList(arr: unknown[], start: unknown, end: unknown, step?: unknown): unknown[] {
    let s = start === undefined ? 0 : valueOf(start);
    let e = end === undefined ? arr.length : valueOf(end);
    let st = step === undefined ? 1 : valueOf(step);
    if (s < 0) s = Math.max(0, arr.length + s);
    if (e < 0) e = Math.max(0, arr.length + e);
    if (s < 0) s = 0;
    if (e > arr.length) e = arr.length;
    const result: unknown[] = [];
    for (let i = s; (st > 0 ? i < e : i > e); i += st) result.push(arr[i]);
    return result;
  }

  function sliceStr(s: string, start: unknown, end: unknown, step?: unknown): string {
    const sliced = sliceList(Array.from(s), start, end, step);
    return sliced.join("");
  }

  /* ── Ternary: a if cond else b ── */
  function evalTernary(expr: string): unknown {
    const m = expr.match(/^(.+)\s+if\s+(.+?)\s+else\s+(.+)$/s);
    if (!m) return undefined;
    return isTruthy(evalExpr(m[2].trim())) ? evalExpr(m[1].trim()) : evalExpr(m[3].trim());
  }

  /* ── List comprehension ── */
  function evalListComp(expr: string): unknown[] | null {
    const m = expr.match(/^\[(.+)\s+for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+?)\]$/);
    if (!m) return null;
    let body = m[1].trim();
    const varName = m[2];
    const iterExpr = m[3].trim();
    let filterExpr: string | null = null;
    const ifIdx = body.lastIndexOf(" if ");
    if (ifIdx > 0) {
      filterExpr = body.slice(ifIdx + 4).trim();
      body = body.slice(0, ifIdx).trim();
    }
    const items = asList(evalExpr(iterExpr));
    const result: unknown[] = [];
    for (const item of items) {
      const scope = new Map<string, unknown>([[varName, item]]);
      (scope as any)._parent = activeEnv;
      const prev = activeEnv;
      activeEnv = scope;
      try {
        if (filterExpr && !isTruthy(evalExpr(filterExpr))) { activeEnv = prev; continue; }
        result.push(evalExpr(body));
      } finally { activeEnv = prev; }
    }
    return result;
  }

  /* ── Dict comprehension ── */
  function evalDictComp(expr: string): Map<string, unknown> | null {
    const m = expr.match(/^\{(.*?)\s+for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+?)\}$/);
    if (!m) return null;
    let kvPart = m[1].trim();
    const varName = m[2];
    const iterExpr = m[3].trim();
    let filterExpr: string | null = null;
    const ifIdx = kvPart.lastIndexOf(" if ");
    if (ifIdx > 0) {
      filterExpr = kvPart.slice(ifIdx + 4).trim();
      kvPart = kvPart.slice(0, ifIdx).trim();
    }
    const colonIdx = kvPart.indexOf(":");
    if (colonIdx < 0) return null;
    const keyExpr = kvPart.slice(0, colonIdx).trim();
    const valExpr = kvPart.slice(colonIdx + 1).trim();
    const items = asList(evalExpr(iterExpr));
    const result = new Map<string, unknown>();
    for (const item of items) {
      const scope = new Map<string, unknown>([[varName, item]]);
      (scope as any)._parent = activeEnv;
      const prev = activeEnv;
      activeEnv = scope;
      try {
        if (filterExpr && !isTruthy(evalExpr(filterExpr))) { activeEnv = prev; continue; }
        result.set(stringify(evalExpr(keyExpr)), evalExpr(valExpr));
      } finally { activeEnv = prev; }
    }
    return result;
  }

  /* ── Augmented assignment ── */
  function evalAugAssign(line: string): boolean {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(\+=|-=|\*=|\/=|\/\/=|%=|\*\*)\s*(.+)$/);
    if (!m) return false;
    const name = m[1], op = m[2], rhs = m[3];
    const left = getVar(name), right = evalExpr(rhs);
    let result: unknown;
    switch (op) {
      case "+=": result = (typeof left === "string" || typeof right === "string") ? stringify(left) + stringify(right) : valueOf(left) + valueOf(right); break;
      case "-=": result = valueOf(left) - valueOf(right); break;
      case "*=": result = (typeof left === "string" && typeof right === "number") ? left.repeat(Math.max(0, Math.floor(valueOf(right)))) : valueOf(left) * valueOf(right); break;
      case "/=": result = valueOf(left) / valueOf(right); break;
      case "//=": result = Math.floor(valueOf(left) / valueOf(right)); break;
      case "%=": result = ((valueOf(left) % valueOf(right)) + valueOf(right)) % valueOf(right); break;
      case "**=": result = Math.pow(valueOf(left), valueOf(right)); break;
      default: return false;
    }
    setVar(name, result);
    return true;
  }

  /* ── Multiple assignment ── */
  function evalMultiAssign(line: string): boolean {
    const eqIdx = line.indexOf("=");
    if (eqIdx < 0) return false;
    const lhs = line.slice(0, eqIdx).trim(), rhs = line.slice(eqIdx + 1).trim();
    if (!lhs.includes(",")) return false;
    const targets = lhs.split(",").map((s) => s.trim());
    const values = splitTopLevel(rhs);
    const resolved = values.map((v) => evalExpr(v));
    targets.forEach((t, i) => setVar(t, resolved[i] ?? undefined));
    return true;
  }

  /* ── Indexed assignment ── */
  function evalIndexedAssign(line: string): boolean {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*(?:\[.*?\])*)\s*=\s*(.+)$/);
    if (!m) return false;
    const target = m[1].trim(), rhs = m[2].trim();
    const bracketIdx = target.indexOf("[");
    if (bracketIdx < 0) return false;
    const baseName = target.slice(0, bracketIdx);
    const rest = target.slice(bracketIdx);
    const idxMatch = rest.match(/^\[(.+)\](.*)$/);
    if (!idxMatch) return false;
    const base = getVar(baseName);
    const idxVal = evalExpr(idxMatch[1]);
    const val = evalExpr(rhs);
    if (idxMatch[2]) {
      // nested indexing
      const innerBaseObj = resolveIndex(base, idxVal);
      const innerBracket = idxMatch[2].indexOf("[");
      if (innerBracket >= 0) {
        const innerRest = idxMatch[2].slice(innerBracket);
        const innerIdxM = innerRest.match(/^\[(.+)\](.*)$/);
        if (innerIdxM) {
          const innerIdx = evalExpr(innerIdxM[1]);
          setIndex(innerBaseObj, innerIdx, val);
          return true;
        }
      }
      return false;
    }
    setIndex(base, idxVal, val);
    return true;
  }

  function evalExpr(expr: string): unknown {
    const t = expr.trim();
    if (t === "") return undefined;

    // List comprehension
    if (t.startsWith("[") && t.endsWith("]") && t.includes(" for ")) {
      const lc = evalListComp(t);
      if (lc !== null) return lc;
    }
    // Dict comprehension
    if (t.startsWith("{") && t.endsWith("}") && t.includes(" for ")) {
      const dc = evalDictComp(t);
      if (dc !== null) return dc;
    }
    // Ternary
    if (t.includes(" if ") && t.includes(" else ")) {
      const tern = evalTernary(t);
      if (tern !== undefined) return tern;
    }
    // f-string
    const fstring = t.match(/^f["']([\s\S]*?)["']$/);
    if (fstring) {
      return fstring[1].replace(/\{([^}]+)\}/g, (_, inner: string) => {
        const core = inner.includes(":") ? inner.slice(0, inner.indexOf(":")) : inner;
        const fmt = inner.includes(":") ? inner.slice(inner.indexOf(":") + 1) : null;
        const val = evalExpr(core);
        if (fmt) {
          const num = valueOf(val);
          if (fmt.includes("%")) { const p = parseFloat(fmt.replace("%", "")) / 100; return (num * p).toFixed(2) + "%"; }
          if (fmt.includes(",")) return num.toLocaleString("en-US");
          if (fmt.includes(".")) { const dec = parseInt(fmt.split(".")[1] ?? "0", 10); return num.toFixed(dec); }
          return String(val);
        }
        return stringify(val);
      });
    }
    // String literal
    const strLit = t.match(/^(["'])([\s\S]*?)\1$/);
    if (strLit) return strLit[2];
    if (t === "True") return true;
    if (t === "False") return false;
    if (t === "None") return undefined;
    const numLit = t.match(/^-?\d+$/);
    if (numLit) return parseInt(numLit[0], 10);
    const floatLit = t.match(/^-?\d*\.\d+$/);
    if (floatLit) return parseFloat(floatLit[0]);

    // Indexed access: var[idx]
    const idxAccess = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\[([^\]]+)\]$/);
    if (idxAccess) {
      const base = getVar(idxAccess[1]);
      return resolveIndex(base, evalExpr(idxAccess[2]));
    }

    // Slicing: var[start:end] or var[start:end:step]
    const sliceMatch = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\[([^\]]+)\]$/);
    if (sliceMatch) {
      const base = getVar(sliceMatch[1]);
      const sliceExpr = sliceMatch[2];
      const parts = sliceExpr.split(":").map((p) => p.trim());
      if (typeof base === "string") {
        if (parts.length === 3) return sliceStr(base, parts[0] || undefined, parts[1] || undefined, parts[2] || undefined);
        return sliceStr(base, parts[0] || undefined, parts[1] || undefined);
      }
      if (Array.isArray(base)) {
        if (parts.length === 3) return sliceList(base, parts[0] || undefined, parts[1] || undefined, parts[2] || undefined);
        return sliceList(base, parts[0] || undefined, parts[1] || undefined);
      }
    }

    // Method call on variable: var.method(args)
    const methodCall = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/s);
    if (methodCall) {
      const obj = getVar(methodCall[1]);
      const args = splitTopLevel(methodCall[3]);
      return callMethod(obj, methodCall[2], args.map((a) => evalExpr(a.trim())));
    }

    // Binary expression
    const bin = matchBinary(t);
    if (bin) {
      if (bin.op === "+") {
        const a = evalExpr(bin.l), b = evalExpr(bin.r);
        if (typeof a === "string" || typeof b === "string") return stringify(a) + stringify(b);
        return valueOf(a) + valueOf(b);
      }
      if (bin.op === "-") return valueOf(evalExpr(bin.l)) - valueOf(evalExpr(bin.r));
      if (bin.op === "*") {
        const a = evalExpr(bin.l), b = evalExpr(bin.r);
        if (typeof a === "string" && typeof b === "number") return a.repeat(Math.max(0, Math.floor(b)));
        if (typeof b === "string" && typeof a === "number") return b.repeat(Math.max(0, Math.floor(a)));
        if (Array.isArray(a) && typeof b === "number") return Array.from({ length: Math.max(0, Math.floor(b)) }, () => a).flat();
        return valueOf(a) * valueOf(b);
      }
      if (bin.op === "/") return valueOf(evalExpr(bin.l)) / valueOf(evalExpr(bin.r));
      if (bin.op === "//") return Math.floor(valueOf(evalExpr(bin.l)) / valueOf(evalExpr(bin.r)));
      if (bin.op === "%") {
        const a = valueOf(evalExpr(bin.l)), b = valueOf(evalExpr(bin.r));
        if (b === 0) throw new Error("ZeroDivisionError: modulo by zero");
        return ((a % b) + b) % b;
      }
      if (bin.op === "**") return Math.pow(valueOf(evalExpr(bin.l)), valueOf(evalExpr(bin.r)));
      if (bin.op === "==") return evalExpr(bin.l) === evalExpr(bin.r);
      if (bin.op === "!=") return evalExpr(bin.l) !== evalExpr(bin.r);
      if (bin.op === "<") return (evalExpr(bin.l) as never) < (evalExpr(bin.r) as never);
      if (bin.op === ">") return (evalExpr(bin.l) as never) > (evalExpr(bin.r) as never);
      if (bin.op === "<=") return (evalExpr(bin.l) as never) <= (evalExpr(bin.r) as never);
      if (bin.op === ">=") return (evalExpr(bin.l) as never) >= (evalExpr(bin.r) as never);
      if (bin.op === "and") return isTruthy(evalExpr(bin.l)) && isTruthy(evalExpr(bin.r));
      if (bin.op === "or") return isTruthy(evalExpr(bin.l)) || isTruthy(evalExpr(bin.r));
      if (bin.op === "in") {
        const cont = evalExpr(bin.r);
        return asList(cont).some((x) => stringify(x) === stringify(evalExpr(bin.l)));
      }
      if (bin.op === "not") return !isTruthy(evalExpr(bin.r));
    }

    // Unary not
    if (t.startsWith("not ")) return !isTruthy(evalExpr(t.slice(4)));

    // Function call
    const call = t.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*\([\s\S]*\)$/);
    if (call) {
      const dotIdx = call[1].lastIndexOf(".");
      const rawArgs = splitTopLevel(call[2]);
      if (dotIdx > 0) {
        const obj = getVar(call[1].slice(0, dotIdx));
        const method = call[1].slice(dotIdx + 1);
        return callMethod(obj, method, rawArgs.map((a) => evalExpr(a.trim())));
      }
      const fnName = call[1];
      const args = rawArgs.map((a) => evalExpr(a.trim()));
      if (fnBuiltin[fnName]) return fnBuiltin[fnName](...args);
      const fn = getVar(fnName);
      if (typeof fn === "function") return (fn as (...a: unknown[]) => unknown)(...args);
      throw new Error("NameError: name '" + fnName + "' is not defined");
    }

    // Single variable lookup
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)) return getVar(t);

    throw new Error("SyntaxError: cannot evaluate '" + t + "'");
  }

  function callMethod(obj: unknown, method: string, args: unknown[]): unknown {
    if (Array.isArray(obj)) {
      const arr = obj as unknown[];
      if (method === "append") { arr.push(args[0]); return undefined; }
      if (method === "pop") return arr.pop();
      if (method === "count") return arr.filter((x) => stringify(x) === stringify(args[0])).length;
      if (method === "index") { const i = arr.findIndex((x) => stringify(x) === stringify(args[0])); if (i < 0) throw new Error("ValueError: not in list"); return i; }
      if (method === "sort") { arr.sort((a, b) => (a as never) < (b as never) ? -1 : (a as never) > (b as never) ? 1 : 0); return undefined; }
      if (method === "reverse") { arr.reverse(); return undefined; }
      if (method === "insert") { arr.splice(valueOf(args[0]), 0, args[1]); return undefined; }
      if (method === "remove") { const i = arr.findIndex((x) => stringify(x) === stringify(args[0])); if (i < 0) throw new Error("ValueError: not in list"); arr.splice(i, 1); return undefined; }
      if (method === "extend") { arr.push(...(args[0] as unknown[])); return undefined; }
      if (method === "clear") { arr.length = 0; return undefined; }
    }
    if (typeof obj === "string") {
      const s = obj as string;
      if (method === "upper") return s.toUpperCase();
      if (method === "lower") return s.toLowerCase();
      if (method === "strip") return s.trim();
      if (method === "title") return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
      if (method === "replace") return s.split(stringify(args[0])).join(args.length > 1 ? stringify(args[1]) : "");
      if (method === "split") { if (args.length === 0) return s.split(/\s+/).filter(Boolean); return s.split(stringify(args[0])); }
      if (method === "count") return s.split(stringify(args[0])).length - 1;
      if (method === "startswith") return s.startsWith(stringify(args[0]));
      if (method === "endswith") return s.endsWith(stringify(args[0]));
      if (method === "find") { const idx = s.indexOf(stringify(args[0])); return idx >= 0 ? idx : -1; }
      if (method === "join") { return asList(args[0]).map(stringify).join(stringify(s)); }
    }
    if (obj instanceof Map) {
      const m = obj as Map<string, unknown>;
      if (method === "get") return m.get(stringify(args[0])) ?? args[1];
      if (method === "keys") return Array.from(m.keys());
      if (method === "values") return Array.from(m.values());
      if (method === "items") return Array.from(m.entries());
      if (method === "setdefault") { const k = stringify(args[0]); if (!m.has(k)) m.set(k, args[1]); return m.get(k); }
      if (method === "pop") { const k = stringify(args[0]); const val = m.get(k); m.delete(k); return val; }
      if (method === "update") {
        const other = args[0];
        if (other instanceof Map) { other.forEach((v, k) => m.set(k, v)); } else if (Array.isArray(other)) { other.forEach((pair: unknown[]) => m.set(stringify(pair[0]), pair[1])); }
        return undefined;
      }
    }
    throw new Error("AttributeError: no method '" + method + "'");
  }

  function matchBinary(expr: string): { l: string; r: string; op: string } | null {
    const ops = ["**", "//", "==", "!=", "<=", ">=", "+", "-", "*", "/", "%", "<", ">", "and", "or", "in"];
    for (const op of ops) {
      const m = splitOnOperator(expr, op);
      if (m) return { l: m[0], r: m[1], op };
    }
    return null;
  }

  function splitOnOperator(expr: string, op: string): [string, string] | null {
    let depth = 0;
    for (let i = expr.length - 1; i >= op.length; i--) {
      const ch = expr[i];
      if (ch === ")" || ch === "]") depth++;
      else if (ch === "(" || ch === "[") depth--;
      if (depth === 0 && expr.slice(i - op.length + 1, i + 1) === op) {
        const l = expr.slice(0, i - op.length + 1).trim();
        const r = expr.slice(i + 1).trim();
        if (l && r) return [l, r];
      }
    }
    return null;
  }

  function splitTopLevel(s: string): string[] {
    if (!s.trim()) return [];
    const parts: string[] = [];
    let depth = 0, cur = "", inStr: string | null = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inStr) { cur += c; if (c === inStr) inStr = null; continue; }
      if (c === '"' || c === "'") { inStr = c; cur += c; continue; }
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      if (c === "," && depth === 0) { parts.push(cur); cur = ""; } else cur += c;
    }
    if (cur.trim()) parts.push(cur);
    return parts;
  }

  /* ── Statement execution ── */
  const statements: string[] = [];
  for (const chunk of src.split(NL_RE)) statements.push(chunk);
  let i = 0;
  let lastValue: unknown;
  let hasReturn = false;

  function execBlock(stmts: string[], blockStart: number, blockEnd: number): Outcome {
    let j = blockStart;
    while (j < blockEnd) {
      const raw = stmts[j];
      const line = raw.trim();
      if (!line || line.startsWith("#")) { j++; continue; }
      if (line === "break") return "break";
      if (line === "continue") return "continue";
      if (line.startsWith("return ")) {
        lastValue = evalExpr(line.slice(7));
        hasReturn = true;
        activeEnv.set("__ret", lastValue);
        return "return";
      }
      if (line.startsWith("if ") || line.startsWith("elif ") || line.startsWith("else")) {
        const be = findBlockEnd(stmts, j);
        const r = evalIfLadder(stmts, j, be);
        if (r !== "continue") return r;
        j = be; continue;
      }
      if (line.startsWith("for ")) {
        const m = line.match(/^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([\s\S]+?):\s*$/);
        if (m) {
          const be = findBlockEnd(stmts, j);
          const items = asList(evalExpr(m[2]));
          for (const item of items) {
            const scope = new Map<string, unknown>([[m[1], item]]);
            (scope as any)._parent = activeEnv;
            const prev = activeEnv;
            activeEnv = scope;
            try {
              const r = execBlock(stmts, j + 1, be);
              if (r === "break") break;
              if (r === "return") return r;
            } finally { activeEnv = prev; }
          }
          j = be; continue;
        }
      }
      if (line.startsWith("while ")) {
        const m = line.match(/^while\s+([\s\S]+?):\s*$/);
        if (m) {
          const be = findBlockEnd(stmts, j);
          let guard = 0;
          while (isTruthy(evalExpr(m[1])) && guard < 100000) {
            guard++;
            const r = execBlock(stmts, j + 1, be);
            if (r === "break") break;
            if (r === "return") return r;
          }
          j = be; continue;
        }
      }
      if (line.startsWith("def ")) {
        const m = line.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*:\s*$/);
        if (m) {
          const be = findBlockEnd(stmts, j);
          const params = m[2].split(",").map((s) => s.trim()).filter(Boolean);
          const fbody = stmts.slice(j + 1, be);
          const fn = (...args: unknown[]) => {
            const local = new Map<string, unknown>();
            params.forEach((p, idx) => local.set(p, args[idx]));
            (local as any)._parent = activeEnv;
            const prev = activeEnv;
            activeEnv = local;
            try {
              const r = execBlock(fbody, 0, fbody.length);
              return r === "return" ? activeEnv.get("__ret") : undefined;
            } finally { activeEnv = prev; }
          };
          setVar(m[1], fn);
          j = be; continue;
        }
      }
      if (line.startsWith("import ") || line.startsWith("from ")) { handleImport(line); j++; continue; }
      if (line.startsWith("global ")) { j++; continue; }
      if (evalAugAssign(line)) { j++; continue; }
      if (evalMultiAssign(line)) { j++; continue; }
      if (evalIndexedAssign(line)) { j++; continue; }
      const asg = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
      if (asg) { setVar(asg[1], evalExpr(asg[2])); }
      else { const v = evalExpr(line); if (v !== undefined) { lastValue = v; hasReturn = true; } }
      j++;
    }
    return "continue";
  }

  function execBlockWithEnv(stmts: string[], start: number, end: number, targetEnv: Map<string, unknown>): Outcome {
    const prevEnv = activeEnv;
    activeEnv = targetEnv;
    try { return execBlock(stmts, start, end); }
    finally { activeEnv = prevEnv; }
  }

  function evalIfLadder(stmts: string[], start: number, end: number): Outcome {
    let cursor = start, executed = false;
    while (cursor < end) {
      const t = stmts[cursor].trim();
      if (t.startsWith("if ") || t.startsWith("elif ")) {
        const m = t.match(/^(?:if|elif)\s+([\s\S]+?):\s*$/);
        const cond = m ? isTruthy(evalExpr(m[1])) : false;
        const be = findBlockEnd(stmts, cursor);
        if (cond && !executed) {
          const r = execBlock(stmts, cursor + 1, be);
          executed = true;
          return r;
        }
        cursor = be;
      } else if (t.startsWith("else")) {
        const be = findBlockEnd(stmts, cursor);
        if (!executed) return execBlock(stmts, cursor + 1, be);
        cursor = be;
      } else break;
    }
    return "continue";
  }

  function handleImport(line: string): void {
    const m = line.match(/^from\s+(\w+)\s+import\s+(.+)$/);
    if (m) {
      const ns = m[1];
      for (const name of m[2].split(",").map((s) => s.trim())) {
        if (ns === "datetime" && name === "date") setVar("date", { today: () => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }; } });
        if (ns === "random" && name === "randint") setVar("randint", (a: unknown, b: unknown) => Math.floor(Math.random() * (valueOf(b) - valueOf(a) + 1)) + valueOf(a));
        if (ns === "random" && name === "choice") setVar("choice", (xs: unknown) => { const arr = asList(xs); return arr[Math.floor(Math.random() * arr.length)]; });
        if (ns === "math" && name === "sqrt") setVar("sqrt", (v: unknown) => Math.sqrt(valueOf(v)));
        if (ns === "math" && name === "floor") setVar("floor", (v: unknown) => Math.floor(valueOf(v)));
        if (ns === "math" && name === "ceil") setVar("ceil", (v: unknown) => Math.ceil(valueOf(v)));
        if (ns === "math" && name === "pi") setVar("pi", Math.PI);
        if (ns === "math" && name === "e") setVar("e", Math.E);
        if (ns === "math" && name === "log") setVar("log", (v: unknown, b?: unknown) => b === undefined ? Math.log(valueOf(v)) : Math.log(valueOf(v)) / Math.log(valueOf(b)));
        if (ns === "math" && name === "sin") setVar("sin", (v: unknown) => Math.sin(valueOf(v)));
        if (ns === "math" && name === "cos") setVar("cos", (v: unknown) => Math.cos(valueOf(v)));
        if (ns === "math" && name === "tan") setVar("tan", (v: unknown) => Math.tan(valueOf(v)));
        if (ns === "math" && name === "pow") setVar("pow", (a: unknown, b: unknown) => Math.pow(valueOf(a), valueOf(b)));
        if (ns === "math" && name === "fabs") setVar("fabs", (v: unknown) => Math.abs(valueOf(v)));
        if (ns === "time" && name === "sleep") setVar("sleep", (_s: unknown) => {});
        if (ns === "time" && name === "time") setVar("time", () => Date.now() / 1000);
        if (ns === "sys" && name === "argv") setVar("argv", ["python"]);
      }
      return;
    }
    const mi = line.match(/^import\s+(\w+)/);
    if (mi) {
      const ns = mi[1];
      if (ns === "math") setVar("math", { sqrt: (v: unknown) => Math.sqrt(valueOf(v)), floor: (v: unknown) => Math.floor(valueOf(v)), ceil: (v: unknown) => Math.ceil(valueOf(v)), pi: Math.PI, e: Math.E, log: (v: unknown, b?: unknown) => b === undefined ? Math.log(valueOf(v)) : Math.log(valueOf(v)) / Math.log(valueOf(b)), sin: (v: unknown) => Math.sin(valueOf(v)), cos: (v: unknown) => Math.cos(valueOf(v)), tan: (v: unknown) => Math.tan(valueOf(v)), pow: (a: unknown, b: unknown) => Math.pow(valueOf(a), valueOf(b)), fabs: (v: unknown) => Math.abs(valueOf(v)) });
      if (ns === "random") setVar("random", { randint: (a: unknown, b: unknown) => Math.floor(Math.random() * (valueOf(b) - valueOf(a) + 1)) + valueOf(a), choice: (xs: unknown) => { const arr = asList(xs); return arr[Math.floor(Math.random() * arr.length)]; }, uniform: (a: unknown, b: unknown) => Math.random() * (valueOf(b) - valueOf(a)) + valueOf(a), shuffle: (xs: unknown) => { const arr = asList(xs); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; } });
      if (ns === "time") setVar("time", { sleep: (_s: unknown) => {}, time: () => Date.now() / 1000 });
      if (ns === "json") setVar("json", { loads: (s: unknown) => JSON.parse(stringify(s)), dumps: (v: unknown) => JSON.stringify(v) });
    }
  }

  while (i < statements.length) {
    const line = statements[i].trim();
    if (!line || line.startsWith("#")) { i++; continue; }
    if (line.startsWith("if ") || line.startsWith("elif ") || line.startsWith("else")) {
      const be = findBlockEnd(statements, i);
      const r = evalIfLadder(statements, i, be);
      if (r === "return") break;
      i = be; continue;
    }
    if (line.startsWith("for ") || line.startsWith("while ") || line.startsWith("def ") || line.startsWith("import ") || line.startsWith("from ") || line.startsWith("global ")) {
      const r = execBlock(statements, i, statements.length);
      if (r === "return") break;
      break;
    }
    const r = execBlock(statements, i, i + 1);
    if (r === "return") break;
    i++;
  }

  return { hasReturn, lastValue };
}

type Outcome = "continue" | "break" | "return";

function findBlockEnd(lines: string[], start: number): number {
  const indent = lines[start].length - lines[start].trimStart().length;
  let i = start + 1;
  while (i < lines.length) {
    const l = lines[i];
    if (l.trim() === "") { i++; continue; }
    if (l.length - l.trimStart().length <= indent) break;
    i++;
  }
  return i;
}

export type PyHighlight = ReactNode;