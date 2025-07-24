import React, { useState, useEffect } from 'react';

interface TypingEffectProps {
  phrases: string[];
  interval?: number;
  typingSpeed?: number;
  className?: string;
  cursorColor?: string;
}

export const TypingEffect: React.FC<TypingEffectProps> = ({ 
  phrases = ["Default Text"], 
  interval = 3000,
  typingSpeed = 100,
  className = "",
  cursorColor = "text-pink-500"
}) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    
    if (isTyping) {
      if (currentText.length < currentPhrase.length) {
        const timer = setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setIsTyping(false);
        }, interval);
        return () => clearTimeout(timer);
      }
    } else {
      if (currentText.length > 0) {
        const timer = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1));
        }, typingSpeed / 2);
        return () => clearTimeout(timer);
      } else {
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        setIsTyping(true);
      }
    }
  }, [currentText, currentPhraseIndex, isTyping, phrases, interval, typingSpeed]);

  return (
    <span className={`font-semibold ${className}`}>
      {currentText}
      <span className={`animate-pulse ${cursorColor} ml-1`}>|</span>
    </span>
  );
}; 