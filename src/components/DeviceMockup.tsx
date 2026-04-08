interface DeviceMockupProps {
  className?: string;
}

export default function DeviceMockup({ className = '' }: DeviceMockupProps) {
  return (
    <div
      className={`flex items-end justify-center gap-6 ${className}`}
      aria-hidden="true"
    >
      {/* Laptop */}
      <div className="relative">
        {/* Screen */}
        <div className="w-64 h-44 rounded-t-xl border-2 border-gray-200 dark:border-navy-700 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-blue-600/10 via-blue-400/5 to-transparent dark:from-blue-600/20 dark:via-blue-400/10 dark:to-navy-800">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-200 dark:border-navy-700">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
              <span className="ml-2 h-2 w-24 rounded-full bg-gray-200/60 dark:bg-navy-700" />
            </div>
            {/* Fake content lines */}
            <div className="p-3 space-y-2">
              <div className="h-2 w-20 rounded bg-gray-200/80 dark:bg-navy-700" />
              <div className="h-1.5 w-full rounded bg-gray-200/50 dark:bg-navy-700/60" />
              <div className="h-1.5 w-3/4 rounded bg-gray-200/50 dark:bg-navy-700/60" />
              <div className="mt-3 h-6 w-16 rounded bg-blue-600/20" />
            </div>
          </div>
        </div>
        {/* Base / Keyboard */}
        <div className="w-72 h-3 -mx-4 rounded-b-lg bg-gray-200 dark:bg-navy-700 border-x-2 border-b-2 border-gray-200 dark:border-navy-700" />
        <div className="w-36 h-1 mx-auto rounded-b bg-gray-200 dark:bg-navy-700" />
      </div>

      {/* Phone */}
      <div className="relative w-20 h-40 rounded-2xl border-2 border-gray-200 dark:border-navy-700 overflow-hidden">
        {/* Notch */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full bg-gray-200 dark:bg-navy-700" />
        {/* Screen content */}
        <div className="w-full h-full bg-gradient-to-br from-blue-600/10 via-blue-400/5 to-transparent dark:from-blue-600/20 dark:via-blue-400/10 dark:to-navy-800 pt-5 p-2">
          <div className="space-y-1.5">
            <div className="h-1.5 w-10 rounded bg-gray-200/80 dark:bg-navy-700" />
            <div className="h-1 w-full rounded bg-gray-200/50 dark:bg-navy-700/60" />
            <div className="h-1 w-3/4 rounded bg-gray-200/50 dark:bg-navy-700/60" />
            <div className="mt-2 h-4 w-10 rounded bg-blue-600/20" />
          </div>
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gray-200 dark:bg-navy-700" />
      </div>
    </div>
  );
}
