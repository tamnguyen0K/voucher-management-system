// ==========================
// Main JavaScript cho Hệ thống Quản lý Voucher
// Dùng để xử lý hiệu ứng, form, xác nhận, copy mã, tìm kiếm, animation, toast, v.v.
// ==========================

document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo tooltip của Bootstrap (hiện mô tả khi hover)
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Khởi tạo popover (hộp thông tin nhỏ khi click vào phần tử)
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Tự động ẩn alert (thông báo) sau 5 giây
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close(); // Đóng alert
        });
    }, 5000);

    // Gọi các hàm khởi tạo chính
    initializeFormValidation();   // Kiểm tra form trước khi submit
    initializeRatingStars();      // Hệ thống chấm sao
    initializeVoucherClaim();     // Xác nhận khi claim voucher
    initializeSearch();           // Tìm kiếm realtime
    initializeScrollAnimations(); // Hiệu ứng khi scroll trang
    initializeCenterModal();      // Modal popup trung tâm
    initializeLocationQuickView(); // Xem nhanh địa điểm
    initializeAuthForms();        // Xử lý form đăng nhập/đăng ký với AJAX
});

// ==========================
// Kiểm tra form hợp lệ (Bootstrap validation)
// ==========================
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
}

// ==========================
// Hệ thống đánh giá sao (rating)
// ==========================
function initializeRatingStars() {
    const ratingInputs = document.querySelectorAll('.rating-input');
    
    ratingInputs.forEach(function(ratingInput) {
        const stars = ratingInput.querySelectorAll('.star-rating');
        const hiddenInput = ratingInput.querySelector('input[type="hidden"]');
        
        // Khi click vào sao
        stars.forEach(function(star) {
            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                hiddenInput.value = rating;
                updateStarDisplay(stars, rating);
            });
            
            // Khi rê chuột qua sao
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.dataset.rating);
                updateStarDisplay(stars, rating);
            });
        });
        
        // Khi rời chuột khỏi vùng sao → hiển thị lại giá trị hiện tại
        ratingInput.addEventListener('mouseleave', function() {
            const currentRating = parseInt(hiddenInput.value) || 0;
            updateStarDisplay(stars, currentRating);
        });
    });
}

// Cập nhật hiển thị màu của sao (vàng = chọn, xám = chưa chọn)
function updateStarDisplay(stars, rating) {
    stars.forEach(function(star, index) {
        if (index < rating) {
            star.classList.add('text-warning');
            star.classList.remove('text-muted');
        } else {
            star.classList.add('text-muted');
            star.classList.remove('text-warning');
        }
    });
}

// ==========================
// Xác nhận khi claim voucher
// ==========================
function initializeVoucherClaim() {
    const claimForms = document.querySelectorAll('form[action*="/claim"]');
    
    claimForms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            const voucherCode = form.closest('.card').querySelector('.badge').textContent.trim();
            
            // Hỏi xác nhận người dùng
            if (!confirm(`Bạn có chắc muốn claim voucher ${voucherCode}?`)) {
                event.preventDefault();
                return false;
            }
            
            // Hiển thị trạng thái "đang xử lý"
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Đang xử lý...';
            submitBtn.disabled = true;
            
            // Sau 3s nếu không redirect → reset lại nút
            setTimeout(function() {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 3000);
        });
    });
}

// ==========================
// Chức năng tìm kiếm realtime (lọc danh sách theo input)
// ==========================
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(function(input) {
        input.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase();
            const targetSelector = this.dataset.target;
            const items = document.querySelectorAll(targetSelector);
            
            items.forEach(function(item) {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }, 300));
    });
}

// ==========================
// Hiệu ứng xuất hiện khi scroll
// ==========================
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in'); // Thêm class hiệu ứng
            }
        });
    }, observerOptions);
    
    const animatedElements = document.querySelectorAll('.card, .hero-section');
    animatedElements.forEach(function(el) {
        observer.observe(el);
    });
}

// ==========================
// Hàm tiện ích: debounce (chống spam sự kiện input)
// ==========================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = function() {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==========================
// Toast Notification (Thông báo nổi Bootstrap)
// ==========================
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${getToastIcon(type)} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Xóa toast khi ẩn
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Tạo container cho toast nếu chưa có
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Icon phù hợp theo loại thông báo
function getToastIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ==========================
// Hàm hỗ trợ fetch API có hiển thị lỗi/toast
// ==========================
async function fetchWithLoading(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
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

// ==========================
// Sao chép mã voucher vào clipboard
// ==========================
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('Đã sao chép vào clipboard', 'success'))
            .catch(err => {
                console.error('Copy error:', err);
                fallbackCopyTextToClipboard(text);
            });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

// Dự phòng copy nếu trình duyệt cũ không hỗ trợ navigator.clipboard
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Đã sao chép vào clipboard', 'success');
    } catch (err) {
        console.error('Fallback copy error:', err);
        showToast('Không thể sao chép', 'danger');
    }
    document.body.removeChild(textArea);
}

// Khi click vào nút copy voucher code
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('copy-voucher-code')) {
        const voucherCode = event.target.dataset.code;
        copyToClipboard(voucherCode);
    }
});

// ==========================
// Hiệu ứng thanh tiến trình (progress bar)
// ==========================
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(function(bar) {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(function() {
            bar.style.transition = 'width 1s ease-in-out';
            bar.style.width = width;
        }, 100);
    });
}

// Gọi hiệu ứng khi trang load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(animateProgressBars, 500);
});

// ==========================
// Xuất các hàm tiện ích ra global (window)
// ==========================
window.VoucherSystem = {
    showToast,
    copyToClipboard,
    fetchWithLoading,
    debounce
};

// ==========================
// Auth Forms (Login/Register with AJAX)
// ==========================
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
    
    // Convert FormData thành URLSearchParams để Express có thể parse
    // Vì Express urlencoded middleware chỉ parse application/x-www-form-urlencoded
    const formData = new FormData(form);
    const urlEncodedData = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
        urlEncodedData.append(key, value);
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý...';

    try {
        console.log('Submitting form to:', url);
        console.log('Form data:', Object.fromEntries(urlEncodedData));
        
        // Gửi request với Content-Type: application/x-www-form-urlencoded
        // để Express middleware có thể parse đúng
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: urlEncodedData,
            credentials: 'same-origin',
            redirect: 'follow' // Tự động follow redirect
        });

        console.log('Response status:', response.status);
        console.log('Response URL:', response.url);
        console.log('Response ok:', response.ok);

        // Sau khi fetch follow redirect, kiểm tra response.url
        const finalUrl = response.url;
        
        // Nếu đăng nhập thành công, server redirect đến dashboard/trang chủ
        // Kiểm tra xem URL cuối cùng có khác với trang hiện tại không
        if (response.ok && finalUrl && finalUrl !== window.location.href) {
            // Redirect đến URL mới (dashboard hoặc trang chủ)
            if (!finalUrl.includes('/auth')) {
                // Đăng nhập thành công, chuyển đến dashboard/trang chủ
                window.location.href = finalUrl;
                return;
            }
        }
        
        // Nếu URL cuối cùng là /auth (có lỗi hoặc đăng ký thành công)
        // hoặc status không OK, reload để hiển thị thông báo
        if (finalUrl && finalUrl.includes('/auth')) {
            window.location.href = finalUrl;
        } else if (!response.ok) {
            // Có lỗi, reload với tab tương ứng
            window.location.href = `/auth?tab=${tabType}`;
        } else {
            // Trường hợp khác, reload trang
            window.location.reload();
        }
    } catch (error) {
        console.error('Auth form error:', error);
        showToast('Có lỗi xảy ra khi xử lý yêu cầu: ' + (error.message || 'Unknown error'), 'danger');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ==========================
// Centered Modal (custom)
// ==========================
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

// ==========================
// Quick View for Locations
// ==========================
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
        } catch (err) {
            // error handled in fetchWithLoading
        }
    });
}

function renderLocationQuickView(data) {
    if (!data || !data.location) return '<div class="p-3">Không có dữ liệu</div>';
    const loc = data.location;
    const vouchers = data.vouchers || [];
    const reviews = data.reviews || [];

    const voucherList = vouchers.length ? vouchers.map(v => `
        <div class="d-flex align-items-center justify-content-between border rounded p-2 mb-2">
            <div>
                <div class="fw-semibold text-success"><i class="fas fa-ticket-alt me-1"></i>${v.code || ''} - ${v.discountPct || 0}%</div>
                ${v.conditions ? `<div class="text-muted small">${v.conditions}</div>` : ''}
            </div>
            <a class="btn btn-sm btn-success" href="/vouchers">Dùng</a>
        </div>
    `).join('') : '<div class="text-muted">Chưa có voucher hoạt động</div>';

    const reviewList = reviews.length ? reviews.map(r => `
        <div class="border-bottom py-2">
            <div class="small text-muted">${(r.user && r.user.username) || 'Ẩn danh'} • ${'★'.repeat(r.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (r.rating || 0)))}</div>
            <div>${r.comment || ''}</div>
        </div>
    `).join('') : '<div class="text-muted">Chưa có đánh giá</div>';

    return `
      <div>
        <img src="${loc.imageUrl}" alt="${loc.name}" style="width:100%;height:180px;object-fit:cover;">
        <div class="p-3">
          <h5 class="mb-1">${loc.name}</h5>
          <div class="text-muted small mb-2"><i class="fas fa-map-marker-alt me-1"></i>${loc.address || ''}</div>
          <div class="mb-2"><span class="badge bg-secondary">${loc.type || ''}</span> <span class="ms-2 text-warning">${data.averageRating || 0} ★ (${data.reviewCount || 0})</span></div>
          <div class="text-muted">${loc.description || ''}</div>

          <h6 class="mt-3">Voucher</h6>
          ${voucherList}

          <h6 class="mt-3">Đánh giá gần đây</h6>
          ${reviewList}

          <div class="button_popup mt-3 d-flex">
            <button type="button" class="btn btn-outline-secondary flex-fill" onclick="(${closeCenterModal.toString()})()">Đóng</button>
          </div>
        </div>
      </div>
    `;
}
