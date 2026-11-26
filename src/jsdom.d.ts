// jsdom ships no TypeScript types; the WordPress import script only uses it for
// HTML-entity decoding. Declare it loosely so `next build` type-checking passes.
declare module 'jsdom'
