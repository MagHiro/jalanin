"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";

const isoDate = (date: Date) => [
  String(date.getFullYear()).padStart(4, "0"),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");
const makeMonth = (value?: string) => {
  const parts = value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10).split("-").map(Number) : null;
  return parts ? new Date(parts[0], parts[1] - 1, 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
};

/** Accessible calendar popover with a native date input for form validity and manual entry. */
export function DateInput({ name, defaultValue, required, disabled, min, max, type = "date", ariaLabel }: {
  name: string; defaultValue?: string; required?: boolean; disabled?: boolean;
  min?: string; max?: string; type?: "date" | "datetime-local"; ariaLabel: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => makeMonth(defaultValue));

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); input.current?.focus(); }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", escape);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && panel.current) {
      gsap.fromTo(panel.current, { opacity: 0, y: -7 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out", clearProps: "all" });
    }
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", escape); };
  }, [open]);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), 1 - offset + index));
  const bounded = (day: string) => (!min || day >= min.slice(0,10)) && (!max || day <= max.slice(0,10));
  const isDate = type === "date";
  function choose(date: string) {
    setValue(date);
    setMonth(makeMonth(date));
    setOpen(false);
    input.current?.focus();
  }
  function openPicker() {
    if (!isDate) {
      try { input.current?.showPicker(); } catch { input.current?.focus(); }
      return;
    }
    setMonth(makeMonth(value));
    setOpen(x => !x);
  }

  return <div className="workspace-date-field" ref={root}>
    <input id={id} ref={input} type={type} name={name} value={value} onChange={event => {
      setValue(event.target.value);
      if (event.target.value) setMonth(makeMonth(event.target.value));
    }} required={required} disabled={disabled} min={min} max={max} className="field" aria-label={ariaLabel} />
    <button type="button" disabled={disabled} className="workspace-date-button" aria-label={isDate ? "Choose " + ariaLabel.toLowerCase() : "Open picker: " + ariaLabel} aria-haspopup={isDate ? "dialog" : undefined} aria-expanded={isDate ? open : undefined} aria-controls={isDate && open ? id + "-calendar" : undefined} onClick={openPicker}><CalendarDays size={17} aria-hidden="true" /></button>
    {isDate && open && <div id={id + "-calendar"} ref={panel} className="workspace-calendar-popover" role="dialog" aria-label={"Choose " + ariaLabel.toLowerCase()}>
      <div className="workspace-calendar-heading">
        <span>{month.toLocaleDateString("en", { month: "long", year: "numeric" })}</span>
        <div><button type="button" aria-label="Previous month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
        <button type="button" aria-label="Next month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={17} /></button></div>
      </div>
      <div className="workspace-calendar-grid" role="group" aria-label="Calendar days">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(day => <span className="workspace-calendar-weekday" key={day}>{day}</span>)}
        {days.map(day => {
          const date = isoDate(day);
          return <button type="button" key={date} disabled={!bounded(date)} data-outside={day.getMonth() !== month.getMonth() ? "true" : undefined} aria-pressed={date === value.slice(0,10)} aria-label={day.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })} className="workspace-calendar-day" onClick={() => choose(date)}>{day.getDate()}</button>;
        })}
      </div>
      <div className="workspace-calendar-bottom">
        <button type="button" disabled={!bounded(isoDate(new Date()))} onClick={() => choose(isoDate(new Date()))}>Today</button>
        {!required && <button type="button" onClick={() => { setValue(""); setOpen(false); input.current?.focus(); }}>Clear date</button>}
      </div>
    </div>}
  </div>;
}
