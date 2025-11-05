/**
 * File: public/js/main.js
 * Mô tả: File JavaScript chính cho hệ thống quản lý voucher
 * Chức năng: Xử lý form validation, đánh giá sao, tìm kiếm, xác nhận, toast notification, modal, auth forms
 */

document.addEventListener('DOMContentLoaded', function() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));

    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => new bootstrap.Alert(alert).close());
    }, 5000);

    initializeFormValidation();
    initializeRatingStars();
    initializeVoucherClaim();
    initializeSearch();
    initializeScrollAnimations();
    initializeCenterModal();
    initializeLocationQuickView();
    initializeAuthForms();
    initializeConfirmations();
});

/**
 * Hàm: initializeFormValidation
 * Mô tả: Khởi tạo kiểm tra form hợp lệ (Bootstrap validation)
 */
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
}

/**
 * Hàm: initializeRatingStars
 * Mô tả: Khởi tạo hệ thống đánh giá sao (rating)
 */
function initializeRatingStars() {
    const ratingInputs = document.querySelectorAll('.rating-input');
    ratingInputs.forEach(ratingInput => {
        const stars = ratingInput.querySelectorAll('.star-rating');
        const hiddenInput = ratingInput.querySelector('input[type="hidden"]');
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                hiddenInput.value = rating;
                updateStarDisplay(stars, rating);
            });
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.dataset.rating);
                updateStarDisplay(stars, rating);
            });
        });
        ratingInput.addEventListener('mouseleave', function() {
            const currentRating = parseInt(hiddenInput.value) || 0;
            updateStarDisplay(stars, currentRating);
        });
    });
}

/**
 * Hàm: updateStarDisplay
 * Mô tả: Cập nhật hiển thị màu của sao (vàng = chọn, xám = chưa chọn)
 */
function updateStarDisplay(stars, rating) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('text-warning');
            star.classList.remove('text-muted');
        } else {
            star.classList.add('text-muted');
            star.classList.remove('text-warning');
        }
    });
}

/**
 * Hàm: initializeVoucherClaim
 * Mô tả: Xác nhận khi claim voucher
 */
function initializeVoucherClaim() {
    const claimForms = document.querySelectorAll('form[action*="/claim"]');
    claimForms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const voucherCode = form.closest('.card').querySelector('.badge').textContent.trim();
            if (!confirm(`Bạn có chắc muốn claim voucher ${voucherCode}?`)) {
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

/**
 * Hàm: initializeConfirmations
 * Mô tả: Xác nhận chung cho thêm/sửa/xóa (admin & owner)
 */
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

/**
 * Hàm: confirmWithCenterModal
 * Mô tả: Hiển thị modal xác nhận trung tâm
 */
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

/**
 * Hàm: initializeSearch
 * Mô tả: Chức năng tìm kiếm realtime (lọc danh sách theo input)
 */
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    searchInputs.forEach(input => {
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

/**
 * Hàm: initializeScrollAnimations
 * Mô tả: Hiệu ứng xuất hiện khi scroll
 */
function initializeScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('fade-in');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.card, .hero-section').forEach(el => observer.observe(el));
}

/**
 * Hàm: debounce
 * Mô tả: Hàm tiện ích debounce (chống spam sự kiện input)
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Hàm: showToast
 * Mô tả: Hiển thị toast notification (thông báo nổi Bootstrap)
 */
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

/**
 * Hàm: createToastContainer
 * Mô tả: Tạo container cho toast nếu chưa có
 */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

/**
 * Hàm: getToastIcon
 * Mô tả: Icon phù hợp theo loại thông báo
 */
function getToastIcon(type) {
    const icons = { success: 'check-circle', danger: 'exclamation-triangle', warning: 'exclamation-circle', info: 'info-circle' };
    return icons[type] || 'info-circle';
}

/**
 * Hàm: fetchWithLoading
 * Mô tả: Hàm hỗ trợ fetch API có hiển thị lỗi/toast
 */
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

/**
 * Hàm: copyToClipboard
 * Mô tả: Sao chép mã voucher vào clipboard
 */
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('Đã sao chép vào clipboard', 'success'))
            .catch(() => fallbackCopyTextToClipboard(text));
    } else fallbackCopyTextToClipboard(text);
}

/**
 * Hàm: fallbackCopyTextToClipboard
 * Mô tả: Dự phòng copy nếu trình duyệt cũ không hỗ trợ navigator.clipboard
 */
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

/**
 * Hàm: animateProgressBars
 * Mô tả: Hiệu ứng thanh tiến trình (progress bar)
 */
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.transition = 'width 1s ease-in-out';
            bar.style.width = width;
        }, 100);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(animateProgressBars, 500);
});

window.VoucherSystem = {
    showToast,
    copyToClipboard,
    fetchWithLoading,
    debounce
};

/**
 * Hàm: initializeAuthForms
 * Mô tả: Xử lý form đăng nhập/đăng ký với AJAX
 */
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

/**
 * Hàm: handleAuthFormSubmit
 * Mô tả: Xử lý submit form đăng nhập/đăng ký
 */
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

/**
 * Hàm: initializeCenterModal
 * Mô tả: Khởi tạo modal popup trung tâm (custom)
 */
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

/**
 * Hàm: openCenterModal
 * Mô tả: Mở modal trung tâm với nội dung HTML
 */
function openCenterModal(html) {
    const backdrop = document.getElementById('center-modal-backdrop');
    const content = document.getElementById('center-modal-content');
    if (!backdrop || !content) return;
    content.innerHTML = html || '';
    backdrop.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/**
 * Hàm: closeCenterModal
 * Mô tả: Đóng modal trung tâm
 */
function closeCenterModal() {
    const backdrop = document.getElementById('center-modal-backdrop');
    const content = document.getElementById('center-modal-content');
    if (!backdrop || !content) return;
    backdrop.style.display = 'none';
    content.innerHTML = '';
    document.body.style.overflow = '';
}

/**
 * Hàm: initializeLocationQuickView
 * Mô tả: Xem nhanh địa điểm (quick view)
 */
function initializeLocationQuickView() {
    document.addEventListener('click', async function(e) {
        const trigger = e.target.closest('[data-location-id][data-action="quick-view"]');
        if (!trigger) return;
        e.preventDefault();
        const id = trigger.getAttribute('data-location-id');
        if (!id) return;
        try {
            const data = await fetchWithLoading(`/locations/${id}/summary`);
            const html = renderLocationQuickView(data);
            openCenterModal(html);
        } catch {}
    });
}

/**
 * Hàm: renderLocationQuickView
 * Mô tả: Render HTML cho quick view địa điểm
 */
function renderLocationQuickView(data) {
    if (!data || !data.location) return '<div class="p-3">Không có dữ liệu</div>';
    const loc = data.location;
    const vouchers = data.vouchers || [];
    const reviews = data.reviews || [];
    const voucherList = vouchers.length ? vouchers.map(v => `
        <div class="d-flex align-items-center justify-content-between border rounded p-2 mb-2">
            <div><div class="fw-semibold text-success"><i class="fas fa-ticket-alt me-1"></i>${v.code || ''} - ${v.discountPct || 0}%</div>
            ${v.conditions ? `<div class="text-muted small">${v.conditions}</div>` : ''}</div>
            <a class="btn btn-sm btn-success" href="/vouchers">Dùng</a></div>`).join('') : '<div class="text-muted">Chưa có voucher hoạt động</div>';
    const reviewList = reviews.length ? reviews.map(r => `
        <div class="border-bottom py-2">
            <div class="small text-muted">${(r.user && r.user.username) || 'Ẩn danh'} • ${'★'.repeat(r.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (r.rating || 0)))}</div>
            <div>${r.comment || ''}</div></div>`).join('') : '<div class="text-muted">Chưa có đánh giá</div>';
    return `
        <div>
            <img src="${loc.imageUrl}" alt="${loc.name}" style="width:100%;height:180px;object-fit:cover;">
            <div class="p-3">
                <h5 class="mb-1">${loc.name}</h5>
                <div class="text-muted small mb-2"><i class="fas fa-map-marker-alt me-1"></i>${loc.address || ''}</div>
                <div class="mb-2"><span class="badge bg-secondary">${loc.type || ''}</span> 
                <span class="ms-2 text-warning">${data.averageRating || 0} ★ (${data.reviewCount || 0})</span></div>
                <div class="text-muted">${loc.description || ''}</div>
                <h6 class="mt-3">Voucher</h6>${voucherList}
                <h6 class="mt-3">Đánh giá gần đây</h6>${reviewList}
                <div class="button_popup mt-3 d-flex">
                    <button type="button" class="btn btn-outline-secondary flex-fill" onclick="(${closeCenterModal.toString()})()">Đóng</button>
                </div>
            </div>
        </div>`;
}
