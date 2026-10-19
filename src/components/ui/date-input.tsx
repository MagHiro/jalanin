"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
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

/** Brand-matched calendar for dates AND local date-times, retaining native
 * input validation, editable values, and normal FormData submission. */
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
  const [selectedDay, setSelectedDay] = useState((defaultValue ?? "").slice(0, 10));
  const [time, setTime] = useState((defaultValue ?? "").includes("T") ? (defaultValue ?? "").slice(11, 16) : "");
  const isDateTime = type === "datetime-local";

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
    const tween = !window.matchMedia("(prefers-reduced-motion: reduce)").matches && window.matchMedia("(min-width: 768px)").matches && panel.current
      ? gsap.fromTo(panel.current, { opacity: 0, y: -6, scale: .985 }, {
          opacity: 1, y: 0, scale: 1, duration: .2, ease: "power2.out", clearProps: "all",
        })
      : null;
    return () => { tween?.kill(); document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", escape); };
  }, [open]);

  // Reset custom control state along with the parent HTML form.
  useEffect(() => {
    const form = root.current?.closest("form");
    if (!form) return;
    const reset = () => {
      setValue(defaultValue ?? "");
      setSelectedDay((defaultValue ?? "").slice(0, 10));
      setTime((defaultValue ?? "").includes("T") ? (defaultValue ?? "").slice(11, 16) : "");
      setMonth(makeMonth(defaultValue));
      setOpen(false);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue]);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), 1 - offset + index));
  const bounded = (day: string) => (!min || day >= min.slice(0, 10)) && (!max || day <= max.slice(0, 10));
  const candidate = selectedDay && time ? selectedDay + "T" + time : "";
  const candidateValid = !!candidate && (!min || candidate >= min) && (!max || candidate <= max);

  function choose(date: string) {
    setSelectedDay(date);
    setMonth(makeMonth(date));
    if (!isDateTime) {
      setValue(date);
      setOpen(false);
      input.current?.focus();
    }
  }
  function openPicker() {
    if (!open) {
      setSelectedDay(value.slice(0, 10));
      setTime(value.includes("T") ? value.slice(11, 16) : "");
      setMonth(makeMonth(value));
    }
    setOpen(v => !v);
  }
  function commitDateTime() {
    if (!candidateValid) return;
    setValue(candidate);
    setOpen(false);
    input.current?.focus();
  }
  function clearDate() {
    setValue("");
    setSelectedDay("");
    setTime("");
    setOpen(false);
    input.current?.focus();
  }

  return <div className="workspace-date-field" ref={root}>
    <input id={id} ref={input} type={type} name={name} value={value} onChange={event => {
      const next = event.target.value;
      setValue(next);
      setSelectedDay(next.slice(0, 10));
      setTime(next.includes("T") ? next.slice(11, 16) : "");
      if (next) setMonth(makeMonth(next));
    }} required={required} disabled={disabled} min={min} max={max} className="field" aria-label={ariaLabel} />
    <button type="button" disabled={disabled} className="workspace-date-button" aria-label={"Choose " + ariaLabel.toLowerCase()} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id + "-calendar" : undefined} onClick={openPicker}><CalendarDays size={17} aria-hidden="true" /></button>
    {open && <div id={id + "-calendar"} ref={panel} className="workspace-calendar-popover" role="dialog" aria-label={"Choose " + ariaLabel.toLowerCase()}>
      <div className="workspace-calendar-heading">
        <span>{month.toLocaleDateString("en", { month: "long", year: "numeric" })}</span>
        <div><button type="button" aria-label="Previous month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
        <button type="button" aria-label="Next month" onClick={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={17} /></button></div>
      </div>
      <div className="workspace-calendar-grid" role="group" aria-label="Calendar days">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(day => <span className="workspace-calendar-weekday" key={day}>{day}</span>)}
        {days.map(day => {
          const date = isoDate(day);
          return <button type="button" key={date} disabled={!bounded(date)} data-outside={day.getMonth() !== month.getMonth() ? "true" : undefined} aria-pressed={date === selectedDay} aria-current={date === isoDate(new Date()) ? "date" : undefined} aria-label={day.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })} className="workspace-calendar-day" onClick={() => choose(date)}>{day.getDate()}</button>;
        })}
      </div>
      {isDateTime && <div className="workspace-calendar-time">
        <label htmlFor={id + "-time"}><Clock3 size={15} aria-hidden="true" /> Local time</label>
        <input id={id + "-time"} type="time" step={60} value={time} onChange={event => setTime(event.target.value)} aria-label={"Time for " + ariaLabel.toLowerCase()} />
      </div>}
      <div className="workspace-calendar-bottom">
        <button type="button" disabled={!bounded(isoDate(new Date()))} onClick={() => choose(isoDate(new Date()))}>Today</button>
        <span className="workspace-calendar-end-actions">
          {!required && <button type="button" onClick={clearDate}>Clear</button>}
          {isDateTime && <button className="workspace-calendar-apply" type="button" disabled={!candidateValid} onClick={commitDateTime}>Apply</button>}
        </span>
      </div>
    </div>}
  </div>;
}
