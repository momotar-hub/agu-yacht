document.addEventListener('DOMContentLoaded', () => {
    // GASのウェブアプリURLをここに貼り付ける
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzzrSPATJT0_pY6wmJbBoyypufFVekntUYbQHnszeLQk10ERrPvTpJ9Ehk0ZbjWWHb5/exec';

    const form = document.getElementById('repair-form');
    const tableBody = document.querySelector('#repair-table tbody');
    
    // --- 編集モーダル関連 ---
    const editModal = document.getElementById('edit-repair-modal');
    const editForm = document.getElementById('edit-repair-form');
    const closeModalBtn = editModal.querySelector('.modal-close');

    let repairs = []; // データを保持する配列

    // --- 日付を 'YYYY-MM-DD' 形式に整形するヘルパー関数 ---
    const formatDate = (dateString) => {
        if (!dateString) return '';
        // 'T'以降の時間情報などを切り捨てる
        return dateString.split('T')[0];
    };

    // ローディング表示
    const showLoading = () => tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">読み込み中...</td></tr>';
    
    // データをテーブルに表示する関数
    const renderTable = () => {
        tableBody.innerHTML = '';
        if(repairs.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">データがありません</td></tr>';
            return;
        }
        
        repairs.sort((a, b) => new Date(b.discoveryDate) - new Date(a.discoveryDate));
        
        repairs.forEach(repair => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(repair.discoveryDate)}</td>
                <td>${repair.shipNumber}</td>
                <td>${repair.location}</td>
                <td>${repair.discoverer}</td>
                <td><span class="${repair.completionDate ? '' : 'text-muted'}">${formatDate(repair.completionDate) || '未完了'}</span></td>
                <td>${repair.repairer || '-'}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${repair.id}">編集</button>
                    ${!repair.completionDate ? `<button class="action-btn complete-btn" data-id="${repair.id}">完了</button>` : ''}
                    <button class="action-btn delete-btn" data-id="${repair.id}">削除</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };
    
    // --- スプレッドシートからデータを取得する関数 ---
    const fetchAndRender = async () => {
        showLoading();
        try {
            const response = await fetch(`${GAS_URL}?action=getRepairs`);
            const result = await response.json();
            if (result.status === 'success') {
                repairs = result.data;
                renderTable();
            } else {
                console.error('Failed to fetch data:', result.message);
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">データの読み込みに失敗しました</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">エラーが発生しました</td></tr>';
        }
    };

    // --- 汎用的なデータ送信関数 ---
    const postData = async (action, data) => {
        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // CORS対策
                body: JSON.stringify({ action, data })
            });
            return await response.json();
        } catch (error) {
            console.error('Error posting data:', error);
            alert('通信エラーが発生しました。');
            return { status: 'error' };
        }
    };

    // --- 各イベントリスナー ---

    // 新規登録
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newRepairData = {
            discoveryDate: document.getElementById('discovery-date').value,
            shipNumber: document.getElementById('ship-number').value,
            location: document.getElementById('location').value,
            discoverer: document.getElementById('discoverer').value,
        };
        const result = await postData('addRepair', newRepairData);
        if (result.status === 'success') {
            form.reset();
            fetchAndRender(); // 再読み込み
        } else {
            alert('登録に失敗しました。');
        }
    });

    // 編集、完了、削除
    tableBody.addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('edit-btn')) {
            const repairToEdit = repairs.find(r => r.id.toString() === id);
            document.getElementById('edit-repair-id').value = repairToEdit.id;
            document.getElementById('edit-discovery-date').value = formatDate(repairToEdit.discoveryDate);
            document.getElementById('edit-ship-number').value = repairToEdit.shipNumber;
            document.getElementById('edit-location').value = repairToEdit.location;
            document.getElementById('edit-discoverer').value = repairToEdit.discoverer;
            editModal.style.display = 'block';
        } else if (target.classList.contains('complete-btn')) {
            const repairer = prompt('修理担当者の名前を入力してください:');
            if (repairer && repairer.trim() !== '') {
                const completionDate = new Date().toISOString().split('T')[0];
                const result = await postData('completeRepair', { id, repairer, completionDate });
                if(result.status === 'success') fetchAndRender();
                else alert('更新に失敗しました。');
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('このデータを削除してもよろしいですか？')) {
                const result = await postData('deleteRepair', { id });
                if(result.status === 'success') fetchAndRender();
                else alert('削除に失敗しました。');
            }
        }
    });

    // 編集フォームの送信
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            id: document.getElementById('edit-repair-id').value,
            discoveryDate: document.getElementById('edit-discovery-date').value,
            shipNumber: document.getElementById('edit-ship-number').value,
            location: document.getElementById('edit-location').value,
            discoverer: document.getElementById('edit-discoverer').value,
        };
        const result = await postData('updateRepair', updatedData);
        if (result.status === 'success') {
            editModal.style.display = 'none';
            fetchAndRender();
        } else {
            alert('更新に失敗しました。');
        }
    });

    // モーダルを閉じる
    const closeModal = () => editModal.style.display = 'none';
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target == editModal) closeModal();
    });

    // 初期データの読み込み
    fetchAndRender();
});