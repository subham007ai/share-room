import React from "react";
import { FlipWords } from "../ui/flip-words";

export function FlipWordsDemo() {
  const words = ["Code", "Files", "Images"];

  return (
    <div className="flex justify-center items-center px-4">
      <div className="text-5xl mx-auto font-normal text-white whitespace-nowrap">
        Share
        <FlipWords words={words} duration={2000} />
        instantly and anonymously
      </div>
    </div>
  );
}