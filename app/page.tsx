"use client";

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { Activity, Download, FileChartColumnIncreasing, FileSpreadsheet, Info, LoaderCircle, RefreshCw, ShieldCheck, Upload, X } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { analyzeRows, parseAndAnalyzeCSV, SAMPLE_CSV, QuantInputError } from "@/lib/quant-engine";
import type { QuantAnalysis } from "@/types/quant";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function pct(value: number | null, digits = 2): string { return value === null ? "—" : `${(value * 100).toFixed(digits)}%`; }
function ratio(value: number | null): string { return value === null || !Number.isFinite(value) ? "—" : value.toFixed(2); }
function fullDate(date: string): string { return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}); }
function shortDate(date: string): string { return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-US",{month:"short",day:"2-digit",timeZone:"UTC"}); }
function heatColor(value: number): string { const s=Math.min(Math.abs(value)/.08,1); return value>=0?`rgba(137,218,84,${.12+s*.72})`:`rgba(248,99,117,${.12+s*.68})`; }

const METRIC_HELP: Record<string,string> = {
  "CAGR":"Annualized compound growth between the first and last strategy observations. Short samples can make this estimate unstable.",
  "Sharpe ratio":"Annualized mean daily excess return divided by sample daily volatility, using the selected annual risk-free rate.",
  "Sortino ratio":"Annualized mean daily excess return divided by downside deviation relative to the daily risk-free hurdle.",
  "Max drawdown":"Largest percentage decline from a historical equity high to a later trough.",
  "Annualized volatility":"Sample standard deviation of daily returns multiplied by the square root of 252 trading days.",
  "Historical VaR (95%)":"Empirical 5th percentile loss threshold of observed daily returns, shown as a non-negative percentage."
};
function MetricCard({label,value,foot,tone,help}:{label:string;value:string;foot:string;tone?:string;help:string}) {
  return <div className="metric-card"><div className="metric-label"><span>{label}</span><span className="info" title={help} aria-label={help}>i</span></div><div className={`metric-value ${tone??""}`}>{value}</div><div className="metric-foot"><span>{foot}</span><span style={{color:"var(--accent)"}}>●</span></div></div>;
}
function CustomTooltip({active,payload,label}:{active?:boolean;payload?:Array<{value:number;name:string;color?:string}>;label?:string}) {
  if(!active||!payload?.length)return null;
  return <div style={{background:"#111a28",border:"1px solid #2c394c",padding:"10px 12px",borderRadius:8,fontSize:11}}><div style={{color:"#91a0b5",marginBottom:6}}>{label}</div>{payload.map(item=><div key={item.name} style={{color:item.color??"#edf3fb",marginTop:3}}>{item.name}: {pct(item.value)}</div>)}</div>;
}

export default function HomePage() {
  const [analysis,setAnalysis]=useState<QuantAnalysis|null>(null);
  const [fileName,setFileName]=useState("Sample strategy");
  const [riskFreeInput,setRiskFreeInput]=useState("2");
  const [error,setError]=useState("");
  const [isPdfLoading,setIsPdfLoading]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);
  const reportRef=useRef<HTMLDivElement>(null);
  const riskFreeRate=Number(riskFreeInput)/100;
  const canRecalculate=Number.isFinite(riskFreeRate)&&riskFreeRate>=0&&riskFreeRate<1;

  const loadContent=useCallback((content:string,name:string)=>{
    try {
      if(!canRecalculate)throw new QuantInputError("Risk-free rate must be between 0 and 100.");
      setAnalysis(parseAndAnalyzeCSV(content,riskFreeRate));setFileName(name);setError("");
    } catch(caught) { setError(caught instanceof Error?caught.message:"Unable to analyze this CSV."); }
  },[canRecalculate,riskFreeRate]);
  const loadSample=useCallback(()=>loadContent(SAMPLE_CSV,"sample-strategy.csv"),[loadContent]);
  const onFile=useCallback((file?:File)=>{
    if(!file)return;
    if(!file.name.toLowerCase().endsWith(".csv")){setError("Please choose a .csv file.");return;}
    if(file.size>10*1024*1024){setError("CSV must be smaller than 10 MB.");return;}
    const reader=new FileReader();
    reader.onload=()=>{if(typeof reader.result==="string")loadContent(reader.result,file.name);else setError("Could not read this file as text.");};
    reader.onerror=()=>setError("The file could not be read. Try another CSV.");reader.readAsText(file);
  },[loadContent]);
  const onInputChange=(event:ChangeEvent<HTMLInputElement>)=>onFile(event.target.files?.[0]);
  const onDrop=(event:DragEvent<HTMLDivElement>)=>{event.preventDefault();onFile(event.dataTransfer.files?.[0]);};

  const recomputeRiskFree=()=>{
    if(!analysis)return;
    if(!canRecalculate){setError("Risk-free rate must be between 0 and 100.");return;}
    try{
      const raw=analysis.source==="prices"
        ?[{date:analysis.rows[0].date,value:1},...analysis.rows.map(row=>({date:row.date,value:row.equity}))]
        :analysis.rows.map(row=>({date:row.date,value:row.returnDecimal}));
      setAnalysis(analyzeRows(raw,analysis.source,riskFreeRate,analysis.warnings));setError("");
    }catch(caught){setError(caught instanceof Error?caught.message:"Could not recalculate metrics.");}
  };
  const chartRows=useMemo(()=>analysis?.rows.map(row=>({date:row.date,label:shortDate(row.date),equity:row.equity,drawdown:row.drawdown}))??[],[analysis]);
  const metrics=analysis?.metrics;
  const years=useMemo(()=>Array.from(new Set(metrics?.monthlyReturns.map(item=>item.year)??[])).sort((a,b)=>a-b),[metrics]);
  const monthlyLookup=useMemo(()=>{const map=new Map<string,number>();for(const item of metrics?.monthlyReturns??[])map.set(`${item.year}-${item.month}`,item.returnDecimal);return map;},[metrics]);

  const downloadPDF=async()=>{
    if(!analysis||!reportRef.current)return;
    setIsPdfLoading(true);setError("");
    try{
      const [{default:jsPDF},canvasModule]=await Promise.all([import("jspdf"),import("html2canvas")]);
      const canvas=await canvasModule.default(reportRef.current,{scale:2,backgroundColor:"#0e1420",useCORS:true,logging:false});
      const pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4",compress:true});
      const pageWidth=pdf.internal.pageSize.getWidth(),pageHeight=pdf.internal.pageSize.getHeight();
      const scale=Math.min(pageWidth/canvas.width,pageHeight/canvas.height),width=canvas.width*scale,height=canvas.height*scale;
      pdf.addImage(canvas.toDataURL("image/png"),"PNG",(pageWidth-width)/2,(pageHeight-height)/2,width,height,undefined,"FAST");
      pdf.save(`QuantTearSheet-${metrics!.startDate}-${metrics!.endDate}.pdf`);
    }catch(caught){setError(caught instanceof Error?`PDF export failed: ${caught.message}`:"PDF export failed.");}
    finally{setIsPdfLoading(false);}
  };

  return <main className="shell">
    <SiteNav />
    <section className="hero"><div><div className="eyebrow"><span className="dot"/> Quant research toolkit <span style={{color:"#44536a"}}>/</span> 01 — Performance</div><h1>Know your strategy.<br/><span style={{color:"var(--accent)"}}>Beyond the returns.</span></h1><p>Turn a backtest CSV into a clear performance and risk report. Inspect your equity curve, understand drawdowns, and export a one-page tear sheet — without connecting a brokerage account.</p></div><div className="actions"><button className="btn btn-quiet" onClick={loadSample}><Activity size={15}/> Load sample</button><button className="btn btn-primary" onClick={()=>inputRef.current?.click()}><Upload size={15}/> Analyze CSV</button></div></section>
    <div className="status-line" style={{marginBottom:17}}><span className="dot"/><strong>{analysis?"Analysis ready":"Ready for your data"}</strong><span style={{color:"#536176"}}>•</span><span>{analysis?fileName:"CSV · Date + Return or Price"}</span><span style={{marginLeft:"auto"}} className="pill"><ShieldCheck size={12}/> No account connection</span></div>
    <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onInputChange} hidden/>
    {!analysis?<section className="empty-state"><div className="drop-icon"><FileSpreadsheet size={21}/></div><div className="eyebrow" style={{justifyContent:"center"}}>Start with historical data</div><h2>Your strategy, in a single report.</h2><p>Upload daily returns or a closing-price series to calculate performance, risk-adjusted returns, historical drawdown, and monthly results. Or load the sample to explore the dashboard.</p><div className="actions" style={{justifyContent:"center"}}><button className="btn btn-primary" onClick={()=>inputRef.current?.click()}><Upload size={15}/> Choose CSV file</button><button className="btn" onClick={loadSample}><Activity size={15}/> Explore sample data</button></div><div className="eyebrow" style={{justifyContent:"center",marginTop:23,fontSize:9}}>CSV processed in this browser · 10 MB max · No upload endpoint</div></section>:
    <section id="analytics" className="dashboard-grid"><div className="main-stack">
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Strategy snapshot</div><div className="panel-subtitle">{fullDate(metrics!.startDate)} — {fullDate(metrics!.endDate)} · {metrics!.observations.toLocaleString()} return observations</div></div><button className="btn btn-small" onClick={downloadPDF} disabled={isPdfLoading}>{isPdfLoading?<LoaderCircle className="spin" size={14}/>:<Download size={14}/>} {isPdfLoading?"Building PDF…":"Export tear sheet"}</button></div><div className="panel-body"><div className="metric-grid">
        <MetricCard label="CAGR" value={pct(metrics!.cagr)} foot="Annualized growth" tone={metrics!.cagr>=0?"positive":"negative"} help={METRIC_HELP.CAGR}/>
        <MetricCard label="Sharpe ratio" value={ratio(metrics!.sharpeRatio)} foot="Risk-adjusted return" tone={metrics!.sharpeRatio!==null&&metrics!.sharpeRatio>=1?"positive":""} help={METRIC_HELP["Sharpe ratio"]}/>
        <MetricCard label="Sortino ratio" value={ratio(metrics!.sortinoRatio)} foot="Downside risk-adjusted" help={METRIC_HELP["Sortino ratio"]}/>
        <MetricCard label="Max drawdown" value={pct(metrics!.maxDrawdown)} foot={`${metrics!.maxDrawdownDurationDays.toLocaleString()} days peak to trough`} tone="negative" help={METRIC_HELP["Max drawdown"]}/>
        <MetricCard label="Annualized volatility" value={pct(metrics!.annualizedVol)} foot="252 trading-day convention" help={METRIC_HELP["Annualized volatility"]}/>
        <MetricCard label="Historical VaR (95%)" value={pct(metrics!.var95)} foot="Daily empirical loss threshold" help={METRIC_HELP["Historical VaR (95%)"]}/>
      </div><div className="divider"/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:12}}><div><div className="panel-title">Equity growth</div><div className="panel-subtitle">Growth of 1.00 unit of starting capital</div></div><div className="chart-legend"><span><i className="legend-key"/> Strategy equity</span></div></div>
      <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartRows} margin={{top:8,right:5,left:-18,bottom:0}}><CartesianGrid stroke="#243044" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="label" tick={{fill:"#78879d",fontSize:10}} axisLine={false} tickLine={false} minTickGap={28}/><YAxis tick={{fill:"#78879d",fontSize:10}} axisLine={false} tickLine={false} domain={["auto","auto"]} tickFormatter={(v:number)=>v.toFixed(2)}/><Tooltip content={({active,payload,label})=>active&&payload?.length?<div style={{background:"#111a28",border:"1px solid #2c394c",padding:"10px 12px",borderRadius:8,fontSize:11}}><div style={{color:"#91a0b5",marginBottom:6}}>{label}</div><div style={{color:"var(--accent)"}}>Equity: {Number(payload[0]?.value).toFixed(4)}×</div></div>:null}/><Line type="monotone" dataKey="equity" name="Equity" stroke="#b8f36b" strokeWidth={2} dot={false} activeDot={{r:4,fill:"#b8f36b",stroke:"#0e1420",strokeWidth:2}}/></LineChart></ResponsiveContainer></div>
      <div className="metric-foot"><span>Total return <strong className={metrics!.totalReturn>=0?"positive":"negative"}>{pct(metrics!.totalReturn)}</strong></span><span>Final equity <strong>{chartRows[chartRows.length-1].equity.toFixed(3)}×</strong></span></div></div></section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Drawdown profile</div><div className="panel-subtitle">Decline from the running equity high</div></div><span className="pill">Underwater</span></div><div className="panel-body"><div className="chart-wrap" style={{height:190}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartRows} margin={{top:8,right:5,left:-18,bottom:0}}><defs><linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff7d8b" stopOpacity={.28}/><stop offset="95%" stopColor="#ff7d8b" stopOpacity={.015}/></linearGradient></defs><CartesianGrid stroke="#243044" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="label" tick={{fill:"#78879d",fontSize:10}} axisLine={false} tickLine={false} minTickGap={28}/><YAxis tick={{fill:"#78879d",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`${(v*100).toFixed(0)}%`}/><Tooltip content={<CustomTooltip/>}/><Area type="monotone" dataKey="drawdown" name="Drawdown" stroke="#ff7d8b" fill="url(#drawdownFill)" strokeWidth={1.7}/></AreaChart></ResponsiveContainer></div></div></section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Monthly returns</div><div className="panel-subtitle">Compounded monthly performance by calendar year</div></div><div className="chart-legend"><span><i className="legend-key" style={{background:"var(--red)"}}/> Loss</span><span><i className="legend-key"/> Gain</span></div></div><div className="panel-body"><div className="heatmap"><div/>{MONTHS.map(month=><div className="heat-head" key={month}>{month}</div>)}{years.map(year=><div style={{display:"contents"}} key={year}><div className="heat-year">{year}</div>{MONTHS.map((month,index)=>{const value=monthlyLookup.get(`${year}-${index}`);return <div key={month} className={`heat-cell ${value===undefined?"heat-empty":""}`} title={value===undefined?`${month} ${year}: no observations`:`${month} ${year}: ${pct(value)}`} style={value===undefined?{}:{background:heatColor(value),color:Math.abs(value)>.025?"#fff":"#d7e0eb"}}>{value===undefined?"·":pct(value,1)}</div>;})}</div>)}</div><div style={{color:"var(--muted)",fontSize:10,marginTop:13}}>Months without observations are left blank. Colors represent realized monthly return, not forecasts.</div></div></section>
    </div><aside className="side-stack">
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Data source</div><div className="panel-subtitle">Current analysis input</div></div><FileChartColumnIncreasing size={16} color="var(--accent)"/></div><div className="panel-body">
        <div className="dropzone" onDragOver={e=>e.preventDefault()} onDrop={onDrop} onClick={()=>inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")inputRef.current?.click();}} style={{padding:19}}><div className="drop-icon"><Upload size={18}/></div><h3>Drop a CSV here</h3><p>Replace the current dataset at any time.</p><button className="btn btn-small" type="button" onClick={e=>{e.stopPropagation();inputRef.current?.click();}}>Browse files</button></div>
        <div className="stat-row"><span>Format</span><span>CSV</span></div><div className="stat-row"><span>Input type</span><span>{analysis.source==="prices"?"Closing prices":"Returns"}</span></div><div className="stat-row"><span>Observations</span><span>{metrics!.observations.toLocaleString()}</span></div><div className="stat-row"><span>Start date</span><span>{fullDate(metrics!.startDate)}</span></div><div className="stat-row"><span>End date</span><span>{fullDate(metrics!.endDate)}</span></div><div className="divider"/><button className="btn btn-small btn-quiet" style={{width:"100%"}} onClick={loadSample}><RefreshCw size={13}/> Reset to sample</button>
        {analysis.warnings.length>0&&<div className="warning-list">{analysis.warnings.map((warning,i)=><div className="warning-item" key={i}>{warning}</div>)}</div>}
      </div></section>
      <section className="panel"><div className="panel-head"><div><div className="panel-title">Risk assumptions</div><div className="panel-subtitle">Tune risk-adjusted metrics</div></div><Info size={15} color="#8797ac"/></div><div className="panel-body">
        <label className="field-label" htmlFor="risk-free">Annual risk-free rate (%)</label><div className="field-row"><input className="field" id="risk-free" type="number" min="0" max="99.99" step=".25" value={riskFreeInput} onChange={e=>setRiskFreeInput(e.target.value)}/><button className="btn btn-small" onClick={recomputeRiskFree}>Apply</button></div><div style={{marginTop:10,color:"var(--muted)",fontSize:10,lineHeight:1.6}}>Annual rate converted to an effective daily hurdle over 252 trading days.</div><div className="divider"/><div className="stat-row"><span>Return frequency</span><span>Daily*</span></div><div className="stat-row"><span>Annualization</span><span>252 days</span></div><div className="stat-row"><span>VaR method</span><span>Historical</span></div><div className="stat-row"><span>Risk-free rate</span><span>{pct(metrics!.riskFreeRate)}</span></div><div style={{color:"var(--muted)",fontSize:9,lineHeight:1.6,marginTop:12}}>* Assumes input observations are daily; annualization is not inferred from irregular dates.</div>
      </div></section>
      <section className="panel" id="methodology"><div className="panel-head"><div className="panel-title">Additional statistics</div></div><div className="panel-body"><div className="stat-row"><span>Win rate</span><span>{pct(metrics!.winRate)}</span></div><div className="stat-row"><span>Best month</span><span className="positive">{pct(metrics!.bestMonth)}</span></div><div className="stat-row"><span>Worst month</span><span className="negative">{pct(metrics!.worstMonth)}</span></div><div className="stat-row"><span>Max drawdown</span><span className="negative">{pct(metrics!.maxDrawdown)}</span></div><div className="stat-row"><span>Drawdown duration</span><span>{metrics!.maxDrawdownDurationDays.toLocaleString()} days</span></div><div className="notice" style={{marginTop:15}}>Win rate is per return observation, not per trade. Trade-level win rate and profit factor require trade-level records and are omitted.</div></div></section>
    </aside></section>}
    {error&&<div className="error" role="alert" style={{border:"1px solid #ff7d8b40",background:"#ff7d8b0f",padding:12,borderRadius:8,marginTop:14,display:"flex",justifyContent:"space-between",gap:10}}>{error}<button aria-label="Dismiss error" onClick={()=>setError("")}><X size={14}/></button></div>}
    {analysis&&<section ref={reportRef} style={{position:"absolute",left:"-20000px",top:0,width:1100,padding:28,color:"#edf3fb",background:"#0e1420"}} aria-hidden="true">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",borderBottom:"1px solid #2b3748",paddingBottom:16,marginBottom:18}}><div><div style={{fontSize:11,color:"#b8f36b",letterSpacing:2,marginBottom:7}}>QUANTITATIVE RESEARCH / PERFORMANCE NOTE</div><div style={{fontSize:27,fontWeight:700}}>QuantTearSheet</div><div style={{fontSize:11,color:"#91a0b5",marginTop:6}}>{fileName} · {fullDate(metrics!.startDate)} — {fullDate(metrics!.endDate)}</div></div><div style={{border:"1px solid #36445a",borderRadius:8,padding:11,fontSize:10,color:"#a3b1c4"}}>STRATEGY ANALYTICS<br/><span style={{color:"#b8f36b"}}>HISTORICAL DATA</span></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:16}}>{[["CAGR",pct(metrics!.cagr)],["Total return",pct(metrics!.totalReturn)],["Sharpe",ratio(metrics!.sharpeRatio)],["Sortino",ratio(metrics!.sortinoRatio)],["Max drawdown",pct(metrics!.maxDrawdown)],["Ann. volatility",pct(metrics!.annualizedVol)],["Historical VaR 95%",pct(metrics!.var95)],["Win rate",pct(metrics!.winRate)]].map(([label,value])=><div key={label} style={{border:"1px solid #293548",background:"#111a28",borderRadius:8,padding:12}}><div style={{color:"#91a0b5",fontSize:10}}>{label}</div><div style={{fontSize:21,marginTop:7,fontWeight:700}}>{value}</div></div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1.35fr 1fr",gap:15}}><div style={{border:"1px solid #293548",borderRadius:8,padding:15}}><div style={{fontSize:12,marginBottom:10}}>Equity growth</div><div style={{height:215}}><ResponsiveContainer width="100%" height="100%"><LineChart data={chartRows}><CartesianGrid stroke="#243044" strokeDasharray="3 5"/><XAxis dataKey="label" tick={{fill:"#91a0b5",fontSize:9}}/><YAxis tick={{fill:"#91a0b5",fontSize:9}}/><Line dataKey="equity" stroke="#b8f36b" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div></div><div style={{border:"1px solid #293548",borderRadius:8,padding:15}}><div style={{fontSize:12,marginBottom:10}}>Drawdown profile</div><div style={{height:215}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartRows}><CartesianGrid stroke="#243044" strokeDasharray="3 5"/><XAxis dataKey="label" tick={{fill:"#91a0b5",fontSize:9}}/><YAxis tick={{fill:"#91a0b5",fontSize:9}} tickFormatter={(v:number)=>pct(v,0)}/><Area dataKey="drawdown" stroke="#ff7d8b" fill="#ff7d8b" fillOpacity={.18}/></AreaChart></ResponsiveContainer></div></div></div>
      <div style={{borderTop:"1px solid #293548",marginTop:16,paddingTop:10,display:"flex",justifyContent:"space-between",fontSize:9,color:"#91a0b5"}}><span>Assumptions: daily observations, 252-day annualization, historical VaR. Validate source data before relying on estimates.</span><span>Generated by QuantTearSheet</span></div>
    </section>}

    <section className="value-section">
      <div className="eyebrow"><span className="dot" /> Why QuantTearSheet</div>
      <h2>Research-quality structure.<br /><span className="accent-text">Without the spreadsheet overhead.</span></h2>
      <p className="value-intro">A useful first pass should not require expensive terminals, complex spreadsheet templates, or advanced coding. Upload a CSV, inspect the same core measures researchers use to discuss return and risk, then export a concise report.</p>
      <div className="content-grid">
        <article className="content-card"><div className="content-icon">01</div><h2>Turn raw data into a readable story</h2><p>See growth, volatility, risk-adjusted returns, drawdowns, and monthly outcomes in one place. The charts make patterns easier to discuss than a long table of numbers.</p></article>
        <article className="content-card"><div className="content-icon">02</div><h2>Make the workflow more convenient</h2><p>No brokerage login or trading account connection is needed. Use a compatible CSV, check the assumptions, and export a PDF tear sheet for your own review or discussion.</p></article>
        <article className="content-card"><div className="content-icon">03</div><h2>Learn a consistent analytical language</h2><p>Metric definitions and stated conventions help beginners structure their analysis using familiar quantitative-finance concepts. The tool supports good practice; it cannot certify that a strategy meets any industry standard.</p></article>
      </div>
      <div className="value-callout"><ShieldCheck size={19}/><p><strong>Privacy-conscious by design:</strong> this MVP reads and analyzes CSV files in your browser. Check your file before loading it, and remember that results are only as reliable as the data and assumptions behind them.</p></div>
      <div className="value-actions"><Link href="/methodology" className="btn">Read the methodology</Link><Link href="/about" className="btn">How the service helps</Link></div>
    </section>
    <section className="home-pricing">
      <div><div className="eyebrow"><span className="dot" /> Plans that scale with your workflow</div><h2>Five tests free.<br /><span className="accent-text">Unlimited for $9/month.</span></h2><p>Start with up to five analyses a month, or choose the planned Research Pro subscription for unlimited use when checkout and account-based usage tracking are enabled.</p></div>
      <div className="home-price-card"><div className="home-price-row"><div><span className="price-name">Research Starter</span><p>5 analyses / month</p></div><strong>$0</strong></div><div className="divider"/><div className="home-price-row"><div><span className="price-name">Research Pro</span><p>Unlimited analyses / month</p></div><strong>$9<span className="per-month">/mo</span></strong></div><Link href="/payment" className="btn btn-primary">Compare plans <ArrowUpRight size={14}/></Link><p className="pricing-disclaimer">Plans are displayed for now; usage limits and paid subscriptions require account and billing integration.</p></div>
    </section>

    <section className="value-section">
      <div className="eyebrow"><span className="dot" /> Why QuantTearSheet</div>
      <h2>Research-quality structure.<br /><span className="accent-text">Without the spreadsheet overhead.</span></h2>
      <p className="value-intro">A useful first pass should not require expensive terminals, complex spreadsheet templates, or advanced coding. Upload a CSV, inspect the same core measures researchers use to discuss return and risk, then export a concise report.</p>
      <div className="content-grid">
        <article className="content-card"><div className="content-icon">01</div><h2>Turn raw data into a readable story</h2><p>See growth, volatility, risk-adjusted returns, drawdowns, and monthly outcomes in one place. The charts make patterns easier to discuss than a long table of numbers.</p></article>
        <article className="content-card"><div className="content-icon">02</div><h2>Make the workflow more convenient</h2><p>No brokerage login or trading account connection is needed. Use a compatible CSV, check the assumptions, and export a PDF tear sheet for your own review or discussion.</p></article>
        <article className="content-card"><div className="content-icon">03</div><h2>Learn a consistent analytical language</h2><p>Metric definitions and stated conventions help beginners structure their analysis using familiar quantitative-finance concepts. The tool supports good practice; it cannot certify that a strategy meets any industry standard.</p></article>
      </div>
      <div className="value-callout"><ShieldCheck size={19}/><p><strong>Privacy-conscious by design:</strong> this MVP reads and analyzes CSV files in your browser. Check your file before loading it, and remember that results are only as reliable as the data and assumptions behind them.</p></div>
      <div className="value-actions"><Link href="/methodology" className="btn">Read the methodology</Link><Link href="/about" className="btn">How the service helps</Link></div>
    </section>
    <section className="home-pricing">
      <div><div className="eyebrow"><span className="dot" /> Plans that scale with your workflow</div><h2>Five tests free.<br /><span className="accent-text">Unlimited for $9/month.</span></h2><p>Start with up to five analyses a month, or choose the planned Research Pro subscription for unlimited use when checkout and account-based usage tracking are enabled.</p></div>
      <div className="home-price-card"><div className="home-price-row"><div><span className="price-name">Research Starter</span><p>5 analyses / month</p></div><strong>$0</strong></div><div className="divider"/><div className="home-price-row"><div><span className="price-name">Research Pro</span><p>Unlimited analyses / month</p></div><strong>$9<span className="per-month">/mo</span></strong></div><Link href="/payment" className="btn btn-primary">Compare plans <ArrowUpRight size={14}/></Link><p className="pricing-disclaimer">Plans are displayed for now; usage limits and paid subscriptions require account and billing integration.</p></div>
    </section>
    <SiteFooter />
  </main>;
}
