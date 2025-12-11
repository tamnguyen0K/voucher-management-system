# Voucher Management System – Project Architecture

Tài liệu mô tả kiến trúc và cách vận hành hiện tại của hệ thống quản lý voucher được xây dựng bằng Node.js + Express + MongoDB + EJS. Nội dung được sắp xếp theo mạch thực hiện dự án: mục tiêu → use case → kiến trúc → thiết kế chi tiết → vận hành.

---

## 1. Project summary & goals
- **Mục tiêu**: cung cấp nền tảng web tập trung quản lý địa điểm, voucher và review; hỗ trợ user cuối claim ưu đãi, owner chăm sóc địa điểm, admin kiểm duyệt toàn hệ thống.
- **Định hướng triển khai**:
  - Monolith Express để tối ưu tốc độ phát triển.
  - Render server-side với EJS + Bootstrap (không framework SPA).
  - MongoDB làm nguồn dữ liệu chính kiêm session store; file upload lưu trên disk.
- **Phạm vi tài liệu**: các thành phần phía server (`src/**`), dữ liệu (MongoDB + filesystem) và quy trình vận hành; phần UI thuần EJS/Bootstrap nên không trình bày chi tiết.

---

## 2. Personas & primary use cases

### 2.1 Actors
| Actor | Mục đích chính | Module |
| --- | --- | --- |
| User | Duyệt địa điểm, claim voucher, viết review | `views/pages`, `voucher.controller`, `review.controller` |
| Owner | Quản lý địa điểm/voucher thuộc sở hữu, theo dõi feedback | `views/owner`, `owner.controller` |
| Admin | Giám sát thống kê, quản lý dữ liệu và kiểm duyệt nội dung | `views/admin`, `admin.routes` |

### 2.2 Use case overview

```mermaid
flowchart TB
    subgraph "User Use Cases"
        U[User/Guest]
        UC1[Duyệt địa điểm & xem voucher]
        UC2[Claim voucher]
        UC3[Viết review có media]
        UC4[Chat với trợ lý ảo AI]
        UC5[Tìm kiếm địa điểm]
        UC6[Xem profile & voucher đã claim]
        
        U --> UC1
        U --> UC2
        U --> UC3
        U --> UC4
        U --> UC5
        U --> UC6
        UC3 -. include .-> UC1
        UC4 -. include .-> UC5
        UC2 -. include .-> UC1
    end
```
Hình 1 – Use case User

```mermaid
flowchart TB
    subgraph "Owner Use Cases"
        O[Owner]
        OC1[Quản lý địa điểm]
        OC2[Quản lý voucher]
        OC3[Theo dõi review/claim]
        OC4[Xem dashboard thống kê]
        OC5[Cập nhật profile]
        
        O --> OC1
        O --> OC2
        O --> OC3
        O --> OC4
        O --> OC5
        OC2 -. include .-> OC1
        OC3 -. include .-> OC1
    end
```
Hình 2 – Use case Owner

```mermaid
flowchart TB
    subgraph "Admin Use Cases"
        A[Admin]
        AC1[Giám sát dashboard]
        AC2[Quản lý user/location/voucher/review]
        AC3[Kiểm duyệt nội dung vi phạm]
        AC4[Xem thống kê hệ thống]
        AC5[Quản lý quyền người dùng]
        
        A --> AC1
        A --> AC2
        A --> AC3
        A --> AC4
        A --> AC5
        AC1 -. include .-> AC2
        AC3 -. extend .-> AC2
        AC4 -. include .-> AC1
    end
```
Hình 3 – Use case Admin

### 2.3 Use case tổng quát

```mermaid
flowchart LR
    subgraph "Actors"
        U[User/Guest]
        O[Owner]
        A[Admin]
    end
    
    subgraph "Core Use Cases"
        UC1[Tìm kiếm & Duyệt địa điểm]
        UC2[Chat với Chatbot AI]
        UC3[Claim Voucher]
        UC4[Viết Review]
        UC5[Quản lý Địa điểm]
        UC6[Quản lý Voucher]
        UC7[Giám sát Hệ thống]
        UC8[Kiểm duyệt Nội dung]
    end
    
    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    
    O --> UC5
    O --> UC6
    O --> UC4
    
    A --> UC7
    A --> UC8
    A --> UC5
    A --> UC6
```
Hình 4 – Use case tổng quát hệ thống

Chi tiết từng luồng được trình bày trong phần 9.

---

## 3. Architecture overview

### 3.1 Kiến trúc tổng quan

```mermaid
graph TB
    subgraph "Client Layer"
        B["Browsers<br/>(EJS pages + fetch APIs)"]
        CHAT[Chatbot UI<br/>Floating Widget]
    end
    
    subgraph "Server Layer (Express app)"
        R[Route modules<br/>user/location/voucher/owner/admin/chatbot]
        C[Controllers & services]
        MW["Middleware<br/>(auth, flash, upload)"]
        V["View rendering<br/>(EJS + layouts)"]
        
        R --> C
        C --> MW
        C --> V
    end
    
    subgraph "External Services"
        N8N[n8n Workflow<br/>Chatbot Engine]
    end
    
    subgraph "Data Layer"
        DB[(MongoDB<br/>Mongoose models)]
        SS[(Mongo-backed session store)]
        FS[(Uploads on disk<br/>src/uploads/reviews)]
    end
    
    B --> R
    CHAT --> R
    B <-->|HTML/JSON| V
    C --> DB
    C --> FS
    C <-->|Webhook| N8N
    N8N --> DB
    MW --> SS
```
Hình 5 – Kiến trúc tổng quan hệ thống

### 3.2 Kiến trúc chi tiết theo lớp

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI1[EJS Templates<br/>Pages/Admin/Owner]
        UI2[Bootstrap 5 UI]
        UI3[Client-side JS<br/>main.js]
    end
    
    subgraph "Application Layer"
        APP[Express App<br/>app.js]
        ROUTES[Route Handlers]
        CTRL[Controllers]
        MW_AUTH[Auth Middleware]
        MW_UPLOAD[Upload Middleware]
    end
    
    subgraph "Business Logic Layer"
        BL1[User Service]
        BL2[Location Service]
        BL3[Voucher Service]
        BL4[Review Service]
        BL5[Chatbot Service]
    end
    
    subgraph "Data Access Layer"
        DAL1[Mongoose Models]
        DAL2[Session Store]
        DAL3[File System]
    end
    
    subgraph "External Integration"
        EXT1[n8n Webhook]
        EXT2[MongoDB]
    end
    
    UI1 --> APP
    UI2 --> APP
    UI3 --> APP
    
    APP --> ROUTES
    ROUTES --> MW_AUTH
    ROUTES --> MW_UPLOAD
    ROUTES --> CTRL
    
    CTRL --> BL1
    CTRL --> BL2
    CTRL --> BL3
    CTRL --> BL4
    CTRL --> BL5
    
    BL1 --> DAL1
    BL2 --> DAL1
    BL3 --> DAL1
    BL4 --> DAL1
    BL5 --> EXT1
    
    DAL1 --> EXT2
    DAL2 --> EXT2
    DAL3 --> EXT2
    
    EXT1 --> EXT2
```
Hình 6 – Kiến trúc chi tiết theo lớp

- **Client layer**: trình duyệt tải EJS render sẵn + Bootstrap 5/Font Awesome, có một số fetch API nhẹ (claim voucher, summary).
- **Server layer**: `src/app.js` khởi tạo Express, mount routes, middleware và cấu hình layout (`express-ejs-layouts`).
- **Data layer**: MongoDB lưu toàn bộ entity và session (qua `connect-mongo`); upload review lưu ở `src/uploads`.

---

## 4. Backend components (implementation plan)

### 4.1 Application shell (`src/app.js`)
- Load env (`src/config/dotenv`), kết nối Mongo (`src/config/db.js`), boot Express.
- Middleware chuỗi: body parser, static assets (`src/public`), static uploads (`/uploads`), session + flash + `addUserToLocals`.
- Layout mặc định `views/layout.ejs`, inject metadata qua `app.locals.locationMeta`.
- Mount route modules: `/`, `userRoutes`, `locationRoutes`, `voucherRoutes`, `adminRoutes`, `ownerRoutes`.
- Handlers cho 404 + error logging.

### 4.2 Routing & controllers

| Domain | Route entry | Controller | Vai trò chính | Output |
| --- | --- | --- | --- | --- |
| Auth/Profile | `src/routes/user.routes.js` | `user.controller.js` | đăng ký/đăng nhập/logout, trang profile | `views/pages/login_register.ejs`, `pages/profile.ejs`, `owner/profile.ejs` |
| Locations | `src/routes/location.routes.js` | `location.controller.js` | danh sách/chi tiết, summary API, CRUD owner | `views/pages/locations.ejs`, `pages/location_detail.ejs`, JSON `/locations/:id/summary` |
| Reviews | `location.routes.js` + owner/admin routes | `review.controller.js` | tạo/sửa/xóa review, upload media, dashboard owner/admin | `views/pages/location_detail.ejs`, `owner/manage_review.ejs`, `admin/review_detail.ejs` |
| Vouchers | `src/routes/voucher.routes.js` | `voucher.controller.js` | list voucher, claim flow, owner CRUD | `views/pages/voucher_list.ejs`, `admin/manage_voucher.ejs` |
| Owner area | `src/routes/owner.routes.js` | `owner.controller.js` + phụ trợ | dashboard, hồ sơ, quản lý địa điểm/voucher của chính owner | `views/owner/*.ejs` |
| Admin area | `src/routes/admin.routes.js` | inline handlers + `review.controller` | dashboard thống kê, CRUD user/location/voucher/review | `views/admin/*.ejs`, JSON |

### 4.3 Middleware & session services
- `middleware/auth.js`: `requireAuth`, `requireAdmin`, `requireOwner`, `requireRole`, `redirectIfAuthenticated`, `addUserToLocals`.
- Session: `express-session` + `connect-mongo`, cookie 1 ngày, hỗ trợ bật `cookie.secure`.
- Upload: `middleware/upload.js` (multer) tạo thư mục `uploads/reviews/<userId>`, 15 MB/file, tối đa 5 file, filter ảnh/video.
- Flash message: `connect-flash` + `req.session` hỗ trợ feedback sau redirect.

### 4.4 View layer & static assets
- Layout `views/layout.ejs` bao bọc `views/pages`, `views/admin`, `views/owner`; partials dùng chung (navbar, alerts, cards).
- UI: Bootstrap 5, Font Awesome, custom CSS/JS (`src/public/css`, `src/public/js`).
- Upload phục vụ trực tiếp qua Express (`/uploads`).

### 4.5 Services & utilities
- `utils/locationMetadata.js`: chuẩn hóa feature/menu/price, remove tone, suy luận price/city/keyword; dùng trong controller và script enrich.
- Helpers trong `location.controller`: `ensureDetailedDescription`, `ensureFeatureCoverage`, builder preview.

### 4.6 Support scripts & tooling
- `src/config/db.js`: helper kết nối Mongo (app & scripts).
- `src/config/migrate.js`: thêm `phoneNumber`/`idName` cho user cũ.
- `src/config/enrich_locations.js`: enrich metadata location (hỗ trợ `--dry`).
- npm scripts: `npm run dev`, `start`, `migrate`, `enrich:locations[:dry]`, `seed`.

---

## 5. Data model & storage

```mermaid
erDiagram
    USER ||--o{ LOCATION : owns
    USER ||--o{ REVIEW : writes
    USER ||--o{ CLAIMEDVOUCHER : claims
    LOCATION ||--o{ REVIEW : receives
    LOCATION ||--o{ VOUCHER : offers

    USER {
        ObjectId _id
        string username
        string email
        string phoneNumber
        string role
        date createdAt
    }

    CLAIMEDVOUCHER {
        string voucherCode
        ObjectId voucherId
        date claimedAt
        date expiryDate
        string locationName
        number discountPct
    }

    LOCATION {
        ObjectId _id
        string name
        string address
        string type
        string city
        string priceLevel
        object priceRange
        number rating
        array features
        array menuHighlights
        array keywords
        ObjectId owner
        date createdAt
    }

    VOUCHER {
        ObjectId _id
        string code
        number discountPct
        number quantityTotal
        number quantityClaimed
        date startDate
        date endDate
        string conditions
        ObjectId location
        date createdAt
    }

    REVIEW {
        ObjectId _id
        ObjectId user
        ObjectId location
        number rating
        string comment
        array media
        date createdAt
    }
```

| Store | Fields chính | Index/Constraint | Ghi chú |
| --- | --- | --- | --- |
| `users` | `username`, `email`, `phoneNumber`, `role`, `claimedVouchers[]` | Unique `username/email/phoneNumber`; bcrypt hash trong `pre('save')` | Session lưu `_id`, `role`, `username`; dọn `claimedVouchers` khi hết hạn |
| `locations` | `name`, `description`, `address`, `type`, `city`, `priceLevel`, `features`, `menuHighlights`, `keywords`, `owner`, `rating` | Text index `name/description/address/city/keywords`; index `owner` | Metadata chuẩn hóa giúp search + dashboard ổn định |
| `vouchers` | `code`, `discountPct`, `quantityTotal/Claimed`, `startDate/endDate`, `location`, `conditions` | Index `code`, `location`, `startDate`, `endDate` | Có virtual `quantityRemaining`, `status`; owner CRUD kiểm tra ownership |
| `reviews` | `user`, `location`, `rating`, `comment`, `media[]` | Unique `(user, location)`; index `location`, `createdAt` | `media[]` lưu metadata file; helper xóa file khi review bị xóa |
| Filesystem uploads | `src/uploads/reviews/<userId>/<filename>` | Dir per user | Cần backup vì chứa bằng chứng tương tác |

---

## 6. Key request flows

### 6.1 Session authentication
```mermaid
sequenceDiagram
    participant B as Browser
    participant R as /auth route
    participant C as user.controller.login
    participant DB as MongoDB (users)
    participant SS as Session store (Mongo)
    B->>R: POST /login (email, password)
    R->>C: invoke login()
    C->>DB: findOne({ email })
    DB-->>C: user doc
    C->>C: bcrypt.compare(password)
    C-->>SS: req.session = { userId, role, username }
    C-->>B: Redirect + flash message
```
- Fail case: flash error, redirect `/auth?tab=login`.
- Success: redirect theo role (`/admin/dashboard`, `/owner/dashboard`, `/`).

### 6.2 Voucher claim flow
```mermaid
sequenceDiagram
    participant U as User browser
    participant VR as POST /vouchers/:id/claim
    participant MW as Auth Middleware
    participant VC as voucher.controller
    participant VDB as MongoDB (vouchers)
    participant UDB as MongoDB (users)
    
    U->>VR: POST /vouchers/:id/claim
    VR->>MW: requireAuth + requireUser
    MW->>MW: Check session
    MW-->>VR: Authenticated
    VR->>VC: invoke claimVoucher()
    VC->>VDB: findById(voucherId)
    VDB-->>VC: voucher document
    VC->>VC: validate time window
    VC->>VC: validate quantity remaining
    VC->>UDB: Check if already claimed
    UDB-->>VC: Not claimed
    VC->>UDB: push claimedVouchers entry
    VC->>VDB: increment quantityClaimed
    VC-->>U: redirect + flash success
```
Hình 7 – Luồng claim voucher

### 6.3 Chatbot flow (n8n integration)
```mermaid
sequenceDiagram
    participant U as User Browser
    participant UI as Chatbot UI Widget
    participant EX as Express Server
    participant CB as chatbot.routes.js
    participant N8N as n8n Webhook
    participant MDB as MongoDB
    participant N8N_WF as n8n Workflow
    
    U->>UI: Nhập câu hỏi
    UI->>EX: POST /api/chatbot/query<br/>{question, mode, context}
    EX->>CB: router.post('/chatbot/query')
    CB->>CB: Validate input
    CB->>N8N: POST webhook URL<br/>{question, mode, context}
    
    N8N->>N8N_WF: Trigger workflow
    N8N_WF->>N8N_WF: Parse intent (Switch node)
    N8N_WF->>MDB: Query locations<br/>(MongoDB node)
    MDB-->>N8N_WF: Location data
    N8N_WF->>N8N_WF: Format response<br/>(Code node)
    N8N_WF-->>N8N: Response text
    
    N8N-->>CB: Response JSON/text
    CB->>CB: linkifyLocations()<br/>Escape HTML
    CB-->>EX: {answer, answer_html}
    EX-->>UI: JSON response
    UI->>UI: appendChatMessage()<br/>Display HTML
    UI-->>U: Hiển thị câu trả lời<br/>với clickable links
```
Hình 8 – Luồng xử lý Chatbot với n8n

### 6.4 Review creation flow
```mermaid
sequenceDiagram
    participant U as User Browser
    participant EX as Express Server
    participant MW as Upload Middleware
    participant RC as review.controller
    participant FS as File System
    participant MDB as MongoDB
    
    U->>EX: POST /locations/:id/reviews<br/>(rating, comment, files)
    EX->>MW: Multer middleware
    MW->>MW: Validate file type/size
    MW->>FS: Save files to<br/>uploads/reviews/:userId/
    FS-->>MW: File paths
    MW-->>EX: req.files
    
    EX->>RC: createReview()
    RC->>RC: Validate rating/comment
    RC->>MDB: Check review limit<br/>(max 3 per location)
    MDB-->>RC: Review count
    RC->>MDB: Create review document<br/>{user, location, rating, comment, media}
    MDB-->>RC: Review saved
    RC->>MDB: Update location rating
    RC-->>EX: Success
    EX-->>U: Redirect + flash success
```
Hình 9 – Luồng tạo review với media upload

---

## 7. Cross-cutting concerns
- **Authentication & RBAC**: session-based auth (`express-session`); middleware bảo vệ route owner/admin/claim/review; logout hủy session server-side.
- **Validation & messaging**: validate dữ liệu (password, phone, `DESCRIPTION_MIN_LENGTH`, `FEATURE_MIN_COUNT`), flash message + highlight tab hỗ trợ UX.
- **Security & privacy**: bcrypt hash password, session secret mạnh, upload đặt tên an toàn (`sanitizeFilename`) + kiểm tra MIME; owner/admin không thao tác entity không thuộc quyền.
- **Search & discovery**: text index trên `locations`; metadata builder chuẩn hóa feature/menu để filter.
- **File/media handling**: lưu review media trên disk, `removeReviewMedia` dọn file khi review xóa; giới hạn dung lượng & số file.
- **Error handling & resiliency**: try/catch toàn bộ controller, trả về trang thân thiện; script enrich hỗ trợ `--dry` tránh hỏng dữ liệu.

---

## 8. Deployment & environment
- **Environment variables**: `NODE_ENV`, `PORT` (3000), `MONGODB_URI`, `SESSION_SECRET` (đọc từ `src/config/dotenv`).
- **Process**: dev dùng `npm run dev` (nodemon), prod `npm start`; triển khai nên dùng PM2/systemd.
- **Data ops**: `npm run migrate` đồng bộ schema user cũ; `npm run enrich:locations[:dry]` chuẩn hóa metadata; `npm run seed` nạp demo data.
- **Storage**: MongoDB lưu data + session (có thể tách URI), `src/uploads` phải tồn tại & backup.
- **Observability**: log `console.log/error` theo module; đề xuất chuyển sang Winston/Pino + metrics (voucher active, review rate).
- **Hardening**: bật HTTPS + `cookie.secure`, thêm CSRF token cho form quan trọng, rate-limit API public, cân nhắc CDN/static host cho `public`.

---

## 9. Detailed use case flows

### 9.1 User duyệt địa điểm & claim voucher
1. User mở `/locations`; controller query Mongo với text search + metadata filter.
2. Trang chi tiết render location + review + voucher hợp lệ.
3. User chọn claim → `POST /vouchers/:id/claim` (có `requireAuth`); controller kiểm tra thời gian, số lượng, tránh claim trùng.
4. Voucher ghi vào `claimedVouchers[]`, tăng `quantityClaimed`, flash success.

### 9.2 Owner quản lý địa điểm & voucher
1. Owner đăng nhập, truy cập `/owner/dashboard` (guard `requireOwner`).
2. Tạo/cập nhật địa điểm via `owner/manage_location`; controller validate mô tả, enrich metadata (`utils/locationMetadata`) rồi lưu.
3. Tạo voucher mới tại `owner/manage_voucher`, set `quantity`, `startDate`, `endDate`, `conditions`; controller xác thực ownership location.
4. Dashboard hiển thị bảng review & claim liên quan tới địa điểm của owner.

### 9.3 Admin giám sát hệ thống
1. Admin đăng nhập, vào `/admin/dashboard` (guard `requireAdmin`).
2. Xem thống kê tổng quan và truy cập từng module quản lý (`views/admin/*.ejs`).
3. Có thể khóa user, xóa/chỉnh sửa location/voucher/review khi phát hiện bất thường; cập nhật trực tiếp collection MongoDB.
4. Các API thống kê nhỏ được bảo vệ RBAC và chỉ dùng nội bộ EJS dashboard.

### 9.4 Review lifecycle với media
1. User/owner truy cập trang review của địa điểm; khi submit review, `middleware/upload` lưu media vào `src/uploads/reviews/<userId>`.
2. `review.controller` validate rating/comment, gắn metadata review + media.
3. Khi review bị xóa (owner/admin), `removeReviewMedia` dọn file vật lý tránh rác.
4. Review xuất hiện trên trang location, owner dashboard và admin module để phản hồi chất lượng dịch vụ.

---

## 10. Activity Diagrams

Các sơ đồ Activity mô tả chi tiết các luồng nghiệp vụ chính từ góc nhìn hành động và quyết định.

### 10.1 Activity: Đăng nhập và Đăng ký

```mermaid
flowchart TD
    Start([Bắt đầu]) --> CheckAuth{Đã đăng nhập?}
    CheckAuth -->|Có| RedirectHome[Redirect về trang chủ]
    CheckAuth -->|Chưa| ShowForm[Hiển thị form đăng nhập/đăng ký]
    
    ShowForm --> UserAction{User chọn?}
    UserAction -->|Đăng nhập| LoginForm[Điền email + password]
    UserAction -->|Đăng ký| RegisterForm[Điền thông tin đăng ký]
    
    LoginForm --> ValidateLogin{Validate input}
    ValidateLogin -->|Lỗi| ShowLoginError[Hiển thị lỗi validation]
    ValidateLogin -->|OK| FindUser[Tìm user theo email]
    
    FindUser --> UserExists{User tồn tại?}
    UserExists -->|Không| ShowLoginError
    UserExists -->|Có| ComparePassword[So sánh password với bcrypt]
    
    ComparePassword --> PasswordMatch{Password đúng?}
    PasswordMatch -->|Không| ShowLoginError
    PasswordMatch -->|Có| CreateSession[Tạo session: userId, role, username]
    CreateSession --> RedirectByRole{Phân quyền?}
    RedirectByRole -->|Admin| RedirectAdmin[Redirect /admin/dashboard]
    RedirectByRole -->|Owner| RedirectOwner[Redirect /owner/dashboard]
    RedirectByRole -->|User| RedirectUser[Redirect /]
    
    RegisterForm --> ValidateRegister{Validate input}
    ValidateRegister -->|Lỗi| ShowRegisterError[Hiển thị lỗi validation]
    ValidateRegister -->|OK| CheckUnique{Kiểm tra unique: username, email, phoneNumber}
    
    CheckUnique --> IsUnique{Đã tồn tại?}
    IsUnique -->|Có| ShowRegisterError
    IsUnique -->|Không| HashPassword[Hash password với bcrypt]
    HashPassword --> CreateUser[Tạo user mới trong DB]
    CreateUser --> CreateSession
    
    ShowLoginError --> ShowForm
    ShowRegisterError --> ShowForm
    RedirectHome --> End([Kết thúc])
    RedirectAdmin --> End
    RedirectOwner --> End
    RedirectUser --> End
```
Hình 10 – Activity: Đăng nhập và Đăng ký

### 10.2 Activity: Claim Voucher

```mermaid
flowchart TD
    Start([User xem danh sách voucher]) --> ClickClaim[Click nút Claim voucher]
    ClickClaim --> CheckAuth{Đã đăng nhập?}
    CheckAuth -->|Chưa| RedirectLogin[Redirect đến /auth?tab=login]
    CheckAuth -->|Có| CheckRole{Role = user?}
    
    CheckRole -->|Không| ShowError[Hiển thị lỗi: Chỉ user mới claim được]
    CheckRole -->|Có| GetVoucher[Lấy thông tin voucher từ DB]
    
    GetVoucher --> VoucherExists{Voucher tồn tại?}
    VoucherExists -->|Không| ShowError
    VoucherExists -->|Có| CheckTime{Kiểm tra thời gian: now lớn hơn hoặc bằng startDate và nhỏ hơn hoặc bằng endDate}
    
    CheckTime -->|Ngoài thời gian| ShowError2[Hiển thị lỗi: Voucher chưa/đã hết hạn]
    CheckTime -->|Trong thời gian| CheckQuantity{quantityClaimed nhỏ hơn quantityTotal?}
    
    CheckQuantity -->|Hết số lượng| ShowError3[Hiển thị lỗi: Voucher đã hết lượt]
    CheckQuantity -->|Còn số lượng| CheckClaimed{User đã claim voucher này chưa?}
    
    CheckClaimed -->|Đã claim| ShowError4[Hiển thị lỗi: Đã claim voucher này]
    CheckClaimed -->|Chưa claim| AddToUser[Thêm voucher vào user.claimedVouchers array]
    
    AddToUser --> IncrementClaimed[Tăng voucher.quantityClaimed]
    IncrementClaimed --> SaveDB[Lưu vào MongoDB]
    SaveDB --> ShowSuccess[Hiển thị thông báo thành công]
    
    RedirectLogin --> End([Kết thúc])
    ShowError --> End
    ShowError2 --> End
    ShowError3 --> End
    ShowError4 --> End
    ShowSuccess --> End
```
Hình 11 – Activity: Claim Voucher

### 10.3 Activity: Tạo Review với Media Upload

```mermaid
flowchart TD
    Start([User xem chi tiết location]) --> ClickReview[Click nút Viết Review]
    ClickReview --> CheckAuth{Đã đăng nhập?}
    CheckAuth -->|Chưa| RedirectLogin[Redirect đến /auth]
    CheckAuth -->|Có| CheckReviewLimit{Kiểm tra số lần review: count nhỏ hơn 3?}
    
    CheckReviewLimit -->|Đã đủ 3| ShowError[Hiển thị lỗi: Đã đánh giá tối đa 3 lần]
    CheckReviewLimit -->|Chưa đủ| ShowForm[Hiển thị form review: rating, comment, upload media]
    
    ShowForm --> UserSubmit[User submit form]
    UserSubmit --> ValidateInput{Validate: rating 1-5, comment max 500 ký tự}
    
    ValidateInput -->|Lỗi| ShowValidationError[Hiển thị lỗi validation]
    ValidateInput -->|OK| ValidateFiles{Có file upload?}
    
    ValidateFiles -->|Có| ValidateFileType{Kiểm tra file type: image hoặc video}
    ValidateFileType -->|Không hợp lệ| ShowFileError[Hiển thị lỗi: File không hợp lệ]
    ValidateFileType -->|Hợp lệ| ValidateFileSize{Kiểm tra file size: tối đa 15MB/file, tối đa 5 files}
    
    ValidateFileSize -->|Vượt quá| ShowSizeError[Hiển thị lỗi: File quá lớn hoặc quá nhiều]
    ValidateFileSize -->|OK| SaveFiles[Lưu files vào uploads/reviews/userId]
    
    ValidateFiles -->|Không| CreateReview[Create review document]
    SaveFiles --> CreateReview
    
    CreateReview --> AddMediaMetadata[Thêm media metadata vào review]
    AddMediaMetadata --> SaveReview[Lưu review vào MongoDB]
    SaveReview --> UpdateLocationRating[Tính rating trung bình và cập nhật location.rating]
    UpdateLocationRating --> ShowSuccess[Hiển thị thông báo thành công]
    
    RedirectLogin --> End([Kết thúc])
    ShowError --> End
    ShowValidationError --> End
    ShowFileError --> End
    ShowSizeError --> End
    ShowSuccess --> End
```
Hình 12 – Activity: Tạo Review với Media Upload

### 10.4 Activity: Owner tạo Location mới

```mermaid
flowchart TD
    Start([Owner vào trang quản lý location]) --> ClickCreate[Click nút Tạo Location mới]
    ClickCreate --> ShowForm[Hiển thị form: name, description, address, type, city, priceRange]
    
    ShowForm --> OwnerSubmit[Owner điền và submit form]
    OwnerSubmit --> ValidateRequired{Validate required fields: name, description, address}
    
    ValidateRequired -->|Thiếu| ShowError[Hiển thị lỗi: Thiếu thông tin bắt buộc]
    ValidateRequired -->|Đủ| ValidateDescription{description length lớn hơn hoặc bằng 80 ký tự?}
    
    ValidateDescription -->|Không| ShowDescError[Hiển thị lỗi: Mô tả tối thiểu 80 ký tự]
    ValidateDescription -->|Có| CheckFeatures{Có nhập features?}
    
    CheckFeatures -->|Có| UseInputFeatures[Sử dụng features đã nhập]
    CheckFeatures -->|Không| InferFeatures[Tự động infer features từ description utils/locationMetadata]
    
    UseInputFeatures --> CheckFeatureCount{features length lớn hơn hoặc bằng 2?}
    InferFeatures --> CheckFeatureCount
    
    CheckFeatureCount -->|Không| AutoAddFeatures[Tự động thêm features để đạt tối thiểu 2]
    CheckFeatureCount -->|Có| InferMenu[Tự động infer menu highlights từ description]
    
    AutoAddFeatures --> InferMenu
    InferMenu --> InferPriceLevel[Tự động infer price level từ priceRange hoặc description]
    InferPriceLevel --> BuildKeywords[Tạo keywords array từ name, city, address, description, features, menu highlights]
    
    BuildKeywords --> CreateLocation[Tạo location document: owner = current user]
    CreateLocation --> SaveLocation[Lưu vào MongoDB]
    SaveLocation --> ShowSuccess[Hiển thị thông báo thành công]
    
    ShowError --> ShowForm
    ShowDescError --> ShowForm
    ShowSuccess --> End([Kết thúc])
```
Hình 13 – Activity: Owner tạo Location mới

### 10.5 Activity: Owner tạo Voucher

```mermaid
flowchart TD
    Start([Owner vào trang quản lý voucher]) --> ClickCreate[Click nút Tạo Voucher mới]
    ClickCreate --> LoadLocations[Load danh sách locations của owner]
    
    LoadLocations --> HasLocations{Có location nào?}
    HasLocations -->|Không| ShowError[Hiển thị lỗi: Chưa có location]
    HasLocations -->|Có| ShowForm[Hiển thị form: code, discountPct, quantityTotal, startDate, endDate, locationId, conditions]
    
    ShowForm --> OwnerSubmit[Owner điền và submit form]
    OwnerSubmit --> ValidateCode{Validate code: 3-20 ký tự, uppercase, unique?}
    
    ValidateCode -->|Lỗi| ShowCodeError[Hiển thị lỗi: Code không hợp lệ hoặc đã tồn tại]
    ValidateCode -->|OK| ValidateDiscount{discountPct từ 1-100%?}
    
    ValidateDiscount -->|Không| ShowDiscountError[Hiển thị lỗi: Discount không hợp lệ]
    ValidateDiscount -->|Có| ValidateQuantity{quantityTotal lớn hơn hoặc bằng 1?}
    
    ValidateQuantity -->|Không| ShowQuantityError[Hiển thị lỗi: Số lượng không hợp lệ]
    ValidateQuantity -->|Có| ValidateDates{startDate nhỏ hơn endDate?}
    
    ValidateDates -->|Không| ShowDateError[Hiển thị lỗi: Thời gian không hợp lệ]
    ValidateDates -->|Có| CheckOwnership{Location thuộc<br/>sở hữu của owner?}
    
    CheckOwnership -->|Không| ShowOwnershipError[Hiển thị lỗi: Không có quyền]
    CheckOwnership -->|Có| CreateVoucher[Tạo voucher document]
    CreateVoucher --> SaveVoucher[Lưu vào MongoDB]
    SaveVoucher --> ShowSuccess[Hiển thị thông báo thành công]
    
    ShowError --> End([Kết thúc])
    ShowCodeError --> ShowForm
    ShowDiscountError --> ShowForm
    ShowQuantityError --> ShowForm
    ShowDateError --> ShowForm
    ShowOwnershipError --> ShowForm
    ShowSuccess --> End
```
Hình 14 – Activity: Owner tạo Voucher

### 10.6 Activity: Chatbot Query Flow

```mermaid
flowchart TD
    Start([User mở chatbot widget]) --> UserInput[User nhập câu hỏi]
    UserInput --> ValidateInput{Câu hỏi có nội dung?}
    
    ValidateInput -->|Rỗng| ShowError[Hiển thị lỗi: Vui lòng nhập câu hỏi]
    ValidateInput -->|Có| ShowLoading[Hiển thị trạng thái loading]
    
    ShowLoading --> SendRequest[Gửi POST /api/chatbot/query với question, mode, context]
    SendRequest --> CallN8N[Gọi n8n webhook URL]
    
    CallN8N --> N8NAvailable{n8n có phản hồi?}
    N8NAvailable -->|Timeout/Error| ShowError2[Hiển thị lỗi: Không thể kết nối chatbot]
    N8NAvailable -->|Có| ParseResponse[Parse response từ n8n]
    
    ParseResponse --> ExtractAnswer[Trích xuất answer text]
    ExtractAnswer --> LinkifyLocations[Tìm pattern ObjectId trong text và linkify thành HTML links]
    
    LinkifyLocations --> EscapeHTML[Escape HTML để chống XSS]
    EscapeHTML --> DisplayAnswer[Hiển thị câu trả lời trong chat UI]
    DisplayAnswer --> SaveToHistory[Lưu vào localStorage chat_history]
    
    ShowError --> UserInput
    ShowError2 --> UserInput
    SaveToHistory --> End([Kết thúc])
```
Hình 15 – Activity: Chatbot Query Flow

### 10.7 Activity: Admin quản lý User

```mermaid
flowchart TD
    Start([Admin vào trang quản lý users]) --> LoadUsers[Load danh sách tất cả users]
    LoadUsers --> DisplayUsers[Hiển thị bảng users: username, email, role, createdAt]
    
    DisplayUsers --> AdminAction{Admin chọn hành động?}
    AdminAction -->|Cập nhật role| SelectUser[Chọn user cần cập nhật]
    AdminAction -->|Xóa user| SelectUserDelete[Chọn user cần xóa]
    AdminAction -->|Xem chi tiết| ViewUserDetail[Xem profile user]
    
    SelectUser --> CheckSelf{User = chính mình?}
    CheckSelf -->|Có| ShowError[Hiển thị lỗi: Không thể thay đổi role của chính mình]
    CheckSelf -->|Không| SelectNewRole[Chọn role mới: user, owner, admin]
    
    SelectNewRole --> UpdateRole[Cập nhật user.role trong DB]
    UpdateRole --> ShowSuccess[Hiển thị thông báo thành công]
    
    SelectUserDelete --> CheckSelfDelete{User = chính mình?}
    CheckSelfDelete -->|Có| ShowError2[Hiển thị lỗi: Không thể xóa chính mình]
    CheckSelfDelete -->|Không| ConfirmDelete{Xác nhận xóa?}
    
    ConfirmDelete -->|Hủy| DisplayUsers
    ConfirmDelete -->|Xác nhận| CascadeDelete[Thực hiện cascade delete: Xóa locations của user, Xóa vouchers của locations, Xóa reviews của user/locations]
    
    CascadeDelete --> DeleteUser[Xóa user khỏi DB]
    DeleteUser --> ShowSuccess2[Hiển thị thông báo xóa thành công]
    
    ViewUserDetail --> DisplayUsers
    ShowError --> DisplayUsers
    ShowError2 --> DisplayUsers
    ShowSuccess --> DisplayUsers
    ShowSuccess2 --> DisplayUsers
```
Hình 16 – Activity: Admin quản lý User

### 10.8 Activity: Tìm kiếm Location

```mermaid
flowchart TD
    Start([User vào trang locations]) --> ShowSearchForm[Hiển thị form tìm kiếm]
    ShowSearchForm --> UserInput[User nhập từ khóa]
    
    UserInput --> HasKeyword{Có từ khóa?}
    HasKeyword -->|Không| LoadAll[Load tất cả locations có phân trang]
    HasKeyword -->|Có| ApplyTextSearch[Sử dụng MongoDB text search trên: name, description, address, city, keywords]
    
    ApplyTextSearch --> HasFilter{Có filter theo type?}
    HasFilter -->|Có| ApplyTypeFilter[Filter theo type: restaurant, cafe, tourist_spot]
    HasFilter -->|Không| DisplayResults[Hiển thị kết quả tìm kiếm]
    
    ApplyTypeFilter --> DisplayResults
    LoadAll --> DisplayResults
    
    DisplayResults --> UserClickLocation{User click location?}
    UserClickLocation -->|Có| ViewDetail[Chuyển đến trang chi tiết location]
    UserClickLocation -->|Không| End([Kết thúc])
    
    ViewDetail --> LoadLocationDetail[Load thông tin location]
    LoadLocationDetail --> LoadReviews[Load reviews của location sắp xếp theo createdAt DESC]
    LoadReviews --> LoadVouchers[Load vouchers đang hoạt động của location]
    LoadVouchers --> DisplayDetail[Hiển thị trang chi tiết: thông tin, rating, reviews, vouchers]
    
    DisplayDetail --> End
```
Hình 17 – Activity: Tìm kiếm Location