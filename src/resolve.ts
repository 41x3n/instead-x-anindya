export function parsePath(path: string): (string | number)[] {
  const out: (string | number)[] = [];
  const re = /([A-Za-z_$][A-Za-z0-9_$]*)|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(path)) !== null) {
    if (m[1] !== undefined) out.push(m[1]);
    else out.push(Number(m[2]));
  }
  return out;
}

export function resolvePath(data: unknown, path: string): unknown {
  let cur: unknown = data;
  for (const seg of parsePath(path)) {
    if (cur == null) return undefined;
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  return cur;
}
