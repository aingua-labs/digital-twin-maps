import type { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";
import { getFeature, getUseCase } from "../data/catalog";
import { openMap } from "../mapBus";

/* The assistant only ever chooses WHICH card to show (an id). Every word and number on a card comes from
   the map data, so a generated card cannot carry an invented figure. Props arrive piece by piece while a
   reply streams, so each component tolerates missing props. */

const EV: Record<string, string> = { Measured: "ev-measured", Modelled: "ev-modelled", Stated: "ev-stated", Benchmark: "ev-bench" };

function Missing({ what }: { what: string }) {
  return <div className="gcard ghost" aria-busy="true">Finding {what}…</div>;
}

/* ---------- one use case, told as a story ---------- */
const useCaseStorySchema = z.object({
  useCaseId: z.string().describe("Id of the use case to show, exactly as returned by search_use_cases, e.g. 'u17'"),
}).describe("Shows one use case in full: the situation, what the twin does, what changed and the safeguards");

export function UseCaseStory({ useCaseId }: Partial<z.infer<typeof useCaseStorySchema>>) {
  const u = getUseCase(useCaseId);
  if (!u) return <Missing what="the use case" />;
  return (
    <article className="gcard story">
      <header>
        <span className="kicker">{u.industries.join(" · ")}</span>
        <h3>{u.title}</h3>
      </header>
      <section><h4>The situation</h4><p>{u.situation}</p></section>
      <section>
        <h4>What the twin does</h4>
        <ol>{u.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
      </section>
      <section className="result">
        <h4>What changed <span className={"ev " + (EV[u.evidence] ?? "")}>{u.evidence}</span></h4>
        <p>{u.result}</p>
      </section>
      {u.safeguards && <section><h4>Safeguards</h4><p>{u.safeguards}</p></section>}
      <footer><button type="button" onClick={() => openMap("use-cases", u.hash)}>Show on the use case map →</button></footer>
    </article>
  );
}

/* ---------- several use cases to choose between ---------- */
const useCaseListSchema = z.object({
  heading: z.string().describe("Short heading for the list, e.g. 'Use cases for retiring experts'"),
  useCaseIds: z.array(z.string()).describe("Two to six use case ids, exactly as returned by search_use_cases, most relevant first"),
}).describe("Shows a short list of use cases, each with its situation and result, for the visitor to choose from");

export function UseCaseList({ heading, useCaseIds }: Partial<z.infer<typeof useCaseListSchema>>) {
  const items = (useCaseIds ?? []).map(getUseCase).filter((u) => !!u);
  if (!items.length) return <Missing what="use cases" />;
  return (
    <div className="gcard list">
      {heading && <h3>{heading}</h3>}
      <ul>
        {items.map((u) => (
          <li key={u.id}>
            <button type="button" onClick={() => openMap("use-cases", u.hash)}>
              <span className="kicker">{u.industries[0]}</span>
              <b>{u.title}</b>
              <span className="line">{u.situation.split(". ")[0]}.</span>
              <span className="res"><span className={"ev " + (EV[u.evidence] ?? "")}>{u.evidence}</span>{u.result.split("; ")[0].replace(/\.$/, "")}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- one platform feature ---------- */
const featureCardSchema = z.object({
  featureId: z.string().describe("Id of the platform feature, exactly as returned by search_features, e.g. 'g_perm'"),
}).describe("Shows one platform feature: what it does, how it works, why it matters and anything to be aware of");

export function FeatureCard({ featureId }: Partial<z.infer<typeof featureCardSchema>>) {
  const f = getFeature(featureId);
  if (!f) return <Missing what="the feature" />;
  return (
    <article className="gcard feature">
      <header>
        <span className="kicker">{f.area} · {f.availability}</span>
        <h3>{f.title}</h3>
      </header>
      <p className="lead">{f.what}</p>
      <section><h4>How it works</h4><ol>{f.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></section>
      <section><h4>Why it matters</h4><p>{f.why}</p></section>
      {f.goodToKnow && <section className="note"><h4>Good to know</h4><p>{f.goodToKnow}</p></section>}
      <footer><button type="button" onClick={() => openMap("product", f.hash)}>Show on the product map →</button></footer>
    </article>
  );
}

/* ---------- several features, e.g. everything that answers a security question ---------- */
const featureListSchema = z.object({
  heading: z.string().describe("Short heading for the list, e.g. 'How access is controlled'"),
  featureIds: z.array(z.string()).describe("Two to eight feature ids, exactly as returned by search_features, most relevant first"),
}).describe("Shows a short list of platform features, each with what it does and its availability");

export function FeatureList({ heading, featureIds }: Partial<z.infer<typeof featureListSchema>>) {
  const items = (featureIds ?? []).map(getFeature).filter((f) => !!f);
  if (!items.length) return <Missing what="features" />;
  return (
    <div className="gcard list">
      {heading && <h3>{heading}</h3>}
      <ul>
        {items.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => openMap("product", f.hash)}>
              <span className="kicker">{f.area} · {f.availability}</span>
              <b>{f.title}</b>
              <span className="line">{f.what}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const components: TamboComponent[] = [
  { name: "UseCaseStory", component: UseCaseStory, propsSchema: useCaseStorySchema,
    description: "One use case told in full. Use when the visitor asks about a specific situation or picks one use case. Call search_use_cases first to get the id." },
  { name: "UseCaseList", component: UseCaseList, propsSchema: useCaseListSchema,
    description: "A short list of use cases. Use when several use cases match what the visitor described, or they ask what others in an industry or function have done." },
  { name: "FeatureCard", component: FeatureCard, propsSchema: featureCardSchema,
    description: "One platform feature in full. Use when the visitor asks how a specific capability works. Call search_features first to get the id." },
  { name: "FeatureList", component: FeatureList, propsSchema: featureListSchema,
    description: "A short list of platform features. Use for questions that several features answer together, such as security, deployment options or where people can use twins." },
];
