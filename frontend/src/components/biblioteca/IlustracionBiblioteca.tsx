export default function IlustracionBiblioteca() {
  return (
    <svg
      className="bib-illustration"
      viewBox="0 0 420 150"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bib-book-orange" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffc986" />
          <stop offset="1" stopColor="#ed8137" />
        </linearGradient>
        <linearGradient id="bib-screen" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffbf74" />
          <stop offset="1" stopColor="#f18b4b" />
        </linearGradient>
      </defs>
      <path
        d="M15 141C-15 77 58 20 109 37C164-13 240 10 267 28C327 3 398 29 414 75L420 149H15Z"
        fill="var(--app-accent-soft)"
      />
      <ellipse cx="222" cy="140" rx="178" ry="7" fill="var(--app-border)" />
      <g stroke="#b96b35" strokeWidth="2">
        <path
          d="M54 137C49 111 29 93 21 83C42 83 58 103 59 118C64 95 81 88 94 88C90 111 77 125 60 137"
          fill="#ed985e"
        />
        <path
          d="M68 134C76 119 91 114 99 99C100 116 86 130 68 134"
          fill="#567981"
          stroke="#567981"
        />
      </g>
      <g>
        <rect x="89" y="112" width="134" height="23" rx="8" fill="#e88a49" />
        <path d="M110 118H213V130H110" fill="#fff1d9" />
        <path d="M116 122H209M116 126H207" stroke="#e0bf96" />
        <rect x="78" y="88" width="133" height="23" rx="8" fill="#334d68" />
        <path d="M99 93H203V105H99" fill="#fff2df" />
        <path d="M105 97H197M105 101H197" stroke="#d8c4aa" />
        <rect x="88" y="64" width="140" height="23" rx="8" fill="#b56765" />
        <path d="M109 70H219V81H109" fill="#fff0df" />
        <path d="M115 73H215M115 77H214" stroke="#d7b89d" />
        <rect
          x="81"
          y="39"
          width="143"
          height="24"
          rx="8"
          fill="url(#bib-book-orange)"
        />
        <path d="M103 44H217V57H103" fill="#fff2dc" />
        <path d="M109 48H212M109 52H211" stroke="#dcb891" />
        <path
          d="M94 42V59M92 91V108M102 116V132"
          stroke="#ffd7ac"
          strokeWidth="3"
        />
      </g>
      <g transform="translate(211 47)">
        <path
          d="M10 3H113Q122 3 121 12L110 84H0L6 10Q7 3 10 3Z"
          fill="#34465a"
        />
        <path d="M15 11H111L102 76H7Z" fill="url(#bib-screen)" />
        <path d="M-9 84H116L128 94H-18Z" fill="#50657a" />
        <path d="M-18 94H128L121 98H-10Z" fill="#263b50" />
        <path
          d="M39 27Q54 21 65 31Q79 23 91 29L86 61Q73 56 61 65Q48 57 34 61Z"
          fill="#fffaf0"
        />
        <path
          d="M65 31L61 65M44 35L57 38M42 43L55 45M41 50L54 52M71 36L84 33M70 43L82 41M69 50L81 48"
          stroke="#eb9b60"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <g
        stroke="#b9672d"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M371 46V132M349 135H393M357 130H385M342 62H401" />
        <circle cx="371" cy="56" r="5" fill="#ec9b49" />
        <path d="M347 64L332 99H361L347 64ZM394 64L380 99H408L394 64Z" />
        <path d="M332 99Q347 120 361 99M380 99Q395 120 408 99" fill="#ed9b49" />
      </g>
      <g fill="#f18b4b">
        <path d="M245 17L248 24L255 27L248 30L245 37L242 30L235 27L242 24Z" />
        <path d="M335 18L337 23L342 25L337 27L335 32L333 27L328 25L333 23Z" />
        <path d="M43 50L45 55L50 57L45 59L43 64L41 59L36 57L41 55Z" />
      </g>
    </svg>
  );
}
