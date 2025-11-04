document.addEventListener('DOMContentLoaded', () => {
    // GASのウェブアプリURLをここに貼り付ける
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbzzrSPATJT0_pY6wmJbBoyypufFVekntUYbQHnszeLQk10ERrPvTpJ9Ehk0ZbjWWHb5/exec';

    const form = document.getElementById('purchase-form');
    const tableBody = document.querySelector('#purchase-table tbody');
    const editModal = document.getElementById('edit-purchase-modal');
    const editForm = document.getElementById('edit-purchase-form');
    const closeModalBtn = editModal.querySelector('.modal-close');
    let purchases = [];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString.split('T')[0];
    };

    const showLoading = () => tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">読み込み中...</td></tr>';

    const renderTable = () => {
        tableBody.innerHTML = '';
        if (purchases.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">データがありません</td></tr>';
            return;
        }
        purchases.sort((a, b) => new Date(b.date) - new Date(a.date));
        purchases.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(item.date)}</td>
                <td>${Number(item.price).toLocaleString()}</td>
                <td>${item.name}</td>
                <td>${item.location}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${item.id}">編集</button>
                    <button class="action-btn delete-btn" data-id="${item.id}">削除</button>
                </td>
            `;
            tableBody.appendChild(row);
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
            const response = await fetch(`${GAS_URL}?action=getPurchases`);
            const result = await response.json();
            if (result.status === 'success') {
                purchases = result.data;
                renderTable();
            } else {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">データの読み込みに失敗しました</td></tr>';
            }
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">エラーが発生しました</td></tr>';
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newItemData = {
            date: document.getElementById('purchase-date').value,
            price: document.getElementById('price').value,
            name: document.getElementById('item-name').value,
            location: document.getElementById('storage-location').value,
        };
        const result = await postData('addPurchase', newItemData);
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
            const itemToEdit = purchases.find(p => p.id.toString() === id);
            document.getElementById('edit-purchase-id').value = itemToEdit.id;
            document.getElementById('edit-purchase-date').value = formatDate(itemToEdit.date);
            document.getElementById('edit-price').value = itemToEdit.price;
            document.getElementById('edit-item-name').value = itemToEdit.name;
            document.getElementById('edit-storage-location').value = itemToEdit.location;
            editModal.style.display = 'block';
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('このデータを削除してもよろしいですか？')) {
                const result = await postData('deletePurchase', { id });
                if (result.status === 'success') fetchAndRender();
                else alert('削除に失敗しました。');
            }
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updatedData = {
            id: document.getElementById('edit-purchase-id').value,
            date: document.getElementById('edit-purchase-date').value,
            price: document.getElementById('edit-price').value,
            name: document.getElementById('edit-item-name').value,
            location: document.getElementById('edit-storage-location').value,
        };
        const result = await postData('updatePurchase', updatedData);
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