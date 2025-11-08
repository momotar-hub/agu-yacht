document.addEventListener('DOMContentLoaded', () => {
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
      const header = item.querySelector('.accordion-header');

      header.addEventListener('click', () => {
          const content = item.querySelector('.accordion-content');
          
          // 現在のアイテムが開いているか確認
          const isActive = item.classList.contains('active');

          // すべてのアイテムを一旦閉じる (一つだけ開くようにする場合)
          // accordionItems.forEach(i => {
          //     i.classList.remove('active');
          //     i.querySelector('.accordion-content').style.maxHeight = null;
          // });

          if (!isActive) {
              // クリックしたアイテムを開く
              item.classList.add('active');
              content.style.maxHeight = content.scrollHeight + 'px';
          } else {
              // クリックしたアイテムを閉じる
              item.classList.remove('active');
              content.style.maxHeight = null;
          }
      });
  });

  // 最初に一番上の項目を開いておく場合
  if (accordionItems.length > 0) {
      accordionItems[0].querySelector('.accordion-header').click();
  }
});