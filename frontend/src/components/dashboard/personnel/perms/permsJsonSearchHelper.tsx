import React from 'react';

export interface JsonSearchMatchesResult {
  matchCount: number;
  matchingLineIndices: Set<number>;
}

export function findJsonSearchMatches(
  lines: string[],
  query: string
): JsonSearchMatchesResult {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return { matchCount: 0, matchingLineIndices: new Set<number>() };
  }

  let count = 0;
  const lineIndices = new Set<number>();

  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    if (lower.includes(normalized)) {
      lineIndices.add(idx);
      let pos = 0;
      while ((pos = lower.indexOf(normalized, pos)) !== -1) {
        count++;
        pos += normalized.length;
      }
    }
  });

  return { matchCount: count, matchingLineIndices: lineIndices };
}

export function renderHighlightedLine(
  line: string,
  query: string,
  lineIdx: number
): React.ReactNode {
  const normalized = query.trim().toLowerCase();
  const lower = line.toLowerCase();

  if (!lower.includes(normalized)) {
    return (
      <div key={lineIdx} className="h-5 leading-5 invisible">
        {line || ' '}
      </div>
    );
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchPos = lower.indexOf(normalized, 0);

  while (matchPos !== -1) {
    if (matchPos > lastIndex) {
      parts.push(
        <span key={`${lineIdx}-${lastIndex}`} className="invisible">
          {line.substring(lastIndex, matchPos)}
        </span>
      );
    }
    parts.push(
      <mark
        key={`${lineIdx}-match-${matchPos}`}
        className="bg-brand-red/60 text-white font-bold rounded-xs px-0.5"
      >
        {line.substring(matchPos, matchPos + normalized.length)}
      </mark>
    );
    lastIndex = matchPos + normalized.length;
    matchPos = lower.indexOf(normalized, lastIndex);
  }

  if (lastIndex < line.length) {
    parts.push(
      <span key={`${lineIdx}-end`} className="invisible">
        {line.substring(lastIndex)}
      </span>
    );
  }

  return (
    <div key={lineIdx} className="h-5 leading-5">
      {parts}
    </div>
  );
}
