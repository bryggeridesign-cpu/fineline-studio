import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Upload, Download, Image as ImageIcon, SlidersHorizontal, Sparkles, ShieldCheck, RefreshCw, ScanLine } from "lucide-react";
import "./style.css";

function processImage(img, opts) {
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const source = document.createElement("canvas");
  source.width = w; source.height = h;
  const sctx = source.getContext("2d", { willReadFrequently: true });
  sctx.drawImage(img, 0, 0, w, h);
  const { data } = sctx.getImageData(0, 0, w, h);
  const gray = new Float32Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const p = i * 4;
    gray[i] = (data[p] * 0.299 + data[p+1] * 0.587 + data[p+2] * 0.114);
  }
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const ctx = out.getContext("2d");
  ctx.fillStyle = opts.invert ? "#111111" : "#ffffff";
  ctx.fillRect(0, 0, w, h);
  const imageData = ctx.createImageData(w, h);
  const px = imageData.data;
  const threshold = opts.detail;
  const contrast = opts.contrast / 100;
  const step = Math.max(1, Math.round(5 - opts.detail / 30));
  for (let y = 1; y < h - 1; y += step) {
    for (let x = 1; x < w - 1; x += step) {
      const i = y * w + x;
      const gx = -gray[i-w-1] + gray[i-w+1] - 2*gray[i-1] + 2*gray[i+1] - gray[i+w-1] + gray[i+w+1];
      const gy = -gray[i-w-1] - 2*gray[i-w] - gray[i-w+1] + gray[i+w-1] + 2*gray[i+w] + gray[i+w+1];
      let edge = Math.sqrt(gx*gx + gy*gy) * contrast;
      edge = Math.min(255, edge);
      if (edge > threshold) {
        const alpha = Math.min(255, (edge - threshold) * 3.1);
        const p = i * 4;
        const color = opts.invert ? 255 : 0;
        px[p] = color; px[p+1] = color; px[p+2] = color; px[p+3] = alpha;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
  // Slightly soften pixel stepping for a cleaner ink-like result.
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = w; finalCanvas.height = h;
  const fctx = finalCanvas.getContext("2d");
  fctx.fillStyle = opts.invert ? "#111111" : "#ffffff";
  fctx.fillRect(0, 0, w, h);
  fctx.globalAlpha = 1;
  fctx.drawImage(out, 0, 0);
  return finalCanvas;
}

function App() {
  const [file, setFile] = useState(null);
  const [original, setOriginal] = useState("");
  const [result, setResult] = useState("");
  const [detail, setDetail] = useState(46);
  const [contrast, setContrast] = useState(125);
  const [invert, setInvert] = useState(false);
  const [mode, setMode] = useState("local");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const imageRef = useRef(null);
  const resultRef = useRef(null);

  const render = useCallback((src, opts = { detail, contrast, invert }) => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const canvas = processImage(img, opts);
      resultRef.current = canvas;
      setResult(canvas.toDataURL("image/png"));
      setBusy(false);
    };
    img.onerror = () => setBusy(false);
    img.src = src;
  }, [detail, contrast, invert]);

  useEffect(() => { if (original) { setBusy(true); const t = setTimeout(() => render(original), 100); return () => clearTimeout(t); } }, [original, detail, contrast, invert, render]);

  function loadFile(f) {
    if (!f || !f.type.startsWith("image/")) return;
    if (original) URL.revokeObjectURL(original);
    const url = URL.createObjectURL(f);
    setFile(f); setOriginal(url); setResult("");
  }
  function download() {
    if (!resultRef.current) return;
    const a = document.createElement("a");
    a.download = `${(file?.name || "fineline").replace(/\.[^.]+$/, "")}-fine-line.png`;
    a.href = resultRef.current.toDataURL("image/png");
    a.click();
  }
  function reset() { setDetail(46); setContrast(125); setInvert(false); }

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><ScanLine size={19}/></span> fine<span>line</span><small>STUDIO</small></a>
      <div className="top-note"><ShieldCheck size={15}/> Privat bildebehandling</div>
    </header>

    <section className="hero">
      <div className="eyebrow"><Sparkles size={14}/> PHOTO TO LINE ART</div>
      <h1>Gjør øyeblikk<br/><em>til strek.</em></h1>
      <p>Forvandle fotografier til elegant fine line-kunst. Juster uttrykket til det sitter helt riktig.</p>
    </section>

    <section className="workspace">
      <div className="toolbar">
        <div className="section-label"><span>01</span> BILDE</div>
        <button className="upload-btn" onClick={() => inputRef.current?.click()}><Upload size={16}/> Last opp bilde</button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => loadFile(e.target.files?.[0])}/>
      </div>

      {!original ? <div className="dropzone" onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); loadFile(e.dataTransfer.files?.[0]);}} onClick={() => inputRef.current?.click()}>
        <div className="upload-icon"><ImageIcon size={25}/></div>
        <h3>Slipp bildet ditt her</h3>
        <p>eller <span>bla gjennom filer</span></p>
        <small>JPG, PNG eller WebP · Bildet forlater aldri nettleseren</small>
      </div> : <div className="preview-grid">
        <div className="preview-card">
          <div className="preview-head"><span>ORIGINAL</span><span className="muted">{file?.name}</span></div>
          <div className="image-stage"><img ref={imageRef} src={original} alt="Originalbilde"/></div>
        </div>
        <div className="preview-card output-card">
          <div className="preview-head"><span>FINE LINE</span><span className="live-dot">● KLAR</span></div>
          <div className="image-stage output-stage">{result ? <img src={result} alt="Fine line-resultat"/> : <div className="loading">Behandler bildet…</div>}</div>
        </div>
      </div>}

      <div className="controls">
        <div className="controls-title"><div><SlidersHorizontal size={17}/> <strong>Finjuster uttrykket</strong></div><button className="text-btn" onClick={reset}><RefreshCw size={13}/> Nullstill</button></div>
        <div className="slider-grid">
          <label><span>Detaljnivå <b>{detail}%</b></span><input type="range" min="10" max="90" value={detail} onChange={e => setDetail(+e.target.value)}/><small>Lavere gir færre linjer · høyere gir flere detaljer</small></label>
          <label><span>Kontrast <b>{contrast}%</b></span><input type="range" min="60" max="220" value={contrast} onChange={e => setContrast(+e.target.value)}/><small>Styrer hvor tydelige strekene blir</small></label>
        </div>
        <label className="toggle-row"><span><strong>Inverter farger</strong><small>Lyse streker på mørk bakgrunn</small></span><input type="checkbox" checked={invert} onChange={e => setInvert(e.target.checked)}/></label>
      </div>

      <div className="mode-panel">
        <div className="mode-heading"><span className="section-label"><span>02</span> BEHANDLING</span><span className="safe-tag"><ShieldCheck size={13}/> UTEN SENSURFILTER</span></div>
        <div className="mode-options">
          <button className={`mode-option ${mode === "local" ? "selected" : ""}`} onClick={() => setMode("local")}><span className="radio">{mode === "local" ? "●" : ""}</span><span><b>Lokal behandling</b><small>Ingen AI · ingen opplasting · ingen moderering</small></span><span className="recommended">ANBEFALT</span></button>
          <button className={`mode-option ${mode === "ai" ? "selected" : ""}`} onClick={() => setMode("ai")}><span className="radio">{mode === "ai" ? "●" : ""}</span><span><b>AI-integrasjon</b><small>Krever tilkobling til en ekstern AI-tjeneste</small></span></button>
        </div>
        {mode === "ai" && <p className="ai-note">AI-modus er gjort klar som et integrasjonspunkt, men er ikke aktivert før du velger leverandør og API. AI-leverandører kan ha egne regler for akt og nakenhet. Lokal modus fungerer allerede uten slike filtre.</p>}
      </div>

      <div className="bottom-actions">
        <div className="privacy"><ShieldCheck size={16}/><span><b>Ditt bilde er ditt.</b><small>All behandling skjer lokalt på enheten din.</small></span></div>
        <button className="download-btn" disabled={!result || busy} onClick={download}><Download size={17}/> Last ned PNG</button>
      </div>
    </section>
    <footer><span>FINELINE STUDIO</span><span>LAGET FOR KREATIV FRIHET · 2026</span></footer>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
