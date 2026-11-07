// The page reads this browser's own data after mount, so the server only sends a loading
// frame. Opt out of instant-navigation validation, which would otherwise flag that.
export { default } from "./view";
export const instant = false;
