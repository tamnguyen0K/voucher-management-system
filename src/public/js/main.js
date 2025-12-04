/**
 * File: public/js/main.js
 * 
 * Mô tả: Frontend JavaScript chính cho Voucher System
 * - Khởi tạo Bootstrap components (tooltips, popovers, alerts)
 * - Form validation, rating stars interaction
 * - Voucher claim với realtime polling và status checking
 * - Floating chat widget tích hợp n8n chatbot
 * - Custom center modal (popup trung tâm)
 * - QR code generation cho vouchers
 * - Toast notifications
 * - Scroll animations
 * - Auth forms với AJAX
 * 
 * Công nghệ sử dụng:
 * - Vanilla JavaScript (ES6+)
 * - Bootstrap 5: UI components và JavaScript APIs
 * - Fetch API: AJAX requests
 * - LocalStorage: Lưu chat history
 * - QRCode library: Generate QR codes
 * - Intersection Observer API: Scroll animations
 */

document.addEventListener('DOMContentLoaded', function() {
    [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]')).map(el => new bootstrap.Tooltip(el));
    [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]')).map(el => new bootstrap.Popover(el));
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => new bootstrap.Alert(alert).close());
    }, 5000);

    initializeFormValidation();
    initializeRatingStars();
    initializeVoucherClaim();
    initializeSearch();
    initializeScrollAnimations();
    initializeCenterModal();
    initializeAuthForms();
    initializeConfirmations();
    initializeVoucherRealtime();
    initializeQrButtons();
    initializeFloatingMessageButton();
});

function initializeFormValidation() {
    document.querySelectorAll('.needs-validation').forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
}

function initializeRatingStars() {
    document.querySelectorAll('.rating-input').forEach(ratingInput => {
        const stars = ratingInput.querySelectorAll('.star-rating');
        const hiddenInput = ratingInput.querySelector('input[type="hidden"]');
        const updateStars = (rating) => {
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.classList.add('text-warning');
                    star.classList.remove('text-muted');
                } else {
                    star.classList.add('text-muted');
                    star.classList.remove('text-warning');
                }
            });
        };
        stars.forEach(star => {
            star.addEventListener('click', function() {
                hiddenInput.value = parseInt(this.dataset.rating);
                updateStars(parseInt(this.dataset.rating));
            });
            star.addEventListener('mouseenter', function() {
                updateStars(parseInt(this.dataset.rating));
            });
        });
        ratingInput.addEventListener('mouseleave', function() {
            updateStars(parseInt(hiddenInput.value) || 0);
        });
    });
}

function initializeVoucherClaim() {
    document.querySelectorAll('form[action*="/claim"]').forEach(form => {
        form.addEventListener('submit', function(event) {
            const voucherCode = form.closest('.card')?.querySelector('.badge')?.textContent.trim();
            if (!confirm(`Bạn có chắc muốn claim voucher ${voucherCode || ''}?`)) {
                event.preventDefault();
                return false;
            }
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Đang xử lý...';
            submitBtn.disabled = true;
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 3000);
        });
    });
}

function initializeVoucherRealtime() {
    const forms = document.querySelectorAll('form[action*="/vouchers/"][data-voucher-id]');
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            const id = form.getAttribute('data-voucher-id');
            if (!id) return;
            e.preventDefault();
            try {
                const res = await fetch(`/vouchers/${id}/status`, { credentials: 'same-origin' });
                if (!res.ok) { form.submit(); return; }
                const data = await res.json();
                if (!data.success) { form.submit(); return; }
                if (!data.eligible) { showToast('Tài khoản không đủ quyền nhận voucher', 'warning'); return; }
                if (data.alreadyClaimed) {
                    const html = `<div class="p-3 text-center"><div class="mb-2"><i class="fas fa-info-circle text-primary me-2"></i>Bạn đã nhận voucher đó rồi</div><div><button type="button" class="btn btn-primary" onclick="(${closeCenterModal.toString()})()">Đóng</button></div></div>`;
                    openCenterModal(html);
                    return;
                }
                form.__confirming = true;
                form.submit();
            } catch { form.submit(); }
        });
    });
    const ids = Array.from(forms).map(f => f.getAttribute('data-voucher-id'));
    if (!ids.length) return;
    const updateOne = async (id) => {
        try {
            const res = await fetch(`/vouchers/${id}/status`, { credentials: 'same-origin' });
            if (!res.ok) return;
            const data = await res.json();
            const remainingEl = document.querySelector(`[data-remaining-for="${id}"]`);
            if (remainingEl && typeof data.quantityRemaining === 'number') remainingEl.textContent = data.quantityRemaining;
            const bar = document.querySelector(`[data-progress-for="${id}"]`);
            if (bar && typeof data.quantityClaimed === 'number' && typeof data.quantityTotal === 'number') {
                const pct = Math.min(100, Math.max(0, (data.quantityClaimed / Math.max(1, data.quantityTotal)) * 100));
                bar.style.width = pct + '%';
            }
            const btn = document.querySelector(`[data-claim-btn-for="${id}"]`);
            if (btn) {
                btn.disabled = !!(data.status !== 'active' || data.alreadyClaimed || !data.eligible);
            }
        } catch {}
    };
    setInterval(() => ids.forEach(updateOne), 5000);
}

function initializeQrButtons() {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.show-qr-code');
        if (!btn) return;
        const code = btn.getAttribute('data-code');
        const html = `<div class="p-3 text-center"><div class="mb-2 fw-semibold">QR Voucher: ${escapeHtml(code)}</div><div id="qr-holder" class="d-flex justify-content-center"></div><div class="mt-3"><button type="button" class="btn btn-outline-secondary" onclick="(${closeCenterModal.toString()})()">Đóng</button></div></div>`;
        openCenterModal(html);
        const holder = document.getElementById('qr-holder');
        if (holder && window.QRCode) {
            const q = new QRCode({});
            q.makeCode(code || '');
            q.appendTo(holder);
        }
    });
}

function initializeFloatingMessageButton() {
    const btn = document.getElementById('floating-message-btn');
    const panel = document.getElementById('floating-chat-panel');
    const form = document.getElementById('floating-chat-form');
    const input = document.getElementById('floating-chat-input');
    const body = document.getElementById('floating-chat-body');
    const scrollBtn = document.getElementById('floating-chat-scroll-btn');
    if (!btn || !panel || !form || !input || !body) return;
    
    btn.addEventListener('click', function() {
        const willOpen = !panel.classList.contains('open');
        if (willOpen) {
            panel.classList.add('open');
            panel.style.display = 'flex';
            input.focus();
        } else {
            panel.classList.remove('open');
            panel.style.display = 'none';
        }
    });
    
    const saved = loadChatHistory();
    if (Array.isArray(saved) && saved.length) {
        saved.forEach(m => {
            const isBot = m.sender === 'bot';
            if (isBot) {
                const displayHtml = linkifyLocationsText(m.text || '');
                appendChatMessage(m.sender, displayHtml, body, m.type === 'error', true, m.text);
            } else {
                appendChatMessage(m.sender, m.text, body, m.type === 'error', false);
            }
        });
        body.scrollTop = body.scrollHeight;
    }
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const q = (input.value || '').trim();
        if (!q) return;
        input.value = '';
        await sendMessage(q, body);
    });
    
    body.addEventListener('scroll', function() {
        if (scrollBtn) scrollBtn.classList.toggle('show', !isAtBottom(body));
    });
    
    if (scrollBtn) scrollBtn.addEventListener('click', () => scrollToBottom(body));
}

async function sendMessage(q, body) {
    appendChatMessage('user', q, body, false);
    const loading = document.createElement('div');
    loading.className = 'small text-muted mb-2';
    loading.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang hỏi...';
    body.appendChild(loading);
    scrollToBottom(body);
    try {
        const r = await fetch('/api/chatbot/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, mode: 'chat', context: document.title })
        });
        loading.remove();
        if (!r.ok) {
            appendChatMessage('error', 'Có lỗi xảy ra, vui lòng thử lại.', body, true);
            return;
        }
        const ct = r.headers.get('content-type') || '';
        let text = '';
        let displayHtml = '';
        if (ct.includes('application/json')) {
            const data = await r.json();
            const rawText = (data && (data.answer || data.text || '')) || '';
            displayHtml = (data && data.answer_html) || linkifyLocationsText(rawText);
            text = rawText;
        } else {
            text = await r.text();
            displayHtml = linkifyLocationsText(text);
        }
        appendChatMessage('bot', displayHtml || 'Không có câu trả lời.', body, false, true, text);
        scrollToBottom(body);
    } catch {
        loading.remove();
        appendChatMessage('error', 'Có lỗi mạng, vui lòng thử lại.', body, true);
    }
}

function appendChatMessage(sender, text, body, isError, isHtml = false, rawText = null) {
    const row = document.createElement('div');
    row.className = `chat-row ${sender === 'user' ? 'chat-row-user' : 'chat-row-bot'}`;
    if (sender === 'bot') {
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar-bot';
        avatar.innerHTML = '<i class="fas fa-robot"></i>';
        row.appendChild(avatar);
    }
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}${isError ? ' text-danger' : ''}`;
    bubble.innerHTML = isHtml ? String(text || '') : (sender === 'bot' ? linkifyLocationsText(text || '') : formatMessageText(text || ''));
    row.appendChild(bubble);
    body.appendChild(row);
    saveChatItem(sender, rawText !== null ? rawText : text, isError);
}

function isAtBottom(body) {
    return body.scrollHeight - body.scrollTop - body.clientHeight < 20;
}

function scrollToBottom(body) { body.scrollTop = body.scrollHeight; }

function loadChatHistory() {
    try {
        const raw = localStorage.getItem('chat_history');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.slice(-10);
    } catch { return []; }
}

function saveChatItem(sender, text, isError) {
    try {
        const list = loadChatHistory();
        list.push({ sender, text, type: isError ? 'error' : sender });
        const trimmed = list.slice(-10);
        localStorage.setItem('chat_history', JSON.stringify(trimmed));
    } catch {}
}

function formatMessageText(str) {
    return escapeHtml(str).replace(/\r?\n/g, '<br>');
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function linkifyLocationsText(raw) {
    if (!raw) return '';
    const re = /(?:(\d+)[.)]\s+)?([^\[\n]+?)\s*\[([0-9a-fA-F]{24})\]/g;
    let out = '';
    let lastIdx = 0;
    let m;
    while ((m = re.exec(raw)) !== null) {
        out += escapeHtml(raw.slice(lastIdx, m.index));
        const num = m[1] || '';
        const name = m[2].trim();
        const id = m[3];
        const prefix = num ? `<b>${num}.</b> ` : '';
        out += `${prefix}<a href="/locations/${id}" class="chat-location-link">${escapeHtml(name)}</a>`;
        lastIdx = re.lastIndex;
    }
    out += escapeHtml(raw.slice(lastIdx));
    return out.replace(/\r?\n/g, '<br>');
}

function initializeConfirmations() {
    document.addEventListener('click', async function(e) {
        const submitBtn = e.target.closest('button[type="submit"][data-confirm], input[type="submit"][data-confirm]');
        if (!submitBtn) return;
        const form = submitBtn.form;
        if (!form) return;
        e.preventDefault();
        const message = submitBtn.getAttribute('data-confirm');
        const ok = await confirmWithCenterModal(message || 'Bạn có chắc muốn thực hiện thao tác này?');
        if (ok) form.submit();
    });

    document.querySelectorAll('form[data-confirm]').forEach(form => {
        form.addEventListener('submit', async function(e) {
            if (form.__confirming) return;
            e.preventDefault();
            const message = form.getAttribute('data-confirm');
            const ok = await confirmWithCenterModal(message || 'Bạn có chắc muốn thực hiện thao tác này?');
            if (ok) {
                form.__confirming = true;
                form.submit();
            }
        });
    });
}

async function confirmWithCenterModal(message) {
    const backdrop = document.getElementById('center-modal-backdrop');
    const content = document.getElementById('center-modal-content');
    if (!backdrop || !content) return window.confirm(message);
    return new Promise(resolve => {
        const html = `
            <div class="p-3">
                <div class="mb-3">${message}</div>
                <div class="d-flex gap-2">
                    <button id="cm-cancel" type="button" class="btn btn-secondary flex-fill">Hủy</button>
                    <button id="cm-ok" type="button" class="btn btn-danger flex-fill">Xác nhận</button>
                </div>
            </div>`;
        openCenterModal(html);
        const cancelBtn = document.getElementById('cm-cancel');
        const okBtn = document.getElementById('cm-ok');
        const cleanup = () => closeCenterModal();
        cancelBtn.addEventListener('click', () => { cleanup(); resolve(false); }, { once: true });
        okBtn.addEventListener('click', () => { cleanup(); resolve(true); }, { once: true });
    });
}

function initializeSearch() {
    document.querySelectorAll('.search-input').forEach(input => {
        input.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase();
            const targetSelector = this.dataset.target;
            const items = document.querySelectorAll(targetSelector);
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }, 300));
    });
}

function initializeScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('fade-in');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.card, .hero-section').forEach(el => observer.observe(el));
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${getToastIcon(type)} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

function getToastIcon(type) {
    const icons = { success: 'check-circle', danger: 'exclamation-triangle', warning: 'exclamation-circle', info: 'info-circle' };
    return icons[type] || 'info-circle';
}

async function fetchWithLoading(url, options = {}) {
    const defaultOptions = { headers: { 'Content-Type': 'application/json', ...options.headers } };
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Có lỗi xảy ra khi tải dữ liệu', 'danger');
        throw error;
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('Đã sao chép vào clipboard', 'success'))
            .catch(() => fallbackCopyTextToClipboard(text));
    } else fallbackCopyTextToClipboard(text);
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('Đã sao chép vào clipboard', 'success');
    } catch {
        showToast('Không thể sao chép', 'danger');
    }
    document.body.removeChild(textArea);
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('copy-voucher-code')) {
        copyToClipboard(event.target.dataset.code);
    }
});

function initializeAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleAuthFormSubmit(this, '/login', 'login');
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const pw = document.getElementById('reg_password').value;
            const cpw = document.getElementById('confirm_password').value;
            if (pw !== cpw) {
                showToast('Mật khẩu xác nhận không khớp', 'danger');
                return;
            }
            await handleAuthFormSubmit(this, '/register', 'register');
        });
    }
}

async function handleAuthFormSubmit(form, url, tabType) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const formData = new FormData(form);
    const urlEncodedData = new URLSearchParams(formData);
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý...';
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: urlEncodedData,
            credentials: 'same-origin',
            redirect: 'follow'
        });
        const finalUrl = response.url;
        if (response.ok && finalUrl && finalUrl !== window.location.href) {
            if (!finalUrl.includes('/auth')) {
                window.location.href = finalUrl;
                return;
            }
        }
        if (finalUrl && finalUrl.includes('/auth')) {
            window.location.href = finalUrl;
        } else if (!response.ok) {
            window.location.href = `/auth?tab=${tabType}`;
        } else window.location.reload();
    } catch (error) {
        showToast('Có lỗi xảy ra: ' + (error.message || 'Unknown error'), 'danger');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function initializeCenterModal() {
    const backdrop = document.getElementById('center-modal-backdrop');
    const modal = document.getElementById('center-modal');
    const closeBtn = document.querySelector('.center-modal-close');
    if (!backdrop || !modal || !closeBtn) return;
    closeBtn.addEventListener('click', closeCenterModal);
    backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) closeCenterModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeCenterModal();
    });
}

function openCenterModal(html) {
    const backdrop = document.getElementById('center-modal-backdrop');
    const content = document.getElementById('center-modal-content');
    if (!backdrop || !content) return;
    content.innerHTML = html || '';
    backdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCenterModal() {
    const backdrop = document.getElementById('center-modal-backdrop');
    const content = document.getElementById('center-modal-content');
    if (!backdrop || !content) return;
    backdrop.style.display = 'none';
    content.innerHTML = '';
    document.body.style.overflow = '';
}

window.VoucherSystem = {
    showToast,
    copyToClipboard,
    fetchWithLoading,
    debounce
};
