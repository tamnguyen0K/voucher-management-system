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
