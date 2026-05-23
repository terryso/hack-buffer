// Master switch for AI features (TL;DR, semantic related posts, semantic search,
// and the /api/public/sync-posts endpoint).
//
// Default: ENABLED. The current Lovable deployment relies on it.
// To run as a pure static blog with zero server-side dependencies, set:
//   VITE_ENABLE_AI=false
//
// VITE_-prefixed vars are inlined at build time, so this works in both the
// browser bundle and server functions.
export const AI_ENABLED = import.meta.env.VITE_ENABLE_AI !== "false";
