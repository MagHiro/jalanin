"use client";
import { useRef } from "react";
import { CalendarDays } from "lucide-react";
/** Native browser date validation and localized calendar, with a consistent clickable affordance. */
export function DateInput({ name, defaultValue, required, disabled, min, max, type = "date", ariaLabel }: {
  name: string; defaultValue?: string; required?: boolean; disabled?: boolean; min?: string; max?: string; type?: "date" | "datetime-local"; ariaLabel: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="workspace-date-field">
    <input ref={input} type={type} name={name} defaultValue={defaultValue} required={required} disabled={disabled} min={min} max={max} className="field" aria-label={ariaLabel} />
    <button type="button" disabled={disabled} className="workspace-date-button" aria-label={`Open calendar: ${ariaLabel}`} onClick={() => { try { input.current?.showPicker(); } catch { input.current?.focus(); } }}><CalendarDays size={17} aria-hidden="true" /></button>
  </div>;
}
