// Simple client-side login modal (demo only)
document.addEventListener('DOMContentLoaded', function(){
  const loginBtn = document.getElementById('loginBtn');

  // create modal
  const modal = document.createElement('div');
  modal.className = 'auth-modal';
  modal.style.position = 'fixed';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.right = '0';
  modal.style.bottom = '0';
  modal.style.display = 'none';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.background = 'rgba(0,0,0,0.45)';
  modal.innerHTML = `
    <div style="background:#fff;padding:20px;border-radius:10px;min-width:320px;max-width:420px;">
      <h3>Login</h3>
      <label>Email<input type="email" id="authEmail" style="width:100%;padding:8px;margin:8px 0;border:1px solid #ddd;border-radius:6px"></label>
      <label>Password<input type="password" id="authPass" style="width:100%;padding:8px;margin:8px 0;border:1px solid #ddd;border-radius:6px"></label>
      <div style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end;">
        <button id="authCancel" class="btn btn--ghost">Batal</button>
        <button id="authSubmit" class="btn">Masuk</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function openModal(){ modal.style.display='flex'; }
  function closeModal(){ modal.style.display='none'; }

  loginBtn.addEventListener('click', openModal);
  modal.querySelector('#authCancel').addEventListener('click', closeModal);

  modal.querySelector('#authSubmit').addEventListener('click', function(){
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authPass').value.trim();
    if(!email || !pass){ alert('Masukkan email dan password.'); return; }
    // Demo: simpan di localStorage
    localStorage.setItem('mock_user', JSON.stringify({ email: email }));
    alert('Berhasil login (demo).');
    closeModal();
  });

  // auto show if already logged in
  const user = (function(){ try{return JSON.parse(localStorage.getItem('mock_user')); }catch(e){return null;} })();
  if(user){ loginBtn.textContent = 'Akun'; }
});
