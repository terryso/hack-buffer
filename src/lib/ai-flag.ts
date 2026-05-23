// Master switch for AI features (TL;DR, semantic related posts, semantic search,
// and the /api/public/sync-posts endpoint). When false, the site runs as a
// pure static blog with zero server-side dependencies.
//
// Enable by setting in `.env`:
//   VITE_ENABLE_AI=true
//
// VITE_-prefixed vars are inlined at build time, so this works in both the
// browser bundle and server functions.
export const AI_ENABLED = import.meta.env.VITE_ENABLE_AI === "true";
