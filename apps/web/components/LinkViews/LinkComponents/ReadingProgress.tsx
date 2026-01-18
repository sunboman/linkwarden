import React from "react";

type Props = {
  percent: number;
};

export default function ReadingProgress({ percent }: Props) {
  if (percent <= 0) return null;

  return (
    <div className="w-full h-1 bg-gray-200 rounded-full mt-2">
      <div
        className="h-full bg-primary rounded-full"
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
