import { ArrowUpRight, Check, Compass, FileText, Mail, MapPin, Search } from "lucide-react";

/** Decorative illustrations supplement the process copy, never convey state alone. */
export function ProcessGraphic({ step }: { step: number }) {
  return (
    <div className="process-graphic" aria-hidden="true">
      <div className="process-graphic-orbit" />
      <div className="process-graphic-dot process-graphic-dot-one" />
      <div className="process-graphic-dot process-graphic-dot-two" />
      {step === 0 && <>
        <div className="process-art-map">
          <svg viewBox="0 0 240 140" fill="none"><path d="m0 42 65 20 48-28 63 34 64-18M0 100l65-24 48 30 63-25 64 22M65 0v140M176 0v140" stroke="currentColor" strokeWidth="1" /><path d="M48 100c22 0 16-52 48-52s24 48 52 48 19-49 46-49" stroke="#102568" strokeWidth="1.5" strokeDasharray="4 5" /></svg>
          <MapPin className="process-art-pin" size={30} strokeWidth={1.5} />
        </div>
        <span className="process-art-badge"><Compass size={20} strokeWidth={1.5} /></span>
        <span className="process-art-search"><Search size={16} /><span /><ArrowUpRight size={16} /></span>
      </>}
      {step === 1 && <>
        <div className="process-art-sheet process-art-sheet-back" />
        <div className="process-art-sheet">
          <FileText size={24} strokeWidth={1.5} />
          <span className="process-art-line process-art-line-title" />
          <span className="process-art-line" /><span className="process-art-line" />
          <div className="process-art-fields"><span /><span /><span /></div>
        </div>
        <span className="process-art-badge"><Search size={20} strokeWidth={1.5} /></span>
      </>}
      {step === 2 && <>
        <div className="process-art-sheet">
          <div className="process-art-form-row"><Check size={14} /><span className="process-art-line" /></div>
          <div className="process-art-form-row"><Check size={14} /><span className="process-art-line" /></div>
          <div className="process-art-form-row"><span className="process-art-checkbox" /><span className="process-art-line" /></div>
          <span className="process-art-submit"><ArrowUpRight size={15} /></span>
        </div>
        <span className="process-art-badge"><FileText size={20} strokeWidth={1.5} /></span>
      </>}
      {step === 3 && <>
        <div className="process-art-letter"><span className="process-art-line process-art-line-title" /><span className="process-art-line" /><span className="process-art-line" /></div>
        <div className="process-art-envelope"><svg viewBox="0 0 210 110" fill="none"><path d="m1 1 104 66L209 1M1 109l69-53m139 53-69-53" stroke="currentColor" strokeWidth="1.25" /></svg></div>
        <span className="process-art-badge"><Mail size={20} strokeWidth={1.5} /></span>
      </>}
    </div>
  );
}
