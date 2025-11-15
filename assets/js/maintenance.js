document.addEventListener('DOMContentLoaded', () => {
    // あなたの最新のGASウェブアプリURL
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwtZDbENfTisuKK0asfmc0kXBVI97r6L2ShowEr8dS1Tf2JPz557uU4FvDtjYqZ5wAy/exec';

    const form = document.getElementById('maintenance-form');
    const maintenanceList = document.getElementById('maintenance-list');
    const editModal = document.getElementById('edit-maintenance-modal');
    const editForm = document.getElementById('edit-maintenance-form');
    const closeModalBtn = editModal.querySelector('.modal-close');
    let maintenances = [];

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

    const showLoading = () => maintenanceList.innerHTML = '<p style="text-align:center;">読み込み中...</p>';

    const renderList = () => {
        maintenanceList.innerHTML = '';
        if (maintenances.length === 0) {
            maintenanceList.innerHTML = '<p style="text-align:center;">メンテナンス記録はありません。</p>';
            return;
        }
        
        maintenances.sort((a, b) => new Date(b.discoveryDate) - new Date(a.discoveryDate));
        
        maintenances.forEach(item => {
            const card = document.createElement('div');
            // ★ CSSクラス名を 'maintenance-card' に統一
            card.className = 'card maintenance-card'; 
            const isCompleted = item.completionDate && item.completionDate !== '';

            card.innerHTML = `
                <div class="maintenance-card-header ${isCompleted ? 'completed' : 'pending'}">
                    <h3>${item.location}</h3>
                    <div class="maintenance-card-ship">船番号: ${item.shipNumber}</div>
                </div>
                <div class="maintenance-card-body">
                    <div class="info-grid">
                        <div><strong>発見/作業日:</strong> ${formatDate(item.discoveryDate)}</div>
                        <div><strong>発見/作業者:</strong> ${item.discoverer}</div>
                        <div><strong>費用:</strong> ${item.cost ? Number(item.cost).toLocaleString() + '円' : '未入力'}</div>
                        <div>
                            <strong>写真:</strong> 
                            ${item.photoUrl ? `<a href="${item.photoUrl}" target="_blank" rel="noopener noreferrer">リンクを開く <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : 'なし'}
                        </div>
                    </div>
                    ${item.remarks ? `<div class="remarks-section"><strong>備考:</strong><p>${(item.remarks || '').replace(/\n/g, '<br>')}</p></div>` : ''}
                    <div class="status-section">
                        <strong>状況:</strong>
                        <span class="status-tag ${isCompleted ? 'completed' : 'pending'}">
                            ${isCompleted ? `完了 (${formatDate(item.completionDate)} / ${item.repairer})` : '対応中'}
                        </span>
                    </div>
                </div>
                <div class="maintenance-card-footer">
                    ${!isCompleted ? `<button class="action-btn complete-btn" data-id="${item.id}">完了にする</button>` : ''}
                    <button class="action-btn edit-btn" data-id="${item.id}">編集</button>
                    <button class="action-btn delete-btn" data-id="${item.id}">削除</button>
                </div>
            `;
            maintenanceList.appendChild(card);
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
            // ★ アクション名を 'getRepairs' に修正
            const response = await fetch(`${GAS_URL}?action=getRepairs`);
            const result = await response.json();
            if (result.status === 'success') {
                maintenances = result.data;
                renderList();
            } else {
                console.error('Failed to fetch data from GAS:', result);
                maintenanceList.innerHTML = `<p style="text-align:center;">データの読み込みに失敗しました</p>`;
            }
        } catch (error) {
            console.error('Error fetching or parsing data:', error);
            maintenanceList.innerHTML = `<p style="text-align:center;">エラーが発生しました</p>`;
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newItemData = {
            discoveryDate: document.getElementById('discovery-date').value,
            shipNumber: document.getElementById('ship-number').value,
            location: document.getElementById('location').value,
            discoverer: document.getElementById('discoverer').value,
            remarks: document.getElementById('remarks').value,
            cost: document.getElementById('cost').value,
            photoUrl: document.getElementById('photoUrl').value,
        };
        // ★ アクション名を 'addRepair' に修正
        const result = await postData('addRepair', newItemData);
        if (result.status === 'success') {
            form.reset();
            fetchAndRender();
        } else {
            alert('登録に失敗しました。');
        }
    });

    maintenanceList.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        
        if (target.classList.contains('edit-btn')) {
            const itemToEdit = maintenances.find(r => r.id.toString() === id);
            document.getElementById('edit-maintenance-id').value = itemToEdit.id;
            document.getElementById('edit-discovery-date').value = formatDate(itemToEdit.discoveryDate);
            document.getElementById('edit-ship-number').value = itemToEdit.shipNumber;
            document.getElementById('edit-location').value = itemToEdit.location;
            document.getElementById('edit-discoverer').value = itemToEdit.discoverer;
            document.getElementById('edit-remarks').value = itemToEdit.remarks || '';
            document.getElementById('edit-cost').value = itemToEdit.cost || '';
            document.getElementById('edit-photoUrl').value = itemToEdit.photoUrl || '';
            editModal.style.display = 'block';
        } else if (target.classList.contains('complete-btn')) {
            const repairer = prompt('完了担当者の名前を入力してください:');
            if (repairer && repairer.trim() !== '') {
                const completionDate = new Date().toISOString().split('T')[0];
                // ★ アクション名を 'completeRepair' に修正
                const result = await postData('completeRepair', { id, repairer, completionDate });
                if(result.status === 'success') fetchAndRender();
                else alert('更新に失敗しました。');
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('この記録を削除してもよろしいですか？')) {
                // ★ アクション名を 'deleteRepair' に修正
                const result = await postData('deleteRepair', { id });
                if(result.status === 'success') fetchAndRender();
                else alert('削除に失敗しました。');
            }
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            id: document.getElementById('edit-maintenance-id').value,
            discoveryDate: document.getElementById('edit-discovery-date').value,
            shipNumber: document.getElementById('edit-ship-number').value,
            location: document.getElementById('edit-location').value,
            discoverer: document.getElementById('edit-discoverer').value,
            remarks: document.getElementById('edit-remarks').value,
            cost: document.getElementById('edit-cost').value,
            photoUrl: document.getElementById('edit-photoUrl').value,
        };
        // ★ アクション名を 'updateRepair' に修正
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