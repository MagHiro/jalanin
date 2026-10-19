/** Pure SVG product graphic: a symbolic journey, not a claim about user data. */
export function JourneyIllustration() {
  return (
    <svg className="journey-art" viewBox="0 0 640 640" role="img" aria-labelledby="journey-title journey-desc">
      <title id="journey-title">Find your path</title>
      <desc id="journey-desc">An abstract route connecting discovery, application, and growth.</desc>
      <g fill="none" stroke="#A9C4F2" strokeOpacity=".20">
        <circle cx="320" cy="320" r="248" />
        <circle cx="320" cy="320" r="191" />
        <circle cx="320" cy="320" r="132" />
        <path d="M0 320H640M320 0V640" strokeDasharray="2 16" />
      </g>
      <g className="journey-orbit" fill="none" stroke="#B7D1FC" strokeOpacity=".55" strokeWidth="1.5">
        <ellipse cx="300" cy="290" rx="256" ry="127" transform="rotate(-34 300 290)" />
      </g>
      <path className="journey-route" d="M112 455 C128 345 220 385 237 300 S371 290 411 201 519 216 542 139"
        fill="none" stroke="#DCE9FF" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(118 453)">
        <circle r="22" fill="#DCE9FF" /><circle r="8" fill="#3157AB" />
        <text x="-10" y="60" fill="#D7E6FF" fontSize="13" fontWeight="650" letterSpacing="2">01 / DISCOVER</text>
      </g>
      <g transform="translate(246 294)">
        <circle r="29" fill="#B1CCFB" fillOpacity=".2" />
        <circle r="18" fill="#B1CCFB" /><circle r="6" fill="#21438D" />
        <text x="28" y="-29" fill="#DBE8FF" fontSize="13" fontWeight="650" letterSpacing="2">02 / APPLY</text>
      </g>
      <g transform="translate(416 203)">
        <circle r="37" fill="#E5EEFF" fillOpacity=".13" />
        <circle r="21" fill="#C5D9FF" /><path d="M409 203l5 5 10-12" fill="none" stroke="#203C7F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="-70" y="74" fill="#E8F1FF" fontSize="13" fontWeight="650" letterSpacing="2">03 / GROW</text>
      </g>
      <g transform="translate(541 139)">
        <circle r="15" fill="#DFEAFE" /><circle r="6" fill="#355DB8" />
      </g>
      <g transform="translate(314 510)">
        <rect x="-55" y="-19" width="110" height="38" rx="19" fill="#A9C5F8" fillOpacity=".16" stroke="#B8CFFF" strokeOpacity=".25" />
        <text fill="#D9E6FE" textAnchor="middle" fontSize="13" fontWeight="620" y="5">Your journey</text>
      </g>
      <text x="74" y="100" fill="#8DADE7" fontSize="13" fontWeight="720" letterSpacing="3">PATH / 001</text>
      <text x="475" y="558" fill="#91AFE7" fontSize="12" fontWeight="600">JALANIN</text>
    </svg>
  );
}
