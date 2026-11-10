import { env } from "cloudflare:workers";
import initial from "../../../lib/initial-edition.json";
type Edition=typeof initial;
function dayKey(now=new Date()){
 const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const get=(name:string)=>p.find(x=>x.type===name)!.value;
 const key=`${get('year')}-${get('month')}-${get('day')}`;
 return Number(get('hour'))<6?new Date(Date.parse(key+'T12:00:00Z')-86400000).toISOString().slice(0,10):key;
}
function plain(s:string){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<[^>]*>/g,'').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,n)=>{const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code<=0x10ffff?String.fromCodePoint(code):''}).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').trim()}
export async function GET(){
 const bucket=(env as unknown as {BUCKET:R2Bucket}).BUCKET;
 const day=dayKey();
 const reply=(e:Edition,stale=false)=>Response.json({...e,stale},{headers:{'Cache-Control':'no-store'}});
 try{
  const cached=await bucket.get('edition-'+day+'.json');if(cached)return reply(await cached.json<Edition>());
  const r=await fetch('https://feeds.npr.org/1001/rss.xml',{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('NPR feed unavailable');
  const xml=await r.text();const stories:Edition['stories']=[];const seen=new Set<string>();
  for(const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)){
   const field=(name:string)=>plain(match[1].match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>'))?.[1]||'');
   const title=field('title'),summary=field('description'),link=field('link'),published=field('pubDate');
   if(!title||!link||seen.has(link)||!Number.isFinite(Date.parse(published)))continue;
   const u=new URL(link);if(u.protocol!=='https:'||!['www.npr.org','npr.org'].includes(u.hostname))continue;
   const id=u.pathname.match(/\/(nx-s1-\d+|g-s1-\d+|\d{6,})(?:\/|$)/)?.[1];
   if(!id)continue;seen.add(link);stories.push({title,summary,url:'https://text.npr.org/'+id,published});if(stories.length===20)break;
  }
  if(stories.length===0)throw Error('Empty feed');
  const edition={day,savedAt:new Date().toISOString(),stories};
  await bucket.put('edition-'+day+'.json',JSON.stringify(edition),{onlyIf:{etagDoesNotMatch:'*'}});
  const fixed=await bucket.get('edition-'+day+'.json');
  const result=fixed?await fixed.json<Edition>():edition;
  await bucket.put('last-edition.json',JSON.stringify(result));return reply(result);
 }catch(error){
  console.error("Daily edition refresh failed",String(error));
  try{const last=await bucket.get('last-edition.json');if(last)return reply(await last.json<Edition>(),true)}catch{}
  return reply(initial,true);
 }
}
