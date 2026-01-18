import React from "react";

type Props = {
  percent: number;
};

export default function StickyReadingProgress({ percent }: Props) {
  if (percent <= 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100] w-full">
      <div
        className="h-full bg-primary"
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
