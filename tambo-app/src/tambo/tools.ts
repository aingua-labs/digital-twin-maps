import type { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { areas, evidenceLevels, functions, getFeature, getUseCase, industries, searchFeatures, searchUseCases } from "../data/catalog";
import { openMap } from "../mapBus";

/* Tools run in the browser against the catalog extracted from the two maps. They are the assistant's only
   source of facts about use cases and features. */

const useCaseHit = z.object({ id: z.string(), title: z.string(), industries: z.array(z.string()), situation: z.string(), result: z.string(), evidence: z.string() });
const featureHit = z.object({ id: z.string(), title: z.string(), area: z.string(), availability: z.string(), what: z.string(), goodToKnow: z.string() });

export const tools: TamboTool[] = [
  {
    name: "search_use_cases",
    description: "Search the 74 Digital Twin use cases by what the visitor describes. Returns ids to pass to UseCaseStory or UseCaseList. Always call this before describing or showing a use case.",
    tool: async (input: { query?: string; industry?: string; businessFunction?: string; evidence?: string; limit?: number }) =>
      searchUseCases(input).map((u) => ({ id: u.id, title: u.title, industries: u.industries, situation: u.situation, result: u.result, evidence: u.evidence })),
    inputSchema: z.object({
      query: z.string().optional().describe("Keywords from the visitor's situation, e.g. 'retiring engineer knowledge' or 'RFP answers'"),
      industry: z.string().optional().describe("Filter by industry. One of: " + industries.join("; ")),
      businessFunction: z.string().optional().describe("Filter by business function. One of: " + functions.join("; ")),
      evidence: z.string().optional().describe("Filter by evidence level. One of: " + evidenceLevels.join(", ") + ". Use 'Measured' when the visitor asks for proven or measured results."),
      limit: z.number().optional().describe("Maximum results, default 6"),
    }),
    outputSchema: z.array(useCaseHit),
  },
  {
    name: "get_use_case",
    description: "Get every detail of one use case by id: steps, safeguards, benchmark, functions and outcomes.",
    tool: async (input: { id: string }) => getUseCase(input.id) ?? { error: "No use case with that id" },
    inputSchema: z.object({ id: z.string().describe("Use case id, e.g. 'u17'") }),
    outputSchema: z.any(),
  },
  {
    name: "search_features",
    description: "Search the 112 platform features (twin types, data sources, AI engine, capture, asking, meetings, drafting, surfaces, admin, security, deployment). Returns ids to pass to FeatureCard or FeatureList. Always call this before describing a capability.",
    tool: async (input: { query?: string; area?: string; audience?: string; limit?: number }) =>
      searchFeatures(input).map((f) => ({ id: f.id, title: f.title, area: f.area, availability: f.availability, what: f.what, goodToKnow: f.goodToKnow })),
    inputSchema: z.object({
      query: z.string().optional().describe("Keywords, e.g. 'permissions', 'own Azure cloud', 'meeting summary'"),
      area: z.string().optional().describe("Filter by product area. One of: " + areas.join("; ")),
      audience: z.string().optional().describe("Filter by who uses it, e.g. 'IT and security teams'"),
      limit: z.number().optional().describe("Maximum results, default 6"),
    }),
    outputSchema: z.array(featureHit),
  },
  {
    name: "get_feature",
    description: "Get every detail of one platform feature by id.",
    tool: async (input: { id: string }) => getFeature(input.id) ?? { error: "No feature with that id" },
    inputSchema: z.object({ id: z.string().describe("Feature id, e.g. 'g_perm'") }),
    outputSchema: z.any(),
  },
  {
    name: "show_on_map",
    description: "Point the 3D map beside the chat at one use case or feature. Use when the visitor asks to see something on the map.",
    tool: async (input: { kind: "use_case" | "feature"; id: string }) => {
      const item = input.kind === "use_case" ? getUseCase(input.id) : getFeature(input.id);
      if (!item) return { shown: false, reason: "No item with that id" };
      openMap(input.kind === "use_case" ? "use-cases" : "product", item.hash);
      return { shown: true, title: item.title };
    },
    inputSchema: z.object({
      kind: z.enum(["use_case", "feature"]).describe("Which map the item is on"),
      id: z.string().describe("The item's id from a search tool"),
    }),
    outputSchema: z.object({ shown: z.boolean(), title: z.string().optional(), reason: z.string().optional() }),
  },
];
