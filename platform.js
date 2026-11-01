/* Workforce Cloud · Recruiting: AI Screening Agent (prototype, sample data only) */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const plural = (n, w, p) => `${n} ${n === 1 ? w : (p || w + 's')}`;

  /* ================= Config ================= */
  const COUNTRY = {
    US: { label: 'United States', the: 'the US', langs: 'English, Spanish' },
    IN: { label: 'India', the: 'India', langs: 'English, Hindi, Kannada' },
    DE: { label: 'Germany', the: 'Germany', langs: 'German, English' }
  };
  const REQS = [
    { id: 'REQ-8821', title: 'Warehouse Associate', shift: 'Night shift', hours: '10 pm – 6 am', site: 'Dallas fulfilment centre', city: 'Dallas', country: 'US', openings: 8, recruiter: 'J. Lee', lift: '23 kg (50 lb)', base: 24 },
    { id: 'REQ-9104', title: 'Sorting Associate', shift: 'Morning shift', hours: '6 am – 2 pm', site: 'Bengaluru sorting hub', city: 'Bengaluru', country: 'IN', openings: 12, recruiter: 'R. Iyer', lift: '15 kg', base: 30 },
    { id: 'REQ-7409', title: 'Warehouse Associate', shift: 'Night shift', hours: '10 pm – 6 am', site: 'Leipzig logistics centre', city: 'Leipzig', country: 'DE', openings: 6, recruiter: 'A. Schmidt', lift: '23 kg', base: 15 }
  ];
  const DATES = ['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31'];
  const TODAY = 7;
  const fmtDate = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); if (n) d.setUTCDate(d.getUTCDate() + n); return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); };
  const shortDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const CRITERIA = [
    { key: 'exp', label: 'Relevant hands-on experience', w: 35, color: '#0F766E' },
    { key: 'flex', label: 'Extra shift flexibility', w: 20, color: '#0EA5E9' },
    { key: 'start', label: 'Can start soon', w: 15, color: '#8B5CF6' },
    { key: 'season', label: 'Available all season', w: 15, color: '#F59E0B' },
    { key: 'certs', label: 'Equipment & safety skills', w: 15, color: '#EC4899' }
  ];
  const NOT_USED = ['name', 'age', 'gender', 'photo', 'home address', 'career gaps', 'CV wording or layout', 'school'];
  const EXP = [['Warehouse operative', 1], ['Delivery driver', .9], ['Retail stockroom', .9], ['Line cook', .85], ['Construction labourer', .85], ['Cleaner', .7], ['Call centre agent', .3], ['Student, no paid work', 0]];
  const FIRST = ['Ava', 'Noah', 'Mia', 'Liam', 'Zara', 'Omar', 'Elena', 'Ravi', 'Chloe', 'Mateo', 'Fatima', 'Ethan', 'Grace', 'Yusuf', 'Sofia', 'Daniel', 'Ines', 'Kofi', 'Hannah', 'Arjun', 'Lucia', 'Ben', 'Nadia', 'Leo', 'Amara', 'Jonas', 'Priya', 'Carlos', 'Mei', 'Felix', 'Layla', 'Isaac', 'Rosa', 'Hugo', 'Anika', 'Victor', 'Selin', 'Owen', 'Keisha', 'Paulo', 'Ingrid', 'Tariq', 'Deepa', 'Lars', 'Maya', 'Sunil', 'Clara', 'Jamal'];
  const LAST = ['Johnson', 'Schulz', 'Reddy', 'Garcia', 'Okafor', 'Nguyen', 'Müller', 'Brown', 'Haddad', 'Silva', 'Kowalski', 'Sharma', 'Davies', 'Rossi', 'Mensah', 'Fischer', 'Lopez', 'Ivanova', 'Chen', 'Hughes', 'Nair', 'Wagner', 'Adeyemi', 'Moreau', 'Patel', 'Becker', 'Kim', 'Ortiz', 'Iyer', 'Weber'];

  /* ================= Settings (current) ================= */
  const SET = {
    enabled: { US: true, IN: true, DE: true },
    freq: 'daily', time: '09:30', everyHours: 4,
    nMode: 'fixed', perReq: { 'REQ-8821': 10, 'REQ-9104': 12, 'REQ-7409': 6 }, ratio: 1.25, reserve: 5,
    approval: { US: 'review', IN: 'auto', DE: 'review' },
    whatsapp: true, sms: true, quietStart: '21:00', quietEnd: '08:00', remind: 24, giveUp: 48,
    notElig: { US: 'auto', IN: 'auto', DE: 'confirm' }, notShort: 'afterApproval',
    pause: 0.8, spot: 2, retention: 6
  };
  let SAVED = JSON.parse(JSON.stringify(SET));
  const CHANGES = [
    { t: '2026-10-12 16:20', who: 'Admin M. Rossi', what: 'Screening rules v3 published (must-haves and 5 ranking criteria), approved by legal' },
    { t: '2026-10-20 11:05', who: 'Admin M. Rossi', what: 'Processing frequency set to daily at 09:30' },
    { t: '2026-10-21 09:12', who: 'Admin M. Rossi', what: 'Germany: "not eligible" set to recruiter confirmation; auto-send locked (pending works council)' },
    { t: '2026-10-22 14:40', who: 'Recruiter J. Lee', what: 'REQ-8821 Dallas: shortlist size 8 → 10' },
    { t: '2026-10-23 10:02', who: 'Recruiter R. Iyer', what: 'India: approval changed to "send invites automatically"' }
  ];

  /* ================= Data generation ================= */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const HERO = {
    3: { name: 'Tom Becker', cv: true, m: { rtw: true, shift: true, lift: true }, exp: ['Warehouse operative', 1], months: 30, flex: 'weekends', startDays: 10, season: true, certs: ['Forklift', 'RF scanner'], whatsapp: true, declines: true },
    7: { name: 'Aisha Bello', cv: true, m: { rtw: true, shift: true, lift: true }, exp: ['Retail stockroom', .9], months: 38, flex: 'both', startDays: 5, season: true, certs: ['RF scanner', 'Safety training'], whatsapp: true, gap: true },
    15: { name: 'Dana Ortiz', cv: true, m: { rtw: true, shift: 'check', lift: true }, a: { shift: false }, exp: ['Cleaner', .7], months: 20, flex: 'none', startDays: 7, season: true, certs: [], whatsapp: true },
    22: { name: 'Marcus Vance', cv: false, m: { rtw: true, shift: null, lift: null }, a: { shift: true, lift: true }, exp: ['Line cook', .85], months: 36, flex: 'both', startDays: 3, season: true, certs: ['Safety training'], whatsapp: true, candidateLink: 'marcus' },
    30: { name: 'Lee Wong', cv: true, m: { rtw: true, shift: true, lift: true }, exp: ['Delivery driver', .9], months: 24, flex: 'both', startDays: 12, season: true, certs: ['Safety training'], whatsapp: false },
    41: { name: 'Jordan Kim', cv: true, m: { rtw: true, shift: true, lift: null }, exp: ['Retail stockroom', .9], months: 14, flex: 'weekends', startDays: 9, season: false, certs: [], whatsapp: true, awaiting: true }
  };
  let SEQ = 20000;
  function genApplicant(r, used) {
    let name;
    do { name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`; } while (used.has(name));
    const sr = r(), lr = r(), rr = r(), ex = EXP[Math.floor(r() * EXP.length)];
    const c = {
      name, cv: r() < 0.68,
      m: { rtw: rr < 0.04 ? 'check' : true, shift: sr < 0.12 ? 'check' : sr < 0.24 ? null : true, lift: lr < 0.03 ? 'check' : lr < 0.12 ? null : true },
      exp: ex, months: ex[1] === 0 ? 0 : 3 + Math.floor(r() * 50),
      flex: ['both', 'both', 'weekends', 'weekends', 'none'][Math.floor(r() * 5)], startDays: 1 + Math.floor(r() * 28),
      season: r() < 0.75, certs: ['Forklift', 'RF scanner', 'Safety training'].filter(() => r() < 0.3),
      whatsapp: r() < 0.86, gap: r() < 0.15, awaiting: false
    };
    c.a = { rtw: false, shift: c.m.shift === 'check' ? r() < 0.15 : r() < 0.8, lift: c.m.lift === 'check' ? false : r() < 0.92 };
    if (r() < 0.025 && (c.m.shift === null || c.m.lift === null)) c.awaiting = true;
    return c;
  }
  function scoreOf(c) {
    const exp = Math.round(35 * Math.min(c.months, 36) / 36 * c.exp[1]);
    const flex = { both: 20, weekends: 13, none: 5 }[c.flex];
    const start = c.startDays <= 7 ? 15 : c.startDays <= 14 ? 11 : c.startDays <= 21 ? 6 : 2;
    const season = c.season ? 15 : 6;
    const certs = Math.min(15, (c.certs.includes('Forklift') ? 8 : 0) + (c.certs.includes('RF scanner') ? 4 : 0) + (c.certs.includes('Safety training') ? 3 : 0));
    const ch = c.whatsapp ? 'WhatsApp' : 'SMS';
    return {
      parts: { exp, flex, start, season, certs }, total: exp + flex + start + season + certs,
      ev: {
        exp: c.months ? `${c.exp[0]}, ${c.months} months (${c.cv ? 'CV' : ch + ' answer'})` : 'No paid work yet',
        flex: { both: 'Weekends and overtime', weekends: 'Weekends only', none: 'Standard shifts only' }[c.flex] + ' (form)',
        start: `Can start in ${c.startDays} days (form)`, season: c.season ? 'Full season (form)' : 'Part of the season (form)',
        certs: c.certs.length ? c.certs.join(', ') : 'None listed'
      }
    };
  }
  const hm = m => { const t = 360 + m; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

  function buildRun(req, d) {
    const iso = DATES[d], r = rng(hash(req.id + iso));
    const hero = req.id === 'REQ-8821' && d === TODAY;
    const count = hero ? 48 : Math.max(10, req.base + Math.floor(r() * 14) - 6);
    const used = new Set(), apps = [];
    for (let i = 0; i < count; i++) {
      let c = hero && HERO[i] ? { ...HERO[i], a: HERO[i].a || { rtw: false, shift: false, lift: false }, persona: true } : genApplicant(r, used);
      if (!c.a) c.a = {};
      used.add(c.name);
      c.id = 'A-' + (++SEQ);
      c.app = Math.round(i * (200 / count) + r() * 3);
      c.ansAt = c.app + 3 + Math.floor(r() * 8);
      c.roll = r();
      apps.push(c);
    }
    const country = req.country;
    const run = {
      id: `RUN-${req.id.slice(4)}-${iso.slice(5).replace('-', '')}`, req, d, iso, time: '09:30', apps,
      N: d === TODAY ? SET.perReq[req.id] : (req.id === 'REQ-8821' && d < 3 ? 8 : SET.perReq[req.id]),
      reserve: SET.reserve, approval: d < 6 && country === 'IN' ? 'review' : SET.approval[country],
      status: hero ? 'pending' : 'done', inv: {}, promoted: [], overrides: [], rules: 'v3'
    };
    evaluate(run);
    if (run.status === 'done') finishRun(run, r, run.approval === 'review' ? `Recruiter ${req.recruiter}` : 'Agent (auto-send)', run.approval === 'review' ? '09:4' + (2 + Math.floor(r() * 7)) : '09:46');
    return run;
  }
  function mustDefs(req) {
    const the = COUNTRY[req.country].the;
    return [
      { key: 'rtw', label: `Allowed to work in ${the}`, fail: `Not allowed to work in ${the}`, q: { check: `Just checking: are you allowed to work in ${the}?` } },
      { key: 'shift', label: `Can work ${req.shift.toLowerCase()} (${req.hours})`, fail: `Can't work the ${req.shift.toLowerCase()}`, q: { null: `The shift is ${req.hours}. Can you work these hours?`, check: `Your form says you can't work ${req.hours}. Could you work these hours?` } },
      { key: 'lift', label: `Can lift ${req.lift}, with or without adjustments`, fail: `Can't lift ${req.lift}, even with adjustments`, q: { null: `The job means lifting up to ${req.lift}. Can you do that, with or without adjustments?`, check: `Your form says you can't lift ${req.lift}. With adjustments (for example lifting aids), could you?` } }
    ];
  }
  function evaluate(run) {
    const defs = mustDefs(run.req);
    run.apps.forEach(c => {
      const ch = c.whatsapp ? 'WhatsApp' : 'SMS';
      c.ch = ch;
      c.missing = [];
      defs.forEach(dd => { const v = c.m[dd.key]; if (v === null || v === 'check') c.missing.push({ text: dd.q[v === null ? 'null' : 'check'], ans: c.a[dd.key] ? 'Yes' : 'No' }); });
      if (!c.cv) c.missing.push({ text: 'What was your most recent job, and for how long?', ans: `${c.exp[0]}, ${c.months >= 12 ? Math.round(c.months / 12) + ' years' : c.months + ' months'}` });
      if (c.awaiting) { c.status = 'awaiting'; c.eligible = false; return; }
      c.must = defs.map(dd => { const v = c.m[dd.key], ok = v === true || c.a[dd.key] === true; return { label: dd.label, ok, fail: dd.fail, ev: v === true ? 'Application form' : v === null ? `${ch} answer` : (ok ? `Form said no, corrected on ${ch}` : `Form said no, confirmed on ${ch}`) }; });
      c.eligible = c.must.every(x => x.ok);
      c.status = c.eligible ? 'eligible' : 'inel';
      c.reason = c.eligible ? null : c.must.find(x => !x.ok).fail;
      c.sc = c.eligible ? scoreOf(c) : null;
    });
    rank(run);
  }
  function rank(run) {
    const elig = run.apps.filter(c => c.eligible).sort((a, b) => b.sc.total - a.sc.total || a.app - b.app);
    let left = run.reserve;
    elig.forEach((c, i) => {
      c.rank = i + 1;
      if (i < run.N || run.overrides.includes(c.id)) c.band = 'short';
      else if (left > 0) { c.band = 'reserve'; c.resN = run.reserve - left + 1; left--; }
      else c.band = 'not';
    });
    run.apps.filter(c => !c.eligible).forEach(c => { c.band = null; c.rank = null; });
    run.elig = elig;
    // Balanced synthetic self-declared groups for the demo fairness report
    const G = ['Women', 'Men', 'Men', 'Women', 'Women', 'Men', 'Men', 'Women', 'Women', 'Men', 'Not stated', 'Men'];
    const order = elig.concat(run.apps.filter(c => !c.eligible));
    order.forEach((c, i) => { c.gender = G[i % G.length]; c.age = ['Under 40', 'Under 40', '40+'][(i + 1) % 3]; });
  }
  function finishRun(run, r, approvedBy, at) {
    run.status = 'done'; run.approvedBy = approvedBy; run.approvedAt = at;
    if (run.req.country === 'DE') { run.confirmedBy = `Recruiter ${run.req.recruiter}`; run.confirmedAt = '09:5' + Math.floor((r ? r() : .3) * 9); }
    const slots = []; for (const dd of [2, 3]) for (let h = 10; h < 17; h++) for (const mm of ['00', '30']) slots.push(`${fmtDate(run.iso, dd)}, ${h}:${mm}`);
    let clock = 0;
    const tick = () => hm(232 + (clock++) * 3);
    const short = run.elig.filter(c => c.band === 'short');
    const reserves = run.elig.filter(c => c.band === 'reserve');
    const book = c => { run.inv[c.id] = { status: 'booked', ch: c.ch, sent: '09:48', slot: slots.shift(), at: tick() }; };
    short.forEach(c => {
      if (c.declines || (!c.persona && c.roll > 0.93)) {
        run.inv[c.id] = { status: 'declined', ch: c.ch, sent: '09:48', at: tick() };
        const nx = reserves.find(x => !run.inv[x.id]);
        if (nx) { run.promoted.push(nx.id); book(nx); run.inv[nx.id].sent = run.inv[c.id].at; run.inv[nx.id].forName = c.name; }
      } else if (!c.persona && c.roll < 0.1) run.inv[c.id] = { status: 'noreply', ch: c.ch, sent: '09:48' };
      else book(c);
    });
  }

  const RUNS = [];
  REQS.forEach(req => DATES.forEach((_, d) => RUNS.push(buildRun(req, d))));
  const runOf = id => RUNS.find(r => r.id === id);
  const findApp = id => { for (const r of RUNS) { const c = r.apps.find(a => a.id === id); if (c) return [c, r]; } return [null, null]; };

  /* ================= Outcomes & trail ================= */
  function outcome(c, run) {
    const inv = run.inv[c.id];
    if (c.status === 'awaiting') return ['Waiting for reply', 'grey', 'wait'];
    if (c.status === 'inel') return run.req.country === 'DE' && !run.confirmedBy ? ['Not eligible · to confirm', 'amber', 'inel'] : ['Not eligible', 'rose', 'inel'];
    if (run.status === 'pending') return c.band === 'short' ? [`Proposed #${c.rank}`, 'ai', 'pending'] : c.band === 'reserve' ? [`Reserve #${c.rank}`, 'amber', 'pending'] : [`Below cut-off #${c.rank}`, 'grey', 'pending'];
    if (inv) return inv.status === 'booked' ? ['Interview booked', 'ai', 'int'] : inv.status === 'declined' ? ['Declined invite', 'grey', 'int'] : inv.status === 'noreply' ? ['Invited · no reply', 'amber', 'int'] : ['Invited', 'sky', 'int'];
    if (c.band === 'reserve') return run.d <= TODAY - 5 ? ['Not selected (reserve ended)', 'grey', 'not'] : [`Reserve #${c.resN} · internal`, 'amber', 'res'];
    return ['Not shortlisted', 'grey', 'not'];
  }
  const chip = o => `<span class="chip ${o[1]}">${esc(o[0])}</span>`;
  function platformStage(c, run) {
    const o = outcome(c, run);
    return { int: 'Interview', inel: o[1] === 'amber' ? 'Screening' : 'Rejected', not: 'Not progressed', res: 'Screening', pending: 'Screening', wait: 'Screening' }[o[2]];
  }
  function trail(c, run) {
    const ev = [], day = shortDate(run.iso), req = run.req;
    const add = (t, actor, title, kind, detail, x) => ev.push(Object.assign({ t: `${day} ${t}`, actor, title, kind, detail }, x || {}));
    add(hm(c.app), 'Applicant', 'Application received', 'info', `Via ${c.cv ? 'job board' : 'phone, career site'}. CV: ${c.cv ? 'attached' : 'none'}. Agreed to WhatsApp/SMS contact.`);
    if (c.missing.length) {
      add(hm(c.app + 1), 'Agent', `First reply: asked ${plural(c.missing.length, 'question')} on ${c.ch}`, 'info', 'Sent within a minute of applying. Only what was missing or looked like a "no".', { rows: c.missing.map(q => [q.text, '']) });
      if (c.status === 'awaiting') { add(hm(c.app + 1) + ' +24h', 'Agent', 'No reply: reminder sent', 'warn', 'No decision is made until the applicant replies. The applicant is not ranked in this run.'); return ev; }
      add(hm(c.ansAt), 'Applicant', `Answered on ${c.ch}`, 'info', '', { rows: c.missing.map(q => [q.text, q.ans]) });
    } else add(hm(c.app + 1), 'Agent', `First reply sent on ${c.ch}`, 'info', 'Confirmed the application and said when to expect an update.');
    add('09:30', 'Agent', `Picked up by agent run ${run.id}`, 'info', `Rules ${run.rules}. Hidden before any check or ranking: ${NOT_USED.slice(0, 6).join(', ')}.`);
    const tc = '09:30';
    add(tc, 'Agent', c.eligible ? 'Must-haves: all met → eligible' : 'Must-haves: not met → not eligible', c.eligible ? 'ok' : 'bad', `Screening rules ${run.rules} (approved by the hiring manager and legal).`, { must: c.must });
    if (!c.eligible) {
      if (req.country === 'DE') {
        if (!run.confirmedBy) { add(tc, 'Agent', 'Waiting for recruiter to confirm "not eligible"', 'warn', 'Germany setting: a recruiter confirms every "no" before the applicant is told.'); return ev; }
        add(run.confirmedAt, run.confirmedBy, 'Confirmed "not eligible"', 'ok', 'Checked the must-have result and the applicant\'s own answer.');
      }
      const miss = c.must.find(x => !x.ok);
      add(req.country === 'DE' ? run.confirmedAt : tc, 'Agent', `Told the applicant: not selected (${c.ch})`, 'info', `Link to their application data included. If they ask "why?", the agent replies: "This job requires: ${miss.label.toLowerCase()}, and you told us this doesn't work for you, so we couldn't take your application further."`, { q: `"Thanks for applying. We're sorry, but we can't take your application for this job further. Reply WHY to find out why. Your application: hr.link/m/${c.id.slice(2)}"` });
      return ev;
    }
    add('09:45', 'Agent', `Ranked #${c.rank} of ${run.elig.length} eligible · score ${c.sc.total}/100`, 'info', `Scored on the 5 ranking criteria only. Not used: ${NOT_USED.join(', ')}. Ties go to whoever applied first.`, { score: c.sc });
    if (run.overrides.includes(c.id)) add(run.approvedAt || '09:50', `Recruiter ${req.recruiter}`, 'Added to the shortlist (override)', 'warn', 'Reason recorded: "Hiring manager request". Rank unchanged in the record.');
    if (run.status === 'pending') { add('09:45', 'Agent', c.band === 'short' ? `Proposed for the shortlist (top ${run.N})` : c.band === 'reserve' ? 'Proposed for the reserve list' : 'Below the proposed cut-off', 'warn', `Waiting for recruiter ${req.recruiter} to approve the shortlist.`); return ev; }
    const how = run.approval === 'review' ? `Shortlist approved by ${run.approvedBy} at ${run.approvedAt}.` : 'Invites sent automatically (country setting chosen by the recruiter).';
    const promoted = run.promoted.includes(c.id);
    if (c.band === 'short') add(run.approvedAt, run.approval === 'review' ? run.approvedBy : 'Agent', 'Shortlisted for interview', 'ok', `Shortlist size ${run.N} (setting). This applicant was #${c.rank}. ${how}`);
    else if (c.band === 'reserve') {
      add(run.approvedAt, run.approval === 'review' ? run.approvedBy : 'Agent', `Put on the reserve list (#${c.resN})`, 'warn', `Ranked #${c.rank}, just below the shortlist of ${run.N}. ${how}`);
      if (!promoted) {
        add('09:48', 'Agent', 'No message sent (reserve is internal)', 'info', 'The applicant isn\'t told about the reserve list. If a place opens within 5 days they get an interview invite; otherwise they get the standard "not selected" message.');
        if (run.d <= TODAY - 5) ev.push({ t: `${shortDate(DATES[run.d + 5])} 09:48`, actor: 'Agent', title: `Told the applicant: not selected (${c.ch})`, kind: 'info', detail: 'Reserve window (5 days) ended without a place opening. Same message as everyone not shortlisted.', q: `"Thanks for applying. We\'ve gone through your application carefully, but we\'ve found other candidates who more closely match the requirements for this job, so we won\'t be moving forward with your application this time. Reply WHY if you\'d like to know more. Your application: hr.link/m/${c.id.slice(2)}"` });
      }
    } else {
      add(run.approvedAt, run.approval === 'review' ? run.approvedBy : 'Agent', 'Not shortlisted this round', 'bad', `Ranked #${c.rank}; the shortlist was the top ${run.N} plus ${run.reserve} on reserve. ${how}`);
      add('09:48', 'Agent', `Told the applicant: not shortlisted (${c.ch})`, 'info', 'Link to their application data included. If they ask "why?", the agent replies that other candidates matched the job requirements more closely. No score, rank, criteria or interview numbers are shared with the applicant.', { q: `"Thanks for applying. We\'ve gone through your application carefully, but we\'ve found other candidates who more closely match the requirements for this job, so we won\'t be moving forward with your application this time. Reply WHY if you\'d like to know more. Your application: hr.link/m/${c.id.slice(2)}"` });
    }
    const inv = run.inv[c.id];
    if (inv) {
      if (promoted) add(inv.sent, 'Agent', 'Invited from the reserve list', 'ok', `${inv.forName} declined, so the next person on the reserve list was invited automatically.`);
      add(inv.sent, 'Agent', `Interview invite sent by ${inv.ch}`, 'info', 'Delivered.', { q: `"Good news, ${c.name.split(' ')[0]}: you've been shortlisted for ${req.title} (${req.shift.toLowerCase()}) at the ${req.site}. Pick a time for a 15-minute interview."` });
      if (inv.status === 'booked') add(inv.at, 'Applicant', `Booked interview: ${inv.slot}`, 'ok', 'Confirmation sent; reminder the day before.');
      if (inv.status === 'declined') add(inv.at, 'Applicant', 'Declined the interview', 'bad', 'Reason given: "I took another job." Place passed to the next person on the reserve list.');
      if (inv.status === 'noreply') add('09:48 +24h', 'Agent', 'No reply: reminder sent', 'warn', 'If there is still no reply after 48 hours, the place goes to the next reserve.');
    }
    return ev;
  }
  function oneLine(c, run) {
    if (c.status === 'awaiting') return `Asked ${plural(c.missing.length, 'question')} on ${c.ch} → <b>waiting for a reply</b>. No decision yet.`;
    if (c.status === 'inel') return `<b>Not eligible</b>: ${esc(c.reason.toLowerCase())}. Not ranked.`;
    let s = `Met all must-haves → ranked <b>#${c.rank} of ${run.elig.length}</b> (score ${c.sc.total}/100)`;
    if (run.status === 'pending') return s + ` → <b>${c.band === 'short' ? 'proposed for shortlist' : c.band === 'reserve' ? 'proposed reserve' : 'below proposed cut-off'}</b>, waiting for approval.`;
    const inv = run.inv[c.id];
    if (inv) return s + (run.promoted.includes(c.id) ? ' → reserve, then <b>invited</b>' : ` → <b>shortlisted</b> (top ${run.N})`) + (inv.status === 'booked' ? ` → <b>booked ${esc(inv.slot)}</b>.` : inv.status === 'declined' ? ' → <b>declined</b>.' : ' → no reply yet.');
    return s + (c.band === 'reserve' ? (run.d <= TODAY - 5 ? ` → reserve #${c.resN} (not told) → <b>not selected</b> after 5 days.` : ` → <b>reserve #${c.resN}</b> (internal, not told).`) : ` → <b>not shortlisted</b> (cut-off #${run.N}).`);
  }
  function timelineHTML(c, run) {
    const cls = a => a === 'Agent' || a.startsWith('Agent') ? 'agent' : a.startsWith('Recruiter') ? 'recruiter' : 'applicant';
    return `<div class="oneline">${oneLine(c, run)}</div><div class="tl">` + trail(c, run).map(e => {
      let x = '';
      if (e.rows) x += `<table>${e.rows.map(r => `<tr><td>${esc(r[0])}</td>${r[1] ? `<td class="r">${esc(r[1])}</td>` : ''}</tr>`).join('')}</table>`;
      if (e.must) x += `<table>${e.must.map(m => `<tr><td>${esc(m.label)}<div class="idt">${esc(m.ev)}</div></td><td class="${m.ok ? 'okc' : 'badc'}">${m.ok ? '✓ Met' : '✕ Not met'}</td></tr>`).join('')}</table>`;
      if (e.score) x += `<table>${CRITERIA.map(k => `<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${k.color};margin-right:6px"></span>${k.label}<div class="idt">${esc(e.score.ev[k.key])}</div></td><td class="r">${e.score.parts[k.key]} / ${k.w}</td></tr>`).join('')}<tr><td><b>Total</b></td><td class="r">${e.score.total} / 100</td></tr></table>`;
      if (e.q) x += `<div class="q">${esc(e.q)}</div>`;
      return `<div class="ev ${e.kind}"><div class="d"></div><div class="hd"><span class="tm">${esc(e.t)}</span><span class="ac ${cls(e.actor)}">${esc(e.actor)}</span><span class="ti">${esc(e.title)}</span></div>${e.detail ? `<div class="dt">${esc(e.detail)}</div>` : ''}${x}</div>`;
    }).join('') + '</div>';
  }
  function recordJSON(c, run) {
    return {
      applicant: c.id, requisition: run.req.id, job: `${run.req.title} (${run.req.shift})`, site: run.req.site, country: COUNTRY[run.req.country].label,
      agentRun: run.id, date: run.iso, rules: run.rules, settingsAtRun: { shortlistSize: run.N, reserve: run.reserve, approval: run.approval },
      summary: oneLine(c, run).replace(/<[^>]+>/g, ''),
      events: trail(c, run).map(e => ({ time: e.t, actor: e.actor, event: e.title, detail: e.detail || undefined, mustHaves: e.must && e.must.map(m => ({ rule: m.label, met: m.ok, evidence: m.ev })), score: e.score && Object.fromEntries(CRITERIA.map(k => [k.label, { points: e.score.parts[k.key], max: k.w, evidence: e.score.ev[k.key] }])), answers: e.rows, message: e.q }))
    };
  }
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }

  /* ================= UI state ================= */
  const UI = {
    route: 'applications', runId: null, role: 'recruiter', req: 'REQ-8821', appFilter: 'all', drawer: null, drawerTab: 'agent',
    runTab: 'rank', runsCountry: 'all',
    aTab: 'decisions', aFrom: '2026-10-24', aTo: '2026-10-31', aGeo: 'all', aReq: 'all', aOut: 'all', aQ: '', aLimit: 60
  };
  const ROLES = { recruiter: { name: 'J. Lee', label: 'Recruiter', ini: 'JL' }, admin: { name: 'M. Rossi', label: 'Admin', ini: 'MR' }, auditor: { name: 'K. Osei', label: 'Auditor', ini: 'KO' } };
  const pendingRuns = () => RUNS.filter(r => r.status === 'pending');
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200); }

  /* ================= Shell ================= */
  function renderShell() {
    const r = ROLES[UI.role];
    $('#tb-user').innerHTML = `<div class="avatar">${r.ini}</div>`;
    const nav = (id, ic, label, ai, extra) => `<button class="nav ${ai ? 'ai' : ''} ${UI.route === id || (id === 'runs' && UI.route === 'run') ? 'on' : ''}" onclick="P.nav('${id}')"><span class="ic">${ic}</span>${label}${extra || ''}</button>`;
    const pend = pendingRuns().length;
    $('#side').innerHTML = `
      <div class="grp">Recruiting</div>
      ${nav('home', '⌂', 'Home')}${nav('reqs', '▤', 'Requisitions')}${nav('applications', '☰', 'Applications')}${nav('interviews', '◷', 'Interviews')}${nav('offers', '✉', 'Offers')}${nav('reports', '▦', 'Reports')}
      <div class="grp">✦ AI Screening Agent <span class="new">New</span></div>
      ${nav('agent', '◎', 'Overview', true)}${nav('runs', '↻', 'Agent runs', true, pend ? `<span class="ct">${pend}</span>` : '')}${nav('settings', '⚙', 'Settings', true)}${nav('audit', '⚖', 'Audit trail', true)}
      <div class="grp">Help</div>
      <a class="nav" href="candidate.html" target="_blank"><span class="ic">📱</span>Candidate experience ↗</a>`;
  }

  /* ================= Pages ================= */
  function pageApplications() {
    const runs = REQS.map(q => RUNS.find(r => r.req.id === q.id && r.d === TODAY));
    const run = runs.find(r => r.req.id === UI.req);
    const req = run.req, on = SET.enabled[req.country];
    const counts = { all: run.apps.length, new: 0 };
    const rows = run.apps.slice().sort((a, b) => (a.rank || 999) - (b.rank || 999) || a.app - b.app).filter(c => {
      const o = outcome(c, run)[2];
      return UI.appFilter === 'all' || (UI.appFilter === 'short' && (o === 'int' || (o === 'pending' && c.band === 'short'))) || (UI.appFilter === 'inel' && o === 'inel') || (UI.appFilter === 'wait' && o === 'wait');
    });
    const nextRun = SET.freq === 'daily' ? `tomorrow ${SET.time}` : SET.freq === 'hours' ? `in ${SET.everyHours} h` : 'twice daily';
    return `<div class="crumbs">Recruiting › Applications</div>
      <div class="ph"><div><h1>Applications</h1><p>All applications across your open requisitions.</p></div><div style="display:flex;gap:8px"><button class="btn" onclick="P.toast('Existing platform feature.')">Filters</button><button class="btn" onclick="P.toast('Existing platform feature.')">Export</button></div></div>
      <div class="reqtabs">${runs.map(r => `<button class="reqtab ${r.req.id === UI.req ? 'on' : ''}" onclick="P.req('${r.req.id}')"><b>${r.req.title} · ${r.req.city}</b><span>${r.req.id} · ${r.apps.length} new today · ${r.req.openings} openings</span></button>`).join('')}</div>
      <div class="agentbar"><div class="ic">✦</div><div><b><span class="dot ${on ? '' : 'off'}"></span>AI Screening Agent is ${on ? 'on' : 'paused'} for this requisition</b>
        <div class="s">Last run today 09:30: ${run.apps.length} processed · ${run.elig.length} eligible · ${run.status === 'pending' ? `<b>shortlist of ${run.N} waiting for your approval</b>` : `${run.N} shortlisted`} · Next run ${nextRun}</div></div>
        <div class="r">${run.status === 'pending' ? `<button class="btn ai" onclick="P.openRun('${run.id}')">Review shortlist (${run.N}) →</button>` : `<button class="btn" onclick="P.openRun('${run.id}')">View run</button>`}<button class="btn" onclick="P.nav('settings')">Agent settings</button></div></div>
      <div class="card">
        <div class="card-h"><div class="tabs" style="margin:0;border:none">${[['all', `All ${run.apps.length}`], ['short', 'Shortlisted'], ['inel', 'Not eligible'], ['wait', 'Waiting for reply']].map(t => `<button class="tab ${UI.appFilter === t[0] ? 'on' : ''}" onclick="P.af('${t[0]}')">${t[1]}</button>`).join('')}</div><span class="sub">Columns marked ✦ are added by the AI agent</span></div>
        <div class="scroll"><table class="tbl"><thead><tr><th>Candidate</th><th>Applied</th><th>Source</th><th>Stage</th><th class="aicol">✦ Agent status</th><th class="aicol num">✦ Score</th><th class="aicol">✦ Channel</th></tr></thead><tbody>
        ${rows.map(c => `<tr class="click" onclick="P.open('${c.id}')"><td><div class="nm">${esc(c.name)}</div><div class="idt">${c.id}</div></td><td class="idt">Today ${hm(c.app)}</td><td class="idt">${c.cv ? 'Job board' : 'Career site (mobile)'}</td><td>${esc(platformStage(c, run))}</td>
          <td class="aicol">${chip(outcome(c, run))}</td><td class="aicol num">${c.sc ? `<b>${c.sc.total}</b>` : '<span class="idt">–</span>'}</td><td class="aicol idt">${c.ch}</td></tr>`).join('')}
        </tbody></table></div></div>`;
  }

  function pageAgent() {
    const last7 = RUNS.filter(r => r.d >= 1);
    const apps = last7.reduce((s, r) => s + r.apps.length, 0);
    const elig = last7.reduce((s, r) => s + r.elig.length, 0);
    const booked = last7.reduce((s, r) => s + Object.values(r.inv).filter(i => i.status === 'booked').length, 0);
    const pend = pendingRuns();
    return `<div class="crumbs">Recruiting › AI Screening Agent</div>
      <div class="ph"><div><h1>AI Screening Agent <span class="aitag">✦ Agent</span></h1><p>Runs on top of the applications already in the platform: checks must-haves, ranks eligible applicants, shortlists and books interviews.</p></div>
        <div style="display:flex;gap:8px"><button class="btn" onclick="P.nav('audit')">Audit trail</button><button class="btn ai" onclick="P.nav('settings')">Settings</button></div></div>
      <div class="kpis">
        <div class="kpi"><div class="k">Applications processed</div><div class="v">${apps}</div><div class="s">last 7 days</div></div>
        <div class="kpi ai"><div class="k">Median first reply</div><div class="v">3 min</div><div class="s">was 9 days</div></div>
        <div class="kpi"><div class="k">Eligible</div><div class="v">${Math.round(elig / apps * 100)}%</div><div class="s">${elig} applicants</div></div>
        <div class="kpi ai"><div class="k">Interviews booked</div><div class="v">${booked}</div><div class="s">by WhatsApp/SMS</div></div>
        <div class="kpi amber"><div class="k">Waiting for you</div><div class="v">${pend.length}</div><div class="s">shortlist to approve</div></div></div>
      <div class="g21">
        <div class="card"><div class="card-h"><h2>Needs your attention</h2></div><div class="card-b">
          ${pend.length ? pend.map(r => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b>${r.req.title} · ${r.req.city}</b><div class="idt">${r.id} · today 09:30 · ${r.elig.length} eligible, top ${r.N} proposed</div></div><button class="btn ai" onclick="P.openRun('${r.id}')">Review & approve →</button></div>`).join('') : '<span class="idt">Nothing waiting. All shortlists approved.</span>'}
        </div>
        <div class="card-h" style="border-top:1px solid var(--line)"><h2>Recent runs</h2><a href="#" onclick="P.nav('runs');return false">All runs →</a></div>
        <table class="tbl"><thead><tr><th>Run</th><th>Requisition</th><th class="num">Processed</th><th class="num">Eligible</th><th class="num">Shortlisted</th><th>Status</th></tr></thead><tbody>
          ${RUNS.filter(r => r.d >= 6).sort((a, b) => b.d - a.d).map(r => `<tr class="click" onclick="P.openRun('${r.id}')"><td class="idt">${r.id}<br>${fmtDate(r.iso)} ${r.time}</td><td>${r.req.title} · ${r.req.city}</td><td class="num">${r.apps.length}</td><td class="num">${r.elig.length}</td><td class="num">${r.N}</td><td>${runStatus(r)}</td></tr>`).join('')}
        </tbody></table></div>
        <div class="card"><div class="card-h"><h2>Agent status</h2><a href="#" onclick="P.nav('settings');return false">Settings</a></div><div class="card-b" style="display:grid;gap:10px">
          ${Object.entries(COUNTRY).map(([k, v]) => `<div style="display:flex;justify-content:space-between;align-items:center"><div><b>${v.label}</b><div class="idt">${SET.approval[k] === 'review' ? 'Recruiter approves shortlist' : 'Auto-send invites'}${SET.notElig[k] === 'confirm' ? ' · recruiter confirms "no"' : ''}</div></div><span class="chip ${SET.enabled[k] ? 'ai' : 'grey'}">${SET.enabled[k] ? 'On' : 'Paused'}</span></div>`).join('')}
          <div class="idt" style="border-top:1px solid var(--line);padding-top:10px">Processing: ${freqText()}. Rules v3.</div>
        </div></div>
      </div>`;
  }
  const freqText = () => SET.freq === 'daily' ? `daily at ${SET.time}` : SET.freq === 'twice' ? 'twice daily (09:30, 15:30)' : `every ${SET.everyHours} hours`;
  const runStatus = r => r.status === 'pending' ? '<span class="chip amber">Waiting for approval</span>' : '<span class="chip ai">Completed</span>';

  function pageRuns() {
    const list = RUNS.filter(r => UI.runsCountry === 'all' || r.req.country === UI.runsCountry).sort((a, b) => b.d - a.d || a.req.id.localeCompare(b.req.id));
    return `<div class="crumbs">Recruiting › AI Screening Agent › Agent runs</div>
      <div class="ph"><div><h1>Agent runs <span class="aitag">✦ Agent</span></h1><p>Each run picks up new applications for a requisition, checks, ranks and shortlists them. Open a run to see how every application was processed.</p></div>
      <div class="seg">${[['all', 'All'], ['US', 'United States'], ['IN', 'India'], ['DE', 'Germany']].map(c => `<button class="${UI.runsCountry === c[0] ? 'on' : ''}" onclick="P.rc('${c[0]}')">${c[1]}</button>`).join('')}</div></div>
      <div class="card"><div class="scroll" style="max-height:none"><table class="tbl"><thead><tr><th>Run</th><th>When</th><th>Requisition</th><th>Country</th><th class="num">Processed</th><th class="num">Eligible</th><th class="num">Shortlist</th><th class="num">Booked</th><th>Approved by</th><th>Status</th></tr></thead><tbody>
      ${list.map(r => `<tr class="click" onclick="P.openRun('${r.id}')"><td class="idt">${r.id}</td><td class="idt">${fmtDate(r.iso)} ${r.time}</td><td>${r.req.title} · ${r.req.city}</td><td>${COUNTRY[r.req.country].label}</td><td class="num">${r.apps.length}</td><td class="num">${r.elig.length}</td><td class="num">${r.N}</td><td class="num">${Object.values(r.inv).filter(i => i.status === 'booked').length}</td><td class="idt">${r.approvedBy || '–'}</td><td>${runStatus(r)}</td></tr>`).join('')}
      </tbody></table></div></div>`;
  }

  function pageRun() {
    const run = runOf(UI.runId); if (!run) return pageRuns();
    const booked = Object.values(run.inv).filter(i => i.status === 'booked').length;
    const inel = run.apps.filter(c => c.status === 'inel').length, wait = run.apps.filter(c => c.status === 'awaiting').length;
    const pending = run.status === 'pending', canEdit = pending && UI.role !== 'auditor';
    const tabs = [['rank', 'Ranking & shortlist'], ['checks', 'Must-have checks'], ['invites', 'Invites'], ['messages', 'Messages sent']];
    let body = '';
    if (UI.runTab === 'rank') {
      let html = '';
      const lastRes = run.elig.reduce((acc, c, i) => c.band === 'reserve' ? i : acc, -1);
      run.elig.forEach((c, i) => {
        if (i === run.N) html += `<div class="cut">Shortlist cut-off: top ${run.N}</div>`;
        html += `<div class="rrow ${c.band === 'short' ? 'short' : ''}" onclick="P.open('${c.id}')"><span class="rk">#${c.rank}</span><div><div class="nm">${esc(c.name)}</div><div class="idt">${esc(c.months ? `${c.exp[0]}, ${c.months} mo` : c.exp[0])}${c.gap ? ' · career gap (not used)' : ''}</div></div>
          <div class="sbar">${CRITERIA.map(k => `<i style="width:${c.sc.parts[k.key]}%;background:${k.color}"></i>`).join('')}</div><span class="sc">${c.sc.total}</span><span>${chip(outcome(c, run))}</span></div>`;
        if (i === lastRes) html += '<div class="cut res">Reserve list ends</div>';
      });
      body = `<div class="card">
        <div class="filters" style="align-items:center">
          <div class="fl"><label>Shortlist size</label>${stepper('N', run.N, 1, Math.min(30, run.elig.length), !canEdit)}</div>
          <div class="fl"><label>Reserve</label>${stepper('reserve', run.reserve, 0, 10, !canEdit)}</div>
          <div class="legend" style="margin-left:auto">${CRITERIA.map(k => `<span><i style="background:${k.color}"></i>${k.label}</span>`).join('')}</div></div>
        ${html}</div>`;
    } else if (UI.runTab === 'checks') {
      body = `<div class="card"><div class="scroll"><table class="tbl"><thead><tr><th>Applicant</th><th>Asked on WhatsApp/SMS</th><th>Result</th><th>Reason / evidence</th></tr></thead><tbody>
        ${run.apps.map(c => `<tr class="click" onclick="P.open('${c.id}')"><td><div class="nm">${esc(c.name)}</div><div class="idt">${c.id} · ${hm(c.app)}</div></td><td class="idt">${c.missing.length ? plural(c.missing.length, 'question') + ' · ' + c.ch : '–'}</td><td>${c.status === 'awaiting' ? chip(['Waiting for reply', 'grey']) : c.eligible ? chip(['Eligible', 'ai']) : chip(outcome(c, run))}</td><td class="idt">${c.status === 'awaiting' ? 'Reminder sent' : c.reason ? esc(c.reason) : 'All must-haves met'}</td></tr>`).join('')}
        </tbody></table></div></div>`;
    } else if (UI.runTab === 'invites') {
      const inv = run.apps.filter(c => run.inv[c.id]).sort((a, b) => a.rank - b.rank);
      body = pending ? '<div class="card card-b idt">Invites go out after the shortlist is approved.</div>' : `<div class="card"><table class="tbl"><thead><tr><th>#</th><th>Applicant</th><th>Channel</th><th>Status</th><th>Slot</th></tr></thead><tbody>
        ${inv.map(c => { const i = run.inv[c.id]; return `<tr class="click" onclick="P.open('${c.id}')"><td class="idt">#${c.rank}</td><td><div class="nm">${esc(c.name)}</div>${run.promoted.includes(c.id) ? '<div class="idt">From reserve list</div>' : ''}</td><td class="idt">${i.ch}</td><td>${chip(outcome(c, run))}</td><td class="idt">${esc(i.slot || '–')}</td></tr>`; }).join('')}</tbody></table></div>`;
    } else {
      const cnt = b => run.elig.filter(c => c.band === b && !run.inv[c.id]).length;
      const msgs = [['Interview invite', Object.keys(run.inv).length, '"Good news: you\'ve been shortlisted… pick a time for a 15-minute interview."'],
        ['Reserve list (internal)', '–', 'No message. Reserve applicants are only contacted if a place opens (interview invite) or after 5 days (standard "not selected" message).'],
        ['Not shortlisted', cnt('not'), '"We\'ve gone through your application carefully, but we\'ve found other candidates who more closely match the requirements for this job… Reply WHY if you\'d like to know more."'],
        ['Not eligible', inel, '"We\'re sorry, but we can\'t take your application for this job further. Reply WHY to find out why. Your application: link"'],
        ['Reminder (no reply)', wait + Object.values(run.inv).filter(i => i.status === 'noreply').length, '"Reminder: please reply to keep your application moving."']];
      body = `<div class="card"><table class="tbl"><thead><tr><th>Message</th><th class="num">Sent</th><th>Template</th></tr></thead><tbody>${msgs.map(m => `<tr><td class="nm">${m[0]}</td><td class="num">${pending && m[0] !== 'Not eligible' && m[0] !== 'Reminder (no reply)' ? '<span class="idt">after approval</span>' : m[1]}</td><td class="idt">${m[2]}</td></tr>`).join('')}</tbody></table></div>`;
    }
    return `<div class="crumbs"><a href="#" onclick="P.nav('runs');return false">Agent runs</a> › ${run.id}</div>
      <div class="ph"><div><h1>${run.req.title} · ${run.req.city} ${runStatus(run)}</h1><p>${run.id} · ${fmtDate(run.iso)} ${run.time} · ${run.req.id} · ${COUNTRY[run.req.country].label} · Rules ${run.rules} · ${run.approval === 'review' ? 'Recruiter approves shortlist' : 'Auto-send'}</p></div>
        <div style="display:flex;gap:8px;align-items:center">${pending ? (canEdit ? `<span class="idt">Approving sends ${run.N} invites${run.reserve ? `. The ${run.reserve} on reserve aren't messaged unless a place opens` : ''}.</span><button class="btn ai" onclick="P.approve('${run.id}')">Approve & invite top ${run.N}</button>` : '<span class="chip grey">Read-only for auditors</span>') : `<span class="idt">Approved by ${esc(run.approvedBy)} at ${run.approvedAt}</span>`}</div></div>
      <div class="pipeline">
        <div class="pl"><div class="k">New applications</div><div class="v">${run.apps.length}</div></div>
        <div class="pl"><div class="k">Eligible</div><div class="v">${run.elig.length}</div><div class="idt">${inel} not eligible · ${wait} waiting</div></div>
        <div class="pl"><div class="k">Ranked</div><div class="v">${run.elig.length}</div><div class="idt">score 0–100</div></div>
        <div class="pl"><div class="k">Shortlisted</div><div class="v">${run.N}</div><div class="idt">+ ${run.reserve} reserve</div></div>
        <div class="pl"><div class="k">Interviews booked</div><div class="v">${pending ? '–' : booked}</div></div></div>
      <div class="tabs">${tabs.map(t => `<button class="tab ${UI.runTab === t[0] ? 'on' : ''}" onclick="P.rt('${t[0]}')">${t[1]}</button>`).join('')}</div>
      ${body}`;
  }
  function stepper(key, v, min, max, dis) {
    return `<div class="stepper"><button ${dis || v <= min ? 'disabled' : ''} onclick="P.runSet('${key}',-1)">−</button><span class="v">${v}</span><button ${dis || v >= max ? 'disabled' : ''} onclick="P.runSet('${key}',1)">+</button></div>`;
  }

  /* ---------- Settings ---------- */
  function pageSettings() {
    const ro = UI.role === 'auditor';
    const dis = ro ? 'disabled' : '';
    const sw = (path, on, locked) => `<button class="sw ${on ? 'on' : ''}" ${ro || locked ? 'disabled' : ''} onclick="P.sset('${path}')" aria-label="toggle"></button>`;
    const seg = (path, val, opts, lockedFn) => `<div class="seg">${opts.map(o => `<button class="${val === o[0] ? 'on' : ''}" ${ro || (lockedFn && lockedFn(o[0])) ? 'disabled' : ''} onclick="P.sval('${path}','${o[0]}')">${o[1]}</button>`).join('')}</div>`;
    const num = (path, v, min, max, suffix) => `<div class="stepper"><button ${ro || v <= min ? 'disabled' : ''} onclick="P.snum('${path}',-1,${min},${max})">−</button><span class="v">${v}${suffix || ''}</span><button ${ro || v >= max ? 'disabled' : ''} onclick="P.snum('${path}',1,${min},${max})">+</button></div>`;
    const dirty = JSON.stringify(SET) !== JSON.stringify(SAVED);
    return `<div class="crumbs">Recruiting › AI Screening Agent › Settings</div>
      <div class="ph"><div><h1>Agent settings <span class="aitag">✦ Agent</span></h1><p>Control when the agent runs, how many it shortlists, how it talks to candidates, and its safety limits. Every change is recorded in the audit trail.</p></div></div>
      ${ro ? '<div class="ro">You\'re viewing as an auditor: settings are read-only.</div>' : ''}
      <div class="set-grid">
        <nav class="set-nav">${[['s-status', 'Status'], ['s-proc', 'Processing'], ['s-short', 'Shortlisting'], ['s-rules', 'Screening rules'], ['s-comm', 'Candidate messages'], ['s-dec', 'Decisions & approvals'], ['s-safe', 'Safety & data']].map(s => `<a href="#" onclick="document.getElementById('${s[0]}').scrollIntoView({behavior:'smooth'});return false">${s[1]}</a>`).join('')}</nav>
        <div style="display:grid;gap:14px">
          <div class="card sec" id="s-status"><div class="card-h"><h2>Agent status</h2><span class="sub">Pause the agent per country at any time</span></div>
            ${Object.entries(COUNTRY).map(([k, v]) => `<div class="row"><div class="l"><b>${v.label}</b><span>${REQS.filter(q => q.country === k).map(q => q.id + ' ' + q.city).join(', ')}</span></div><div class="ctl"><span class="idt">${SET.enabled[k] ? 'On' : 'Paused'}</span>${sw('enabled.' + k, SET.enabled[k])}</div></div>`).join('')}</div>

          <div class="card sec" id="s-proc"><div class="card-h"><h2>Processing schedule</h2><span class="sub">How often the agent picks up new applications</span></div>
            <div class="row"><div class="l"><b>Frequency</b><span>First replies and questions are sent as soon as someone applies. Ranking and shortlisting run on this schedule.</span></div><div class="ctl">${seg('freq', SET.freq, [['hours', 'Every few hours'], ['twice', 'Twice daily'], ['daily', 'Daily']])}</div></div>
            ${SET.freq === 'daily' ? `<div class="row"><div class="l"><b>Run time</b><span>Local time at each site</span></div><div class="ctl"><select class="in" ${dis} onchange="P.sval('time',this.value)">${['07:00', '08:00', '09:30', '12:00', '15:00'].map(t => `<option ${SET.time === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>` : ''}
            ${SET.freq === 'hours' ? `<div class="row"><div class="l"><b>Every</b><span>Between 06:00 and 20:00 local time</span></div><div class="ctl">${num('everyHours', SET.everyHours, 2, 8, ' h')}</div></div>` : ''}
            <div class="row"><div class="l"><b>Next run</b><span>Applies to all requisitions with the agent on</span></div><div class="ctl"><span class="chip ai">${SET.freq === 'daily' ? 'Tomorrow ' + SET.time : SET.freq === 'twice' ? 'Today 15:30' : 'In ' + SET.everyHours + ' h'}</span></div></div></div>

          <div class="card sec" id="s-short"><div class="card-h"><h2>Shortlisting</h2><span class="sub">How many applicants the agent shortlists per run</span></div>
            <div class="row"><div class="l"><b>How to set the shortlist size</b><span>A fixed number per requisition, or a multiple of open positions</span></div><div class="ctl">${seg('nMode', SET.nMode, [['fixed', 'Fixed number'], ['ratio', 'Per opening']])}</div></div>
            ${SET.nMode === 'ratio' ? `<div class="row"><div class="l"><b>Shortlist per opening</b><span>e.g. 1.25 × 8 openings = 10 interviews</span></div><div class="ctl"><select class="in" ${dis} onchange="P.sval('ratio',parseFloat(this.value))">${[1, 1.25, 1.5, 2].map(x => `<option ${SET.ratio === x ? 'selected' : ''} value="${x}">${x} ×</option>`).join('')}</select></div></div>` : ''}
            <table class="ctab"><thead><tr><th>Requisition</th><th>Openings</th><th>Shortlist per run</th><th>Recruiter</th></tr></thead><tbody>
              ${REQS.map(q => `<tr><td><b>${q.title} · ${q.city}</b><div class="idt">${q.id}</div></td><td>${q.openings}</td><td>${SET.nMode === 'fixed' ? num('perReq.' + q.id, SET.perReq[q.id], 1, 40) : `<b>${Math.round(q.openings * SET.ratio)}</b> <span class="idt">(${SET.ratio} × ${q.openings})</span>`}</td><td class="idt">${q.recruiter}</td></tr>`).join('')}
            </tbody></table>
            <div class="row"><div class="l"><b>Reserve list size</b><span>Invited automatically, in rank order, when someone declines or doesn't reply in 48 h. Reserve applicants aren't told they're on the list.</span></div><div class="ctl">${num('reserve', SET.reserve, 0, 15)}</div></div></div>

          <div class="card sec" id="s-rules"><div class="card-h"><h2>Screening rules</h2><span class="lockn">🔒 Rules v3 · approved by legal on 12 Oct · changes need approval</span></div>
            <div class="card-b"><div class="g2"><div><div class="idt" style="font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Must-haves (pass/fail)</div>
              <div style="display:grid;gap:5px;font-size:13px"><div>✓ Allowed to work in the country</div><div>✓ Can work the requisition's shift</div><div>✓ Can lift the requisition's weight, with or without adjustments</div></div>
              <div class="idt" style="margin-top:8px">Before any "no", the agent double-checks with the applicant.</div></div>
              <div><div class="idt" style="font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Ranking criteria (eligible applicants)</div>
              <div style="display:grid;gap:5px;font-size:13px">${CRITERIA.map(k => `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span>${k.label}</span><span><span class="wbar"><i style="width:${k.w / 35 * 100}%;background:${k.color}"></i></span> <b>${k.w}</b></span></div>`).join('')}</div></div></div>
              <div class="idt" style="margin-top:10px"><b>Never used:</b> ${NOT_USED.join(', ')}.</div>
              <div style="margin-top:10px"><button class="btn" ${dis} onclick="P.toast('Change request sent to Admin and Legal for approval.')">Request a change</button></div></div></div>

          <div class="card sec" id="s-comm"><div class="card-h"><h2>Candidate messages</h2><span class="sub">How the agent contacts applicants</span></div>
            <div class="row"><div class="l"><b>WhatsApp</b><span>Verified business account; tap-to-answer buttons</span></div><div class="ctl">${sw('whatsapp', SET.whatsapp)}</div></div>
            <div class="row"><div class="l"><b>SMS fallback</b><span>Used when WhatsApp isn't available or fails to deliver</span></div><div class="ctl">${sw('sms', SET.sms)}</div></div>
            <div class="row"><div class="l"><b>Quiet hours</b><span>No messages between these times (local to the applicant)</span></div><div class="ctl"><select class="in" ${dis} onchange="P.sval('quietStart',this.value)">${['20:00', '21:00', '22:00'].map(t => `<option ${SET.quietStart === t ? 'selected' : ''}>${t}</option>`).join('')}</select> to <select class="in" ${dis} onchange="P.sval('quietEnd',this.value)">${['07:00', '08:00', '09:00'].map(t => `<option ${SET.quietEnd === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
            <div class="row"><div class="l"><b>Reminder if no reply</b></div><div class="ctl">${num('remind', SET.remind, 12, 48, ' h')}</div></div>
            <div class="row"><div class="l"><b>Give the place to the next reserve after</b></div><div class="ctl">${num('giveUp', SET.giveUp, 24, 96, ' h')}</div></div>
            <div class="row"><div class="l"><b>Languages</b><span>Set per country</span></div><div class="ctl idt">${Object.values(COUNTRY).map(c => c.label + ': ' + c.langs).join(' · ')}</div></div></div>

          <div class="card sec" id="s-dec"><div class="card-h"><h2>Decisions & approvals</h2><span class="sub">Where a person stays in the loop</span></div>
            <table class="ctab"><thead><tr><th>Country</th><th>Before invites go out</th><th>"Not eligible" decisions</th></tr></thead><tbody>
              ${Object.entries(COUNTRY).map(([k, v]) => `<tr><td><b>${v.label}</b></td><td>${seg('approval.' + k, SET.approval[k], [['review', 'Recruiter approves'], ['auto', 'Auto-send']], o => k === 'DE' && o === 'auto')}</td><td>${seg('notElig.' + k, SET.notElig[k], [['auto', 'Agent sends'], ['confirm', 'Recruiter confirms']], o => k === 'DE' && o === 'auto')}</td></tr>`).join('')}
            </tbody></table>
            <div class="row"><div class="l"><b>Tell applicants who weren't shortlisted</b></div><div class="ctl">${seg('notShort', SET.notShort, [['afterApproval', 'Right after approval'], ['afterFilled', 'When the role is filled']])}</div></div>
            <div class="row"><div class="l"><b>Candidates can ask "why?"</b><span>Plain-language reason from their own record, plus a link to their application data. Scores and rankings are never shown to candidates.</span></div><div class="ctl"><span class="lockn">🔒 Always on</span></div></div>
            <div class="row"><div class="l"><span>Germany: auto-send and agent-sent "no" stay locked until legal and works council sign-off.</span></div><div class="ctl"></div></div></div>

          <div class="card sec" id="s-safe"><div class="card-h"><h2>Safety & data</h2></div>
            <div class="row"><div class="l"><b>Auto-pause if fairness ratio drops below</b><span>Invite rate of any self-declared group ÷ highest group, checked weekly</span></div><div class="ctl"><select class="in" ${dis} onchange="P.sval('pause',parseFloat(this.value))">${[0.75, 0.8, 0.85, 0.9].map(x => `<option ${SET.pause === x ? 'selected' : ''} value="${x}">${x.toFixed(2)}</option>`).join('')}</select></div></div>
            <div class="row"><div class="l"><b>Weekly recruiter spot-check</b><span>Random share of "not eligible" and just-below-cut-off decisions re-checked by a person</span></div><div class="ctl">${num('spot', SET.spot, 1, 10, '%')}</div></div>
            <div class="row"><div class="l"><b>Keep applicant data for</b><span>Then deleted, unless the applicant asks to stay on the talent list</span></div><div class="ctl">${num('retention', SET.retention, 3, 24, ' months')}</div></div></div>

          <div class="savebar"><span class="idt">${dirty ? '<b style="color:var(--amber)">Unsaved changes.</b> They apply from the next run and are logged in the audit trail.' : 'All changes saved. Last change: ' + esc(CHANGES[CHANGES.length - 1].t) + ' by ' + esc(CHANGES[CHANGES.length - 1].who) + '.'}</span>
            <div style="display:flex;gap:8px"><button class="btn" ${!dirty ? 'disabled' : ''} onclick="P.discard()">Discard</button><button class="btn ai" ${!dirty || ro ? 'disabled' : ''} onclick="P.save()">Save changes</button></div></div>
        </div></div>`;
  }

  /* ---------- Audit trail ---------- */
  function auditRows() {
    const q = UI.aQ.trim().toLowerCase();
    const out = [];
    RUNS.forEach(run => {
      if (run.iso < UI.aFrom || run.iso > UI.aTo) return;
      if (UI.aGeo !== 'all' && run.req.country !== UI.aGeo) return;
      if (UI.aReq !== 'all' && run.req.id !== UI.aReq) return;
      run.apps.forEach(c => {
        const o = outcome(c, run);
        if (UI.aOut !== 'all' && o[2] !== UI.aOut) return;
        if (q && !(c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))) return;
        const ev = trail(c, run);
        const last = ev[ev.length - 1];
        const decider = ev.slice().reverse().find(e => /Shortlisted|reserve list \(|Not shortlisted|not eligible|Confirmed|Proposed|Below/.test(e.title));
        out.push({ c, run, o, last, by: decider ? decider.actor : 'Agent' });
      });
    });
    return out.sort((a, b) => b.run.d - a.run.d || (a.c.rank || 999) - (b.c.rank || 999));
  }
  function pageAudit() {
    const tabs = [['decisions', 'Applicant decisions'], ['runs', 'Agent runs'], ['changes', 'Settings changes']];
    const runsIn = RUNS.filter(r => r.iso >= UI.aFrom && r.iso <= UI.aTo && (UI.aGeo === 'all' || r.req.country === UI.aGeo) && (UI.aReq === 'all' || r.req.id === UI.aReq));
    const rows = auditRows();
    const allIn = []; runsIn.forEach(r => r.apps.forEach(c => allIn.push([c, r])));
    const k = { apps: allIn.length, elig: allIn.filter(x => x[0].eligible).length, inv: allIn.filter(x => x[1].inv[x[0].id]).length, inel: allIn.filter(x => x[0].status === 'inel').length, ovr: runsIn.reduce((s, r) => s + r.overrides.length, 0) };
    const fair = Object.keys(COUNTRY).filter(cc => UI.aGeo === 'all' || UI.aGeo === cc).map(cc => {
      const set = allIn.filter(x => x[1].req.country === cc);
      const rate = g => { const a = set.filter(x => x[0].gender === g); return a.length ? a.filter(x => x[1].inv[x[0].id]).length / a.length : 0; };
      const w = rate('Women'), m = rate('Men'), ratio = Math.min(w, m) / (Math.max(w, m) || 1);
      const rateA = g => { const a = set.filter(x => x[0].age === g); return a.length ? a.filter(x => x[1].inv[x[0].id]).length / a.length : 0; };
      const y = rateA('Under 40'), o = rateA('40+'), ratioA = Math.min(y, o) / (Math.max(y, o) || 1);
      return set.length ? `<tr><td><b>${COUNTRY[cc].label}</b></td><td>${set.length}</td><td>${Math.round(w * 100)}% / ${Math.round(m * 100)}%</td><td class="${ratio >= SET.pause ? 'fok' : ''}">${ratio.toFixed(2)} ${ratio >= SET.pause ? '✓' : '⚠'}</td><td>${Math.round(y * 100)}% / ${Math.round(o * 100)}%</td><td class="${ratioA >= SET.pause ? 'fok' : ''}">${ratioA.toFixed(2)} ${ratioA >= SET.pause ? '✓' : '⚠'}</td></tr>` : '';
    }).join('');
    const filters = `<div class="filters">
      <div class="fl"><label>From</label><input class="in" type="date" min="${DATES[0]}" max="${DATES[7]}" value="${UI.aFrom}" onchange="P.aset('aFrom',this.value)"></div>
      <div class="fl"><label>To</label><input class="in" type="date" min="${DATES[0]}" max="${DATES[7]}" value="${UI.aTo}" onchange="P.aset('aTo',this.value)"></div>
      <div class="fl"><label>Geography</label><select class="in" onchange="P.aset('aGeo',this.value)"><option value="all">All countries</option>${Object.entries(COUNTRY).map(([c, v]) => `<option value="${c}" ${UI.aGeo === c ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div>
      <div class="fl"><label>Requisition</label><select class="in" onchange="P.aset('aReq',this.value)"><option value="all">All</option>${REQS.filter(q => UI.aGeo === 'all' || q.country === UI.aGeo).map(q => `<option value="${q.id}" ${UI.aReq === q.id ? 'selected' : ''}>${q.id} · ${q.city}</option>`).join('')}</select></div>
      ${UI.aTab === 'decisions' ? `<div class="fl"><label>Outcome</label><select class="in" onchange="P.aset('aOut',this.value)">${[['all', 'All outcomes'], ['int', 'Invited'], ['res', 'Reserve'], ['not', 'Not shortlisted'], ['inel', 'Not eligible'], ['wait', 'Waiting for reply'], ['pending', 'Waiting for approval']].map(o => `<option value="${o[0]}" ${UI.aOut === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
      <div class="fl" style="flex:1;min-width:180px"><label>Applicant</label><input class="in" id="aq" placeholder="Name or ID" value="${esc(UI.aQ)}" oninput="P.aq(this.value)"></div>` : ''}
      <div class="fl" style="margin-left:auto"><label>&nbsp;</label><button class="btn" onclick="P.csv()">Export CSV</button></div></div>`;
    let body = '';
    if (UI.aTab === 'decisions') {
      body = `${filters}<div class="scroll" style="max-height:620px"><table class="tbl"><thead><tr><th>Date</th><th>Applicant</th><th>Requisition</th><th>Country</th><th>Outcome</th><th class="num">Score</th><th class="num">Rank</th><th>Decided by</th><th>Rules</th></tr></thead><tbody id="arows">${auditRowsHTML(rows)}</tbody></table></div>
        ${rows.length > UI.aLimit ? `<div class="card-b" style="text-align:center;border-top:1px solid var(--line)"><button class="btn" onclick="P.more()">Show more (${rows.length - UI.aLimit} more)</button></div>` : ''}`;
    } else if (UI.aTab === 'runs') {
      body = `${filters}<table class="tbl"><thead><tr><th>Run</th><th>When</th><th>Requisition</th><th class="num">Processed</th><th class="num">Eligible</th><th class="num">Shortlist</th><th>Approval</th><th>Approved by</th><th>Settings at run</th></tr></thead><tbody>
        ${runsIn.sort((a, b) => b.d - a.d).map(r => `<tr class="click" onclick="P.openRun('${r.id}')"><td class="idt">${r.id}</td><td class="idt">${fmtDate(r.iso)} ${r.time}</td><td>${r.req.id} · ${r.req.city}</td><td class="num">${r.apps.length}</td><td class="num">${r.elig.length}</td><td class="num">${r.N} + ${r.reserve}</td><td>${r.approval === 'review' ? 'Recruiter' : 'Auto'}</td><td class="idt">${r.approvedBy ? esc(r.approvedBy) + ' ' + r.approvedAt : '<span class="chip amber">Pending</span>'}</td><td class="idt">Rules ${r.rules} · ${r.req.country === 'DE' ? 'recruiter confirms "no"' : 'agent sends "no"'}</td></tr>`).join('')}</tbody></table>`;
    } else {
      body = `<table class="tbl"><thead><tr><th>When</th><th>Who</th><th>Change</th></tr></thead><tbody>${CHANGES.slice().reverse().map(ch => `<tr><td class="idt">${esc(ch.t)}</td><td>${esc(ch.who)}</td><td>${esc(ch.what)}</td></tr>`).join('')}</tbody></table>`;
    }
    return `<div class="crumbs">Recruiting › AI Screening Agent › Audit trail</div>
      <div class="ph"><div><h1>Audit trail <span class="aitag">✦ Agent</span></h1><p>How the agent processed incoming applications: what it checked, how it ranked, what it decided, who approved, and what each applicant was told. Records can't be edited.</p></div>
        <div style="display:flex;gap:8px"><span class="chip">Viewing as ${ROLES[UI.role].label} ${ROLES[UI.role].name}</span></div></div>
      <div class="kpis">
        <div class="kpi"><div class="k">Applications processed</div><div class="v">${k.apps}</div><div class="s">${runsIn.length} agent runs</div></div>
        <div class="kpi ai"><div class="k">Eligible</div><div class="v">${k.elig}</div><div class="s">${k.apps ? Math.round(k.elig / k.apps * 100) : 0}% of applications</div></div>
        <div class="kpi ai"><div class="k">Invited to interview</div><div class="v">${k.inv}</div><div class="s">incl. from reserve</div></div>
        <div class="kpi"><div class="k">Not eligible</div><div class="v">${k.inel}</div><div class="s">all told why</div></div>
        <div class="kpi amber"><div class="k">Recruiter overrides</div><div class="v">${k.ovr}</div><div class="s">with reasons</div></div></div>
      <div class="g21" style="grid-template-columns:1fr">
        <div class="card"><div class="card-h" style="padding-bottom:0;border:none"><div class="tabs" style="margin:0;border:none">${tabs.map(t => `<button class="tab ${UI.aTab === t[0] ? 'on' : ''}" onclick="P.at('${t[0]}')">${t[1]}</button>`).join('')}</div></div>${body}</div>
        <div class="card"><div class="card-h"><h2>Fairness check for this selection</h2><span class="sub">Invite rate (invited ÷ applied) by self-declared group. Never shown to the agent. Auto-pause below ${SET.pause.toFixed(2)}. Sample data.</span></div>
          <table class="fair"><thead><tr><th>Country</th><th>Applications</th><th>Women / Men</th><th>Ratio</th><th>Under 40 / 40+</th><th>Ratio</th></tr></thead><tbody>${fair}</tbody></table></div>
      </div>`;
  }
  function auditRowsHTML(rows) {
    if (!rows.length) return '<tr><td colspan="9" class="idt" style="text-align:center;padding:20px">No applications match these filters.</td></tr>';
    return rows.slice(0, UI.aLimit).map(x => `<tr class="click" onclick="P.open('${x.c.id}')"><td class="idt">${fmtDate(x.run.iso)}</td><td><div class="nm">${esc(x.c.name)}</div><div class="idt">${x.c.id}</div></td><td class="idt">${x.run.req.id} · ${x.run.req.city}</td><td>${COUNTRY[x.run.req.country].label}</td><td>${chip(x.o)}</td><td class="num">${x.c.sc ? x.c.sc.total : '–'}</td><td class="num">${x.c.rank ? '#' + x.c.rank : '–'}</td><td class="idt">${esc(x.by)}</td><td class="idt">${x.run.rules}</td></tr>`).join('');
  }

  function pagePlaceholder(name) {
    return `<div class="crumbs">Recruiting › ${name}</div><div class="ph"><div><h1>${name}</h1><p>Existing platform page. Not part of this prototype.</p></div></div>
      <div class="card card-b idt">This page already exists in the HR platform. The AI Screening Agent adds the pages under <b>✦ AI Screening Agent</b> in the left menu, and agent columns on <a href="#" onclick="P.nav('applications');return false">Applications</a>.</div>`;
  }

  /* ---------- Drawer ---------- */
  function renderDrawer() {
    const d = $('#drawer'), s = $('#scrim');
    if (!UI.drawer) { d.classList.remove('on'); s.classList.remove('on'); return; }
    const [c, run] = findApp(UI.drawer);
    if (!c) return;
    const o = outcome(c, run);
    const canOverride = run.status === 'pending' && c.eligible && c.band !== 'short' && UI.role !== 'auditor';
    const prof = `<div class="card card-b"><div class="prof">
        <span class="k">Applied</span><span>${fmtDate(run.iso)} ${hm(c.app)} · ${c.cv ? 'Job board' : 'Career site (mobile)'}</span>
        <span class="k">Requisition</span><span>${run.req.id} · ${run.req.title} · ${run.req.site}</span>
        <span class="k">Phone</span><span>+•• ••• ••• ${String(1000 + (hash(c.id) % 9000))} · ${c.ch}</span>
        <span class="k">CV</span><span>${c.cv ? 'Attached (PDF)' : 'None'}</span>
        <span class="k">Experience</span><span>${esc(c.months ? `${c.exp[0]}, ${c.months} months` : c.exp[0])}</span>
        <span class="k">Platform stage</span><span>${esc(platformStage(c, run))}</span></div></div>`;
    d.innerHTML = `<div class="dr-h"><div class="dr-top"><div><div class="idt">${c.id} · ${run.req.title} · ${run.req.city}</div><h2 style="font-size:19px">${esc(c.name)}</h2><div style="margin:6px 0 10px;display:flex;gap:6px;align-items:center">${chip(o)} <span class="idt">${run.id}</span></div></div>
        <div style="display:flex;gap:6px"><button class="btn" onclick="P.json('${c.id}')">Export (JSON)</button><button class="x" onclick="P.close()">✕</button></div></div>
        <div class="tabs" style="margin:0;border:none">${[['agent', '✦ Agent activity'], ['profile', 'Profile']].map(t => `<button class="tab ${UI.drawerTab === t[0] ? 'on' : ''}" onclick="P.dt('${t[0]}')">${t[1]}</button>`).join('')}</div></div>
      <div class="dr-b">${UI.drawerTab === 'agent' ? timelineHTML(c, run) : prof}
        ${canOverride ? `<div class="card card-b mt" style="background:var(--amber-s);border-color:var(--amber-b)"><b>Recruiter option:</b> add ${esc(c.name.split(' ')[0])} to the shortlist. The reason is recorded in the audit trail.<div style="margin-top:8px"><button class="btn warn" onclick="P.override('${c.id}')">Add to shortlist</button></div></div>` : ''}
        ${c.candidateLink ? `<div class="mt"><a href="candidate.html?s=${c.candidateLink}" target="_blank">See what ${esc(c.name.split(' ')[0])} sees on WhatsApp ↗</a></div>` : ''}</div>`;
    d.classList.add('on'); s.classList.add('on');
  }

  /* ================= Router ================= */
  function render(anim) {
    renderShell();
    const pages = { applications: pageApplications, agent: pageAgent, runs: pageRuns, run: pageRun, settings: pageSettings, audit: pageAudit, home: () => pagePlaceholder('Home'), reqs: () => pagePlaceholder('Requisitions'), interviews: () => pagePlaceholder('Interviews'), offers: () => pagePlaceholder('Offers'), reports: () => pagePlaceholder('Reports') };
    const el = $('#content');
    el.innerHTML = (pages[UI.route] || pageApplications)();
    el.classList.remove('anim'); if (anim) { void el.offsetWidth; el.classList.add('anim'); }
    renderDrawer();
  }
  function fromHash() {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[0] === 'run' && h[1]) { UI.route = 'run'; UI.runId = h[1]; }
    else if (h[0]) UI.route = h[0];
  }
  window.addEventListener('hashchange', () => { fromHash(); render(true); window.scrollTo(0, 0); });

  /* ================= Actions ================= */
  const getP = (o, path) => path.split('.').reduce((a, k) => a[k], o);
  const setP = (o, path, v) => { const ks = path.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
  window.P = {
    nav(r) { location.hash = '#/' + r; },
    openRun(id) { UI.runTab = 'rank'; UI.drawer = null; location.hash = '#/run/' + id; },
    toast,
    req(id) { UI.req = id; render(false); },
    af(f) { UI.appFilter = f; render(false); },
    rc(c) { UI.runsCountry = c; render(false); },
    rt(t) { UI.runTab = t; render(false); },
    open(id) { UI.drawer = id; UI.drawerTab = 'agent'; renderDrawer(); },
    close() { UI.drawer = null; renderDrawer(); },
    dt(t) { UI.drawerTab = t; renderDrawer(); },
    runSet(key, d) { const run = runOf(UI.runId); if (run.status !== 'pending') return; run[key] = Math.max(key === 'N' ? 1 : 0, Math.min(key === 'N' ? run.elig.length : 10, run[key] + d)); rank(run); render(false); },
    approve(id) {
      const run = runOf(id); if (run.status !== 'pending') return;
      const who = `Recruiter ${ROLES[UI.role].name}`;
      finishRun(run, null, who, '10:0' + (2 + Math.floor(Math.random() * 6)));
      if (run.N !== SET.perReq[run.req.id]) CHANGES.push({ t: '2026-10-31 10:02', who, what: `${run.id}: shortlist size changed to ${run.N} for this run` });
      render(false); toast(`Shortlist approved. ${Object.keys(run.inv).length} invites sent by WhatsApp/SMS.`);
    },
    override(id) { const run = findApp(id)[1]; run.overrides.push(id); rank(run); UI.drawer = null; render(false); toast('Added to the shortlist. Reason recorded in the audit trail.'); },
    role(r) { UI.role = r; render(false); toast(`Viewing as ${ROLES[r].label} ${ROLES[r].name}.`); },
    sset(path) { setP(SET, path, !getP(SET, path)); render(false); },
    sval(path, v) { setP(SET, path, v); render(false); },
    snum(path, d, min, max) { setP(SET, path, Math.max(min, Math.min(max, getP(SET, path) + d))); render(false); },
    discard() { Object.assign(SET, JSON.parse(JSON.stringify(SAVED))); render(false); },
    save() {
      const diffs = [];
      const walk = (a, b, p) => Object.keys(a).forEach(k => { const pa = p ? p + '.' + k : k; if (typeof a[k] === 'object') walk(a[k], b[k], pa); else if (a[k] !== b[k]) diffs.push(`${pa}: ${b[k]} → ${a[k]}`); });
      walk(SET, SAVED, '');
      const who = `${ROLES[UI.role].label} ${ROLES[UI.role].name}`;
      diffs.forEach(dd => CHANGES.push({ t: '2026-10-31 ' + new Date().toTimeString().slice(0, 5), who, what: dd.replace('perReq.', 'Shortlist size ').replace('enabled.', 'Agent on: ').replace('approval.', 'Approval ').replace('notElig.', '"Not eligible" ') }));
      SAVED = JSON.parse(JSON.stringify(SET));
      render(false); toast(`Saved ${plural(diffs.length, 'change')}. Logged in the audit trail; applies from the next run.`);
    },
    at(t) { UI.aTab = t; UI.aLimit = 60; render(false); },
    aset(k, v) { UI[k] = v; if (k === 'aGeo') UI.aReq = 'all'; if (UI.aFrom > UI.aTo) { if (k === 'aFrom') UI.aTo = v; else UI.aFrom = v; } UI.aLimit = 60; render(false); },
    aq(v) { UI.aQ = v; UI.aLimit = 60; const t = $('#arows'); if (t) t.innerHTML = auditRowsHTML(auditRows()); },
    more() { UI.aLimit += 100; render(false); },
    json(id) { const [c, run] = findApp(id); download(`audit-${id}.json`, JSON.stringify(recordJSON(c, run), null, 2), 'application/json'); toast(`Exported audit record ${id}.`); },
    csv() {
      const rows = auditRows();
      const head = ['date', 'agent_run', 'applicant_id', 'name', 'requisition', 'country', 'eligible', 'reason_not_eligible', 'score', 'rank', 'outcome', 'decided_by', 'interview_slot', 'channel', 'rules'];
      const data = rows.map(x => [x.run.iso, x.run.id, x.c.id, x.c.name, x.run.req.id, COUNTRY[x.run.req.country].label, x.c.status === 'awaiting' ? 'awaiting reply' : x.c.eligible ? 'yes' : 'no', x.c.reason || '', x.c.sc ? x.c.sc.total : '', x.c.rank || '', x.o[0], x.by, (x.run.inv[x.c.id] || {}).slot || '', x.c.ch, x.run.rules]);
      download(`audit-${UI.aFrom}-to-${UI.aTo}-${UI.aGeo}.csv`, [head, ...data].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
      toast(`Exported ${rows.length} records (CSV).`);
    }
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && UI.drawer) P.close(); });

  const q = new URLSearchParams(location.search);
  if (ROLES[q.get('role')]) UI.role = q.get('role');
  fromHash();
  if (UI.route === 'audit' && !q.get('role')) UI.role = 'auditor';
  if (q.get('open')) UI.drawer = q.get('open');
  $('#role').value = UI.role;
  render(true);
})();
