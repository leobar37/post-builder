import { z, ZodSchema, ZodError } from 'zod';
import { getLogger } from '../logger.js';
import type { JsonSchema } from './types.js';
import { StructuredOutputError } from './types.js';

/**
 * Validates structured output against a JSON schema using Zod
 */
export class StructuredOutputValidator {
  private logger = getLogger().child('StructuredOutputValidator');

  /**
   * Validate parsed JSON data against a Zod schema
   */
  validate<T>(data: unknown, schema: ZodSchema<T>): { success: true; data: T } | { success: false; errors: ZodError } {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return { success: false, errors: result.error };
  }

  /**
   * Parse JSON string and validate against schema
   */
  parseAndValidate<T>(
    rawContent: string,
    schema: ZodSchema<T>
  ): { success: true; data: T } | { success: false; error: StructuredOutputError } {
    // Parse JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseError) {
      return {
        success: false,
        error: new StructuredOutputError('Failed to parse JSON response', {
          rawContent,
          parseError: parseError instanceof Error ? parseError : new Error(String(parseError)),
        }),
      };
    }

    // Validate against schema
    const result = schema.safeParse(parsed);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      error: new StructuredOutputError('JSON validation failed', {
        rawContent,
        validationErrors: result.error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      }),
    };
  }

  /**
   * Convert JsonSchema to Zod schema
   */
  jsonSchemaToZod(schema: JsonSchema): ZodSchema {
    return this.convertJsonSchema(schema);
  }

  private convertJsonSchema(schema: JsonSchema): ZodSchema {
    const { type, ...rest } = schema;

    switch (type) {
      case 'string':
        return this.createStringSchema(rest);
      case 'number':
      case 'integer':
        return this.createNumberSchema(rest, type === 'integer');
      case 'boolean':
        return z.boolean();
      case 'array':
        return this.createArraySchema(rest);
      case 'object':
        return this.createObjectSchema(rest);
      default:
        // Try to infer from other properties
        if (schema.properties) {
          return this.createObjectSchema(rest);
        }
        if (schema.items) {
          return this.createArraySchema(rest);
        }
        return z.unknown();
    }
  }

  private createStringSchema(props: Partial<JsonSchema>): ZodSchema {
    let schema: ZodSchema = z.string();

    if (props.minLength !== undefined) {
      schema = (schema as z.ZodString).min(props.minLength);
    }
    if (props.maxLength !== undefined) {
      schema = (schema as ZodSchema & { max: (n: number) => ZodSchema }).max(props.maxLength);
    }
    if (props.pattern) {
      schema = (schema as z.ZodString).regex(new RegExp(props.pattern));
    }
    if (props.description) {
      // Zod doesn't support descriptions natively in schema
    }

    return schema;
  }

  private createNumberSchema(props: Partial<JsonSchema>, isInteger: boolean): ZodSchema {
    let schema: ZodSchema = isInteger ? z.number().int() : z.number();

    if (props.minimum !== undefined) {
      schema = (schema as z.ZodNumber).min(props.minimum);
    }
    if (props.maximum !== undefined) {
      schema = (schema as z.ZodNumber).max(props.maximum);
    }

    return schema;
  }

  private createArraySchema(props: Partial<JsonSchema>): ZodSchema {
    const itemSchema = props.items ? this.convertJsonSchema(props.items) : z.unknown();
    let schema: ZodSchema = z.array(itemSchema);

    if (props.minLength !== undefined) {
      schema = (schema as z.ZodArray<ZodSchema>).min(props.minLength);
    }
    if (props.maxLength !== undefined) {
      schema = (schema as z.ZodArray<ZodSchema>).max(props.maxLength);
    }

    return schema;
  }

  private createObjectSchema(props: Partial<JsonSchema>): ZodSchema {
    const shape: Record<string, ZodSchema> = {};

    if (props.properties) {
      for (const [key, prop] of Object.entries(props.properties)) {
        shape[key] = this.convertJsonSchema(prop as JsonSchema);
      }
    }

    let schema: ZodSchema = z.object(shape);

    if (props.required) {
      // Zod infers required fields from non-optional schemas
    }

    if (props.additionalProperties === false) {
      // Zod object schema doesn't allow additional properties by default
    }

    if (props.allOf) {
      const schemas = props.allOf.map((s) => this.convertJsonSchema(s));
      schema = z.intersection(
        schemas[0] || z.object({}),
        schemas.slice(1).reduce((acc, s) => z.intersection(acc, s as z.ZodObject<Record<string, ZodSchema>>), schemas[0] as z.ZodObject<Record<string, ZodSchema>>)
      );
    }

    if (props.anyOf || props.oneOf) {
      const options = (props.anyOf || props.oneOf || []).map((s) => this.convertJsonSchema(s));
      schema = z.union(options as [ZodSchema, ...ZodSchema[]]);
    }

    return schema;
  }
}

// Singleton instance
let validator: StructuredOutputValidator | null = null;

export function getStructuredOutputValidator(): StructuredOutputValidator {
  if (!validator) {
    validator = new StructuredOutputValidator();
  }
  return validator;
}
