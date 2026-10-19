"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
type Option = { value: string; label: string };
export function WorkspaceSelect({ name, options, defaultValue, placeholder, ariaLabel, disabled = false, multiple = false }: {
  name: string; options: Option[]; defaultValue?: string | string[]; placeholder?: string; ariaLabel: string; disabled?: boolean; multiple?: boolean;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<string[]>(() => Array.isArray(defaultValue) ? defaultValue : defaultValue === undefined ? [] : [defaultValue]);
  const matches = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()));
  const label = multiple ? selected.length ? selected.map(v => options.find(o => o.value === v)?.label).filter(Boolean).join(", ") : placeholder ?? "Select options" : options.find(o => o.value === selected[0])?.label ?? placeholder ?? "Select an option";
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const close = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  function choose(value: string) {
    if (multiple) setSelected(old => old.includes(value) ? old.filter(v => v !== value) : [...old, value]);
    else { setSelected([value]); setOpen(false); setQuery(""); trigger.current?.focus(); }
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); trigger.current?.focus(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); setActive(0); }
      else setActive(v => Math.max(0, Math.min(matches.length - 1, v + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Enter" && open) { e.preventDefault(); if (matches[active]) choose(matches[active].value); }
  }
  return <div ref={root} className="workspace-select" onKeyDown={onKeyDown}>
    {multiple ? selected.map(v => <input key={v} type="hidden" name={name} value={v} />) : <input type="hidden" name={name} value={selected[0] ?? ""} />}
    <button ref={trigger} type="button" disabled={disabled} className="workspace-select-trigger" aria-label={ariaLabel} aria-expanded={open} aria-haspopup="listbox" aria-controls={id} onClick={() => { setOpen(v => !v); setQuery(""); setActive(0); }}><span className="min-w-0 truncate">{label}</span><ChevronDown size={16} aria-hidden="true" /></button>
    {open && <div className="workspace-select-popover">
      {options.length > 5 && <div className="workspace-select-search"><Search size={14} /><input ref={search} aria-label={`Search ${ariaLabel.toLowerCase()}`} placeholder="Search options…" value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} /></div>}
      <div id={id} role="listbox" aria-label={ariaLabel} aria-multiselectable={multiple || undefined} className="workspace-select-options">
        {matches.length ? matches.map((o, i) => <button key={o.value} type="button" role="option" aria-selected={selected.includes(o.value)} className="workspace-select-option" onMouseEnter={() => setActive(i)} onClick={() => choose(o.value)}><span>{o.label}</span>{selected.includes(o.value) && <Check size={15} />}</button>) : <p className="workspace-select-no-results">No matching options</p>}
      </div>
    </div>}
  </div>;
}
