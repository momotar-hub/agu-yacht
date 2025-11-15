document.addEventListener('DOMContentLoaded', () => {
    // あなたの最新のGASウェブアプリURL
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwj35Wy9n9yayF1Tahndio9UzwyWfk9w-OUoWT8Y3J8crtzSjMws02RQdJ6rH0TZcuL/exec';

    const form = document.getElementById('diary-form');
    const diaryList = document.getElementById('diary-list');
    
    // コメント編集モーダル関連
    const editCommentModal = document.getElementById('edit-comment-modal');
    const editCommentForm = document.getElementById('edit-comment-form');
    const closeEditCommentModalBtn = editCommentModal.querySelector('.modal-close');
    
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

            const cardClone = document.getElementById('diary-card-template').content.cloneNode(true);
            const card = cardClone.querySelector('.card');

            card.querySelector('.delete-btn').dataset.id = entry.id;
            card.querySelector('.diary-date').textContent = formatDate(entry.date);
            card.querySelector('.diary-author').textContent = `投稿者: ${entry.author || '名無し'}`;
            card.querySelector('.weather').textContent = entry.weather || '不明';
            card.querySelector('.temperature').textContent = (entry.temperature !== null && entry.temperature !== undefined && entry.temperature !== '') ? `${entry.temperature}°C` : '不明';
            card.querySelector('.windDirection').textContent = entry.windDirection || '不明';
            card.querySelector('.windSpeed').textContent = (entry.windSpeed !== null && entry.windSpeed !== undefined && entry.windSpeed !== '') ? `${entry.windSpeed} m/s` : '不明';
            card.querySelector('.impression').innerHTML = (entry.impression || '').replace(/\n/g, '<br>');
            
            const commentList = card.querySelector('.comment-list');
            let comments = [];
            if (entry.comments && typeof entry.comments === 'string' && entry.comments.trim().startsWith('[')) {
                try { comments = JSON.parse(entry.comments); } catch (e) { console.error('コメントのJSONパースに失敗しました:', entry.comments, e); }
            }

            if (comments.length > 0) {
                commentList.innerHTML = comments.map((c, index) => `
                    <div class="comment">
                        <div class="comment-controls">
                            <button class="comment-edit-btn" title="コメントを編集" data-diary-id="${entry.id}" data-comment-index="${index}">
                                <i class="fa-solid fa-pencil"></i>
                            </button>
                            <button class="comment-delete-btn" title="コメントを削除" data-diary-id="${entry.id}" data-comment-index="${index}">
                                <i class="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <p>${(c.text || '').replace(/\n/g, '<br>')}</p>
                        <small>by ${c.author || '名無し'}</small>
                    </div>`).join('');
            } else {
                commentList.innerHTML = '<p>まだコメントはありません。</p>';
            }
            card.querySelector('.comment-form').dataset.id = entry.id;
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
        const deleteBtn = e.target.closest('.delete-btn');
        const commentDeleteBtn = e.target.closest('.comment-delete-btn');
        const commentEditBtn = e.target.closest('.comment-edit-btn');

        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            if (confirm('この日記を削除してもよろしいですか？')) {
                const result = await postData('deleteDiary', { id });
                if (result.status === 'success') {
                    currentPage = 1;
                    fetchAndRender();
                } else { alert('削除に失敗しました。'); }
            }
        }
        
        if (commentDeleteBtn) {
            const diaryId = commentDeleteBtn.dataset.diaryId;
            const commentIndex = commentDeleteBtn.dataset.commentIndex;
            if (confirm('このコメントを削除してもよろしいですか？')) {
                const result = await postData('deleteComment', { diaryId, commentIndex });
                if (result.status === 'success') {
                    fetchAndRender();
                } else { alert('コメントの削除に失敗しました。'); }
            }
        }

        if (commentEditBtn) {
            const diaryId = commentEditBtn.dataset.diaryId;
            const commentIndex = parseInt(commentEditBtn.dataset.commentIndex, 10);
            
            const diary = allDiaryEntries.find(entry => entry.id.toString() === diaryId);
            const comments = JSON.parse(diary.comments || '[]');
            const commentToEdit = comments[commentIndex];

            if (commentToEdit) {
                document.getElementById('edit-diary-id').value = diaryId;
                document.getElementById('edit-comment-index').value = commentIndex;
                document.getElementById('edit-comment-author').value = commentToEdit.author;
                document.getElementById('edit-comment-text').value = commentToEdit.text;
                editCommentModal.style.display = 'block';
            }
        }
    });

    editCommentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedCommentData = {
            diaryId: document.getElementById('edit-diary-id').value,
            commentIndex: document.getElementById('edit-comment-index').value,
            comment: {
                author: document.getElementById('edit-comment-author').value,
                text: document.getElementById('edit-comment-text').value,
            }
        };

        const result = await postData('updateComment', updatedCommentData);
        if (result.status === 'success') {
            editCommentModal.style.display = 'none';
            fetchAndRender();
        } else {
            alert('コメントの更新に失敗しました。');
        }
    });

    const closeEditModal = () => editCommentModal.style.display = 'none';
    closeEditCommentModalBtn.addEventListener('click', closeEditModal);
    window.addEventListener('click', (e) => {
        if (e.target === editCommentModal) {
            closeEditModal();
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
            const authorInput = e.target.querySelector('input[type="text"]');
            const textInput = e.target.querySelector('textarea');
            const commentData = { author: authorInput.value, text: textInput.value };
            const result = await postData('addComment', { id, comment: commentData });
            if (result.status === 'success') {
                authorInput.value = '';
                textInput.value = '';
                fetchAndRender();
            } else {
                alert('コメントの投稿に失敗しました。');
            }
        }
    });

    fetchAndRender();
});