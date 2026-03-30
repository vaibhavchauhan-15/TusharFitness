"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type OptionSelectorOption = {
  value: string;
  label: string;
  description?: string;
};

type OptionSelectorProps = {
  id?: string;
  name?: string;
  options: OptionSelectorOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

function getSafeInitialValue(options: OptionSelectorOption[], defaultValue?: string) {
  if (!options.length) {
    return "";
  }

  if (defaultValue && options.some((option) => option.value === defaultValue)) {
    return defaultValue;
  }

  return options[0].value;
}

export function OptionSelector({
  id,
  name,
  options,
  defaultValue,
  value: controlledValue,
  onValueChange,
  required,
  disabled,
  className,
}: OptionSelectorProps) {
  const generatedId = useId();
  const triggerId = id ?? `${name ?? "option-selector"}-${generatedId}`;
  const listboxId = `${triggerId}-listbox`;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(() => getSafeInitialValue(options, defaultValue));
  const [activeIndex, setActiveIndex] = useState(0);

  const isControlled = typeof controlledValue === "string";
  const selectedValue = isControlled
    ? getSafeInitialValue(options, controlledValue)
    : getSafeInitialValue(options, internalValue);

  const selectedIndex = useMemo(() => {
    const index = options.findIndex((option) => option.value === selectedValue);
    return index >= 0 ? index : 0;
  }, [options, selectedValue]);

  function commitValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function getWrappedIndex(index: number) {
    if (!options.length) {
      return 0;
    }

    const wrapped = index % options.length;
    return wrapped >= 0 ? wrapped : wrapped + options.length;
  }

  function focusOptionAtIndex(index: number) {
    const nextIndex = getWrappedIndex(index);
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => {
      optionRefs.current[nextIndex]?.focus();
    });
  }

  function openListbox(index: number) {
    if (!options.length) {
      return;
    }

    setIsOpen(true);
    focusOptionAtIndex(index);
  }

  function closeListbox(restoreTriggerFocus: boolean) {
    setIsOpen(false);

    if (restoreTriggerFocus) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        closeListbox(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeListbox(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === selectedValue) ?? options[0];
  }, [options, selectedValue]);

  const activeDescendant = options[activeIndex]
    ? `${triggerId}-option-${activeIndex}`
    : undefined;

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={selectedValue} required={required} /> : null}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled || !options.length}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (isOpen) {
            closeListbox(true);
            return;
          }

          openListbox(selectedIndex);
        }}
        onKeyDown={(event) => {
          if (disabled || !options.length) {
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();

            if (!isOpen) {
              openListbox(selectedIndex + 1);
              return;
            }

            focusOptionAtIndex(activeIndex + 1);
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();

            if (!isOpen) {
              openListbox(selectedIndex - 1);
              return;
            }

            focusOptionAtIndex(activeIndex - 1);
            return;
          }

          if (event.key === "Home") {
            event.preventDefault();
            openListbox(0);
            return;
          }

          if (event.key === "End") {
            event.preventDefault();
            openListbox(options.length - 1);
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();

            if (!isOpen) {
              openListbox(selectedIndex);
              return;
            }

            const nextOption = options[activeIndex] ?? options[selectedIndex];

            if (nextOption) {
              commitValue(nextOption.value);
            }

            closeListbox(true);
          }
        }}
        className={cn(
          "h-12 w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface-strong)] px-4 text-left text-sm text-[var(--foreground)] shadow-[0_0_0_1px_rgba(255,255,255,0.02)] outline-none transition focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-60",
          isOpen && "border-[var(--primary)] ring-2 ring-[var(--ring)]",
        )}
      >
        <span className="block truncate pr-7">{selectedOption?.label ?? "Select option"}</span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] transition-transform",
            isOpen && "rotate-180",
          )}
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen ? (
        <div
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--surface-strong)] p-1.5 shadow-[var(--shadow-card)] backdrop-blur"
          role="listbox"
          id={listboxId}
          aria-labelledby={triggerId}
          aria-activedescendant={activeDescendant}
          onKeyDown={(event) => {
            if (!options.length) {
              return;
            }

            if (event.key === "Tab") {
              closeListbox(false);
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              closeListbox(true);
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              focusOptionAtIndex(activeIndex + 1);
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              focusOptionAtIndex(activeIndex - 1);
              return;
            }

            if (event.key === "Home") {
              event.preventDefault();
              focusOptionAtIndex(0);
              return;
            }

            if (event.key === "End") {
              event.preventDefault();
              focusOptionAtIndex(options.length - 1);
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              const nextOption = options[activeIndex] ?? options[selectedIndex];

              if (nextOption) {
                commitValue(nextOption.value);
              }

              closeListbox(true);
            }
          }}
          tabIndex={-1}
        >
          <ul className="max-h-64 overflow-auto" role="presentation">
            {options.map((option, index) => {
              const selected = option.value === selectedValue;
              const active = index === activeIndex;

              return (
                <li key={option.value} role="presentation">
                  <button
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    id={`${triggerId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                    }}
                    onClick={() => {
                      commitValue(option.value);
                      closeListbox(true);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-sm transition outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                      selected
                        ? "bg-[var(--primary-soft)] text-[var(--foreground)]"
                        : active
                          ? "bg-[var(--muted)] text-[var(--foreground)]"
                        : "text-[var(--foreground)] hover:bg-[var(--muted)]",
                    )}
                  >
                    <span className="flex-1">
                      <span className="block font-medium">{option.label}</span>
                      {option.description ? (
                        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">{option.description}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
