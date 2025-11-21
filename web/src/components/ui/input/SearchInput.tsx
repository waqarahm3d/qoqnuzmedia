'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { Input, type InputProps } from './Input';
import { cn } from '@/lib/utils/cn';

/**
 * SearchInput Component
 *
 * Specialized search input with:
 * - Debounced search
 * - Clear button
 * - Loading state
 * - Search icon
 *
 * @example
 * ```tsx
 * <SearchInput
 *   onSearch={(query) => performSearch(query)}
 *   debounce={300}
 * />
 * ```
 */

export interface SearchInputProps extends Omit<InputProps, 'icon' | 'iconRight'> {
  /** Callback when search query changes (debounced) */
  onSearch?: (query: string) => void;
  /** Debounce delay in milliseconds */
  debounce?: number;
  /** Show loading spinner */
  loading?: boolean;
  /** Initial search query */
  initialQuery?: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      onSearch,
      debounce = 300,
      loading = false,
      initialQuery = '',
      className,
      ...props
    },
    ref
  ) => {
    const [query, setQuery] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

    // Debounce logic
    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
      }, debounce);

      return () => clearTimeout(timer);
    }, [query, debounce]);

    // Call onSearch when debounced query changes
    useEffect(() => {
      if (onSearch) {
        onSearch(debouncedQuery);
      }
    }, [debouncedQuery, onSearch]);

    const handleClear = () => {
      setQuery('');
      if (onSearch) {
        onSearch('');
      }
    };

    return (
      <Input
        ref={ref}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        icon={<SearchIcon className="w-5 h-5" />}
        iconRight={
          query ? (
            loading ? (
              <LoadingSpinner />
            ) : (
              <button
                type="button"
                onClick={handleClear}
                className="w-5 h-5 flex items-center justify-center hover:text-[var(--qz-text-primary)] transition-colors"
                aria-label="Clear search"
              >
                <XIcon className="w-4 h-4" />
              </button>
            )
          ) : undefined
        }
        className={cn('rounded-full', className)}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

// Icons

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export { SearchInput };
