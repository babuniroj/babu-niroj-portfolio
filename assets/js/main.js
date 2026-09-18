(()=>{const b=document.querySelector('.menu'),n=document.querySelector('nav');b?.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',String(o))});n?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>n.classList.remove('open')));const d=new Date(),np=x=>String(x).replace(/\d/g,d=>'०१२३४५६७८९'[d]);const ad=d.getFullYear(),m=d.getMonth()+1,day=d.getDate();const bs=ad+56+(m>4||(m===4&&day>=14)?1:0);const startBs=2074,years=Math.max(0,bs-startBs);document.querySelectorAll('[data-experience-years]').forEach(el=>el.textContent=np(years));const cy=document.querySelector('#copyrightYear');if(cy)cy.textContent=np(bs)})();

// Contact form: submit to Web3Forms without leaving the portfolio page.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.portfolio-contact-form');
  if (!form) return;

  const button = form.querySelector('.contact-submit');
  const buttonText = form.querySelector('.contact-submit-text');
  const status = form.querySelector('.contact-form-status');
  const defaultText = buttonText ? buttonText.textContent : 'सन्देश पठाउनुहोस्';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    button.disabled = true;
    if (buttonText) buttonText.textContent = 'पठाउँदै...';
    if (status) {
      status.textContent = 'कृपया केही क्षण पर्खनुहोस्…';
      status.className = 'contact-form-status';
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.message || 'Submission failed');

      form.reset();
      if (status) {
        status.textContent = '✓ धन्यवाद! तपाईंको सन्देश सफलतापूर्वक पठाइएको छ।';
        status.className = 'contact-form-status is-success';
      }
    } catch (error) {
      if (status) {
        status.textContent = 'सन्देश पठाउन सकिएन। कृपया पुनः प्रयास गर्नुहोस्।';
        status.className = 'contact-form-status is-error';
      }
    } finally {
      button.disabled = false;
      if (buttonText) buttonText.textContent = defaultText;
    }
  });
});
