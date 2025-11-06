document.addEventListener('DOMContentLoaded', () => {
    // あなたの最新のGASウェブアプリURL
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzHt_hHjT242ttex2kNQlImMsgtF6H0JMCO51roxYzTTdonzkdhkqozHyiY6WqyZS-G/exec';

    const form = document.getElementById('diary-form');
    const diaryList = document.getElementById('diary-list');
    
    let allDiaryEntries = [];
    let currentPage = 1;
    const entriesPerPage = 10;

    const formatDate = (dateString) => {
        if (!dateString) return '日付不明';
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) { return dateString; }
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            if (isNaN(year)) { return dateString.substring(0, 10); }
            return `${year}-${month}-${day}`;
        } catch (e) { return String(dateString).substring(0, 10); }
    };

    const showLoading = () => diaryList.innerHTML = '<p style="text-align:center;">読み込み中...</p>';

    const renderDiaries = () => {
        const existingPagination = document.querySelector('.pagination');
        if (existingPagination) { existingPagination.remove(); }
        
        diaryList.innerHTML = '';
        if (!allDiaryEntries || allDiaryEntries.length === 0) {
            diaryList.innerHTML = '<p style="text-align:center;">日記の投稿がまだありません。</p>';
            return;
        }
        
        allDiaryEntries.sort((a, b) => (new Date(b.date) - new Date(a.date)));

        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        const paginatedEntries = allDiaryEntries.slice(startIndex, endIndex);

        paginatedEntries.forEach(entry => {
            if (!entry || !entry.id) return;
            const card = document.createElement('div');
            card.className = 'card';
            const diaryDate = formatDate(entry.date);
            const diaryAuthor = entry.author || '名無し';
            const diaryWeather = entry.weather || '不明';
            const diaryTemperature = (entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== '') ? `${entry.temperature}°C` : '不明';
            const diaryWindDirection = entry.windDirection || '不明';
            const diaryWindSpeed = (entry.windSpeed !== null && entry.windSpeed !== undefined && entry.windSpeed !== '') ? `${entry.windSpeed} m/s` : '不明';
            const diaryImpression = (entry.impression || '').replace(/\n/g, '<br>');
            let comments = [];
            if (entry.comments && typeof entry.comments === 'string' && entry.comments.trim().startsWith('[')) {
                try { comments = JSON.parse(entry.comments); } catch (e) { console.error('コメントのJSONパースに失敗しました:', entry.comments, e); }
            }
            card.innerHTML = `
                <button class="action-btn delete-btn" data-id="${entry.id}">削除</button>
                <div class="diary-header">
                    <div><div class="diary-date">${diaryDate}</div><div class="diary-author">投稿者: ${diaryAuthor}</div></div>
                </div>
                <div class="diary-weather-grid">
                    <div>天候: <span>${diaryWeather}</span></div><div>気温: <span>${diaryTemperature}</span></div><div>風向き: <span>${diaryWindDirection}</span></div><div>風速: <span>${diaryWindSpeed}</span></div>
                </div>
                <div class="diary-body"><p>${diaryImpression}</p></div>
                <div class="comment-section">
                    <h4>コメント</h4>
                    <div class="comment-list">
                        ${comments.length > 0 ? comments.map((c, index) => `
                            <div class="comment">
                                <button class="comment-delete-btn" title="コメントを削除" data-diary-id="${entry.id}" data-comment-index="${index}">&times;</button>
                                <p>${c.text || ''}</p>
                                <small>by ${c.author || '名無し'}</small>
                            </div>`).join('') : '<p>まだコメントはありません。</p>'}
                    </div>
                    <form class="comment-form" data-id="${entry.id}">
                        <input class="form-group" type="text" placeholder="名前" required><input class="form-group" type="text" placeholder="コメントを入力" required><button type="submit" class="btn">送信</button>
                    </form>
                </div>`;
            diaryList.appendChild(card);
        });
        renderPagination();
    };

    const renderPagination = () => {
        const totalPages = Math.ceil(allDiaryEntries.length / entriesPerPage);
        if (totalPages <= 1) return;
        let paginationHTML = '<div class="pagination">';
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        paginationHTML += '</div>';
        diaryList.insertAdjacentHTML('afterend', paginationHTML);
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
            if (result.status === 'success' && Array.isArray(result.data)) {
                allDiaryEntries = result.data;
                renderDiaries();
            } else {
                 console.error("GASから予期しない形式のデータが返されました:", result);
                 diaryList.innerHTML = '<p style="text-align:center;">データの読み込みに失敗しました (形式エラー)。</p>';
            }
        } catch (error) {
            console.error("FetchまたはJSONパースでエラーが発生しました:", error);
            diaryList.innerHTML = '<p style="text-align:center;">エラーが発生しました。開発者ツールのConsoleを確認してください。</p>';
        }
    };

    document.body.addEventListener('click', (e) => {
        if (e.target.matches('.page-btn')) {
            const page = parseInt(e.target.dataset.page);
            if (page !== currentPage) {
                currentPage = page;
                renderDiaries();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });

    diaryList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('この日記を削除してもよろしいですか？')) {
                const result = await postData('deleteDiary', { id });
                if (result.status === 'success') {
                    // データを再取得して先頭ページに戻る
                    currentPage = 1;
                    fetchAndRender();
                } else {
                    alert('削除に失敗しました。');
                }
            }
        }
        if (e.target.classList.contains('comment-delete-btn')) {
            const diaryId = e.target.dataset.diaryId;
            const commentIndex = e.target.dataset.commentIndex;
            if (confirm('このコメントを削除してもよろしいですか？')) {
                const result = await postData('deleteComment', { diaryId: diaryId, commentIndex: commentIndex });
                if (result.status === 'success') {
                    fetchAndRender();
                } else {
                    alert('コメントの削除に失敗しました。');
                }
            }
        }
    });

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
            currentPage = 1;
            fetchAndRender();
        } else {
            alert('投稿に失敗しました。');
        }
    });

    diaryList.addEventListener('submit', async (e) => {
        if (e.target.classList.contains('comment-form')) {
            e.preventDefault();
            const id = e.target.dataset.id;
            const authorInput = e.target.querySelector('input:nth-child(1)');
            const textInput = e.target.querySelector('input:nth-child(2)');
            const commentData = { author: authorInput.value, text: textInput.value };
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