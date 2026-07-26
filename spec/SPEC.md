# Instead Tax Form Annotation — Specification (v1)

`spec: "instead.annotation/v1"`

This document defines a data format for annotating fields/boxes on a U.S. tax
form so that any application ("proprietary code") can print computed values onto
the correct boxes of a printed form. It is **coordinate-native**: the annotation
carries the geometry of every box, so it does not depend on the source PDF being
an interactive (AcroForm) PDF and works equally on flattened or scanned forms.

The machine-readable contract is [`instead.annotation.schema.json`](./instead.annotation.schema.json)
(JSON Schema, draft 2020-12). A conforming annotation MUST validate against it.

---

## 1. Coordinate system

- **Unit:** PDF points (`pt`), 1 pt = 1/72 inch. (`document.unit` = `"pt"`.)
- **Origin:** bottom-left of the page; **y increases upward**. (`document.origin` = `"bottom-left"`.)
  This matches the PDF native coordinate space, so no axis flipping is required.
- A box is a `rect` = `{ x, y, w, h }` where `(x, y)` is the **bottom-left corner**
  of the box, `w` the width, `h` the height.
- Text is drawn on a **baseline** computed inside the rect from the field's
  `vAlign` and the font metrics (see §6). Consumers MUST NOT treat `rect.y` as the
  text baseline.

## 2. Document envelope

```jsonc
{
  "$schema": "../spec/instead.annotation.schema.json",
  "spec": "instead.annotation/v1",       // format version (required)
  "form": {                              // form identity + source binding
    "id": "us.irs.1040",                 // stable form identifier
    "taxYear": 2025,
    "title": "Form 1040 - U.S. Individual Income Tax Return",
    "source": {
      "file": "f1040.pdf",
      "sha256": "3d31c2…",               // optional: hash of the exact PDF revision
      "pages": [                          // page sizes the coordinates were authored against
        { "index": 0, "width": 612, "height": 792 },
        { "index": 1, "width": 612, "height": 792 }
      ]
    }
  },
  "document": { "unit": "pt", "origin": "bottom-left" },
  "defaults": { … },                     // optional layout defaults (see §5)
  "fields": [ … ]                        // the annotations (see §4)
}
```

`form.source` binds the annotation to a specific PDF revision. A renderer MUST
assert that the loaded PDF's page sizes match `form.source.pages` before drawing,
and abort with an error on mismatch (fail loud, never silent-wrong). Verifying
`sha256` is recommended when present.

## 3. Value referencing (restricted path grammar)

A value is pulled from the caller's nested data set via a `{ "$ref": "<path>" }`
object. The path grammar is intentionally small — **not** full JSONPath:

```
path    := segment ( "." segment | "[" index "]" )*
segment := [A-Za-z_$][A-Za-z0-9_$]*
index   := [0-9]+
```

- Examples: `taxpayer.firstName`, `income.w2[0].wages`, `$row.amount`.
- Resolution walks the segments left to right. If any segment is missing, the
  result is `undefined` (see §7). No wildcards, filters, recursion, or evaluation.
- The grammar is enforceable by the schema `pattern`, so references are validated
  alongside structure, and resolution is O(path depth) — fast and safe.
- Inside a `repeat` field (§4.5), `$row` refers to the current array element.

## 4. Fields

Every field has an `id` (stable, human-meaningful) and a `type`. Positioned
fields also have `page` (0-based) and a `rect`. The `type` drives formatting
defaults (§6).

### 4.1 text / date

```jsonc
{
  "id": "taxpayer.firstName",
  "type": "text",
  "page": 0,
  "rect": { "x": 36, "y": 684, "w": 215, "h": 14 },
  "value": { "$ref": "taxpayer.firstName" },
}
```

`date` is identical but formats an ISO date (§6).

### 4.2 currency

```jsonc
{
  "id": "line1a.wages",
  "type": "currency",
  "page": 0,
  "rect": { "x": 504, "y": 330, "w": 72, "h": 12 },
  "layout": { "align": "right" },
  "value": { "$ref": "income.wages" },
  "format": { "decimals": 0, "negatives": "parens", "symbol": "" },
}
```

### 4.3 checkbox (and radio groups)

Draws a mark **only when** the referenced value satisfies `when.equals`. A radio
group is modeled as several checkbox fields over the same `$ref`, each with a
different `when.equals`.

```jsonc
{
  "id": "filingStatus.single",
  "type": "checkbox",
  "page": 0,
  "rect": { "x": 97.6, "y": 578, "w": 8, "h": 8 },
  "value": { "$ref": "taxpayer.filingStatus" },
  "when": { "equals": "single" },
  "format": { "mark": "X" },
}
```

### 4.4 ssn (single or segmented)

`rect` may be a **single rect** (renders `123-45-6789`) or an **array of 3 rects**
with `split: "chars"` — the 9 digits are grouped `3-2-4` and drawn one group per
box (for combed SSN boxes).

```jsonc
{
  "id": "taxpayer.ssn",
  "type": "ssn",
  "page": 0,
  "value": { "$ref": "taxpayer.ssn" },
  "split": "chars",
  "rect": [
    { "x": 472, "y": 684, "w": 28, "h": 14 },
    { "x": 508, "y": 684, "w": 20, "h": 14 },
    { "x": 533, "y": 684, "w": 42, "h": 14 },
  ],
}
```

### 4.5 repeat (repeating rows)

Binds a `from` array reference to a set of `columns`, drawing one row per array
element (up to `maxRows`). Row _i_ is drawn `rowHeight * i` points **below** the
declared column rects (y-up, so `y - rowHeight * i`). Inside columns, `$row` is
the current element.

```jsonc
{
  "id": "partV.otherExpenses",
  "type": "repeat",
  "page": 1,
  "from": { "$ref": "otherExpenses" },
  "maxRows": 9,
  "rowHeight": 24,
  "columns": [
    {
      "id": "description",
      "type": "text",
      "rect": { "x": 36, "y": 240, "w": 425, "h": 12 },
      "value": { "$ref": "$row.description" },
    },
    {
      "id": "amount",
      "type": "currency",
      "layout": { "align": "right" },
      "rect": { "x": 468, "y": 240, "w": 108, "h": 12 },
      "value": { "$ref": "$row.amount" },
    },
  ],
}
```

## 5. Layout & defaults

`defaults` supplies layout applied to every field; a field's own `layout`
overrides per-property. Properties:

| Property   | Values                        | Default     | Meaning                                 |
| ---------- | ----------------------------- | ----------- | --------------------------------------- |
| `align`    | `left` \| `right` \| `center` | `left`      | horizontal alignment in the box         |
| `vAlign`   | `top` \| `middle` \| `bottom` | `middle`    | vertical alignment (baseline placement) |
| `padding`  | number (pt)                   | `2`         | inset from box edges                    |
| `font`     | string                        | `Helvetica` | font family (standard PDF font)         |
| `fontSize` | number (pt)                   | `10`        | starting font size                      |
| `overflow` | `shrink` \| `clip` \| `spill` | `shrink`    | behavior when text exceeds the box      |

## 6. Formatting by type

- **currency** — thousands separators; `decimals` (default `0`, whole-dollar);
  `negatives`: `"minus"` (default) or `"parens"`; optional `symbol` prefix.
- **date** — ISO input rendered `MM/DD/YYYY`.
- **ssn** — 9 digits rendered `XXX-XX-XXXX` (single rect) or grouped per box
  (segmented, §4.4).
- **text** — value coerced to string.
- **checkbox** — the `format.mark` glyph (default `X`), drawn only if `when` matches.

## 7. Defined behaviors

| Situation                                     | Required behavior                                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `$ref` resolves to `null`/`undefined`/missing | Render nothing for that field; never throw. A field MAY provide a `default` used when the ref is missing.         |
| Rendered text wider than the box              | `overflow: "shrink"` (default) reduces font size to a legibility floor (4 pt); `clip` / `spill` are alternatives. |
| Loaded PDF page size ≠ `form.source.pages`    | Abort before drawing with a clear error.                                                                          |
| Annotation fails schema validation            | Abort before drawing with the validation error(s).                                                                |

## 8. Rendering pipeline (reference consumer)

A conforming renderer:

1. **Validates** the annotation against the JSON Schema (abort on failure).
2. **Loads** the source PDF and **asserts** page sizes vs `form.source.pages`.
3. For each field, **resolves** its `$ref` against the caller's data, **formats**
   the value by `type`, computes geometry (§1, §5), and **draws** it — expanding
   `repeat`, honoring `when`, `split`, and `onMissing`.
4. **Saves** the filled PDF.

The whole render path is a single O(n) pass over `fields`; there is no query
engine and no cross-field resolution.

Reference implementation: [`../src/render.ts`](../src/render.ts). Run:

```bash
npm run render -- <annotation.json> <data.json> <form.pdf> <out.pdf>
```
