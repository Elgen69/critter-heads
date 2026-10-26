// <CritterHead /> for React 18+. Plain JS (no JSX), so it ships without a build step.

import { createElement, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { createCritter } from "./index.js";

export * from "./index.js";

/**
 * <CritterHead character="fox" expression="thinking" size={160} />
 *
 * interactive (default true): the eyes and head follow a nearby pointer, and a click
 * makes it hop with a spin and a happy face.
 */
export const CritterHead = forwardRef(function CritterHead(props, ref) {
  const {
    character = "fox",
    expression = "idle",
    view = "bust",
    size = 160,
    palette,
    speed = 1,
    paused = false,
    interactive = true,
    accessory = true,
    prop,
    shadow = true,
    floorShadow,
    seed = 0.42,
    transitionMs = 300,
    lookAt,
    amplitude,
    startMs,
    onClick,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef(null);
  const apiRef = useRef(null);
  const showShadow = floorShadow !== undefined ? floorShadow : shadow;
  const paletteKey = JSON.stringify(palette || {});

  // mount once; later prop changes go through update() so the animation never restarts
  useEffect(() => {
    const api = createCritter(hostRef.current, {
      character, view, size, palette, speed, paused, accessory, prop, seed, transitionMs, expression,
      shadow: showShadow,
      startMs,
      ariaLabel: rest["aria-label"],
    });
    apiRef.current = api;
    return () => {
      api.destroy();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apiRef.current?.update({ character, view, size, palette: palette || {}, speed, paused, accessory, prop: prop || null, seed, transitionMs, shadow: showShadow });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, view, size, paletteKey, speed, paused, accessory, prop, seed, transitionMs, showShadow]);

  useEffect(() => {
    const api = apiRef.current;
    if (api && api.expression !== expression) api.setExpression(expression);
  }, [expression]);

  useEffect(() => {
    if (amplitude !== undefined) apiRef.current?.setAmplitude(amplitude);
  }, [amplitude]);

  // controlled gaze
  useEffect(() => {
    if (lookAt) apiRef.current?.lookAt(lookAt.x, lookAt.y);
  }, [lookAt?.x, lookAt?.y]); // eslint-disable-line react-hooks/exhaustive-deps

  // pointer following: only when interactive and the gaze isn't controlled
  useEffect(() => {
    if (!interactive || lookAt || typeof window === "undefined") return undefined;
    const onMove = (e) => {
      const el = hostRef.current;
      const api = apiRef.current;
      if (!el || !api) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * (view === "full" ? 0.3 : 0.45);
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const reach = Math.max(r.width, r.height) * 3;
      if (Math.hypot(dx, dy) > reach) api.lookAt(0, 0, { smooth: true });
      else api.lookAt(dx / (r.width * 0.9), dy / (r.height * 0.9), { smooth: true });
    };
    const onLeave = () => apiRef.current?.lookAt(0, 0, { smooth: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [interactive, lookAt, view]);

  useImperativeHandle(ref, () => ({
    get element() {
      return hostRef.current;
    },
    seek: (ms) => apiRef.current?.seek(ms),
    setExpression: (e, o) => apiRef.current?.setExpression(e, o),
    react: (d) => apiRef.current?.react(d),
    lookAt: (x, y, o) => apiRef.current?.lookAt(x, y, o),
    setAmplitude: (a) => apiRef.current?.setAmplitude(a),
    toSVG: (ms) => apiRef.current?.toSVG(ms) ?? "",
  }), []);

  const handleClick = (e) => {
    if (interactive) apiRef.current?.react();
    if (onClick) onClick(e);
  };

  return createElement("span", {
    ...rest,
    ref: hostRef,
    className,
    onClick: handleClick,
    style: {
      display: "inline-block",
      position: "relative",
      width: size,
      height: view === "full" ? Math.round(size * 1.25) : size,
      lineHeight: 0,
      cursor: interactive ? "pointer" : undefined,
      ...style,
    },
  });
});

export default CritterHead;
