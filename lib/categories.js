// Shared category list + styling so the library, modal, and stats views stay
// consistent. Backgrounds use opacity so they read well in light AND dark mode.
export const CATEGORIES = ["Academic", "Business", "Literature", "Science", "Daily Use", "Other"];
export const ALL_CATEGORIES = ["All", ...CATEGORIES];

export const CATEGORY_STYLES = {
  Academic:    { badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300",         bar: "bg-sky-500" },
  Business:    { badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300", bar: "bg-indigo-500" },
  Literature:  { badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300", bar: "bg-violet-500" },
  Science:     { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300",    bar: "bg-amber-500" },
  "Daily Use": { badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500" },
  Other:       { badge: "bg-stone-500/15 text-stone-600 dark:text-stone-300",    bar: "bg-stone-400" },
};

export function catStyle(name) {
  return CATEGORY_STYLES[name] || CATEGORY_STYLES.Other;
}
