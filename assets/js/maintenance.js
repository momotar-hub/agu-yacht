document.addEventListener('DOMContentLoaded', () => {
    // ★★★ GASを再デプロイして、新しいURLに必ず更新してください ★★★
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbwlmQFVhSQ7DfE1k8IJcORiDwAiBLewghc-7NZBdgZg20GQP1htqWNL9FwNBufSYsA8/exec';

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
            card.className = 'card repair-card';
            
            const isCompleted = item.status === '完了';
            const isBilled = item.billingStatus === '請求済';
            const statusClass = (isCompleted && !isBilled) ? 'alert' : (isCompleted ? 'completed' : 'pending');

            card.innerHTML = `
                <div class="repair-card-header ${statusClass}">
                    <h3>${item.location}</h3>
                    <div class="repair-card-ship">船番号: ${item.shipNumber}</div>
                </div>
                <div class="repair-card-body">
                    <div class="info-grid">
                        <div><strong>発見日:</strong> ${formatDate(item.discoveryDate)}</div>
                        <div><strong>発見者:</strong> ${item.discoverer}</div>
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
                            ${isCompleted ? `完了 (完了日: ${formatDate(item.completionDate) || '未入力'} / 担当: ${item.repairer || '未入力'})` : '対応中'}
                        </span>
                    </div>
                    <div class="status-section">
                        <strong>請求:</strong>
                        <span class="status-tag ${statusClass}">
                            ${item.billingStatus || '未請求'}
                        </span>
                    </div>
                </div>
                <div class="repair-card-footer">
                    <button class="action-btn edit-btn" data-id="${item.id}">編集 / 状況変更</button>
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
            discoverer: document.getElementById('discoverer').value,
            shipNumber: document.getElementById('ship-number').value,
            location: document.getElementById('location').value,
            cost: document.getElementById('cost').value,
            photoUrl: document.getElementById('photoUrl').value,
            remarks: document.getElementById('remarks').value,
            billingStatus: document.querySelector('input[name="billingStatus"]:checked').value
        };
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
            
            const currentStatus = itemToEdit.status || '対応中';
            document.querySelector(`input[name="edit-status"][value="${currentStatus}"]`).checked = true;
            
            const currentBillingStatus = itemToEdit.billingStatus || '未請求';
            document.querySelector(`input[name="edit-billingStatus"][value="${currentBillingStatus}"]`).checked = true;

            document.getElementById('edit-discovery-date').value = formatDate(itemToEdit.discoveryDate);
            document.getElementById('edit-discoverer').value = itemToEdit.discoverer;
            document.getElementById('edit-ship-number').value = itemToEdit.shipNumber;
            document.getElementById('edit-location').value = itemToEdit.location;
            document.getElementById('edit-completion-date').value = formatDate(itemToEdit.completionDate);
            document.getElementById('edit-repairer').value = itemToEdit.repairer || '';
            document.getElementById('edit-cost').value = itemToEdit.cost || '';
            document.getElementById('edit-photoUrl').value = itemToEdit.photoUrl || '';
            document.getElementById('edit-remarks').value = itemToEdit.remarks || '';
            editModal.style.display = 'block';
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('この記録を削除してもよろしいですか？')) {
                const result = await postData('deleteRepair', { id });
                if(result.status === 'success') fetchAndRender();
                else alert('削除に失敗しました。');
            }
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let completionDate = document.getElementById('edit-completion-date').value;
        let repairer = document.getElementById('edit-repairer').value;
        const status = document.querySelector('input[name="edit-status"]:checked').value;
        
        if (status === '対応中') {
            completionDate = '';
            repairer = '';
        }

        const updatedData = {
            id: document.getElementById('edit-maintenance-id').value,
            status: status,
            discoveryDate: document.getElementById('edit-discovery-date').value,
            discoverer: document.getElementById('edit-discoverer').value,
            shipNumber: document.getElementById('edit-ship-number').value,
            location: document.getElementById('edit-location').value,
            completionDate: completionDate,
            repairer: repairer,
            cost: document.getElementById('edit-cost').value,
            photoUrl: document.getElementById('edit-photoUrl').value,
            remarks: document.getElementById('edit-remarks').value,
            billingStatus: document.querySelector('input[name="edit-billingStatus"]:checked').value
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