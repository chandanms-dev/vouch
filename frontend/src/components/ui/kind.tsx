import type { ReactNode } from "react";
import { BookIcon, PinIcon, PlayIcon, StarIcon } from "./icons";

/** Kinds that exist in the data (shows) plus the coming-soon ones used by illustrations and disabled chips. */
export type VisualKind = "tv" | "anime" | "film" | "book" | "place";

interface KindStyle {
  label: string;
  /** Solid field (friend cards, badge fill on dark). */
  field: string;
  /** Border for FoF / anticipation cards. */
  border: string;
  /** Text colour of the icon inside the dark badge. */
  iconText: string;
  /** Dashed border for anticipation cards. */
  dashed: string;
  icon: ReactNode;
}

export const KIND: Record<VisualKind, KindStyle> = {
  tv: { label: "TV", field: "bg-lavender", border: "border-lavender", iconText: "text-lavender", dashed: "border-lavender", icon: <PlayIcon width={12} height={12} /> },
  anime: { label: "Anime", field: "bg-pink", border: "border-pink", iconText: "text-pink", dashed: "border-pink", icon: <StarIcon width={12} height={12} /> },
  film: { label: "Film", field: "bg-lavender", border: "border-lavender", iconText: "text-lavender", dashed: "border-lavender", icon: <PlayIcon width={12} height={12} /> },
  book: { label: "Book", field: "bg-lime", border: "border-lime", iconText: "text-lime", dashed: "border-lime", icon: <BookIcon width={12} height={12} /> },
  place: { label: "Place", field: "bg-sky", border: "border-sky", iconText: "text-sky", dashed: "border-sky", icon: <PinIcon width={12} height={12} /> },
};
