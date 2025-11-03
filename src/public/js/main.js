/* ========================================
   FILE JAVASCRIPT CHÍNH CHO HỆ THỐNG QUẢN LÝ VOUCHER
   File này chứa toàn bộ logic xử lý JavaScript cho frontend
   Bao gồm: validation form, rating, voucher claim, search, animation, toast, modal, v.v.
   ======================================== */

/* ========================================
   KHỞI TẠO KHI TRANG ĐƯỢC TẢI XONG
   Chạy các hàm setup khi DOM đã sẵn sàng
   ======================================== */
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo tooltip của Bootstrap - hiển thị gợi ý khi di chuột vào phần tử
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Khởi tạo popover - hộp thông tin nhỏ khi click vào phần tử
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Tự động ẩn thông báo alert sau 5 giây
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Gọi các hàm khởi tạo chức năng chính
    initializeFormValidation();      // Kiểm tra tính hợp lệ của form trước khi submit
    initializeRatingStars();         // Hệ thống đánh giá bằng sao
    initializeVoucherClaim();        // Xác nhận khi người dùng claim voucher
    initializeSearch();              // Tìm kiếm realtime để lọc danh sách
    initializeScrollAnimations();    // Hiệu ứng xuất hiện khi scroll trang
    initializeCenterModal();         // Modal popup hình vuông ở giữa màn hình
    initializeLocationQuickView();   // Xem nhanh thông tin địa điểm trong popup
    initializeAuthForms();           // Xử lý form đăng nhập/đăng ký bằng AJAX
});

/* ========================================
   KIỂM TRA TÍNH HỢP LỆ CỦA FORM
   Sử dụng Bootstrap validation để kiểm tra form trước khi submit
   ======================================== */
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            // Nếu form không hợp lệ, ngăn submit và hiển thị lỗi
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            // Thêm class để Bootstrap hiển thị thông báo lỗi
            form.classList.add('was-validated');
        }, false);
    });
}

/* ========================================
   HỆ THỐNG ĐÁNH GIÁ BẰNG SAO
   Cho phép người dùng click vào sao để đánh giá, có hiệu ứng hover
   ======================================== */
function initializeRatingStars() {
    const ratingInputs = document.querySelectorAll('.rating-input');
    
    ratingInputs.forEach(function(ratingInput) {
        const stars = ratingInput.querySelectorAll('.star-rating');
        const hiddenInput = ratingInput.querySelector('input[type="hidden"]');
        
        // Xử lý khi click vào sao để chọn điểm đánh giá
        stars.forEach(function(star) {
            star.addEventListener('click', function() {
                const rating = parseInt(this.dataset.rating);
                hiddenInput.value = rating;
                updateStarDisplay(stars, rating);
            });
            
            // Xử lý khi di chuột qua sao để preview điểm đánh giá
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.dataset.rating);
                updateStarDisplay(stars, rating);
            });
        });
        
        // Khi rời chuột khỏi vùng sao, hiển thị lại giá trị đã chọn
        ratingInput.addEventListener('mouseleave', function() {
            const currentRating = parseInt(hiddenInput.value) || 0;
            updateStarDisplay(stars, currentRating);
        });
    });
}

/* Cập nhật hiển thị màu của sao dựa trên điểm đánh giá
   Sao vàng = đã chọn, sao xám = chưa chọn */
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

/* ========================================
   XÁC NHẬN KHI CLAIM VOUCHER
   Hỏi xác nhận và hiển thị trạng thái đang xử lý khi claim voucher
   ======================================== */
function initializeVoucherClaim() {
    const claimForms = document.querySelectorAll('form[action*="/claim"]');
    
    claimForms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            // Lấy mã voucher từ thẻ card
            const voucherCode = form.closest('.card').querySelector('.badge').textContent.trim();
            
            // Hỏi xác nhận từ người dùng trước khi claim
            if (!confirm(`Bạn có chắc muốn claim voucher ${voucherCode}?`)) {
                event.preventDefault();
                return false;
            }
            
            // Hiển thị trạng thái "đang xử lý" trên nút submit
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Đang xử lý...';
            submitBtn.disabled = true;
            
            // Sau 3 giây nếu không redirect, reset lại nút về trạng thái ban đầu
            setTimeout(function() {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 3000);
        });
    });
}

/* ========================================
   TÌM KIẾM REALTIME
   Lọc danh sách theo từ khóa nhập vào, có debounce để tránh gọi quá nhiều lần
   ======================================== */
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(function(input) {
        // Sử dụng debounce để tránh gọi hàm quá nhiều lần khi gõ
        input.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase();
            const targetSelector = this.dataset.target;
            const items = document.querySelectorAll(targetSelector);
            
            // Hiển thị hoặc ẩn item dựa trên kết quả tìm kiếm
            items.forEach(function(item) {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }, 300));
    });
}

/* ========================================
   HIỆU ỨNG XUẤT HIỆN KHI SCROLL
   Thêm class fade-in khi phần tử xuất hiện trong viewport
   ======================================== */
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,  // Kích hoạt khi 10% phần tử xuất hiện
        rootMargin: '0px 0px -50px 0px'  // Offset để kích hoạt sớm hơn
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            // Khi phần tử xuất hiện trong viewport, thêm class hiệu ứng
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Quan sát các phần tử card và hero-section
    const animatedElements = document.querySelectorAll('.card, .hero-section');
    animatedElements.forEach(function(el) {
        observer.observe(el);
    });
}

/* ========================================
   HÀM TIỆN ÍCH: DEBOUNCE
   Trì hoãn việc thực thi hàm để tránh gọi quá nhiều lần trong thời gian ngắn
   Thường dùng cho input search để giảm số lần gọi API hoặc filter
   ======================================== */
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

/* ========================================
   THÔNG BÁO TOAST
   Hiển thị thông báo nổi ở góc trên bên phải màn hình
   ======================================== */
function showToast(message, type = 'info') {
    // Lấy hoặc tạo container cho toast
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    // Tạo element toast mới
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
    
    // Thêm toast vào container và hiển thị
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Xóa toast khỏi DOM sau khi ẩn đi
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

/* Tạo container cho toast nếu chưa tồn tại */
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

/* Trả về icon phù hợp theo loại thông báo */
function getToastIcon(type) {
    const icons = {
        'success': 'check-circle',      // Thành công
        'danger': 'exclamation-triangle',  // Lỗi
        'warning': 'exclamation-circle',   // Cảnh báo
        'info': 'info-circle'              // Thông tin
    };
    return icons[type] || 'info-circle';
}

/* ========================================
   HÀM HỖ TRỢ FETCH API
   Gọi API và tự động hiển thị lỗi bằng toast nếu có lỗi xảy ra
   ======================================== */
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

/* ========================================
   SAO CHÉP VÀO CLIPBOARD
   Copy mã voucher hoặc text vào clipboard của người dùng
   ======================================== */
function copyToClipboard(text) {
    // Sử dụng Clipboard API nếu trình duyệt hỗ trợ
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => showToast('Đã sao chép vào clipboard', 'success'))
            .catch(err => {
                console.error('Copy error:', err);
                // Fallback cho trình duyệt cũ
                fallbackCopyTextToClipboard(text);
            });
    } else {
        // Fallback cho trình duyệt không hỗ trợ Clipboard API
        fallbackCopyTextToClipboard(text);
    }
}

/* Phương pháp copy dự phòng cho trình duyệt cũ không hỗ trợ navigator.clipboard */
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

/* Xử lý khi click vào nút copy voucher code */
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('copy-voucher-code')) {
        const voucherCode = event.target.dataset.code;
        copyToClipboard(voucherCode);
    }
});

/* ========================================
   HIỆU ỨNG THANH TIẾN TRÌNH
   Animation cho progress bar khi trang được tải
   ======================================== */
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(function(bar) {
        // Lưu giá trị width ban đầu
        const width = bar.style.width;
        // Đặt về 0 để bắt đầu animation
        bar.style.width = '0%';
        // Sau 100ms, animate đến giá trị ban đầu
        setTimeout(function() {
            bar.style.transition = 'width 1s ease-in-out';
            bar.style.width = width;
        }, 100);
    });
}

// Gọi hiệu ứng khi trang load xong
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(animateProgressBars, 500);
});

/* ========================================
   XUẤT CÁC HÀM TIỆN ÍCH RA GLOBAL
   Cho phép các file JS khác sử dụng các hàm này
   ======================================== */
window.VoucherSystem = {
    showToast,
    copyToClipboard,
    fetchWithLoading,
    debounce
};

/* ========================================
   XỬ LÝ FORM ĐĂNG NHẬP VÀ ĐĂNG KÝ
   Sử dụng AJAX để submit form, tránh reload trang không cần thiết
   ======================================== */
function initializeAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Xử lý form đăng nhập
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleAuthFormSubmit(this, '/login', 'login');
        });
    }

    // Xử lý form đăng ký
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Kiểm tra mật khẩu xác nhận trước khi submit
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

/* Xử lý submit form đăng nhập/đăng ký bằng AJAX
   form: element form cần submit
   url: URL endpoint để gửi request
   tabType: loại tab (login hoặc register) để giữ tab khi có lỗi */
async function handleAuthFormSubmit(form, url, tabType) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const formData = new FormData(form);

    // Hiển thị trạng thái đang xử lý
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang xử lý...';

    try {
        // Gửi request với redirect tự động để browser xử lý redirect từ server
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        // Xử lý response sau khi submit
        if (response.ok) {
            const finalUrl = response.url;
            
            // Nếu đăng nhập thành công, server sẽ redirect đến dashboard hoặc trang chủ
            // Nếu có lỗi hoặc đăng ký, server sẽ redirect về /auth?tab=...
            if (finalUrl && finalUrl !== window.location.href) {
                window.location.href = finalUrl;
            } else {
                // Nếu URL không thay đổi, reload để cập nhật trạng thái
                window.location.href = `/auth?tab=${tabType}`;
            }
        } else {
            // Có lỗi, reload với tab tương ứng để hiển thị thông báo lỗi
            window.location.href = `/auth?tab=${tabType}`;
        }
    } catch (error) {
        console.error('Auth form error:', error);
        showToast('Có lỗi xảy ra khi xử lý yêu cầu', 'danger');
        // Khôi phục lại nút về trạng thái ban đầu
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/* ========================================
   MODAL POPUP TRUNG TÂM
   Cửa sổ popup hình vuông ở giữa màn hình với nền mờ
   ======================================== */
function initializeCenterModal() {
    const backdrop = document.getElementById('center-modal-backdrop');
    const modal = document.getElementById('center-modal');
    const closeBtn = document.querySelector('.center-modal-close');

    if (!backdrop || !modal || !closeBtn) return;

    // Đóng modal khi click nút đóng
    closeBtn.addEventListener('click', closeCenterModal);

    // Đóng modal khi click vào nền mờ
    backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) closeCenterModal();
    });

    // Đóng modal khi nhấn phím Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeCenterModal();
    });
}

/* Mở modal và hiển thị nội dung HTML */
function openCenterModal(html) {
    const backdrop = document.getElementById('center-modal-backdrop');
    const content = document.getElementById('center-modal-content');
    if (!backdrop || !content) return;
    content.innerHTML = html || '';
    backdrop.style.display = 'flex';
    // Ngăn scroll body khi modal mở
    document.body.style.overflow = 'hidden';
}

/* Đóng modal và xóa nội dung */
function closeCenterModal() {
    const backdrop = document.getElementById('center-modal-backdrop');
    const content = document.getElementById('center-modal-content');
    if (!backdrop || !content) return;
    backdrop.style.display = 'none';
    content.innerHTML = '';
    // Cho phép scroll body lại
    document.body.style.overflow = '';
}

/* ========================================
   XEM NHANH ĐỊA ĐIỂM
   Khi click vào nút "Xem địa điểm", hiển thị popup với thông tin địa điểm, voucher và reviews
   ======================================== */
function initializeLocationQuickView() {
    // Lắng nghe click event trên toàn bộ document
    document.addEventListener('click', async function(e) {
        // Tìm phần tử có thuộc tính data-location-id và data-action="quick-view"
        const trigger = e.target.closest('[data-location-id][data-action="quick-view"]');
        if (!trigger) return;
        
        e.preventDefault();
        const id = trigger.getAttribute('data-location-id');
        if (!id) return;
        
        try {
            // Gọi API để lấy thông tin tóm tắt địa điểm
            const data = await fetchWithLoading(`/locations/${id}/summary`);
            // Render HTML và hiển thị trong modal
            const html = renderLocationQuickView(data);
            openCenterModal(html);
        } catch (err) {
            // Lỗi đã được xử lý trong fetchWithLoading
        }
    });
}

/* Render HTML cho popup xem nhanh địa điểm
   data: object chứa thông tin location, vouchers, reviews */
function renderLocationQuickView(data) {
    if (!data || !data.location) return '<div class="p-3">Không có dữ liệu</div>';
    const loc = data.location;
    const vouchers = data.vouchers || [];
    const reviews = data.reviews || [];

    // Render danh sách voucher
    const voucherList = vouchers.length ? vouchers.map(v => `
        <div class="d-flex align-items-center justify-content-between border rounded p-2 mb-2">
            <div>
                <div class="fw-semibold text-success"><i class="fas fa-ticket-alt me-1"></i>${v.code || ''} - ${v.discountPct || 0}%</div>
                ${v.conditions ? `<div class="text-muted small">${v.conditions}</div>` : ''}
            </div>
            <a class="btn btn-sm btn-success" href="/vouchers">Dùng</a>
        </div>
    `).join('') : '<div class="text-muted">Chưa có voucher hoạt động</div>';

    // Render danh sách reviews
    const reviewList = reviews.length ? reviews.map(r => `
        <div class="border-bottom py-2">
            <div class="small text-muted">${(r.user && r.user.username) || 'Ẩn danh'} • ${'★'.repeat(r.rating || 0)}${'☆'.repeat(Math.max(0, 5 - (r.rating || 0)))}</div>
            <div>${r.comment || ''}</div>
        </div>
    `).join('') : '<div class="text-muted">Chưa có đánh giá</div>';

    // Trả về HTML đầy đủ của popup
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
