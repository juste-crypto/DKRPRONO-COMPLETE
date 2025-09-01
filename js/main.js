// Main JS for DKRPRONO - interactions, form handling, localStorage subscribers, animations
document.addEventListener('DOMContentLoaded', function () {
  const KEY = 'dkrprono_subs_v1';

  // Mobile menu toggle
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  hamburger && hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    if(nav.style.display === 'flex') {
      nav.style.display = '';
    } else {
      nav.style.display = 'flex';
      nav.style.flexDirection = 'column';
      nav.style.background = 'linear-gradient(180deg, rgba(7,16,36,0.95), rgba(7,16,36,0.85))';
      nav.style.position = 'absolute';
      nav.style.right = '20px';
      nav.style.top = '64px';
      nav.style.padding = '12px';
      nav.style.borderRadius = '10px';
    }
  });

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
  }, {threshold:0.12});
  reveals.forEach(r => io.observe(r));

  // Prefill buttons (subscribe)
  document.querySelectorAll('[data-action="prefill"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plan = btn.dataset.plan || '';
      const price = btn.dataset.price || '';
      prefillSubscription(plan, price);
    });
  });

  // Scroll-to action buttons
  document.querySelectorAll('[data-action="scroll-to"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.target);
      if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // Form handling
  const form = document.getElementById('contactForm');
  const saveLocalBtn = document.getElementById('saveLocalBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const countEl = document.getElementById('subscriberCount');
  const notice = document.getElementById('notice');
  const yearEl = document.getElementById('year');

  yearEl && (yearEl.textContent = new Date().getFullYear());

  function getSubscribers() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch(e){ return []; }
  }
  function setSubscribers(list){ localStorage.setItem(KEY, JSON.stringify(list)); updateCount(); }
  function updateCount(){ countEl && (countEl.textContent = getSubscribers().length); }

  function validPhone(p){
    return /^\+?[0-9 ]{6,20}$/.test(p.trim());
  }

  function buildWAUrl(name, phone, plan, message){
    const parts = [];
    parts.push('Nom: ' + name);
    parts.push('WhatsApp: ' + phone);
    if(plan) parts.push('Plan: ' + plan);
    if(message) parts.push('Message: ' + message);
    return 'https://wa.me/639072986322?text=' + encodeURIComponent(parts.join('\n'));
  }

  function prefillSubscription(plan, price){
    // set plan and message, scroll to contact
    const planSelect = document.getElementById('plan');
    const msg = document.getElementById('message');
    if(planSelect) planSelect.value = plan || '';
    if(msg) msg.value = plan ? `Je souhaite souscrire au ${plan} (${price}$ / mois). Mon nom : ` : '';
    const target = document.getElementById('contact');
    if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
    const nameField = document.getElementById('name');
    setTimeout(()=> nameField && nameField.focus(), 400);
  }

  // Expose prefillSubscription globally for older inline references (defensive)
  window.prefillSubscription = prefillSubscription;
  window.prefill = prefillSubscription; // alias

  // Save only local
  saveLocalBtn && saveLocalBtn.addEventListener('click', (e) => {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const plan = document.getElementById('plan').value;
    const message = document.getElementById('message').value.trim();
    if(!name || !validPhone(phone)){ alert('Nom et numéro WhatsApp valides requis'); return; }
    const list = getSubscribers();
    list.push({name,phone,plan,message,ts:new Date().toISOString()});
    setSubscribers(list);
    notice.textContent = 'Numéro enregistré localement.';
  });

  // Submit form -> open WhatsApp and save locally
  form && form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const plan = document.getElementById('plan').value;
    const message = document.getElementById('message').value.trim();
    if(!name){ alert('Veuillez entrer votre nom'); return; }
    if(!validPhone(phone)){ alert('Veuillez entrer un numéro WhatsApp valide (ex: +2296xxxxxxxx)'); return; }
    const list = getSubscribers();
    list.push({name,phone,plan,message,ts:new Date().toISOString()});
    setSubscribers(list);
    const waUrl = buildWAUrl(name, phone, plan, message);
    window.open(waUrl, '_blank');
    notice.textContent = 'Numéro enregistré localement et message ouvert dans WhatsApp.';
  });

  // Export CSV
  exportBtn && exportBtn.addEventListener('click', () => {
    const list = getSubscribers();
    if(!list.length){ alert('Aucun abonné local.'); return; }
    const rows = [['Nom','Phone','Plan','Message','Date']];
    list.forEach(s => rows.push([s.name,s.phone,s.plan,s.message,s.ts]));
    const csv = rows.map(r => r.map(c => '"'+String(c||'').replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dkrprono_abonnes.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Clear local
  clearBtn && clearBtn.addEventListener('click', () => {
    if(!confirm('Effacer tous les abonnés locaux ?')) return;
    localStorage.removeItem(KEY);
    updateCount();
    alert('Abonnés locaux effacés.');
  });

  // init count
  updateCount();

  // Defensive: attach actions for elements that might use data-action prefilling
  document.querySelectorAll('[data-action="prefill"]').forEach(btn => {
    btn.addEventListener('click', () => {
      prefillSubscription(btn.dataset.plan, btn.dataset.price);
    });
  });

  // Smooth scroll for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if(href && href.startsWith('#')){
        const target = document.querySelector(href);
        if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'start'}); }
      }
    });
  });

}); // DOMContentLoaded end
