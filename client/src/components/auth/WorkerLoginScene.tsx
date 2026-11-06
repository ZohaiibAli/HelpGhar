/**
 * Animated illustration for the worker side of the login screen: a worker
 * gets a job alert on their phone, accepts it, and gets paid. Built from
 * the same jointed-SVG-person system as the landing hero, but scoped to
 * just the worker scene so this stays a small, self-contained drop-in for
 * the login page's left panel.
 */

/* Joint: rotates its children around (x, y).
   v = number             -> fixed angle
   v = { f, t, d, dl, k } -> animates between f and t degrees */
function Joint({ x = 0, y = 0, v, children }: { x?: number; y?: number; v?: any; children?: React.ReactNode }) {
  let style: React.CSSProperties;
  if (v && typeof v === "object") {
    style = {
      "--f": `${v.f}deg`, "--t": `${v.t}deg`, transformOrigin: "0px 0px",
      animation: `${v.k || "wlsSwing"} ${v.d || 1.2}s ease-in-out ${v.dl || 0}s infinite${v.k ? "" : " alternate"} both`,
    } as unknown as React.CSSProperties;
  } else {
    style = { transform: `rotate(${v || 0}deg)`, transformOrigin: "0px 0px" };
  }
  return <g transform={`translate(${x} ${y})`}><g style={style}>{children}</g></g>;
}

/* a tapered, shaded limb (wide at the joint, narrower at the far end) */
function Seg({ len, w1, w2, fill, dark, crease }: { len: number; w1: number; w2: number; fill: string; dark?: boolean; crease?: boolean }) {
  const a = w1 / 2;
  const b = w2 / 2;
  const d = `M${-a} 0 C${-a * 1.1} ${len * 0.35} ${-b} ${len * 0.7} ${-b} ${len} A${b} ${b} 0 0 0 ${b} ${len} C${b} ${len * 0.7} ${a * 1.1} ${len * 0.35} ${a} 0 A${a} ${a} 0 0 0 ${-a} 0 Z`;
  return (
    <>
      <path d={d} fill={fill} />
      <path d={d} fill="url(#wlsShade)" />
      {crease && <path d={`M${a * 0.35} ${len * 0.1} Q${b * 0.5} ${len * 0.55} ${b * 0.3} ${len * 0.95}`} stroke="rgba(0,0,0,.12)" strokeWidth=".8" fill="none" />}
      {dark && <path d={d} fill="rgba(25,20,35,.2)" />}
    </>
  );
}

/* a hand with fingers and thumb (+y points away from the wrist) */
function Hand({ skin, dark }: { skin: string; dark?: boolean }) {
  const palm = "M-4.2 -3 C-4.9 2 -4.7 7 -2.5 9.6 C-0.7 11.5 2.6 11.1 3.8 8.7 C4.9 6.4 4.9 1.6 4.3 -3 Z";
  return (
    <g>
      <path d={palm} fill={skin} />
      <path d="M3.4 -0.6 C6.6 0.2 7.2 3.4 5.6 5.4" stroke={skin} strokeWidth="3.1" strokeLinecap="round" fill="none" />
      <path d={palm} fill="url(#wlsShade)" />
      <path d="M-2 5.4 L-2.1 9.4 M0.4 5.8 L0.5 10.4 M2.6 5.6 L2.6 9.4" stroke="rgba(70,30,15,.2)" strokeWidth=".55" />
      {dark && <path d={palm} fill="rgba(25,20,35,.2)" />}
    </g>
  );
}

/* Head (3/4 view, facing right) */
const FACE = "M-10 -2 C-11 -10 -6 -14.5 1 -14 C7 -13.6 10.5 -9.5 10.6 -4.5 L11 -2.5 C11.3 -1 13.6 1.4 13.4 2.6 C13 3.6 11.7 3.6 11 3.8 C11.4 5 11.6 6 11 6.6 C11.4 7.4 11 8.4 10.4 8.9 C10.4 10.6 9.6 12 7.6 12.6 C4.6 13.4 0 12.2 -3 9 C-6 6 -9.6 3.4 -10 -2 Z";

function Head({ p }: { p: any }) {
  const hc = p.hairColor || "#1B1410";
  const hasHair = p.hair === "short" || p.hair === "long" || p.hair === "bun";
  const shortHair = "M-10.8 1 C-12.4 -8 -8 -15.4 0.5 -15.2 C7.4 -15 11.2 -11.4 11 -6.4 C9 -8.8 5.6 -9.6 2.4 -9 C1.4 -8 0.6 -6 -0.4 -3.6 C-1.2 -1.6 -2.8 1 -4.2 2.8 C-6.4 4 -9.6 3.6 -10.8 1 Z";
  const longTop = "M-10.6 2 C-12.6 -8 -8 -15.4 0.5 -15.2 C7.6 -15 11.4 -11 11 -5.4 C8 -9.6 3 -10 -0.4 -8.6 C-2.6 -6.6 -4 -2 -5 2.6 Z";
  return (
    <g>
      {p.hair === "long" && (
        <>
          <path d="M-9 -10 C-15.5 -2 -15.5 14 -12.4 30 C-10.6 37 -4 37 -2 30 C-3 18 -2 8 -1 2 Z" fill={hc} />
          <path d="M-11 0 C-13 10 -12.6 20 -10.6 30" stroke="rgba(255,255,255,.12)" strokeWidth="1" fill="none" />
        </>
      )}
      {p.hair === "bun" && <><circle cx="-9.4" cy="-9.4" r="6" fill={hc} /><path d="M-13 -8 C-11 -5 -7 -5 -5 -7" stroke="rgba(255,255,255,.15)" strokeWidth=".8" fill="none" /></>}

      <path d={FACE} fill={p.skin} />
      <path d={FACE} fill="url(#wlsFace)" />
      <path d="M-3 9 C0 12.2 4.6 13.4 7.6 12.6" stroke="rgba(60,25,15,.18)" strokeWidth="1.4" fill="none" />
      <circle cx="6.2" cy="4.4" r="2.8" fill="#E06A6A" opacity=".16" />
      {p.beard && <path d="M-4.4 4.2 C-2 10 3 13.6 7.6 13 C10 12.4 10.8 10.4 10.6 8.8 C9.8 9.2 9 8.6 8.6 8 C7 9.6 4 9 1.8 6.8 C0.4 5.4 -1.6 3 -2.6 0.6 Z" fill={hc} />}
      {p.beard && <path d="M-1 6 C1 9.6 4 11.6 7 11.8" stroke="rgba(255,255,255,.18)" strokeWidth=".7" fill="none" />}

      <path d="M10.4 -1.4 C11.2 0.6 12.2 1.8 11.9 2.8" stroke="rgba(90,35,20,.28)" strokeWidth=".7" fill="none" />
      <circle cx="11.5" cy="3.25" r=".55" fill="rgba(60,20,10,.45)" />
      <path d="M7.6 4.4 C8.6 5.4 9.2 5.8 9.8 5.8" stroke="rgba(90,35,20,.15)" strokeWidth=".6" fill="none" />

      <g className="wls-blink">
        <path d="M3.6 -2.2 C4.6 -3.6 6.8 -3.8 8 -2.4 C6.8 -1.2 4.8 -1 3.6 -2.2 Z" fill="#F6F1EC" />
        <circle cx="6.1" cy="-2.4" r="1.35" fill={p.eye || "#3A2416"} />
        <circle cx="6.2" cy="-2.4" r=".62" fill="#0C0806" />
        <circle cx="6.6" cy="-2.9" r=".35" fill="#FFFFFF" />
        <path d="M9.5 -2.2 C9.9 -3.2 10.8 -3.4 11.1 -2.6 C10.7 -1.6 9.9 -1.6 9.5 -2.2 Z" fill="#F6F1EC" />
        <circle cx="10.35" cy="-2.45" r=".85" fill={p.eye || "#3A2416"} />
      </g>
      <path d="M3.3 -2.2 C4.6 -4.1 7 -4.2 8.3 -2.4" stroke="#2A1A12" strokeWidth=".95" fill="none" strokeLinecap="round" />
      <path d="M4 -1.2 C5.4 -0.6 6.8 -0.7 7.8 -1.5" stroke="rgba(90,35,20,.22)" strokeWidth=".5" fill="none" />
      {p.female && <path d="M8 -2.6 L8.9 -3.3 M7.6 -3.2 L8.3 -4" stroke="#1A100B" strokeWidth=".5" />}
      <path d="M3 -5.6 C4.8 -7 7.4 -7.1 8.8 -6" stroke={p.hairColor || "#2A1A12"} strokeWidth={p.female ? 1.05 : 1.45} fill="none" strokeLinecap="round" />
      <path d="M9.7 -6 C10.4 -6.4 11 -6.2 11.2 -5.7" stroke={p.hairColor || "#2A1A12"} strokeWidth="1" fill="none" strokeLinecap="round" />

      {p.mustache && <path d="M8 4.5 C9.5 3.7 11.1 3.9 11.6 4.6 C11 5.7 9.3 5.8 8 4.5 Z" fill={hc} />}
      {p.open ? (
        <path d="M8.4 6.2 C9.6 5.8 10.7 6 11.2 6.4 C10.9 8.4 9.4 8.8 8.4 6.2 Z" fill="#7A2A26" stroke={p.lip || "#B5655A"} strokeWidth=".7" />
      ) : (
        <>
          <path d="M8.4 6.5 C9.6 6 10.6 6.2 11.2 6.6 C10.6 6.9 9.4 7 8.4 6.5 Z" fill={p.lip || "#A4584E"} />
          <path d="M8.6 6.9 C9.4 7.9 10.6 7.8 11 7 C10.2 7.2 9.4 7.2 8.6 6.9 Z" fill={p.lip || "#B5655A"} opacity=".85" />
          <path d="M8.2 6.4 C8.4 6.9 8.8 7.1 9.1 7" stroke="rgba(70,25,15,.35)" strokeWidth=".45" fill="none" />
        </>
      )}

      {hasHair && <path d={p.hair === "short" ? shortHair : longTop} fill={hc} />}
      {hasHair && <path d={p.hair === "short" ? shortHair : longTop} fill="url(#wlsShine)" />}
      {hasHair && <path d="M-7 -11.6 C-2 -14.2 4 -13.6 8 -10.8 M-9 -6 C-7 -10 -3 -12 1 -12.2" stroke="rgba(255,255,255,.14)" strokeWidth=".7" fill="none" />}
      {p.hijab && (
        <>
          <path d="M-1.4 -17 C-10.4 -17 -15.4 -9 -15.2 0 C-15 8.4 -11.2 14.4 -6 16.4 L6.4 17 C9 15.4 10.8 13.2 10.8 10.4 C9.2 12.4 6 13.6 3 13.2 C-2 12.6 -6.2 8 -6.2 1 C-6.2 -5 -2.6 -9.6 4 -10.2 C8 -10.6 11.2 -8.2 11.6 -5 C11.8 -11.8 6.6 -17 -1.4 -17 Z" fill={p.hijab} />
          <path d="M-1.4 -17 C-10.4 -17 -15.4 -9 -15.2 0 C-15 8.4 -11.2 14.4 -6 16.4 L6.4 17 C9 15.4 10.8 13.2 10.8 10.4 C9.2 12.4 6 13.6 3 13.2 C-2 12.6 -6.2 8 -6.2 1 C-6.2 -5 -2.6 -9.6 4 -10.2 C8 -10.6 11.2 -8.2 11.6 -5 C11.8 -11.8 6.6 -17 -1.4 -17 Z" fill="url(#wlsShade)" />
          <path d="M-12 -4 C-10 4 -7 10 -2 13.4 M-9 -12 C-6 -6 -6 2 -4 8" stroke="rgba(0,0,0,.12)" strokeWidth=".8" fill="none" />
        </>
      )}
      {!p.hijab && (
        <>
          <path d="M-3.4 -3 C-6 -3.4 -6.8 2 -4.4 3.6 C-3.4 4.2 -2.4 3 -2.2 1.6 Z" fill={p.skin} />
          <path d="M-3.4 -3 C-6 -3.4 -6.8 2 -4.4 3.6 C-3.4 4.2 -2.4 3 -2.2 1.6 Z" fill="rgba(120,50,30,.14)" />
          <path d="M-3.8 -1.4 C-5 -0.6 -5 1.4 -3.8 2.2" stroke="rgba(90,35,20,.3)" strokeWidth=".6" fill="none" />
        </>
      )}
      {p.earring && <circle cx="-3.8" cy="4.6" r="1.1" fill="#F2C14E" />}
      {p.glasses && (
        <g fill="rgba(255,255,255,.08)" stroke="#2A2A2A" strokeWidth=".8">
          <rect x="3" y="-5.2" width="6.4" height="5.2" rx="2" />
          <path d="M9.4 -3 L10 -3 M3 -3 L-3.2 -2" fill="none" />
          <path d="M10.1 -5 C11 -5 11.4 -4 11.3 -2.6 C11.2 -1 10.6 -0.2 10.1 -0.2" />
        </g>
      )}

      {p.hat === "cap" && (
        <>
          <path d="M-11.4 -4 C-12 -15.8 -3 -17.6 2 -17.2 C8 -16.8 12 -13.2 12 -6.4 Z" fill={p.hatColor} />
          <path d="M-11.4 -4 C-12 -15.8 -3 -17.6 2 -17.2 C8 -16.8 12 -13.2 12 -6.4 Z" fill="url(#wlsShade)" />
          <path d="M9 -7.6 C14 -7.8 19 -6.8 21.4 -5.2 C17 -4.2 12 -4.4 9.6 -5 Z" fill={p.hatColor} />
          <path d="M9 -7.6 C14 -7.8 19 -6.8 21.4 -5.2" stroke="rgba(0,0,0,.25)" strokeWidth=".8" fill="none" />
          <circle cx="0" cy="-16.6" r="1.1" fill="rgba(0,0,0,.25)" />
        </>
      )}
      {p.hat === "chef" && (
        <>
          <path d="M-10 -9 L-10 -15.5 C-18.5 -18 -15.5 -31.5 -6 -27.5 C-3 -34.5 8.5 -33.5 7 -26 C16 -28.5 17.4 -16.5 9 -15.5 L9.6 -8.6 C3 -10.4 -4 -10.4 -10 -9 Z" fill="#FFFFFF" />
          <path d="M-10 -9 L-10 -15.5 C-18.5 -18 -15.5 -31.5 -6 -27.5 C-3 -34.5 8.5 -33.5 7 -26 C16 -28.5 17.4 -16.5 9 -15.5 L9.6 -8.6 C3 -10.4 -4 -10.4 -10 -9 Z" fill="url(#wlsShade)" />
          <path d="M-10 -15.5 C-3 -17 3 -17 9 -15.5 M-4 -26 C-3 -21 -3 -18 -3.4 -16" stroke="rgba(0,0,0,.1)" strokeWidth=".8" fill="none" />
        </>
      )}
      {p.hat === "hard" && (
        <>
          <path d="M-12.4 -5.6 C-12.4 -19.8 12 -20.2 12.4 -6 Z" fill={p.hatColor} />
          <path d="M-12.4 -5.6 C-12.4 -19.8 12 -20.2 12.4 -6 Z" fill="url(#wlsShade)" />
          <path d="M-14 -6.6 C-4 -8.4 8 -8.4 17.6 -6 L17 -4.2 C8 -6.4 -4 -6.4 -13.6 -4.6 Z" fill={p.hatColor} />
          <path d="M-0.4 -19 C-0.6 -14 -0.6 -10 -0.2 -7.6" stroke="rgba(0,0,0,.14)" strokeWidth="2.4" fill="none" />
          <path d="M-8 -14 C-4 -17 3 -17.6 7 -15" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" fill="none" />
        </>
      )}
    </g>
  );
}

/* Torso + clothes (origin at hip, chest faces right) */
function Torso({ p }: { p: any }) {
  const hem = p.hem ?? 2;
  const male = "M-10.6 3 C-11.6 -12 -13.8 -30 -13.6 -44 C-13.4 -53 -9.6 -59.5 -2 -60.5 L5 -60.5 C11.6 -59.4 14.8 -54 14.8 -46 C14.8 -38 13 -30 12 -22 C11.2 -14 11.2 -6 11 3 Z";
  const kameez = `M-12.6 ${hem} C-12 -14 -13.6 -30 -13 -44 C-12.8 -53 -9 -59.5 -2 -60.5 L4.6 -60.5 C10.8 -59.4 13.8 -54 13.9 -47 C14 -41 13.6 -37 12.2 -32 C11 -26 11.4 -14 13 -6 C14.2 0 15.6 ${hem - 8} 16.4 ${hem} Z`;
  const d = p.kameez ? kameez : male;
  return (
    <>
      <path d={d} fill={p.top} />
      {!p.kameez && !p.overalls && !p.apronFull && <path d="M-11.2 -3 C-4 -4.4 4 -4.4 11.4 -3.4 L11.2 3 L-10.6 3 Z" fill={p.bottom} />}
      {!p.kameez && !p.overalls && <path d="M-11.2 -3.2 C-4 -4.6 4 -4.6 11.4 -3.6" stroke="rgba(0,0,0,.25)" strokeWidth="1.2" fill="none" />}
      {p.overalls && (
        <>
          <path d="M-8 -40 L12.6 -40 C12.4 -26 11.4 -12 11 3 L-10.6 3 C-11.2 -12 -10.6 -26 -8 -40 Z" fill={p.bottom} />
          <path d="M-7 -40 L-9.6 -57 M10.6 -40 L9.6 -57" stroke={p.bottom} strokeWidth="3.4" strokeLinecap="round" />
          <rect x="1.6" y="-34" width="8.4" height="7.4" rx="1.4" fill="rgba(0,0,0,.12)" />
          <circle cx="-6.6" cy="-38" r="1.3" fill="#E9C46A" /><circle cx="10.4" cy="-38" r="1.3" fill="#E9C46A" />
        </>
      )}
      {p.apron && <path d="M3 -49 L13.6 -47 C14 -30 14.4 -8 17 22 L3.4 22 C2 2 2 -28 3 -49 Z" fill={p.apron} />}
      {p.apron && <path d="M-12 -24 C-4 -22 6 -22 13.6 -24" stroke={p.apron} strokeWidth="2.2" fill="none" />}
      {p.belt && <path d="M-11.2 -5.4 C-4 -6.8 4 -6.8 11.6 -5.8 L11.6 -1 C4 -2 -4 -2 -11 -0.6 Z" fill={p.belt} />}
      {p.belt && <rect x="7" y="-6" width="4" height="4.6" rx=".8" fill="#C9A64A" />}
      {p.toolbelt && (
        <>
          <path d="M-11.4 -6.4 C-4 -7.8 4 -7.8 11.8 -6.8 L11.8 -1 C4 -2 -4 -2 -11.2 -0.6 Z" fill="#7A4E2D" />
          <rect x="-10" y="-2" width="7.4" height="12" rx="1.6" fill="#8C5A33" />
          <rect x="5" y="-2" width="6.4" height="11" rx="1.6" fill="#8C5A33" />
          <rect x="6.6" y="-8" width="2" height="6.4" fill="#E53935" />
          <rect x="-8.6" y="-5" width="1.6" height="5" fill="#9AA3AD" />
        </>
      )}
      {p.placket && (
        <>
          <path d="M11.2 -57 C12 -44 11.6 -20 11 -4" stroke="rgba(0,0,0,.12)" strokeWidth=".8" fill="none" />
          {[-50, -40, -30, -20, -10].map((by) => <circle key={by} cx={11.6 + by * 0.012} cy={by} r=".85" fill="rgba(0,0,0,.25)" />)}
        </>
      )}
      {p.badge && <path d="M6.4 -48 l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4Z" fill="#F4C430" stroke="#B8901E" strokeWidth=".4" />}
      {p.pocket && <path d="M2 -46 L9.6 -46 L9.4 -39 C7 -38 4.4 -38 2.2 -39 Z" fill="rgba(0,0,0,.08)" stroke="rgba(0,0,0,.12)" strokeWidth=".5" />}
      {p.collar && <path d="M0.6 -59.4 L5 -50.6 L10.6 -58" fill="none" stroke={p.collar} strokeWidth="2.4" strokeLinejoin="round" />}
      {p.kameez && <path d="M1.6 -60 C3.6 -54 7 -52 11 -57.6" stroke={p.trim || "#F2C14E"} strokeWidth="1.1" strokeDasharray="1.4 1.2" fill="none" />}
      {p.kameez && hem > 12 && <path d={`M-12.4 ${hem - 3} C-4 ${hem - 1.6} 8 ${hem - 1.6} 16.2 ${hem - 3}`} stroke={p.trim || "#F2C14E"} strokeWidth="1.3" strokeDasharray="1.4 1.2" fill="none" />}
      <path d="M-8 -14 C-4 -18 0 -18 3 -15 M-6 -36 C-2 -33 3 -33 6 -36 M8 -24 C9.6 -18 9.6 -12 8.4 -6" stroke="rgba(0,0,0,.08)" strokeWidth="1" fill="none" />
      <path d={d} fill="url(#wlsShade)" />
      {p.dupatta && (
        <>
          <path d="M-11.6 -54 C-16 -38 -17 -18 -14.6 4 L-8.4 4 C-10 -18 -9 -38 -6 -51 Z" fill={p.dupatta} />
          <path d="M-11.4 -56 C-3 -47 6 -45 13.6 -49.6 L14.2 -41 C6 -35.6 -4 -37.6 -12.4 -45 Z" fill={p.dupatta} />
          <path d="M-11.4 -56 C-3 -47 6 -45 13.6 -49.6 L14.2 -41 C6 -35.6 -4 -37.6 -12.4 -45 Z" fill="url(#wlsShade)" />
          <path d="M-8 -48 C-2 -43 5 -42 11 -45 M-12 -36 C-13 -24 -12.6 -10 -11.4 2" stroke="rgba(0,0,0,.12)" strokeWidth=".8" fill="none" />
        </>
      )}
      {p.hijab && <path d="M-7.6 -61 C-14.6 -56 -15 -46 -11.6 -39 C-4 -37 6 -38 13 -41.6 C14.6 -50 10.4 -59.6 4 -61.6 Z" fill={p.hijab} />}
      {p.hijab && <path d="M-7.6 -61 C-14.6 -56 -15 -46 -11.6 -39 C-4 -37 6 -38 13 -41.6 C14.6 -50 10.4 -59.6 4 -61.6 Z" fill="url(#wlsShade)" />}
    </>
  );
}

/* subtle "alive" sway for joints that were given a fixed angle */
const live = (v: any, amp: number, d: number, dl: number) => (v == null || typeof v === "number" ? { f: (v || 0) - amp, t: (v || 0) + amp, d, dl } : v);

/* A whole person (origin = hip joint) */
function Human({ x, y, s = 1, p, slot, flip }: { x: number; y: number; s?: number; p: any; slot?: React.ReactNode; flip?: boolean }) {
  const P = p.pose || {};
  const shoe = p.shoe || (p.female ? "#8C3B2E" : "#2A2420");
  const arm = (near: boolean) => (
    <Joint x={near ? 4 : -1} y={-52} v={near ? P.nSh : P.fSh}>
      {p.short ? (
        <>
          <Seg len={27} w1={10} w2={8.4} fill={p.skin} dark={!near} />
          <Seg len={12} w1={12.2} w2={11.2} fill={p.top} dark={!near} />
        </>
      ) : (
        <Seg len={27} w1={11.4} w2={9.4} fill={p.top} dark={!near} crease />
      )}
      <Joint y={27} v={near ? P.nEl : P.fEl}>
        {p.short ? (
          <Seg len={25} w1={8.6} w2={6.2} fill={p.skin} dark={!near} />
        ) : (
          <>
            <Seg len={25} w1={6.6} w2={6} fill={p.skin} dark={!near} />
            <Seg len={21} w1={9.6} w2={8.6} fill={p.top} dark={!near} crease />
            {p.bangles && near && <path d="M-3.6 22.6 L3.6 22.6 M-3.4 24.2 L3.4 24.2" stroke={p.bangles} strokeWidth="1.2" />}
          </>
        )}
        <g transform="translate(0 28)">
          {near ? p.nHand : p.fHand}
          <Hand skin={p.skin} dark={!near} />
        </g>
      </Joint>
    </Joint>
  );
  const leg = (near: boolean) => (
    <Joint x={near ? 2.5 : -3} v={near ? P.nHip : P.fHip}>
      <Seg len={40} w1={p.female ? 16.4 : 16} w2={p.female ? 13.4 : 12} fill={p.bottom} dark={!near} crease />
      {near && p.lap && <Seg len={28} w1={17.6} w2={16.4} fill={p.top} />}
      <Joint y={40} v={near ? P.nKnee : P.fKnee}>
        {p.female ? (
          <>
            <Seg len={38} w1={7.4} w2={5.4} fill={p.skin} dark={!near} />
            <Seg len={32} w1={14} w2={8.6} fill={p.bottom} dark={!near} crease />
            <path d="M-4.6 32.6 C-1.6 31.6 1.6 31.6 4.4 32.6" stroke="rgba(0,0,0,.15)" strokeWidth="1" fill="none" />
            <path d="M-5 38.6 C-4 37 2 36.6 6 37.6 C11 38.4 15.6 40 16.6 43.4 L-5.4 44 Z" fill={shoe} />
            <path d="M0 39.4 L8 40" stroke="#F2C14E" strokeWidth=".9" strokeDasharray="1 1" />
          </>
        ) : (
          <>
            <Seg len={38} w1={12.6} w2={10.6} fill={p.bottom} dark={!near} crease />
            <path d="M-5.8 35 C-6.2 39 -6.6 42 -6.2 44 L16.4 44 C17.4 41 14.4 38.6 9.4 38 C6.4 37.6 4.4 36 4 34.6 Z" fill={shoe} />
            <path d="M-6.2 43.4 L16.6 43.4" stroke="rgba(0,0,0,.45)" strokeWidth="1.4" />
            <path d="M4 37.4 C6.4 38.8 10 39.4 13 40" stroke="rgba(255,255,255,.18)" strokeWidth=".8" fill="none" />
          </>
        )}
      </Joint>
    </Joint>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {p.shadow !== false && <ellipse cx="5" cy={p.shadow ?? 84} rx="30" ry="4.6" fill="url(#wlsShadowR)" />}
      <g className="wls-breathe">
        {leg(false)}
        {leg(true)}
        <Joint v={live(P.torso, 1.1, 3.4, -1.2)}>
          {arm(false)}
          <Torso p={p} />
          <Joint x={1} y={-57} v={live(P.neck, 2.4, 2.9, -0.7)}>
            <path d="M-4.8 3 L-4.2 -9.4 C-2 -11.4 3 -11.4 5.4 -9.4 L6 3 Z" fill={p.hijab || p.skin} />
            <path d="M-4.8 3 L-4.2 -9.4 C-2 -11.4 3 -11.4 5.4 -9.4 L6 3 Z" fill="url(#wlsShade)" />
            <path d="M-4 -9 C0 -7.4 3.4 -7.6 5.6 -9.6 L5.6 -6 C3 -4.4 0 -4.4 -4 -5.8 Z" fill="rgba(60,25,15,.1)" />
            <g transform="translate(1.2 -20)"><Head p={p} /></g>
          </Joint>
          {slot}
          {arm(true)}
        </Joint>
      </g>
    </g>
  );
}

/* a phone held in the hand (+y points away from the wrist) */
const Phone = ({ rot = 0 }: { rot?: number }) => (
  <g transform={`rotate(${rot}) translate(0 2)`}>
    <rect x="-5.4" y="-10" width="10.8" height="19" rx="2.2" fill="#1F2328" />
    <rect className="wls-screen" x="-4.4" y="-8.6" width="8.8" height="16" rx="1.2" fill="#7FE0C0" />
    <rect x="-3" y="-6.6" width="6" height="1.6" rx=".8" fill="#0B4F42" opacity=".6" />
    <rect x="-3" y="-3.6" width="4.4" height="1.4" rx=".7" fill="#fff" opacity=".8" />
    <rect x="-3" y="-1" width="5.4" height="1.4" rx=".7" fill="#fff" opacity=".8" />
  </g>
);

/* a notification card inside the SVG */
function Note({ x, y, w = 190, color, title, sub, delay, icon }: { x: number; y: number; w?: number; color: string; title: string; sub: string; delay: number; icon: string }) {
  return (
    <g className="wls-note" style={{ animationDelay: `${delay}s` }}>
      <rect x={x} y={y} width={w} height="44" rx="12" fill="#FFFFFF" />
      <rect x={x} y={y} width={w} height="44" rx="12" fill="none" stroke="rgba(16,35,30,.08)" />
      <circle cx={x + 22} cy={y + 22} r="12" fill={color} />
      <text x={x + 22} y={y + 27} textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="inherit">{icon}</text>
      <text x={x + 42} y={y + 19} fontSize="12.5" fontWeight="700" fill="#10231E" fontFamily="inherit">{title}</text>
      <text x={x + 42} y={y + 34} fontSize="11" fill="#4F625B" fontFamily="inherit">{sub}</text>
    </g>
  );
}

const WORKER = {
  skin: "#A86B45", hair: "short", hairColor: "#1A1310", hat: "cap", hatColor: "#0B4F42", short: true, top: "#127A63", bottom: "#2C3E5C", collar: "#0B4F42",
  placket: true, mustache: true,
  pose: { torso: 0, neck: 20, nSh: -34, nEl: -96, fSh: { k: "kHold", f: 6, t: -165, d: 6 }, fEl: { k: "kHold", f: -14, t: -40, d: 6 }, nHip: -4, nKnee: 4, fHip: 5, fKnee: 0 },
  nHand: <Phone rot={-74} />,
};

function Defs() {
  return (
    <defs>
      <linearGradient id="wlsShade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1a0d06" stopOpacity=".30" />
        <stop offset=".22" stopColor="#1a0d06" stopOpacity=".1" />
        <stop offset=".5" stopColor="#1a0d06" stopOpacity="0" />
        <stop offset=".78" stopColor="#fff" stopOpacity=".13" />
        <stop offset="1" stopColor="#1a0d06" stopOpacity=".06" />
      </linearGradient>
      <radialGradient id="wlsFace" cx=".68" cy=".35" r=".85">
        <stop offset="0" stopColor="#fff" stopOpacity=".16" />
        <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#1a0d06" stopOpacity=".3" />
      </radialGradient>
      <radialGradient id="wlsShadowR">
        <stop offset="0" stopColor="#000" stopOpacity=".28" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="wlsShine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset=".5" stopColor="#fff" stopOpacity=".16" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="wlsSkyBig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8FCBEF" /><stop offset="1" stopColor="#E3F4FB" /></linearGradient>
    </defs>
  );
}

/* Worker picks up a job on their phone, rides out, and gets paid */
function SceneWorker() {
  return (
    <g>
      <rect width="600" height="460" fill="url(#wlsSkyBig)" />
      <circle cx="90" cy="70" r="30" fill="#FFE3A3" />
      <g className="wls-cloud"><ellipse cx="420" cy="60" rx="40" ry="12" fill="#fff" /><ellipse cx="444" cy="50" rx="22" ry="13" fill="#fff" /></g>
      <rect x="0" y="160" width="190" height="230" fill="#F2E3C9" /><rect x="0" y="160" width="190" height="26" fill="#E07A2E" />
      <path d="M0 186 h190 l-10 22 h-170 Z" fill="#F4A62A" />
      <rect x="20" y="230" width="70" height="90" fill="#7FB8D9" /><rect x="110" y="230" width="60" height="160" fill="#8C5A33" />
      <rect x="190" y="130" width="230" height="260" fill="#E4D2B4" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={r + "-" + c} x={210 + c * 52} y={150 + r * 62} width="32" height="40" fill="#BFD6E6" />))}
      <rect x="420" y="190" width="180" height="200" fill="#D8E6DD" />
      <rect y="388" width="600" height="22" fill="#C9C2B5" /><rect y="406" width="600" height="54" fill="#8E8A80" />
      <g>
        <circle cx="70" cy="378" r="27" fill="#1F2328" /><circle cx="70" cy="378" r="12" fill="#AEB7C2" />
        <circle cx="200" cy="378" r="27" fill="#1F2328" /><circle cx="200" cy="378" r="12" fill="#AEB7C2" />
        <path d="M70 378 L110 336 L170 336 L200 378" stroke="#5B636C" strokeWidth="6" fill="none" />
        <path d="M100 336 Q120 310 160 318 L176 336 Z" fill="#D43F3A" />
        <rect x="96" y="322" width="56" height="10" rx="5" fill="#2A2A2A" />
        <path d="M180 330 L196 300 L210 302" stroke="#3E4A44" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="128" cy="304" r="15" fill="#F4A62A" /><path d="M114 306 Q128 298 142 306" stroke="#2A2A2A" strokeWidth="3" fill="none" />
      </g>
      <path d="M232 380 L286 380 L282 406 L236 406 Z" fill="#1F9183" /><path d="M244 380 Q259 364 274 380" stroke="#146A60" strokeWidth="4" fill="none" />
      <Human x={318} y={305} s={1.25} p={WORKER} />
      <g className="wls-ping"><circle cx="372" cy="226" r="8" fill="#E53935" /><text x="372" y="230" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="inherit">1</text></g>
      <Note x={394} y={208} w={196} color="#E07A2E" icon="!" title="New job: fan fitting" sub="DHA Phase 6, Rs 800" delay={0.3} />
      <Note x={404} y={262} w={170} color="#127A63" icon="✓" title="Job accepted" sub="Tomorrow, 10:00 AM" delay={1.4} />
      <Note x={396} y={316} w={188} color="#C99700" icon="₨" title="Rs 1,500 received" sub="Paid for Tuesday's job" delay={2.5} />
      {[0, 1, 2].map((k) => (
        <g key={k} className="wls-coin" style={{ animationDelay: `${2.6 + k * 0.25}s` }}>
          <circle cx={530 + k * 16} cy="398" r="8" fill="#F4C430" stroke="#C99700" strokeWidth="1.5" />
        </g>
      ))}
    </g>
  );
}

export function WorkerLoginScene({ className }: { className?: string }) {
  return (
    <div className={className}>
      <style>{CSS}</style>
      <svg viewBox="0 0 600 460" className="wls-svg" role="img" aria-label="A worker accepting a job on their phone and getting paid">
        <Defs />
        <SceneWorker />
      </svg>
    </div>
  );
}

const CSS = `
.wls-svg{display:block;width:100%;height:100%}
.wls-breathe{animation:wlsBreathe 3.2s ease-in-out infinite}
.wls-blink{transform-box:fill-box;transform-origin:center;animation:wlsBlink 4.6s infinite}
.wls-cloud{animation:wlsCloud 9s ease-in-out infinite alternate}
.wls-screen{animation:wlsScreen 1.6s ease-in-out infinite}
.wls-note{opacity:0;animation:wlsNote 7.5s cubic-bezier(.2,.9,.25,1.2) infinite}
.wls-ping{transform-box:fill-box;transform-origin:center;animation:wlsPing 6s ease-in-out infinite}
.wls-coin{opacity:0;animation:wlsCoin 7.5s ease-in infinite}

@keyframes wlsSwing{from{transform:rotate(var(--f))}to{transform:rotate(var(--t))}}
@keyframes kHold{0%,30%{transform:rotate(var(--f))}42%,72%{transform:rotate(var(--t))}84%,100%{transform:rotate(var(--f))}}
@keyframes wlsBreathe{50%{transform:translateY(-1px)}}
@keyframes wlsBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes wlsCloud{to{transform:translateX(26px)}}
@keyframes wlsScreen{50%{fill:#B9F5E0}}
@keyframes wlsNote{0%{opacity:0;transform:translateY(14px) scale(.94)}8%,82%{opacity:1;transform:translateY(0) scale(1)}92%,100%{opacity:0;transform:translateY(-8px)}}
@keyframes wlsPing{0%,100%{transform:scale(1)}10%{transform:scale(1.35)}20%{transform:scale(1)}}
@keyframes wlsCoin{0%{opacity:0;transform:translateY(-30px)}10%{opacity:1}22%,80%{opacity:1;transform:translateY(0)}92%,100%{opacity:0}}

@media (prefers-reduced-motion:reduce){
  .wls-svg *{animation-duration:.001ms!important;animation-iteration-count:1!important;animation-delay:0s!important;transition:none!important}
  .wls-note,.wls-coin{opacity:1!important}
}
`;
