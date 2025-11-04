// スクロールでヘッダーに影をつける
document.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (window.scrollY > 10) {
      header.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
  } else {
      header.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
  }
});

// --- ここから追記 ---
// ハンバーガーメニューの開閉
const hamburger = document.getElementById('hamburger-menu');
const nav = document.querySelector('.header-nav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  nav.classList.toggle('active');
});