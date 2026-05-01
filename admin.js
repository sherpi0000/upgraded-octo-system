function checkAdminAuth() {
    return sessionStorage.getItem('adminLogged') === 'true';
}

function adminLogin() {
    const pwd = document.getElementById('adminPwd').value;
    if (pwd === 'admin123') {
        sessionStorage.setItem('adminLogged', 'true');
        location.reload();
    } else {
        alert('密码错误');
    }
}

function renderDashboard() {
    autoCleanOldOrders();  // 先清理旧订单
    const orders = JSON.parse(localStorage.getItem('farmOrders')) || [];
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('totalOrders').innerText = totalOrders;
    document.getElementById('totalSales').innerText = `¥${totalSales.toFixed(2)}`;

    // 订单列表
    const orderTbody = document.getElementById('orderList');
    orderTbody.innerHTML = '';
    orders.forEach(order => {
    const itemsStr = order.items.map(item => `${item.name} x${item.quantity}`).join(', ');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${order.orderId}</td>
        <td>${new Date(order.createTime).toLocaleString()}</td>
        <td>${itemsStr}</td>
        <td>¥${order.total.toFixed(2)}</td>
        <td><button class="delete-order-btn" data-id="${order.orderId}" style="background:#e67e22; color:white; border:none; padding:4px 12px; border-radius:20px; cursor:pointer;">删除</button></td>
    `;
    orderTbody.appendChild(row);
    });
    // 绑定删除按钮事件
    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const orderId = btn.dataset.id;
            if (confirm('确定删除该订单吗？')) {
                deleteOrderById(orderId);
            }
        });
    });

    // 商品销售排行
    const productSales = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!productSales[item.name]) productSales[item.name] = 0;
            productSales[item.name] += item.quantity;
        });
    });
    const sorted = Object.entries(productSales).sort((a,b) => b[1] - a[1]);
    const topDiv = document.getElementById('topProductsList');
    topDiv.innerHTML = sorted.length ? 
        '<ul>' + sorted.slice(0,5).map(([name, qty]) => `<li>${name} - 销量 ${qty}</li>`).join('') + '</ul>' : 
        '<p>暂无销售数据</p>';

    renderAdminMessages();
}
function autoCleanOldOrders() {
    let orders = JSON.parse(localStorage.getItem('farmOrders'));
    const now = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);
    const filtered = orders.filter(order => new Date(order.createTime) > twoMonthsAgo);
    if (filtered.length !== orders.length) {
        localStorage.setItem('farmOrders', JSON.stringify(filtered));
        return true;
    }
    return false;
}
function deleteOrderById(orderId) {
    let orders = JSON.parse(localStorage.getItem('farmOrders'));
    orders = orders.filter(o => o.orderId !== orderId);
    localStorage.setItem('farmOrders', JSON.stringify(orders));
    renderDashboard(); // 刷新页面
}

document.addEventListener('DOMContentLoaded', () => {
    if (checkAdminAuth()) {
        document.getElementById('adminLoginDiv').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        renderDashboard();
    } else {
        document.getElementById('adminLoginBtn').addEventListener('click', adminLogin);
    }
});

// 渲染所有聊天记录，每条带删除按钮（无时间限制）
function renderAdminMessages() {
    const messages = JSON.parse(localStorage.getItem('farmMessages')) || [];
    const container = document.getElementById('adminMessagesList');
    if (!container) return;
    if (messages.length === 0) {
        container.innerHTML = '<p style="color:#999;">暂无聊天记录</p>';
        return;
    }
    container.innerHTML = '';
    messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.style.borderBottom = '1px solid #eee';
        msgDiv.style.padding = '12px';
        msgDiv.style.display = 'flex';
        msgDiv.style.justifyContent = 'space-between';
        msgDiv.style.alignItems = 'center';
        msgDiv.innerHTML = `
            <div style="flex:1;">
                <strong style="color:${msg.type === 'user' ? '#2c5e2e' : '#d35400'}">${msg.type === 'user' ? '用户' : '商家'}</strong>
                <small>${new Date(msg.timestamp).toLocaleString()}</small>
                <div style="margin-top:5px;">${escapeHtmlAdmin(msg.content)}</div>
            </div>
            <button class="admin-del-msg" data-id="${msg.id}" style="background:#e67e22; color:white; border:none; padding:6px 12px; border-radius:20px; cursor:pointer;">删除</button>
        `;
        container.appendChild(msgDiv);
    });
    // 绑定删除事件
    document.querySelectorAll('.admin-del-msg').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            if (confirm('确定删除这条消息吗？')) {
                deleteMessageByAdmin(id);
                renderAdminMessages(); // 刷新列表
            }
        });
    });
}

function deleteMessageByAdmin(messageId) {
    let messages = JSON.parse(localStorage.getItem('farmMessages'));
    messages = messages.filter(m => m.id !== messageId);
    localStorage.setItem('farmMessages', JSON.stringify(messages));
}

function escapeHtmlAdmin(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}