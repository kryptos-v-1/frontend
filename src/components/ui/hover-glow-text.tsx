import React from "react";

export function HoverGlowText({ text }: { text: string }) {
  const letters = text.split("");
  return (
    <span className="group flex cursor-default">
      {letters.map((letter, i) => (
        <span
          key={i}
          className="transition-all duration-300 group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{ transitionDelay: `${i * 50}ms` }}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}
