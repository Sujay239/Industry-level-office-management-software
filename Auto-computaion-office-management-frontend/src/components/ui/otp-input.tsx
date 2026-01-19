import React, { useRef } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    className?: string;
    onComplete?: (value: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({
    length = 6,
    value,
    onChange,
    className,
    onComplete
}) => {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    // meaningful focus management requires us to know which input to focus
    const focusInput = (index: number) => {
        const input = inputs.current[index];
        if (input) {
            input.focus();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return; // Only allow numbers

        // Handle paste logic if user pasted multiple chars into one field
        if (val.length > 1) {
            const pastedData = val.slice(0, length);
            onChange(pastedData);

            if (pastedData.length === length && onComplete) {
                onComplete(pastedData);
            }

            // Focus the last filled input or the next empty one
            const nextIndex = Math.min(pastedData.length, length - 1);
            focusInput(nextIndex);
            return;
        }

        const newValue = value.split('');
        // Ensure array is correct length logic
        while (newValue.length < length) newValue.push('');

        if (val) {
            newValue[index] = val;
            const newString = newValue.join('');
            onChange(newString);

            if (index < length - 1) {
                focusInput(index + 1);
            }

            if (newString.length === length && onComplete) {
                onComplete(newString);
            }
        } else {
            // Backspace handling in change event usually implies clearing
            newValue[index] = '';
            onChange(newValue.join(''));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // If current is empty and backspace pressed, move to previous
                focusInput(index - 1);

                // Also clear previous if we want that behavior,
                // but standard behavior is just focus back, then user hits backspace again to clear.
                // However, often users expect backspace to delete prev char if current is empty.
                const newValue = value.split('');
                newValue[index - 1] = ''; // Clear previous
                onChange(newValue.join(''));
            } else if (value[index]) {
                // Standard clear current
                const newValue = value.split('');
                newValue[index] = '';
                onChange(newValue.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            focusInput(index - 1);
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            focusInput(index + 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length).replace(/\D/g, '');
        if (pastedData) {
            onChange(pastedData);
            if (pastedData.length === length && onComplete) {
                onComplete(pastedData);
            }
            const nextIndex = Math.min(pastedData.length, length - 1);
            focusInput(nextIndex);
        }
    };

    return (
        <div className={cn("flex gap-2 justify-center", className)}>
            {Array.from({ length }).map((_, i) => (
                <Input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6} // Allow paste flow but restrict strictly in change handler
                    value={value[i] || ''}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    className="w-10 h-12 text-center text-lg font-bold p-0 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
            ))}
        </div>
    );
};

export { OtpInput };
