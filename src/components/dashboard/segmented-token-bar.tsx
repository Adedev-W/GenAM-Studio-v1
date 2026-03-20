"use client";

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

interface SegmentedTokenBarProps {
  prompt: number;
  completion: number;
  total: number;
  promptColor?: string;
  completionColor?: string;
  height?: string;
}

export function SegmentedTokenBar({
  prompt,
  completion,
  total,
  promptColor = "hsl(var(--chart-1) / 0.55)",
  completionColor = "hsl(var(--chart-2) / 0.55)",
  height = "h-5",
}: SegmentedTokenBarProps) {
  if (total === 0) return <div className={`${height} rounded-full bg-muted`} />;

  const promptPct = (prompt / total) * 100;
  const completionPct = (completion / total) * 100;
  const showPromptLabel = promptPct >= 18;
  const showCompletionLabel = completionPct >= 18;

  return (
    <div className={`flex ${height} rounded-full bg-muted overflow-hidden`}>
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-500"
        style={{ width: `${promptPct}%`, background: promptColor }}
        title={`Prompt: ${fmt(prompt)}`}
      >
        {showPromptLabel && (
          <span className="text-[10px] font-medium text-white/90 px-1.5 truncate">
            {fmt(prompt)}
          </span>
        )}
      </div>
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-500"
        style={{ width: `${completionPct}%`, background: completionColor }}
        title={`Completion: ${fmt(completion)}`}
      >
        {showCompletionLabel && (
          <span className="text-[10px] font-medium text-white/90 px-1.5 truncate">
            {fmt(completion)}
          </span>
        )}
      </div>
    </div>
  );
}
