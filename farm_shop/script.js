// ---------- 拖拽滚动相关变量 ----------
let isDragging = false;
let startX, scrollLeftStart;
let snapAnimationId = null;
// ---------- 惯性滚动相关变量 ----------
let velocity = 0;               // 当前速度
let lastX = 0;                 // 上一次鼠标X坐标
let lastTimestamp = 0;         // 上一次时间戳
let inertiaFrameId = null;     // 惯性动画ID

// ---------- 商品数据 ----------
// ---------- 全局初始化 ----------
function initData() {
    // 初始化商品列表（若 localStorage 为空）
    if (!localStorage.getItem('farmProducts')) {
        const defaultProducts = [
            { id: 1, name: "烟台红富士苹果", price: 39.9, origin: "山东烟台", unit: "5斤装", img: "https://picsum.photos/id/108/300/200" },
            { id: 2, name: "湖北洪湖莲藕", price: 29.9, origin: "湖北洪湖", unit: "3斤装", img: "https://picsum.photos/id/128/300/200" },
            { id: 3, name: "陕西猕猴桃", price: 35.0, origin: "陕西周至", unit: "12枚装", img: "https://picsum.photos/id/616/300/200" },
            { id: 4, name: "东北黑木耳", price: 49.9, origin: "黑龙江牡丹江", unit: "250g", img: "https://picsum.photos/id/135/300/200" },
            { id: 5, name: "四川丑橘", price: 32.9, origin: "四川眉山", unit: "5斤装", img: "https://picsum.photos/id/179/300/200" },
            { id: 6, name: "云南小黄姜", price: 19.9, origin: "云南罗平", unit: "2斤装", img: "https://picsum.photos/id/126/300/200" }
        ];
        localStorage.setItem('farmProducts', JSON.stringify(defaultProducts));
    }
    if (!localStorage.getItem('farmOrders')) {
        localStorage.setItem('farmOrders', JSON.stringify([]));
    }
    if (!localStorage.getItem('farmMessages')) {
        localStorage.setItem('farmMessages', JSON.stringify([]));
    }
}
initData();

// 获取商品列表
function getProducts() {
    return JSON.parse(localStorage.getItem('farmProducts'));
}

// 保存商品列表（商家用）
function saveProducts(products) {
    localStorage.setItem('farmProducts', JSON.stringify(products));
}

// ---------- 购物车存储操作 ----------
function getCart() {
    const cart = localStorage.getItem('farmCart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('farmCart', JSON.stringify(cart));
}

function addToCart(productId, quantity = 1) {
    const cart = getCart();
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: productId, quantity });
    }
    saveCart(cart);
    updateCartBadge();
    alert('已加入购物车');
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeItem(productId);
        return;
    }
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart(cart);
    }
    renderCart();
    updateCartBadge();
}

function removeItem(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    renderCart();
    updateCartBadge();
}

function clearCart() {
    if (confirm('确定要清空购物车吗？')) {
        saveCart([]);
        renderCart();
        updateCartBadge();
    }
}

function checkout() {
    const cart = getCart();
    if (cart.length === 0) {
        alert('购物车是空的，请先选购商品');
        return;
    }
    const products = getProducts();
    let orderItems = [];
    let total = 0;
    for (let item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
            const subtotal = product.price * item.quantity;
            total += subtotal;
            orderItems.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                subtotal: subtotal
            });
        }
    }
    const order = {
        orderId: 'ORD' + Date.now(),
        createTime: new Date().toISOString(),
        items: orderItems,
        total: total
    };
    const orders = JSON.parse(localStorage.getItem('farmOrders'));
    orders.push(order);
    localStorage.setItem('farmOrders', JSON.stringify(orders));
    saveCart([]);
    renderCart();
    updateCartBadge();
    alert('下单成功！订单已保存。');
}
// ---------- 页面渲染 ----------
function renderProducts(keyword = '') {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    let products = getProducts();
    // 过滤商品
    if (keyword.trim() !== '') {
        const lowerKeyword = keyword.toLowerCase();
        products = products.filter(p => 
            p.name.toLowerCase().includes(lowerKeyword) || 
            p.origin.toLowerCase().includes(lowerKeyword)
        );
    }
    grid.innerHTML = '';
    products.forEach(p => {
        // 原有卡片创建代码不变
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img class="product-img" src="${p.img}" alt="${p.name}" loading="lazy">
            <div class="product-info">
                <div class="product-name">${p.name}</div>
                <div class="product-origin">📍 ${p.origin}</div>
                <div class="product-price">¥${p.price} <small>/ ${p.unit}</small></div>
                <button class="add-btn" data-id="${p.id}">➕ 加入购物车</button>
            </div>
        `;
        grid.appendChild(card);
    });
    // 绑定加入购物车事件
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            addToCart(id, 1);
        });
    });
    // 初始化拖拽滚动
    initDragToScroll();
}

function renderCart() {
    const container = document.getElementById('cartContainer');
    if (!container) return;
    const cart = getCart();
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart">🛒 购物车空空如也，快去首页选购吧～</div>';
        return;
    }
    let html = `<table class="cart-table">
        <thead>
            <tr><th>商品</th><th>单价</th><th>数量</th><th>小计</th><th>操作</th>
        </thead>
        <tbody>`;
    let total = 0;
    cart.forEach(item => {
        const product = getProducts().find(p => p.id === item.id);
        if (!product) return;
        const subtotal = product.price * item.quantity;
        total += subtotal;
        html += `
            <tr>
                <td><strong>${product.name}</strong><br><small style="color:#7f8c6d">${product.origin}</small></td>
                <td>¥${product.price}</td>
                <td><input type="number" class="qty-input" data-id="${product.id}" value="${item.quantity}" min="1"></td>
                <td>¥${subtotal.toFixed(2)}</td>
                <td><span class="remove-link" data-id="${product.id}">删除</span></td>
            </tr>
        `;
    });
    html += `</tbody>
    </table>
    <div class="cart-summary">
        <strong>总计：¥${total.toFixed(2)}</strong><br>
        <button class="checkout-btn" id="checkoutBtn">✅ 去结算</button>
        <button class="checkout-btn" id="clearCartBtn" style="background:#aaa; margin-left:12px;">🗑️ 清空购物车</button>
    </div>`;
    container.innerHTML = html;
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = parseInt(input.dataset.id);
            let newQty = parseInt(input.value);
            if (isNaN(newQty) || newQty < 1) newQty = 1;
            updateQuantity(id, newQty);
        });
    });
    document.querySelectorAll('.remove-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const id = parseInt(link.dataset.id);
            removeItem(id);
        });
    });
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearCart);
}

function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('#cartCount');
    badges.forEach(badge => {
        if (badge) badge.textContent = totalItems;
    });
}
// ---------- 消息系统 ----------
function sendMessage(content, type = 'user') {
    if (!content.trim()) return;
    const messages = JSON.parse(localStorage.getItem('farmMessages'));
    messages.push({
        id: Date.now(),
        type: type,      // 'user' 或 'merchant'
        content: content,
        timestamp: new Date().toISOString(),
        isRead: false
    });
    localStorage.setItem('farmMessages', JSON.stringify(messages));
}

function getMessages() {
    return JSON.parse(localStorage.getItem('farmMessages'));
}

// 渲染聊天窗口（供用户界面调用，也会被商家页面调用）
function deleteUserMessage(messageId) {
    let messages = getMessages();
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const now = Date.now();
    const msgTime = new Date(msg.timestamp).getTime();
    // 只能删除自己发送且在两分钟内的消息
    if (msg.type === 'user' && (now - msgTime <= 2 * 60 * 1000)) {
        messages = messages.filter(m => m.id !== messageId);
        localStorage.setItem('farmMessages', JSON.stringify(messages));
    } else {
        alert('只能删除自己发送且不超过2分钟的消息');
    }
}

function renderChatMessages(containerId = 'chatMessages') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const messages = getMessages();
    container.innerHTML = '';
    const now = Date.now();
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.type}`;
        const msgTime = new Date(msg.timestamp).getTime();
        const canDelete = (msg.type === 'user') && (now - msgTime <= 2 * 60 * 1000);
        const deleteBtnHtml = canDelete ? `<span class="delete-msg" data-id="${msg.id}" style="margin-left:8px;cursor:pointer;font-size:12px;">🗑️</span>` : '';
        div.innerHTML = `<div>${escapeHtml(msg.content)}</div><small style="font-size:10px; opacity:0.7;">${new Date(msg.timestamp).toLocaleTimeString()}${deleteBtnHtml}</small>`;
        container.appendChild(div);
    });
    // 绑定删除事件
    document.querySelectorAll('.delete-msg').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteUserMessage(id);
            renderChatMessages(containerId);
        });
    });
    container.scrollTop = container.scrollHeight;
}
// 辅助函数：防止XSS
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function initDragToScroll() {
    const slider = document.querySelector('.product-grid');
    if (!slider) return;

    // 移除旧监听，避免重复绑定
    slider.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onGlobalMouseUp);
    window.removeEventListener('mousemove', onGlobalMouseMove);

    // 绑定拖拽开始
    slider.addEventListener('mousedown', onMouseDown);
    slider.style.userSelect = 'none';
}

let currentSlider = null; // 记录当前拖拽的slider

function onMouseDown(e) {
    const slider = e.currentTarget;
    currentSlider = slider;
    isDragging = true;

    // 停止任何正在进行的惯性动画
    if (inertiaFrameId) {
        cancelAnimationFrame(inertiaFrameId);
        inertiaFrameId = null;
    }

    // 记录起始位置和速度相关
    startX = e.pageX;
    scrollLeftStart = slider.scrollLeft;
    lastX = e.pageX;
    lastTimestamp = performance.now();
    velocity = 0;

    slider.style.cursor = 'grabbing';

    // 全局监听移动和松开
    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);

    e.preventDefault();
}

function onGlobalMouseMove(e) {
    if (!isDragging || !currentSlider) return;
    const slider = currentSlider;
    const now = performance.now();
    let dt = Math.max(1, now - lastTimestamp);
    const currentX = e.pageX;

    // 计算速度（像素/毫秒），用于惯性
    let deltaX = currentX - lastX;
    velocity = deltaX / dt;  // 单位：像素/毫秒

    // 移动距离 = 鼠标移动距离（注意方向：scrollLeft = start - 移动偏移）
    let walk = currentX - startX;
    let targetScroll = scrollLeftStart - walk;

    // 边界弹性阻尼（拖拽中超出边界时产生阻力感）
    const maxScroll = slider.scrollWidth - slider.clientWidth;
    targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

    slider.scrollLeft = targetScroll;

    // 更新上一次数据
    lastX = currentX;
    lastTimestamp = now;
}

function onGlobalMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    if (currentSlider) {
        currentSlider.style.cursor = 'grab';
        // 启动惯性滚动
        startInertiaScroll(currentSlider, velocity);
    }
    // 清理全局监听
    window.removeEventListener('mousemove', onGlobalMouseMove);
    window.removeEventListener('mouseup', onGlobalMouseUp);
    currentSlider = null;
}
function startInertiaScroll(slider, initialVelocity) {
    if (inertiaFrameId) {
        cancelAnimationFrame(inertiaFrameId);
        inertiaFrameId = null;
    }

    let speed = initialVelocity * 10; // 转换为≈帧速率的速度因子（为了手感舒适）
    const friction = 0.98;            // 阻尼系数（越小减速越快）
    const boundaryBounce = 0;      // 边界回弹系数
    const minSpeed = 0.2;             // 最小停止速度

    let lastScrollLeft = slider.scrollLeft;
    let lastTime = performance.now();

    function step() {
        const now = performance.now();
        let dt = Math.min(32, now - lastTime); // 限制最大时间间隔
        if (dt <= 0) {
            inertiaFrameId = requestAnimationFrame(step);
            return;
        }

        // 速度衰减（阻尼）
        speed = speed * Math.pow(friction, dt / 16);
        let delta = speed * (dt / 16);

        let current = slider.scrollLeft;
        let newScroll = current + delta;
        const maxScroll = slider.scrollWidth - slider.clientWidth;

        // 边界处理（弹性回弹）
        if (newScroll < 0) {
            newScroll = 0;
            speed = -speed * boundaryBounce;
            // 如果速度很小则直接停止
            if (Math.abs(speed) < minSpeed) speed = 0;
        } else if (newScroll > maxScroll) {
            newScroll = maxScroll;
            speed = -speed * boundaryBounce;
            if (Math.abs(speed) < minSpeed) speed = 0;
        }

        slider.scrollLeft = newScroll;

        // 如果速度足够小或超出边界后静止，则停止惯性并做一次边界对齐（防止边界残留浮动）
        if (Math.abs(speed) < minSpeed && (slider.scrollLeft <= 0 || slider.scrollLeft >= maxScroll || Math.abs(newScroll - current) < 0.5)) {
            // 最后微调边界
            if (slider.scrollLeft < 0) slider.scrollLeft = 0;
            if (slider.scrollLeft > maxScroll) slider.scrollLeft = maxScroll;
            inertiaFrameId = null;
            return;
        }

        lastScrollLeft = slider.scrollLeft;
        lastTime = now;
        inertiaFrameId = requestAnimationFrame(step);
    }

    inertiaFrameId = requestAnimationFrame(step);
}
// 聊天窗口控制（只在首页有效）
if (document.getElementById('contactBtn')) {
    const contactBtn = document.getElementById('contactBtn');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeChatBtn');
    const sendBtn = document.getElementById('sendMsgBtn');
    const chatInput = document.getElementById('chatInput');

    contactBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            renderChatMessages('chatMessages');
        }
    });
    closeBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });
    sendBtn.addEventListener('click', () => {
        const content = chatInput.value.trim();
        if (content) {
            sendMessage(content, 'user');
            renderChatMessages('chatMessages');
            chatInput.value = '';
        }
    });
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendBtn.click();
    });
}