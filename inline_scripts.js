
(()=>{
const API="https://ft-web2apk.ftshehryar10044.workers.dev/api";
const $=id=>document.getElementById(id);
const name=$('name'),pkg=$('pkg'),ver=$('ver'),code=$('code'),site=$('site'),file=$('file'),iconUrl=$('iconUrl'),preview=$('preview'),generate=$('generate'),progress=$('progress'),result=$('result'),error=$('error'),bar=$('bar'),statusTitle=$('statusTitle'),statusText=$('statusText'),download=$('download');
let iconData="",busy=false,pollTimer=null,progressValue=3;
const show=(e,v)=>e.classList.toggle('hide',!v);
const packageOk=v=>/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(v);
const normalize=v=>/^https?:\/\//i.test(v.trim())?v.trim():'https://'+v.trim();
function setBar(v){progressValue=Math.max(3,Math.min(98,v));bar.style.width=progressValue+'%'}
function reset(){show(result,false);show(error,false);download.removeAttribute('href');setBar(3)}
function previewImage(src){preview.innerHTML='';const img=document.createElement('img');img.src=src;img.alt='Icon preview';img.onerror=()=>{preview.innerHTML='<span>ICON</span>'};preview.appendChild(img)}
function dataUri(f){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(f)})}
file.addEventListener('change',async()=>{const f=file.files?.[0];if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>5*1024*1024){file.value='';iconData='';$('fileName').textContent='Choose icon file';return alert('Select a PNG, JPG, or WebP image up to 5MB.')}iconData=await dataUri(f);iconUrl.value='';$('fileName').textContent=f.name;previewImage(iconData)});
iconUrl.addEventListener('input',()=>{const v=iconUrl.value.trim();if(!v)return;iconData='';previewImage(v)});
function extractId(d){for(const k of ['buildId','build_id','projectId','id','uuid'])if(d&&typeof d[k]==='string'&&/^[a-f0-9]{8}-[a-f0-9-]{27}$/i.test(d[k]))return d[k];const s=JSON.stringify(d||{}).match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);return s?s[0]:''}
function extractUrl(d){if(!d||typeof d!=='object')return'';for(const k of ['downloadUrl','download_url','apkUrl','apk_url','url'])if(typeof d[k]==='string'&&/^https?:\/\//i.test(d[k]))return d[k];return extractUrl(d.data)||extractUrl(d.result)}
function beginProgress(){let n=3;setBar(n);clearInterval(pollTimer);pollTimer=setInterval(()=>{if(n<86){n+=n<35?2:n<65?1:.35;setBar(n)}},1000)}
function stopProgress(ok){clearInterval(pollTimer);if(ok)setBar(100)}
async function pollStatus(buildId,statusUrl,downloadUrl){let attempts=0;while(attempts<180){attempts++;await new Promise(r=>setTimeout(r,3000));try{const u=statusUrl||API+'/status?build_id='+encodeURIComponent(buildId);const r=await fetch(u,{cache:'no-store'});const d=await r.json();if(d.ready===true||d.status==='success'){const finalUrl=d.downloadUrl||downloadUrl;if(finalUrl){stopProgress(true);show(progress,false);$('resultText').textContent=name.value.trim()+' is ready to download.';download.href=finalUrl;show(result,true);return true}}if(d.stage)statusText.textContent=d.stage;if(typeof d.progress==='number')setBar(d.progress);else setBar(Math.min(90,progressValue+.6))}catch{}statusText.textContent='APK is still being built. Please keep this page open.'}throw new Error('APK build is taking longer than expected. Please try again shortly.')}
async function build(){
if(busy)return;
reset();
const n=name.value.trim(),p=pkg.value.trim(),v=ver.value.trim(),c=code.value.trim(),s=normalize(site.value),i=iconData||iconUrl.value.trim();
if(!n)return alert('Enter App Name.');
if(!packageOk(p))return alert('Enter a valid Package Name, e.g. com.example.app');
if(!/^\d+\.\d+\.\d+$/.test(v))return alert('Version must be like 1.0.0');
if(!/^[1-9]\d*$/.test(c))return alert('Version Code must be a positive number.');
try{new URL(s)}catch{return alert('Enter a valid Website URL.');}
if(!i)return alert('Upload an icon or enter an Image URL.');
busy=true;generate.disabled=true;show(progress,true);show(error,false);statusTitle.textContent='Building APK…';statusText.textContent='Submitting your app to FT Web2APK.';beginProgress();
try{
 let response;
 if(iconData){
   const fd=new FormData();
   fd.append('name',n);fd.append('appName',n);fd.append('package',p);fd.append('packageName',p);fd.append('version',v);fd.append('versionName',v);fd.append('versioncode',c);fd.append('versionCode',c);fd.append('url',s);fd.append('websiteUrl',s);
   const mime=(iconData.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)||[])[1]||'image/png';
   const raw=atob(iconData.split(',')[1]);const bytes=new Uint8Array(raw.length);for(let x=0;x<raw.length;x++)bytes[x]=raw.charCodeAt(x);
   fd.append('icon',new Blob([bytes],{type:mime}),'icon.'+(mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':'png'));
   response=await fetch(API,{method:'POST',body:fd,cache:'no-store'});
 }else{
   const u=new URL(API);u.searchParams.set('name',n);u.searchParams.set('package',p);u.searchParams.set('version',v);u.searchParams.set('versioncode',c);u.searchParams.set('icon',i);u.searchParams.set('url',s);
   response=await fetch(u.toString(),{method:'GET',headers:{Accept:'application/json'},cache:'no-store'});
 }
 const raw=await response.text();let d={};try{d=JSON.parse(raw)}catch{}
 if(!response.ok)throw new Error(d.error||d.message||'API returned HTTP '+response.status);
 if(d.status==='error')throw new Error(d.error||'Build request failed');
 const id=extractId(d);
 const direct=extractUrl(d);
 if(!id){if(direct){stopProgress(true);show(progress,false);download.href=direct;$('resultText').textContent=n+' is ready to download.';show(result,true);return}throw new Error('API did not return a build ID.');}
 statusTitle.textContent='Building APK…';
 statusText.textContent=d.stage||'Your APK is queued for building.';
 setBar(typeof d.progress==='number'?d.progress:Math.max(8,progressValue));
 const statusUrl=d.statusUrl||API+'/status?build_id='+encodeURIComponent(id);
 await pollStatus(id,statusUrl,direct);
}catch(e){
 stopProgress(false);show(progress,false);$('errorText').textContent=/failed to fetch|networkerror|load failed/i.test(e.message||'')?'Could not connect to FT Web2APK API. Please check the Worker URL and try again.':(e.message||'APK generation failed.');show(error,true);
}finally{busy=false;generate.disabled=false}
}
generate.addEventListener('click',build);$('retry').addEventListener('click',build);[name,pkg,ver,code,site,iconUrl].forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();build()}}));
})();
