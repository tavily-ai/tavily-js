import { z } from "zod/v4";
import { searchParameters, searchAgentInputParams } from "./parameters";
import type { ParameterDefinition, ParameterValue } from "./parameters";

// Internal conversion for the small vocabulary above, not a general JSON Schema adapter.
function parameterSchema<T extends ParameterDefinition>(definition: T): z.ZodType<ParameterValue<T>, ParameterValue<T>> {
  let schema: z.ZodType;
  if ("enum" in definition) {
    schema = definition.type === "string"
      ? z.enum(definition.enum)
      : z.literal(definition.enum);
  } else {
    switch (definition.type) {
      case "string": schema = z.string(); break;
      case "boolean": schema = z.boolean(); break;
      case "array": schema = z.array(z.string()); break;
      case "number":
      case "integer": {
        let number = z.number();
        if (definition.type === "integer") number = number.int();
        if (definition.minimum !== undefined) number = number.min(definition.minimum);
        if (definition.maximum !== undefined) number = number.max(definition.maximum);
        schema = number;
        break;
      }
    }
  }
  return schema.describe(definition.description) as z.ZodType<ParameterValue<T>, ParameterValue<T>>;
}

/** Individual required field validators; consumers choose optionality when composing. */
export const searchParameterSchemas = Object.fromEntries(
  Object.entries(searchParameters).map(([key, definition]) => [key, parameterSchema(definition)])
) as { [K in keyof typeof searchParameters]: z.ZodType<ParameterValue<(typeof searchParameters)[K]>, ParameterValue<(typeof searchParameters)[K]>> };

type AgentShape = {
  [K in keyof typeof searchAgentInputParams]: (typeof searchAgentInputParams)[K] extends "required"
    ? (typeof searchParameterSchemas)[K]
    : z.ZodOptional<(typeof searchParameterSchemas)[K]>;
};

/** Zod 4 tool input. Unknown keys are stripped; omitted options stay omitted. */
export const searchAgentInputSchema = z.object(
  Object.fromEntries(
    Object.entries(searchAgentInputParams).map(([key, requirement]) => {
      const field = searchParameterSchemas[key as keyof typeof searchAgentInputParams];
      return [key, requirement === "required" ? field : field.optional().describe(field.description!)];
    })
  ) as AgentShape
);

export type SearchAgentInput = z.infer<typeof searchAgentInputSchema>;
