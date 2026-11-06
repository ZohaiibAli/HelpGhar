/**
 * Animated illustrations for the three login portals: a customer booking
 * help from the sofa, a worker getting a job alert on their phone, and an
 * admin reviewing a CNIC on a dashboard. Built from the same jointed-SVG-
 * person system as the landing hero, kept self-contained here so the login
 * page can drop one in per role without pulling in the hero's own file.
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

/* a cup of tea on a side table, with rising steam */
const Tea = ({ x, y }: { x: number; y: number }) => (
  <g>
    <path d={`M${x - 8} ${y - 14} L${x + 8} ${y - 14} L${x + 6} ${y} L${x - 6} ${y} Z`} fill="#FFFFFF" />
    <path d={`M${x + 8} ${y - 11} q6 1 4 7 q-2 3 -5 2`} stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
    {[0, 1].map((k) => (
      <path key={k} className="wls-steam" style={{ animationDelay: `${k * 0.9}s` }} d={`M${x - 3 + k * 6} ${y - 18} q-4 -8 0 -16 q4 -8 0 -16`} stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    ))}
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

/* Shared scenery */
const Room = ({ wall, floor, line }: { wall: string; floor: string; line: string }) => (
  <g>
    <rect width="600" height="410" fill={wall} />
    <rect y="410" width="600" height="50" fill={floor} />
    <rect y="403" width="600" height="8" fill={line} />
  </g>
);
const Win = ({ x, y, w, h, curtain }: { x: number; y: number; w: number; h: number; curtain?: string }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx="4" fill="#FFFFFF" />
    <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} fill="url(#wlsSky)" />
    <g className="wls-cloud"><ellipse cx={x + w * 0.4} cy={y + h * 0.35} rx="20" ry="7" fill="#fff" opacity=".9" /></g>
    <path d={`M${x + w / 2} ${y + 6} V${y + h - 6} M${x + 6} ${y + h / 2} H${x + w - 6}`} stroke="#FFFFFF" strokeWidth="4" />
    {curtain && (
      <>
        <path className="wls-curtain" d={`M${x - 10} ${y - 8} L${x + 26} ${y - 8} Q${x + 18} ${y + h / 2} ${x + 30} ${y + h + 8} L${x - 10} ${y + h + 8} Z`} fill={curtain} />
        <path className="wls-curtain wls-c2" d={`M${x + w + 10} ${y - 8} L${x + w - 26} ${y - 8} Q${x + w - 18} ${y + h / 2} ${x + w - 30} ${y + h + 8} L${x + w + 10} ${y + h + 8} Z`} fill={curtain} />
        <rect x={x - 16} y={y - 12} width={w + 32} height="5" rx="2.5" fill="#8A6A4A" />
      </>
    )}
  </g>
);
const Plant = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="wls-leaf"><path d="M0 -20 Q-26 -50 -10 -78 Q2 -50 0 -20Z" fill="#4E9A6B" /><path d="M0 -20 Q24 -46 16 -84 Q0 -54 0 -20Z" fill="#5FB07C" /><path d="M0 -20 Q-4 -60 4 -96 Q10 -60 0 -20Z" fill="#3F8A5B" /></g>
    <path d="M-16 -22 L16 -22 L12 0 L-12 0 Z" fill="#C8693F" />
  </g>
);

const WORKER = {
  skin: "#A86B45", hair: "short", hairColor: "#1A1310", hat: "cap", hatColor: "#0B4F42", short: true, top: "#127A63", bottom: "#2C3E5C", collar: "#0B4F42",
  placket: true, mustache: true,
  pose: { torso: 0, neck: 20, nSh: -34, nEl: -96, fSh: { k: "kHold", f: 6, t: -165, d: 6 }, fEl: { k: "kHold", f: -14, t: -40, d: 6 }, nHip: -4, nKnee: 4, fHip: 5, fKnee: 0 },
  nHand: <Phone rot={-74} />,
};

const CUSTOMER = {
  female: true, skin: "#D9A07A", hair: "long", hairColor: "#1E1611", kameez: true, hem: 8, lap: true, top: "#127A63", bottom: "#E9F5EF",
  dupatta: "#F2C14E", trim: "#F2C14E", earring: true, bangles: "#F2C14E", shadow: 50,
  pose: { torso: -4, neck: { k: "kHold", f: 20, t: -6, d: 7.5 }, nSh: -26, nEl: { f: -98, t: -104, d: 0.35 }, fSh: -22, fEl: -96, nHip: -86, nKnee: 86, fHip: -84, fKnee: 84 },
  nHand: <Phone rot={-80} />,
};

const VISITOR = {
  female: true, skin: "#B5764E", hair: "bun", hairColor: "#161210", kameez: true, hem: 26, top: "#D2477F", bottom: "#F7D1E0", dupatta: "#F4A62A",
  bangles: "#F2C14E", earring: true, open: true,
  pose: { torso: 0, neck: 0, nSh: { f: -148, t: -166, d: 0.45 }, nEl: { f: -18, t: -48, d: 0.45 }, fSh: 6, fEl: -10, nHip: -3, nKnee: 3, fHip: 4, fKnee: 0 },
};

const ADMIN = {
  female: true, skin: "#E0AC88", hair: "bun", hairColor: "#2A1B14", glasses: true, earring: true, top: "#2E3A59", bottom: "#2E3A59", collar: "#FFFFFF",
  shadow: false, lip: "#B0504A",
  pose: { torso: 4, neck: { f: -8, t: -2, d: 3 }, nSh: -18, nEl: { f: -72, t: -80, d: 0.26 }, fSh: -12, fEl: { f: -74, t: -82, d: 0.26, dl: -0.13 }, nHip: -86, nKnee: 86, fHip: -84, fKnee: 84 },
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
      <linearGradient id="wlsSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FD3F2" /><stop offset="1" stopColor="#DDF1FB" /></linearGradient>
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

/* Customer books help from the sofa; the worker arrives at the door */
function SceneCustomer() {
  return (
    <g>
      <Room wall="#EAF5EF" floor="#D2B08A" line="#BC976C" />
      <Win x={90} y={70} w={150} h={130} curtain="#F2C14E" />
      <rect x="300" y="110" width="70" height="90" rx="3" fill="#FFFFFF" /><rect x="306" y="116" width="58" height="78" fill="#F6D7A7" />
      <circle cx="335" cy="146" r="14" fill="#E07A2E" opacity=".7" />
      <rect x="456" y="180" width="118" height="230" fill="#7A5534" />
      <rect x="464" y="188" width="102" height="218" fill="url(#wlsSky)" />
      <rect x="464" y="330" width="102" height="76" fill="#9BD3A8" />
      <Human x={524} y={312} s={1.12} p={VISITOR} flip />
      <path d="M464 188 L496 198 L496 398 L464 406 Z" fill="#A9774A" />
      <circle cx="489" cy="300" r="3" fill="#F2C14E" />
      <g className="wls-bell" style={{ transformOrigin: "590px 250px" }}>
        <path d="M582 262 Q582 244 590 242 Q598 244 598 262 Z" fill="#F2C14E" /><circle cx="590" cy="265" r="3" fill="#F2C14E" />
      </g>
      <rect x="36" y="248" width="176" height="128" rx="22" fill="#5F7FB8" />
      <rect x="22" y="352" width="270" height="40" rx="14" fill="#6E8FC8" />
      <rect x="10" y="300" width="44" height="92" rx="16" fill="#5574AC" />
      <rect x="36" y="390" width="10" height="16" fill="#3E5888" /><rect x="268" y="390" width="10" height="16" fill="#3E5888" />
      <rect x="60" y="268" width="56" height="44" rx="12" fill="#F2C14E" />
      <Human x={196} y={348} s={1.25} p={CUSTOMER} />
      <rect x="320" y="356" width="96" height="9" rx="3" fill="#8C5A33" />
      <rect x="330" y="364" width="6" height="42" fill="#6E4526" /><rect x="400" y="364" width="6" height="42" fill="#6E4526" />
      <Tea x={360} y={356} />
      <Note x={250} y={42} color="#127A63" icon="✓" title="Worker accepted" sub="Arriving at 4:30 PM" delay={0.3} />
      <Note x={234} y={94} w={176} color="#2F6FD0" icon="ID" title="CNIC verified" sub="Checked by HelpGhar" delay={1.3} />
      <Note x={256} y={146} w={184} color="#E07A2E" icon="₨" title="Paid Rs 1,260" sub="Includes 5% fee" delay={2.3} />
    </g>
  );
}

/* Admin checks a CNIC and watches the dashboard */
function SceneAdmin() {
  const bars = [46, 70, 58, 88, 74, 104];
  return (
    <g>
      <Room wall="#EEF0F8" floor="#B9BFCF" line="#A5ACBF" />
      <rect x="380" y="40" width="190" height="56" rx="4" fill="#FFFFFF" /><rect x="386" y="46" width="178" height="44" fill="url(#wlsSky)" />
      <rect x="292" y="110" width="280" height="190" rx="10" fill="#1F2533" />
      <rect x="300" y="118" width="264" height="174" rx="5" fill="#F7F8FC" />
      <rect x="300" y="118" width="264" height="22" rx="5" fill="#0B4F42" />
      <circle cx="312" cy="129" r="3.4" fill="#F2C14E" /><rect x="322" y="126" width="50" height="6" rx="3" fill="#fff" opacity=".8" />
      {[["Bookings", "#127A63"], ["Verified", "#2F6FD0"], ["Complaints", "#E25858"]].map(([t, c], k) => (
        <g key={t as string}>
          <rect x={308 + k * 84} y="148" width="76" height="36" rx="5" fill="#FFFFFF" stroke="#E3E6EF" />
          <text x={314 + k * 84} y="161" fontSize="8.5" fill="#6B7280" fontFamily="inherit">{t}</text>
          <rect className="wls-kpi" style={{ animationDelay: `${k * 0.3}s` }} x={314 + k * 84} y="168" width={[40, 30, 12][k]} height="8" rx="2" fill={c as string} />
        </g>
      ))}
      <rect x="308" y="192" width="148" height="92" rx="5" fill="#FFFFFF" stroke="#E3E6EF" />
      {bars.map((h, k) => (
        <rect key={k} className="wls-bar" style={{ animationDelay: `${k * 0.12}s` }} x={318 + k * 22} y={278 - h * 0.75} width="13" height={h * 0.75} rx="2" fill={k === 5 ? "#127A63" : "#9FD2BF"} />
      ))}
      <rect x="464" y="192" width="92" height="92" rx="5" fill="#FFFFFF" stroke="#E3E6EF" />
      <path className="wls-line" d="M472 270 L488 254 L502 260 L518 236 L532 242 L548 214" stroke="#2F6FD0" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="424" y="300" width="16" height="22" fill="#2B3242" /><rect x="400" y="318" width="64" height="6" rx="3" fill="#2B3242" />
      <rect x="148" y="250" width="24" height="112" rx="10" fill="#2B3242" />
      <rect x="160" y="356" width="76" height="14" rx="6" fill="#363E52" />
      <rect x="194" y="370" width="6" height="26" fill="#5B636C" />
      <path d="M168 404 L226 404" stroke="#5B636C" strokeWidth="5" strokeLinecap="round" />
      <circle cx="170" cy="406" r="4" fill="#2A2A2A" /><circle cx="224" cy="406" r="4" fill="#2A2A2A" />
      <Human x={200} y={352} s={1.25} p={ADMIN} />
      <rect x="238" y="314" width="66" height="7" rx="2" fill="#D5D9E2" />
      <rect x="238" y="322" width="350" height="12" rx="3" fill="#C99A63" />
      <rect x="548" y="334" width="10" height="72" fill="#A97C48" /><rect x="262" y="334" width="10" height="72" fill="#A97C48" />
      <rect x="512" y="300" width="18" height="22" rx="3" fill="#E25858" />
      <g className="wls-idcard">
        <rect x="26" y="54" width="170" height="104" rx="10" fill="#FFFFFF" />
        <rect x="26" y="54" width="170" height="24" rx="10" fill="#127A63" /><rect x="26" y="68" width="170" height="10" fill="#127A63" />
        <text x="38" y="71" fontSize="10.5" fontWeight="700" fill="#fff" fontFamily="inherit">CNIC check</text>
        <rect x="38" y="88" width="40" height="52" rx="5" fill="#DCE3E8" />
        <circle cx="58" cy="106" r="9" fill="#B5764E" /><path d="M44 140 Q58 118 72 140 Z" fill="#B5764E" />
        <rect x="88" y="92" width="88" height="7" rx="3" fill="#E3E6EF" /><rect x="88" y="106" width="64" height="7" rx="3" fill="#E3E6EF" />
        <rect x="88" y="120" width="76" height="7" rx="3" fill="#E3E6EF" />
        <rect className="wls-scan" x="30" y="82" width="162" height="3" fill="#4ADE80" opacity=".8" />
        <g className="wls-stamp" style={{ transformOrigin: "150px 136px" }}>
          <rect x="112" y="124" width="76" height="24" rx="6" fill="none" stroke="#127A63" strokeWidth="2.4" />
          <text x="150" y="141" textAnchor="middle" fontSize="12" fontWeight="800" fill="#127A63" fontFamily="inherit">Verified ✓</text>
        </g>
      </g>
      <Plant x={30} y={404} />
    </g>
  );
}

const CSS = `
.wls-svg{display:block;width:100%;height:100%}
.wls-breathe{animation:wlsBreathe 3.2s ease-in-out infinite}
.wls-blink{transform-box:fill-box;transform-origin:center;animation:wlsBlink 4.6s infinite}
.wls-cloud{animation:wlsCloud 9s ease-in-out infinite alternate}
.wls-curtain{transform-box:fill-box;transform-origin:top;animation:wlsCurtain 4s ease-in-out infinite alternate}
.wls-curtain.wls-c2{animation-delay:-2s}
.wls-leaf{transform-box:fill-box;transform-origin:bottom;animation:wlsLeafSway 3.5s ease-in-out infinite alternate}
.wls-screen{animation:wlsScreen 1.6s ease-in-out infinite}
.wls-steam{opacity:0;animation:wlsSteam 2.1s ease-out infinite}
.wls-note{opacity:0;animation:wlsNote 7.5s cubic-bezier(.2,.9,.25,1.2) infinite}
.wls-ping{transform-box:fill-box;transform-origin:center;animation:wlsPing 6s ease-in-out infinite}
.wls-coin{opacity:0;animation:wlsCoin 7.5s ease-in infinite}
.wls-bell{animation:wlsBell 7.5s ease-in-out infinite}
.wls-kpi{transform-box:fill-box;transform-origin:left;animation:wlsKpi 4s ease-out infinite}
.wls-bar{transform-box:fill-box;transform-origin:bottom;animation:wlsBar 4s cubic-bezier(.2,.9,.25,1.1) infinite}
.wls-line{stroke-dasharray:120;stroke-dashoffset:120;animation:wlsLine 4s ease-out infinite}
.wls-idcard{animation:wlsFloaty 5s ease-in-out infinite}
.wls-scan{animation:wlsScan 4s ease-in-out infinite}
.wls-stamp{opacity:0;animation:wlsStamp 4s cubic-bezier(.2,.9,.25,1.5) infinite}

@keyframes wlsSwing{from{transform:rotate(var(--f))}to{transform:rotate(var(--t))}}
@keyframes kHold{0%,30%{transform:rotate(var(--f))}42%,72%{transform:rotate(var(--t))}84%,100%{transform:rotate(var(--f))}}
@keyframes wlsBreathe{50%{transform:translateY(-1px)}}
@keyframes wlsBlink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes wlsCloud{to{transform:translateX(26px)}}
@keyframes wlsCurtain{to{transform:skewX(3deg)}}
@keyframes wlsLeafSway{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
@keyframes wlsScreen{50%{fill:#B9F5E0}}
@keyframes wlsSteam{0%{opacity:0;transform:translateY(6px)}30%{opacity:.75}100%{opacity:0;transform:translateY(-26px)}}
@keyframes wlsNote{0%{opacity:0;transform:translateY(14px) scale(.94)}8%,82%{opacity:1;transform:translateY(0) scale(1)}92%,100%{opacity:0;transform:translateY(-8px)}}
@keyframes wlsPing{0%,100%{transform:scale(1)}10%{transform:scale(1.35)}20%{transform:scale(1)}}
@keyframes wlsCoin{0%{opacity:0;transform:translateY(-30px)}10%{opacity:1}22%,80%{opacity:1;transform:translateY(0)}92%,100%{opacity:0}}
@keyframes wlsBell{0%,4%,12%,100%{transform:rotate(0)}6%,10%{transform:rotate(14deg)}8%{transform:rotate(-14deg)}}
@keyframes wlsKpi{0%{transform:scaleX(0)}40%,100%{transform:scaleX(1)}}
@keyframes wlsBar{0%{transform:scaleY(0)}35%,85%{transform:scaleY(1)}100%{transform:scaleY(1)}}
@keyframes wlsLine{0%{stroke-dashoffset:120}50%,100%{stroke-dashoffset:0}}
@keyframes wlsFloaty{50%{transform:translateY(-6px)}}
@keyframes wlsScan{0%{transform:translateY(0)}45%{transform:translateY(64px)}55%,100%{transform:translateY(0);opacity:0}}
@keyframes wlsStamp{0%,48%{opacity:0;transform:scale(1.8) rotate(-12deg)}58%,92%{opacity:1;transform:scale(1) rotate(-8deg)}100%{opacity:0;transform:scale(1) rotate(-8deg)}}

@media (prefers-reduced-motion:reduce){
  .wls-svg *{animation-duration:.001ms!important;animation-iteration-count:1!important;animation-delay:0s!important;transition:none!important}
  .wls-note,.wls-coin,.wls-stamp{opacity:1!important}
}
`;

function Scene({ className, label, render }: { className?: string; label: string; render: () => React.ReactElement }) {
  return (
    <div className={className}>
      <style>{CSS}</style>
      <svg viewBox="0 0 600 460" className="wls-svg" role="img" aria-label={label}>
        <Defs />
        {render()}
      </svg>
    </div>
  );
}

export function CustomerLoginScene({ className }: { className?: string }) {
  return <Scene className={className} label="A customer booking help and getting a confirmation" render={SceneCustomer} />;
}
export function WorkerLoginScene({ className }: { className?: string }) {
  return <Scene className={className} label="A worker accepting a job on their phone and getting paid" render={SceneWorker} />;
}
export function AdminLoginScene({ className }: { className?: string }) {
  return <Scene className={className} label="An admin verifying a worker's CNIC on a dashboard" render={SceneAdmin} />;
}
