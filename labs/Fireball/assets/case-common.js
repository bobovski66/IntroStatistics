
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
