import raw from "./catalog.json";

export interface UseCase {
  id: string; title: string; situation: string; steps: string[]; result: string; safeguards: string; benchmark: string;
  industries: string[]; functions: string[]; outcomes: string[]; evidence: string;
  headline: { value: string; label: string; basis: string } | null; hash: string;
}
export interface Feature {
  id: string; title: string; what: string; steps: string[]; why: string; goodToKnow: string;
  area: string; audiences: string[]; benefits: string[]; availability: string; hash: string;
}

export const platform: string = raw.platform;
export const useCases = raw.useCases as UseCase[];
export const features = raw.features as Feature[];

const ucById = new Map(useCases.map((u) => [u.id, u]));
const ftById = new Map(features.map((f) => [f.id, f]));
export const getUseCase = (id?: string) => (id ? ucById.get(id) : undefined);
export const getFeature = (id?: string) => (id ? ftById.get(id) : undefined);

export const industries = [...new Set(useCases.flatMap((u) => u.industries))].sort();
export const functions = [...new Set(useCases.flatMap((u) => u.functions))].sort();
export const areas = [...new Set(features.map((f) => f.area))];
export const evidenceLevels = [...new Set(useCases.map((u) => u.evidence))];

const STOP = new Set("a an and are as at be by do for from has have how i in is it its me my of on or our that the their them they this to us was we what when where which who with you your can does".split(" "));
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(" ").filter((t) => t.length > 1 && !STOP.has(t));
const stem = (t: string) => t.replace(/(ing|ers|er|ed|es|s)$/, "");

/** Plain keyword scoring: title matches count most, then the opening line, then the rest. */
function score(query: string, fields: [string, number][]) {
  const q = [...new Set(tokens(query).map(stem))];
  if (!q.length) return 1;
  let total = 0;
  for (const [text, weight] of fields) {
    const words = new Set(tokens(text).map(stem));
    for (const t of q) if (words.has(t)) total += weight;
  }
  return total;
}
const has = (list: string[], want?: string) => !want || list.some((x) => x.toLowerCase().includes(want.toLowerCase()));

export function searchUseCases(o: { query?: string; industry?: string; businessFunction?: string; evidence?: string; limit?: number }) {
  return useCases
    .filter((u) => has(u.industries, o.industry) && has(u.functions, o.businessFunction) && has([u.evidence], o.evidence))
    .map((u) => ({ u, s: score(o.query ?? "", [[u.title, 4], [u.situation, 3], [u.result, 2], [u.steps.join(" "), 1], [u.industries.concat(u.functions, u.outcomes).join(" "), 2]]) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, o.limit ?? 6)
    .map((x) => x.u);
}
export function searchFeatures(o: { query?: string; area?: string; audience?: string; limit?: number }) {
  return features
    .filter((f) => has([f.area], o.area) && has(f.audiences, o.audience))
    .map((f) => ({ f, s: score(o.query ?? "", [[f.title, 4], [f.what, 3], [f.why, 2], [f.steps.join(" ") + " " + f.goodToKnow, 1], [f.area + " " + f.benefits.join(" "), 2]]) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, o.limit ?? 6)
    .map((x) => x.f);
}
