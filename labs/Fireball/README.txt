
function mean(a){return a.reduce((s,x)=>s+x,0)/a.length}
function median(a){const b=[...a].sort((x,y)=>x-y),n=b.length;return n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2}
function sd(a){const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1))}
function quantile(a,q){const b=[...a].sort((x,y)=>x-y),p=(b.length-1)*q,l=Math.floor(p),h=Math.ceil(p);return l===h?b[l]:b[l]+(b[h]-b[l])*(p-l)}
function normalCDF(x){const sign=x<0?-1:1; x=Math.abs(x)/Math.sqrt(2); const t=1/(1+.3275911*x); const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return .5*(1+sign*y)}
function poissonUpper(k,lambda){let term=Math.exp(-lambda),cdf=term;for(let i=1;i<k;i++){term*=lambda/i;cdf+=term}return Math.max(0,1-cdf)}
function closeEnough(a,b,t){return Number.isFinite(a)&&Math.abs(a-b)<=t}
function val(id){return parseFloat(document.getElementById(id).value)}
function feedback(id,ok,msg){const e=document.getElementById(id);e.className='feedback '+(ok?'ok':'bad');e.textContent=msg}
function saveAll(prefix){document.querySelectorAll('[data-save]').forEach(e=>localStorage.setItem(prefix+'::'+e.dataset.save,e.value));flash('Answers saved in this browser.')}
function loadAll(prefix){document.querySelectorAll('[data-save]').forEach(e=>{const v=localStorage.getItem(prefix+'::'+e.dataset.save);if(v!==null)e.value=v;e.addEventListener('input',()=>localStorage.setItem(prefix+'::'+e.dataset.save,e.value))})}
function clearAll(prefix){if(!confirm('Clear all saved answers on this page?'))return;document.querySelectorAll('[data-save]').forEach(e=>{e.value='';localStorage.removeItem(prefix+'::'+e.dataset.save)});location.reload()}
function flash(msg){const d=document.createElement('div');d.textContent=msg;d.style.cssText='position:fixed;right:18px;bottom:18px;background:#142c4e;color:#fff;padding:10px 14px;border-radius:11px;z-index:99;box-shadow:0 7px 18px rgba(0,0,0,.22)';document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
function copyReport(id='reportPreview'){navigator.clipboard?.writeText(document.getElementById(id).textContent).then(()=>flash('Report copied.')).catch(()=>flash('Select the report and copy it manually.'))}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}


const FIREBALL_FIELD_META={
  event_id:{label:'Event ID'}, event_date:{label:'Event date'}, year:{label:'Year'},
  reports_count:{label:'Witness reports'}, ra_deg:{label:'RA (deg)'}, dec_deg:{label:'Dec (deg)'},
  azimuth:{label:'Azimuth (deg)'}, entry_angle:{label:'Entry angle (deg)'}, distance_km:{label:'Path distance (km)'},
  start_lat:{label:'Start latitude'}, start_long:{label:'Start longitude'}, end_lat:{label:'End latitude'}, end_long:{label:'End longitude'},
  start_alt_m:{label:'Start altitude (m)'}, end_alt_m:{label:'End altitude (m)'}
};
function formatFireballField(key,value){
  if(value===null||value===undefined||value==='')return '—';
  if(['event_id','year','reports_count'].includes(key))return String(value);
  if(key==='event_date')return String(value);
  const n=Number(value); if(!Number.isFinite(n))return String(value);
  if(['start_alt_m','end_alt_m'].includes(key))return Math.round(n).toLocaleString();
  if(['start_lat','start_long','end_lat','end_long'].includes(key))return n.toFixed(4);
  return n.toFixed(2);
}
function initEmbeddedFireballDatabases(){
  document.querySelectorAll('.embedded-fireball-db').forEach((root,index)=>{
    if(root.dataset.ready==='true')return;
    root.dataset.ready='true';
    const columns=(root.dataset.columns||Object.keys(FIREBALL_FIELD_META)).split(',').map(s=>s.trim()).filter(Boolean);
    const yearSelect=root.querySelector('.db-year');
    const minInput=root.querySelector('.db-min-reports');
    const searchInput=root.querySelector('.db-search');
    const limitSelect=root.querySelector('.db-limit');
    const summary=root.querySelector('.db-summary');
    const head=root.querySelector('thead');
    const body=root.querySelector('tbody');
    if(yearSelect){
      yearSelect.innerHTML='<option value="all">All years</option>'+[2021,2022,2023,2024,2025,2026].map(y=>`<option value="${y}">${y}</option>`).join('');
      yearSelect.value=root.dataset.defaultYear||'all';
    }
    if(minInput)minInput.value=root.dataset.defaultMin||'25';
    if(limitSelect)limitSelect.value=root.dataset.defaultLimit||'100';
    head.innerHTML='<tr>'+columns.map(k=>`<th>${escapeHtml(FIREBALL_FIELD_META[k]?.label||k)}</th>`).join('')+'</tr>';
    function render(){
      const year=yearSelect?.value||'all';
      const min=Number(minInput?.value||0);
      const q=(searchInput?.value||'').trim().toLowerCase();
      const lim=limitSelect?.value==='all'?Infinity:Number(limitSelect?.value||100);
      const rows=FIREBALL_DATA.filter(d=>(year==='all'||String(d.year)===year)&&d.reports_count>=min&&(!q||columns.some(k=>String(d[k]??'').toLowerCase().includes(q))));
      const shown=rows.slice(0,lim);
      summary.textContent=`${rows.length} of ${FIREBALL_DATA.length} events meet the current filters; ${shown.length} ${shown.length===1?'row is':'rows are'} displayed.`;
      body.innerHTML=shown.map(d=>'<tr>'+columns.map(k=>`<td class="${typeof d[k]==='number'?'num':''}">${escapeHtml(formatFireballField(k,d[k]))}</td>`).join('')+'</tr>').join('');
    }
    [yearSelect,minInput,searchInput,limitSelect].filter(Boolean).forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',render));
    render();
  });
}
document.addEventListener('DOMContentLoaded',initEmbeddedFireballDatabases);
