document.addEventListener('DOMContentLoaded', () => {
    // あなたの最新のGASウェブアプリURL
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzIcKxw6SQY2b4cs5klvTU5l3PqqqKvujpnacfoLI19ZWkFayr5efpiJn0cxAn2az3M/exec';

    const form = document.getElementById('diary-form');
    const diaryList = document.getElementById('diary-list');
    let diaryEntries = [];

    const showLoading = () => diaryList.innerHTML = '<p style="text-align:center;">読み込み中...</p>';

    const renderDiaries = () => {
        diaryList.innerHTML = '';
        if (!diaryEntries || diaryEntries.length === 0) {
            diaryList.innerHTML = '<p style="text-align:center;">日記の投稿がまだありません。</p>';
            return;
        }
        
        // 日付のソート処理をより安全に
        diaryEntries.sort((a, b) => {
            // 無効な日付データがあってもエラーにならないようにする
            const dateA = a.date ? new Date(a.date) : 0;
            const dateB = b.date ? new Date(b.date) : 0;
            return dateB - dateA;
        });

        diaryEntries.forEach(entry => {
            if (!entry || !entry.id) return; // 無効なエントリはスキップ

            const card = document.createElement('div');
            card.className = 'card';
            
            // --- ★★★ データを安全に処理する最終版 ★★★ ---
            const diaryDate = entry.date || '日付不明'; // GASがフォーマット済みなので、そのまま表示
            const diaryAuthor = entry.author || '名無し';
            const diaryWeather = entry.weather || '不明';
            const diaryTemperature = (entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== '') ? `${entry.temperature}°C` : '不明';
            const diaryWindDirection = entry.windDirection || '不明';
            const diaryWindSpeed = (entry.windSpeed !== null && entry.windSpeed !== undefined && entry.windSpeed !== '') ? `${entry.windSpeed} m/s` : '不明';
            const diaryImpression = (entry.impression || '').replace(/\n/g, '<br>');

            let comments = [];
            if (entry.comments && typeof entry.comments === 'string' && entry.comments.trim().startsWith('[')) {
                try {
                    comments = JSON.parse(entry.comments);
                } catch (e) {
                    console.error('コメントのJSONパースに失敗しました:', entry.comments, e);
                }
            }
            // --- ★★★ ここまで ★★★ ---

            card.innerHTML = `
                <button class="action-btn delete-btn" data-id="${entry.id}">削除</button>
                <div class="diary-header">
                    <div>
                        <div class="diary-date">${diaryDate}</div>
                        <div class="diary-author">投稿者: ${diaryAuthor}</div>
                    </div>
                </div>
                <div class="diary-weather-grid">
                    <div>天候: <span>${diaryWeather}</span></div>
                    <div>気温: <span>${diaryTemperature}</span></div>
                    <div>風向き: <span>${diaryWindDirection}</span></div>
                    <div>風速: <span>${diaryWindSpeed}</span></div>
                </div>
                <div class="diary-body">
                    <p>${diaryImpression}</p>
                </div>
                <div class="comment-section">
                    <h4>コメント</h4>
                    <div class="comment-list">
                        ${comments.length > 0 ? comments.map(c => `
                            <div class="comment">
                                <p>${c.text || ''}</p>
                                <small>by ${c.author || '名無し'}</small>
                            </div>
                        `).join('') : '<p>まだコメントはありません。</p>'}
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
    
    // postData関数は変更なし
    const postData = async (action, data) => { /* ... */ };

    const fetchAndRender = async () => {
        showLoading();
        try {
            const response = await fetch(`${GAS_URL}?action=getDiaries`);
            const result = await response.json();
            console.log("GASから受け取ったデータ:", result); // デバッグ用に残しておきます

            if (result.status === 'success' && Array.isArray(result.data)) {
                diaryEntries = result.data;
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

    // formのsubmitリスナー等は変更なし
    form.addEventListener('submit', async (e) => { /* ... */ });
    diaryList.addEventListener('click', async (e) => { /* ... */ });
    diaryList.addEventListener('submit', async (e) => { /* ... */ });

    fetchAndRender();

    // ↓↓↓ 省略した部分を含めた全文コードはここにペースト ↓↓↓
});