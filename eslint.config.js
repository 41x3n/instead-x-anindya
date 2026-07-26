import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules",
      "out",
      "output",
      "web/dist",
      "assets",
      "forms",
      "docs",
      "annotations",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // The schema-typed field union is intentionally widened at a few dispatch
      // boundaries; keep `any` as a warning rather than an error.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Tests deliberately construct malformed/partial docs to exercise validation.
    files: ["tests/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);
