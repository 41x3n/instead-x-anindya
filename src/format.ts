export interface FormatOptions {
  decimals?: number;
  negatives?: "parens" | "minus";
  symbol?: string;
  pattern?: string;
}

export function formatValue(type: string, value: unknown, format: FormatOptions = {}): string {
  if (value === null || value === undefined || value === "") return "";
  switch (type) {
    case "currency": {
      const decimals = format.decimals ?? 0;
      const n = Number(value);
      const neg = n < 0;
      const body = Math.abs(n).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      const s = (format.symbol ?? "") + body;
      if (!neg) return s;
      return format.negatives === "parens" ? `(${s})` : `-${s}`;
    }
    case "date": {
      const d = new Date(String(value));
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${mm}/${dd}/${d.getUTCFullYear()}`;
    }
    case "ssn": {
      const digits = String(value).replace(/\D/g, "");
      if (digits.length === 9)
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
      return digits;
    }
    default:
      return String(value);
  }
}
