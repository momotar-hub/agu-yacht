document.addEventListener('DOMContentLoaded', () => {
  // ★★★ ここにチームで使うパスワードを設定してください ★★★
  const CORRECT_PASSWORD = 'enoshima'; 
  // 例: const CORRECT_PASSWORD = 'agu-sailing-2023';

  const form = document.getElementById('password-form');
  const passwordInput = document.getElementById('password-input');
  const errorMessage = document.getElementById('error-message');

  form.addEventListener('submit', (e) => {
      e.preventDefault(); // フォームの通常の送信をキャンセル
      const enteredPassword = passwordInput.value;

      if (enteredPassword === CORRECT_PASSWORD) {
          // パスワードが正しい場合
          // sessionStorageにログイン状態を保存
          sessionStorage.setItem('isLoggedIn', 'true');
          // トップページに移動
          window.location.href = 'index.html';
      } else {
          // パスワードが間違っている場合
          errorMessage.textContent = 'パスワードが違います。';
          passwordInput.value = ''; // 入力欄をクリア
      }
  });
});