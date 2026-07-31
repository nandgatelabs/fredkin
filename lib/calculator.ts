/** Tiny calculator for the record composer keypad. */

const OPS = new Set(["+", "-", "×", "÷"]);

export function appendDigit(expr: string, digit: string): string {
  if (expr === "0" && digit !== ".") return digit;
  if (expr === "Error") return digit === "." ? "0." : digit;
  return expr + digit;
}

export function appendDecimal(expr: string): string {
  if (expr === "Error") return "0.";
  const lastNum = expr.split(/[+\-×÷]/).pop() ?? "";
  if (lastNum.includes(".")) return expr;
  if (!expr || OPS.has(expr.slice(-1))) return `${expr}0.`;
  return `${expr}.`;
}

export function appendOperator(expr: string, op: string): string {
  if (!expr || expr === "Error") return "0" + op;
  const last = expr.slice(-1);
  if (OPS.has(last)) return expr.slice(0, -1) + op;
  if (last === ".") return expr + "0" + op;
  return expr + op;
}

export function backspace(expr: string): string {
  if (!expr || expr === "Error") return "0";
  const next = expr.slice(0, -1);
  return next.length === 0 ? "0" : next;
}

/** Evaluate with ×÷ before +−. Returns null on invalid input. */
export function evaluateExpression(expr: string): number | null {
  const cleaned = expr.trim();
  if (!cleaned || cleaned === "Error") return null;
  let s = cleaned.replace(/×/g, "*").replace(/÷/g, "/");
  if (OPS.has(cleaned.slice(-1)) || /[+\-*/]$/.test(s)) {
    s = s.slice(0, -1);
  }
  if (!s) return null;

  try {
    const tokens = tokenize(s);
    if (!tokens) return null;
    const withMulDiv = reduceMulDiv(tokens);
    if (!withMulDiv) return null;
    const value = reduceAddSub(withMulDiv);
    if (value == null || !Number.isFinite(value)) return null;
    return Math.round(value * 1e8) / 1e8;
  } catch {
    return null;
  }
}

export function formatResult(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const fixed = n.toFixed(8).replace(/\.?0+$/, "");
  return fixed;
}

function tokenize(s: string): (number | string)[] | null {
  const out: (number | string)[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "+" || ch === "*" || ch === "/") {
      out.push(ch);
      i += 1;
      continue;
    }
    if (ch === "-") {
      const prev = out[out.length - 1];
      const unary = out.length === 0 || typeof prev === "string";
      if (unary) {
        i += 1;
        const num = readNumber(s, i);
        if (!num) return null;
        out.push(-num.value);
        i = num.next;
        continue;
      }
      out.push("-");
      i += 1;
      continue;
    }
    if ((ch >= "0" && ch <= "9") || ch === ".") {
      const num = readNumber(s, i);
      if (!num) return null;
      out.push(num.value);
      i = num.next;
      continue;
    }
    return null;
  }
  return out;
}

function readNumber(
  s: string,
  start: number,
): { value: number; next: number } | null {
  let i = start;
  let sawDot = false;
  while (i < s.length) {
    const ch = s[i];
    if (ch >= "0" && ch <= "9") {
      i += 1;
      continue;
    }
    if (ch === "." && !sawDot) {
      sawDot = true;
      i += 1;
      continue;
    }
    break;
  }
  if (i === start || s.slice(start, i) === ".") return null;
  const value = Number(s.slice(start, i));
  if (Number.isNaN(value)) return null;
  return { value, next: i };
}

function reduceMulDiv(tokens: (number | string)[]): (number | string)[] | null {
  const out: (number | string)[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "*" || t === "/") {
      const left = out.pop();
      const right = tokens[i + 1];
      if (typeof left !== "number" || typeof right !== "number") return null;
      if (t === "/" && right === 0) return null;
      out.push(t === "*" ? left * right : left / right);
      i += 2;
      continue;
    }
    out.push(t);
    i += 1;
  }
  return out;
}

function reduceAddSub(tokens: (number | string)[]): number | null {
  if (tokens.length === 0) return null;
  let acc = tokens[0];
  if (typeof acc !== "number") return null;
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const rhs = tokens[i + 1];
    if (typeof rhs !== "number" || (op !== "+" && op !== "-")) return null;
    acc = op === "+" ? acc + rhs : acc - rhs;
  }
  return acc;
}

/** Final amount for save: evaluate if expression, else parse number. */
export function resolveAmount(expr: string): number | null {
  if (!expr || expr === "Error") return null;
  if (/[+\-×÷]/.test(expr.slice(0, -1)) || /[+\-×÷]$/.test(expr)) {
    const v = evaluateExpression(expr);
    return v != null && v > 0 ? v : v === 0 ? 0 : null;
  }
  const n = Number(expr);
  if (Number.isNaN(n)) return null;
  return n;
}
