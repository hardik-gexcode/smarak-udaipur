import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { siteById } from '../data/sites';
import { buildModel, loadGlbModel } from '../ar/models';
import { ask } from '../lib/guide';
import { useApp } from '../lib/app';
import { pref } from '../lib/maps';
import { greeting } from '../lib/time';
import { canListen, listen, speakSeq, splitSentences, stopSpeech } from '../lib/voice';
import { Icon, LangToggle } from '../ui';

type Chapter = 'story' | 'legacy' | 'tip';
type Mode = '3d' | 'ar';
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export default function ARView({ id }: { id: string }) {
  const { t, lang, back, traveller, passport } = useApp();
  const site = siteById(id);
  const askFirst = useRef(pref.get('arask', '') === '1').current;
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const modeRef = useRef<Mode>(askFirst ? '3d' : 'ar');
  const stereoRef = useRef(false);
  const recenterRef = useRef<() => void>(() => {});
  const enableMotionRef = useRef<() => void>(() => {});

  const [mode, setModeState] = useState<Mode>(modeRef.current);
  const [stereo, setStereo] = useState(false);
  const [camOk, setCamOk] = useState<boolean | null>(null);
  const [glError, setGlError] = useState(false);
  const [needMotion, setNeedMotion] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<'gemini' | 'offline' | 'unconfigured' | 'unavailable' | null>(null);
  const [listening, setListening] = useState(false);

  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); };
  useEffect(() => { stereoRef.current = stereo; }, [stereo]);

  const say = (text: string, l = lang) => {
    const s = splitSentences(text);
    setLines(s); setActive(0); setSpeaking(true);
    speakSeq(s, l, setActive, () => { setSpeaking(false); setActive(-1); });
  };
  const stop = () => { stopSpeech(); setSpeaking(false); setActive(-1); };

  // Opening line: greeting in the visitor's own time zone + what this place is.
  useEffect(() => {
    stop(); setSource(null);
    const first = (traveller?.name || passport.name || '').split(' ')[0];
    setLines([`${greeting(lang).text}${first ? `, ${first}` : ''}! ${t('hello')} ${site.name[lang]}. ${site.built[lang]}.`]);
    if (askFirst) setTimeout(() => input.current?.focus(), 300);
  }, [lang]);

  // Live camera, only while AR mode is on. If it fails we drop to 3D mode automatically.
  useEffect(() => {
    if (mode !== 'ar') return;
    let stream: MediaStream | undefined;
    let dead = false;
    if (!navigator.mediaDevices?.getUserMedia) { setCamOk(false); setMode('3d'); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => {
        if (dead) return s.getTracks().forEach((x) => x.stop());
        stream = s;
        if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); }
        setCamOk(true);
      })
      .catch(() => { if (!dead) { setCamOk(false); setMode('3d'); } });
    return () => { dead = true; stream?.getTracks().forEach((x) => x.stop()); };
  }, [mode]);

  // Three.js scene
  useEffect(() => {
    const el = host.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch { setGlError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x886644, 1.7));
    const sun = new THREE.DirectionalLight(0xffe2b8, 2.2);
    sun.position.set(5, 8, 4);
    scene.add(sun);

    const pivot = new THREE.Group();
    pivot.add(buildModel(site.id, site.kind));
    pivot.rotation.x = 0.18;
    scene.add(pivot);
    let alive = true;
    // A scanned model at public/models/<site-id>.glb replaces the hand-built one automatically.
    loadGlbModel(site.id).then((m) => { if (m && alive) { pivot.clear(); pivot.add(m); } });

    let userScale = 1, lastTouch = 0, w = 1, h = 1;
    const place = () => {
      const hfov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(30)) * Math.min(1.4, w / h));
      pivot.position.set(0, -0.3, -Math.max(8, 4.6 / Math.tan(hfov / 2)));
    };
    const ro = new ResizeObserver(() => {
      w = el.clientWidth || 1; h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
      place();
    });
    ro.observe(el);

    const ptrs = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const down = (e: PointerEvent) => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); lastTouch = performance.now(); };
    const move = (e: PointerEvent) => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      lastTouch = performance.now();
      if (ptrs.size === 1) {
        pivot.rotation.y += (e.clientX - p.x) * 0.012;
        pivot.rotation.x = clamp(pivot.rotation.x + (e.clientY - p.y) * 0.006, -0.4, 0.7);
      }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) userScale = clamp(userScale * (d / pinch), 0.5, 2.6);
        pinch = d;
      }
    };
    const up = (e: PointerEvent) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = 0; };
    const wheel = (e: WheelEvent) => { userScale = clamp(userScale * (1 - e.deltaY * 0.001), 0.5, 2.6); };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: true });

    // Gyroscope steers the camera in AR mode only; 3D mode keeps the model centred.
    const e3 = new THREE.Euler(), qq = new THREE.Quaternion(), q0 = new THREE.Quaternion();
    const qFix = new THREE.Quaternion(-Math.SQRT1_2, 0, 0, Math.SQRT1_2);
    const zee = new THREE.Vector3(0, 0, 1);
    let a0: number | null = null, gyro = false;
    recenterRef.current = () => { a0 = null; };
    const onOri = (ev: DeviceOrientationEvent) => {
      if (modeRef.current !== 'ar' || ev.alpha == null || ev.beta == null || ev.gamma == null) return;
      gyro = true;
      if (a0 === null) a0 = ev.alpha;
      const orient = THREE.MathUtils.degToRad(screen.orientation?.angle ?? 0);
      e3.set(THREE.MathUtils.degToRad(ev.beta), THREE.MathUtils.degToRad(ev.alpha - a0), -THREE.MathUtils.degToRad(ev.gamma), 'YXZ');
      qq.setFromEuler(e3).multiply(qFix).multiply(q0.setFromAxisAngle(zee, -orient));
      cam.quaternion.copy(qq);
    };
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE.requestPermission === 'function') setNeedMotion(true);
    else window.addEventListener('deviceorientation', onOri);
    enableMotionRef.current = async () => {
      try { if ((await DOE.requestPermission!()) === 'granted') window.addEventListener('deviceorientation', onOri); } catch { /* denied */ }
      setNeedMotion(false);
    };

    let raf = 0;
    const size = new THREE.Vector2();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const vr = stereoRef.current;
      const ar = modeRef.current === 'ar';
      if (!ar || !gyro) { if (!ar) cam.quaternion.identity(); if (performance.now() - lastTouch > 2500) pivot.rotation.y += 0.004; }
      pivot.scale.setScalar(userScale * (vr ? 0.7 : 1));
      renderer.getSize(size);
      if (vr) {
        const half = size.x / 2;
        renderer.setScissorTest(true);
        [-0.07, 0.07].forEach((off, i) => {
          renderer.setViewport(i * half, 0, half, size.y);
          renderer.setScissor(i * half, 0, half, size.y);
          cam.aspect = half / size.y; cam.updateProjectionMatrix();
          cam.translateX(off); renderer.render(scene, cam); cam.translateX(-off);
        });
        renderer.setScissorTest(false);
      } else {
        renderer.setViewport(0, 0, size.x, size.y);
        cam.aspect = size.x / size.y; cam.updateProjectionMatrix();
        renderer.render(scene, cam);
      }
    };
    loop();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      window.removeEventListener('deviceorientation', onOri);
      renderer.dispose();
      renderer.domElement.remove();
      stopSpeech();
    };
  }, [site.id]);

  const chapter = (c: Chapter) => { setSource(null); say(site[c][lang]); };

  const submit = async (text = q) => {
    if (!text.trim() || busy) return;
    setBusy(true); setSource(null); stop();
    const r = await ask(site, text, lang);
    setBusy(false); setSource(r.source); setQ('');
    say(r.text, /[\u0900-\u097F]/.test(text) ? 'hi' : lang);
  };
  const mic = () => { setListening(true); listen(lang, (txt) => { setQ(txt); submit(txt); }, () => setListening(false)); };

  const showVideo = mode === 'ar' && camOk === true && !stereo;
  const suggestions: [string, string][] = [[t('qWho'), 'q1'], [t('qBest'), 'q2'], [t('qSpecial'), 'q3'], [t('qCraft'), 'q4']];

  return (
    <div className={`ar ${stereo ? 'stereo' : ''}`}>
      <video ref={video} playsInline muted autoPlay style={{ display: showVideo ? 'block' : 'none' }} />
      <div ref={host} style={{ position: 'absolute', inset: 0 }} />
      <div className="divider" />

      <div className="bar">
        <button className="btn-round" aria-label="Back" onClick={back}><Icon n="back" /></button>
        <div className="seg">
          <button className={mode === '3d' ? 'on' : ''} onClick={() => setMode('3d')}>{t('mode3d')}</button>
          <button className={mode === 'ar' ? 'on' : ''} onClick={() => setMode('ar')}>{t('modeAr')}</button>
        </div>
        <span style={{ flex: 1 }} />
        <LangToggle />
        <button className={`btn-round ${stereo ? 'dark' : ''}`} aria-label="VR" onClick={() => setStereo(!stereo)}><Icon n="vr" /></button>
      </div>

      <div className="hint">
        {glError ? t('glFail') : mode === 'ar' && camOk === false ? t('noCam') : '↔ drag · pinch to zoom'}
        {mode === 'ar' && needMotion && <div><button className="btn-dark sm" style={{ marginTop: 10 }} onClick={() => enableMotionRef.current()}>{t('enableMotion')}</button></div>}
        {mode === 'ar' && !needMotion && camOk && <div><button className="pill" style={{ height: 38, marginTop: 8, fontSize: 14 }} onClick={() => recenterRef.current()}><Icon n="target" size={18} />{t('recenter')}</button></div>}
      </div>

      <div className="sheet">
        <h3 style={{ fontSize: 20, fontWeight: 600 }}>{site.name[lang]} {speaking && <span className="wave"><i /><i /><i /><i /></span>}</h3>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {(['story', 'legacy', 'tip'] as const).map((c) => (
            <button key={c} className="pill" style={{ height: 42, flex: 'none' }} onClick={() => chapter(c)}>{t(c === 'story' ? 'history' : c)}</button>
          ))}
          {suggestions.map(([label, k]) => (
            <button key={k} className="chip gray" style={{ flex: 'none', height: 42, padding: '0 16px', fontSize: 15 }} onClick={() => submit(label)}>{label}</button>
          ))}
        </div>
        <div className="cap caption" data-testid="caption">
          {busy ? t('thinking') : lines.map((s, i) => (
            <span key={i} style={active === i ? { background: '#ffd9c4', borderRadius: 6, padding: '1px 3px' } : undefined}>{s} </span>
          ))}
          {source && !busy && <div className="src">{source === 'gemini' ? t('geminiNote') : source === 'unconfigured' ? t('aiNeedsConfig') : source === 'unavailable' ? t('aiUnavailable') : t('offlineNote')}</div>}
        </div>
        <form style={{ display: 'flex', gap: 10, alignItems: 'center' }} onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input ref={input} className="input" value={q} placeholder={t('askPh')} onChange={(e) => setQ(e.target.value)} />
          {!speaking && lines.length > 0 && <button type="button" className="btn-round" aria-label="Listen" onClick={() => say(lines.join(' '))}><Icon n="speaker" /></button>}
          {canListen && <button type="button" className={`btn-round ${listening ? 'dark' : ''}`} aria-label="Speak" onClick={mic}><Icon n="mic" /></button>}
          {speaking
            ? <button type="button" className="btn-round dark" aria-label="Stop" onClick={stop}><Icon n="stop" /></button>
            : <button type="submit" className="btn-round dark" aria-label="Send"><Icon n="send" /></button>}
        </form>
      </div>
    </div>
  );
}
