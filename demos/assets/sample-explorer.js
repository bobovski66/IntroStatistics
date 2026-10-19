/* Linked, dependency-free Week 1 investigations. Presets are teaching examples. */
(function () {
  'use strict';
  const BLUE='#245a81', TEAL='#287d76', GOLD='#a16a13', INK='#182e40', GRID='#d6e1e7';
  const PRESETS={
    study:{name:'Reading: five weekly study times',values:[3,7,7,2,6],unit:'hours',label:'Weekly study time (hours)',extra:25,limit:40,note:'Five invented study-time records. Repeated values belong to different students.'},
    sleep:{name:'Reading: ten sleep reports',values:[5,6,6,7,7,7,7,8,8,9],unit:'hours',label:'Sleep last night (hours)',extra:12,limit:24,note:'Ten invented reports, recorded to the nearest hour. Sleep duration is a continuous measurement.'},
    coffee:{name:'Lab: cups of coffee',values:[0,1,2,1,3,0,2,1,0,2],unit:'cups',label:'Cups of coffee yesterday',extra:10,limit:12,note:'The lab’s ten invented student reports. Zero cups is an observation, not missing data.'},
    texts:{name:'Lab: messages sent',values:[12,25,8,31,14],unit:'messages',label:'Text messages sent yesterday',extra:500,limit:600,note:'The lab’s five invented friend reports. Adding a sixth friend changes the sample size as well as its values.'},
    footprints:{name:'Discussion: twelve footprint lengths',values:[31,32,32,33,34,34,35,35,36,37,38,52],unit:'cm',label:'Footprint length (cm)',extra:52,limit:70,omit:true,note:'The discussion’s invented case: one impression per row. Several impressions could come from the same source.'}
  };
  const POPULATION=[2,3,4,5,6,7,8,9,10,12,14,16,18,20,22,24,26,28,30,32,35,38,42,45];
  function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function fmt(x,d=3){return x===null||!Number.isFinite(x)?'undefined':Number(x.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d});}
  function summary(values){
    const a=values.slice().sort((a,b)=>a-b),n=a.length;
    if(!n)return {n:0,mean:null,median:null,ss:0,variance:null,sd:null,deviations:[]};
    if(!a.every(Number.isFinite))throw Error('Every observation must be finite.');
    const mean=a.reduce((s,x)=>s+x,0)/n,mid=Math.floor(n/2),median=n%2?a[mid]:(a[mid-1]+a[mid])/2;
    const deviations=values.map(x=>x-mean),ss=deviations.reduce((s,d)=>s+d*d,0),variance=n>1?ss/(n-1):null;
    return {n,mean,median,ss,variance,sd:variance===null?null:Math.sqrt(variance),deviations};
  }
  function exact(values){
    const counts=new Map();values.forEach(x=>counts.set(x,(counts.get(x)||0)+1));
    const rows=Array.from(counts,([value,count])=>({value,count})).sort((a,b)=>a.value-b.value);
    const gaps=rows.slice(1).map((r,i)=>r.value-rows[i].value);
    const step=gaps.length?Math.min(...gaps):1,digits=Math.max(3,Math.min(12,Math.ceil(-Math.log10(step))+1));
    return rows.map(r=>({label:fmt(r.value,digits),count:r.count}));
  }
  function histogram(values,k){
    if(!values.length)return [];
    k=Math.max(1,Math.floor(k));let lo=Math.min(...values),hi=Math.max(...values);
    if(lo===hi){lo-=.5;hi+=.5;k=1;}
    const width=(hi-lo)/k,digits=Math.max(3,Math.min(12,Math.ceil(-Math.log10(width))+1)),rows=Array.from({length:k},(_,i)=>({lo:lo+i*width,hi:lo+(i+1)*width,count:0}));
    values.forEach(x=>rows[Math.min(k-1,Math.max(0,Math.floor((x-lo)/width)))].count++);
    return rows.map((r,i)=>Object.assign(r,{label:'['+fmt(r.lo,digits)+', '+fmt(r.hi,digits)+(i===k-1?']':')')}));
  }
  function drawIndices(n,frameSize,rng=Math.random){
    if(!Number.isInteger(n)||n<1||n>frameSize)throw Error('Invalid sample size.');
    const a=Array.from({length:frameSize},(_,i)=>i);
    for(let i=0;i<n;i++){const j=i+Math.floor(rng()*(frameSize-i));[a[i],a[j]]=[a[j],a[i]];}
    return a.slice(0,n);
  }
  function svg(width,height,label,body){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title><rect width="100%" height="100%" fill="white"/><g font-family="system-ui, sans-serif" fill="'+INK+'" font-size="14">'+body+'</g></svg>';}
  function text(x,y,t,extra=''){return '<text x="'+x+'" y="'+y+'" '+extra+'>'+esc(t)+'</text>';}
  function line(x1,y1,x2,y2,color=GRID,extra=''){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" '+extra+'/>';}
  function circle(x,y,r,color,extra=''){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+'" '+extra+'/>';}
  function axis(lo,hi,left=65,right=725){if(lo===hi){lo-=1;hi+=1;}const pad=(hi-lo)*.08;lo-=pad;hi+=pad;return {lo,hi,x:v=>left+(v-lo)/(hi-lo)*(right-left)};}
  function ticks(scale,y,label){let s=line(65,y,725,y,'#718997');for(let i=0;i<=5;i++){const v=scale.lo+(scale.hi-scale.lo)*i/5,x=scale.x(v);s+=line(x,y,x,y+5,'#718997')+text(x,y+24,fmt(v,1),'text-anchor="middle"');}return s+text(395,y+48,label,'text-anchor="middle"');}
  function dotComparison(base,current,label){
    const all=base.concat(current),sc=axis(Math.min(...all),Math.max(...all));
    let body=text(18,24,'Solid blue: mean. Dashed green: median. Each dot is one observation.');
    [base,current].forEach((values,i)=>{
      const st=summary(values),y=120+i*135,counts=new Map();
      body+=text(18,y-65,(i?'Current':'Original')+' sample: n = '+st.n+', mean = '+fmt(st.mean)+', median = '+fmt(st.median));
      body+=line(65,y,725,y);
      values.forEach(v=>{const h=(counts.get(v)||0);counts.set(v,h+1);body+=circle(sc.x(v),y-10-h*14,5.5,BLUE);});
      body+=line(sc.x(st.mean),y-37,sc.x(st.mean),y+7,BLUE,'stroke-width="2.5"');
      body+=line(sc.x(st.median),y-37,sc.x(st.median),y+7,TEAL,'stroke-width="2.5" stroke-dasharray="4 3"');
    });
    body+=ticks(sc,279,label);
    return svg(760,340,'Original and current samples on a common numerical scale. '+[base,current].map((v,i)=>(i?'Current':'Original')+' values: '+v.join(', ')).join('. '),body);
  }
  function countPlot(rows,hist,n,label){
    const W=760,H=320,left=65,right=725,top=43,bottom=244,max=Math.max(1,...rows.map(r=>r.count)),slot=(right-left)/rows.length;
    let b=text(18,24,(hist?'Equal-width numerical intervals touch.':'Distinct values label the bars; spacing does not show numerical gaps.')+' n = '+n+'.');
    for(let i=0;i<=max;i++){const y=bottom-i/max*(bottom-top);b+=line(left,y,right,y)+text(left-10,y+5,i,'text-anchor="end"');}
    rows.forEach((r,i)=>{const gap=hist?0:slot*.22,x=left+i*slot+gap/2,w=slot-gap,y=bottom-r.count/max*(bottom-top);
      b+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+(bottom-y)+'" fill="#c8dfdc" stroke="'+TEAL+'"/>';
      b+=text(x+w/2,y-7,r.count,'text-anchor="middle"');
      if(!hist)b+=text(x+w/2,bottom+23,r.label,'text-anchor="middle"');
    });
    if(hist)rows.forEach((r,i)=>{b+=text(left+i*slot,bottom+23,fmt(r.lo,2),'text-anchor="middle"');if(i===rows.length-1)b+=text(right,bottom+23,fmt(r.hi,2),'text-anchor="middle"');});
    b+=text(18,150,'Frequency','text-anchor="middle" transform="rotate(-90 18 150)"')+text(395,304,label,'text-anchor="middle"');
    return svg(W,H,'Frequency '+(hist?'histogram':'bar chart')+'. '+rows.map(r=>r.label+': '+r.count).join('; '),b);
  }
  function populationPlot(indices,frame){
    let b=text(18,24,'Invented population: all 24 commute times are known here.');
    const eligible=frame==='near'?12:24;
    POPULATION.forEach((v,i)=>{const x=55+(i%12)*59,y=75+Math.floor(i/12)*65,inSample=indices.includes(i),inFrame=i<eligible;
      b+='<rect x="'+(x-24)+'" y="'+(y-23)+'" width="48" height="47" rx="7" fill="'+(inSample?'#c8dfdc':inFrame?'#f0f5f8':'#eee')+'" stroke="'+(inSample?TEAL:'#b6c8d3')+'" stroke-width="'+(inSample?3:1)+'"/>';
      b+=text(x,y-2,v,'text-anchor="middle"')+text(x,y+15,'#'+(i+1),'text-anchor="middle" font-size="10"');
    });
    b+=text(18,190,'Numbers are minutes. Outlined cards are selected.')+text(18,212,'Gray cards cannot be selected in the near-campus frame.');
    return svg(760,232,'Population of 24 students, commute minutes '+POPULATION.join(', ')+'. Selected student numbers '+indices.map(i=>i+1).join(', ')+'. Sampling frame '+frame+'.',b);
  }
  function historyPlot(history){
    const height=Math.max(210,130+history.length*24),mu=summary(POPULATION).mean,sc={lo:0,hi:45,x:v=>65+v/45*660};let b='';
    b+=text(18,24,'One row per collected sample; newest at the top. Green line: fixed population mean μ = '+fmt(mu)+'.');
    b+=line(sc.x(mu),40,sc.x(mu),height-65,TEAL,'stroke-width="2"');
    history.slice().reverse().forEach((h,i)=>{const y=58+i*24;b+=line(sc.x(mu),y,sc.x(h.mean),y,'#a5b9c7');b+=circle(sc.x(h.mean),y,5,BLUE);b+=text(18,y+5,'#'+(history.length-i));});
    if(!history.length)b+=text(395,88,'Draw a sample to begin the stack.','text-anchor="middle"');
    b+=ticks(sc,height-62,'Sample mean commute time (minutes)');
    return svg(760,height,'Stack of '+history.length+' sample means. Population mean '+fmt(mu)+'. Sample means in collection order: '+history.map(h=>fmt(h.mean)).join(', ')+'.',b);
  }
  function mount(root){
    if(root.dataset.seReady)return root.seController;
    root.dataset.seReady='true';
    const initial=PRESETS[root.dataset.preset]?root.dataset.preset:'study';
    const state={preset:initial,view:root.dataset.view==='sampling'?'sampling':root.dataset.view==='count'?'count':'center',extra:PRESETS[initial].extra,active:!!PRESETS[initial].omit,display:'exact',bins:5,frame:'all',n:8,indices:[],history:[]};
    root.innerHTML='<h3>From observations to a statistical description</h3><p class="se-note">Predict a change, try it, then explain what the linked representations reveal. These are invented teaching datasets.</p>'+
      '<div class="se-tabs" aria-label="Choose an investigation"><button type="button" data-view="count">1 · Count & graph</button><button type="button" data-view="center">2 · Center & spread</button><button type="button" data-view="sampling">3 · Collect samples</button></div>'+
      '<div data-role="data-controls"><div class="se-controls"><label>Teaching dataset<select data-role="preset">'+Object.entries(PRESETS).map(([id,p])=>'<option value="'+id+'">'+esc(p.name)+'</option>').join('')+'</select></label><label data-role="extra-label">Extra observation: <span data-role="extra-value"></span><input type="range" data-role="extra" min="0" step="1"></label></div>'+
      '<label class="se-toggle"><input type="checkbox" data-role="active"><span data-role="active-label"></span></label><p class="se-note" data-role="dataset-note"></p><p class="se-data" data-role="values"></p><div class="se-actions"><button type="button" data-action="restore">Restore this dataset</button></div></div>'+
      '<section data-panel="count"><p class="se-prompt">Before changing the display: how many observations are there? What does one bar count? Try a different bin count. Do the observations or their mean change?</p><div class="se-controls"><label>Graph type<select data-role="display"><option value="exact">Exact recorded values</option><option value="histogram">Numerical intervals (histogram)</option></select></label><label data-role="bins-label">Number of equal-width bins<select data-role="bins"><option>3</option><option selected>5</option><option>8</option></select></label></div><div class="se-plot" tabindex="0" data-role="count-plot"></div><p class="se-note">Histogram intervals include their left endpoint and exclude the right; the last includes both endpoints. All observations are counted once. A relative frequency describes this sample; it is not automatically a population probability.</p><div class="se-table" data-role="counts"></div></section>'+
      '<section data-panel="center"><p class="se-prompt">Predict the effect of the extra or unusually large observation on the mean, median, and standard deviation. Then change the checkbox and compare on the same axis.</p><div class="se-metrics" data-role="metrics"></div><div class="se-plot" tabindex="0" data-role="dots"></div><p class="se-summary" data-role="comparison" aria-live="polite"></p><h4>Find the median in the sorted observations</h4><ol class="se-sorted" data-role="sorted" aria-label="Sorted values; the middle position or positions are highlighted"></ol><p class="se-note">The small numbers show positions. Green borders mark the middle position(s). With even n, average the two middle values. Adding an observation can move the median by changing n.</p><h4>Build spread from the mean</h4><div class="se-table" data-role="deviations"></div><p class="se-summary" data-role="spread"></p><p class="se-note">Displayed values are rounded; calculations retain full precision. The standard deviation is in the original units. It is not literally the average absolute distance from the mean. The sample formula requires at least two observations.</p></section>'+
      '<section data-panel="sampling"><p class="se-prompt">The population stays fixed while a sample changes. Collect several samples from all 24 students, then try the near-campus frame. Can a sample miss the population mean even when selected randomly? Can repeated sampling fix a frame that leaves students out?</p><div class="se-controls"><label>Who can enter the sample?<select data-role="frame"><option value="all">All 24 students</option><option value="near">Near campus only (shortest 12 commutes)</option></select></label><label>Students in each sample<select data-role="n"><option>4</option><option selected>8</option><option>12</option></select></label></div><div class="se-actions"><button type="button" class="se-primary" data-action="draw">Draw one random sample</button><button type="button" data-action="draw10">Collect 10 samples</button><button type="button" data-action="clear">Clear sample stack</button></div><p class="se-readout" data-role="sample-status" aria-live="polite"></p><div class="se-plot" tabindex="0" data-role="population"></div><p class="se-data" data-role="sample-values"></p><div class="se-plot" tabindex="0" data-role="history"></div><p class="se-note">Selection is without replacement within each sample; students can appear again in the next sample. The near-campus setting randomly selects only from the shortest 12 commutes, deliberately illustrating an incomplete sampling frame. It cannot represent long commuters who have no chance of selection. Changing the frame or sample size starts a new stack. The stack holds up to 30 samples.</p><p class="se-note">Knowing every population value is a feature of this teaching model. In a real study, the population mean is usually unknown. These rows show sample means, rather than confidence intervals; later weeks will build intervals around estimates.</p><div class="se-table" data-role="sample-table"></div></section>';
    const el=role=>root.querySelector('[data-role="'+role+'"]');
    el('preset').value=initial;
    function values(){const p=PRESETS[state.preset];return p.omit?(state.active?p.values.slice():p.values.slice(0,-1)):(state.active?p.values.concat([state.extra]):p.values.slice());}
    function renderData(){
      const p=PRESETS[state.preset],v=values(),st=summary(v),base=summary(p.values);
      el('extra').max=p.limit;el('extra').value=state.extra;el('extra-value').textContent=state.extra+' '+p.unit;
      el('extra-label').hidden=!!p.omit;el('active').checked=state.active;
      el('active-label').textContent=p.omit?'Include the 52 cm impression (uncheck only for a sensitivity comparison)':'Add one extra observation';
      el('dataset-note').textContent=p.note+' Exploration does not alter the original case. Restore returns the original observations.';
      el('values').textContent='Current observations ('+p.unit+'): '+v.join(', ')+'. n = '+v.length+'.';
      const rows=state.display==='histogram'?histogram(v,state.bins):exact(v);
      el('bins-label').hidden=state.display!=='histogram';el('count-plot').innerHTML=countPlot(rows,state.display==='histogram',v.length,p.label);
      el('counts').innerHTML='<table><caption>Counts and proportions in the current sample</caption><thead><tr><th scope="col">'+(state.display==='histogram'?'Interval':'Recorded value')+'</th><th scope="col">Count</th><th scope="col">Count / n</th><th scope="col">Percent</th></tr></thead><tbody>'+rows.map(r=>'<tr><th scope="row">'+esc(r.label)+'</th><td>'+r.count+'</td><td>'+r.count+'/'+v.length+' = '+fmt(r.count/v.length)+'</td><td>'+fmt(100*r.count/v.length,1)+'%</td></tr>').join('')+'<tr><th scope="row">Total</th><td>'+v.length+'</td><td>1</td><td>100%</td></tr></tbody></table>';
      el('metrics').innerHTML=[['Observations n',st.n],['Mean',fmt(st.mean)],['Median',fmt(st.median)],['Sample SD',fmt(st.sd)]].map(([k,val])=>'<div class="se-metric"><span>'+esc(k)+'</span><strong>'+esc(val)+'</strong></div>').join('');
      el('dots').innerHTML=dotComparison(p.values,v,p.label);
      el('comparison').textContent='Change from the original: mean '+fmt(st.mean-base.mean)+', median '+fmt(st.median-base.median)+', sample SD '+fmt(st.sd-base.sd)+' '+p.unit+'. An unusual value calls for checking its context; sensitivity alone does not justify deleting it.';
      const sorted=v.slice().sort((a,b)=>a-b),mid=Math.floor(v.length/2);
      el('sorted').innerHTML=sorted.map((x,i)=>'<li'+((v.length%2?i===mid:i===mid-1||i===mid)?' class="se-middle"':'')+'>'+esc(fmt(x))+'</li>').join('');
      el('deviations').innerHTML='<table><caption>Every observation is measured from the current sample mean</caption><thead><tr><th scope="col">Record</th><th scope="col">Value ('+esc(p.unit)+')</th><th scope="col">Value − mean</th><th scope="col">Deviation²</th></tr></thead><tbody>'+v.map((x,i)=>'<tr><th scope="row">'+(i+1)+'</th><td>'+fmt(x)+'</td><td>'+fmt(st.deviations[i])+'</td><td>'+fmt(st.deviations[i]**2)+'</td></tr>').join('')+'<tr><th scope="row">Total</th><td>'+fmt(v.reduce((a,b)=>a+b,0))+'</td><td>0 (up to computation error)</td><td>'+fmt(st.ss)+'</td></tr></tbody></table>';
      el('spread').textContent='Squared deviations total '+fmt(st.ss)+' '+p.unit+'². Divide by n − 1 = '+(st.n-1)+' to obtain sample variance '+fmt(st.variance)+' '+p.unit+'². Take its square root: s = '+fmt(st.sd)+' '+p.unit+'.';
    }
    function renderSamples(){
      const mu=summary(POPULATION).mean,frameMean=summary(POPULATION.slice(0,state.frame==='near'?12:24)).mean;
      el('population').innerHTML=populationPlot(state.indices,state.frame);
      const st=summary(state.indices.map(i=>POPULATION[i]));
      el('sample-values').textContent=st.n?'Latest sample: '+state.indices.map(i=>POPULATION[i]).join(', ')+' minutes. n = '+st.n+'; sample mean x̄ = '+fmt(st.mean)+' minutes; population mean μ = '+fmt(mu)+' minutes.':'No sample collected yet. Population mean μ = '+fmt(mu)+' minutes; mean of the selectable frame = '+fmt(frameMean)+' minutes.';
      el('history').innerHTML=historyPlot(state.history);
      el('sample-table').innerHTML='<table><caption>Collected sample means for the current setting</caption><thead><tr><th scope="col">Sample</th><th scope="col">n</th><th scope="col">Mean (minutes)</th><th scope="col">Mean − μ</th></tr></thead><tbody>'+state.history.map((h,i)=>'<tr><th scope="row">'+(i+1)+'</th><td>'+state.n+'</td><td>'+fmt(h.mean)+'</td><td>'+fmt(h.mean-mu)+'</td></tr>').join('')+'</tbody></table>';
    }
    function setView(view){
      state.view=view;
      root.querySelectorAll('[data-panel]').forEach(p=>{p.hidden=p.dataset.panel!==view;});
      root.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
      el('data-controls').hidden=view==='sampling';
    }
    function draw(count){
      const left=30-state.history.length,total=Math.min(count,left);
      for(let i=0;i<total;i++){state.indices=drawIndices(state.n,state.frame==='near'?12:24);state.history.push({mean:summary(state.indices.map(i=>POPULATION[i])).mean});}
      renderSamples();
      el('sample-status').textContent=total?'Collected '+total+' sample'+(total===1?'':'s')+'. The stack now has '+state.history.length+'.':'The stack has 30 samples. Clear it to begin again.';
    }
    root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
    root.querySelector('[data-action="restore"]').addEventListener('click',()=>{state.extra=PRESETS[state.preset].extra;state.active=!!PRESETS[state.preset].omit;renderData();});
    el('preset').addEventListener('change',()=>{state.preset=el('preset').value;state.extra=PRESETS[state.preset].extra;state.active=!!PRESETS[state.preset].omit;renderData();});
    el('active').addEventListener('change',()=>{state.active=el('active').checked;renderData();});
    el('extra').addEventListener('input',()=>{state.extra=Number(el('extra').value);renderData();});
    el('display').addEventListener('change',()=>{state.display=el('display').value;renderData();});
    el('bins').addEventListener('change',()=>{state.bins=Number(el('bins').value);renderData();});
    ['frame','n'].forEach(role=>el(role).addEventListener('change',()=>{state[role]=role==='n'?Number(el(role).value):el(role).value;state.indices=[];state.history=[];el('sample-status').textContent='New setting: the previous sample stack has been cleared.';renderSamples();}));
    root.querySelector('[data-action="draw"]').addEventListener('click',()=>draw(1));
    root.querySelector('[data-action="draw10"]').addEventListener('click',()=>draw(10));
    root.querySelector('[data-action="clear"]').addEventListener('click',()=>{state.indices=[];state.history=[];el('sample-status').textContent='Sample stack cleared.';renderSamples();});
    renderData();renderSamples();setView(state.view);
    root.seController={state,values,renderData,renderSamples,setView,draw};
    return root.seController;
  }
  window.SampleExplorer={summary,exact,histogram,drawIndices,presets:PRESETS,population:POPULATION.slice(),mount};
  function boot(){document.querySelectorAll('.sample-explorer').forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
