"use client";

import React from "react";
import { useMemolandumStore } from "@/store/useMemolandumStore";

export default function PlayGlossaryButton({
  gameSlug = "shooter",
  concepts = [],
  currentConcept = null,
  categoryConcepts = [],
  className = "",
  children
}) {
  const setActiveCustomWords = useMemolandumStore((s) => s.setActiveCustomWords);

  const handlePlay = (e) => {
    e.preventDefault();

    let playable = [];

    if (currentConcept) {
      // User wants to play a single concept
      // Shooter/Lexicon games require MIN_PLAY = 6 words to operate correctly.
      // We will select the target concept + 9 other random concepts from the same category.
      const target = {
        id: currentConcept.id,
        english: currentConcept.title,
        turkish: currentConcept.description,
        romanized: currentConcept.word_alt || "",
        content: currentConcept.content || "",
        audioUrl: "",
        language: "academic",
        origin: "manual" // Treat as custom manual level
      };

      // Filter out the current concept from the category pool
      const pool = categoryConcepts.filter((c) => c.id !== currentConcept.id);
      
      // Shuffle the pool and select 9 random concepts
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const padding = shuffled.slice(0, 9).map((c) => ({
        id: c.id,
        english: c.title,
        turkish: c.description,
        romanized: c.word_alt || "",
        content: c.content || "",
        audioUrl: "",
        language: "academic",
        origin: "manual"
      }));

      playable = [target, ...padding];
    } else if (concepts && concepts.length > 0) {
      // User wants to play a whole list (e.g. whole category)
      playable = concepts.map((c) => ({
        id: c.id,
        english: c.title,
        turkish: c.description,
        romanized: c.word_alt || "",
        content: c.content || "",
        audioUrl: "",
        language: "academic",
        origin: "manual"
      }));
    }

    if (playable.length < 6) {
      alert("Bu oyunu başlatmak için en az 6 kavram gereklidir.");
      return;
    }

    // Set custom words in store
    setActiveCustomWords(playable);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("memolandum-custom-words", JSON.stringify(playable));
      }
    } catch (e) {
      console.warn("Failed to set custom words in sessionStorage:", e);
    }

    // Redirect to the selected game shell
    window.location.href = `/games/${gameSlug}/`;
  };

  return (
    <button onClick={handlePlay} className={className}>
      {children}
    </button>
  );
}
