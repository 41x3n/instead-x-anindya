import Ajv2020 from "ajv/dist/2020";
import schema from "../spec/instead.annotation.schema.json" assert { type: "json" };
import type { AnnotationDoc } from "./types";

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);

/** Assert a value conforms to the annotation JSON Schema, or throw with details. */
export function validateDoc(doc: unknown): asserts doc is AnnotationDoc {
  if (!validate(doc)) {
    const msg = (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`).join("; ");
    throw new Error(`Invalid annotation: ${msg}`);
  }
}
