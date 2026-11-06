import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, Search, ArrowRight, Star, Check } from "lucide-react";

/**
 * Animated hero: each worker type is shown as a jointed SVG figure doing
 * their real job (cook at a stove, driver behind the wheel, electrician on
 * a ladder...), cycling through nine scenes. Figures are built from Joint
 * pivots (shoulder/elbow/hip/knee/neck) so poses are real rotations, not
 * drawn-once art.
 */

const CYCLE = 5200;
const cssVars = (v: Record<string, string>) => v as React.CSSProperties;

/* Joint: rotates its children around (x, y).
   v = number             -> fixed angle
   v = { f, t, d, dl, k } -> animates between f and t degrees */
function Joint({ x = 0, y = 0, v, children }: { x?: number; y?: number; v?: any; children?: React.ReactNode }) {
  let style: React.CSSProperties;
  if (v && typeof v === "object") {
    style = cssVars({
      "--f": `${v.f}deg`, "--t": `${v.t}deg`, transformOrigin: "0px 0px",
      animation: `${v.k || "jSwing"} ${v.d || 1.2}s ease-in-out ${v.dl || 0}s infinite${v.k ? "" : " alternate"} both`,
    } as unknown as Record<string, string>);
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
      <path d={d} fill="url(#hgShade)" />
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
      <path d={palm} fill="url(#hgShade)" />
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
      <path d={FACE} fill="url(#hgFace)" />
      <path d="M-3 9 C0 12.2 4.6 13.4 7.6 12.6" stroke="rgba(60,25,15,.18)" strokeWidth="1.4" fill="none" />
      <circle cx="6.2" cy="4.4" r="2.8" fill="#E06A6A" opacity=".16" />
      {p.beard && <path d="M-4.4 4.2 C-2 10 3 13.6 7.6 13 C10 12.4 10.8 10.4 10.6 8.8 C9.8 9.2 9 8.6 8.6 8 C7 9.6 4 9 1.8 6.8 C0.4 5.4 -1.6 3 -2.6 0.6 Z" fill={hc} />}
      {p.beard && <path d="M-1 6 C1 9.6 4 11.6 7 11.8" stroke="rgba(255,255,255,.18)" strokeWidth=".7" fill="none" />}

      <path d="M10.4 -1.4 C11.2 0.6 12.2 1.8 11.9 2.8" stroke="rgba(90,35,20,.28)" strokeWidth=".7" fill="none" />
      <circle cx="11.5" cy="3.25" r=".55" fill="rgba(60,20,10,.45)" />
      <path d="M7.6 4.4 C8.6 5.4 9.2 5.8 9.8 5.8" stroke="rgba(90,35,20,.15)" strokeWidth=".6" fill="none" />

      <g className="blink">
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
      {hasHair && <path d={p.hair === "short" ? shortHair : longTop} fill="url(#hgShine)" />}
      {hasHair && <path d="M-7 -11.6 C-2 -14.2 4 -13.6 8 -10.8 M-9 -6 C-7 -10 -3 -12 1 -12.2" stroke="rgba(255,255,255,.14)" strokeWidth=".7" fill="none" />}
      {p.hijab && (
        <>
          <path d="M-1.4 -17 C-10.4 -17 -15.4 -9 -15.2 0 C-15 8.4 -11.2 14.4 -6 16.4 L6.4 17 C9 15.4 10.8 13.2 10.8 10.4 C9.2 12.4 6 13.6 3 13.2 C-2 12.6 -6.2 8 -6.2 1 C-6.2 -5 -2.6 -9.6 4 -10.2 C8 -10.6 11.2 -8.2 11.6 -5 C11.8 -11.8 6.6 -17 -1.4 -17 Z" fill={p.hijab} />
          <path d="M-1.4 -17 C-10.4 -17 -15.4 -9 -15.2 0 C-15 8.4 -11.2 14.4 -6 16.4 L6.4 17 C9 15.4 10.8 13.2 10.8 10.4 C9.2 12.4 6 13.6 3 13.2 C-2 12.6 -6.2 8 -6.2 1 C-6.2 -5 -2.6 -9.6 4 -10.2 C8 -10.6 11.2 -8.2 11.6 -5 C11.8 -11.8 6.6 -17 -1.4 -17 Z" fill="url(#hgShade)" />
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
          <path d="M-11.4 -4 C-12 -15.8 -3 -17.6 2 -17.2 C8 -16.8 12 -13.2 12 -6.4 Z" fill="url(#hgShade)" />
          <path d="M9 -7.6 C14 -7.8 19 -6.8 21.4 -5.2 C17 -4.2 12 -4.4 9.6 -5 Z" fill={p.hatColor} />
          <path d="M9 -7.6 C14 -7.8 19 -6.8 21.4 -5.2" stroke="rgba(0,0,0,.25)" strokeWidth=".8" fill="none" />
          <circle cx="0" cy="-16.6" r="1.1" fill="rgba(0,0,0,.25)" />
        </>
      )}
      {p.hat === "chef" && (
        <>
          <path d="M-10 -9 L-10 -15.5 C-18.5 -18 -15.5 -31.5 -6 -27.5 C-3 -34.5 8.5 -33.5 7 -26 C16 -28.5 17.4 -16.5 9 -15.5 L9.6 -8.6 C3 -10.4 -4 -10.4 -10 -9 Z" fill="#FFFFFF" />
          <path d="M-10 -9 L-10 -15.5 C-18.5 -18 -15.5 -31.5 -6 -27.5 C-3 -34.5 8.5 -33.5 7 -26 C16 -28.5 17.4 -16.5 9 -15.5 L9.6 -8.6 C3 -10.4 -4 -10.4 -10 -9 Z" fill="url(#hgShade)" />
          <path d="M-10 -15.5 C-3 -17 3 -17 9 -15.5 M-4 -26 C-3 -21 -3 -18 -3.4 -16" stroke="rgba(0,0,0,.1)" strokeWidth=".8" fill="none" />
        </>
      )}
      {p.hat === "hard" && (
        <>
          <path d="M-12.4 -5.6 C-12.4 -19.8 12 -20.2 12.4 -6 Z" fill={p.hatColor} />
          <path d="M-12.4 -5.6 C-12.4 -19.8 12 -20.2 12.4 -6 Z" fill="url(#hgShade)" />
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
      <path d={d} fill="url(#hgShade)" />
      {p.dupatta && (
        <>
          <path d="M-11.6 -54 C-16 -38 -17 -18 -14.6 4 L-8.4 4 C-10 -18 -9 -38 -6 -51 Z" fill={p.dupatta} />
          <path d="M-11.4 -56 C-3 -47 6 -45 13.6 -49.6 L14.2 -41 C6 -35.6 -4 -37.6 -12.4 -45 Z" fill={p.dupatta} />
          <path d="M-11.4 -56 C-3 -47 6 -45 13.6 -49.6 L14.2 -41 C6 -35.6 -4 -37.6 -12.4 -45 Z" fill="url(#hgShade)" />
          <path d="M-8 -48 C-2 -43 5 -42 11 -45 M-12 -36 C-13 -24 -12.6 -10 -11.4 2" stroke="rgba(0,0,0,.12)" strokeWidth=".8" fill="none" />
        </>
      )}
      {p.hijab && <path d="M-7.6 -61 C-14.6 -56 -15 -46 -11.6 -39 C-4 -37 6 -38 13 -41.6 C14.6 -50 10.4 -59.6 4 -61.6 Z" fill={p.hijab} />}
      {p.hijab && <path d="M-7.6 -61 C-14.6 -56 -15 -46 -11.6 -39 C-4 -37 6 -38 13 -41.6 C14.6 -50 10.4 -59.6 4 -61.6 Z" fill="url(#hgShade)" />}
    </>
  );
}

/* subtle "alive" sway for joints that were given a fixed angle */
const live = (v: any, amp: number, d: number, dl: number) => (v == null || typeof v === "number" ? { f: (v || 0) - amp, t: (v || 0) + amp, d, dl } : v);

/* A whole person (origin = hip joint) */
function Human({ x, y, s = 1, p, slot }: { x: number; y: number; s?: number; p: any; slot?: React.ReactNode }) {
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
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {p.shadow !== false && <ellipse cx="5" cy={p.shadow ?? 84} rx="30" ry="4.6" fill="url(#hgShadowR)" />}
      <g className="h-breathe">
        {leg(false)}
        {leg(true)}
        <Joint v={live(P.torso, 1.1, 3.4, -1.2)}>
          {arm(false)}
          <Torso p={p} />
          <Joint x={1} y={-57} v={live(P.neck, 2.4, 2.9, -0.7)}>
            <path d="M-4.8 3 L-4.2 -9.4 C-2 -11.4 3 -11.4 5.4 -9.4 L6 3 Z" fill={p.hijab || p.skin} />
            <path d="M-4.8 3 L-4.2 -9.4 C-2 -11.4 3 -11.4 5.4 -9.4 L6 3 Z" fill="url(#hgShade)" />
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

/* Hand-held props (drawn along the forearm, +y = away from hand) */
const Ladle = ({ rot }: { rot: number }) => (
  <g transform={`rotate(${rot})`}>
    <rect x="-1.3" y="-4" width="2.6" height="44" rx="1.3" fill="#B8BEC6" />
    <ellipse cx="0" cy="44" rx="5.5" ry="3.6" fill="#9AA3AD" />
  </g>
);
const Jharu = () => (
  <g>
    <path d="M-3.5 -6 L3.5 -6 L12 58 L-12 58 Z" fill="#CFA65E" />
    <path d="M-1 0 L-5 56 M1.5 0 L4 56 M0 4 L-0.5 57 M2.5 4 L9 57 M-2.5 4 L-9 57" stroke="#B08840" strokeWidth=".9" />
    <rect x="-4.5" y="2" width="9" height="5" rx="1.5" fill="#C0392B" />
  </g>
);
const Marker = () => (
  <g>
    <rect x="-2" y="-2" width="4" height="13" rx="1.5" fill="#1F3FBF" />
    <rect x="-1.2" y="10" width="2.4" height="3" fill="#0E1C5C" />
  </g>
);
const Screwdriver = () => (
  <g>
    <rect x="-2.5" y="-3" width="5" height="10" rx="2" fill="#E53935" />
    <rect x="-0.8" y="6" width="1.6" height="11" fill="#9AA3AD" />
  </g>
);
const Wrench = () => (
  <g className="wr-turn" style={{ transformOrigin: "0px 0px" }}>
    <rect x="-2.2" y="-4" width="4.4" height="24" rx="2" fill="#8C9AA5" />
    <path d="M-6 20 L6 20 L6 27 L2 27 L2 23 L-2 23 L-2 27 L-6 27 Z" fill="#8C9AA5" />
  </g>
);
const Mop = ({ rot }: { rot: number }) => (
  <g transform={`rotate(${rot})`}>
    <rect x="-1.6" y="-30" width="3.2" height="146" rx="1.6" fill="#6B7280" />
    <rect x="-14" y="114" width="28" height="6" rx="2" fill="#4B5563" />
    <path d="M-12 120 Q-14 128 -11 130 M-6 120 L-7 131 M0 120 L0 132 M6 120 L7 131 M12 120 Q14 128 11 130" stroke="#C8DFF2" strokeWidth="3.2" strokeLinecap="round" fill="none" />
  </g>
);
const Torch = ({ rot }: { rot: number }) => (
  <g transform={`rotate(${rot})`}>
    <path className="beam" d="M-4 14 L4 14 L34 120 L-34 120 Z" fill="url(#hgBeam)" />
    <rect x="-3.4" y="-4" width="6.8" height="18" rx="2" fill="#2B2B2B" />
    <rect x="-4.4" y="12" width="8.8" height="3" rx="1" fill="#FFE066" />
  </g>
);
const Book = () => (
  <g transform="rotate(-80)">
    <rect x="-13" y="-4" width="26" height="18" rx="2" fill="#E25858" />
    <rect x="-11" y="-2" width="22" height="14" fill="#FFF8EC" />
    <path d="M0 -2 L0 12" stroke="#E4D6C3" />
  </g>
);
const Pencil = () => <rect x="-1.2" y="-2" width="2.4" height="12" rx="1" fill="#F4C430" />;

type SceneProps = { p: any; kid?: any };

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
    <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} fill="url(#hgSky)" />
    <g className="cloud-s"><ellipse cx={x + w * 0.4} cy={y + h * 0.35} rx="20" ry="7" fill="#fff" opacity=".9" /></g>
    <path d={`M${x + w / 2} ${y + 6} V${y + h - 6} M${x + 6} ${y + h / 2} H${x + w - 6}`} stroke="#FFFFFF" strokeWidth="4" />
    {curtain && (
      <>
        <path className="curtain" d={`M${x - 10} ${y - 8} L${x + 26} ${y - 8} Q${x + 18} ${y + h / 2} ${x + 30} ${y + h + 8} L${x - 10} ${y + h + 8} Z`} fill={curtain} />
        <path className="curtain c2" d={`M${x + w + 10} ${y - 8} L${x + w - 26} ${y - 8} Q${x + w - 18} ${y + h / 2} ${x + w - 30} ${y + h + 8} L${x + w + 10} ${y + h + 8} Z`} fill={curtain} />
        <rect x={x - 16} y={y - 12} width={w + 32} height="5" rx="2.5" fill="#8A6A4A" />
      </>
    )}
  </g>
);
const Plant = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="leaf"><path d="M0 -20 Q-26 -50 -10 -78 Q2 -50 0 -20Z" fill="#4E9A6B" /><path d="M0 -20 Q24 -46 16 -84 Q0 -54 0 -20Z" fill="#5FB07C" /><path d="M0 -20 Q-4 -60 4 -96 Q10 -60 0 -20Z" fill="#3F8A5B" /></g>
    <path d="M-16 -22 L16 -22 L12 0 L-12 0 Z" fill="#C8693F" />
  </g>
);

/* The nine scenes */
function SceneCook({ p }: SceneProps) {
  return (
    <g>
      <Room wall="#FBEFE2" floor="#D8B48C" line="#C49A6C" />
      <Win x={40} y={70} w={170} h={140} curtain="#F4C27A" />
      <rect x="330" y="36" width="250" height="112" rx="6" fill="#E3CDB2" />
      <path d="M455 42 V142" stroke="#CDB291" strokeWidth="2" />
      <circle cx="445" cy="118" r="3" fill="#A8825A" /><circle cx="465" cy="118" r="3" fill="#A8825A" />
      <rect x="320" y="186" width="280" height="140" fill="url(#hgTiles)" />
      <rect x="320" y="338" width="280" height="72" fill="#9B6B43" />
      <path d="M410 346 V402 M500 346 V402" stroke="#7E5432" strokeWidth="2" />
      <circle cx="402" cy="372" r="2.5" fill="#E9D6BD" /><circle cx="418" cy="372" r="2.5" fill="#E9D6BD" />
      <rect x="312" y="324" width="288" height="16" rx="3" fill="#EDE6DA" />
      <rect x="331" y="318" width="92" height="8" rx="2" fill="#2A2A2A" />
      <g className="flame">
        <path d="M339 319 Q343 305 347 319 Z" fill="#3B82F6" /><path d="M407 319 Q411 305 415 319 Z" fill="#3B82F6" />
        <path d="M341 319 Q343 310 345 319 Z" fill="#FDBA4D" /><path d="M409 319 Q411 310 413 319 Z" fill="#FDBA4D" />
      </g>
      <rect x="452" y="296" width="16" height="28" rx="4" fill="#F7E7C9" /><rect x="452" y="296" width="16" height="12" rx="3" fill="#C0392B" />
      <rect x="472" y="300" width="16" height="24" rx="4" fill="#F7E7C9" /><rect x="472" y="300" width="16" height="10" rx="3" fill="#E9A100" />
      <rect x="500" y="318" width="82" height="7" rx="3" fill="#C99A63" />
      <circle cx="520" cy="312" r="7" fill="#E53935" /><circle cx="538" cy="313" r="6" fill="#E8D2B0" /><path d="M552 316 h18" stroke="#4CAF50" strokeWidth="5" strokeLinecap="round" />
      <Human x={282} y={305} s={1.25} p={p} />
      <rect x="328" y="286" width="12" height="5" rx="2" fill="#5B636C" /><rect x="414" y="286" width="12" height="5" rx="2" fill="#5B636C" />
      <rect x="337" y="281" width="80" height="39" rx="7" fill="url(#hgSteel)" />
      <ellipse cx="377" cy="282" rx="40" ry="5.5" fill="#5B636C" />
      <ellipse cx="377" cy="283" rx="36" ry="3.8" fill="#D98F2B" />
      <circle className="bubble" cx="362" cy="283" r="2.2" fill="#F2B04E" /><circle className="bubble b2" cx="388" cy="283" r="1.8" fill="#F2B04E" />
      {[352, 377, 400].map((sx, k) => (
        <path key={sx} className="steam" style={{ animationDelay: `${k * 0.7}s` }}
              d={`M${sx} 270 q-7 -13 0 -26 q7 -13 0 -26`} stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" fill="none" />
      ))}
    </g>
  );
}

function SceneMaid({ p }: SceneProps) {
  return (
    <g>
      <Room wall="#EFE8F6" floor="#D9CBB5" line="#C4B293" />
      <Win x={380} y={70} w={160} h={150} curtain="#B9A3DA" />
      <rect x="96" y="90" width="90" height="66" rx="3" fill="#FFFFFF" /><rect x="103" y="97" width="76" height="52" fill="#9ED0B8" />
      <path d="M103 149 L130 118 L148 136 L160 124 L179 149 Z" fill="#5FA383" />
      <rect x="40" y="250" width="200" height="90" rx="22" fill="#7B6CA8" />
      <rect x="30" y="300" width="220" height="70" rx="18" fill="#8C7DBA" />
      <rect x="48" y="368" width="10" height="38" fill="#5A4E80" /><rect x="222" y="368" width="10" height="38" fill="#5A4E80" />
      <rect x="70" y="268" width="50" height="38" rx="10" fill="#F4C27A" />
      <Plant x={545} y={404} />
      <ellipse cx="340" cy="420" rx="170" ry="16" fill="#C9A9D6" opacity=".55" />
      <Human x={262} y={312} s={1.25} p={p} />
      {[0, 1, 2, 3, 4].map((k) => (
        <circle key={k} className="dust" style={{ animationDelay: `${k * 0.28}s` }} cx={348 + k * 7} cy={400 - (k % 2) * 6} r={3 + (k % 3)} fill="#B9A58A" />
      ))}
    </g>
  );
}

function SceneDriver({ p }: SceneProps) {
  return (
    <g>
      <rect width="600" height="460" fill="url(#hgSkyBig)" />
      <circle cx="510" cy="80" r="34" fill="#FFE3A3" />
      <g className="city">
        {[0, 600].map((o) => (
          <g key={o} transform={`translate(${o} 0)`}>
            <rect x="10" y="200" width="70" height="170" fill="#BFD6E6" /><rect x="90" y="160" width="60" height="210" fill="#A9C6DB" />
            <rect x="160" y="220" width="80" height="150" fill="#C7DCEB" /><rect x="250" y="180" width="54" height="190" fill="#A9C6DB" />
            <rect x="314" y="230" width="90" height="140" fill="#BFD6E6" /><rect x="414" y="170" width="64" height="200" fill="#B3CDE0" />
            <rect x="488" y="210" width="100" height="160" fill="#C7DCEB" />
            {[110, 270, 430].map((wx) => [0, 1, 2, 3].map((r) => <rect key={wx + "-" + r} x={wx} y={180 + r * 34} width="18" height="14" fill="#E9F3FA" />))}
          </g>
        ))}
      </g>
      <g className="trees">
        {[0, 600].map((o) => (
          <g key={o} transform={`translate(${o} 0)`}>
            {[60, 260, 470].map((tx) => (
              <g key={tx}><rect x={tx - 3} y="330" width="6" height="45" fill="#7A5534" /><circle cx={tx} cy="322" r="24" fill="#5FB07C" /></g>
            ))}
          </g>
        ))}
      </g>
      <rect y="372" width="600" height="88" fill="#4A4F57" />
      <rect y="368" width="600" height="6" fill="#C9CED6" />
      <g className="dashes">{Array.from({ length: 12 }).map((_, k) => <rect key={k} x={k * 100} y="425" width="50" height="6" rx="3" fill="#F4F4F4" />)}</g>
      <g className="car">
        <ellipse cx="316" cy="396" rx="200" ry="8" fill="rgba(0,0,0,.25)" />
        <path d="M110 360 L110 314 Q112 294 140 290 L196 284 L240 222 Q248 212 264 212 L380 212 Q398 212 410 226 L452 284 L500 292 Q522 298 522 320 L522 360 Q522 368 514 368 L118 368 Q110 368 110 360 Z" fill="#E8EEF5" />
        <path d="M262 224 L322 224 L322 284 L214 284 Z" fill="#2B3A4A" />
        <path d="M330 224 L392 224 Q400 224 406 232 L440 284 L330 284 Z" fill="#2B3A4A" />
        <g clipPath="url(#hgWinClip)">
          <Human x={352} y={318} s={0.95} p={p} />
          <g transform="translate(414 270) rotate(-22)"><ellipse rx="4.5" ry="15" fill="none" stroke="#222" strokeWidth="4" /></g>
        </g>
        <path d="M262 224 L322 224 L322 284 L214 284 Z M330 224 L392 224 Q400 224 406 232 L440 284 L330 284 Z" fill="url(#hgGlass)" />
        <path d="M110 314 Q112 294 140 290 L196 284 L522 290 L522 320 L110 322 Z" fill="#F7F9FB" opacity=".5" />
        <path d="M326 222 V364 M196 290 Q192 330 196 364 M450 292 Q454 330 452 364" stroke="#C5CFDA" strokeWidth="2" fill="none" />
        <rect x="300" y="300" width="16" height="4" rx="2" fill="#9FAABA" /><rect x="420" y="300" width="16" height="4" rx="2" fill="#9FAABA" />
        <path d="M510 300 h12 v14 h-10 Z" fill="#FFE066" /><rect x="110" y="300" width="8" height="14" fill="#E53935" />
        <path d="M160 326 H500" stroke="#2F6FD0" strokeWidth="5" />
        <text x="250" y="350" fontSize="15" fontWeight="800" fill="#0B4F42" fontFamily="inherit">HelpGhar</text>
        {[214, 418].map((wx) => (
          <g key={wx}>
            <circle cx={wx} cy="366" r="29" fill="#1F2328" />
            <g className="wheel" style={{ transformOrigin: `${wx}px 366px` }}>
              <circle cx={wx} cy="366" r="15" fill="#AEB7C2" />
              <path d={`M${wx - 15} 366 H${wx + 15} M${wx} 351 V381`} stroke="#6B7480" strokeWidth="3" />
            </g>
          </g>
        ))}
      </g>
      <g className="speed"><path d="M40 300 h50 M20 330 h60 M50 270 h34" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity=".8" /></g>
    </g>
  );
}

function SceneElectrician({ p }: SceneProps) {
  return (
    <g>
      <Room wall="#E8EFF4" floor="#B9C4CC" line="#A3AFB8" />
      <rect width="600" height="34" fill="#D5DEE5" />
      <rect x="40" y="110" width="150" height="190" rx="4" fill="#FFFFFF" /><rect x="48" y="118" width="134" height="174" fill="url(#hgSky)" />
      <path d="M115 118 V292" stroke="#fff" strokeWidth="4" />
      <rect x="470" y="200" width="36" height="52" rx="4" fill="#F7F9FB" stroke="#C7D1D9" />
      <rect x="481" y="212" width="14" height="24" rx="3" fill="#DCE3E8" />
      <rect x="320" y="34" width="4" height="16" fill="#8A97A3" />
      <path d="M302 62 Q322 44 342 62 Z" fill="#5B6B78" />
      <circle className="bulb-glow" cx="322" cy="68" r="34" fill="url(#hgGlow)" />
      <circle className="bulb" cx="322" cy="67" r="7" fill="#FFF3B0" />
      <path d="M298 248 L262 406 M336 248 L372 406" stroke="#E2A72E" strokeWidth="7" strokeLinecap="round" />
      {[290, 330, 370].map((sy, k) => (
        <path key={sy} d={`M${290 - k * 9.5} ${sy} H${344 + k * 9.5}`} stroke="#C98F1E" strokeWidth="5" strokeLinecap="round" />
      ))}
      <rect x="290" y="252" width="52" height="10" rx="3" fill="#E2A72E" />
      <Human x={312} y={178} s={1} p={p} />
      <g className="sparks">
        <path d="M330 58 l10 -6 M332 64 l12 2 M326 56 l4 -10" stroke="#FFC727" strokeWidth="2" strokeLinecap="round" />
      </g>
      <rect x="430" y="372" width="80" height="34" rx="4" fill="#D43F3A" /><rect x="456" y="362" width="28" height="12" rx="4" fill="none" stroke="#8E2421" strokeWidth="4" />
      <path d="M90 404 C140 380 180 410 230 395" stroke="#2B2B2B" strokeWidth="3" fill="none" />
    </g>
  );
}

function ScenePlumber({ p }: SceneProps) {
  return (
    <g>
      <Room wall="#E3F2EF" floor="#C9D3CF" line="#AFBDB8" />
      <rect x="280" y="120" width="300" height="160" fill="url(#hgTiles2)" />
      <rect x="380" y="140" width="110" height="80" rx="6" fill="#DDEBF2" stroke="#BCD0DB" strokeWidth="3" />
      <rect x="270" y="288" width="310" height="14" rx="3" fill="#F2F4F5" />
      <rect x="280" y="302" width="290" height="104" fill="#3B4A52" />
      <rect x="470" y="302" width="100" height="104" fill="#5D7480" /><circle cx="480" cy="354" r="3" fill="#C5D3DA" />
      <path d="M405 270 V248 Q405 238 418 238 H428" stroke="#AEB7C2" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M336 302 V352 Q336 372 356 372 Q376 372 376 352 V340 H468" stroke="#D7DEE3" strokeWidth="11" fill="none" />
      <rect x="329" y="336" width="14" height="10" rx="2" fill="#AEB7C2" />
      <circle className="drip" cx="336" cy="380" r="3" fill="#7CC4F2" />
      <circle className="drip d2" cx="336" cy="380" r="2.6" fill="#7CC4F2" />
      <path d="M318 396 L354 396 L351 406 L321 406 Z" fill="#3A86FF" />
      <rect x="60" y="372" width="96" height="34" rx="4" fill="#1F9183" /><rect x="90" y="362" width="36" height="12" rx="4" fill="none" stroke="#146A60" strokeWidth="4" />
      <Human x={226} y={357} s={1.15} p={p} />
    </g>
  );
}

function SceneCleaner({ p }: SceneProps) {
  return (
    <g>
      <Room wall="#E9EEF5" floor="url(#hgFloorGloss)" line="#C3CEDB" />
      {[60, 220, 380].map((wx) => (
        <g key={wx}><rect x={wx} y="60" width="130" height="230" rx="4" fill="#FFFFFF" /><rect x={wx + 7} y="67" width="116" height="216" fill="url(#hgSky)" /></g>
      ))}
      <Plant x={572} y={404} />
      <path d="M500 406 L518 330 L536 406 Z" fill="#F4C430" /><path d="M508 380 h20" stroke="#2A2A2A" strokeWidth="3" />
      <text x="518" y="366" textAnchor="middle" fontSize="14" fontWeight="800" fill="#2A2A2A" fontFamily="inherit">!</text>
      <path d="M440 370 L480 370 L474 406 L446 406 Z" fill="#3A86FF" /><ellipse cx="460" cy="370" rx="20" ry="4" fill="#BFE0FF" />
      {[[70, 430], [130, 440], [190, 425], [100, 450]].map(([sx, sy], k) => (
        <path key={k} className="sparkle" style={{ animationDelay: `${k * 0.45}s` }}
              d={`M${sx} ${sy - 8} L${sx + 2} ${sy - 2} L${sx + 8} ${sy} L${sx + 2} ${sy + 2} L${sx} ${sy + 8} L${sx - 2} ${sy + 2} L${sx - 8} ${sy} L${sx - 2} ${sy - 2} Z`} fill="#FFFFFF" />
      ))}
      <Human x={232} y={305} s={1.25} p={p} />
    </g>
  );
}

function SceneBabysitter({ p }: SceneProps) {
  return (
    <g>
      <Room wall="#FFEFF2" floor="#E8D5C4" line="#D6BFA9" />
      <Win x={60} y={60} w={140} h={130} curtain="#F7B6C8" />
      <path d="M560 34 V70" stroke="#C9A9B5" strokeWidth="2" />
      <g className="mobile" style={{ transformOrigin: "560px 70px" }}>
        <path d="M520 70 H600" stroke="#C9A9B5" strokeWidth="2" />
        <path d="M528 70 V92 M560 70 V100 M592 70 V88" stroke="#C9A9B5" strokeWidth="1.2" />
        <circle cx="528" cy="96" r="6" fill="#F4C430" /><path d="M560 98 l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill="#7FC7A2" /><circle cx="592" cy="92" r="5" fill="#8CB8F2" />
      </g>
      <rect x="440" y="250" width="150" height="10" rx="4" fill="#E9B8C6" />
      {Array.from({ length: 9 }).map((_, k) => <rect key={k} x={446 + k * 17} y="258" width="5" height="100" fill="#F2CBD6" />)}
      <rect x="440" y="350" width="150" height="14" rx="4" fill="#E9B8C6" />
      <rect x="446" y="362" width="8" height="44" fill="#D79CAE" /><rect x="576" y="362" width="8" height="44" fill="#D79CAE" />
      <rect x="380" y="386" width="20" height="20" rx="3" fill="#8CB8F2" /><rect x="402" y="390" width="16" height="16" rx="3" fill="#F4C430" /><rect x="388" y="370" width="16" height="16" rx="3" fill="#E25858" />
      <rect x="240" y="220" width="46" height="170" rx="20" fill="#5FA383" />
      <rect x="250" y="358" width="120" height="28" rx="12" fill="#6FB592" />
      <rect x="258" y="384" width="9" height="22" fill="#3F7A5E" /><rect x="352" y="384" width="9" height="22" fill="#3F7A5E" />
      <Human x={296} y={352} s={1.2} p={p} slot={<Baby />} />
      {[0, 1, 2].map((k) => (
        <path key={k} className="heart" style={{ animationDelay: `${k * 1.1}s` }} transform={`translate(${352 + k * 12} ${250})`}
              d="M0 3 C-6 -3 -10 4 0 10 C10 4 6 -3 0 3 Z" fill="#E25858" />
      ))}
    </g>
  );
}
function Baby() {
  return (
    <g transform="translate(22 -30) scale(-1.15 1.15) rotate(8)">
      <ellipse cx="6" cy="0" rx="19" ry="9.5" fill="#BFE0F7" />
      <ellipse cx="6" cy="0" rx="19" ry="9.5" fill="url(#hgShade)" />
      <path d="M-8 -4 Q6 4 24 -2" stroke="#9CCBEB" strokeWidth="1.4" fill="none" />
      <circle cx="-9" cy="-6" r="7.6" fill="#EAC09F" />
      <path d="M-15 -10 Q-9 -16 -3 -10" fill="#3A2A1E" />
      <path d="M-7 -6 q1.2 1.2 2.4 0" stroke="#5A3A2A" strokeWidth=".9" fill="none" />
      <path d="M-6.5 -2.6 q1.4 1 2.6 0" stroke="#B5524A" strokeWidth=".9" fill="none" />
      <g className="baby-hand" style={{ transformOrigin: "4px -6px" }}><rect x="2.6" y="-16" width="4" height="11" rx="2" fill="#EAC09F" /></g>
    </g>
  );
}

function SceneTutor({ p, kid }: SceneProps) {
  return (
    <g>
      <Room wall="#EEF1FB" floor="#CDB79A" line="#B89E7F" />
      <circle cx="80" cy="80" r="26" fill="#FFFFFF" stroke="#4560E6" strokeWidth="4" />
      <path className="clock-h" style={{ transformOrigin: "80px 80px" }} d="M80 80 V62" stroke="#222" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M80 80 H92" stroke="#222" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="30" y="140" width="110" height="150" fill="#B98957" />
      {[180, 230, 280].map((sy) => <rect key={sy} x="30" y={sy} width="110" height="6" fill="#8E6538" />)}
      {[[38, "#E25858"], [50, "#4560E6"], [62, "#F4C430"], [74, "#5FA383"], [96, "#7E5BC7"], [108, "#E07A2E"]].map(([bx, c], k) => (
        <rect key={k} x={bx as number} y={148} width="10" height="32" fill={c as string} />
      ))}
      {[[40, "#5FA383"], [54, "#E25858"], [80, "#4560E6"], [94, "#F4C430"]].map(([bx, c], k) => (
        <rect key={k} x={bx as number} y={198} width="12" height="32" fill={c as string} />
      ))}
      <rect x="335" y="104" width="245" height="196" rx="6" fill="#9AA3AD" />
      <rect x="343" y="112" width="229" height="180" rx="3" fill="#FFFFFF" />
      <rect x="380" y="292" width="150" height="7" rx="2" fill="#8C96A1" />
      <g fontFamily="'Caveat', 'Comic Sans MS', cursive" fontSize="30" fill="#1F3FBF">
        <text className="write w1" x="362" y="152">2x + 3 = 11</text>
        <text className="write w2" x="362" y="200">2x = 8</text>
        <text className="write w3" x="362" y="250" fill="#127A63">x = 4 ✓</text>
      </g>
      <path className="write w3" d="M480 214 l20 0 l-10 -24 Z" fill="none" stroke="#E25858" strokeWidth="2.4" />
      <rect x="96" y="356" width="44" height="10" rx="3" fill="#7E5BC7" /><rect x="114" y="364" width="8" height="42" fill="#5D4394" />
      <Human x={124} y={350} s={1} p={kid} />
      <rect x="152" y="328" width="100" height="10" rx="3" fill="#C99A63" />
      <rect x="160" y="336" width="7" height="70" fill="#A97C48" /><rect x="236" y="336" width="7" height="70" fill="#A97C48" />
      <rect x="182" y="323" width="34" height="6" rx="1" fill="#FFFFFF" />
      <Human x={298} y={305} s={1.25} p={p} />
      <g className="bubble-say">
        <rect x="200" y="140" width="96" height="38" rx="14" fill="#FFFFFF" stroke="#4560E6" strokeWidth="2" />
        <path d="M262 176 L272 190 L276 176 Z" fill="#FFFFFF" stroke="#4560E6" strokeWidth="2" strokeLinejoin="round" />
        <rect x="258" y="172" width="20" height="5" fill="#FFFFFF" />
        <text x="248" y="165" textAnchor="middle" fontSize="15" fontWeight="700" fill="#4560E6" fontFamily="inherit">Shabash!</text>
      </g>
    </g>
  );
}

function SceneWatchman({ p }: SceneProps) {
  return (
    <g>
      <rect width="600" height="460" fill="url(#hgDusk)" />
      {[[60, 40], [180, 70], [300, 30], [420, 60], [540, 36], [250, 100]].map(([sx, sy], k) => (
        <circle key={k} className="star" style={{ animationDelay: `${k * 0.5}s` }} cx={sx} cy={sy} r="2" fill="#FFFFFF" />
      ))}
      <circle cx="500" cy="90" r="26" fill="#FFF4D6" /><circle cx="512" cy="82" r="24" fill="#5B4B8A" opacity=".55" />
      <rect y="250" width="600" height="160" fill="#E6D3B3" />
      <rect y="242" width="600" height="12" fill="#CDB48D" />
      {[0, 1, 2, 3, 4, 5].map((k) => <path key={k} d={`M${k * 100} 300 H${k * 100 + 100} M${k * 100 + 50} 300 V350 M${k * 100} 350 H${k * 100 + 100}`} stroke="#D6C09C" strokeWidth="2" />)}
      <rect x="390" y="200" width="200" height="210" fill="#2F3A33" opacity=".15" />
      {Array.from({ length: 11 }).map((_, k) => (
        <g key={k}><rect x={396 + k * 18} y="214" width="5" height="192" fill="#3E4A44" /><path d={`M${393.5 + k * 18} 214 l5 -14 l5 14 Z`} fill="#3E4A44" /></g>
      ))}
      <rect x="390" y="250" width="200" height="6" fill="#3E4A44" /><rect x="390" y="360" width="200" height="6" fill="#3E4A44" />
      <rect x="40" y="200" width="140" height="206" fill="#F2E6CF" />
      <path d="M28 204 L110 160 L192 204 Z" fill="#9C4A2F" />
      <rect className="booth-light" x="66" y="236" width="88" height="60" rx="4" fill="#FFD866" />
      <path d="M110 236 V296" stroke="#F2E6CF" strokeWidth="4" />
      <rect x="196" y="300" width="6" height="104" rx="3" fill="#8B5A2B" transform="rotate(8 199 352)" />
      <rect x="330" y="150" width="6" height="256" fill="#3E4A44" />
      <path d="M318 150 h30 l-6 -14 h-18 Z" fill="#3E4A44" />
      <circle className="lamp" cx="333" cy="160" r="40" fill="url(#hgGlow)" />
      <rect y="406" width="600" height="54" fill="#8E8A80" />
      <Human x={256} y={318} s={1.2} p={p} />
    </g>
  );
}

/* People + what each one is doing */
const WORKERS: any[] = [
  {
    en: "cook", cam: [1.3, 330, 283], role: "Cook", ur: "باورچی", c: "#E07A2E", name: "Rashid Khan", rating: 4.9, rate: "Rs 1,500 / day", doing: "Making daal for dinner", Scene: SceneCook, category: "Cooks",
    p: { skin: "#C68863", hair: "short", hairColor: "#1E1611", mustache: true, hat: "chef", top: "#FFFFFF", bottom: "#2F2F35", apron: "#E07A2E", placket: true,
      pose: { torso: 8, neck: 6, nSh: { f: -58, t: -74, d: 0.9 }, nEl: { f: -28, t: -42, d: 0.9, dl: -0.45 }, fSh: -30, fEl: -60, nHip: -4, nKnee: 4, fHip: 6, fKnee: 2 },
      nHand: <Ladle rot={95} /> },
  },
  {
    en: "maid", cam: [1.3, 300, 283], role: "Maid", ur: "ماسی", c: "#D2477F", name: "Shazia Bibi", rating: 4.8, rate: "Rs 1,200 / day", doing: "Sweeping the lounge", Scene: SceneMaid, category: "House Servants",
    p: { skin: "#B5764E", hair: "bun", hairColor: "#161210", female: true, kameez: true, hem: 26, top: "#D2477F", bottom: "#F7D1E0", dupatta: "#F4A62A", bangles: "#F2C14E", earring: true, shadow: 80,
      pose: { torso: 38, neck: -24, nSh: { f: -16, t: -66, d: 0.7 }, nEl: { f: -16, t: -4, d: 0.7 }, fSh: -48, fEl: -38, nHip: -30, nKnee: 40, fHip: -5, fKnee: 20 },
      nHand: <Jharu /> },
  },
  {
    en: "driver", cam: [1.15, 316, 260], role: "Driver", ur: "ڈرائیور", c: "#2F6FD0", name: "Imran Ali", rating: 4.9, rate: "Rs 2,000 / day", doing: "Doing the school run", Scene: SceneDriver, category: "Drivers",
    p: { skin: "#D9A07A", hair: "short", hairColor: "#14100D", hat: "cap", hatColor: "#1E2A44", mustache: true, top: "#2F6FD0", bottom: "#1E2A44", collar: "#FFFFFF", placket: true, shadow: false,
      pose: { torso: -8, neck: { f: -4, t: 6, d: 2.4 }, nSh: { f: -70, t: -80, d: 1.4 }, nEl: { f: -30, t: -20, d: 1.4 }, fSh: -76, fEl: -24, nHip: -88, nKnee: 88, fHip: -88, fKnee: 88 } },
  },
  {
    en: "electrician", cam: [1.2, 330, 200], role: "Electrician", ur: "الیکٹریشن", c: "#C99700", name: "Waqas Ahmed", rating: 4.7, rate: "Rs 800 / visit", doing: "Fixing a ceiling light", Scene: SceneElectrician, category: "Electricians",
    p: { skin: "#A86B45", hair: "short", hairColor: "#2A1B14", hat: "hard", hatColor: "#FFC727", top: "#3D5566", bottom: "#2B3A44", toolbelt: true, pocket: true, placket: true,
      pose: { torso: -4, neck: -26, nSh: { f: -148, t: -156, d: 0.5 }, nEl: { f: -16, t: -26, d: 0.5 }, fSh: -36, fEl: -50, nHip: -2, nKnee: 2, fHip: 3, fKnee: 0 },
      nHand: <Screwdriver /> },
  },
  {
    en: "plumber", cam: [1.3, 300, 283], role: "Plumber", ur: "پلمبر", c: "#1F9183", name: "Asif Mehmood", rating: 4.8, rate: "Rs 900 / visit", doing: "Fixing a leaking sink", Scene: ScenePlumber, category: "Plumbers",
    p: { skin: "#C68863", hair: "short", hairColor: "#3A2A1E", hat: "cap", hatColor: "#1F9183", short: true, top: "#F1F1F1", bottom: "#1F9183", overalls: true, shadow: 46,
      pose: { torso: 25, neck: -14, nSh: -86, nEl: { f: -6, t: -26, d: 0.6 }, fSh: -72, fEl: -30, nHip: -82, nKnee: 82, fHip: 2, fKnee: 88 },
      nHand: <Wrench /> },
  },
  {
    en: "cleaner", cam: [1.3, 300, 283], role: "Cleaner", ur: "صفائی والا", c: "#7E5BC7", name: "Naeem Masih", rating: 4.8, rate: "Rs 1,000 / day", doing: "Mopping the hallway", Scene: SceneCleaner, category: "Cleaners",
    p: { skin: "#B5764E", hair: "short", hairColor: "#121010", top: "#7E5BC7", bottom: "#2E2A3A", collar: "#5E3FA8", short: true, placket: true,
      pose: { torso: 14, neck: -6, nSh: { f: -28, t: -62, d: 1.1 }, nEl: -40, fSh: { f: -40, t: -72, d: 1.1 }, fEl: -46, nHip: -22, nKnee: 14, fHip: 14, fKnee: 6 },
      nHand: <Mop rot={60} /> },
  },
  {
    en: "babysitter", cam: [1.3, 330, 283], role: "Babysitter", ur: "آیا", c: "#E25858", name: "Rubina Shah", rating: 5.0, rate: "Rs 1,400 / day", doing: "Rocking the baby to sleep", Scene: SceneBabysitter, category: "Baby Sitters",
    p: { skin: "#E0AC88", female: true, hijab: "#E25858", kameez: true, hem: 8, lap: true, shadow: 50, bangles: "#F2C14E", top: "#F59A9A", bottom: "#FFEDED", open: true,
      pose: { torso: { f: -3, t: 5, d: 1.6 }, neck: 20, nSh: -8, nEl: -84, fSh: -4, fEl: -112, nHip: -86, nKnee: 86, fHip: -84, fKnee: 84 } },
  },
  {
    en: "home tutor", cam: [1.2, 340, 268], role: "Home tutor", ur: "ٹیوٹر", c: "#4560E6", name: "Sana Qureshi", rating: 4.9, rate: "Rs 12,000 / month", doing: "Teaching Class 6 maths", Scene: SceneTutor, category: "Home Teachers",
    p: { skin: "#D9A07A", hair: "long", hairColor: "#1E1611", female: true, glasses: true, earring: true, kameez: true, hem: 26, trim: "#FFFFFF", top: "#4560E6", bottom: "#E6EBFF", dupatta: "#F2C14E",
      pose: { torso: -2, neck: -10, nSh: { f: -132, t: -142, d: 0.5 }, nEl: { f: -8, t: -24, d: 0.32 }, fSh: 12, fEl: -60, nHip: -6, nKnee: 4, fHip: 6, fKnee: 2 },
      nHand: <Marker />, fHand: <Book /> },
    kid: { skin: "#C68863", hair: "short", hairColor: "#1A1310", top: "#FFFFFF", bottom: "#24324A", collar: "#24324A", shadow: 48,
      pose: { torso: 6, neck: { f: -8, t: 4, d: 1.8 }, nSh: { k: "kRaise", f: -52, t: -170, d: 5.2 }, nEl: { k: "kRaise", f: -52, t: -8, d: 5.2 }, fSh: -48, fEl: -44, nHip: -88, nKnee: 88, fHip: -86, fKnee: 86 },
      nHand: <Pencil /> },
  },
  {
    en: "watchman", cam: [1.25, 280, 276], role: "Watchman", ur: "چوکیدار", c: "#6B7A2E", name: "Gul Muhammad", rating: 4.7, rate: "Rs 25,000 / month", doing: "Guarding the gate at night", Scene: SceneWatchman, category: "Watchmen",
    p: { skin: "#A86B45", hair: "short", hairColor: "#9A9A9A", beard: true, hat: "cap", hatColor: "#4A4630", top: "#7D7048", bottom: "#4A4630", badge: true, belt: "#2E2A1C", pocket: true, placket: true,
      pose: { torso: 0, neck: { f: -3, t: 4, d: 3 }, nSh: { k: "kSalute", f: 4, t: -94, d: 5.2 }, nEl: { k: "kSalute", f: -4, t: -132, d: 5.2 }, fSh: -16, fEl: -30, nHip: -2, nKnee: 2, fHip: 3, fKnee: 0 },
      fHand: <Torch rot={70} /> },
  },
];

const PHRASES = [
  "Need a driver in Clifton tomorrow?",
  "Gulshan mein cook chahiye",
  "Maths tutor for Class 6 in DHA",
  "Babysitter for weekday evenings",
  "Electrician for a fan fitting",
];

function useTyping(phrases: string[]) {
  const [text, setText] = useState("");
  useEffect(() => {
    let p = 0;
    let c = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const full = phrases[p];
      if (!deleting) {
        c++;
        setText(full.slice(0, c));
        if (c === full.length) { deleting = true; timer = setTimeout(step, 1500); return; }
      } else {
        c--;
        setText(full.slice(0, c));
        if (c === 0) { deleting = false; p = (p + 1) % phrases.length; }
      }
      timer = setTimeout(step, deleting ? 26 : 55);
    };
    timer = setTimeout(step, 700);
    return () => clearTimeout(timer);
  }, [phrases]);
  return text;
}

/* shared SVG gradients */
function Defs() {
  return (
    <defs>
      <linearGradient id="hgShade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#1a0d06" stopOpacity=".30" />
        <stop offset=".22" stopColor="#1a0d06" stopOpacity=".1" />
        <stop offset=".5" stopColor="#1a0d06" stopOpacity="0" />
        <stop offset=".78" stopColor="#fff" stopOpacity=".13" />
        <stop offset="1" stopColor="#1a0d06" stopOpacity=".06" />
      </linearGradient>
      <radialGradient id="hgFace" cx=".68" cy=".35" r=".85">
        <stop offset="0" stopColor="#fff" stopOpacity=".16" />
        <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#1a0d06" stopOpacity=".3" />
      </radialGradient>
      <radialGradient id="hgShadowR">
        <stop offset="0" stopColor="#000" stopOpacity=".28" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="hgShine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0" />
        <stop offset=".5" stopColor="#fff" stopOpacity=".16" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="hgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FD3F2" /><stop offset="1" stopColor="#DDF1FB" /></linearGradient>
      <linearGradient id="hgSkyBig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8FCBEF" /><stop offset="1" stopColor="#E3F4FB" /></linearGradient>
      <linearGradient id="hgDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3B2F6B" /><stop offset=".6" stopColor="#B4637A" /><stop offset="1" stopColor="#F2A06B" /></linearGradient>
      <linearGradient id="hgSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7D8894" /><stop offset=".45" stopColor="#D7DEE5" /><stop offset="1" stopColor="#8A95A1" /></linearGradient>
      <linearGradient id="hgGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset=".4" stopColor="#fff" stopOpacity=".05" /><stop offset="1" stopColor="#fff" stopOpacity=".18" /></linearGradient>
      <linearGradient id="hgBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF4B8" stopOpacity=".9" /><stop offset="1" stopColor="#FFF4B8" stopOpacity="0" /></linearGradient>
      <linearGradient id="hgFloorGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D5DEE8" /><stop offset=".5" stopColor="#F4F7FA" /><stop offset="1" stopColor="#CBD5E0" /></linearGradient>
      <radialGradient id="hgGlow"><stop offset="0" stopColor="#FFF1A6" stopOpacity=".95" /><stop offset="1" stopColor="#FFF1A6" stopOpacity="0" /></radialGradient>
      <pattern id="hgTiles" width="28" height="20" patternUnits="userSpaceOnUse">
        <rect width="28" height="20" fill="#F6F1E8" /><path d="M0 0 H28 M0 0 V20" stroke="#E2D7C4" strokeWidth="2" />
      </pattern>
      <pattern id="hgTiles2" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#FFFFFF" /><path d="M0 0 H24 M0 0 V24" stroke="#D4E6E2" strokeWidth="2" />
      </pattern>
      <clipPath id="hgWinClip">
        <path d="M262 224 L322 224 L322 284 L214 284 Z M330 224 L392 224 Q400 224 406 232 L440 284 L330 284 Z" />
      </clipPath>
    </defs>
  );
}

/* ═══════════════════════ Hero ═══════════════════════ */
export function HeroSection() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [query, setQuery] = useState("");
  const typed = useTyping(PHRASES);

  useEffect(() => {
    const t = setInterval(() => setI((x: number) => (x + 1) % WORKERS.length), CYCLE);
    return () => clearInterval(t);
  }, [i]);

  const w = WORKERS[i];
  const Scene = w.Scene;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    navigate(params.toString() ? `/services?${params.toString()}` : "/services");
  };

  return (
    <section className="hg-root" aria-label="HelpGhar – find trusted home help">
      <style>{CSS}</style>
      <div className="hg-blob b1" />
      <div className="hg-blob b2" />

      <div className="hg-wrap">
        <div className="hg-copy">
          <span className="hg-pill"><BadgeCheck size={16} /> Every worker CNIC-checked by our team</span>
          <h1 className="hg-h1">
            Find a trusted
            <br />
            <span className="hg-rot" aria-live="polite">
              <span key={i} className="hg-rot-word" style={{ color: w.c }}>{w.en}</span>
            </span>
            <br />for your ghar.
          </h1>
          <p className="hg-ur" dir="rtl" lang="ur">آپ کے گھر کے لیے بھروسہ مند مدد</p>
          <p className="hg-sub">
            Search, chat, book and pay home help in one place. Workers set their own price,
            and you see the flat 5% fee before you pay.
          </p>
          <form className="hg-search" role="search" onSubmit={submit}>
            <Search size={20} />
            <label className="sr-only" htmlFor="hg-hero-query">Search for home help</label>
            <input
              id="hg-hero-query"
              className="hg-typed-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={typed || "Search by name, skill or area"}
            />
            <button className="hg-btn" type="submit">Search <ArrowRight size={16} /></button>
          </form>
          <div className="hg-cta-row">
            <Link to="/services" className="hg-btn saf">Find help near you</Link>
            <Link to="/register?role=worker" className="hg-btn ghost">Join as a worker</Link>
          </div>
          <ul className="hg-checks">
            <li><Check size={15} /> Chat before you book</li>
            <li><Check size={15} /> Refund on pending jobs</li>
            <li><Check size={15} /> English, اردو, Roman Urdu</li>
          </ul>
        </div>

        <div className="hg-stage">
          <div className="hg-frame">
            <svg viewBox="0 0 600 460" className="hg-svg" role="img" aria-label={`${w.role} ${w.doing.toLowerCase()}`}>
              <Defs />
              <g key={i} className="hg-scene-in">
                <g transform={`translate(300 230) scale(${w.cam[0]}) translate(${-w.cam[1]} ${-w.cam[2]})`}>
                  <Scene p={w.p} kid={w.kid} />
                </g>
              </g>
            </svg>

            <div className="hg-card" key={"c" + i} style={cssVars({ "--c": w.c })}>
              <div className="hg-av">{w.name.split(" ").map((s: string) => s[0]).join("")}</div>
              <div>
                <div className="hg-card-name">{w.name} <BadgeCheck size={15} className="hg-tick" /></div>
                <div className="hg-card-role"><b>{w.role}</b> <span lang="ur">{w.ur}</span></div>
                <div className="hg-card-meta"><Star size={12} fill="currentColor" /> {w.rating.toFixed(1)} <i /> {w.rate}</div>
              </div>
            </div>
            <div className="hg-doing" key={"d" + i}><span className="hg-live" /> {w.doing}</div>
          </div>

          <div className="hg-picker" role="tablist" aria-label="Choose a worker type">
            {WORKERS.map((wk, k) => (
              <button
                key={wk.en}
                type="button"
                role="tab"
                aria-selected={k === i}
                className={"hg-pick" + (k === i ? " on" : "")}
                style={cssVars({ "--c": wk.c })}
                onClick={() => setI(k)}
              >
                {wk.role}
                {k === i && <span className="hg-bar" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* Styles */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Noto+Nastaliq+Urdu:wght@500;700&family=Caveat:wght@600&display=swap');

.hg-root{--em:#0B4F42;--em2:#127A63;--saf:#F4A62A;--bg:#EEF7F2;--ink:#10231E;--muted:#4F625B;--line:rgba(11,79,66,.13);
  position:relative;overflow:hidden;isolation:isolate;background:var(--bg);color:var(--ink);
  font-family:'Bricolage Grotesque',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;padding:60px 24px 56px}
.hg-root *{box-sizing:border-box}
.hg-root button,.hg-root a.hg-btn,.hg-root a.hg-pick{font:inherit}
.hg-root button:focus-visible,.hg-root a:focus-visible{outline:3px solid var(--saf);outline-offset:3px}
.hg-root .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.hg-blob{position:absolute;border-radius:50%;filter:blur(70px);z-index:-1;animation:hgDrift 18s ease-in-out infinite alternate}
.b1{width:440px;height:440px;background:#BDE7D5;top:-160px;left:-140px;opacity:.75}
.b2{width:420px;height:420px;background:#FFE0AC;bottom:-120px;right:-80px;opacity:.55;animation-delay:-7s}
.hg-wrap{max-width:1260px;margin:0 auto;display:grid;grid-template-columns:.92fr 1.08fr;gap:40px;align-items:center}

.hg-copy>*{animation:hgUp .8s cubic-bezier(.2,.8,.2,1) both}
.hg-copy>*:nth-child(2){animation-delay:.08s}.hg-copy>*:nth-child(3){animation-delay:.16s}
.hg-copy>*:nth-child(4){animation-delay:.24s}.hg-copy>*:nth-child(5){animation-delay:.32s}
.hg-copy>*:nth-child(6){animation-delay:.4s}.hg-copy>*:nth-child(7){animation-delay:.48s}
.hg-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#fff;border:1px solid var(--line);
  color:var(--em);font-weight:600;font-size:14px;box-shadow:0 4px 14px rgba(11,79,66,.08)}
.hg-h1{font-size:clamp(40px,5.2vw,66px);line-height:1.02;letter-spacing:-.035em;font-weight:800;margin:20px 0 6px}
.hg-rot{display:inline-block;overflow:hidden;vertical-align:bottom;height:1.1em;padding-right:.04em}
.hg-rot-word{display:inline-block;position:relative;animation:hgWord .6s cubic-bezier(.2,.9,.25,1.2) both}
.hg-rot-word::after{content:"";position:absolute;left:0;right:0;bottom:.08em;height:.12em;background:currentColor;opacity:.22;border-radius:4px;transform-origin:left;animation:hgLine .7s .25s both}
.hg-ur{font-family:'Noto Nastaliq Urdu',serif;font-size:22px;color:var(--em);margin:0 0 8px;line-height:2.1;text-align:left}
.hg-sub{font-size:17px;line-height:1.6;color:var(--muted);max-width:30em;margin:0 0 22px}
.hg-search{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:8px 8px 8px 16px;
  max-width:520px;box-shadow:0 12px 32px rgba(11,79,66,.10);color:var(--em)}
.hg-typed-input{flex:1;min-width:0;color:var(--ink);font-size:16px;background:transparent;border:0;outline:none;min-height:24px}
.hg-typed-input::placeholder{color:var(--muted);opacity:.85}
.hg-btn{display:inline-flex;align-items:center;gap:6px;border:0;cursor:pointer;font-weight:700;font-size:15px;border-radius:14px;padding:12px 18px;
  background:var(--em);color:#fff;transition:transform .2s,background .2s;text-decoration:none}
.hg-btn:hover{background:var(--em2);transform:translateY(-2px);color:#fff}
.hg-btn.saf{background:var(--saf);color:#2A1900;position:relative;overflow:hidden;box-shadow:0 10px 24px rgba(244,166,42,.35)}
.hg-btn.saf::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent);animation:hgShine 3.2s ease-in-out infinite}
.hg-btn.saf:hover{background:#F7B544;color:#2A1900}
.hg-btn.ghost{background:transparent;color:var(--em);border:1.5px solid var(--em)}
.hg-btn.ghost:hover{background:var(--em);color:#fff}
.hg-cta-row{display:flex;gap:12px;margin:18px 0 22px;flex-wrap:wrap}
.hg-checks{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14px;color:var(--muted)}
.hg-checks li{display:inline-flex;align-items:center;gap:6px}
.hg-checks svg{color:#fff;background:var(--em2);border-radius:50%;padding:2px}

.hg-stage{animation:hgUp 1s .15s cubic-bezier(.2,.8,.2,1) both;min-width:0}
.hg-frame{position:relative;border-radius:28px;overflow:hidden;aspect-ratio:600/460;background:#fff;
  box-shadow:0 30px 60px rgba(16,35,30,.18),0 0 0 6px #fff}
.hg-svg{display:block;width:100%;height:100%}
.hg-scene-in{animation:sceneIn .7s cubic-bezier(.2,.8,.2,1) both;transform-box:view-box;transform-origin:300px 230px}
.hg-card{position:absolute;right:14px;top:14px;display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);
  border-radius:16px;padding:10px 14px 10px 10px;box-shadow:0 10px 24px rgba(16,35,30,.14);animation:cardIn .55s .25s cubic-bezier(.2,.9,.25,1.25) both}
.hg-av{width:42px;height:42px;border-radius:12px;background:var(--c);color:#fff;font-weight:800;display:grid;place-items:center;font-size:15px}
.hg-card-name{display:flex;align-items:center;gap:5px;font-weight:800;font-size:15px}
.hg-tick{color:var(--em2)}
.hg-card-role{font-size:12.5px;display:flex;gap:8px;align-items:baseline}
.hg-card-role b{color:var(--c)}
.hg-card-role span{font-family:'Noto Nastaliq Urdu',serif;color:var(--muted);line-height:1.6}
.hg-card-meta{display:flex;align-items:center;gap:5px;font-size:12px;color:#B7791F;font-weight:700}
.hg-card-meta i{width:3px;height:3px;border-radius:50%;background:var(--muted);margin:0 3px}
.hg-doing{position:absolute;left:14px;bottom:14px;display:inline-flex;align-items:center;gap:8px;background:rgba(16,35,30,.78);color:#fff;
  font-size:13px;font-weight:600;padding:8px 13px;border-radius:999px;animation:cardIn .5s .5s both}
.hg-live{width:8px;height:8px;border-radius:50%;background:#4ADE80;box-shadow:0 0 0 0 rgba(74,222,128,.7);animation:live 1.6s infinite}
.hg-picker{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px;justify-content:center}
.hg-pick{position:relative;overflow:hidden;border:1.5px solid var(--line);background:#fff;color:var(--ink);border-radius:999px;padding:7px 13px;
  font-size:13px;font-weight:600;cursor:pointer;transition:background .25s,color .25s,border-color .25s;text-decoration:none;display:inline-flex}
.hg-pick:hover{border-color:var(--c)}
.hg-pick.on{background:var(--c);border-color:var(--c);color:#fff}
.hg-bar{position:absolute;left:0;bottom:0;height:3px;background:rgba(255,255,255,.75);animation:bar ${CYCLE}ms linear both}

.h-breathe{animation:breathe 3.2s ease-in-out infinite}
.blink{transform-box:fill-box;transform-origin:center;animation:blink 4.6s infinite}
@keyframes jSwing{from{transform:rotate(var(--f))}to{transform:rotate(var(--t))}}
@keyframes kSalute{0%,22%{transform:rotate(var(--f))}38%,70%{transform:rotate(var(--t))}86%,100%{transform:rotate(var(--f))}}
@keyframes kRaise{0%,40%{transform:rotate(var(--f))}52%,78%{transform:rotate(var(--t))}90%,100%{transform:rotate(var(--f))}}
@keyframes breathe{50%{transform:translateY(-1px)}}
@keyframes blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}

.flame{transform-box:fill-box;transform-origin:bottom;animation:flame .25s ease-in-out infinite alternate}
.steam{opacity:0;animation:steam 2.1s ease-out infinite}
.bubble{transform-box:fill-box;transform-origin:center;animation:pop 1.1s ease-in-out infinite}
.bubble.b2{animation-delay:.5s}
.curtain{transform-box:fill-box;transform-origin:top;animation:curtain 4s ease-in-out infinite alternate}
.curtain.c2{animation-delay:-2s}
.cloud-s{animation:cloudS 9s ease-in-out infinite alternate}
.leaf{transform-box:fill-box;transform-origin:bottom;animation:leaf 3.5s ease-in-out infinite alternate}
.dust{opacity:0;animation:dust 1.4s ease-out infinite}
.city{animation:scroll 14s linear infinite}
.trees{animation:scroll 5s linear infinite}
.dashes{animation:dash .6s linear infinite}
.car{animation:carBob .35s ease-in-out infinite alternate}
.wheel{animation:spin .5s linear infinite}
.speed{animation:speed .8s linear infinite}
.bulb{animation:bulb 2.4s steps(1) infinite}
.bulb-glow{opacity:0;animation:glow 2.4s steps(1) infinite}
.sparks{opacity:0;animation:sparks .5s steps(2) infinite}
.wr-turn{animation:wr .6s ease-in-out infinite alternate}
.drip{animation:drip 1.2s ease-in infinite}
.drip.d2{animation-delay:.6s}
.sparkle{transform-box:fill-box;transform-origin:center;animation:sparkle 1.8s ease-in-out infinite}
.mobile{animation:mobile 3s ease-in-out infinite alternate}
.heart{opacity:0;animation:heart 3.2s ease-out infinite}
.baby-hand{animation:babyHand .8s ease-in-out infinite alternate}
.clock-h{animation:spin 6s linear infinite}
.write{clip-path:inset(0 100% 0 0);animation:write 1.1s steps(14) forwards}
.write.w2{animation-delay:1.4s}.write.w3{animation-delay:2.7s}
.bubble-say{opacity:0;transform-box:fill-box;transform-origin:bottom right;animation:say .5s 3.6s cubic-bezier(.2,.9,.25,1.4) forwards}
.star{animation:twinkle 2.4s ease-in-out infinite}
.lamp,.booth-light{animation:lamp 3s ease-in-out infinite}
.beam{animation:beam 1.6s ease-in-out infinite}

@keyframes flame{to{transform:scaleY(1.25)}}
@keyframes steam{0%{opacity:0;transform:translateY(8px)}30%{opacity:.75}100%{opacity:0;transform:translateY(-34px)}}
@keyframes pop{0%,100%{transform:scale(.4)}50%{transform:scale(1.2)}}
@keyframes curtain{to{transform:skewX(3deg)}}
@keyframes cloudS{to{transform:translateX(26px)}}
@keyframes leaf{from{transform:rotate(-3deg)}to{transform:rotate(3deg)}}
@keyframes dust{0%{opacity:0;transform:translate(0,0) scale(.5)}20%{opacity:.8}100%{opacity:0;transform:translate(40px,-26px) scale(1.6)}}
@keyframes scroll{to{transform:translateX(-600px)}}
@keyframes dash{to{transform:translateX(-100px)}}
@keyframes carBob{to{transform:translateY(-2px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes speed{from{transform:translateX(30px);opacity:.9}to{transform:translateX(-40px);opacity:0}}
@keyframes bulb{0%,8%,16%{fill:#FFF3B0}4%,12%,20%,30%{fill:#B8B19A}36%,100%{fill:#FFF3B0}}
@keyframes glow{0%,30%{opacity:0}4%,12%{opacity:.6}36%,100%{opacity:1}}
@keyframes sparks{50%{opacity:1}}
@keyframes wr{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
@keyframes drip{0%{transform:translateY(-8px);opacity:0}15%{opacity:1}100%{transform:translateY(14px);opacity:.2}}
@keyframes sparkle{0%,100%{transform:scale(0) rotate(0);opacity:0}50%{transform:scale(1) rotate(45deg);opacity:1}}
@keyframes mobile{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
@keyframes heart{0%{opacity:0;transform:translateY(0) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translateY(-60px) scale(1.2)}}
@keyframes babyHand{from{transform:rotate(-20deg)}to{transform:rotate(25deg)}}
@keyframes write{to{clip-path:inset(0 0 0 0)}}
@keyframes say{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
@keyframes twinkle{50%{opacity:.25}}
@keyframes lamp{50%{opacity:.75}}
@keyframes beam{50%{opacity:.6}}

@keyframes sceneIn{from{opacity:0;transform:scale(1.06)}}
@keyframes cardIn{from{opacity:0;transform:translateY(-10px) scale(.92)}}
@keyframes live{70%{box-shadow:0 0 0 8px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
@keyframes bar{from{width:0}to{width:100%}}
@keyframes hgDrift{to{transform:translate(40px,30px) scale(1.1)}}
@keyframes hgUp{from{opacity:0;transform:translateY(18px)}}
@keyframes hgWord{from{opacity:0;transform:translateY(100%)}}
@keyframes hgLine{from{transform:scaleX(0)}}
@keyframes hgShine{0%{left:-60%}55%,100%{left:130%}}

@media (max-width:1000px){.hg-wrap{grid-template-columns:1fr}}
@media (max-width:560px){
  .hg-root{padding:44px 16px 36px}
  .hg-typed-input{font-size:14px}
  .hg-search .hg-btn{padding:10px 12px}
  .hg-frame{border-radius:20px}
  .hg-card{right:8px;top:8px;padding:7px 10px 7px 7px;gap:8px}
  .hg-av{width:34px;height:34px;font-size:13px}
  .hg-card-name{font-size:13px}
  .hg-doing{left:8px;bottom:8px;font-size:11.5px;padding:6px 10px}
  .hg-pick{font-size:12px;padding:6px 10px}
}
@media (prefers-reduced-motion:reduce){
  .hg-root *,.hg-root *::before,.hg-root *::after{animation-duration:.001ms!important;animation-iteration-count:1!important;animation-delay:0s!important;transition:none!important}
}
`;
