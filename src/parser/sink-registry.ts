import type { Sink } from "../types/sink";

/**
 * Central registry for attribute-name -> Sink mappings.
 *
 * This module is intentionally minimal and has no imports from any sinks
 * so it can be imported by sink implementations without creating circular
 * dependencies.
 */
export const sinkByAttributeName: Map<string, Sink<any>> = new Map();

export const registerSink = (name: string, sink: Sink<any>) => {
  sinkByAttributeName.set(name, sink);
};

export const registerBulk = (entries: Iterable<readonly [string, Sink<any>]>) => {
  for (const [k, v] of entries) {
    sinkByAttributeName.set(k, v as Sink<any>);
  }
};

export const getSink = (name: string) => sinkByAttributeName.get(name);

export default sinkByAttributeName;
