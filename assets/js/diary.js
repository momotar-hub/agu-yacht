document.addEventListener('DOMContentLoaded', () => {
    // GASのウェブアプリURLをここに貼り付ける
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzzrSPATJT0_pY6wmJbBoyypufFVekntUYbQHnszeLQk10ERrPvTpJ9Ehk0ZbjWWHb5/exec';

    const form = document.getElementById('diary-form');
    const diaryList = document.getElementById('diary-list');
    let diaryEntries = [];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    const showLoading = () => diaryList.innerHTML = '<p style="text-align:center;">読み込み中...</p>';

    const renderDiaries = () => {
        diaryList.innerHTML = '';
        if (diaryEntries.length === 0) {
            diaryList.innerHTML = '<p style="text-align:center;">日記の投稿がまだありません。</p>';
            return;
        }
        diaryEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        diaryEntries.forEach(entry => {
            const card = document.createElement('div');
            card.className = 'card';
            const comments = JSON.parse(entry.comments || '[]'); // コメントをパース
            card.innerHTML = `
                <button class="action-btn delete-btn" data-id="${entry.id}">削除</button>
                <div class="diary-header">
                    <div>
                        <div class="diary-date">${formatDate(entry.date)}</div>
                        <div class="diary-author">投稿者: ${entry.author}</div>
                    </div>
                </div>
                <div class="diary-weather-grid">
                    <div>天候: <span>${entry.weather}</span></div>
                    <div>気温: <span>${entry.temperature}°C</span></div>
                    <div>風向き: <span>${entry.windDirection}</span></div>
                    <div>風速: <span>${entry.windSpeed} m/s</span></div>
                </div>
                <div class="diary-body">
                    <p>${entry.impression.replace(/\n/g, '<br>')}</p>
                </div>
                <div class="comment-section">
                    <h4>コメント</h4>
                    <div class="comment-list">
                        ${comments.map(c => `
                            <div class="comment">
                                <p>${c.text}</p>
                                <small>by ${c.author}</small>
                            </div>
                        `).join('') || '<p>まだコメントはありません。</p>'}
                    </div>
                    <form class="comment-form" data-id="${entry.id}">
                        <input class="form-group" type="text" placeholder="名前" required>
                        <input class="form-group" type="text" placeholder="コメントを入力" required>
                        <button type="submit" class="btn">送信</button>
                    </form>
                </div>
            `;
            diaryList.appendChild(card);
        });
    };

    const postData = async (action, data) => {
        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action, data })
            });
            return await response.json();
        } catch (error) {
            console.error('Error posting data:', error);
            alert('通信エラーが発生しました。');
            return { status: 'error' };
        }
    };
    
    const fetchAndRender = async () => {
        showLoading();
        try {
            const response = await fetch(`${GAS_URL}?action=getDiaries`);
            const result = await response.json();
            if (result.status === 'success') {
                diaryEntries = result.data;
                renderDiaries();
            } else {
                 diaryList.innerHTML = '<p style="text-align:center;">データの読み込みに失敗しました。</p>';
            }
        } catch (error) {
            diaryList.innerHTML = '<p style="text-align:center;">エラーが発生しました。</p>';
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newEntryData = {
            date: document.getElementById('diary-date').value,
            author: document.getElementById('author').value,
            weather: document.getElementById('weather').value,
            temperature: document.getElementById('temperature').value,
            windDirection: document.getElementById('wind-direction').value,
            windSpeed: document.getElementById('wind-speed').value,
            impression: document.getElementById('impression').value,
        };
        const result = await postData('addDiary', newEntryData);
        if (result.status === 'success') {
            form.reset();
            fetchAndRender();
        } else {
            alert('投稿に失敗しました。');
        }
    });

    diaryList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('この日記を削除してもよろしいですか？')) {
                const result = await postData('deleteDiary', { id });
                if (result.status === 'success') fetchAndRender();
                else alert('削除に失敗しました。');
            }
        }
    });

    diaryList.addEventListener('submit', async (e) => {
        if (e.target.classList.contains('comment-form')) {
            e.preventDefault();
            const id = e.target.dataset.id;
            const authorInput = e.target.querySelector('input:nth-child(1)');
            const textInput = e.target.querySelector('input:nth-child(2)');
            const commentData = {
                author: authorInput.value,
                text: textInput.value
            };
            const result = await postData('addComment', { id, comment: commentData });
            if (result.status === 'success') {
                fetchAndRender();
            } else {
                alert('コメントの投稿に失敗しました。');
            }
        }
    });

    fetchAndRender();
});