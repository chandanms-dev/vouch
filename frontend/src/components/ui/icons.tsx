import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ width: 16, height: 16, "aria-hidden": true, focusable: false, ...p });

export const PlayIcon = (p: P) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...base(p)}><path d="M4 2.5v11l9-5.5z" /></svg>
);
export const StarIcon = (p: P) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...base(p)}><path d="m8 1.5 1.9 4.3 4.6.4-3.5 3.1 1.1 4.5L8 11.4 3.9 13.8 5 9.3 1.5 6.2l4.6-.4z" /></svg>
);
export const BookIcon = (p: P) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...base(p)}><rect x="5" y="2" width="6" height="12" rx="1" /></svg>
);
export const PinIcon = (p: P) => (
  <svg viewBox="0 0 16 16" fill="currentColor" {...base(p)}><path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.3 4.5 8.5 4.5 8.5S12.5 9.3 12.5 6A4.5 4.5 0 0 0 8 1.5z" /></svg>
);
const stroke = (p: P) => ({ ...base({ width: 24, height: 24, ...p }), fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });
export const SearchIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...stroke(p)}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...stroke(p)}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...stroke({ strokeWidth: 3, ...p })}><path d="M12 5v14M5 12h14" /></svg>
);
export const LinkIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...stroke(p)}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.700l1-1" /></svg>
);
export const MailIcon = (p: P) => (
  <svg viewBox="0 0 48 48" {...stroke({ width: 48, height: 48, strokeWidth: 2.5, ...p })}><rect x="5" y="10" width="38" height="28" rx="4" /><path d="m6 13 18 14 18-14" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg viewBox="0 0 48 48" {...stroke({ width: 48, height: 48, strokeWidth: 2.5, ...p })}><circle cx="24" cy="24" r="18" /><path d="M24 13v11l7 5" /></svg>
);
export const AlertIcon = (p: P) => (
  <svg viewBox="0 0 48 48" {...stroke({ width: 48, height: 48, strokeWidth: 2.5, ...p })}><circle cx="24" cy="24" r="18" /><path d="M24 14v13M24 33v.5" /></svg>
);
export const ChevronRightIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...stroke(p)}><path d="m9 6 6 6-6 6" /></svg>
);
