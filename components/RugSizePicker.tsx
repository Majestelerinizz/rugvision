"use client";

import {
  formatRugSize,
  isSameRugSize,
  RUG_SIZE_PRESETS,
  type RugSize,
} from "@/lib/rug-scale";

type Props = {
  originalWidthCm: number;
  originalLengthCm: number;
  selected: Pick<RugSize, "widthCm" | "lengthCm">;
  onChange: (size: RugSize) => void;
};

export default function RugSizePicker({
  originalWidthCm,
  originalLengthCm,
  selected,
  onChange,
}: Props) {
  const original: RugSize = {
    label: `Orijinal ${formatRugSize(originalWidthCm, originalLengthCm)}`,
    widthCm: originalWidthCm,
    lengthCm: originalLengthCm,
  };

  const extras = RUG_SIZE_PRESETS.filter(
    (preset) => !isSameRugSize(preset, original)
  );

  const options = [original, ...extras];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-zinc-500">Odada dene — ölçü (cm)</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Halı ölçüsü">
        {options.map((option) => {
          const active = isSameRugSize(option, selected);
          return (
            <button
              key={`${option.widthCm}x${option.lengthCm}`}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={active}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold border transition",
                active
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                  : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700",
              ].join(" ")}
            >
              {option.label.startsWith("Orijinal")
                ? option.label.replace("Orijinal ", "")
                : option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
