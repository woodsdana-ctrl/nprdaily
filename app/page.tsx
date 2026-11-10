"use client";
import { useEffect, useState } from "react";
type Story = { title:string; summary:string; url:string; published:string };
type Edition = {day:string; savedAt:string; stories:Story[]; stale?:boolean};
export default function Page(){
 const [edition,setEdition]=useState<Edition|null>(null),[error,setError]=useState(false),[read,setRead]=useState<string[]>([]);
 useEffect(()=>{fetch('/api/edition').then(r=>{if(!r.ok)throw Error();return r.json() as Promise<Edition>}).then(e=>{setEdition(e);try{setRead(JSON.parse(localStorage.getItem('read-'+e.day)||'[]'))}catch{}}).catch(()=>setError(true))},[]);
 function mark(url:string){if(!edition)return;const next=Array.from(new Set([...read,url]));setRead(next);try{localStorage.setItem('read-'+edition.day,JSON.stringify(next))}catch{}}
 const date=edition?new Date(edition.day+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'America/Chicago'}):'';
 return <main id="top"><header><p className="eyebrow">A PERSONAL NPR READER</p><h1>The Daily List<span>.</span></h1><p className="tagline">A little news. A definite end.</p></header>
 <section className="edition" aria-label="Edition details"><strong>{edition?date:'Today’s edition'}</strong><span>{edition?`${edition.stories.length} stories · ${read.length} opened`:'One list per day'}</span></section>
 <p className="intro">NPR headlines and summaries. Each story opens NPR’s text-only article. Your edition stays fixed for the day; a new list is available after 6 a.m. Central.</p>
 {edition?.stale&&<p role="status" className="notice">NPR is unavailable right now. This is the last saved edition; its date is shown above.</p>}
 {error&&<p role="alert">Today’s list couldn’t load. <button onClick={()=>location.reload()}>Try again</button>.</p>}
 {!edition&&!error&&<p role="status" className="loading">Getting your daily list…</p>}
 {edition&&<ol className="stories">{edition.stories.map((s,i)=><li key={s.url} className={read.includes(s.url)?'read':''}><span className="number">{String(i+1).padStart(2,'0')}</span><article><h2><a href={s.url} target="_blank" rel="noopener noreferrer" onClick={()=>mark(s.url)}>{s.title}</a></h2><p>{s.summary}</p><div className="story-meta">NPR <span aria-hidden="true">/</span> {new Date(s.published).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'America/Chicago'})}{read.includes(s.url)&&<span className="opened">Opened</span>}</div></article></li>)}</ol>}
 {edition&&<section className="end"><p className="eyebrow">END OF EDITION</p><h2>You’re done for today.</h2><p>That’s the whole list. Tomorrow can wait.</p><a href="#top">Back to top ↑</a></section>}
 <footer><p>An independent personal reader. Not affiliated with NPR.</p><p>Reporting and summaries © NPR. <a href="https://text.npr.org/" target="_blank" rel="noopener noreferrer">Visit NPR Text</a></p></footer></main>
}
