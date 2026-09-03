import React from 'react';

interface HighlightTextProps {
  text: string;
  query?: string;
  indices?: number[];
}

export function HighlightText({ text, query, indices }: HighlightTextProps) {
  if (!text) return null;

  // 1. If explicit character indices are provided (e.g. from fuzzy subsequence/typo matching)
  if (indices && indices.length > 0) {
    const indexSet = new Set(indices);
    const elements: React.ReactNode[] = [];
    let currentSegment = '';
    let isCurrentHighlighted = false;

    for (let i = 0; i < text.length; i++) {
      const isCharHighlighted = indexSet.has(i);

      if (i === 0) {
        currentSegment = text[i];
        isCurrentHighlighted = isCharHighlighted;
      } else if (isCharHighlighted === isCurrentHighlighted) {
        currentSegment += text[i];
      } else {
        // Push previous segment
        if (isCurrentHighlighted) {
          elements.push(
            <mark
              key={`h-${i}-${currentSegment}`}
              className="bg-amber-500/25 text-amber-200 font-semibold rounded-[2px] px-[1px] -mx-[0.5px]"
            >
              {currentSegment}
            </mark>
          );
        } else {
          elements.push(currentSegment);
        }
        currentSegment = text[i];
        isCurrentHighlighted = isCharHighlighted;
      }
    }

    // Flush last segment
    if (currentSegment) {
      if (isCurrentHighlighted) {
        elements.push(
          <mark
            key={`h-last-${currentSegment}`}
            className="bg-amber-500/25 text-amber-200 font-semibold rounded-[2px] px-[1px] -mx-[0.5px]"
          >
            {currentSegment}
          </mark>
        );
      } else {
        elements.push(currentSegment);
      }
    }

    return <>{elements}</>;
  }

  // 2. Fallback to standard query substring match
  if (!query || query.trim() === '') return <>{text}</>;

  try {
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span
              key={i}
              className="bg-indigo-500/30 text-indigo-200 rounded-[2px] px-[1px] -mx-[1px] font-semibold"
            >
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}
