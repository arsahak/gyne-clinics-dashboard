"use client";
import { IconType } from "react-icons";

export type StatTone =
  | "violet"
  | "teal"
  | "rose"
  | "pink"
  | "sky"
  | "amber"
  | "emerald"
  | "orange"
  | "indigo"
  | "lime"
  | "yellow"
  | "slate"
  | "purple"
  | "cyan"
  | "green"
  | "red"
  | "blue"
  | "fuchsia";

export interface StatCard {
  label: string;
  value: number | string;
  sub: string;
  icon: IconType;
  tone: StatTone;
}

// Full literal class strings so Tailwind can detect them — never build these dynamically.
// [light, dark] for the card background and the icon chip.
const TONES: Record<StatTone, { card: [string, string]; chip: [string, string] }> = {
  violet: {
    card: ["from-violet-100 to-violet-50/60 border-violet-200", "from-violet-900/50 to-gray-800 border-violet-900/60"],
    chip: ["bg-violet-200/70 text-violet-700", "bg-violet-900 text-violet-300"],
  },
  teal: {
    card: ["from-teal-100 to-teal-50/60 border-teal-200", "from-teal-900/50 to-gray-800 border-teal-900/60"],
    chip: ["bg-teal-200/70 text-teal-700", "bg-teal-900 text-teal-300"],
  },
  rose: {
    card: ["from-rose-100 to-rose-50/60 border-rose-200", "from-rose-900/50 to-gray-800 border-rose-900/60"],
    chip: ["bg-rose-200/70 text-rose-700", "bg-rose-900 text-rose-300"],
  },
  pink: {
    card: ["from-pink-100 to-pink-50/60 border-pink-200", "from-pink-900/50 to-gray-800 border-pink-900/60"],
    chip: ["bg-pink-200/70 text-pink-700", "bg-pink-900 text-pink-300"],
  },
  sky: {
    card: ["from-sky-100 to-sky-50/60 border-sky-200", "from-sky-900/50 to-gray-800 border-sky-900/60"],
    chip: ["bg-sky-200/70 text-sky-700", "bg-sky-900 text-sky-300"],
  },
  amber: {
    card: ["from-amber-100 to-amber-50/60 border-amber-200", "from-amber-900/50 to-gray-800 border-amber-900/60"],
    chip: ["bg-amber-200/70 text-amber-700", "bg-amber-900 text-amber-300"],
  },
  emerald: {
    card: ["from-emerald-100 to-emerald-50/60 border-emerald-200", "from-emerald-900/50 to-gray-800 border-emerald-900/60"],
    chip: ["bg-emerald-200/70 text-emerald-700", "bg-emerald-900 text-emerald-300"],
  },
  orange: {
    card: ["from-orange-100 to-orange-50/60 border-orange-200", "from-orange-900/50 to-gray-800 border-orange-900/60"],
    chip: ["bg-orange-200/70 text-orange-700", "bg-orange-900 text-orange-300"],
  },
  indigo: {
    card: ["from-indigo-100 to-indigo-50/60 border-indigo-200", "from-indigo-900/50 to-gray-800 border-indigo-900/60"],
    chip: ["bg-indigo-200/70 text-indigo-700", "bg-indigo-900 text-indigo-300"],
  },
  lime: {
    card: ["from-lime-100 to-lime-50/60 border-lime-200", "from-lime-900/50 to-gray-800 border-lime-900/60"],
    chip: ["bg-lime-200/70 text-lime-700", "bg-lime-900 text-lime-300"],
  },
  yellow: {
    card: ["from-yellow-100 to-yellow-50/60 border-yellow-200", "from-yellow-900/50 to-gray-800 border-yellow-900/60"],
    chip: ["bg-yellow-200/70 text-yellow-700", "bg-yellow-900 text-yellow-300"],
  },
  slate: {
    card: ["from-slate-200 to-slate-50/60 border-slate-300", "from-slate-700/50 to-gray-800 border-slate-700"],
    chip: ["bg-slate-300/70 text-slate-700", "bg-slate-700 text-slate-300"],
  },
  purple: {
    card: ["from-purple-100 to-purple-50/60 border-purple-200", "from-purple-900/50 to-gray-800 border-purple-900/60"],
    chip: ["bg-purple-200/70 text-purple-700", "bg-purple-900 text-purple-300"],
  },
  cyan: {
    card: ["from-cyan-100 to-cyan-50/60 border-cyan-200", "from-cyan-900/50 to-gray-800 border-cyan-900/60"],
    chip: ["bg-cyan-200/70 text-cyan-700", "bg-cyan-900 text-cyan-300"],
  },
  green: {
    card: ["from-green-100 to-green-50/60 border-green-200", "from-green-900/50 to-gray-800 border-green-900/60"],
    chip: ["bg-green-200/70 text-green-700", "bg-green-900 text-green-300"],
  },
  red: {
    card: ["from-red-100 to-red-50/60 border-red-200", "from-red-900/50 to-gray-800 border-red-900/60"],
    chip: ["bg-red-200/70 text-red-700", "bg-red-900 text-red-300"],
  },
  blue: {
    card: ["from-blue-100 to-blue-50/60 border-blue-200", "from-blue-900/50 to-gray-800 border-blue-900/60"],
    chip: ["bg-blue-200/70 text-blue-700", "bg-blue-900 text-blue-300"],
  },
  fuchsia: {
    card: ["from-fuchsia-100 to-fuchsia-50/60 border-fuchsia-200", "from-fuchsia-900/50 to-gray-800 border-fuchsia-900/60"],
    chip: ["bg-fuchsia-200/70 text-fuchsia-700", "bg-fuchsia-900 text-fuchsia-300"],
  },
};

interface StatCardsProps {
  cards: StatCard[];
  isDarkMode: boolean;
}

const StatCards = ({ cards, isDarkMode }: StatCardsProps) => {
  const theme = isDarkMode ? 1 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-5 flex items-start gap-3 bg-gradient-to-br shadow-sm ${TONES[card.tone].card[theme]}`}
        >
          <div className={`p-2.5 rounded-xl shrink-0 ${TONES[card.tone].chip[theme]}`}>
            <card.icon size={18} />
          </div>
          <div>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{card.label}</p>
            <p className="text-2xl font-bold mt-0.5">{card.value}</p>
            <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              {card.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatCards;
