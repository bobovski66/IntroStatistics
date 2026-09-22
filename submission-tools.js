(function(){
'use strict';

const STATE_KEY='math146_submission_state::'+location.pathname;
const NAME_KEY='math146_submission_student_name';

function editableControls(){
  return Array.from(document.querySelectorAll('input,select,textarea')).filter(el=>{
    if(el.closest('.solution,.submission-tools-ui')) return false;
    const type=(el.type||'').toLowerCase();
    return !['button','submit','reset','hidden'].includes(type) && !el.readOnly && !el.disabled;
  });
}
function controlKey(el,index){
  const type=(el.type||'').toLowerCase();
  if(type==='radio') return 'radio::'+(el.name||el.id||index);
  if(type==='checkbox') return 'check::'+(el.id||el.name||el.dataset.save||index);
  return 'field::'+(el.id||el.dataset.save||el.name||index);
}
function snapshot(){
  const state={};
  const controls=editableControls();
  controls.forEach((el,i)=>{
    const type=(el.type||'').toLowerCase(),key=controlKey(el,i);
    if(type==='radio'){
      if(el.checked) state[key]=el.value;
    }else if(type==='checkbox'){
      state[key]=!!el.checked;
    }else state[key]=el.value;
  });
  try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(e){}
}
function restore(){
  let state={};
  try{state=JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{};}catch(e){}
  const controls=editableControls();
  controls.forEach((el,i)=>{
    const type=(el.type||'').toLowerCase(),key=controlKey(el,i);
    if(!(key in state)) return;
    if(type==='radio') el.checked=String(el.value)===String(state[key]);
    else if(type==='checkbox') el.checked=!!state[key];
    else el.value=state[key];
  });
}
function primaryNameField(){
  return document.querySelector('[data-save="student_name"]') ||
    document.querySelector('input[id$="_name"]') ||
    document.querySelector('input[name="student_name"]');
}
function topNameField(){return document.getElementById('submissionStudentName');}
function syncName(value,fromTop){
  const top=topNameField(),primary=primaryNameField();
  if(fromTop&&primary&&primary.value!==value){
    primary.value=value;
    primary.dispatchEvent(new Event('input',{bubbles:true}));
  }else if(!fromTop&&top&&top.value!==value) top.value=value;
  try{localStorage.setItem(NAME_KEY,value);}catch(e){}
}
function answerText(el){
  const type=(el.type||'').toLowerCase();
  if(el.tagName==='SELECT'){
    const opt=el.selectedOptions&&el.selectedOptions[0];
    return el.value&&opt?opt.textContent.trim():'No response';
  }
  if(type==='checkbox') return el.checked?'☑':'☐';
  if(type==='radio') return el.checked?'◉':'○';
  const value=String(el.value??'').trim();
  return value||'No response';
}
function safeFilename(s){
  return String(s||'student').trim().replace(/[^a-z0-9._-]+/gi,'_').replace(/^_+|_+$/g,'')||'student';
}
function completionSummary(){
  const controls=editableControls().filter(el=>el!==primaryNameField()&&el!==topNameField());
  const radioGroups=new Set();let done=0,total=0;
  controls.forEach(el=>{
    const type=(el.type||'').toLowerCase();
    if(type==='radio'){
      const key=el.name||el.id;
      if(radioGroups.has(key))return;
      radioGroups.add(key);total++;
      const checked=controls.some(r=>(r.type||'').toLowerCase()==='radio'&&(r.name||r.id)===key&&r.checked);
      if(checked)done++;
    }else{
      total++;
      if(type==='checkbox'?el.checked:String(el.value||'').trim()!=='')done++;
    }
  });
  return {done,total};
}
function replaceControls(sourceRoot,cloneRoot){
  const source=Array.from(sourceRoot.querySelectorAll('input,select,textarea'));
  const copied=Array.from(cloneRoot.querySelectorAll('input,select,textarea'));
  copied.forEach((copy,i)=>{
    const original=source[i];
    if(!original){copy.remove();return;}
    const type=(original.type||'').toLowerCase();
    if(['button','submit','reset','hidden'].includes(type)){copy.remove();return;}
    const block=original.tagName==='TEXTAREA'||original.tagName==='SELECT'||['text','number','email','url','range'].includes(type);
    const out=document.createElement(block?'div':'span');
    out.className='submission-answer'+(block?' submission-answer-block':'');
    out.textContent=answerText(original);
    copy.replaceWith(out);
  });
}
function replaceCanvases(sourceRoot,cloneRoot){
  const source=Array.from(sourceRoot.querySelectorAll('canvas'));
  const copied=Array.from(cloneRoot.querySelectorAll('canvas'));
  copied.forEach((copy,i)=>{
    const original=source[i];
    if(!original){copy.remove();return;}
    try{
      const img=document.createElement('img');
      img.className='submission-canvas-image';
      img.alt=original.getAttribute('aria-label')||'Lab graph';
      img.src=original.toDataURL('image/png');
      copy.replaceWith(img);
    }catch(e){
      const note=document.createElement('div');
      note.className='submission-answer submission-answer-block';
      note.textContent='Interactive visual could not be captured in this copy.';
      copy.replaceWith(note);
    }
  });
}
function makeLinksAbsolute(sourceRoot,cloneRoot){
  const sLinks=Array.from(sourceRoot.querySelectorAll('a')),cLinks=Array.from(cloneRoot.querySelectorAll('a'));
  cLinks.forEach((a,i)=>{if(sLinks[i]&&sLinks[i].href)a.href=sLinks[i].href;});
  const sImgs=Array.from(sourceRoot.querySelectorAll('img')),cImgs=Array.from(cloneRoot.querySelectorAll('img'));
  cImgs.forEach((img,i)=>{if(sImgs[i]&&sImgs[i].src&&!img.src.startsWith('data:'))img.src=sImgs[i].src;});
}
function cleanClone(clone){
  clone.querySelectorAll('.submission-tools-ui,.toolbar,.student-coursebar,.feedback,.solution,.locked,.report,.report-preview,.source-actions,.copy-actions,script,button').forEach(x=>x.remove());
  clone.querySelectorAll('details').forEach(x=>x.remove());
  clone.querySelectorAll('#database,.embedded-fireball-db').forEach(x=>x.remove());
  clone.querySelectorAll('label').forEach(label=>{if(label.querySelector('[data-save="student_name"]'))label.remove();});
}
function submissionStyles(){
  if(document.getElementById('math146-shared-submission-style'))return;
  const style=document.createElement('style');style.id='math146-shared-submission-style';style.textContent=
    '.submission-tools-ui{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
    '.submission-inline{display:flex;gap:7px;align-items:center;flex-wrap:wrap}' +
    '.submission-inline label{font-size:.8rem;font-weight:700;color:inherit}' +
    '.submission-inline input{width:180px;max-width:42vw;padding:7px 9px;border:1px solid #b9c6d5;border-radius:8px;background:#fff;color:#222;font:inherit}' +
    '.submission-prepare{background:#2457a6!important;color:#fff!important;border-color:#2457a6!important;font-weight:750!important}' +
    '.submission-status{font-size:.8rem;opacity:.8}' +
    '.submission-guide{max-width:1080px;margin:12px auto;padding:12px 15px;border:1px solid #cad7e5;border-left:5px solid #2457a6;border-radius:10px;background:#f3f7fc;color:#24364c}' +
    '.submission-guide strong{color:#17385f}' +
    '@media(max-width:720px){.submission-inline{width:100%}.submission-inline input{max-width:none;flex:1;min-width:140px}}' +
    '@media print{.submission-tools-ui{display:none!important}}';
  document.head.appendChild(style);
}
function installWorkingControls(){
  submissionStyles();
  const actions=document.querySelector('.toolbar .actions')||document.querySelector('.actions');
  if(!actions||actions.querySelector('#submissionStudentName'))return;
  Array.from(actions.querySelectorAll('button')).forEach(btn=>{
    const onclick=btn.getAttribute('onclick')||'',text=(btn.textContent||'').trim().toLowerCase();
    if(text==='save'||text==='print'||text==='print / save pdf'||onclick.includes('saveAll(')||onclick.includes('window.print()'))btn.remove();
  });
  const wrap=document.createElement('div');wrap.className='submission-inline submission-tools-ui';
  wrap.innerHTML='<label for="submissionStudentName">Student name</label><input id="submissionStudentName" autocomplete="name" placeholder="Your name"><button type="button" class="submission-prepare" onclick="createSubmissionCopy()">Prepare Submission</button><span id="submissionStatus" class="submission-status">Autosaved in this browser</span>';
  actions.prepend(wrap);

  const guide=document.createElement('div');guide.className='submission-guide submission-tools-ui';
  guide.innerHTML='<strong>Submitting this lab:</strong> Work and check your answers here. When you are ready, choose <strong>Prepare Submission</strong>. A clean, read-only copy will open in this tab; from there you can save a PDF or download an HTML file for upload. Nothing is submitted automatically.';
  const main=document.querySelector('main');
  if(main)main.insertBefore(guide,main.firstChild);

  const reportActions=document.querySelector('#report .actions');
  if(reportActions&&!reportActions.querySelector('.submission-prepare')){
    Array.from(reportActions.querySelectorAll('button')).forEach(btn=>{
      if((btn.getAttribute('onclick')||'').includes('window.print()'))btn.remove();
    });
    const b=document.createElement('button');b.type='button';b.className='submission-prepare submission-tools-ui';b.textContent='Prepare Submission';b.onclick=window.createSubmissionCopy;
    reportActions.appendChild(b);
  }
}
function installSubmissionPage(name,title,clone,summary){
  document.title=title+' — '+name;
  const style=document.createElement('style');style.textContent=
    'body{overflow:auto!important;height:auto!important;background:#fff!important;color:#111!important}' +
    '.submission-toolbar{position:sticky;top:0;z-index:1000;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:12px 18px;background:#17385f;color:#fff;box-shadow:0 3px 12px rgba(0,0,0,.18);font-family:system-ui,sans-serif}' +
    '.submission-toolbar button{display:inline-block!important;background:#fff!important;color:#17385f!important;border:1px solid #cad7e5!important;padding:9px 13px!important;border-radius:9px!important;font-weight:800!important;cursor:pointer!important}' +
    '.submission-toolbar .submission-note{font-size:.88rem;color:#e7eef8}' +
    '.submission-cover{max-width:1080px;margin:20px auto 0;padding:0 20px;font-family:system-ui,sans-serif}' +
    '.submission-cover-card{background:#f7f9fc;border:1px solid #ccd8e5;border-radius:14px;padding:15px 18px}' +
    '.submission-cover h1{margin:0 0 8px;color:#17385f;font-size:1.45rem}' +
    '.submission-meta{display:flex;gap:22px;flex-wrap:wrap}' +
    '.submission-completion{margin-top:8px;color:#46566c;font-size:.88rem}' +
    '.submission-content{max-width:1080px;margin:0 auto;padding:0 20px 60px}' +
    '.submission-answer{display:inline-block;padding:4px 8px;border:1px solid #b9c6d5;border-radius:7px;background:#fff;color:#111;font-weight:700;white-space:pre-wrap;overflow-wrap:anywhere;vertical-align:baseline}' +
    '.submission-answer-block{display:block;width:100%;min-height:2.1em;margin:5px 0 2px}' +
    '.submission-canvas-image{display:block;max-width:100%;height:auto;border:1px solid #ccd8e5;border-radius:10px;background:#fff;margin:8px 0}' +
    'input,select,textarea{display:none!important}' +
    '@media print{.submission-toolbar{display:none!important}.submission-cover{margin-top:0;padding:0}.submission-content{max-width:none;padding:0}.submission-cover-card{border:0;padding:0 0 10px}.card{box-shadow:none!important}.part{break-inside:avoid}}';
  document.head.appendChild(style);
  document.body.replaceChildren();

  const toolbar=document.createElement('div');toolbar.className='submission-toolbar';
  toolbar.innerHTML='<button id="submissionPrintButton">Print / Save as PDF</button><button id="submissionDownloadButton">Download HTML</button><button id="submissionReturnButton">Return to Lab</button><span class="submission-note">Submission view — answers are fixed on the page; answer keys and checking controls are hidden.</span>';
  document.body.appendChild(toolbar);

  const cover=document.createElement('div');cover.className='submission-cover';
  const card=document.createElement('div');card.className='submission-cover-card';
  const h=document.createElement('h1');h.textContent=title;
  const meta=document.createElement('div');meta.className='submission-meta';
  const student=document.createElement('div');student.innerHTML='<strong>Student:</strong> ';student.appendChild(document.createTextNode(name));
  const made=document.createElement('div');made.innerHTML='<strong>Submission prepared:</strong> ';made.appendChild(document.createTextNode(new Date().toLocaleString()));
  meta.append(student,made);
  const comp=document.createElement('div');comp.className='submission-completion';comp.textContent=summary.total?(summary.done+' of '+summary.total+' response fields contain work in this copy.'):'Prepared copy of current work.';
  card.append(h,meta,comp);cover.appendChild(card);document.body.appendChild(cover);

  const holder=document.createElement('div');holder.className='submission-content';
  while(clone.firstChild)holder.appendChild(clone.firstChild);
  document.body.appendChild(holder);

  document.body.dataset.downloadBase='Math146_'+safeFilename(title)+'_'+safeFilename(name);
  document.getElementById('submissionPrintButton').onclick=()=>window.print();
  document.getElementById('submissionDownloadButton').onclick=()=>{
    const html='<!doctype html>\n'+document.documentElement.outerHTML,blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=(document.body.dataset.downloadBase||'Math146_Lab_Submission')+'.html';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  document.getElementById('submissionReturnButton').onclick=()=>location.reload();
  window.scrollTo(0,0);
}
window.createSubmissionCopy=function(){
  snapshot();
  const top=topNameField(),primary=primaryNameField(),name=((top&&top.value)||(primary&&primary.value)||'').trim(),status=document.getElementById('submissionStatus');
  if(!name){if(status)status.textContent='Enter your name first.';(top||primary)?.focus();return;}
  syncName(name,true);
  const summary=completionSummary(),source=document.body,clone=source.cloneNode(true);
  makeLinksAbsolute(source,clone);
  replaceCanvases(source,clone);
  replaceControls(source,clone);
  cleanClone(clone);
  const title=(document.querySelector('header h1')?.textContent||document.title).trim();
  installSubmissionPage(name,title,clone,summary);
};

function init(){
  restore();
  installWorkingControls();
  const top=topNameField(),primary=primaryNameField();
  let remembered='';try{remembered=localStorage.getItem(NAME_KEY)||'';}catch(e){}
  if(top){
    top.value=(primary&&primary.value.trim())?primary.value:remembered;
    if(primary&&!primary.value.trim()&&top.value){primary.value=top.value;primary.dispatchEvent(new Event('input',{bubbles:true}));}
    top.addEventListener('input',()=>syncName(top.value,true));
  }
  if(primary)primary.addEventListener('input',()=>syncName(primary.value,false));
  document.addEventListener('input',snapshot);
  document.addEventListener('change',snapshot);
  snapshot();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();