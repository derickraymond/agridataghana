export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="8" fill={light ? "#fff" : "#14532d"} />
        <path d="M16 25V13" stroke="#3aa655" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M16 15c0-4 2.5-6.5 7-6.5 0 4-2.5 6.5-7 6.5Z" fill="#3aa655" />
        <path d="M16 19c0-3.4-2.2-5.6-6.5-5.6 0 3.4 2.2 5.6 6.5 5.6Z" fill={light ? "#14532d" : "#b1d5bb"} />
      </svg>
      <span className={`text-lg font-bold tracking-tight ${light ? "text-white" : "text-forest-900"}`}>
        AgriData <span className={light ? "text-fresh-400" : "text-fresh-600"}>Ghana</span>
      </span>
    </span>
  );
}
