"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BlobSpec } from "./types";
import { BASELINE } from "./constants";
import { buildPath } from "./helpers";

function BlobShape({
  spec,
  showPassword,
  focused,
  passwordFocused,
  invalid,
  success,
}: {
  spec: BlobSpec;
  showPassword: boolean;
  focused: boolean;
  passwordFocused: boolean;
  invalid: boolean;
  success: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [bouncing, setBouncing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setBouncing(true), spec.bounceDelay * 1000);
    return () => clearTimeout(t);
  }, [success, spec.bounceDelay]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (focused) return;
      // Map mouse position across full viewport to -1..1, then scale to reach
      const xPct = (e.clientX / window.innerWidth) * 2 - 1;
      const yPct = (e.clientY / window.innerHeight) * 2 - 1;
      setEyeOffset({ x: xPct * 8, y: yPct * 8 });
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [focused]);

  const path = buildPath(spec, focused && !success, showPassword);
  const maxShift = spec.width * 0.18;
  const isNudgeOnly = spec.kind === "semicircle" || spec.kind === "topRoundRect";

  let faceXTarget = eyeOffset.x * 0.9;
  let faceYTarget = eyeOffset.y * 2.5;
  let groupX = 0;
  let groupY = 0;

  if (focused && !success) {
    if (passwordFocused && !showPassword) {
      // Covering eyes — look away from the password field
      faceXTarget = isMobile ? -18 : -22;
      faceYTarget = isNudgeOnly ? 0 : 10;
      groupX = isMobile ? -18 : -22;
      groupY = isNudgeOnly ? 0 : 10;
    } else if (showPassword) {
      // Password is revealed — peek sideways with squinting eyes
      faceXTarget = isMobile ? -16 : -8;
      faceYTarget = isNudgeOnly ? 0 : -8;
      groupX = isMobile ? -16 : -8;
      groupY = isNudgeOnly ? 0 : -8;
    } else {
      // Text field focused — look toward the form
      faceXTarget = isMobile ? 0 : (isNudgeOnly ? 6 : Math.min(18, maxShift));
      faceYTarget = isNudgeOnly ? 0 : (isMobile ? 24 : -28);
      groupX = isMobile ? 0 : (isNudgeOnly ? 40 : 22);
      groupY = isNudgeOnly ? 0 : (isMobile ? 28 : -28);
    }
  }

  const faceShiftX = Math.max(-maxShift, Math.min(maxShift, faceXTarget));
  const faceShiftY = faceYTarget;

  const eyePad = spec.eyeRx + 4;
  const lx = Math.max(eyePad, Math.min(spec.width - eyePad, spec.width / 2 - spec.eyeGap / 2 + faceShiftX));
  const rx = Math.max(eyePad, Math.min(spec.width - eyePad, spec.width / 2 + spec.eyeGap / 2 + faceShiftX));
  const eyeY = spec.eyeY + faceShiftY;
  const mouthX = spec.width / 2 + faceShiftX * 0.8;
  const mouthMode = success ? "smile" : invalid ? "sad" : focused ? "neutral" : "smile";

  // Show closed eyes (lines) when covering password or when password is revealed
  const showClosedEyes = !success && ((passwordFocused && !showPassword) || showPassword);

  const bounceY = bouncing ? [0, -80, 0, -40, 0, -15, 0] : 0;

  return (
    <motion.svg
      ref={ref}
      className={`absolute ${invalid ? "blob-reject" : ""}`}
      style={{
        left: spec.left,
        bottom: BASELINE,
        transformOrigin: "bottom center",
        zIndex: spec.zIndex ?? 0,
      }}
      width={spec.width}
      height={spec.height}
      viewBox={`0 0 ${spec.width} ${spec.height}`}
      fill="none"
      initial={{ y: -300, opacity: 0, rotate: -8 }}
      animate={{
        y: bounceY,
        opacity: 1,
        rotate:
          !success && spec.kind === "topRoundRect"
            ? focused ? (isMobile ? 0 : 20) : 0
            : 0,
        x:
          !success && spec.kind === "topRoundRect"
            ? focused ? (isMobile ? 0 : 12) : 0
            : 0,
      }}
      transition={
        bouncing
          ? { y: { duration: 0.9, ease: "easeOut" }, opacity: { duration: 0 }, rotate: { duration: 0 }, x: { duration: 0 } }
          : { type: "spring", stiffness: 200, damping: 18, delay: spec.enterDelay }
      }
    >
      <motion.path
        d={path}
        fill={spec.color}
        animate={{ d: path }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
      />
      <motion.g
        animate={{
          x: groupX,
          y: groupY,
          rotate: invalid ? [0, -4, 4, -4, 4, 0] : 0,
        }}
        transition={{
          x: { type: "spring", stiffness: 180, damping: 20 },
          y: { type: "spring", stiffness: 180, damping: 20 },
          rotate: { duration: 0.42 },
        }}
      >
        {showClosedEyes ? (
          <>
            <path d={`M ${lx - spec.eyeRx} ${eyeY} L ${lx + spec.eyeRx} ${eyeY}`} stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M ${rx - spec.eyeRx} ${eyeY} L ${rx + spec.eyeRx} ${eyeY}`} stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx={lx} cy={eyeY} rx={spec.eyeRx} ry={spec.eyeRx} fill="#111" />
            <ellipse cx={rx} cy={eyeY} rx={spec.eyeRx} ry={spec.eyeRx} fill="#111" />
          </>
        )}
        {mouthMode === "neutral" && (
          <path d={`M ${mouthX - 10} ${eyeY + 34} L ${mouthX + 10} ${eyeY + 34}`} stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
        {mouthMode === "smile" && (
          <path d={`M ${mouthX - 11} ${eyeY + 30} Q ${mouthX} ${eyeY + 42} ${mouthX + 11} ${eyeY + 30}`} stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
        {mouthMode === "sad" && (
          <path d={`M ${mouthX - 11} ${eyeY + 38} Q ${mouthX} ${eyeY + 28} ${mouthX + 11} ${eyeY + 38}`} stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
      </motion.g>
    </motion.svg>
  );
}

export default BlobShape;
