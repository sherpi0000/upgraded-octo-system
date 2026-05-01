// 检查登录状态
function checkMerchantAuth() {
    return sessionStorage.getItem('merchantLogged') === 'true';
}

function merchantLogin() {
    const pwd = document.getElementById('merchantPwd').value;
    if (pwd === 'merchant123') {
        sessionStorage.setItem('merchantLogged', 'true');
        location.reload();
    } else {
        alert('密码错误');
    }
}

function renderProductManagement() {
    const products = JSON.parse(localStorage.getItem('farmProducts'));
    const tbody = document.getElementById('productList');
    if (!tbody) return;
    tbody.innerHTML = '';
    products.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${p.img}" alt="${p.name}" style="width:50px;height:50px;object-fit:cover;"></td>
            <td>${p.name}</td>
            <td>¥${p.price}</td>
            <td>${p.origin}</td>
            <td>${p.unit}</td>
            <td>
                <button class="edit-btn" data-id="${p.id}">编辑</button>
                <button class="del-btn" data-id="${p.id}">删除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    // 绑定编辑删除事件
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            editProduct(id);
        });
    });
    document.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            if (confirm('确定删除该商品吗？')) {
                let products = JSON.parse(localStorage.getItem('farmProducts'));
                products = products.filter(p => p.id !== id);
                localStorage.setItem('farmProducts', JSON.stringify(products));
                renderProductManagement();
                renderMessages(); // 刷新消息区（无影响）
            }
        });
    });
}

// function editProduct(id) {
//     const products = JSON.parse(localStorage.getItem('farmProducts'));
//     const product = products.find(p => p.id === id);
//     if (!product) return;
//     const newName = prompt('修改商品名称', product.name);
//     if (newName) product.name = newName;
//     const newPrice = parseFloat(prompt('修改价格', product.price));
//     if (!isNaN(newPrice)) product.price = newPrice;
//     const newOrigin = prompt('修改产地', product.origin);
//     if (newOrigin) product.origin = newOrigin;
//     const newUnit = prompt('修改单位', product.unit);
//     if (newUnit) product.unit = newUnit;
//     const newImg = prompt('修改图片URL', product.img);
//     if (newImg) product.img = newImg;
//     localStorage.setItem('farmProducts', JSON.stringify(products));
//     renderProductManagement();
// }
function editProduct(id) {
    const products = JSON.parse(localStorage.getItem('farmProducts'));
    const product = products.find(p => p.id === id);
    if (!product) return;

    // 让用户选择要修改的字段
    const fields = [
        { key: 'name', label: '商品名称', current: product.name, type: 'text' },
        { key: 'price', label: '价格', current: product.price, type: 'number' },
        { key: 'origin', label: '产地', current: product.origin, type: 'text' },
        { key: 'unit', label: '单位', current: product.unit, type: 'text' },
        { key: 'img', label: '图片URL', current: product.img, type: 'text' }
    ];

    // 先选择要修改哪个字段
    const fieldOptions = fields.map((f, idx) => `${idx + 1}. ${f.label}`).join('\n');
    const choice = prompt(`请选择要修改的字段（输入数字）：\n${fieldOptions}\n\n0. 退出编辑`, '0');
    if (choice === null || choice === '0') return; // 取消或退出

    const idx = parseInt(choice) - 1;
    if (isNaN(idx) || idx < 0 || idx >= fields.length) {
        alert('无效选择');
        return;
    }

    const selected = fields[idx];
    let newValue = prompt(`请输入新的${selected.label}`, selected.current);
    if (newValue === null) return; // 用户取消

    // 根据类型处理
    if (selected.key === 'price') {
        const num = parseFloat(newValue);
        if (isNaN(num)) {
            alert('价格必须是数字');
            return;
        }
        product.price = num;
    } else {
        product[selected.key] = newValue.trim() || selected.current; // 如果为空则保持原值
    }

    localStorage.setItem('farmProducts', JSON.stringify(products));
    renderProductManagement();
    alert(`${selected.label} 修改成功！`);
}

function addProduct() {
    const name = document.getElementById('prodName').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    const origin = document.getElementById('prodOrigin').value.trim();
    const unit = document.getElementById('prodUnit').value.trim();
    let img = document.getElementById('prodImg').value.trim();
    if (!name || isNaN(price) || !origin || !unit) {
        alert('请完整填写商品信息');
        return;
    }
    if (!img) img = 'https://picsum.photos/id/108/300/200';
    const products = JSON.parse(localStorage.getItem('farmProducts'));
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 7;
    products.push({ id: newId, name, price, origin, unit, img });
    localStorage.setItem('farmProducts', JSON.stringify(products));
    document.getElementById('prodName').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('prodOrigin').value = '';
    document.getElementById('prodUnit').value = '';
    document.getElementById('prodImg').value = '';
    renderProductManagement();
}

function renderMessages() {
    const messages = JSON.parse(localStorage.getItem('farmMessages'));
    const container = document.getElementById('messagesList');
    if (!container) return;
    container.innerHTML = '';
    const now = Date.now();
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message-item';
        const msgTime = new Date(msg.timestamp).getTime();
        const canDelete = (msg.type === 'merchant') && (now - msgTime <= 2 * 60 * 1000);
        const deleteBtnHtml = canDelete ? `<span class="delete-msg-merchant" data-id="${msg.id}" style="float:right; color:#e67e22; cursor:pointer;">🗑️ 撤回</span>` : '';
        div.innerHTML = `
            <div><strong>${msg.type === 'user' ? '用户' : '商家'}</strong> <small>${new Date(msg.timestamp).toLocaleString()}</small>${deleteBtnHtml}</div>
            <div>${escapeHtml(msg.content)}</div>
            ${msg.type === 'user' ? `
            <div class="reply-area">
                <input type="text" class="reply-input" placeholder="输入回复...">
                <button class="reply-btn" data-id="${msg.id}">回复</button>
            </div>` : ''}
        `;
        container.appendChild(div);
    });
    // 绑定删除事件（商家消息）
    document.querySelectorAll('.delete-msg-merchant').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteMerchantMessage(id);
            renderMessages();
        });
    });
    // 原有回复按钮绑定（保持不变）
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const msgId = parseInt(btn.dataset.id);
            const input = btn.parentElement.querySelector('.reply-input');
            const replyContent = input.value.trim();
            if (!replyContent) return;
            const messages = JSON.parse(localStorage.getItem('farmMessages'));
            messages.push({
                id: Date.now(),
                type: 'merchant',
                content: replyContent,
                timestamp: new Date().toISOString(),
                isRead: true
            });
            localStorage.setItem('farmMessages', JSON.stringify(messages));
            renderMessages();
        });
    });
}
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function deleteMerchantMessage(messageId) {
    let messages = JSON.parse(localStorage.getItem('farmMessages'));
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const now = Date.now();
    const msgTime = new Date(msg.timestamp).getTime();
    if (msg.type === 'merchant' && (now - msgTime <= 2 * 60 * 1000)) {
        messages = messages.filter(m => m.id !== messageId);
        localStorage.setItem('farmMessages', JSON.stringify(messages));
    } else {
        alert('只能删除自己发送且不超过2分钟的消息');
    }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    if (checkMerchantAuth()) {
        document.getElementById('loginDiv').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        renderProductManagement();
        renderMessages();
        document.getElementById('addProductBtn').addEventListener('click', addProduct);
    } else {
        document.getElementById('merchantLoginBtn').addEventListener('click', merchantLogin);
    }
});