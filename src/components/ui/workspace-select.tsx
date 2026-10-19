"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { gsap } from "gsap";
type Option = { value: string; label: string };
export function WorkspaceSelect({ name, options, defaultValue, placeholder, ariaLabel, disabled = false, multiple = false }: {
  name: string; options: Option[]; defaultValue?: string | string[]; placeholder?: string; ariaLabel: string; disabled?: boolean; multiple?: boolean;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<string[]>(() => Array.isArray(defaultValue) ? defaultValue : defaultValue === undefined ? [] : [defaultValue]);
  const matches = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const label = options.find(o => o.value === selected[0])?.label ?? placeholder ?? "Select an option";
  useEffect(() => {
    if (open) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, id, open]);
  useEffect(() => {
    if (!open) return;
    if (options.length > 5) search.current?.focus();
    const tween = !window.matchMedia("(prefers-reduced-motion: reduce)").matches && panel.current
      ? gsap.fromTo(panel.current, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out", clearProps: "all" })
      : null;
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => { tween?.kill(); document.removeEventListener("pointerdown", close); };
  }, [open, options.length]);
  useEffect(() => {
    const form = root.current?.closest("form");
    if (!form) return;
    const reset = () => {
      setSelected(Array.isArray(defaultValue) ? defaultValue : defaultValue === undefined ? [] : [defaultValue]);
      setQuery("");
      setOpen(false);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue]);
  function choose(value: string) {
    if (multiple) setSelected(old => old.includes(value) ? old.filter(v => v !== value) : [...old, value]);
    else { setSelected([value]); setOpen(false); setQuery(""); trigger.current?.focus(); }
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    else if (e.key === "Home" && open) { e.preventDefault(); setActive(0); }
    else if (e.key === "End" && open) { e.preventDefault(); setActive(Math.max(0, matches.length - 1)); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(0); }
      else setActive(v => Math.max(0, Math.min(Math.max(0, matches.length - 1), v + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter" && open) { e.preventDefault(); if (matches[active]) choose(matches[active].value); }
  }
  return <div ref={root} className="workspace-select" onKeyDown={onKeyDown}>
    {multiple ? selected.map(v => <input key={v} type="hidden" name={name} value={v} disabled={disabled} />) : <input type="hidden" name={name} value={selected[0] ?? ""} disabled={disabled} />}
    <button ref={trigger} type="button" disabled={disabled} className="workspace-select-trigger" role="combobox" aria-label={ariaLabel} aria-expanded={open} aria-haspopup="listbox" aria-controls={open ? id : undefined} aria-activedescendant={open && matches[active] ? `${id}-option-${active}` : undefined} onClick={() => { setOpen(v => !v); setQuery(""); setActive(0); }}><span className="min-w-0 truncate">{multiple ? selected.length
      ? <span className="workspace-multiselect-values"><span className="workspace-multiselect-count">{selected.length}</span><span>{selected.slice(0, 2).map(v => options.find(o => o.value === v)?.label ?? v).join(", ")}{selected.length > 2 ? ` +${selected.length - 2} more` : ""}</span></span>
      : placeholder ?? "Select options"
      : label}</span><ChevronDown size={16} aria-hidden="true" /></button>
    {open && <div ref={panel} className="workspace-select-popover" onClick={event => event.preventDefault()}>
      {options.length > 5 && <div className="workspace-select-search"><Search size={14} /><input ref={search} aria-label={`Search ${ariaLabel.toLowerCase()}`} placeholder="Search options…" value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} /></div>}
      <div id={id} role="listbox" aria-label={ariaLabel} aria-multiselectable={multiple || undefined} className="workspace-select-options">
        {matches.length ? matches.map((o, i) => <button id={`${id}-option-${i}`} key={o.value} type="button" role="option" aria-selected={selected.includes(o.value)} className="workspace-select-option" data-active={active === i ? "true" : undefined} onFocus={() => setActive(i)} onMouseEnter={() => setActive(i)} onClick={() => choose(o.value)}><span>{o.label}</span>{selected.includes(o.value) && <Check size={15} />}</button>) : <p className="workspace-select-no-results">No matching options</p>}
      </div>
      {multiple && <div className="workspace-select-footer"><span role="status">{selected.length} selected</span>{selected.length > 0 && <button className="workspace-select-clear" type="button" onClick={() => setSelected([])}>Clear all</button>}<button type="button" className="workspace-select-done" onClick={() => { setOpen(false); trigger.current?.focus(); }}>Done</button></div>}
    </div>}
  </div>;
}
