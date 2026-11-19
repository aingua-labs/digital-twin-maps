import { TamboProvider, TamboStubProvider } from "@tambo-ai/react";
import { Chat } from "./components/Chat";
import { MapStage } from "./components/MapStage";
import { components } from "./tambo/components";
import { contextHelpers } from "./tambo/context";
import { sampleThread } from "./tambo/sample";
import { tools } from "./tambo/tools";

const apiKey = import.meta.env.VITE_TAMBO_API_KEY as string | undefined;
const live = !!apiKey && apiKey !== "your_api_key_here";

/** Threads are kept per visitor. Swap this for your signed-in user's id when the app has sign-in. */
function visitorKey() {
  try {
    let k = localStorage.getItem("dt-visitor");
    if (!k) { k = "visitor-" + crypto.randomUUID(); localStorage.setItem("dt-visitor", k); }
    return k;
  } catch { return "visitor-anonymous"; }
}

function Shell() {
  return (
    <>
      <div id="ambient" aria-hidden="true"><i className="b1" /><i className="b2" /><i className="b3" /><div className="wash" /></div>
      <main className="layout">
        <MapStage />
        <Chat live={live} />
      </main>
    </>
  );
}

export default function App() {
  // Without a key the app still runs, showing a sample conversation, so the layout and cards can be reviewed.
  if (!live) return <TamboStubProvider components={components} tools={tools} thread={sampleThread}><Shell /></TamboStubProvider>;
  return (
    <TamboProvider apiKey={apiKey} userKey={visitorKey()} components={components} tools={tools} contextHelpers={contextHelpers}>
      <Shell />
    </TamboProvider>
  );
}
