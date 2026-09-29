import React, { useRef, useEffect } from 'react';

interface OtpInputBoxesProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export function OtpInputBoxes({ value, onChange, disabled = false }: OtpInputBoxesProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split into 6 characters
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleChange = (index: number, char: string) => {
    // Only accept numeric characters
    const numericChar = char.replace(/[^0-9]/g, '');
    if (!numericChar && char !== '') return;

    const newDigits = [...digits];
    newDigits[index] = numericChar ? numericChar.slice(-1) : '';
    const newCombined = newDigits.join('').slice(0, 6);
    onChange(newCombined);

    // Auto-advance if digit entered
    if (numericChar && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const targetIndex = Math.min(pasted.length, 5);
      inputsRef.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 py-2">
      {Array.from({ length: 6 }).map((_, i) => {
        const isFilled = Boolean(digits[i]);
        return (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            disabled={disabled}
            value={digits[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            aria-label={`Verification digit ${i + 1} of 6`}
            className={`w-11 sm:w-13 h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all duration-200 focus:outline-none select-none ${
              isFilled
                ? 'bg-[#0E0E14] border-red-500/70 text-white shadow-[0_0_12px_rgba(229,9,20,0.25)]'
                : 'bg-[#07070A] border-white/[0.12] text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/40'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        );
      })}
    </div>
  );
}
