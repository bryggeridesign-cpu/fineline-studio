import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {Upload, Download, SlidersHorizontal, ShieldCheck, RotateCcw, ZoomIn, ZoomOut, Maximize2, ScanLine, Image as ImageIcon, ChevronDown, WandSparkles, Layers, Sun, Contrast, CircleHelp} from "lucide-react";
import "./style.css";

const PRESETS = {
  fine: {label:"Fine line", threshold:22, strength:125, detail:75, smooth:1, edge:"sobel", paper:"#ffffff", ink:"#171717", hatch:0},
  contour: {label:"Kontur", threshold:34, strength:145, detail:58, smooth:1, edge:"sobel", paper:"#ffffff", ink:"#111111", hatch:0},
  tattoo: {label:"Tattoo stencil", threshold:28, strength:175, detail:83, smooth:0, edge:"canny", paper:"#ffffff", ink:"#080808", hatch:0},
  engraving: {label:"Gravering", threshold:15, strength:110, detail:72, smooth:1, edge:"engrave", paper:"#f6f0e5", ink:"#332b24", hatch:42},
  minimal: {label:"Minimalistisk", threshold:46, strength:160, detail:38, smooth:2, edge:"sobel", paper:"#fffefa", ink:"#242424", hatch:0}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function blurGray(src,w,h,r){
  if(!r)return src;
  const weights=r===1?[1,2,1]:[1,4,6,4,1], rad=weights.length>>1, sum=weights.reduce((a,b)=>a+b,0);
  const tmp=new Float32Array(w*h), out=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=0;for(let k=-rad;k<=rad;k++)n+=src[y*w+clamp(x+k,0,w-1)]*weights[k+rad];tmp[y*w+x]=n/sum;}
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=0;for(let k=-rad;k<=rad;k++)n+=tmp[clamp(y+k,0,h-1)*w+x]*weights[k+rad];out[y*w+x]=n/sum;}
  return out;
}
function renderArt(img,s){
  const w=img.naturalWidth,h=img.naturalHeight;
  const input=document.createElement("canvas");input.width=w;input.height=h;
  const ictx=input.getContext("2d",{willReadFrequently:true});ictx.drawImage(img,0,0);
  const raw=ictx.getImageData(0,0,w,h).data, gray=new Float32Array(w*h);
  for(let i=0;i<gray.length;i++){const p=i*4;gray[i]=raw[p]*.299+raw[p+1]*.587+raw[p+2]*.114;}
  const g=blurGray(gray,w,h,s.smooth), out=document.createElement("canvas");out.width=w;out.height=h;
  const ctx=out.getContext("2d");ctx.fillStyle=s.paper;ctx.fillRect(0,0,w,h);
  const layer=document.createElement("canvas");layer.width=w;layer.height=h;
  const lctx=layer.getContext("2d"), id=lctx.createImageData(w,h), px=id.data;
  const threshold=s.threshold, gain=s.strength/42, detail=s.detail/100;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x;
    const gx=-g[i-w-1]+g[i-w+1]-2*g[i-1]+2*g[i+1]-g[i+w-1]+g[i+w+1];
    const gy=-g[i-w-1]-2*g[i-w]-g[i-w+1]+g[i+w-1]+2*g[i+w]+g[i+w+1];
    const mag=Math.sqrt(gx*gx+gy*gy)/4;
    let score=mag;
    if(s.edge==="canny"){
      const local=(g[i-1]+g[i+1]+g[i-w]+g[i+w])/4;
      score=mag*.82+Math.abs(g[i]-local)*.45;
    } else if(s.edge==="engrave"){
      const local=(g[i-1]+g[i+1]+g[i-w]+g[i+w])/4;
      score=mag*.6+Math.abs(g[i]-local)*.7;
    }
    const adjusted=threshold*(1.3-detail*.55);
    if(score>adjusted){
      let alpha=clamp((score-adjusted)*gain,0,255);
      if(s.edge==="engrave")alpha*=.78;
      const p=i*4;px[p]=s.invert?255:parseInt(s.ink.slice(1,3),16);px[p+1]=s.invert?255:parseInt(s.ink.slice(3,5),16);px[p+2]=s.invert?255:parseInt(s.ink.slice(5,7),16);px[p+3]=alpha;
    }
  }
  lctx.putImageData(id,0,0);ctx.drawImage(layer,0,0);
  if(s.hatch>0){
    ctx.save();ctx.globalAlpha=s.hatch/180;ctx.strokeStyle=s.invert?"#ffffff":s.ink;ctx.lineWidth=Math.max(1,w/1300);
    const spacing=Math.max(8,Math.round(26-detail*12));
    for(let y=0;y<h;y+=spacing){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(Math.min(w,y+spacing*3),Math.min(h,y+spacing*3));ctx.stroke();}
    ctx.restore();
  }
  if(s.invert){
    const final=document.createElement("canvas");final.width=w;final.height=h;const f=final.getContext("2d");
    f.fillStyle="#171717";f.fillRect(0,0,w,h);f.drawImage(out,0,0);return final;
  }
  return out;
}
function App(){
  const [file,setFile]=useState(null),[url,setUrl]=useState(""),[result,setResult]=useState("");
  const [preset,setPreset]=useState("fine"),[s,setS]=useState(PRESETS.fine);
  const [view,setView]=useState("split"),[zoom,setZoom]=useState(100),[busy,setBusy]=useState(false);
  const input=useRef(null),canvas=useRef(null),objectUrl=useRef("");
  const update=(k,v)=>setS(old=>({...old,[k]:v}));
  const process=useCallback((src,settings)=>{
    if(!src)return;const im=new Image();
    im.onload=()=>{const c=renderArt(im,settings);canvas.current=c;setResult(c.toDataURL("image/png"));setBusy(false);};
    im.onerror=()=>setBusy(false);im.src=src;
  },[]);
  useEffect(()=>{if(!url)return;setBusy(true);const t=setTimeout(()=>process(url,s),100);return()=>clearTimeout(t);},[url,s,process]);
  function load(f){if(!f||!["image/png","image/jpeg","image/webp"].includes(f.type))return;if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);const u=URL.createObjectURL(f);objectUrl.current=u;setFile(f);setUrl(u);setZoom(100);}
  function choosePreset(key){setPreset(key);setS({...PRESETS[key]});}
  function exportPng(){if(!canvas.current)return;const a=document.createElement("a");a.download=`${(file?.name||"fineline").replace(/\.[^.]+$/,"")}-${preset}.png`;a.href=canvas.current.toDataURL("image/png");a.click();}
  const shown=(view==="split"?["original","art"]:[view]);
  const slider=(key,label,min,max,step=1)=> <label className="control"><span>{label}<b>{s[key]}{key==="strength"?"%":""}</b></span><input type="range" min={min} max={max} step={step} value={s[key]} onChange={e=>update(key,+e.target.value)}/></label>;
  return <div className="app">
    <aside className="sidebar">
      <div className="logo"><span className="logoicon"><ScanLine size={20}/></span><span>FineLine<small>STUDIO PRO</small></span></div>
      <div className="side-label">ARBEIDSFLYT</div>
      <button className="side-active"><ImageIcon size={17}/> Bildeverksted</button>
      <div className="side-label">VERKTØY</div>
      <div className="side-tip"><ShieldCheck size={16}/><div><b>Privat behandling</b><small>Bildene behandles lokalt på enheten din. Ingen AI-moderering.</small></div></div>
      <div className="side-bottom">VERSJON 2.0 · NETLIFY READY</div>
    </aside>
    <main className="main">
      <header className="top"><div><span className="crumb">BILDEVERKSTED</span><span className="slash">/</span><b>{file?file.name:"Nytt prosjekt"}</b></div><div className="top-right"><span className="status"><i/> LOKAL MODUS</span><button className="export" disabled={!result||busy} onClick={exportPng}><Download size={16}/> Eksporter PNG</button></div></header>
      <div className="content">
        <div className="intro"><div><div className="kicker">FRA FOTO TIL KUNST</div><h1>Fine line, <em>din stil.</em></h1><p>Et presist arbeidsrom for konturer, tattoo-stensiler og minimalistisk strekillustrasjon.</p></div><div className="intro-mark"><ScanLine size={42}/></div></div>
        {!url?<div className="upload" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();load(e.dataTransfer.files?.[0]);}} onClick={()=>input.current?.click()}><input ref={input} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={e=>load(e.target.files?.[0])}/><div className="upload-symbol"><Upload size={24}/></div><h2>Slipp bildet ditt her</h2><p>eller <u>velg en fil fra enheten</u></p><small>JPG · PNG · WEBP · Behandles lokalt i nettleseren</small></div>:
        <section className="editor">
          <div className="editorbar"><div className="filemeta"><span className="fileicon"><ImageIcon size={15}/></span><div><b>{file?.name}</b><small>{Math.round(file.size/1024)} KB · Original beholdes</small></div></div><div className="editor-actions"><button onClick={()=>input.current?.click()}><Upload size={14}/> Bytt bilde</button><button onClick={()=>{setUrl("");setFile(null);setResult("");}}><RotateCcw size={14}/> Nytt prosjekt</button></div><input ref={input} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={e=>load(e.target.files?.[0])}/></div>
          <div className="canvasbar"><div className="tabs"><button className={view==="split"?"on":""} onClick={()=>setView("split")}>Før / etter</button><button className={view==="original"?"on":""} onClick={()=>setView("original")}>Original</button><button className={view==="art"?"on":""} onClick={()=>setView("art")}>Kunstverk</button></div><div className="zoom"><button onClick={()=>setZoom(z=>Math.max(50,z-10))}><ZoomOut size={14}/></button><span>{zoom}%</span><button onClick={()=>setZoom(z=>Math.min(200,z+10))}><ZoomIn size={14}/></button><button onClick={()=>setZoom(100)}><Maximize2 size={14}/></button></div></div>
          <div className={`canvasarea ${view!=="split"?"one":""}`}>
            {shown.includes("original")&&<div className="canvaspanel"><div className="paneltitle">ORIGINAL <span>INNGANG</span></div><div className="artboard"><img src={url} alt="Original" style={{transform:`scale(${zoom/100})`}}/></div></div>}
            {shown.includes("art")&&<div className="canvaspanel"><div className="paneltitle">FINE LINE <span>{busy?"OPPDATERER…":"LIVE FORHÅNDSVISNING"}</span></div><div className="artboard paper">{result&&<img src={result} alt="Fine line kunst" style={{transform:`scale(${zoom/100})`}}/>}</div></div>}
          </div>
        </section>}
        <section className="panel">
          <div className="panel-heading"><div><Layers size={17}/><b>Stilbibliotek</b></div><span>VELG UTGANGSPUNKT</span></div>
          <div className="presets">{Object.entries(PRESETS).map(([key,p])=><button key={key} className={preset===key?"selected":""} onClick={()=>choosePreset(key)}><span className={`sample ${key}`}></span><b>{p.label}</b><small>{key==="fine"?"Myke, presise linjer":key==="contour"?"Rene ytterkonturer":key==="tattoo"?"Markert stencil-look":key==="engraving"?"Klassisk skravur":"Færre, rene detaljer"}</small></button>)}</div>
        </section>
        <section className="panel controls-panel">
          <div className="panel-heading"><div><SlidersHorizontal size={17}/><b>Detaljkontroll</b></div><button className="reset" onClick={()=>choosePreset(preset)}><RotateCcw size={13}/> Tilbakestill stil</button></div>
          <div className="controlgrid">
            {slider("strength","Linjestyrke",20,220)}
            {slider("threshold","Linjeterskel",2,70)}
            {slider("detail","Detaljfangst",10,100)}
            {slider("smooth","Støyreduksjon",0,2)}
          </div>
          <div className="selectrow"><label>Linjemetode<select value={s.edge} onChange={e=>update("edge",e.target.value)}><option value="sobel">Myk kontur (Sobel)</option><option value="canny">Skarp kontur</option><option value="engrave">Graveringsdetaljer</option></select></label><label>Strekfarge<input type="color" value={s.ink} onChange={e=>update("ink",e.target.value)}/></label><label>Papirfarge<input type="color" value={s.paper} onChange={e=>update("paper",e.target.value)}/></label><label className="invert"><input type="checkbox" checked={s.invert} onChange={e=>update("invert",e.target.checked)}/> Inverter til mørk bakgrunn</label></div>
          {s.edge==="engrave"&&slider("hatch","Skravur",0,100)}
        </section>
        <div className="footnote"><ShieldCheck size={16}/><span><b>Bildene dine forlater aldri nettleseren.</b> Ingen ekstern AI, opplasting eller automatisk moderering.</span><span className="both">BRUKSOMRÅDE: BOTH</span></div>
      </div>
    </main>
  </div>
}
createRoot(document.getElementById("root")).render(<App/>);
