import { useEffect, useRef, useState } from "react";
import { useTambo, useTamboThreadInput } from "@tambo-ai/react";

const STARTERS = [
  "We have engineers retiring next year. What have others done?",
  "Which use cases have measured results?",
  "How do twins keep answers within what a person is allowed to see?",
  "Can this run in our own Azure cloud?",
];

const TOOL_LABEL: Record<string, string> = {
  search_use_cases: "Searching the use cases",
  get_use_case: "Reading the use case",
  search_features: "Searching the features",
  get_feature: "Reading the feature",
  show_on_map: "Pointing the map",
};

export function Chat({ live }: { live: boolean }) {
  const { messages, isStreaming, isWaiting, startNewThread } = useTambo();
  const { value, setValue, submit, isPending, isDisabled, error } = useTamboThreadInput();
  const [queued, setQueued] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const busy = isPending || isStreaming || isWaiting;

  // A starter fills the input, then sends once the input state has caught up.
  useEffect(() => {
    if (queued !== null && value === queued) { setQueued(null); void submit().catch(() => {}); }
  }, [queued, value, submit]);

  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [messages, busy]);

  const send = () => { if (value.trim() && !busy) void submit().catch(() => {}); };

  const shown = messages.filter((m) => m.role !== "system" && m.content.some((c) => c.type === "text" ? c.text.trim() : c.type === "component" || c.type === "tool_use"));

  return (
    <aside className="chat glass" aria-label="Ask the maps">
      <header className="chat-head">
        <div>
          <span className="kicker">Ask the maps</span>
          <h2>Describe your situation</h2>
        </div>
        {shown.length > 0 && live && <button type="button" className="quiet" onClick={() => startNewThread()}>New chat</button>}
      </header>

      <div className="chat-body" aria-live="polite">
        {shown.length === 0 && (
          <div className="empty">
            <p>Tell me what you are trying to solve. I will find the use cases and platform features that fit, and show them on the map.</p>
            <div className="starters">
              {STARTERS.map((s) => (
                <button key={s} type="button" disabled={!live || busy} onClick={() => { setValue(s); setQueued(s); }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {shown.map((m) => (
          <div key={m.id} className={"msg " + m.role}>
            {m.content.map((c, i) => {
              if (c.type === "text") return c.text.trim() ? <p key={i} className="bubble">{c.text}</p> : null;
              if (c.type === "component") return <div key={c.id ?? i} className="gen">{c.renderedComponent ?? null}</div>;
              if (c.type === "tool_use" && !c.hasCompleted) return <p key={c.id ?? i} className="tool">{TOOL_LABEL[c.name] ?? "Working"}…</p>;
              return null;
            })}
          </div>
        ))}
        {busy && <p className="tool" role="status">Thinking…</p>}
        {error && <p className="err" role="alert">{error.message}</p>}
        <div ref={end} />
      </div>

      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea
          rows={1}
          value={value}
          placeholder={live ? "For example: our support experts are a bottleneck" : "Add a Tambo API key to start asking"}
          disabled={!live || isDisabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          aria-label="Your question"
        />
        <button type="submit" disabled={!live || isDisabled || busy || !value.trim()}>Ask</button>
      </form>
      {!live && (
        <p className="setup">
          Preview mode: the cards above are a sample. Run <code>npx tambo init</code>, put the key in <code>.env.local</code> as <code>VITE_TAMBO_API_KEY</code> and restart.
        </p>
      )}
    </aside>
  );
}
