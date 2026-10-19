/* Week 2: probability weights, repeated outcomes, and two summaries of one trial stream. */
(function(){
  'use strict';
  const BLUE='#245a81',TEAL='#287d76',GOLD='#a16a13',INK='#182e40',GRID='#d6e1e7';
  const PRESETS={
    reading:{name:'Reading: outcomes 0, 1, 2',x:[0,1,2],p:[.2,.5,.3],unit:'count units',threshold:1,note:'An invented model: probabilities 0.20, 0.50, and 0.30 are given, rather than estimated from the simulation.'},
    spinner:{name:'Lab: four-value spinner',x:[1,2,3,4],p:[.1,.3,.4,.2],unit:'spinner units',threshold:3,note:'The lab’s spinner model. The long-run mean is allowed to fall between the individual outcomes.'},
    python:{name:'Python: four-outcome table',x:[0,1,2,3],p:[.1,.2,.4,.3],unit:'count units',threshold:2,note:'The probability table from Python Module 3. Pair each outcome with its own probability.'},
    die:{name:'Fair die',x:[1,2,3,4,5,6],p:[1/6,1/6,1/6,1/6,1/6,1/6],unit:'die units',threshold:4,note:'Each face has probability 1/6. The expected value is 3.5, although 3.5 cannot occur on one roll.'},
    net:{name:'Reading: net gain in the die game',x:[-2,8],p:[5/6,1/6],unit:'dollars per play',threshold:8,note:'A play costs $2. Gross payout is $10 on a six, otherwise $0. Net gain is therefore $8 or −$2.'}
  };
  const SETTINGS={coin:{name:'Four fair coin flips',n:4,p:.5,b:2,g:3},guess:{name:'Lab: guessing (p = 0.20)',n:10,p:.2,b:2,g:3},treatment:{name:'Lab: six responses (p = 0.70)',n:6,p:.7,b:4,g:3},sky:{name:'Discussion: eight skywatch windows',n:8,p:.18,b:2,g:4}};
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function fmt(x,d=4){return x===null||!Number.isFinite(x)?'—':Number(x.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d});}
  function pf(x){return x>0&&x<.0001?x.toExponential(3):fmt(x);}
  function validate(x,p){if(!x.length||x.length!==p.length||new Set(x).size!==x.length||!x.every(Number.isFinite)||!p.every(v=>Number.isFinite(v)&&v>=0&&v<=1)||Math.abs(p.reduce((a,b)=>a+b,0)-1)>1e-10)throw Error('A PMF needs distinct finite outcomes, nonnegative probabilities, and total probability one.');}
  function weighted(x,p){validate(x,p);const mean=x.reduce((s,v,i)=>s+v*p[i],0),terms=x.map((v,i)=>(v-mean)**2*p[i]),variance=terms.reduce((a,b)=>a+b,0);return {mean,variance,sd:Math.sqrt(variance),terms};}
  function reweight(base,index,prob){
    if(!Number.isInteger(index)||index<0||index>=base.length||prob<0||prob>1||!Number.isFinite(prob))throw Error('Invalid probability edit.');
    const rest=1-base[index];if(base.length===1){if(prob!==1)throw Error('A one-outcome PMF must have probability one.');return [1];}
    return base.map((p,i)=>i===index?prob:rest>1e-14?p*(1-prob)/rest:(1-prob)/(base.length-1));
  }
  function categorical(p,rng=Math.random){const r=rng();let c=0;for(let i=0;i<p.length;i++){c+=p[i];if(r<c)return i;}return p.length-1;}
  function combination(n,k){if(!Number.isInteger(n)||n<0||!Number.isInteger(k)||k<0||k>n)return 0;k=Math.min(k,n-k);let r=1;for(let j=1;j<=k;j++)r=r*(n-k+j)/j;return r;}
  function binomial(n,p){if(!Number.isInteger(n)||n<0||p<0||p>1||!Number.isFinite(p))throw Error('Invalid binomial setting.');return Array.from({length:n+1},(_,k)=>combination(n,k)*p**k*(1-p)**(n-k));}
  function geometric(k,p){if(!(p>0&&p<=1))throw Error('The trial-count geometric model requires 0 < p ≤ 1.');return Number.isInteger(k)&&k>=1?(1-p)**(k-1)*p:0;}
  function geomView(n,p){return Array.from({length:n},(_,i)=>geometric(i+1,p)).concat([(1-p)**n]);}
  function sequence(n,p,rng=Math.random){return Array.from({length:n},()=>rng()<p?1:0);}
  function describe(row){const i=row.indexOf(1);return {b:row.reduce((a,b)=>a+b,0),t:i<0?null:i+1};}
  function event(x,relation,k){return relation==='eq'?x===k:relation==='le'?x<=k:x>=k;}
  function svg(w,h,label,b){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title><desc>'+esc(label)+'</desc><rect width="100%" height="100%" fill="white"/><g font-family="system-ui, sans-serif" font-size="14" fill="'+INK+'">'+b+'</g></svg>';}
  function text(x,y,t,attrs=''){return '<text x="'+x+'" y="'+y+'" '+attrs+'>'+esc(t)+'</text>';}
  function line(x,y,u,v,color=GRID,attrs=''){return '<line x1="'+x+'" y1="'+y+'" x2="'+u+'" y2="'+v+'" stroke="'+color+'" '+attrs+'/>';}
  function plot(labels,theory,emp,selected,xlabel,values=null,mean=null,aggregateIndex=null){
    const w=760,h=340,L=64,R=725,T=53,B=253,slots=labels.length;
    let step=1,low=0,high=slots-1;
    if(values){low=Math.min(...values);high=Math.max(...values);if(slots>1)step=Math.min(...values.slice(1).map((v,i)=>v-values[i]));}
    const span=high-low+step,scale=v=>L+(v-low+step/2)/span*(R-L),positions=values||labels.map((_,i)=>i);
    const barWidth=Math.min(72,(R-L)*step/span*.68),max=Math.min(1,Math.max(.1,Math.ceil(Math.max(...theory,...(emp||[0]))*10-1e-10)/10));
    const sy=v=>B-v/max*(B-T);
    let body=text(18,24,'Wide bars: model probability. Narrow gold bars: simulated relative frequency.');
    for(let i=0;i<=4;i++){const val=max*i/4,y=sy(val);body+=line(L,y,R,y)+text(L-9,y+5,fmt(val,3),'text-anchor="end"');}
    labels.forEach((label,i)=>{const x=scale(positions[i]),y=sy(theory[i]),aggregate=i===aggregateIndex;
      body+='<rect x="'+(x-barWidth/2)+'" y="'+y+'" width="'+barWidth+'" height="'+(B-y)+'" fill="'+(aggregate?'#f1e7d6':selected[i]?'#bfded5':'#d7e5ef')+'" stroke="'+(aggregate?GOLD:selected[i]?TEAL:BLUE)+'"'+(aggregate?' stroke-dasharray="3 2"':'')+'/>';
      if(emp){const ey=sy(emp[i]);body+='<rect x="'+(x-barWidth*.12)+'" y="'+ey+'" width="'+(barWidth*.24)+'" height="'+(B-ey)+'" fill="'+GOLD+'"/>';}
      if(slots<=14||i%2===0||i===slots-1||selected[i])body+=text(x,B+23,label,'text-anchor="middle"');
    });
    if(mean!==null){const x=scale(mean);body+=line(x,T-5,x,B,INK,'stroke-dasharray="4 3"')+text(R,T-10,'Dashed line: μ = '+fmt(mean),'text-anchor="end"');}
    body+=text(18,157,'Probability / proportion','text-anchor="middle" transform="rotate(-90 18 157)"')+text(395,321,xlabel,'text-anchor="middle"');
    const desc=labels.map((label,i)=>label+': model '+pf(theory[i])+(emp?', observed '+fmt(emp[i]):'')).join('; ');
    return svg(w,h,xlabel+'. '+desc,body);
  }
  function grid(rows,n){
    const shown=rows.slice(-12),h=Math.max(160,100+shown.length*27),left=45,right=615,cw=(right-left)/n;
    let b=text(18,24,'S = success; F = failure. Gold ring = first S. B counts all S; T records the first S.');
    b+=text(664,50,'B','text-anchor="middle"')+text(721,50,'T','text-anchor="middle"');
    for(let j=0;j<n;j++)b+=text(left+cw*(j+.5),50,j+1,'text-anchor="middle" font-size="12"');
    shown.forEach((row,i)=>{
      const y=76+i*27,d=describe(row);b+=text(12,y+5,rows.length-shown.length+i+1,'font-size="11"');
      row.forEach((v,j)=>{const x=left+cw*(j+.5);b+='<circle cx="'+x+'" cy="'+y+'" r="'+Math.min(10,cw*.31)+'" fill="'+(v?'#d5e5ef':'white')+'" stroke="'+(d.t===j+1?GOLD:'#93adbe')+'" stroke-width="'+(d.t===j+1?3:1)+'"/>'+text(x,y+4,v?'S':'F','text-anchor="middle" font-size="10"');});
      b+=text(664,y+5,d.b,'text-anchor="middle" fill="'+BLUE+'"')+text(721,y+5,d.t===null?'>'+n:d.t,'text-anchor="middle" fill="'+GOLD+'"');
    });
    if(!shown.length)b+=text(395,94,'Generate sequences to see both summaries on the same rows.','text-anchor="middle"');
    b+=text(18,h-10,'Showing the latest '+shown.length+' of '+rows.length+' sequences. Each row displays only the first '+n+' trials.','font-size="13"');
    return svg(760,h,'Trial sequences and their two summaries. '+shown.map(r=>{const d=describe(r);return r.join('')+' gives B='+d.b+', T='+(d.t===null?'greater than '+n:d.t);}).join('; '),b);
  }
  function mount(root){
    if(root.dataset.dwReady)return root.dwController;root.dataset.dwReady='true';
    const first=PRESETS[root.dataset.preset]?root.dataset.preset:'reading',setting=SETTINGS[root.dataset.setting]?root.dataset.setting:'coin';
    const state={view:root.dataset.view==='trials'?'trials':'pmf',preset:first,edited:false,index:0,prob:PRESETS[first].p[0],pmfDraws:[],relation:'ge',threshold:PRESETS[first].threshold,setting,n:SETTINGS[setting].n,p:SETTINGS[setting].p,b:SETTINGS[setting].b,g:SETTINGS[setting].g,rows:[]};
    root.innerHTML='<h3>From probability weights to repeated trials</h3><p class="dw-note">Invented teaching models. Predict first, change one thing, then connect the table, graph, and observations.</p><div class="dw-tabs" aria-label="Choose an investigation"><button type="button" data-view="pmf">1 · Outcomes & probability weights</button><button type="button" data-view="trials">2 · One stream, two questions</button></div>'+
    '<section data-panel="pmf"><p class="dw-prompt">Where should repeated outcomes cluster? Can the expected value occur in one repetition? Predict which bars belong to the selected event, then simulate outcomes and compare frequencies with the model.</p><div class="dw-controls"><label>Probability model<select data-role="preset">'+Object.entries(PRESETS).map(([key,p])=>'<option value="'+key+'">'+esc(p.name)+'</option>').join('')+'</select></label><label>Event<select data-role="relation"><option value="ge">At least</option><option value="eq">Exactly</option><option value="le">At most</option></select></label><label>Value in the event<select data-role="threshold"></select></label></div><p class="dw-note" data-role="pmf-note"></p><label class="dw-toggle"><input type="checkbox" data-role="edit">Change a model probability (starts a new simulation)</label><div class="dw-controls" data-role="edit-controls" hidden><label>Outcome whose probability changes<select data-role="weight-index"></select></label><label>Its probability: <span data-role="prob-value"></span><input type="range" data-role="prob" min="0" max="1" step="0.01"></label></div><p class="dw-note" data-role="edit-note" hidden>The remaining probability is shared among the other outcomes in their original proportions. Total probability stays one. This changes the model, rather than revealing new observed data.</p><div class="dw-actions"><button type="button" class="dw-primary" data-action="outcome1">Simulate 1 outcome</button><button type="button" data-action="outcome100">Simulate 100 outcomes</button><button type="button" data-action="clear-pmf">Clear simulated outcomes</button><button type="button" data-action="restore">Restore original probabilities</button></div><div class="dw-metrics" data-role="pmf-metrics"></div><p class="dw-readout" data-role="event" aria-live="polite"></p><div class="dw-plot" tabindex="0" data-role="pmf-plot"></div><p class="dw-note">Green bars belong to the selected event. Add their model probabilities. The model is fixed during a simulation; simulated relative frequencies can differ from it. All series use the same vertical scale.</p><div class="dw-table" data-role="pmf-table"></div><p class="dw-summary" data-role="variance"></p></section>'+
    '<section data-panel="trials"><p class="dw-prompt">Read a row twice. First count successes among its n trials; then locate its first success. A row with no success has B = 0 and T &gt; n. It has not established that a success will never occur.</p><div class="dw-controls"><label>Teaching setting<select data-role="setting">'+Object.entries(SETTINGS).map(([id,v])=>'<option value="'+id+'">'+esc(v.name)+'</option>').join('')+'</select></label><label>Displayed trials n: <span data-role="n-value"></span><input type="range" data-role="n" min="1" max="20" step="1"></label><label>Success probability p: <span data-role="p-value"></span><input type="range" data-role="p" min="0.05" max="1" step="0.01"></label></div><p class="dw-note">The model assumes independent trials with a constant success probability. “Success” names the outcome counted, rather than judging whether it is desirable. Changing n or p clears the accumulated sequences.</p><div class="dw-actions"><button type="button" class="dw-primary" data-action="stream1">Generate 1 sequence</button><button type="button" data-action="stream20">Generate 20 sequences</button><button type="button" data-action="clear-streams">Clear sequences</button></div><div class="dw-metrics" data-role="trial-metrics"></div><div class="dw-plot dw-grid" tabindex="0" data-role="grid"></div><h4>Binomial: count successes in the fixed n trials</h4><div class="dw-controls"><label>Shade the event B = k<select data-role="b"></select></label></div><p class="dw-readout" data-role="b-event"></p><div class="dw-plot" tabindex="0" data-role="b-plot"></div><h4>Geometric: wait for the first success, including its trial</h4><div class="dw-controls"><label>Shade the event T = k<select data-role="g"></select></label></div><p class="dw-readout" data-role="g-event"></p><div class="dw-plot" tabindex="0" data-role="g-plot"></div><p class="dw-summary" data-role="tail"></p><p class="dw-note">The last geometric bar combines every wait beyond the displayed horizon. It is a tail probability, rather than a single waiting time. The geometric process continues beyond the displayed trials; the binomial count stops at n. Conditional continuation after n failures has the same success probability p under this model.</p><div class="dw-table" data-role="trial-table"></div></section><p class="dw-status" data-role="status" aria-live="polite"></p>';
    const el=role=>root.querySelector('[data-role="'+role+'"]');
    function probabilities(){const base=PRESETS[state.preset].p;return state.edited?reweight(base,state.index,state.prob):base.slice();}
    function options(role,vals,current){el(role).innerHTML=vals.map((v,i)=>'<option value="'+(role==='weight-index'?i:v)+'">'+esc(v)+'</option>').join('');el(role).value=String(current);}
    function renderPMF(){
      const pset=PRESETS[state.preset],x=pset.x,p=probabilities(),st=weighted(x,p),count=Array(x.length).fill(0),m=state.pmfDraws.length;
      state.pmfDraws.forEach(i=>count[i]++);const selected=x.map(v=>event(v,state.relation,state.threshold)),eventProb=p.reduce((a,v,i)=>a+(selected[i]?v:0),0),observed=count.reduce((a,v,i)=>a+(selected[i]?v:0),0);
      el('preset').value=state.preset;el('relation').value=state.relation;options('threshold',x,state.threshold);options('weight-index',x,state.index);el('prob').value=state.prob;el('prob-value').textContent=fmt(state.prob);el('edit').checked=state.edited;el('edit-controls').hidden=!state.edited;el('edit-note').hidden=!state.edited;el('pmf-note').textContent=pset.note;
      el('pmf-metrics').innerHTML=[['Model expected value μ',fmt(st.mean)],['Model standard deviation σ',fmt(st.sd)],['Simulated observations',m],['Observed sample mean',m?fmt(state.pmfDraws.reduce((a,i)=>a+x[i],0)/m):'—']].map(([a,b])=>'<div class="dw-metric"><span>'+esc(a)+'</span><strong>'+esc(b)+'</strong></div>').join('');
      const symbol=state.relation==='eq'?'=':state.relation==='le'?'≤':'≥';
      el('event').textContent='Model P(X '+symbol+' '+state.threshold+') = '+pf(eventProb)+'. '+(m?'Observed: '+observed+' / '+m+' = '+fmt(observed/m)+'.':'No outcomes simulated yet.')+' Units of X: '+pset.unit+'.';
      el('pmf-plot').innerHTML=plot(x.map(String),p,m?count.map(c=>c/m):null,selected,'Outcome x ('+pset.unit+')',x,st.mean);
      el('pmf-table').innerHTML='<table><caption>Model calculations and the accumulating observed frequencies</caption><thead><tr><th scope="col">x</th><th scope="col">P(X = x)</th><th scope="col">x · P</th><th scope="col">(x − μ)² · P</th><th scope="col">Observed count</th><th scope="col">Observed proportion</th></tr></thead><tbody>'+x.map((v,i)=>'<tr'+(selected[i]?' class="dw-event"':'')+'><th scope="row">'+fmt(v)+'</th><td>'+pf(p[i])+'</td><td>'+fmt(v*p[i])+'</td><td>'+fmt(st.terms[i])+'</td><td>'+count[i]+'</td><td>'+(m?fmt(count[i]/m):'—')+'</td></tr>').join('')+'<tr><th scope="row">Total</th><td>1</td><td>'+fmt(st.mean)+'</td><td>'+fmt(st.variance)+'</td><td>'+m+'</td><td>'+(m?'1':'—')+'</td></tr></tbody></table>';
      el('variance').textContent='Model variance σ² = '+fmt(st.variance)+' ('+pset.unit+')²; σ = '+fmt(st.sd)+' '+pset.unit+'. Probability weights already sum to one; there is no sample n − 1 adjustment in this model calculation. The mean is a long-run average, rather than a promise about an individual outcome. Calculations retain full precision.';
    }
    function renderTrials(){
      const n=state.n,p=state.p,m=state.rows.length,bt=binomial(n,p),gt=geomView(n,p),bc=Array(n+1).fill(0),gc=Array(n+1).fill(0);
      state.rows.forEach(r=>{const d=describe(r);bc[d.b]++;gc[d.t===null?n:d.t-1]++;});
      el('setting').value=state.setting;el('n').value=n;el('p').value=p;el('n-value').textContent=n;el('p-value').textContent=fmt(p,2);
      options('b',Array.from({length:n+1},(_,i)=>i),state.b);options('g',Array.from({length:n},(_,i)=>i+1),state.g);
      el('trial-metrics').innerHTML=[['Generated sequences',m],['Binomial mean E(B) = np',fmt(n*p)],['Geometric mean E(T) = 1/p',fmt(1/p)],['Binomial SD √(np(1−p))',fmt(Math.sqrt(n*p*(1-p)))]].map(([a,b])=>'<div class="dw-metric"><span>'+esc(a)+'</span><strong>'+esc(b)+'</strong></div>').join('');
      el('grid').innerHTML=grid(state.rows,n);
      el('b-event').textContent='P(B = '+state.b+') = C('+n+', '+state.b+') × '+fmt(p,2)+'^'+state.b+' × '+fmt(1-p,2)+'^'+(n-state.b)+' = '+pf(bt[state.b])+'. '+(m?'Observed: '+bc[state.b]+'/'+m+' = '+fmt(bc[state.b]/m)+'.':'');
      el('g-event').textContent='P(T = '+state.g+') = '+fmt(1-p,2)+'^'+(state.g-1)+' × '+fmt(p,2)+' = '+pf(gt[state.g-1])+'. '+(m?'Observed: '+gc[state.g-1]+'/'+m+' = '+fmt(gc[state.g-1]/m)+'.':'');
      el('b-plot').innerHTML=plot(bt.map((_,i)=>String(i)),bt,m?bc.map(c=>c/m):null,bt.map((_,i)=>i===state.b),'B: number of successes in '+n+' trials');
      el('g-plot').innerHTML=plot(Array.from({length:n},(_,i)=>String(i+1)).concat(['>'+n]),gt,m?gc.map(c=>c/m):null,gt.map((_,i)=>i===state.g-1),'T: trial of first success; final bar combines T > '+n,null,null,n);
      el('tail').textContent='No success in the first '+n+' trials: P(T > '+n+') = (1 − p)^n = '+pf((1-p)**n)+'. This is also P(B = 0). The displayed geometric masses, including that tail, sum to one.';
      el('trial-table').innerHTML='<table><caption>Two distributions from the same generated sequences</caption><thead><tr><th scope="col">Model</th><th scope="col">Value</th><th scope="col">Probability</th><th scope="col">Observed count</th><th scope="col">Observed proportion</th></tr></thead><tbody>'+bt.map((v,i)=>'<tr><th scope="row">Binomial B</th><td>'+i+'</td><td>'+pf(v)+'</td><td>'+bc[i]+'</td><td>'+(m?fmt(bc[i]/m):'—')+'</td></tr>').join('')+gt.map((v,i)=>'<tr><th scope="row">Geometric T</th><td>'+(i===n?'>'+n:i+1)+'</td><td>'+pf(v)+'</td><td>'+gc[i]+'</td><td>'+(m?fmt(gc[i]/m):'—')+'</td></tr>').join('')+'</tbody></table>';
    }
    function setView(v){state.view=v;root.querySelectorAll('[data-panel]').forEach(e=>{e.hidden=e.dataset.panel!==v;});root.querySelectorAll('[data-view]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.view===v)));}
    function render(){renderPMF();renderTrials();}
    function resetPMF(){state.pmfDraws=[];el('status').textContent='New probability model: simulated outcomes cleared.';}
    function resetStreams(){state.rows=[];el('status').textContent='New trial setting: generated sequences cleared.';}
    function drawOutcomes(n){const count=Math.min(n,10000-state.pmfDraws.length),p=probabilities();for(let i=0;i<count;i++)state.pmfDraws.push(categorical(p));renderPMF();el('status').textContent='Simulated outcomes: '+state.pmfDraws.length+' (limit 10,000). The model probabilities have stayed fixed.';}
    function drawStreams(n){const count=Math.min(n,2000-state.rows.length);for(let i=0;i<count;i++)state.rows.push(sequence(state.n,state.p));renderTrials();el('status').textContent='Generated sequences: '+state.rows.length+' (limit 2,000). Both graphs use every generated sequence.';}
    el('preset').addEventListener('change',()=>{state.preset=el('preset').value;state.edited=false;state.index=0;state.prob=PRESETS[state.preset].p[0];state.threshold=PRESETS[state.preset].threshold;resetPMF();renderPMF();});
    el('relation').addEventListener('change',()=>{state.relation=el('relation').value;renderPMF();});
    el('threshold').addEventListener('change',()=>{state.threshold=Number(el('threshold').value);renderPMF();});
    el('edit').addEventListener('change',()=>{state.edited=el('edit').checked;resetPMF();renderPMF();});
    el('weight-index').addEventListener('change',()=>{state.index=Number(el('weight-index').value);state.prob=PRESETS[state.preset].p[state.index];resetPMF();renderPMF();});
    el('prob').addEventListener('input',()=>{state.prob=Number(el('prob').value);resetPMF();renderPMF();});
    el('setting').addEventListener('change',()=>{state.setting=el('setting').value;const d=SETTINGS[state.setting];state.n=d.n;state.p=d.p;state.b=d.b;state.g=d.g;resetStreams();renderTrials();});
    ['n','p'].forEach(role=>el(role).addEventListener('input',()=>{state[role]=Number(el(role).value);state.b=Math.min(state.b,state.n);state.g=Math.min(state.g,state.n);resetStreams();renderTrials();}));
    ['b','g'].forEach(role=>el(role).addEventListener('change',()=>{state[role]=Number(el(role).value);renderTrials();}));
    root.querySelectorAll('[data-view]').forEach(e=>e.addEventListener('click',()=>setView(e.dataset.view)));
    const actions={outcome1:()=>drawOutcomes(1),outcome100:()=>drawOutcomes(100),'clear-pmf':()=>{resetPMF();renderPMF();},restore:()=>{state.edited=false;state.prob=PRESETS[state.preset].p[state.index];resetPMF();renderPMF();},stream1:()=>drawStreams(1),stream20:()=>drawStreams(20),'clear-streams':()=>{resetStreams();renderTrials();}};
    Object.entries(actions).forEach(([name,f])=>root.querySelector('[data-action="'+name+'"]').addEventListener('click',f));
    render();setView(state.view);root.dwController={state,probabilities,drawOutcomes,drawStreams,setView,render};return root.dwController;
  }
  window.DiscreteWorkbench={presets:PRESETS,settings:SETTINGS,weighted,reweight,categorical,combination,binomial,geometric,geomView,sequence,describe,mount};
  function boot(){document.querySelectorAll('.discrete-workbench').forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
