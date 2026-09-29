from pathlib import Path
import json, re, html

ROOT = Path(__file__).resolve().parents[1]
course_files = [p for p in [ROOT/'index.html', ROOT/'Math146_Course_LMS.html'] if p.exists()]
if not course_files:
    raise SystemExit('No course page found')

source = (ROOT/'index.html').read_text(encoding='utf-8')
m = re.search(r'const ASSESSMENTS = (\{.*?\});\nconst STORAGE_KEY', source, re.S)
if not m:
    raise SystemExit('Could not locate ASSESSMENTS in index.html')
assessments = json.loads(m.group(1))

for n in range(1, 11):
    key = f'week{n}'
    a = assessments[key]
    old = a['title']
    topic = old.split('—', 1)[1].strip() if '—' in old else old.replace(f'Week {n} Quiz', '').strip(' -')
    a['title'] = f'Week {n} Assessed Practice — {topic}'

new_assessments = json.dumps(assessments, ensure_ascii=False)

def update_course(text):
    mm = re.search(r'const ASSESSMENTS = (\{.*?\});\nconst STORAGE_KEY', text, re.S)
    if not mm:
        raise RuntimeError('Could not locate ASSESSMENTS block')
    text = text[:mm.start(1)] + new_assessments + text[mm.end(1):]

    replacements = [
        ('Quizzes use mastery checking: a missed answer remains open, a correct answer is saved, and you may try as often as needed.',
         'Assessed Practice uses retry-until-correct checking: a missed answer remains open, a correct answer is saved, and you may try as often as needed.'),
        ('<div class="label">Quiz mastery</div>', '<div class="label">Assessed Practice</div>'),
        ('<div class="sub">Weekly quizzes completed</div>', '<div class="sub">Weekly practices completed</div>'),
        ('a Discussion prompt, and a Weekly Quiz.', 'a Discussion prompt, and Assessed Practice.'),
        ('<th>Quiz</th>', '<th>Assessed Practice</th>'),
        ('A quiz or exam score is the percentage of questions currently mastered.', 'An Assessed Practice or exam score is the percentage of questions currently correct.'),
        ('<div class="eyebrow">Mastery assessment</div>', '<div class="eyebrow">Assessment</div>'),
        ('<div class="resource-kind">Weekly Quiz</div>', '<div class="resource-kind">Assessed Practice</div>'),
        ('Master each question before the quiz is marked complete.', 'Work until each question is correct. You may retry as often as needed.'),
        ("${qs.correct?'Continue quiz':'Open quiz'}", "${qs.correct?'Continue practice':'Open practice'}"),
    ]
    for old, new in replacements:
        text = text.replace(old, new)

    old_button = '<button class="primary-btn" data-open-assessment="${w.quiz}">${qs.correct?\'Continue practice\':\'Open practice\'}</button>'
    new_button = '<a class="primary-btn" style="text-decoration:none;display:inline-block" href="assessed_practice/week${w.week}.html">${qs.correct?\'Continue practice\':\'Open practice\'}</a>'
    if old_button not in text:
        raise RuntimeError('Weekly practice button template was not found')
    text = text.replace(old_button, new_button)

    old_next = "if(!assessmentStats(w.quiz).complete)return {week:w.week,title:`Week ${w.week}: Finish the mastery quiz`,detail:`${assessmentStats(w.quiz).correct} of ${assessmentStats(w.quiz).total} questions mastered`,assessment:w.quiz,action:'Open quiz'};"
    new_next = "if(!assessmentStats(w.quiz).complete)return {week:w.week,title:`Week ${w.week}: Finish the assessed practice`,detail:`${assessmentStats(w.quiz).correct} of ${assessmentStats(w.quiz).total} questions correct`,url:`assessed_practice/week${w.week}.html`,action:'Open practice'};"
    if old_next not in text:
        raise RuntimeError('Weekly next-action template was not found')
    text = text.replace(old_next, new_next)

    old_handler = "if(n.assessment)openAssessment(n.assessment);\n    else if(n.weekJump)"
    new_handler = "if(n.url)location.href=n.url;\n    else if(n.assessment)openAssessment(n.assessment);\n    else if(n.weekJump)"
    if old_handler not in text:
        raise RuntimeError('Next-action handler was not found')
    text = text.replace(old_handler, new_handler)

    text = text.replace('Quiz mastery', 'Assessed Practice')
    text = text.replace('Weekly quizzes completed', 'Weekly practices completed')
    return text

for p in course_files:
    p.write_text(update_course(p.read_text(encoding='utf-8')), encoding='utf-8')

practice_dir = ROOT/'assessed_practice'
practice_dir.mkdir(exist_ok=True)

css = '''
:root{color-scheme:light;--bg:#eef1f3;--panel:#fbfaf6;--card:#fffdf8;--card2:#f4f1e9;--ink:#182532;--muted:#5f6b73;--line:#d5d7d3;--nav:#183149;--accent:#2e6386;--good:#2f7151;--goodsoft:#e5f1e9;--bad:#9b493b;--badsoft:#f6e5e1;--warn:#8a6519;--warnsoft:#f7edcf;--shadow:0 10px 28px rgba(25,38,48,.08)}
html[data-theme="dark"]{color-scheme:dark;--bg:#111820;--panel:#17222c;--card:#1d2933;--card2:#24333e;--ink:#edf2f4;--muted:#aebbc3;--line:#3b4b56;--nav:#0d1720;--accent:#83b7d7;--good:#8fd0aa;--goodsoft:#203c2e;--bad:#eda594;--badsoft:#462d2b;--warn:#e0c275;--warnsoft:#43391e;--shadow:0 12px 30px rgba(0,0,0,.25)}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input{font:inherit}a{color:var(--accent)}
.top{position:sticky;top:0;z-index:10;background:var(--nav);color:#fff;box-shadow:0 3px 12px rgba(0,0,0,.18)}.topin{max-width:900px;margin:auto;padding:10px 16px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.top a{color:#fff;text-decoration:none;font-weight:750}.top .spacer{flex:1}.theme{border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;border-radius:8px;padding:7px 10px;cursor:pointer}
main{max-width:900px;margin:auto;padding:28px 16px 80px}.head{margin-bottom:20px}.eyebrow{font-size:.77rem;text-transform:uppercase;letter-spacing:.1em;color:var(--accent);font-weight:850}.head h1{font-size:clamp(1.75rem,4vw,2.4rem);margin:5px 0 7px;line-height:1.12}.head p{color:var(--muted);max-width:72ch}.namebox{margin:16px 0 4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.namebox label{font-size:.86rem;color:var(--muted);font-weight:700}.namebox input{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:8px;padding:8px 9px;min-width:220px}
.notice{border-left:5px solid var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--card));padding:12px 14px;border-radius:10px;margin:14px 0}.progressbox{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin:18px 0}.track{height:9px;background:var(--card2);border-radius:99px;overflow:hidden;border:1px solid var(--line)}.fill{height:100%;width:0;background:var(--good);transition:width .2s}.score{font-weight:850;white-space:nowrap}
.q{background:var(--card);border:1px solid var(--line);border-radius:15px;padding:18px;margin:13px 0;box-shadow:var(--shadow)}.q.mastered{border-color:color-mix(in srgb,var(--good) 55%,var(--line));background:color-mix(in srgb,var(--goodsoft) 45%,var(--card))}.qnum{font-size:.76rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:850}.prompt{font-size:1.03rem;font-weight:680;margin:7px 0 12px}.options{display:grid;gap:8px}.opt{display:flex;gap:9px;align-items:flex-start;border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--card2)}.opt input{margin-top:3px;accent-color:var(--accent)}.num{max-width:290px;border:1px solid var(--line);background:var(--card2);color:var(--ink);border-radius:9px;padding:9px 10px}.fb{min-height:1.25em;margin-top:9px;font-size:.91rem}.fb.good{color:var(--good)}.fb.bad{color:var(--bad)}.fb.warn{color:var(--warn)}
.footer{position:sticky;bottom:12px;display:flex;justify-content:space-between;gap:10px;align-items:center;background:color-mix(in srgb,var(--panel) 95%,transparent);backdrop-filter:blur(10px);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin-top:18px;box-shadow:var(--shadow)}.primary,.secondary{border-radius:9px;padding:9px 13px;font-weight:780;cursor:pointer}.primary{border:1px solid var(--accent);background:var(--accent);color:#fff}.secondary{border:1px solid var(--line);background:var(--card);color:var(--ink)}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.small{color:var(--muted);font-size:.86rem}
@media(max-width:650px){.progressbox{grid-template-columns:1fr}.footer{align-items:flex-start;flex-direction:column}.top .spacer{display:none}.topin{gap:7px}}@media print{.top,.footer,.actions,.theme{display:none!important}body{background:#fff}main{max-width:none;padding:0}.q{box-shadow:none;break-inside:avoid}.notice{border:1px solid #bbb}}
'''

def make_page(n, a):
    data = json.dumps(a, ensure_ascii=False).replace('</', '<\\/')
    return f'''<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(a['title'])}</title><style>{css}</style></head><body>
<div class="top"><div class="topin"><a href="../index.html">← MATH&amp; 146 course</a><span class="spacer"></span><a href="index.html">All Assessed Practice</a><button class="theme" id="themeBtn">☾ Theme</button></div></div>
<main><header class="head"><div class="eyebrow">MATH&amp; 146 · Assessed Practice</div><h1>{html.escape(a['title'])}</h1><p>{html.escape(a['subtitle'])}</p><div class="namebox"><label for="studentName">Student name</label><input id="studentName" type="text" placeholder="Enter your name"></div></header>
<div class="notice">Work until each question is correct. You may check as often as needed. A correct response locks in; a missed response stays open and gives a small hint rather than the answer. Numerical responses accept the same gentle rounding tolerance used on the course page.</div>
<div class="progressbox"><div class="track"><div class="fill" id="fill"></div></div><div class="score" id="score">0 of {len(a['questions'])} correct</div></div><div id="questions"></div>
<div class="footer"><span id="foot">Enter what you know, then check your current answers.</span><button class="primary" id="check">Check my current answers</button></div>
<div class="actions"><button class="secondary" onclick="window.print()">Print / Save PDF</button><button class="secondary" id="reset">Reset this practice</button><a class="secondary" style="text-decoration:none" href="../index.html">Return to course</a></div><p class="small">Progress is saved in this browser and uses the same course record as the main MATH&amp; 146 page. Nothing is submitted automatically.</p></main>
<script>
const PRACTICE={data}; const ID='week{n}'; const KEY='math146_lms_state_v1';
function load(){{try{{return JSON.parse(localStorage.getItem(KEY))||{{}}}}catch(e){{return {{}}}}}}
let state=load(); state.tasks=state.tasks||{{}}; state.assessments=state.assessments||{{}}; state.assessments[ID]=state.assessments[ID]||{{answers:{{}},mastered:[],checks:0,lastScore:0}}; state.studentName=state.studentName||''; state.theme=state.theme||'light';
const ps=()=>state.assessments[ID]; const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
function esc(s){{return String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}}
function num(v){{if(v==null)return NaN;let s=String(v).trim().replaceAll(',','');if(s.endsWith('%'))s=String(parseFloat(s)/100);return Number(s)}}
function correct(q,v){{if(q.type==='mc')return v===q.answer;const x=num(v);if(!Number.isFinite(x))return false;const t=q.tolerance??.001;return Math.abs(x-q.answer)<=t||Math.abs(x-q.answer)<=t*Math.max(1,Math.abs(q.answer))}}
function capture(){{const s=ps();PRACTICE.questions.forEach(q=>{{if((s.mastered||[]).includes(q.id))return;if(q.type==='mc'){{const x=document.querySelector(`input[name="${{q.id}}"]:checked`);if(x)s.answers[q.id]=x.value}}else{{const x=document.querySelector(`[data-q="${{q.id}}"]`);if(x)s.answers[q.id]=x.value}}}});save()}}
function render(){{const s=ps(),mastered=new Set(s.mastered||[]),box=document.getElementById('questions');box.innerHTML=PRACTICE.questions.map((q,i)=>{{const done=mastered.has(q.id),ans=s.answers?.[q.id]??'';let input;if(q.type==='mc')input=`<div class="options">${{q.options.map(o=>`<label class="opt"><input type="radio" name="${{q.id}}" value="${{esc(o)}}" ${{ans===o?'checked':''}} ${{done?'disabled':''}}><span>${{o}}</span></label>`).join('')}}</div>`;else input=`<input class="num" data-q="${{q.id}}" inputmode="decimal" type="text" value="${{esc(ans)}}" placeholder="${{q.placeholder||'Enter a number'}}" ${{done?'disabled':''}}>`;return `<article class="q ${{done?'mastered':''}}" data-card="${{q.id}}"><div class="qnum">Question ${{i+1}} of ${{PRACTICE.questions.length}}</div><div class="prompt">${{q.prompt}}</div>${{input}}<div class="fb ${{done?'good':''}}" id="fb-${{q.id}}">${{done?q.success:''}}</div></article>`}}).join('');box.querySelectorAll('input').forEach(x=>x.addEventListener('change',capture));box.querySelectorAll('[data-q]').forEach(x=>x.addEventListener('input',capture));update()}}
function update(){{const s=ps(),c=(s.mastered||[]).length,t=PRACTICE.questions.length,p=100*c/t;document.getElementById('score').textContent=`${{c}} of ${{t}} correct · ${{Math.round(p)}}%`;document.getElementById('fill').style.width=p+'%';document.getElementById('check').disabled=c===t;document.getElementById('check').textContent=c===t?'Practice complete':'Check my current answers'}}
function check(){{capture();const s=ps(),m=new Set(s.mastered||[]);let gained=0,attempted=0;PRACTICE.questions.forEach(q=>{{if(m.has(q.id))return;const v=s.answers?.[q.id],fb=document.getElementById('fb-'+q.id),card=document.querySelector(`[data-card="${{q.id}}"]`);if(v===undefined||String(v).trim()===''){{fb.className='fb warn';fb.textContent='Give this one a try before checking it.';return}}attempted++;if(correct(q,v)){{m.add(q.id);gained++;fb.className='fb good';fb.textContent=q.success;card.classList.add('mastered');card.querySelectorAll('input').forEach(x=>x.disabled=true)}}else{{fb.className='fb bad';fb.textContent='Not quite yet. '+q.hint}}}});s.mastered=[...m];s.checks=(s.checks||0)+1;s.lastScore=100*m.size/PRACTICE.questions.length;save();update();const f=document.getElementById('foot');if(m.size===PRACTICE.questions.length)f.textContent='Assessed Practice complete. Every question is correct and saved.';else if(gained)f.textContent=`${{gained}} new question${{gained===1?'':'s'}} correct. Keep working on the questions that remain open.`;else if(attempted)f.textContent='No new questions were correct this check. Use the hints, revise the open answers, and try again.';else f.textContent='Enter at least one answer before checking.'}}
document.getElementById('studentName').value=state.studentName;document.getElementById('studentName').addEventListener('input',e=>{{state.studentName=e.target.value;save()}});document.getElementById('check').onclick=check;document.getElementById('reset').onclick=()=>{{if(confirm('Clear all saved answers for this Assessed Practice on this device?')){{state.assessments[ID]={{answers:{{}},mastered:[],checks:0,lastScore:0}};save();render();document.getElementById('foot').textContent='Practice reset. Start with Question 1.'}}}};
function theme(){{document.documentElement.dataset.theme=state.theme;document.getElementById('themeBtn').textContent=state.theme==='dark'?'☀ Theme':'☾ Theme'}}document.getElementById('themeBtn').onclick=()=>{{state.theme=state.theme==='dark'?'light':'dark';save();theme()}};theme();render();
</script></body></html>'''

for n in range(1, 11):
    (practice_dir/f'week{n}.html').write_text(make_page(n, assessments[f'week{n}']), encoding='utf-8')

cards = []
for n in range(1, 11):
    a = assessments[f'week{n}']
    topic = a['title'].split('—',1)[-1].strip()
    cards.append(f'<a class="card" href="week{n}.html"><span>Week {n}</span><strong>{html.escape(topic)}</strong><small>5 questions · unlimited retries</small></a>')
landing = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MATH&amp; 146 — Assessed Practice</title><style>body{{margin:0;background:#eef1f3;color:#182532;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}main{{max-width:900px;margin:auto;padding:32px 18px 70px}}a{{color:#2e6386}}h1{{margin-bottom:6px}}p{{color:#5f6b73;max-width:70ch}}.grid{{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:24px}}.card{{display:grid;gap:5px;text-decoration:none;background:#fffdf8;border:1px solid #d5d7d3;border-radius:14px;padding:17px;box-shadow:0 8px 22px rgba(25,38,48,.07)}}.card span{{font-size:.76rem;text-transform:uppercase;letter-spacing:.07em;font-weight:800}}.card strong{{font-size:1.05rem;color:#182532}}.card small{{color:#5f6b73}}@media(max-width:650px){{.grid{{grid-template-columns:1fr}}}}</style></head><body><main><a href="../index.html">← MATH&amp; 146 course</a><h1>Assessed Practice</h1><p>Choose the week you want to practice. Each set can be checked as often as needed: correct answers lock in, while missed answers remain open with a small hint. Your progress is saved in the same browser record used by the course page.</p><div class="grid">{''.join(cards)}</div></main></body></html>'''
(practice_dir/'index.html').write_text(landing, encoding='utf-8')
