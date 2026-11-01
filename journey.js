/* Frontline Hiring Agent: guided prototype + auditor trail. Sample data only. */
(function () {
  'use strict';

  const VIEW = window.VIEW || 'journey';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const plural = (n, w, p) => `${n} ${n === 1 ? w : (p || w + 's')}`;

  /* ---------------- Config ---------------- */
  const COUNTRIES = {
    US: { label: 'United States', site: 'Dallas fulfilment centre', recruiter: 'J. Lee', lift: '23 kg (50 lb)', langs: 'English, Spanish', autoAllowed: true, confirmNo: false },
    IN: { label: 'India', site: 'Bengaluru sorting hub', recruiter: 'R. Iyer', lift: '15 kg', langs: 'English, Hindi, Kannada', autoAllowed: true, confirmNo: false },
    DE: { label: 'Germany', site: 'Leipzig logistics centre', recruiter: 'A. Schmidt', lift: '23 kg', langs: 'German, English', autoAllowed: false, confirmNo: true }
  };
  const JOB = { title: 'Warehouse Associate', shift: 'Night shift', hours: '10 pm – 6 am', openings: 8, rules: 'Rules v3', rulesNote: 'approved by the hiring manager and legal on 12 Oct' };
  const CRITERIA = [
    { key: 'exp', label: 'Relevant hands-on experience', w: 35, color: '#0F766E', desc: 'Warehouse, delivery, stockroom, kitchen or trades work, up to 3 years' },
    { key: 'flex', label: 'Extra shift flexibility', w: 20, color: '#0EA5E9', desc: 'Weekends and overtime during peak' },
    { key: 'start', label: 'Can start soon', w: 15, color: '#8B5CF6', desc: 'Within 1–2 weeks' },
    { key: 'season', label: 'Available all season', w: 15, color: '#F59E0B', desc: '12+ weeks of peak' },
    { key: 'certs', label: 'Equipment & safety skills', w: 15, color: '#EC4899', desc: 'Forklift, RF scanner, safety training' }
  ];
  const NOT_USED = ['Name', 'Age', 'Gender', 'Photo', 'Home address', 'Career gaps', 'CV wording or layout', 'School'];
  const EXP = [['Warehouse operative', 1], ['Delivery driver', .9], ['Retail stockroom', .9], ['Line cook', .85], ['Construction labourer', .85], ['Cleaner', .7], ['Call centre agent', .3], ['Student, no paid work', 0]];
  const FIRST = ['Ava', 'Noah', 'Mia', 'Liam', 'Zara', 'Omar', 'Elena', 'Ravi', 'Chloe', 'Mateo', 'Fatima', 'Ethan', 'Grace', 'Yusuf', 'Sofia', 'Daniel', 'Ines', 'Kofi', 'Hannah', 'Arjun', 'Lucia', 'Ben', 'Nadia', 'Leo', 'Amara', 'Jonas', 'Priya', 'Carlos', 'Mei', 'Felix', 'Layla', 'Isaac', 'Rosa', 'Hugo', 'Anika', 'Victor', 'Selin', 'Owen', 'Keisha', 'Paulo', 'Ingrid', 'Tariq'];
  const LAST = ['Johnson', 'Schulz', 'Reddy', 'Garcia', 'Okafor', 'Nguyen', 'Müller', 'Brown', 'Haddad', 'Silva', 'Kowalski', 'Sharma', 'Davies', 'Rossi', 'Mensah', 'Fischer', 'Lopez', 'Ivanova', 'Chen', 'Hughes', 'Nair', 'Wagner', 'Adeyemi', 'Moreau'];
  const SLOTS = (() => { const o = []; for (const d of ['Mon 2 Nov', 'Tue 3 Nov']) for (let h = 10; h < 17; h++) for (const m of ['00', '30']) o.push(`${d}, ${h}:${m}`); return o; })();

  /* ---------------- Sample applicants ---------------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const PERSONAS = {
    3: { name: 'Tom Becker', cv: true, m: { rtw: true, shift: true, lift: true }, exp: ['Warehouse operative', 1], months: 30, flex: 'weekends', startDays: 10, season: true, certs: ['Forklift', 'RF scanner'], whatsapp: true, declines: true },
    7: { name: 'Aisha Bello', cv: true, m: { rtw: true, shift: true, lift: true }, exp: ['Retail stockroom', .9], months: 38, flex: 'both', startDays: 5, season: true, certs: ['RF scanner', 'Safety training'], whatsapp: true, gap: true, note: 'Has a 2-year career break. It is never used, and she ranks near the top.' },
    15: { name: 'Dana Ortiz', cv: true, m: { rtw: true, shift: 'check', lift: true }, a: { shift: false }, exp: ['Cleaner', .7], months: 20, flex: 'none', startDays: 7, season: true, certs: [], whatsapp: true, note: 'Form said "days only". The agent double-checked before saying no.' },
    22: { name: 'Marcus Vance', cv: false, m: { rtw: true, shift: null, lift: null }, a: { shift: true, lift: true }, exp: ['Line cook', .85], months: 36, flex: 'both', startDays: 3, season: true, certs: ['Safety training'], whatsapp: true, note: 'No CV. The old "rank CVs" approach would have rejected him. The agent asked 3 questions on WhatsApp instead.' },
    30: { name: 'Lee Wong', cv: true, m: { rtw: true, shift: true, lift: true }, exp: ['Delivery driver', .9], months: 24, flex: 'both', startDays: 12, season: true, certs: ['Safety training'], whatsapp: false, note: 'Doesn\'t use WhatsApp, so everything happens by SMS.' },
    41: { name: 'Jordan Kim', cv: true, m: { rtw: true, shift: true, lift: null }, exp: ['Retail stockroom', .9], months: 14, flex: 'weekends', startDays: 9, season: false, certs: [], whatsapp: true, awaiting: true, note: 'Hasn\'t answered yet. No decision is made until they reply.' }
  };
  function buildApplicants() {
    const r = rng(20261031);
    const pick = a => a[Math.floor(r() * a.length)];
    const out = [];
    let nameI = 0;
    for (let i = 0; i < 48; i++) {
      const app = Math.round(i * 4.2 + r() * 3);
      let c;
      if (PERSONAS[i]) {
        const p = PERSONAS[i];
        c = { ...p, a: p.a || {}, persona: true };
      } else {
        const sr = r(), lr = r(), rr = r();
        const ex = pick(EXP);
        c = {
          name: `${FIRST[nameI % FIRST.length]} ${LAST[(nameI * 7 + 3) % LAST.length]}`,
          cv: r() < 0.68,
          m: { rtw: rr < 0.04 ? 'check' : true, shift: sr < 0.12 ? 'check' : sr < 0.24 ? null : true, lift: lr < 0.03 ? 'check' : lr < 0.12 ? null : true },
          exp: ex, months: ex[1] === 0 ? 0 : 3 + Math.floor(r() * 50),
          flex: pick(['both', 'both', 'weekends', 'weekends', 'none']), startDays: 1 + Math.floor(r() * 28),
          season: r() < 0.75, certs: ['Forklift', 'RF scanner', 'Safety training'].filter(() => r() < 0.3),
          whatsapp: r() < 0.86, gap: r() < 0.15
        };
        c.a = { rtw: false, shift: c.m.shift === 'check' ? r() < 0.15 : r() < 0.8, lift: c.m.lift === 'check' ? false : r() < 0.92 };
        nameI++;
      }
      c.id = 'A-' + (1001 + i);
      c.idx = i;
      c.app = app;
      c.ansAt = 212 + Math.floor(r() * 14);
      c.gender = r() < 0.47 ? 'Women' : r() < 0.93 ? 'Men' : 'Not stated';
      c.age = r() < 0.68 ? 'Under 40' : '40+';
      c.source = c.cv ? pick(['Job board', 'Career site']) : 'Phone, career site';
      out.push(c);
    }
    return out;
  }
  const APPS = buildApplicants();
  const MARCUS = APPS.find(c => c.name === 'Marcus Vance');

  /* ---------------- State ---------------- */
  const ST = {
    country: 'US', n: 10, reserve: 5, approval: 'review',
    step: 0, maxStep: 0, checked: false, checking: false, ranked: false, ranking: false,
    approved: false, simStarted: false, inv: {}, promoted: [], overrides: [], freeSlots: SLOTS.slice(), clock: 50,
    deConfirmed: false, phoneId: null, f2: 'all', aFilter: 'all', aQ: '', aSel: MARCUS.id, drawer: null
  };

  /* ---------------- Time helpers ---------------- */
  const hm = m => { const t = 360 + m; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  const tick = () => hm(ST.clock++ + 180);

  /* ---------------- Evaluation ---------------- */
  const C = () => COUNTRIES[ST.country];
  const chan = c => c.whatsapp ? 'WhatsApp' : 'SMS';
  const first = c => c.name.split(' ')[0];
  function mustDefs() {
    return [
      { key: 'rtw', label: `Allowed to work in ${C().label === 'United States' ? 'the US' : C().label}`, fail: `Not allowed to work in ${C().label === 'United States' ? 'the US' : C().label}`,
        q: { null: '', check: `Just checking: are you allowed to work in ${C().label === 'United States' ? 'the US' : C().label}?` } },
      { key: 'shift', label: `Can work nights (${JOB.hours})`, fail: 'Can\'t work the night shift',
        q: { null: `The shift is ${JOB.hours}. Can you work these hours?`, check: `Your form says day shifts only. This job is ${JOB.hours}. Could you work these hours?` } },
      { key: 'lift', label: `Can lift ${C().lift}, with or without adjustments`, fail: `Can't lift ${C().lift}, even with adjustments`,
        q: { null: `The job means lifting up to ${C().lift}. Can you do that, with or without adjustments?`, check: `Your form says you can't lift ${C().lift}. With adjustments (for example lifting aids), could you?` } }
    ];
  }
  function scoreOf(c) {
    const exp = Math.round(35 * Math.min(c.months, 36) / 36 * c.exp[1]);
    const flex = { both: 20, weekends: 13, none: 5 }[c.flex];
    const start = c.startDays <= 7 ? 15 : c.startDays <= 14 ? 11 : c.startDays <= 21 ? 6 : 2;
    const season = c.season ? 15 : 6;
    const certs = Math.min(15, (c.certs.includes('Forklift') ? 8 : 0) + (c.certs.includes('RF scanner') ? 4 : 0) + (c.certs.includes('Safety training') ? 3 : 0));
    const src = c.cv ? 'CV' : `${chan(c)} answer`;
    return {
      parts: { exp, flex, start, season, certs }, total: exp + flex + start + season + certs,
      ev: {
        exp: c.months ? `${c.exp[0]}, ${c.months} months (${src})` : 'No paid work yet (CV)',
        flex: { both: 'Weekends and overtime', weekends: 'Weekends only', none: 'Standard shifts only' }[c.flex] + ' (form)',
        start: `Can start in ${c.startDays} days (form)`,
        season: c.season ? 'Full season (form)' : 'Part of the season (form)',
        certs: c.certs.length ? c.certs.join(', ') + ` (${c.cv ? 'CV' : 'form'})` : 'None listed'
      }
    };
  }
  function missingOf(c) {
    const q = [];
    mustDefs().forEach(d => { const v = c.m[d.key]; if (v === null || v === 'check') q.push({ key: d.key, text: d.q[v === null ? 'null' : 'check'], ans: c.a[d.key] }); });
    if (!c.cv) q.push({ key: 'exp', text: 'What was your most recent job, and for how long?', ansText: `${c.exp[0]}, ${c.months >= 12 ? Math.round(c.months / 12) + ' years' : c.months + ' months'}` });
    return q;
  }
  function derive() {
    const defs = mustDefs();
    APPS.forEach(c => {
      c.missing = missingOf(c);
      if (c.awaiting) { c.status = 'awaiting'; c.eligible = false; c.must = null; return; }
      c.must = defs.map(d => {
        const v = c.m[d.key], ok = v === true || c.a[d.key] === true;
        const ev = v === true ? 'Application form' : v === null ? `${chan(c)} answer` : (c.a[d.key] ? `Form said no, corrected on ${chan(c)}` : `Form said no, confirmed on ${chan(c)}`);
        return { key: d.key, label: d.label, ok, ev, fail: d.fail };
      });
      c.eligible = c.must.every(x => x.ok);
      c.status = c.eligible ? 'eligible' : 'inel';
      c.reason = c.eligible ? null : c.must.find(x => !x.ok).fail;
      c.sc = c.eligible ? scoreOf(c) : null;
    });
    const elig = APPS.filter(c => c.eligible).sort((a, b) => b.sc.total - a.sc.total || a.app - b.app);
    elig.forEach((c, i) => { c.rank = i + 1; });
    const short = [], reserve = [], not = [];
    let reserveLeft = ST.reserve;
    elig.forEach((c, i) => {
      if (i < ST.n || ST.overrides.includes(c.id)) { c.band = 'short'; short.push(c); }
      else if (reserveLeft > 0) { c.band = 'reserve'; c.resN = ST.reserve - reserveLeft + 1; reserveLeft--; reserve.push(c); }
      else { c.band = 'not'; not.push(c); }
    });
    APPS.filter(c => !c.eligible).forEach(c => { c.band = null; c.rank = null; });
    return { elig, short, reserve, not, inel: APPS.filter(c => c.status === 'inel'), awaiting: APPS.filter(c => c.status === 'awaiting'), asked: APPS.filter(c => c.missing.length) };
  }

  function outcomeOf(c) {
    const inv = ST.inv[c.id];
    if (c.status === 'awaiting') return ['Waiting for reply', 'grey'];
    if (c.status === 'inel') return C().confirmNo && !ST.deConfirmed ? ['Not eligible · recruiter to confirm', 'amber'] : ['Not eligible', 'rose'];
    if (!ST.ranked) return ['Eligible', 'teal'];
    if (!ST.approved) return c.band === 'short' ? ['Shortlist', 'teal'] : c.band === 'reserve' ? ['Reserve', 'amber'] : ['Below cut-off', 'grey'];
    if (inv) {
      if (inv.status === 'booked') return ['Interview booked', 'teal'];
      if (inv.status === 'declined') return ['Declined invite', 'grey'];
      if (inv.status === 'noreply') return ['No reply · reminder sent', 'amber'];
      return ['Invited', 'sky'];
    }
    if (c.band === 'reserve') return [`Reserve #${c.resN}`, 'amber'];
    return ['Not shortlisted', 'grey'];
  }
  const chip = o => `<span class="chip ${o[1]}">${esc(o[0])}</span>`;

  (function assignSampleGroups() {
    // Synthetic, self-declared groups for the demo fairness report, spread evenly across the score order.
    const prov = APPS.map(c => ({ c, s: (c.awaiting ? -2 : 0) + (Object.keys(c.m).every(k => c.m[k] === true || c.a[k] === true) ? scoreOf(c).total : -1) }))
      .sort((a, b) => b.s - a.s);
    const G = ['Women', 'Men', 'Men', 'Women', 'Women', 'Men', 'Men', 'Women', 'Women', 'Men', 'Not stated', 'Men'];
    const A = ['Under 40', 'Under 40', '40+'];
    prov.forEach((p, i) => { p.c.gender = G[i % G.length]; p.c.age = A[(i + 1) % A.length]; });
  })();

  /* ---------------- Audit trail ---------------- */
  function trailOf(c) {
    const ev = [];
    const K = C();
    const add = (t, actor, title, kind, detail, extra) => ev.push(Object.assign({ t, actor, title, kind, detail }, extra || {}));
    add(hm(c.app), 'Applicant', 'Application received', 'info', `Via ${c.source}. CV: ${c.cv ? 'attached' : 'none'}. Agreed to be contacted on WhatsApp/SMS.`);
    if (!ST.checked) return ev;
    add('09:30', 'Agent', 'Personal details hidden from the agent', 'info', `${NOT_USED.slice(0, 6).join(', ').toLowerCase().replace(/^./, m => m.toUpperCase())} are removed before any check or ranking.`);
    if (c.missing.length) {
      add('09:30', 'Agent', `Asked ${plural(c.missing.length, 'question')} on ${chan(c)}`, 'info', 'Only what was missing or looked like a "no":', { rows: c.missing.map(q => [q.text, '']) });
      if (c.status === 'awaiting') add('1 Nov 09:30', 'Agent', 'No reply after 24 hours: reminder sent', 'warn', 'No decision is made until the applicant replies.');
      else add(hm(c.ansAt), 'Applicant', `Answered on ${chan(c)}`, 'info', '', { rows: c.missing.map(q => [q.text, q.ansText || (q.ans ? 'Yes' : 'No')]) });
    }
    if (c.status === 'awaiting') return ev;
    const tCheck = c.missing.length ? hm(c.ansAt) : '09:30';
    add(tCheck, 'Agent', c.eligible ? 'Must-haves: all met → eligible' : 'Must-haves: not met → not eligible', c.eligible ? 'ok' : 'bad', `${JOB.rules}, ${JOB.rulesNote}.`, { must: c.must });
    if (!c.eligible) {
      if (K.confirmNo && !ST.deConfirmed) add(tCheck, 'Agent', 'Waiting for a recruiter to confirm "not eligible"', 'warn', 'Germany setting: a recruiter confirms every "no" before the applicant is told.');
      else {
        if (K.confirmNo) add(ST.deConfirmedAt, `Recruiter ${K.recruiter}`, 'Confirmed "not eligible"', 'ok', 'Checked the must-have result and the applicant\'s own answer.');
        const miss = c.must.find(x => !x.ok);
        add(K.confirmNo ? ST.deConfirmedAt : tCheck, 'Agent', 'Told the applicant why', 'info', 'The message gave the reason, a link to ask a person to review, and a link to see or delete their data.', { quote: `"Thanks for applying. This job needs: ${miss.label.toLowerCase()}. You told us this doesn't work for you, so it isn't a match. Ask a person to review: hr.link/m/${c.id.slice(2)}"` });
      }
      return ev;
    }
    if (!ST.ranked) return ev;
    add('09:45', 'Agent', `Ranked #${c.rank} of ${APPS.filter(x => x.eligible).length} eligible · score ${c.sc.total}/100`, 'info', `Scored only on the job's ranking criteria (${JOB.rules}). Not used: ${NOT_USED.join(', ').toLowerCase()}. Ties go to whoever applied first.`, { score: c.sc });
    if (ST.overrides.includes(c.id)) add('09:46', `Recruiter ${K.recruiter}`, 'Added to the shortlist (recruiter override)', 'warn', `Reason recorded: "Hiring manager request". Rank stays #${c.rank} in the record.`);
    if (!ST.approved) return ev;
    const who = ST.approval === 'review' ? `Recruiter ${K.recruiter}` : 'Agent';
    const how = ST.approval === 'review' ? `Recruiter reviewed and approved the shortlist at 09:47.` : 'Sent automatically after ranking (setting chosen by the recruiter).';
    const promoted = ST.promoted.includes(c.id);
    if (c.band === 'short') add('09:47', who, 'Shortlisted for interview', 'ok', `Shortlist size set to ${ST.n} by recruiter ${K.recruiter}; this applicant was #${c.rank}. ${how}`);
    else if (c.band === 'reserve') {
      add('09:47', who, `Put on the reserve list (#${c.resN})`, 'warn', `Ranked #${c.rank}, just below the shortlist of ${ST.n}. ${how}`);
      if (!promoted) add('09:48', 'Agent', 'No message sent (reserve is internal)', 'info', 'The applicant isn\'t told about the reserve list. If a place opens within 5 days they get an invite; otherwise the standard "not selected" message.');
    } else {
      add('09:47', who, 'Not shortlisted this round', 'bad', `Ranked #${c.rank}. Shortlist was the top ${ST.n} plus ${ST.reserve} on reserve. ${how}`);
      add('09:48', 'Agent', 'Told the applicant: not shortlisted', 'info', 'Message included a link to their application data and an option to reply WHY.', { quote: `"Thanks for applying. We've gone through your application carefully, but we've found other candidates who more closely match the requirements for this job, so we won't be moving forward with your application this time. Reply WHY if you'd like to know more."` });
    }
    const inv = ST.inv[c.id];
    if (inv) {
      if (promoted) add(inv.t.sent, 'Agent', 'Invited from the reserve list', 'ok', `${inv.forName} declined, so the next person on the reserve list was invited automatically.`);
      add(inv.t.sent, 'Agent', `Interview invite sent by ${inv.ch}`, 'info', '', { quote: `"Good news, ${first(c)}: you've been shortlisted for ${JOB.title} (night shift) at the ${K.site}. Pick a time for a 15-minute interview."` });
      if (inv.t.delivered) add(inv.t.delivered, 'Agent', 'Message delivered', 'info', '');
      if (inv.status === 'booked') add(inv.t.booked, 'Applicant', `Booked interview: ${inv.slot}`, 'ok', 'Confirmation and a reminder the day before are sent automatically.');
      if (inv.status === 'declined') add(inv.t.declined, 'Applicant', 'Declined the interview', 'bad', 'Reason given: "I took another job." Place passed to the next person on the reserve list.');
      if (inv.status === 'noreply') add('1 Nov 09:48', 'Agent', 'No reply after 24 hours: reminder sent', 'warn', 'If there is still no reply after 48 hours, the place goes to the next person on the reserve list.');
    }
    return ev;
  }
  function oneLine(c) {
    if (c.status === 'awaiting') return `Asked ${plural(c.missing.length, 'question')} on ${chan(c)} → <b>waiting for a reply</b>. No decision yet.`;
    if (c.status === 'inel') return `<b>Not eligible</b>: ${esc(c.reason.toLowerCase())}${c.m[c.must.find(x => !x.ok).key] === 'check' ? ' (the applicant confirmed it when asked)' : ''}. Not ranked.`;
    let s = `Met all must-haves → ranked <b>#${c.rank}</b> (score ${c.sc.total}/100)`;
    if (!ST.approved) return s + '.';
    const inv = ST.inv[c.id];
    if (inv) {
      s += ST.promoted.includes(c.id) ? ` → reserve, then <b>invited</b> when someone declined` : ` → <b>shortlisted</b> (top ${ST.n})`;
      if (inv.status === 'booked') s += ` → <b>booked ${esc(inv.slot)}</b>`;
      if (inv.status === 'declined') s += ' → <b>declined</b>';
      if (inv.status === 'noreply') s += ' → no reply yet, reminder sent';
      return s + '.';
    }
    return s + (c.band === 'reserve' ? ` → <b>reserve list #${c.resN}</b>.` : ` → <b>not shortlisted</b> (cut-off was #${ST.n}).`);
  }
  function timelineHTML(c) {
    const actorCls = a => a === 'Agent' ? 'agent' : a.startsWith('Recruiter') ? 'recruiter' : 'applicant';
    return `<div class="oneline">${oneLine(c)}</div><div class="tl">` + trailOf(c).map(e => {
      let extra = '';
      if (e.rows) extra += `<table>${e.rows.map(r => `<tr><td>${esc(r[0])}</td>${r[1] !== '' ? `<td class="r">${esc(r[1])}</td>` : ''}</tr>`).join('')}</table>`;
      if (e.must) extra += `<table>${e.must.map(m => `<tr><td>${esc(m.label)}<div class="idt">${esc(m.ev)}</div></td><td class="${m.ok ? 'okc' : 'badc'}">${m.ok ? '✓ Met' : '✕ Not met'}</td></tr>`).join('')}</table>`;
      if (e.score) extra += `<table>${CRITERIA.map(k => `<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${k.color};margin-right:6px"></span>${esc(k.label)}<div class="idt">${esc(e.score.ev[k.key])}</div></td><td class="r">${e.score.parts[k.key]} / ${k.w}</td></tr>`).join('')}<tr><td><b>Total</b></td><td class="r">${e.score.total} / 100</td></tr></table>`;
      if (e.quote) extra += `<div class="dt" style="font-style:italic;background:#fff;border:1px solid var(--line);border-radius:8px;padding:6px 9px;margin-top:6px">${esc(e.quote)}</div>`;
      return `<div class="ev ${e.kind}"><div class="d"></div><div class="hd"><span class="tm">${esc(e.t)}</span><span class="ac ${actorCls(e.actor)}">${esc(e.actor)}</span><span class="ti">${esc(e.title)}</span></div>${e.detail ? `<div class="dt">${esc(e.detail)}</div>` : ''}${extra}</div>`;
    }).join('') + '</div>';
  }
  function recordJSON(c) {
    return {
      applicant: c.id, job: `${JOB.title} (${JOB.shift}), ${C().site}`, country: C().label, rules: JOB.rules,
      settings: { shortlistSize: ST.n, reserveSize: ST.reserve, approval: ST.approval === 'review' ? 'recruiter reviews shortlist' : 'automatic', setBy: C().recruiter },
      summary: oneLine(c).replace(/<[^>]+>/g, ''),
      events: trailOf(c).map(e => ({ time: e.t, actor: e.actor, event: e.title, detail: e.detail || undefined, mustHaves: e.must ? e.must.map(m => ({ rule: m.label, met: m.ok, evidence: m.ev })) : undefined, score: e.score ? Object.fromEntries(CRITERIA.map(k => [k.label, { points: e.score.parts[k.key], max: k.w, evidence: e.score.ev[k.key] }])) : undefined, answers: e.rows || undefined, message: e.quote || undefined }))
    };
  }
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click(); URL.revokeObjectURL(a.href);
  }

  /* ---------------- Simulation ---------------- */
  function bookNext(id) {
    const inv = ST.inv[id]; if (!inv) return;
    inv.status = 'booked'; inv.slot = ST.freeSlots.shift(); inv.t.booked = tick();
  }
  function promoteFor(declinedId, instant) {
    const D = derive();
    const next = D.reserve.find(c => !ST.inv[c.id]);
    if (!next) return;
    const dec = APPS.find(c => c.id === declinedId);
    ST.promoted.push(next.id);
    const t = ST.inv[declinedId].t.declined;
    ST.inv[next.id] = { status: 'sent', ch: chan(next), t: { sent: t }, forName: dec.name };
    if (instant) { ST.inv[next.id].status = 'delivered'; ST.inv[next.id].t.delivered = t; bookNext(next.id); return; }
    toast(`${first(dec)} declined → ${next.name} (reserve #1) invited automatically`);
    setTimeout(() => { ST.inv[next.id].status = 'delivered'; ST.inv[next.id].t.delivered = t; refresh(); }, 700);
    setTimeout(() => { bookNext(next.id); refresh(); }, 1900);
  }
  function startSim(instant, includeMarcus) {
    if (ST.simStarted) return; ST.simStarted = true;
    const D = derive();
    const inv = D.short;
    const noReply = inv.filter(c => c.id !== MARCUS.id && !c.declines)[6];
    inv.forEach(c => { ST.inv[c.id] = { status: 'queued', ch: chan(c), t: {} }; });
    const steps = [];
    steps.push(() => inv.forEach(c => { ST.inv[c.id].status = 'sent'; ST.inv[c.id].t.sent = '09:48'; }));
    steps.push(() => inv.forEach(c => { ST.inv[c.id].status = 'delivered'; ST.inv[c.id].t.delivered = '09:48'; }));
    inv.forEach(c => {
      if (c.id === MARCUS.id && !includeMarcus) return;
      if (noReply && c.id === noReply.id) return;
      steps.push(() => {
        if (c.declines) { ST.inv[c.id].status = 'declined'; ST.inv[c.id].t.declined = tick(); promoteFor(c.id, instant); }
        else bookNext(c.id);
      });
    });
    if (noReply) steps.push(() => { ST.inv[noReply.id].status = 'noreply'; });
    if (instant) { steps.forEach(f => f()); return; }
    steps.forEach((f, i) => setTimeout(() => { f(); refresh(); }, 350 + i * 520));
  }

  /* ---------------- UI helpers ---------------- */
  function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3400); }
  const STEPS = [['Set up the job', 'Recruiter'], ['Check must-haves', 'Agent'], ['Rank & shortlist', 'Agent + recruiter'], ['Invite to interview', 'Agent, by WhatsApp/SMS'], ['Audit trail', 'For auditors']];

  function renderBar() {
    const el = $('#jbar'); if (!el) return;
    el.innerHTML = `<div class="jbar-in">${STEPS.map((s, i) => `<button class="js ${i === ST.step ? 'on' : i < ST.step || i <= ST.maxStep ? 'done' : ''}" ${i > ST.maxStep ? 'disabled' : ''} onclick="J.go(${i})"><span class="n">${i < ST.maxStep || (i < ST.step) ? '✓' : i + 1}</span><span><span class="t">${s[0]}</span><span class="w">${s[1]}</span></span></button>`).join('')}</div>`;
  }

  /* ---------- Step 1: set up ---------- */
  function viewSetup() {
    const K = C(), locked = ST.checked || ST.checking, apLocked = ST.approved;
    return `<div class="intro"><div><div class="who">Step 1 · Recruiter</div><h1>Set up the job and choose how many to interview</h1>
      <p>Every applicant gets a first reply within minutes. Once a day the agent ranks everyone who meets the must-haves and shortlists as many as you choose, so invites go out within 24 hours.</p></div></div>
    <div class="grid2">
      <div class="card"><div class="card-b">
        <div class="sect"><div class="jobline"><div><div class="jt">${JOB.title} · ${JOB.shift}</div><div class="js2">${K.site}</div></div>
          <div class="seg">${Object.entries(COUNTRIES).map(([k, v]) => `<button class="${ST.country === k ? 'on' : ''}" ${locked ? 'disabled' : ''} onclick="J.country('${k}')">${v.label}</button>`).join('')}</div></div>
          <div class="facts"><span class="fact">Openings: <b>${JOB.openings}</b></span><span class="fact">New applicants: <b>48</b> since 06:00</span><span class="fact">Ranking runs: <b>daily at 09:30</b></span><span class="fact">Languages: <b>${K.langs}</b></span></div></div>
        <div class="sect"><div class="sect-t">Must-haves (pass or fail) <span class="lock">🔒 ${JOB.rules}, ${JOB.rulesNote}</span></div>
          <div class="must">${mustDefs().map(d => `<div class="must-r"><span class="ic">✓</span>${esc(d.label)}</div>`).join('')}</div></div>
        <div class="sect"><div class="sect-t">How eligible applicants are ranked <span class="lock">🔒 Changes need approval</span></div>
          <div class="crit">${CRITERIA.map(k => `<div class="crit-r"><div>${k.label}<small>${k.desc}</small></div><div class="wbar"><i style="width:${k.w / 35 * 100}%;background:${k.color}"></i></div><div class="pts">${k.w} pts</div></div>`).join('')}</div></div>
        <div class="sect"><div class="sect-t">Never used for checks or ranking</div><div class="chips">${NOT_USED.map(x => `<span class="chip strike">${x}</span>`).join('')}</div></div>
      </div></div>
      <div class="card"><div class="card-h"><h2>Your shortlist settings</h2><span class="sub">You control these</span></div><div class="card-b">
        <div class="setting"><div class="setting-row"><div><div class="lbl">How many to shortlist for interview</div><div class="help">You have ${JOB.openings} openings. 10–12 allows for no-shows.</div></div>
          ${stepperHTML('n', ST.n, 1, 25, apLocked)}</div></div>
        <div class="setting"><div class="setting-row"><div><div class="lbl">Reserve list</div><div class="help">Invited automatically, in rank order, if someone declines.</div></div>
          ${stepperHTML('reserve', ST.reserve, 0, 10, apLocked)}</div></div>
        <div class="setting"><div class="lbl">Before invites go out</div>
          <div class="radio">
            <button class="ropt ${ST.approval === 'review' ? 'on' : ''}" ${locked ? 'disabled' : ''} onclick="J.approval('review')"><span class="dot"></span><span><b>I review the shortlist first</b><span>One click to approve. Recommended.</span></span></button>
            <button class="ropt ${ST.approval === 'auto' ? 'on' : ''}" ${locked || !K.autoAllowed ? 'disabled' : ''} onclick="J.approval('auto')"><span class="dot"></span><span><b>Send invites automatically</b><span>${K.autoAllowed ? 'The agent invites the top applicants as soon as ranking is done.' : 'Not available in Germany until legal and works council sign-off.'}</span></span></button>
          </div></div>
        <div class="summary">The agent will check <b>48 applicants</b>, rank everyone eligible, and ${ST.approval === 'review' ? 'propose' : 'invite'} the <b>top ${ST.n}</b> by WhatsApp or SMS, with <b>${ST.reserve}</b> on reserve.${K.confirmNo ? ' In Germany you also confirm every "not eligible".' : ''}</div>
      </div></div>
    </div>
    <div class="cta"><span class="note">${locked ? 'Country and approval settings are fixed for this round.' : 'Sample data. 48 made-up applicants.'}</span>
      <button class="btn pri big" onclick="J.next()">${ST.checked ? 'Continue to results →' : 'Check the 48 applicants →'}</button></div>`;
  }
  function stepperHTML(key, v, min, max, dis) {
    return `<div class="stepper"><button ${dis || v <= min ? 'disabled' : ''} onclick="J.set('${key}',-1)" aria-label="Decrease">−</button><span class="v">${v}</span><button ${dis || v >= max ? 'disabled' : ''} onclick="J.set('${key}',1)" aria-label="Increase">+</button></div>`;
  }

  /* ---------- Step 2: check ---------- */
  function viewCheck() {
    if (!ST.checked) {
      return `<div class="card proc"><div class="who" style="font-size:12px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.07em">Step 2 · Agent</div>
        <h2>Checking must-haves for 48 applicants…</h2>
        <div class="pbar"><i id="pfill"></i></div>
        <div class="tiles" style="margin-bottom:12px">
          <div class="tile"><div class="k">Checked</div><div class="v" id="c-chk">0</div></div>
          <div class="tile sky"><div class="k">Asked on WhatsApp/SMS</div><div class="v" id="c-ask">0</div></div>
          <div class="tile teal"><div class="k">Eligible</div><div class="v" id="c-el">0</div></div>
          <div class="tile rose"><div class="k">Not eligible</div><div class="v" id="c-in">0</div></div></div>
        <div class="feed" id="feed"></div></div>`;
    }
    const D = derive();
    const reasons = {};
    D.inel.forEach(c => { reasons[c.reason] = (reasons[c.reason] || 0) + 1; });
    const rows = APPS.filter(c => ST.f2 === 'all' || (ST.f2 === 'el' && c.status === 'eligible') || (ST.f2 === 'in' && c.status !== 'eligible') || (ST.f2 === 'ask' && c.missing.length));
    return `<div class="intro"><div><div class="who">Step 2 · Agent</div><h1>${D.elig.length} of 48 meet the must-haves</h1>
      <p>Missing details were asked on WhatsApp or SMS, never guessed. Before any "no", the agent double-checked with the applicant.</p></div></div>
      <div class="tiles">
        <div class="tile rise"><div class="k">Checked</div><div class="v">48</div><div class="s">in under 10 minutes</div></div>
        <div class="tile sky rise" style="animation-delay:.05s"><div class="k">Asked on WhatsApp/SMS</div><div class="v">${D.asked.length}</div><div class="s">${D.awaiting.length} still to reply</div></div>
        <div class="tile teal rise" style="animation-delay:.1s"><div class="k">Eligible</div><div class="v">${D.elig.length}</div><div class="s">go on to ranking</div></div>
        <div class="tile rose rise" style="animation-delay:.15s"><div class="k">Not eligible</div><div class="v">${D.inel.length}</div><div class="s">${C().confirmNo ? 'recruiter confirms first' : 'told why, can ask for review'}</div></div></div>
      <div class="grid2b">
        <div class="card"><div class="card-h"><h2>All applicants</h2>
          <div class="tabs">${[['all', 'All 48'], ['el', `Eligible ${D.elig.length}`], ['in', `Not eligible / waiting ${D.inel.length + D.awaiting.length}`], ['ask', `Asked on WhatsApp/SMS ${D.asked.length}`]].map(t => `<button class="tab ${ST.f2 === t[0] ? 'on' : ''}" onclick="J.f2('${t[0]}')">${t[1]}</button>`).join('')}</div></div>
          <div class="scroll"><table class="tbl"><thead><tr><th>Applicant</th><th>Result</th><th>Evidence</th></tr></thead><tbody>
          ${rows.map(c => `<tr class="click" onclick="J.open('${c.id}')"><td><div class="nm">${esc(c.name)}${c.persona ? ' <span class="chip teal" style="font-size:11px;padding:1px 6px">story</span>' : ''}</div><div class="idt">${c.id} · applied ${hm(c.app)}</div></td>
            <td>${c.status === 'awaiting' ? chip(['Waiting for reply', 'grey']) : c.status === 'eligible' ? chip(['Eligible', 'teal']) : chip(outcomeOf(c))}</td>
            <td class="idt">${c.status === 'awaiting' ? 'Reminder sent' : c.status === 'inel' ? esc(c.reason) : c.missing.length ? `${plural(c.missing.length, 'answer')} on ${chan(c)}` : 'Application form'}</td></tr>`).join('')}
          </tbody></table></div></div>
        <div style="display:grid;gap:12px">
          <div class="card"><div class="card-h"><h2>Why some aren't eligible</h2></div><div class="card-b"><div class="reasons">
            ${Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => `<div class="reason"><span>${esc(r)}</span><b style="text-align:right">${n}</b><div class="rb"><i style="width:${n / D.inel.length * 100}%"></i></div></div>`).join('')}
          </div></div></div>
          <div class="callout"><b>Marcus had no CV.</b> Instead of rejecting him, the agent asked 3 quick questions on WhatsApp. He meets every must-have. <a href="#" onclick="J.open('${MARCUS.id}');return false">See his trail →</a></div>
          <div class="callout amber"><b>Dana's form said "days only".</b> The agent asked her to confirm before saying no. <a href="#" onclick="J.open('${APPS.find(c => c.name === 'Dana Ortiz').id}');return false">See her trail →</a></div>
        </div>
      </div>
      <div class="cta"><button class="btn" onclick="J.go(0)">← Back</button><button class="btn pri big" onclick="J.next()">Rank the ${D.elig.length} eligible applicants →</button></div>`;
  }
  function runCheck() {
    if (ST.checking || ST.checked) return; ST.checking = true;
    derive();
    let i = 0, ask = 0, el = 0, inel = 0;
    const feed = [];
    const iv = setInterval(() => {
      for (let k = 0; k < 2 && i < 48; k++, i++) {
        const c = APPS[i];
        if (c.missing.length) ask++;
        if (c.status === 'eligible') el++; else if (c.status === 'inel') inel++;
        const line = c.status === 'awaiting' ? `⏳ <b>${esc(c.name)}</b>: ${plural(c.missing.length, 'detail')} missing → asked on ${chan(c)}, waiting for reply`
          : c.status === 'inel' ? `✕ <b>${esc(c.name)}</b>: ${esc(c.reason.toLowerCase())}${c.missing.length ? ' (confirmed on ' + chan(c) + ')' : ''}`
          : c.missing.length ? `✓ <b>${esc(c.name)}</b>: ${plural(c.missing.length, 'detail')} missing → asked on ${chan(c)} → all must-haves met`
          : `✓ <b>${esc(c.name)}</b>: all must-haves met`;
        feed.unshift(line);
      }
      const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
      const pf = document.getElementById('pfill'); if (pf) pf.style.width = (i / 48 * 100) + '%';
      set('c-chk', i); set('c-ask', ask); set('c-el', el); set('c-in', inel);
      const fd = document.getElementById('feed'); if (fd) fd.innerHTML = feed.slice(0, 6).map(l => `<div>${l}</div>`).join('');
      if (i >= 48) { clearInterval(iv); setTimeout(() => { ST.checking = false; ST.checked = true; if (ST.step === 1) render(true); }, 650); }
    }, 70);
  }

  /* ---------- Step 3: rank ---------- */
  function viewRank() {
    const D = derive();
    if (!ST.ranked) {
      return `<div class="card proc"><div class="who" style="font-size:12px;font-weight:700;color:var(--teal);text-transform:uppercase;letter-spacing:.07em">Step 3 · Agent</div>
        <h2>Ranking ${D.elig.length} eligible applicants against the job…</h2><div class="pbar"><i id="pfill"></i></div>
        <p style="color:var(--muted)">Scoring each applicant on the 5 ranking criteria. Personal details stay hidden.</p></div>`;
    }
    const legend = CRITERIA.map(k => `<span><i style="background:${k.color}"></i>${k.label}</span>`).join('');
    let html = '';
    const lastRes = D.elig.reduce((acc, c, i) => c.band === 'reserve' ? i : acc, -1);
    D.elig.forEach((c, i) => {
      if (i === ST.n) html += `<div class="cut">Shortlist cut-off: top ${ST.n}${ST.overrides.length ? ` + ${ST.overrides.length} added by you` : ''}</div>`;
      const o = outcomeOf(c);
      html += `<div class="rrow ${c.band === 'short' ? 'short' : ''} rise" style="animation-delay:${Math.min(i, 20) * 0.025}s" onclick="J.open('${c.id}')">
        <span class="rk">#${c.rank}</span>
        <div><div class="nm">${esc(c.name)}${ST.overrides.includes(c.id) ? ' <span class="chip amber" style="font-size:11px;padding:1px 6px">added by you</span>' : ''}</div><div class="meta">${esc(c.months ? `${c.exp[0]}, ${c.months} mo` : c.exp[0])}${c.gap ? ' · career gap (not used)' : ''}</div></div>
        <div class="sbar" title="Score breakdown">${CRITERIA.map(k => `<i style="width:${c.sc.parts[k.key]}%;background:${k.color}"></i>`).join('')}</div>
        <span class="sc">${c.sc.total}</span>
        <span>${chip(o)}</span></div>`;
      if (i === lastRes) html += `<div class="cut res">Reserve list ends</div>`;
    });
    const locked = ST.approved;
    return `<div class="intro"><div><div class="who">Step 3 · Agent ranks, recruiter approves</div><h1>Ranked shortlist: top ${ST.n} of ${D.elig.length}</h1>
      <p>Everyone eligible is scored on the same 5 job criteria, out of 100. Change the shortlist size and the cut-off line moves. Click anyone to see why they're where they are.</p></div></div>
      <div class="card">
        <div class="rankbar">
          <div class="grp"><div><div class="l">Shortlist size</div><div class="h">${JOB.openings} openings</div></div>${stepperHTML('n', ST.n, 1, Math.min(25, D.elig.length), locked)}</div>
          <div class="grp"><div><div class="l">Reserve</div><div class="h">invited if someone declines</div></div>${stepperHTML('reserve', ST.reserve, 0, 10, locked)}</div>
          <div class="legend">${legend}</div>
        </div>
        <div>${html}</div>
      </div>
      <div class="cta"><button class="btn" onclick="J.go(1)">← Back</button>
        <span class="note">${locked ? `Approved at 09:47. Invites are out.` : ST.approval === 'review' ? `You're approving ${ST.n} invites${ST.reserve ? ` and ${ST.reserve} on reserve` : ''}. The rest are told they weren't shortlisted, with a link to see how they were assessed.` : 'Auto-send is on: the agent sends invites straight after ranking.'}</span>
        <button class="btn pri big" onclick="J.approve()">${locked ? 'See invites →' : ST.approval === 'review' ? `Approve & invite top ${ST.n} →` : `Continue: agent invites top ${ST.n} →`}</button></div>`;
  }
  function runRank() {
    if (ST.ranking || ST.ranked) return; ST.ranking = true;
    let p = 0;
    const iv = setInterval(() => { p += 6; const pf = document.getElementById('pfill'); if (pf) pf.style.width = Math.min(p, 100) + '%';
      if (p >= 100) { clearInterval(iv); setTimeout(() => { ST.ranking = false; ST.ranked = true; if (ST.step === 2) render(true); }, 250); } }, 55);
  }

  /* ---------- Step 4: invite ---------- */
  function viewInvite() {
    const D = derive();
    const invited = APPS.filter(c => ST.inv[c.id]).sort((a, b) => a.rank - b.rank);
    if (!ST.phoneId || !ST.inv[ST.phoneId]) ST.phoneId = ST.inv[MARCUS.id] ? MARCUS.id : (invited[0] && invited[0].id);
    const cnt = s => invited.filter(c => ST.inv[c.id].status === s).length;
    const booked = cnt('booked'), declined = cnt('declined'), waiting = invited.length - booked - declined;
    const stage = st => ({ queued: 0, sent: 1, delivered: 2, booked: 3, declined: 3, noreply: 3 }[st]);
    const rows = invited.map(c => {
      const iv = ST.inv[c.id], s = stage(iv.status);
      const lbl = { queued: ['Queued', ''], sent: ['Sent', ''], delivered: [c.id === MARCUS.id ? 'Delivered: waiting for Marcus' : 'Delivered', c.id === MARCUS.id ? 'Tap a slot in his phone →' : 'Waiting for reply'], booked: ['Booked', iv.slot], declined: ['Declined', '"I took another job"'], noreply: ['No reply yet', 'Reminder sent after 24 h'] }[iv.status];
      const last = iv.status === 'declined' ? 'bad' : iv.status === 'noreply' ? 'wait' : 'on';
      return `<div class="trk ${ST.phoneId === c.id ? 'sel' : ''}" onclick="J.phone('${c.id}')"><span class="rk">#${c.rank}</span>
        <div><div class="nm">${esc(c.name)}</div><div class="idt">${ST.promoted.includes(c.id) ? 'From reserve list · ' : ''}<span class="chan ${iv.ch === 'WhatsApp' ? 'wa' : 'sms'}">${iv.ch}</span></div></div>
        <div class="pipe">${[0, 1, 2].map(k => `<i class="${s > k ? (k === 2 ? last : 'on') : ''}"></i>`).join('')}</div>
        <div class="st-t">${lbl[0]}<small>${esc(lbl[1] || '')}</small></div></div>`;
    }).join('');
    const K = C();
    const notMsg = `"Thanks for applying. We\'ve gone through your application carefully, but we\'ve found other candidates who more closely match the requirements for this job, so we won\'t be moving forward with your application this time. Reply WHY if you'd like to know more."`;
    const inelNote = K.confirmNo ? (ST.deConfirmed ? `Confirmed by ${K.recruiter} at ${ST.deConfirmedAt}, then sent.` : `<button class="btn warn" onclick="J.confirmDE()">Confirm all ${D.inel.length} as recruiter</button>`) : 'Sent automatically at 09:31.';
    return `<div class="intro"><div><div class="who">Step 4 · Agent, by WhatsApp and SMS</div><h1>Invites sent to the top ${ST.n}</h1>
      <p>Each shortlisted applicant picks an interview slot in the chat. If someone declines, the next person on the reserve list is invited automatically.</p></div></div>
      <div class="tiles">
        <div class="tile sky"><div class="k">Invited</div><div class="v">${invited.length}</div><div class="s">${ST.promoted.length ? `${ST.n} + ${ST.promoted.length} from reserve` : 'from the shortlist'}</div></div>
        <div class="tile teal"><div class="k">Booked</div><div class="v">${booked}</div><div class="s">interview slots filled</div></div>
        <div class="tile"><div class="k">Waiting</div><div class="v">${waiting}</div><div class="s">reminder after 24 h</div></div>
        <div class="tile rose"><div class="k">Declined</div><div class="v">${declined}</div><div class="s">place passed to reserve</div></div></div>
      <div class="grid2">
        <div class="card"><div class="card-h"><h2>Invite tracker</h2><span class="sub">Click a name to see their phone</span></div><div>${rows}</div></div>
        <div>${phoneHTML(APPS.find(c => c.id === ST.phoneId))}<div class="phone-cap">${esc(APPS.find(c => c.id === ST.phoneId).name)}'s phone · ${ST.inv[ST.phoneId].ch}</div></div>
      </div>
      <div class="others">
        <div class="oc"><h3>Reserve list ${chip([String(D.reserve.filter(c => !ST.inv[c.id]).length), 'amber'])}</h3><div class="msg">No message. Reserve applicants are only contacted if a place opens (interview invite) or after 5 days (standard "not selected" message).</div><div class="foot">Internal only.</div></div>
        <div class="oc"><h3>Not shortlisted ${chip([String(D.not.length), 'grey'])}</h3><div class="msg">${notMsg}</div><div class="foot">Sent at 09:48, after ${ST.approval === 'review' ? 'you approved' : 'ranking'}.</div></div>
        <div class="oc"><h3>Not eligible ${chip([String(D.inel.length), 'rose'])}</h3><div class="msg">"Thanks for applying. This job needs [the must-have they didn't meet]. You told us [their answer], so it isn't a match. Ask a person to review: hr.link/m/…"</div><div class="foot">${inelNote}</div></div>
      </div>
      <div class="cta"><button class="btn" onclick="J.go(2)">← Back</button><button class="btn pri big" onclick="J.next()">See the audit trail →</button></div>`;
  }
  function phoneHTML(c) {
    const iv = ST.inv[c.id], K = C(), sms = iv.ch === 'SMS';
    const opts = ST.freeSlots.slice(0, 3);
    const b = [];
    b.push(['bot', `Hi ${first(c)} 👋 Good news: you've been shortlisted for <b>${JOB.title} (night shift)</b> at the ${K.site}.`, '09:48']);
    b.push(['bot', sms ? `Reply with a number to pick a 15-min interview: 1 = ${SLOTS[0]}, 2 = ${SLOTS[1]}, 3 = ${SLOTS[2]}` : 'Pick a time for a 15-minute interview:', '09:48']);
    let act = '';
    if (iv.status === 'booked') {
      b.push(['me', sms ? '1' : iv.slot, iv.t.booked]);
      b.push(['bot', `Booked ✅ <b>${iv.slot}</b>. We'll send a reminder the day before. To change it, just reply here.`, iv.t.booked]);
      act = '<div class="ph-note">Booked. Recorded in the audit trail.</div>';
    } else if (iv.status === 'declined') {
      b.push(['me', 'Sorry, I took another job.', iv.t.declined]);
      b.push(['bot', 'Thanks for letting us know, and good luck! We\'ve kept your details in case you\'d like to apply again.', iv.t.declined]);
      act = '<div class="ph-note">Declined. The next reserve was invited.</div>';
    } else if (iv.status === 'noreply') {
      b.push(['bot', 'Reminder: please pick an interview time to keep your place.', '1 Nov']);
      act = '<div class="ph-note">No reply yet.</div>';
    } else if (c.id === MARCUS.id && iv.status === 'delivered') {
      act = opts.map((s, i) => `<button class="opt ${i === 0 ? 'pulse' : ''}" onclick="J.book('${s}')">${s}</button>`).join('');
    } else {
      act = '<div class="ph-note">Waiting for a reply…</div>';
    }
    return `<div class="phone ${sms ? 'sms' : ''}"><div class="ph-top"><div class="av">HR</div><div><b>${sms ? '+1 555 0142 · Logistics Careers' : 'Logistics Careers ✓'}</b><span>${sms ? 'Text message' : 'WhatsApp · verified business'}</span></div></div>
      <div class="ph-body" id="phbody">${b.map(m => `<div class="bub ${m[0]}">${m[1]}<span class="tm">${m[2] || ''}</span></div>`).join('')}</div><div class="ph-act">${act}</div></div>`;
  }

  /* ---------- Step 5: audit ---------- */
  function viewAudit(standalone) {
    const D = derive(), K = C();
    const booked = APPS.filter(c => ST.inv[c.id] && ST.inv[c.id].status === 'booked').length;
    const fun = [['Applied', 48], ['Eligible', D.elig.length], ['Shortlisted', D.short.length + ST.promoted.length], ['Booked', booked]];
    const rate = (grp, key) => { const g = APPS.filter(c => c[key] === grp); const s = g.filter(c => ST.inv[c.id]).length; return { n: g.length, r: g.length ? s / g.length : 0 }; };
    const pair = (a, b, key) => { const x = rate(a, key), y = rate(b, key); const ratio = Math.min(x.r, y.r) / (Math.max(x.r, y.r) || 1); return `<div class="r"><span>${a} ${Math.round(x.r * 100)}% · ${b} ${Math.round(y.r * 100)}%</span><span class="ratio ${ratio >= 0.8 ? 'ok' : ''}">${ratio.toFixed(2)} ${ratio >= 0.8 ? '✓' : '⚠'}</span></div>`; };
    return `${standalone ? '' : `<div class="intro"><div><div class="who">Step 5 · For auditors</div><h1>Audit trail: every step, for every applicant</h1>
      <p>Each record is written when the step happens and can't be edited later. Pick anyone to see what the agent checked, how they were ranked, what they were told, and who decided.</p></div></div>`}
      <div class="aud-top">
        <div class="card"><div class="card-b"><div class="sect-t">This round</div><div class="kvs">
          <span class="k">Job</span><span class="v">${JOB.title} · ${JOB.shift}, ${K.site}</span>
          <span class="k">Rules</span><span class="v">${JOB.rules} (${JOB.rulesNote})</span>
          <span class="k">Shortlist size</span><span class="v">${ST.n} + ${ST.reserve} reserve, set by ${K.recruiter}</span>
          <span class="k">Approval</span><span class="v">${ST.approval === 'review' ? `Recruiter reviewed the shortlist (${K.recruiter}, 09:47)` : 'Automatic (recruiter setting)'}</span>
          <span class="k">"Not eligible"</span><span class="v">${K.confirmNo ? 'Confirmed by a recruiter (Germany setting)' : 'Sent by the agent, with a review link'}</span></div></div></div>
        <div class="card"><div class="card-b"><div class="sect-t">Funnel</div><div class="funnel">${fun.map(f => `<div class="fun"><span>${f[0]}</span><div class="b"><i style="width:${f[1] / 48 * 100}%"></i></div><span class="n">${f[1]}</span></div>`).join('')}</div></div></div>
        <div class="card"><div class="card-b"><div class="sect-t">Fairness check <span class="lock">invited ÷ applied, by group</span></div><div class="fair">
          ${pair('Women', 'Men', 'gender')}${pair('Under 40', '40+', 'age')}
          <div class="idt">Ratio of lowest to highest rate, needs 0.80 or more. Groups are self-declared, optional and never shown to the agent. Small demo sample.</div></div></div></div>
      </div>
      <div class="aud-grid">
        <div class="card"><div class="card-b" style="padding-bottom:10px"><input class="search" id="aq" placeholder="Search name or ID…" value="${esc(ST.aQ)}" oninput="J.aq(this.value)">
          <div class="tabs" style="margin-top:10px">${[['all', 'All'], ['int', 'Invited'], ['res', 'Reserve'], ['not', 'Not shortlisted'], ['inel', 'Not eligible']].map(t => `<button class="tab ${ST.aFilter === t[0] ? 'on' : ''}" onclick="J.af('${t[0]}')">${t[1]}</button>`).join('')}</div></div>
          <div class="alist" id="alist">${auditListHTML()}</div>
          <div class="card-b" style="border-top:1px solid var(--line)"><button class="btn" style="width:100%" onclick="J.csv()">Export all ${APPS.length} records (CSV)</button></div></div>
        <div class="card" id="adetail">${auditDetailHTML()}</div>
      </div>
      ${standalone ? '' : `<div class="cta"><button class="btn" onclick="J.go(3)">← Back</button><button class="btn" onclick="J.reset()">Start again</button></div>`}`;
  }
  function auditListHTML() {
    const q = ST.aQ.trim().toLowerCase();
    const list = APPS.filter(c => {
      if (q && !(c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))) return false;
      if (ST.aFilter === 'int') return !!ST.inv[c.id];
      if (ST.aFilter === 'res') return c.band === 'reserve' && !ST.inv[c.id];
      if (ST.aFilter === 'not') return c.band === 'not';
      if (ST.aFilter === 'inel') return !c.eligible;
      return true;
    });
    if (!list.length) return '<div class="card-b idt">No matches.</div>';
    return list.map(c => `<div class="arow ${ST.aSel === c.id ? 'sel' : ''}" onclick="J.asel('${c.id}')"><div><div class="nm">${esc(c.name)}</div><div class="idt">${c.id}${c.rank ? ` · rank #${c.rank}` : ''}</div></div>${chip(outcomeOf(c))}</div>`).join('');
  }
  function auditDetailHTML() {
    const c = APPS.find(x => x.id === ST.aSel) || APPS[0];
    return `<div class="card-h"><div><h2>${esc(c.name)} <span class="idt">${c.id}</span></h2><div class="sub">${JOB.title} · ${C().site}</div></div>
      <div style="display:flex;gap:8px;align-items:center">${chip(outcomeOf(c))}<button class="btn" onclick="J.json('${c.id}')">Export record (JSON)</button></div></div>
      <div class="card-b">${timelineHTML(c)}</div>`;
  }

  /* ---------- Drawer ---------- */
  function renderDrawer() {
    const d = $('#drawer'), s = $('#scrim'); if (!d) return;
    if (!ST.drawer) { d.classList.remove('on'); s.classList.remove('on'); return; }
    const c = APPS.find(x => x.id === ST.drawer);
    const canOverride = ST.ranked && !ST.approved && c.eligible && c.band !== 'short';
    d.innerHTML = `<div class="dr-h"><div><div class="idt">${c.id} · ${JOB.title}</div><h2 style="font-size:19px;letter-spacing:-0.01em">${esc(c.name)}</h2><div style="margin-top:6px">${chip(outcomeOf(c))}</div></div><button class="x" onclick="J.close()" aria-label="Close">✕</button></div>
      <div class="dr-b">${c.note ? `<div class="callout" style="margin-bottom:12px">${esc(c.note)}</div>` : ''}${timelineHTML(c)}
      ${canOverride ? `<div class="callout amber" style="margin-top:6px"><b>Recruiter option:</b> add ${esc(first(c))} to the shortlist anyway. Your reason is recorded in the audit trail. <div style="margin-top:8px"><button class="btn warn" onclick="J.override('${c.id}')">Add to shortlist</button></div></div>` : ''}</div>`;
    d.classList.add('on'); s.classList.add('on');
  }

  /* ---------------- Render ---------------- */
  function render(animate) {
    renderBar();
    const st = $('#stage'); if (!st) return;
    const views = [viewSetup, viewCheck, viewRank, viewInvite, () => viewAudit(false)];
    st.innerHTML = VIEW === 'audit' ? viewAudit(true) : views[ST.step]();
    st.classList.remove('anim'); if (animate) { void st.offsetWidth; st.classList.add('anim'); }
    const pb = $('#phbody'); if (pb) pb.scrollTop = pb.scrollHeight;
    renderDrawer();
    if (VIEW !== 'audit') {
      if (ST.step === 1 && !ST.checked) runCheck();
      if (ST.step === 2 && !ST.ranked) runRank();
    }
  }
  function refresh() { render(false); }

  /* ---------------- Actions ---------------- */
  window.J = {
    go(i) { if (i > ST.maxStep) return; ST.step = i; render(true); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    next() {
      if (ST.step === 2) return J.approve();
      ST.step = Math.min(4, ST.step + 1); ST.maxStep = Math.max(ST.maxStep, ST.step); render(true); window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    country(k) { if (ST.checked) return; ST.country = k; if (!COUNTRIES[k].autoAllowed) ST.approval = 'review'; refresh(); toast(`Rules for ${COUNTRIES[k].label} applied.`); },
    approval(a) { ST.approval = a; refresh(); },
    set(key, d) { if (ST.approved) return; const D = derive(); const max = key === 'n' ? Math.min(25, D.elig.length || 25) : 10; ST[key] = Math.max(key === 'n' ? 1 : 0, Math.min(max, ST[key] + d)); refresh(); },
    f2(f) { ST.f2 = f; refresh(); },
    approve() {
      if (!ST.approved) { ST.approved = true; startSim(false, false); toast(ST.approval === 'review' ? `Shortlist approved by ${C().recruiter}. Invites going out now.` : 'Agent is sending invites.'); }
      ST.step = 3; ST.maxStep = Math.max(ST.maxStep, 3); render(true); window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    phone(id) { ST.phoneId = id; refresh(); },
    book(slot) { const iv = ST.inv[MARCUS.id]; ST.freeSlots = ST.freeSlots.filter(s => s !== slot); iv.status = 'booked'; iv.slot = slot; iv.t.booked = tick(); refresh(); toast(`Marcus booked ${slot}. Logged in the audit trail.`); },
    confirmDE() { ST.deConfirmed = true; ST.deConfirmedAt = tick(); refresh(); toast(`${C().recruiter} confirmed. Applicants are told why, with a review link.`); },
    open(id) { ST.drawer = id; renderDrawer(); },
    close() { ST.drawer = null; renderDrawer(); },
    override(id) { ST.overrides.push(id); ST.drawer = null; refresh(); toast('Added to the shortlist. Your reason is in the audit trail.'); },
    aq(v) { ST.aQ = v; $('#alist').innerHTML = auditListHTML(); },
    af(f) { ST.aFilter = f; refresh(); const i = $('#aq'); if (i && ST.aQ) { i.focus(); i.setSelectionRange(ST.aQ.length, ST.aQ.length); } },
    asel(id) { ST.aSel = id; $('#alist').innerHTML = auditListHTML(); $('#adetail').innerHTML = auditDetailHTML(); },
    json(id) { const c = APPS.find(x => x.id === id); download(`audit-${id}.json`, JSON.stringify(recordJSON(c), null, 2), 'application/json'); toast(`Exported audit record for ${id}.`); },
    csv() {
      const head = ['applicant_id', 'name', 'applied', 'eligible', 'reason_not_eligible', 'score', 'rank', 'band', 'invite_status', 'interview_slot', 'channel'];
      const rows = APPS.map(c => { const iv = ST.inv[c.id] || {}; return [c.id, c.name, hm(c.app), c.status === 'awaiting' ? 'awaiting reply' : c.eligible ? 'yes' : 'no', c.reason || '', c.sc ? c.sc.total : '', c.rank || '', c.band || '', iv.status || '', iv.slot || '', chan(c)]; });
      download('audit-all-applicants.csv', [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv'); toast('Exported all records (CSV).');
    },
    reset() { location.href = location.pathname; }
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ST.drawer) J.close(); });

  /* ---------------- Boot ---------------- */
  const q = new URLSearchParams(location.search);
  if (COUNTRIES[q.get('country')]) ST.country = q.get('country');
  if (!C().autoAllowed) ST.approval = 'review';
  const ff = VIEW === 'audit' ? 4 : Math.max(0, Math.min(4, parseInt(q.get('step') || '1', 10) - 1));
  if (ff >= 1) ST.checked = true;
  if (ff >= 2) ST.ranked = true;
  if (ff >= 3) { ST.approved = true; startSim(true, ff >= 4); if (C().confirmNo && ff >= 4) { ST.deConfirmed = true; ST.deConfirmedAt = '09:55'; } }
  ST.step = ff; ST.maxStep = ff;
  if (q.get('open')) ST.drawer = q.get('open');
  render(true);
})();
