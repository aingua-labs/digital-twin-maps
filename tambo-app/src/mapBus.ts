// A tiny bridge so tools and cards (which live outside the map viewer) can point the viewer at a node.
export type MapKind = "use-cases" | "product";
export interface MapTarget { kind: MapKind; hash: string }

type Listener = (t: MapTarget) => void;
const listeners = new Set<Listener>();
export const onOpenMap = (fn: Listener) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const openMap = (kind: MapKind, hash = "") => listeners.forEach((fn) => fn({ kind, hash }));
