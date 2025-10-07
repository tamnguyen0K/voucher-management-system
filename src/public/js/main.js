// Main JavaScript for Voucher Management System

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Form validation
    initializeFormValidation();

    // Rating stars functionality
    initializeRatingStars();

    // Voucher claim confirmation
    initializeVoucherClaim();

    // Search functionality
    initializeSearch();

    // Animation on scroll
    initializeScrollAnimations();
});

// Form Validation
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

// Rating Stars
function initializeRatingStars() {
    const ratingInputs = document.querySelectorAll('.rating-input');
    
    ratingInputs.forEach(function(ratingInput) {
        const stars = ratingInput.querySelectorAll('.star-rating');
        const hiddenInput = ratingInput.querySelector('input[type="hidden"]');
        
        stars.forEach(function(star, index) {
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

// Voucher Claim Confirmation
function initializeVoucherClaim() {
    const claimForms = document.querySelectorAll('form[action*="/claim"]');
    
    claimForms.forEach(function(form) {
        form.addEventListener('submit', function(event) {
            const voucherCode = form.closest('.card').querySelector('.badge').textContent.trim();
            
            if (!confirm(`Bạn có chắc muốn claim voucher ${voucherCode}?`)) {
                event.preventDefault();
                return false;
            }
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Đang xử lý...';
            submitBtn.disabled = true;
            
            // Reset button after 3 seconds if no redirect
            setTimeout(function() {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 3000);
        });
    });
}

// Search Functionality
function initializeSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(function(input) {
        input.addEventListener('input', debounce(function() {
            const searchTerm = this.value.toLowerCase();
            const targetSelector = this.dataset.target;
            const items = document.querySelectorAll(targetSelector);
            
            items.forEach(function(item) {
                const text = item.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        }, 300));
    });
}

// Scroll Animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    const animatedElements = document.querySelectorAll('.card, .hero-section');
    animatedElements.forEach(function(el) {
        observer.observe(el);
    });
}

// Utility Functions
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
    
    // Remove toast element after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
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
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// API Helper Functions
async function fetchWithLoading(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Có lỗi xảy ra khi tải dữ liệu', 'danger');
        throw error;
    }
}

// Copy to clipboard functionality
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
            showToast('Đã sao chép vào clipboard', 'success');
        }).catch(function(err) {
            console.error('Could not copy text: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
}

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
        console.error('Fallback: Could not copy text: ', err);
        showToast('Không thể sao chép', 'danger');
    }
    
    document.body.removeChild(textArea);
}

// Voucher code copy functionality
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('copy-voucher-code')) {
        const voucherCode = event.target.dataset.code;
        copyToClipboard(voucherCode);
    }
});

// Progress bar animation
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

// Initialize progress bar animation when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(animateProgressBars, 500);
});

// Export functions for global use
window.VoucherSystem = {
    showToast,
    copyToClipboard,
    fetchWithLoading,
    debounce
};
