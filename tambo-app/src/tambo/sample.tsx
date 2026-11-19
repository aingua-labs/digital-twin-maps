import { UseCaseList, UseCaseStory } from "./components";

/* Shown only in preview mode (no API key). Built from real catalog ids so it looks like a live reply. */
export const sampleThread = {
  messages: [
    { id: "s1", role: "user" as const, content: [{ type: "text" as const, text: "We have engineers retiring next year. What have others done?" }] },
    {
      id: "s2", role: "assistant" as const,
      content: [
        { type: "text" as const, text: "Several teams started capture before the expert left. These are the closest matches." },
        { type: "component" as const, id: "c1", name: "UseCaseList", props: { heading: "Use cases for retiring experts", useCaseIds: ["u17", "u25", "u24"] },
          renderedComponent: <UseCaseList heading="Use cases for retiring experts" useCaseIds={["u17", "u25", "u24"]} /> },
        { type: "text" as const, text: "This one has a business-case figure for onboarding the successor." },
        { type: "component" as const, id: "c2", name: "UseCaseStory", props: { useCaseId: "u25" }, renderedComponent: <UseCaseStory useCaseId="u25" /> },
      ],
    },
  ],
};
