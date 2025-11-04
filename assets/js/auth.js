(function() {
  // sessionStorageに 'isLoggedIn' が 'true' で保存されているかチェック
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');

  if (isLoggedIn !== 'true') {
      // ログインしていない場合、ログインページに強制的に移動させる
      window.location.href = 'login.html';
  }
})();