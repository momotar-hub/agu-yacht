document.addEventListener('DOMContentLoaded', () => {
    // ★★★ ここにチームで使うパスワードを設定してください ★★★
    const CORRECT_PASSWORD = 'enoshima';
    // 例: const CORRECT_PASSWORD = 'agu-sailing-2023';

    const form = document.getElementById('password-form');
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPassword = passwordInput.value;

        if (enteredPassword === CORRECT_PASSWORD) {
            // パスワードが正しい場合
            sessionStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'index.html';
        } else {
            // パスワードが間違っている場合
            errorMessage.textContent = 'パスワードが違います。';
            errorMessage.classList.add('show'); // ★ showクラスを追加
            passwordInput.value = '';
        }
    });

    // 入力欄にフォーカスが当たったらエラーメッセージを消す
    passwordInput.addEventListener('focus', () => {
        errorMessage.classList.remove('show'); // ★ showクラスを削除
    });
});