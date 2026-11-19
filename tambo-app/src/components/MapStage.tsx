import { useEffect, useState } from "react";
import { onOpenMap, type MapKind } from "../mapBus";

const MAPS: Record<MapKind, { label: string; file: string; hint: string }> = {
  "use-cases": { label: "Where it is used", file: "maps/use-case-map.html", hint: "74 use cases by industry and function" },
  product: { label: "What it does", file: "maps/product-map.html", hint: "112 features across 11 product areas" },
};

export function MapStage() {
  const [kind, setKind] = useState<MapKind>("use-cases");
  const [hash, setHash] = useState("");
  // the assistant and the cards point the map here
  useEffect(() => onOpenMap((t) => { setKind(t.kind); setHash(t.hash); }), []);

  return (
    <section className="stage">
      <header className="stage-head">
        <div>
          <span className="kicker">Digital Twin platform</span>
          <h1>A Digital Twin answers the way your expert would.</h1>
        </div>
        <div className="tabs" role="tablist" aria-label="Maps">
          {(Object.keys(MAPS) as MapKind[]).map((k) => (
            <button key={k} role="tab" aria-selected={k === kind} className={k === kind ? "on" : ""} title={MAPS[k].hint}
              onClick={() => { setKind(k); setHash(""); }}>{MAPS[k].label}</button>
          ))}
        </div>
      </header>
      <div className="frame glass">
        {/* key forces a fresh load when the target changes, so a deep link always lands */}
        <iframe key={kind + hash} title={MAPS[kind].label + " map"} src={MAPS[kind].file + hash} />
      </div>
    </section>
  );
}
