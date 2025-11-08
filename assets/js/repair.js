document.addEventListener('DOMContentLoaded', () => {
    // あなたの最新のGASウェブアプリURL
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwDkZmTmNHYelGQpV7tcZmjGGGHiB_0YfSg69Id9ZEKjTPC9jZj90ZAzJGKRPohWxaq/exec';

    const form = document.getElementById('repair-form');
    const tableBody = document.querySelector('#repair-table tbody');
    const editModal = document.getElementById('edit-repair-modal');
    const editForm = document.getElementById('edit-repair-form');
    const closeModalBtn = editModal.querySelector('.modal-close');
    let repairs = [];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) { return dateString; }
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            if (isNaN(year)) { return String(dateString).substring(0, 10); }
            return `${year}-${month}-${day}`;
        } catch (e) { return String(dateString).substring(0, 10); }
    };

    const showLoading = () => tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">読み込み中...</td></tr>`;
    
    // ▼▼▼ ここが修正点 ▼▼▼
    const renderTable = () => {
        tableBody.innerHTML = '';
        if (repairs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">データがありません</td></tr>`;
            return;
        }
        
        repairs.sort((a, b) => new Date(b.discoveryDate) - new Date(a.discoveryDate));
        
        repairs.forEach(repair => {
            const row = document.createElement('tr');
            // innerHTMLの内容はご提示いただいたもので完璧でした！
            row.innerHTML = `
                <td>${formatDate(repair.discoveryDate)}</td>
                <td>${repair.shipNumber}</td>
                <td>${repair.location}</td>
                <td>${repair.discoverer}</td>
                <td><span class="${repair.completionDate ? '' : 'text-muted'}">${formatDate(repair.completionDate) || '未完了'}</span></td>
                <td>${repair.repairer || '-'}</td>
                <td>${(repair.remarks || '').replace(/\n/g, '<br>')}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${repair.id}">編集</button>
                    ${!repair.completionDate ? `<button class="action-btn complete-btn" data-id="${repair.id}">完了</button>` : ''}
                    <button class="action-btn delete-btn" data-id="${repair.id}">削除</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };
    // ▲▲▲ ここまで ▲▲▲

    const postData = async (action, data) => {
        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action, data })
            });
            return await response.json();
        } catch (error) {
            console.error('Error posting data:', error); // alertからconsole.errorに変更
            alert('通信エラーが発生しました。');
            return { status: 'error' };
        }
    };
    
    const fetchAndRender = async () => {
        showLoading();
        try {
            const response = await fetch(`${GAS_URL}?action=getRepairs`);
            const result = await response.json();
            if (result.status === 'success') {
                repairs = result.data;
                renderTable();
            } else {
                console.error('Failed to fetch data from GAS:', result); // エラー詳細をコンソールに出力
                tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">データの読み込みに失敗しました</td></tr>`;
            }
        } catch (error) {
            console.error('Error fetching or parsing data:', error); // エラー詳細をコンソールに出力
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">エラーが発生しました</td></tr>`;
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newRepairData = {
            discoveryDate: document.getElementById('discovery-date').value,
            shipNumber: document.getElementById('ship-number').value,
            location: document.getElementById('location').value,
            discoverer: document.getElementById('discoverer').value,
            remarks: document.getElementById('remarks').value
        };
        const result = await postData('addRepair', newRepairData);
        if (result.status === 'success') {
            form.reset();
            fetchAndRender();
        } else {
            alert('登録に失敗しました。');
        }
    });

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
            document.getElementById('edit-remarks').value = repairToEdit.remarks || '';
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

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            id: document.getElementById('edit-repair-id').value,
            discoveryDate: document.getElementById('edit-discovery-date').value,
            shipNumber: document.getElementById('edit-ship-number').value,
            location: document.getElementById('edit-location').value,
            discoverer: document.getElementById('edit-discoverer').value,
            remarks: document.getElementById('edit-remarks').value
        };
        const result = await postData('updateRepair', updatedData);
        if (result.status === 'success') {
            editModal.style.display = 'none';
            fetchAndRender();
        } else {
            alert('更新に失敗しました。');
        }
    });

    const closeModal = () => editModal.style.display = 'none';
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target == editModal) closeModal();
    });

    fetchAndRender();
});