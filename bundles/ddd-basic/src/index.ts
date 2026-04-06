import type { Bundle, SpecMetadata } from '@fixedcode/engine';
import type { Context } from '@fixedcode/engine';
import { enrich, DddBasicSpec, AggregateContext } from './enrich/index.js';

const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["package", "aggregates"],
  "properties": {
    "package": {
      "type": "string",
      "description": "Java package name for generated code"
    },
    "boundedContext": {
      "type": "string",
      "description": "Bounded context name"
    },
    "aggregates": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "required": ["attributes"],
        "properties": {
          "attributes": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name", "type"],
              "properties": {
                "name": { "type": "string" },
                "type": { "type": "string", "enum": ["uuid", "string", "int", "long", "boolean", "decimal", "date", "datetime", "object"] },
                "identity": { "type": "boolean" },
                "required": { "type": "boolean" },
                "default": { "type": "string" }
              }
            }
          },
          "commands": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name"],
              "properties": {
                "name": { "type": "string" },
                "params": { "type": "array" },
                "emits": { "type": "string" }
              }
            }
          },
          "queries": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name"],
              "properties": {
                "name": { "type": "string" },
                "returns": { "type": "string", "enum": ["single", "list"] },
                "filters": { "type": "array" }
              }
            }
          },
          "events": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["name"],
              "properties": {
                "name": { "type": "string" },
                "fields": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string" },
                      "type": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export interface DddBasicContext extends Context {
  package: string;
  boundedContext?: string;
  aggregates: AggregateContext[];
}

function transformSpec(spec: DddBasicSpec, _metadata: SpecMetadata): DddBasicContext {
  return {
    package: spec.package,
    boundedContext: spec.boundedContext,
    aggregates: enrich(spec)
  };
}

const helpers = {
  eq: (a: unknown, b: unknown) => a === b,
};

export const bundle: Bundle = {
  kind: 'ddd-basic',
  specSchema: schema as Bundle['specSchema'],
  enrich: transformSpec as unknown as (spec: Record<string, unknown>, metadata: SpecMetadata) => Context,
  templates: 'templates',
  helpers,
};

export default bundle;