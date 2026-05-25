/* ===================================================================
   T0kenRent — Auth Gate
   Drop this script on any page that requires a user to be signed in.
   - If signed in: does nothing.
   - If not: blurs the page and shows a modal with HandCash + email options.
   =================================================================== */

(function() {
  // Wait for Auth module to be loaded and /auth/me to come back.
  async function init() {
    if (!window.Auth) { setTimeout(init, 30); return; }
    await Auth.ready();
    updateNavState();
    if (!Auth.isAuthed()) showGate();
  }

  /* ─── Reflect auth state in the global nav ─────────────────────────── */
  function updateNavState() {
    const navCta = document.querySelector('.tr-nav .nav-cta');
    if (!navCta) return;

    if (Auth.isAuthed()) {
      navCta.textContent = '⏻ ' + Auth.displayName();
      navCta.setAttribute('href', 'javascript:void(0)');
      navCta.title = 'Sign out';
      navCta.onclick = async (e) => { e.preventDefault(); if (confirm('Sign out?')) await Auth.signOut(); };
    } else {
      navCta.textContent = 'Login';
      navCta.setAttribute('href', 'login.html');
      navCta.onclick = null;
    }
  }

  /* ─── Build & inject the modal overlay ─────────────────────────────── */
  function showGate() {
    // Blur the existing page so the user can't interact with protected content.
    const page = document.querySelector('.page') || document.body;
    page.style.filter = 'blur(6px) saturate(.6)';
    page.style.pointerEvents = 'none';
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'tr-auth-gate';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Sign in required');
    overlay.innerHTML = `
      <style>
        #tr-auth-gate {
          position: fixed; inset: 0;
          z-index: 9999;
          background: rgba(11,11,18,.78);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadeIn .25s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        #tr-auth-gate .gate-card {
          width: 100%;
          max-width: 460px;
          background: var(--bg-card, #1C1C2E);
          border: 1px solid rgba(0,200,255,.18);
          border-radius: 18px;
          padding: 32px 28px;
          color: var(--white, #fff);
          box-shadow: 0 30px 80px rgba(0,0,0,.55);
          position: relative;
          animation: popUp .35s cubic-bezier(.22,1,.36,1);
        }
        @keyframes popUp { from { transform: translateY(20px) scale(.95); opacity: 0; } to { transform: none; opacity: 1; } }
        #tr-auth-gate .gate-icon {
          width: 56px; height: 56px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(168,85,247,.2), rgba(0,200,255,.18));
          border: 1px solid rgba(0,200,255,.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem;
          margin-bottom: 20px;
        }
        #tr-auth-gate h2 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -.5px;
          margin: 0 0 8px;
        }
        #tr-auth-gate p.sub {
          color: var(--muted, #9CA3AF);
          font-size: .92rem;
          margin: 0 0 24px;
          line-height: 1.55;
        }
        #tr-auth-gate .gate-btn {
          width: 100%;
          padding: 13px 16px;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: .92rem;
          cursor: pointer;
          margin-bottom: 10px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: transform .15s, box-shadow .2s, background .2s, border-color .2s;
        }
        #tr-auth-gate .gate-btn-handcash {
          background: #38CB7C;
          color: #000;
          border: none;
          box-shadow: 0 0 28px rgba(56,203,124,.28);
        }
        #tr-auth-gate .gate-btn-handcash:hover { transform: translateY(-2px); box-shadow: 0 0 44px rgba(56,203,124,.42); }
        #tr-auth-gate .gate-btn-email {
          background: var(--cyan, #00C8FF);
          color: #0B0B12;
          border: none;
          box-shadow: 0 0 28px rgba(0,200,255,.28);
        }
        #tr-auth-gate .gate-btn-email:hover { transform: translateY(-2px); box-shadow: 0 0 44px rgba(0,200,255,.42); }
        #tr-auth-gate .gate-divider {
          display: flex; align-items: center; gap: 10px;
          color: var(--muted, #9CA3AF);
          font-size: .76rem;
          margin: 14px 0;
        }
        #tr-auth-gate .gate-divider::before,
        #tr-auth-gate .gate-divider::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255,255,255,.08);
        }
        #tr-auth-gate .gate-foot {
          font-size: .78rem;
          color: var(--muted, #9CA3AF);
          margin-top: 18px;
          text-align: center;
        }
        #tr-auth-gate .gate-foot a { color: var(--cyan, #00C8FF); font-weight: 600; text-decoration: none; }
        #tr-auth-gate .gate-back {
          position: absolute; top: 14px; right: 14px;
          background: transparent; border: none; color: var(--muted, #9CA3AF);
          font-size: 1.2rem; cursor: pointer;
          width: 32px; height: 32px;
          border-radius: 8px;
          transition: background .2s, color .2s;
        }
        #tr-auth-gate .gate-back:hover { background: rgba(255,255,255,.06); color: #fff; }
        #tr-auth-gate .hc-icon {
          width: 18px; height: 18px; border-radius: 4px;
          background: #0B0B12;
          color: #38CB7C;
          font-weight: 800;
          font-size: .7rem;
          display: flex; align-items: center; justify-content: center;
        }
      </style>
      <div class="gate-card">
        <button class="gate-back" aria-label="Go back" onclick="window.history.length > 1 ? window.history.back() : window.location.href='index.html'">✕</button>
        <div class="gate-icon">🔐</div>
        <h2>Sign in to continue</h2>
        <p class="sub">Connect your HandCash wallet or sign in with email to browse, book, and manage your rentals on T0kenRent.</p>

        <button class="gate-btn gate-btn-handcash" id="gateConnectHandCash">
          <span class="hc-icon">$</span>
          Connect HandCash Wallet
        </button>

        <button class="gate-btn gate-btn-email" onclick="window.location.href='login.html'">
          ✉  Sign in with Email
        </button>

        <div class="gate-divider">or</div>

        <div style="text-align:center;font-size:.82rem;color:var(--muted,#9CA3AF)">
          New to T0kenRent? <a href="login.html#signup" style="color:var(--cyan,#00C8FF);font-weight:600;text-decoration:none">Create an account</a>
        </div>

        <div class="gate-foot">
          <a href="index.html">← Back to home</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('gateConnectHandCash').addEventListener('click', () => Auth.connectHandCash());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
