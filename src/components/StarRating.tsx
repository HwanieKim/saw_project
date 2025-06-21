'use client';

import { useState } from 'react';

interface StarRatingProps {
    value: number;
    onChange?: (rating: number) => void;
    maxRating?: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    showValue?: boolean;
}

export default function StarRating({
    value,
    onChange,
    maxRating = 10,
    size = 'md',
    interactive = true,
    showValue = true,
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const handleStarClick = (rating: number) => {
        if (interactive && onChange) {
            onChange(rating);
        }
    };

    const handleStarHover = (rating: number) => {
        if (interactive) {
            setHoverRating(rating);
        }
    };

    const handleMouseLeave = () => {
        if (interactive) {
            setHoverRating(null);
        }
    };

    const displayRating = hoverRating !== null ? hoverRating : value;

    return (
        <div className="flex items-center gap-2">
            <div
                className="flex items-center gap-1"
                onMouseLeave={handleMouseLeave}>
                {Array.from({ length: maxRating }, (_, index) => {
                    const starValue = index + 1;
                    const isFilled = starValue <= displayRating;
                    const isHalf =
                        starValue === Math.ceil(displayRating) &&
                        displayRating % 1 !== 0;

                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleStarClick(starValue)}
                            onMouseEnter={() => handleStarHover(starValue)}
                            disabled={!interactive}
                            className={`transition-colors duration-200 ${
                                interactive
                                    ? 'cursor-pointer hover:scale-110'
                                    : 'cursor-default'
                            } ${sizeClasses[size]}`}
                            aria-label={`Rate ${starValue} out of ${maxRating}`}>
                            <svg
                                className={`${sizeClasses[size]} ${
                                    isFilled
                                        ? 'text-yellow-400'
                                        : isHalf
                                        ? 'text-yellow-400'
                                        : 'text-gray-400'
                                }`}
                                fill={isFilled ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                {isHalf ? (
                                    <defs>
                                        <linearGradient id={`half-${index}`}>
                                            <stop
                                                offset="50%"
                                                stopColor="currentColor"
                                            />
                                            <stop
                                                offset="50%"
                                                stopColor="transparent"
                                            />
                                        </linearGradient>
                                    </defs>
                                ) : null}
                                <path
                                    fill={
                                        isHalf
                                            ? `url(#half-${index})`
                                            : 'currentColor'
                                    }
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={isFilled ? 0 : 1.5}
                                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                                />
                            </svg>
                        </button>
                    );
                })}
            </div>
            {showValue && (
                <span className="text-sm text-gray-400 min-w-[2rem]">
                    {displayRating}+
                </span>
            )}
        </div>
    );
}
