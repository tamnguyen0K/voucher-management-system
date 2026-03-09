# BÁO CÁO UI/UX AUDIT - PROJECT B

## 1. TỔNG QUAN KIẾN TRÚC UI

### Framework & Công nghệ
- **Template Engine**: EJS (Embedded JavaScript)
- **CSS Framework**: Bootstrap 5.3.0
- **JavaScript**: Vanilla JavaScript (ES6+)
- **Icons**: Font Awesome 6.0.0
- **Typography**: Google Fonts (Inter)
- **Charts**: Chart.js 4.4.1
- **QR Code**: qrcode.min.js library

### Cách tổ chức UI
- **Layout System**: Express EJS Layouts với `layout.ejs` làm base
- **Cấu trúc views**: 
  - `views/layout.ejs` - Layout chính
  - `views/pages/` - Trang công khai (home, locations, location_detail, voucher_list, profile, login_register, 404, error)
  - `views/admin/` - Trang admin (dashboard, manage_users, manage_location, manage_voucher, manage_review, review_detail)
  - `views/owner/` - Trang owner (dashboard, manage_location, manage_review, profile, review_detail)

### Hệ thống Style
- **File CSS chính**: `src/public/css/style.css`
- **Approach**: Custom CSS với CSS Variables (CSS Custom Properties)
- **Không sử dụng**: CSS Modules, SCSS, Styled Components, Tailwind
- **Pattern**: Global styles với một số utility classes và component classes

### Pattern Route/Role Guard
- **Middleware**: `requireAuth`, `requireAdmin`, `requireOwner`, `requireRole`
- **Route Protection**: 
  - Public routes: `/`, `/locations`, `/vouchers`, `/auth`
  - User routes: `/profile` (requireAuth)
  - Owner routes: `/owner/*` (requireAuth + requireRole('owner'))
  - Admin routes: `/admin/*` (requireAuth + requireAdmin)
- **Navigation**: Conditional rendering trong `layout.ejs` dựa trên `user.role`

---

## 2. ROLE MATRIX

### Roles được xác định

#### a) **Guest (Chưa đăng nhập)**
- `/` - Trang chủ
- `/locations` - Danh sách địa điểm
- `/locations/:id` - Chi tiết địa điểm
- `/vouchers` - Danh sách voucher
- `/auth` - Đăng nhập/Đăng ký

#### b) **User (Người dùng thường)**
- Tất cả routes của Guest
- `/profile` - Thông tin cá nhân
- `/locations/:locationId/reviews` (POST) - Tạo review
- `/vouchers/:voucherId/claim` (POST) - Claim voucher

#### c) **Owner (Chủ địa điểm)**
- Tất cả routes của User
- `/owner/dashboard` - Dashboard owner
- `/owner/profile` - Profile owner
- `/owner/locations` - Quản lý địa điểm
- `/owner/locations` (POST/PUT/DELETE) - CRUD địa điểm
- `/owner/vouchers` - Quản lý voucher
- `/owner/vouchers` (POST/PUT/DELETE) - CRUD voucher
- `/owner/reviews` - Xem đánh giá
- `/owner/reviews/:reviewId` - Chi tiết đánh giá

#### d) **Admin (Quản trị viên)**
- Tất cả routes của Owner
- `/admin/dashboard` - Dashboard admin
- `/admin/users` - Quản lý users
- `/admin/users/:id/role` (PUT) - Cập nhật role
- `/admin/users/:id` (DELETE) - Xóa user
- `/admin/locations` - Quản lý địa điểm (tất cả)
- `/admin/locations/:id` (DELETE) - Xóa địa điểm
- `/admin/vouchers` - Quản lý voucher (tất cả)
- `/admin/vouchers/:id` (DELETE) - Xóa voucher
- `/admin/reviews` - Quản lý reviews (tất cả)
- `/admin/reviews/:reviewId` - Chi tiết review
- `/admin/reviews/:reviewId` (DELETE) - Xóa review

---

## 3. PAGE CATALOG THEO ROLE

### 3.1. GUEST/USER PAGES

#### **Page: Trang chủ**
- **Route**: `/`
- **File**: `views/pages/home.ejs`

**a) Layout shell:**
- Header: Có (navbar với logo, menu: Trang chủ, Địa điểm, Voucher)
- Sidebar: Không
- Footer: Có (thông tin hệ thống, copyright)

**b) Cấu trúc vùng từ trên xuống:**
- **Section 1: Hero Section**
  - Mục đích: Banner chính với call-to-action
  - Thành phần: Tiêu đề lớn "Vi vu du lịch Việt Nam", mô tả, 2 nút (Khám phá địa điểm, Xem voucher)
  - Styling: Gradient background, rounded corners, shadow

- **Section 2: Địa điểm nổi bật**
  - Mục đích: Hiển thị 6 địa điểm mới nhất
  - Thành phần: Tiêu đề section, nút "Xem tất cả", grid cards (3 cột trên desktop)
  - Mỗi card: Hình ảnh (200px height), tên, mô tả (truncate 100 ký tự), badge type, rating stars, nút "Xem địa điểm"
  - Empty state: Icon, message "Chưa có địa điểm nào"

- **Section 3: Voucher đang hoạt động**
  - Mục đích: Hiển thị 6 voucher đang active
  - Thành phần: Tiêu đề section, nút "Xem tất cả", grid cards (3 cột)
  - Mỗi card: Header màu xanh với mã voucher và % giảm giá, hình ảnh location, tên location, điều kiện, progress bar (quantity claimed/total), nút "Claim ngay" hoặc "Đăng nhập để claim"
  - Empty state: Icon, message "Chưa có voucher nào"

- **Section 4: Features Section (Tại sao chọn chúng tôi)**
  - Mục đích: Marketing content
  - Thành phần: 3 columns với icon, tiêu đề, mô tả (Địa điểm đa dạng, Voucher hấp dẫn, Đánh giá thực tế)

**c) UI Components:**
- Bootstrap cards
- Rating component (star icons)
- Progress bar
- Badge component
- Custom hero-section class

**d) Controls:**
- Nút "Khám phá địa điểm": Link đến `/locations`
- Nút "Xem voucher": Link đến `/vouchers`
- Nút "Xem tất cả" (địa điểm): Link đến `/locations`
- Nút "Xem tất cả" (voucher): Link đến `/vouchers`
- Nút "Xem địa điểm": Link đến `/locations/:id`
- Form "Claim ngay": POST `/vouchers/:id/claim` (chỉ khi đã login)
- Link "Đăng nhập để claim": Link đến `/auth`

**e) Data display:**
- Cards grid layout
- Không có pagination (giới hạn 6 items)
- Không có sort/filter trên trang này
- Images: object-fit cover, height 200px

**f) States:**
- Loading: Không có (server-side render)
- Empty: Icon + message + link "Quay lại sau"
- Error: Không có error handling riêng (dùng global error handler)

**g) Responsive:**
- Breakpoints: Bootstrap default (576px, 768px, 992px, 1200px)
- Mobile: Cards stack thành 1 cột
- Tablet: Cards hiển thị 2 cột
- Desktop: Cards hiển thị 3 cột

**h) Interactions:**
- Hover: Cards có transform translateY(-5px) và shadow tăng
- Floating chat widget: Button bottom-right, có thể toggle
- Alert messages: Flash messages từ server (auto dismiss sau 5s)

---

#### **Page: Đăng nhập/Đăng ký**
- **Route**: `/auth`
- **File**: `views/pages/login_register.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Card Container**
  - Mục đích: Form đăng nhập và đăng ký
  - Thành phần: Card với header gradient, tabs (Bootstrap nav-tabs), tab content

- **Tab 1: Đăng nhập**
  - Form fields: Email (input type="email"), Password (input type="password")
  - Nút: "Đăng nhập" (btn-primary, full width)
  - Action: POST `/login`

- **Tab 2: Đăng ký**
  - Form fields: 
    - Username (pattern: [A-Za-z0-9_]{4,20})
    - Role dropdown (user/owner)
    - Phone number (pattern: [0-9]{9,11})
    - Email
    - Password (minlength: 6)
    - Confirm password
  - Nút: "Đăng ký" (btn-success, full width)
  - Action: POST `/register`

**c) UI Components:**
- Bootstrap tabs
- Bootstrap form controls
- Bootstrap validation classes

**d) Controls:**
- Tab switching: Bootstrap JavaScript
- Form submit: Prevent default, AJAX submit (từ main.js)
- Redirect: Sau khi login/register thành công

**e) States:**
- Validation: HTML5 validation + custom JavaScript
- Loading: Spinner trên submit button
- Error: Flash messages từ server

**f) Responsive:**
- Card width: col-md-8 col-lg-6 (centered)
- Form fields: Full width trên mobile

---

#### **Page: Danh sách Địa điểm**
- **Route**: `/locations`
- **File**: `views/pages/locations.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header với Filter Toggle**
  - Tiêu đề: "Danh sách Địa điểm"
  - Nút: "Hiển thị/Ẩn bộ lọc" (toggle filter visibility)

- **Section 2: Filter Group (collapse)**
  - Mục đích: Lọc theo type
  - Thành phần: Button group (Tất cả, Nhà hàng, Cafe, Du lịch)
  - Behavior: URL query params (?type=restaurant), active state với btn-primary

- **Section 3: Locations Grid**
  - Layout: Bootstrap grid (col-md-6 col-lg-4)
  - Mỗi card: Image, tên, mô tả (100 ký tự), badge type, rating, địa chỉ (50 ký tự), nút "Xem địa điểm"
  - Empty state: Icon, message, nút "Về trang chủ"

**c) UI Components:**
- Bootstrap cards
- Bootstrap button group
- Custom collapse-filter class (CSS animation)

**d) Controls:**
- Filter buttons: Link với query params
- Toggle filter: JavaScript toggle class "show"
- Card click: Link đến `/locations/:id`

**e) Data display:**
- Grid layout
- Không có pagination
- Không có sort
- Filter: Query param ?type=

**f) States:**
- Empty: Icon + message + link
- Filter visibility: Animated collapse

**g) Responsive:**
- Mobile: 1 cột
- Tablet: 2 cột
- Desktop: 3 cột
- Filter buttons: Wrap trên mobile (< 576px)

---

#### **Page: Chi tiết Địa điểm**
- **Route**: `/locations/:id`
- **File**: `views/pages/location_detail.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không (nhưng có sidebar content bên phải)
- Footer: Có

**b) Cấu trúc vùng:**
- **Row Layout: 2 columns (8-4)**
  
- **Column 1 (Left - 8 cols):**
  - **Section 1: Location Hero Card**
    - Image: 300px height, object-fit cover
    - Owner chip: Floating button (bottom-right trên image) - click mở modal owner info
    - Card body: Tên địa điểm, rating stars + average rating + review count, badge type, mô tả đầy đủ, địa chỉ

  - **Section 2: Reviews Section**
    - Header: "Đánh giá (count)", nút "Viết đánh giá" (chỉ user role)
    - Reviews list: Mỗi review có username, rating stars, timestamp, comment, media grid (images/videos)
    - Media: Thumbnail grid (110x80px cho images, 160px width cho videos)
    - Empty state: Icon, message

- **Column 2 (Right - 4 cols):**
  - **Section 1: Voucher khả dụng Card**
    - Header: "Voucher khả dụng"
    - Voucher items: Mỗi item có code, discount %, conditions, progress bar, expiry date, nút "Claim voucher"
    - Empty state: Icon, message

  - **Section 2: Navigation Links**
    - Nút "Quay lại danh sách"
    - Nút "Xem tất cả voucher"

- **Modal: Review Form** (chỉ user)
  - Rating stars: Interactive (click, hover)
  - Comment: Textarea (required)
  - Media files: File input (required, multiple, max 5 files, 15MB each)
  - Submit: POST `/locations/:locationId/reviews`

- **Modal: Owner Profile**
  - Hiển thị: Username, email

**c) UI Components:**
- Custom location-hero-card
- Owner chip (floating absolute position)
- Rating component (interactive stars)
- Review media grid (flex layout)
- Bootstrap modals

**d) Controls:**
- Rating stars: Click để chọn rating (1-5), hover preview
- Review form submit: POST với multipart/form-data
- Claim voucher: Form POST `/vouchers/:id/claim`
- Owner chip click: Mở modal
- Media thumbnail click: Mở image trong tab mới

**e) Data display:**
- Reviews: List layout, không pagination
- Media: Grid layout với thumbnails
- Vouchers: List trong sidebar

**f) States:**
- Loading: Alert hiển thị số lần review còn lại khi page load (JavaScript fetch)
- Empty reviews: Icon + message
- Empty vouchers: Icon + message

**g) Responsive:**
- Desktop: 2 columns (8-4)
- Tablet/Mobile: Stack thành 1 column (col-lg-8 → full width)

**h) Interactions:**
- Rating stars: Hover effect (scale 1.1), click to select
- Review form: Real-time validation
- Alert on load: Fetch API để kiểm tra remaining reviews
- Media grid: Click image mở tab mới

---

#### **Page: Danh sách Voucher**
- **Route**: `/vouchers`
- **File**: `views/pages/voucher_list.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Danh sách Voucher"
  - Badge: Số lượng voucher đang hoạt động

- **Section 2: Vouchers Grid**
  - Layout: Grid (col-md-6 col-lg-4)
  - Mỗi card: Header xanh với code + discount %, image location (120px height), tên location, badge type, conditions, progress bar (claimed/total với số liệu), dates (start/end), nút "Claim ngay" hoặc "Đăng nhập để claim", nút "Xem địa điểm"

- **Section 3: Tips Section**
  - Mục đích: Hướng dẫn sử dụng voucher
  - Layout: 3 columns với icon, tiêu đề, mô tả

**c) UI Components:**
- Bootstrap cards với border-success
- Progress bar
- Badge components

**d) Controls:**
- Claim voucher: Form POST `/vouchers/:id/claim`
- View location: Link đến `/locations/:id`
- Login to claim: Link đến `/auth`

**e) Data display:**
- Grid layout
- Không pagination
- Không sort/filter (chỉ hiển thị active vouchers từ server)

**f) States:**
- Empty: Card với icon, message, 2 nút (Khám phá địa điểm, Về trang chủ)

**g) Responsive:**
- Grid: 1 cột (mobile), 2 cột (tablet), 3 cột (desktop)

---

#### **Page: Profile (User)**
- **Route**: `/profile`
- **File**: `views/pages/profile.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không (nhưng có sidebar content bên trái)
- Footer: Có

**b) Cấu trúc vùng:**
- **Row Layout: 2 columns (4-8)**

- **Column 1 (Left - 4 cols):**
  - **Section 1: Profile Card**
    - Avatar: Icon (fa-user-circle, 4x size)
    - Username
    - Email
    - Badge role

  - **Section 2: Quick Actions Card**
    - Nút: "Khám phá địa điểm", "Xem voucher"
    - Conditional: Nếu role owner/admin → thêm nút dashboard tương ứng

- **Column 2 (Right - 8 cols):**
  - **Section 1: Reviews của tôi**
    - Header: "Đánh giá của tôi (count)"
    - Reviews list: Location name (link), rating, comment, media grid, timestamp, nút Edit (modal), nút Delete (form với confirmation)
    - Empty state: Icon, message, nút "Khám phá ngay"

  - **Section 2: Voucher đã claim**
    - Header: "Voucher đã claim (count)"
    - Voucher items: Code, location name, discount %, expiry date, nút QR code
    - Empty state: Icon, message, nút "Xem voucher"

- **Modals: Edit Review** (dynamic cho mỗi review)
  - Rating stars (pre-filled)
  - Comment textarea (pre-filled)
  - Existing media: Grid hiển thị
  - Add media: File input (optional)
  - Submit: PUT `/reviews/:id`

**c) UI Components:**
- Bootstrap cards
- Rating component
- Review media grid
- Bootstrap modals
- QR code modal (center-modal)

**d) Controls:**
- Edit review: Mở modal với pre-filled data
- Delete review: Form DELETE với confirmation
- Show QR code: Click nút → mở center-modal với QR code generated

**e) Data display:**
- Reviews: List layout
- Vouchers: List layout
- Media: Grid thumbnails

**f) States:**
- Empty reviews: Icon + message + CTA
- Empty vouchers: Icon + message + CTA

**g) Responsive:**
- Desktop: 2 columns (4-8)
- Mobile: Stack thành 1 column

**h) Interactions:**
- QR code: Generated bằng QRCode library
- Edit modal: Pre-filled form, có thể thêm media mới
- Delete: Confirmation dialog

---

#### **Page: 404 Not Found**
- **Route**: `/404` (catch-all)
- **File**: `views/pages/404.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc:**
- Centered container
- Display-1: "404"
- Heading: "Trang không tìm thấy"
- Message: Mô tả lỗi
- Nút: "Về trang chủ", "Quay lại" (history.back())

---

#### **Page: Error**
- **Route**: Error handler
- **File**: `views/pages/error.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc:**
- Centered container
- Icon: Warning triangle (fa-4x)
- Heading: "Lỗi hệ thống"
- Message: Mô tả lỗi
- Error details: Hiển thị error.message (chỉ development mode)
- Nút: "Về trang chủ", "Quay lại"

---

### 3.2. ADMIN PAGES

#### **Page: Admin Dashboard**
- **Route**: `/admin/dashboard`
- **File**: `views/admin/dashboard.ejs`

**a) Layout shell:**
- Header: Có (navbar với dropdown Admin menu)
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Admin Dashboard"
  - Date: Ngày hiện tại

- **Section 2: Stats Cards (4 cards)**
  - Card 1: Total Users (bg-primary, icon users)
  - Card 2: Total Locations (bg-success, icon map-marker)
  - Card 3: Total Vouchers (bg-warning, icon percent)
  - Card 4: Total Reviews (bg-info, icon star)

- **Section 3: Stats & Quick Actions Row**
  - Left (6 cols): Voucher Stats Card (Active vs Expired, 2 columns)
  - Right (6 cols): Quick Actions Card (4 nút links: Users, Địa điểm, Voucher, Reviews)

- **Section 4: Growth Charts Row**
  - Left (6 cols): User Growth Chart (Chart.js line chart, 6 months)
  - Right (6 cols): Location Growth Chart (Chart.js bar chart, 6 months)

- **Section 5: Recent Items Row (3 columns)**
  - Left (4 cols): Recent Users Card (list 5 users mới nhất: username, email, role badge)
  - Center (4 cols): Recent Locations Card (list 5 locations: name, owner, type badge)
  - Right (4 cols): Recent Vouchers Card (list 5 vouchers: code, location, discount badge)

**c) UI Components:**
- Bootstrap cards với colored backgrounds
- Chart.js charts (line và bar)
- Badge components
- Bootstrap list groups

**d) Controls:**
- Quick action buttons: Links đến các trang quản lý tương ứng
- Charts: Static (không có interaction)

**e) Data display:**
- Stats: Numbers lớn
- Charts: Line chart (users), Bar chart (locations)
- Lists: Vertical list layout, không pagination

**f) States:**
- Empty lists: "Chưa có ... nào" (text-muted)

**g) Responsive:**
- Stats cards: 4 cột → 2 cột (tablet) → 1 cột (mobile)
- Charts: Stack trên mobile

**h) Interactions:**
- Charts: Chart.js với responsive options
- Hover: Card hover effects

---

#### **Page: Quản lý Users**
- **Route**: `/admin/users`
- **File**: `views/admin/manage_users.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Quản lý Người dùng"
  - Nút: "Quay lại Dashboard"

- **Section 2: Filter & Search**
  - Search input: Text input (placeholder: "Tìm kiếm theo email, username...")
  - Role filter: Dropdown (Tất cả, User, Owner, Admin)
  - Filter button: "Lọc"

- **Section 3: Users Table**
  - Table columns: Username, Email, Số điện thoại, Vai trò (dropdown select), Ngày tạo, Thao tác
  - Role dropdown: Inline select (form-select-sm), change event → AJAX PUT `/admin/users/:id/role`
  - Delete button: AJAX DELETE `/admin/users/:id` (disabled cho chính mình)

**c) UI Components:**
- Bootstrap table
- Bootstrap form controls
- Badge components

**d) Controls:**
- Search: Client-side filter (JavaScript, real-time)
- Role filter: Client-side filter (JavaScript)
- Role change: AJAX PUT với confirmation
- Delete: AJAX DELETE với confirmation
- Filter button: Trigger filter function

**e) Data display:**
- Table layout
- Không pagination
- Client-side search/filter

**f) States:**
- Loading: Toast notification sau AJAX
- Success: Toast "Cập nhật/Xóa thành công"
- Error: Toast error message
- Empty: Icon + message

**g) Responsive:**
- Table: Table-responsive wrapper (scroll horizontal trên mobile)

**h) Interactions:**
- Real-time search/filter: Debounced search (từ main.js pattern)
- AJAX operations: Fetch API
- Toast notifications: Custom toast function

---

#### **Page: Quản lý Địa điểm (Admin)**
- **Route**: `/admin/locations`
- **File**: `views/admin/manage_location.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Quản lý Địa điểm"
  - Nút: "Quay lại Dashboard"

- **Section 2: Locations Table**
  - Columns: Hình ảnh (60x40px thumbnail), Tên địa điểm (name + description truncated), Chủ sở hữu (username + email), Loại (badge), Đánh giá (stars + number), Địa chỉ (truncated 30 chars), Ngày tạo, Thao tác (View, Delete)
  - View button: Link đến `/locations/:id`
  - Delete button: Form DELETE với confirmation

**c) UI Components:**
- Bootstrap table
- Image thumbnails
- Rating stars
- Badge components

**d) Controls:**
- View: Link navigation
- Delete: Form submit với confirmation message

**e) Data display:**
- Table layout
- Không pagination
- Không sort/filter

**f) States:**
- Empty: Icon + message

**g) Responsive:**
- Table: Scroll horizontal trên mobile

---

#### **Page: Quản lý Voucher (Admin)**
- **Route**: `/admin/vouchers`
- **File**: `views/admin/manage_voucher.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Quản lý Voucher"
  - Nút: "Quay lại Dashboard"

- **Section 2: Vouchers Table**
  - Columns: Mã voucher (badge), Địa điểm (image thumbnail + name + type), Giảm giá (badge), Số lượng (progress bar inline), Trạng thái (badge: Hoạt động/Hết hạn/Hết số lượng/Sắp diễn ra), Hạn sử dụng (date), Thao tác (Delete only - không có Edit)
  - Status logic: Tính toán từ endDate, quantityClaimed vs quantityTotal, startDate

**c) UI Components:**
- Bootstrap table
- Progress bar (inline trong cell)
- Badge components
- Image thumbnails

**d) Controls:**
- Delete: Form DELETE với confirmation

**e) Data display:**
- Table layout
- Progress bar hiển thị claimed/total
- Status badges với màu khác nhau

**f) States:**
- Empty: Icon + message

**g) Responsive:**
- Table: Scroll horizontal

---

#### **Page: Quản lý Reviews (Admin)**
- **Route**: `/admin/reviews`
- **File**: `views/admin/manage_review.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Quản lý Đánh giá"
  - Nút: "Quay lại Dashboard"

- **Section 2: Reviews Table**
  - Columns: Người đánh giá (username + email), Địa điểm (name), Đánh giá (stars + number), Nhận xét (truncated 100 chars), Ngày tạo, Thao tác (Chi tiết, Xóa)
  - Detail button: Link đến `/admin/reviews/:reviewId`
  - Delete button: Form DELETE với confirmation

**c) UI Components:**
- Bootstrap table
- Rating stars
- Badge components

**d) Controls:**
- View detail: Link navigation
- Delete: Form submit

**e) Data display:**
- Table layout
- Comment truncated với "..."

**f) States:**
- Empty: Icon + message

---

#### **Page: Review Detail (Admin)**
- **Route**: `/admin/reviews/:reviewId`
- **File**: `views/admin/review_detail.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Chi tiết đánh giá"
  - Nút: "Quay lại danh sách"

- **Section 2: Review Info Card**
  - Layout: Row (8-4)
  - Left: Location name, rating stars, comment, timestamp
  - Right: User info (username, email) trong border card

- **Section 3: Media Card**
  - Header: "Ảnh/Video trong đánh giá (count)"
  - Media grid: Images (150x110px thumbnails, click mở tab mới), Videos (260px width)
  - Empty: Icon + message

- **Note**: Không có delete button trên trang này (chỉ có trên list page)

**c) UI Components:**
- Bootstrap cards
- Media grid (flex layout)
- Rating stars

**d) Controls:**
- Media click: Mở image trong tab mới (target="_blank")

**e) Data display:**
- Media: Grid layout với thumbnails

**f) States:**
- Empty media: Icon + message

---

### 3.3. OWNER PAGES

#### **Page: Owner Dashboard**
- **Route**: `/owner/dashboard`
- **File**: `views/owner/dashboard.ejs`

**a) Layout shell:**
- Header: Có (navbar với dropdown Owner menu - không có main nav links)
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Owner Dashboard"
  - Date: Ngày hiện tại

- **Section 2: Recent Reviews Card (Full width)**
  - Header: "Đánh giá mới nhất" + nút "Xem toàn bộ"
  - List: List-group với mỗi item có username, location name, comment, rating badge, timestamp, nút "Xem chi tiết"
  - Empty: Message khuyến khích

- **Section 3: Stats Cards (4 cards)**
  - Total Locations (bg-primary)
  - Total Vouchers (bg-success)
  - Active Vouchers (bg-warning)
  - Total Claims (bg-info)

- **Section 4: Quick Actions & Stats Row**
  - Left (6 cols): Quick Actions Card (4 nút: Quản lý địa điểm, Quản lý voucher, Xem đánh giá, Tạo địa điểm mới - modal trigger)
  - Right (6 cols): Quick Stats Card (Active vouchers, Total claims)

- **Section 5: My Locations Table (Full width)**
  - Header: "Địa điểm của tôi" + "Xem tất cả"
  - Table: Name, Type, Rating, Address (truncated), Actions (View)
  - Empty: Icon + message + nút "Tạo địa điểm" (modal trigger)

- **Section 6: Recent Vouchers Table (Full width)**
  - Header: "Voucher gần đây" + "Xem tất cả"
  - Table: Code, Location, Discount, Quantity (progress bar), Status, Actions (Edit link)
  - Empty: Icon + message + nút "Tạo voucher"

- **Modal: Create Location**
  - Form fields: Name, Type, Address, Description, Image URL
  - Submit: POST `/owner/locations`

**c) UI Components:**
- Bootstrap cards
- Bootstrap tables
- Bootstrap modals
- Progress bars
- List groups

**d) Controls:**
- Quick action buttons: Links hoặc modal triggers
- Create location: Modal form
- View links: Navigation

**e) Data display:**
- Tables: Vertical layout
- Lists: List-group layout

**f) States:**
- Empty states: Icon + message + CTA

**g) Responsive:**
- Stats: 4 → 2 → 1 columns
- Tables: Scroll horizontal

---

#### **Page: Quản lý Địa điểm (Owner)**
- **Route**: `/owner/locations`
- **File**: `views/owner/manage_location.ejs`

**a) Layout shell:**
- Header: Có (owner navbar)
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Quản lý Địa điểm"
  - Nút: "Tạo địa điểm mới" (modal trigger)

- **Section 2: Locations Table**
  - Columns: Hình ảnh, Tên (name + description truncated), Loại, Đánh giá, Địa chỉ, Ngày tạo, Thao tác (View, Edit, Delete)
  - View: Link `/locations/:id`
  - Edit: Modal trigger
  - Delete: Form DELETE với confirmation

- **Modal: Create Location**
  - Form fields:
    - Name, Type (dropdown: restaurant/cafe/tourist_spot)
    - City (text input)
    - Price Level (dropdown: budget/standard/premium)
    - Price Min/Max (number inputs)
    - Address
    - Description (textarea, minlength 80)
    - Features (checkboxes grid, min 2 selected) - 8 options với hints
    - Menu Highlights (textarea, comma-separated)
    - Image Picker Component:
      - Tabs: "Thêm URL", "Tải từ máy", "Kéo & Thả"
      - URL tab: Input + "Thêm" button, list URLs với remove
      - Upload tab: File input (multiple, image/*)
      - Drop zone: Drag & drop area với visual feedback
      - Summary: Hiển thị số lượng URLs và files
      - Primary image: Hidden input (lấy URL đầu tiên)
  - Submit: POST `/owner/locations` (multipart/form-data)

- **Modal: Edit Location** (dynamic cho mỗi location)
  - Tương tự Create nhưng pre-filled
  - Method: PUT `/owner/locations/:id`
  - Image picker: Load existing images từ `data-initial-urls`

**c) UI Components:**
- Bootstrap modals (modal-lg)
- Custom image picker component (JavaScript)
- Bootstrap form controls
- Feature checkboxes grid

**d) Controls:**
- Image picker:
  - URL input: Add/remove URLs
  - File input: Multiple file selection
  - Drag & drop: Visual feedback (border color change, background color)
  - Summary update: Real-time
- Form submit: Multipart với imageFiles và imageUrls[]

**e) Data display:**
- Table layout
- Image picker: Dynamic URL list, file list display

**f) States:**
- Empty: Icon + message + create button
- Image picker: "Chưa chọn ảnh nào" → "Đã thêm X URL và Y tệp"

**g) Responsive:**
- Modal: Full width trên mobile
- Feature checkboxes: 2 columns → 1 column trên mobile

**h) Interactions:**
- Drag & drop: Visual feedback
- Image picker: Complex JavaScript logic trong main.js pattern (nhưng code trong EJS file)

---

#### **Page: Quản lý Reviews (Owner)**
- **Route**: `/owner/reviews`
- **File**: `views/owner/manage_review.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không
- Footer: Có

**b) Cấu trúc vùng:**
- **Section 1: Header**
  - Tiêu đề: "Đánh giá địa điểm của tôi"
  - Nút: "Quay lại Dashboard"

- **Section 2: Reviews Table**
  - Columns: Địa điểm, Người đánh giá (username + email), Đánh giá (stars), Nhận xét (truncated 80 chars), Ngày tạo, Thao tác (Chi tiết)
  - Detail button: Link đến `/locations/:locationId#review-:reviewId` (anchor link)

**c) UI Components:**
- Bootstrap table
- Rating stars

**d) Controls:**
- View detail: Link với anchor (#review-id)

**e) Data display:**
- Table layout

**f) States:**
- Empty: Icon + message

---

#### **Page: Review Detail (Owner)**
- **Route**: `/owner/reviews/:reviewId`
- **File**: `views/owner/review_detail.ejs`

**a) Cấu trúc:**
- Tương tự Admin Review Detail nhưng không có delete button

---

#### **Page: Profile (Owner)**
- **Route**: `/owner/profile`
- **File**: `views/owner/profile.ejs`

**a) Layout shell:**
- Header: Có
- Sidebar: Không (nhưng có sidebar content)
- Footer: Có

**b) Cấu trúc vùng:**
- **Row Layout: 2 columns (4-8)**

- **Column 1 (Left):**
  - Profile Card: Avatar (fa-store icon), Username, Email, Phone, Role badge (Chủ quán)
  - Management Card: 3 nút (Quản lý địa điểm, Quản lý voucher, Dashboard)

- **Column 2 (Right):**
  - My Locations Card: Table (Name, Type, Rating, Actions), hiển thị 5 items đầu, "Xem tất cả" nếu > 5
  - My Vouchers Card: Table (Code, Location, Discount, Quantity progress, Status, Actions), hiển thị 5 items đầu, "Xem tất cả" nếu > 5

**c) UI Components:**
- Bootstrap cards
- Bootstrap tables
- Progress bars

**d) Controls:**
- View all links: Navigation
- View buttons: Links

**e) Data display:**
- Tables với pagination limit (slice 5 items)

**f) States:**
- Empty: Icon + message + CTA

---

### 3.4. SHARED COMPONENTS

#### **Layout Component**
- **File**: `views/layout.ejs`

**a) Cấu trúc:**
- **Header (Navbar):**
  - Brand: Logo "VivuDulich" (link về "/" nếu không phải owner)
  - Main Nav (ẩn nếu owner): Trang chủ, Địa điểm, Voucher
  - User Nav:
    - Guest: "Đăng nhập" link
    - User: Dropdown "User" → Profile, Logout button
    - Owner: Dropdown "Owner" → Profile, Dashboard, Locations, Vouchers, Reviews, Logout
    - Admin: Dropdown "Admin" → Dashboard, Users, Locations, Vouchers, Reviews, Logout
  - Toggler: Hamburger menu (ẩn nếu owner)

- **Flash Messages:**
  - Error alert: Red gradient, dismissible, auto-close sau 5s
  - Success alert: Green gradient, dismissible, auto-close sau 5s

- **Main Content:**
  - Container với `<%- body %>`

- **Footer:**
  - Dark background
  - 2 columns: Left (system info), Right (copyright)

- **Floating Chat Widget:**
  - Button: Fixed bottom-right (56x56px circle, gradient background)
  - Panel: Fixed bottom-right (420px width, 60vh max-height), hidden by default
  - Header: "Chatbot" (purple background #7D5FFF)
  - Body: Scrollable chat messages
  - Scroll button: Fixed bottom-right (hiện khi không ở bottom)
  - Form: Input + send button
  - Messages: Bot (left, gray background) vs User (right, purple background)
  - Chat history: Load từ localStorage (10 messages)

- **Center Modal:**
  - Backdrop: Fixed fullscreen, blur background
  - Modal: Centered, max-width 90vw, max-height 90vh, rounded
  - Close button: Top-right (×)
  - Content area: Dynamic HTML

**b) Interactions:**
- Chat widget: Toggle visibility, scroll to bottom, send message (AJAX POST `/api/chatbot/query`)
- Center modal: Open/close với backdrop click hoặc Escape key
- Flash messages: Auto-dismiss với Bootstrap Alert

---

## 4. DESIGN TOKENS

### Màu sắc (CSS Variables)
- **Primary**: `#2563eb` (Blue)
- **Primary Dark**: `#1d4ed8`
- **Secondary**: `#6c757d` (Gray)
- **Success**: `#10b981` (Green)
- **Danger**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Orange)
- **Info**: `#06b6d4` (Cyan)
- **Light**: `#f8fafc`
- **Dark**: `#1e293b`
- **Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` (Purple gradient)
- **Chat Purple**: `#7D5FFF`

### Typography
- **Font Family**: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Font Sizes**: Bootstrap default (base: 1rem)
- **Font Weights**: 300, 400, 500, 600, 700, 800 (từ Google Fonts)
- **Hero Heading**: 3rem (desktop), 2.5rem (tablet), 2rem (mobile)
- **Card Title**: Default h5/h6

### Spacing
- **Border Radius**: `12px` (--radius)
- **Card Padding**: Bootstrap default (card-body: 1rem, modal-body: 24px)
- **Section Margin**: `mb-5` (3rem), `mb-4` (1.5rem)
- **Gap**: Bootstrap gap utilities (gap-2, gap-3)

### Shadows
- **Default Shadow**: `0 10px 25px rgba(0, 0, 0, 0.1)` (--shadow)
- **Card Hover**: `0 20px 40px rgba(0, 0, 0, 0.15)`
- **Button Hover**: `0 8px 20px rgba(0, 0, 0, 0.2)`

### Component Styles

#### **Buttons:**
- Border radius: 12px
- Font weight: 600
- Hover: Transform translateY(-2px), shadow tăng
- Gradient backgrounds: Primary (purple gradient), Success (green gradient), Warning (orange gradient), Danger (red gradient), Info (cyan gradient)
- Shine effect: ::before pseudo-element với gradient animation

#### **Cards:**
- Border radius: 12px
- Shadow: Default shadow
- Hover: Transform translateY(-5px), shadow tăng
- Header: Gradient background, white text, border-radius top only

#### **Tables:**
- Border radius: 12px (overflow hidden)
- Header: Gradient background, white text, uppercase, letter-spacing
- Row hover: Background rgba(37, 99, 235, 0.05), transform scale(1.01)
- Border: None trên rows, 1px solid #f1f5f9 trên td bottom

#### **Badges:**
- Border radius: 20px
- Padding: 8px 16px
- Font weight: 600
- Font size: 0.75rem
- Uppercase, letter-spacing
- Gradient backgrounds tương tự buttons

#### **Forms:**
- Border: 2px solid #e2e8f0
- Border radius: 12px
- Padding: 12px 16px
- Focus: Border-color primary, box-shadow rgba(37, 99, 235, 0.1)

#### **Alerts:**
- Border radius: 12px
- Border: None
- Gradient backgrounds (light variants)
- Padding: 16px 20px

#### **Rating Stars:**
- Color: #fbbf24 (filled), #d1d5db (empty)
- Font size: 1.25rem
- Hover: Scale 1.2

#### **Progress Bars:**
- Border radius: 10px
- Height: 8px (default), 4-20px (variants)
- Background: rgba(255, 255, 255, 0.3)
- Bar: Green gradient

---

## 5. UI ISSUES & INCONSISTENCIES

### 5.1. Layout & Navigation

#### Issue 1: Owner Navbar không có main navigation
- **Mô tả**: Khi user là owner, navbar ẩn các link "Trang chủ", "Địa điểm", "Voucher"
- **Vấn đề**: Owner không thể navigate đến các trang công khai từ navbar
- **Đề xuất**: Giữ main nav hoặc thêm link "Về trang chủ" trong owner dropdown

#### Issue 2: Inconsistent back buttons
- **Mô tả**: Một số trang có nút "Quay lại Dashboard", một số không
- **Đề xuất**: Standardize back navigation pattern (có thể dùng breadcrumbs)

### 5.2. Forms & Inputs

#### Issue 3: Image picker component code trong EJS
- **Mô tả**: JavaScript cho image picker được viết inline trong EJS file (manage_location.ejs)
- **Vấn đề**: Khó maintain, không reusable
- **Đề xuất**: Move sang `main.js` với data attributes để reusable

#### Issue 4: Form validation không consistent
- **Mô tả**: Một số form có HTML5 validation, một số có custom JavaScript
- **Đề xuất**: Standardize validation approach (có thể dùng Bootstrap validation hoặc custom utility)

#### Issue 5: Password confirmation không có real-time validation
- **Mô tả**: Register form chỉ check password match khi submit
- **Đề xuất**: Add real-time validation trên confirm password field

### 5.3. Data Display

#### Issue 6: Không có pagination
- **Mô tả**: Tất cả list pages (users, locations, vouchers, reviews) hiển thị tất cả items
- **Vấn đề**: Performance issues với large datasets
- **Đề xuất**: Implement pagination (server-side hoặc client-side)

#### Issue 7: Không có sort functionality
- **Mô tả**: Tables không có sortable columns
- **Đề xuất**: Add sort icons và click handlers (có thể dùng library hoặc custom)

#### Issue 8: Search chỉ client-side (admin/users)
- **Mô tả**: Search users chỉ filter trên client, không query database
- **Vấn đề**: Không hiệu quả với large datasets
- **Đề xuất**: Implement server-side search

### 5.4. States & Feedback

#### Issue 9: Loading states không consistent
- **Mô tả**: Một số actions có loading spinner, một số không
- **Đề xuất**: Standardize loading indicators (spinner, skeleton, hoặc disabled state)

#### Issue 10: Error handling không đầy đủ
- **Mô tả**: Một số AJAX calls không có error handling
- **Đề xuất**: Add try-catch và user-friendly error messages

#### Issue 11: Toast notifications không consistent
- **Mô tả**: Một số actions dùng toast, một số dùng alert, một số dùng flash messages
- **Đề xuất**: Standardize notification system (toast cho AJAX, flash cho form submissions)

### 5.5. Responsive Design

#### Issue 12: Tables không mobile-friendly
- **Mô tả**: Tables scroll horizontal trên mobile, khó đọc
- **Đề xuất**: 
  - Option 1: Stack layout trên mobile (cards thay vì table)
  - Option 2: Hide less important columns trên mobile
  - Option 3: Improve table-responsive với better styling

#### Issue 13: Modal sizes không responsive
- **Mô tả**: modal-lg có thể quá lớn trên mobile
- **Đề xuất**: Add responsive modal sizes hoặc full-width trên mobile

#### Issue 14: Chat widget width cố định
- **Mô tả**: Floating chat panel 420px width có thể quá rộng trên mobile
- **Đề xuất**: Responsive width (full width - padding trên mobile)

### 5.6. Accessibility

#### Issue 15: Missing ARIA labels
- **Mô tả**: Một số interactive elements không có aria-label
- **Đề xuất**: Add ARIA labels cho buttons, form inputs, modals

#### Issue 16: Keyboard navigation
- **Mô tả**: Một số components (rating stars, image picker) không có keyboard support
- **Đề xuất**: Add keyboard event handlers (Arrow keys, Enter, Space)

#### Issue 17: Focus indicators
- **Mô tả**: Một số elements thiếu visible focus states
- **Đề xuất**: Add focus-visible styles cho all interactive elements

### 5.7. Styling Inconsistencies

#### Issue 18: Card header colors không consistent
- **Mô tả**: Một số cards dùng gradient, một số dùng solid colors
- **Đề xuất**: Standardize card header styling

#### Issue 19: Button sizes không consistent
- **Mô tả**: Một số buttons dùng btn-sm, một số không
- **Đề xuất**: Define button size guidelines (sm cho tables, default cho forms, lg cho CTAs)

#### Issue 20: Empty state styling không consistent
- **Mô tả**: Một số empty states có icon + message, một số chỉ có message
- **Đề xuất**: Create reusable empty state component với consistent styling

### 5.8. Performance

#### Issue 21: Chart.js load trên mọi page
- **Mô tả**: Chart.js script load trong dashboard.ejs (inline script tag)
- **Vấn đề**: Load unnecessary trên pages khác
- **Đề xuất**: Load Chart.js chỉ trên dashboard pages

#### Issue 22: Large JavaScript file
- **Mô tả**: main.js có nhiều functions, load trên mọi page
- **Đề xuất**: Code splitting hoặc conditional loading

### 5.9. User Experience

#### Issue 23: Confirmation dialogs không consistent
- **Mô tả**: Một số dùng window.confirm, một số dùng custom center-modal
- **Đề xuất**: Standardize confirmation UI (dùng center-modal cho consistency)

#### Issue 24: Review remaining count alert quá intrusive
- **Mô tả**: Alert popup khi load location detail page
- **Vấn đề**: Disruptive UX
- **Đề xuất**: Thay bằng subtle notification (toast hoặc inline message)

#### Issue 25: Filter toggle animation không smooth
- **Mô tả**: Filter collapse trên locations page dùng max-height animation
- **Đề xuất**: Improve animation hoặc dùng Bootstrap collapse component

### 5.10. Code Quality

#### Issue 26: Inline styles trong EJS
- **Mô tả**: Một số inline styles (style="height: 200px") thay vì CSS classes
- **Đề xuất**: Move to CSS classes hoặc utility classes

#### Issue 27: Duplicate code
- **Mô tả**: Review detail pages (admin và owner) gần như giống nhau
- **Đề xuất**: Create shared partial hoặc component

#### Issue 28: Magic numbers
- **Mô tả**: Hard-coded values (6 items limit, 5 files max, 15MB limit)
- **Đề xuất**: Move to constants/config

---

## KẾT LUẬN

Project B có cấu trúc UI rõ ràng với Bootstrap 5 và custom CSS. Design system sử dụng CSS variables và gradient themes. Tuy nhiên, cần cải thiện về consistency, responsive design, accessibility, và code organization. Các đề xuất trên tập trung vào standardization, performance optimization, và better user experience.
