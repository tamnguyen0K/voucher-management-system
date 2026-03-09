# PHÂN TÍCH HỆ THỐNG THEO DFD & PHÂN RÃ CHỨC NĂNG

Hệ thống hiện tại là một **nền tảng web quản lý địa điểm, voucher và review** cho phép:

- Người dùng (User) duyệt địa điểm, claim voucher, viết đánh giá.
- Chủ địa điểm (Owner) quản lý địa điểm/voucher của mình.
- Quản trị viên (Admin) giám sát, kiểm duyệt và quản lý dữ liệu toàn hệ thống.

Tài liệu này tập trung **nhìn hệ thống dưới góc độ phân tích nghiệp vụ cổ điển**: 

- Lưu đồ hệ thống thủ công (chưa có phần mềm).
- Sơ đồ phân rã chức năng.
- Sơ đồ dòng chảy dữ liệu (DFD) theo các mức: ngữ cảnh (mức 0), mức 1 và mức 2.
- Chỉ ra mối liên hệ giữa hệ thống với tổ chức và các hệ thống bên ngoài.

---

## 1. Lưu đồ hệ thống thủ công (chưa có phần mềm)

Giả sử trước khi xây dựng hệ thống, doanh nghiệp vận hành chương trình voucher và thu thập phản hồi **bằng cách thủ công** (giấy tờ, Excel, gọi điện, v.v.).

```mermaid
flowchart TD
    %% Các tác nhân chính
    KH[Khách hàng] 
    NVD[Nhân viên địa điểm - Lễ tân Thu ngân]
    QL[Quản lý chi nhánh]
    MKT[Bộ phận Marketing Công ty]

    %% Quy trình thủ công
    KH -->|Nhìn thấy quảng cáo, tờ rơi| KH_NhanThongTin[Nắm thông tin khuyến mãi/voucher giấy]
    KH_NhanThongTin --> KH_DenDiaDiem[Đến trực tiếp địa điểm]
    KH_DenDiaDiem --> KH_DuaVoucher[Đưa voucher giấy/ảnh mã QR cho nhân viên]

    KH_DuaVoucher --> NVD_KiemTra[Nhân viên kiểm tra điều kiện voucher]
    NVD_KiemTra --> NVD_HopLe{Voucher hợp lệ?}

    NVD_HopLe -->|Không| NVD_TuChoi[Thông báo không áp dụng được và giải thích lý do]
    NVD_TuChoi --> KH_RaVe[Khách thanh toán bình thường hoặc bỏ đi]

    NVD_HopLe -->|Có| NVD_GiamGia[Áp dụng giảm giá trên hóa đơn]
    NVD_GiamGia --> NVD_GhiSo[Nhân viên ghi vào sổ tay/Excel:mã voucher, hóa đơn, ngày giờ]

    NVD_GhiSo --> CuoiNgay[Cuối ngày/tuần]
    CuoiNgay --> QL_TongHop[Quản lý chi nhánh tổng hợp số liệu từ nhiều file Excel]
    QL_TongHop --> QL_GuiBaoCao[Quản lý gửi báo cáo cho Bộ phận Marketing]

    QL_GuiBaoCao --> MKT_TongHop[MKT tổng hợp voucher đã dùng,doanh thu, hiệu quả từng địa điểm]
    MKT_TongHop --> MKT_QuyetDinh[Ra quyết định điều chỉnh chương trình khuyến mãi]

    %% Thu thập phản hồi
    KH_DenDiaDiem --> KH_PhanHoi[Khách góp ý trực tiếp/viết giấy góp ý]
    KH_PhanHoi --> NVD_GhiNhan[Nhân viên ghi nhận ý kiến vào sổ/phiếu]
    NVD_GhiNhan --> QL_TongHopYK[Quản lý tổng hợp ý kiến khách hàng]
    QL_TongHopYK --> MKT_XuLyYK[Marketing/ban quản lý đọc, phân loại, xử lý phản hồi]
```

**Nhận xét**:
- Nhiều bước **thủ công**, phụ thuộc vào giấy tờ/Excel rời rạc.
- Dữ liệu phân tán, **khó thống kê theo thời gian thực**.
- Khó truy vết chi tiết từng khách hàng/voucher, dễ sai sót khi tổng hợp.

### 1.2. Lưu đồ chi tiết DFD – Luồng Claim Voucher

Học theo mẫu DFD xử lý đơn hàng, vẽ lại luồng **claim voucher** của project với các bộ phận chức năng, kho dữ liệu và điểm quyết định.

| Ký hiệu | Ý nghĩa |
|---------|---------|
| Hình chữ nhật bo góc | Tiến trình xử lý |
| Hình thoi | Điểm quyết định |
| Hình bình hành | Tài liệu / dữ liệu vào ra |
| Hình chữ nhật mở | Kho dữ liệu |

```mermaid
flowchart LR
    subgraph EXT[Thực thể ngoài]
        USER[NGƯỜI DÙNG]
    end

    subgraph BP1[BỘ PHẬN TIẾP NHẬN]
        P1_1[Tiếp nhận yêu cầu claim]
        P1_2[Xác thực đăng nhập và role]
    end

    subgraph BP2[KIỂM TRA ĐIỀU KIỆN]
        P2_1[Kiểm tra thời gian voucher]
        P2_2[Kiểm tra số lượng còn lại]
        P2_3[Kiểm tra đã claim chưa]
    end

    subgraph BP3[CẬP NHẬT DỮ LIỆU]
        P3_1[Thêm vào claimedVouchers]
        P3_2[Tăng quantityClaimed]
    end

    subgraph BP4[XÁC NHẬN]
        P4_1[Ghi nhận mã voucher]
        P4_2[Trả kết quả cho User]
    end

    subgraph DS[Kho dữ liệu]
        D1[(User)]
        D2[(Voucher)]
    end

    USER -->|Yêu cầu claim voucherId| P1_1
    P1_1 --> P1_2
    P1_2 -->|userId voucherId| D1
    P1_2 -->|voucherId| D2
    D1 --> P2_1
    D2 --> P2_1
    P2_1 --> Q1{Voucher còn hiệu lực}
    Q1 -->|Không| USER
    Q1 -->|Có| P2_2
    P2_2 --> Q2{Còn số lượng}
    Q2 -->|Không| USER
    Q2 -->|Có| P2_3
    P2_3 --> Q3{Đã claim trước đó}
    Q3 -->|Có| USER
    Q3 -->|Không| P3_1
    P3_1 --> P3_2
    P3_2 --> D1
    P3_2 --> D2
    P3_2 --> P4_1
    P4_1 --> P4_2
    P4_2 -->|Mã voucher thành công| USER
```

**Tài liệu / dữ liệu luân chuyển:**

| Từ | Đến | Nội dung |
|----|-----|----------|
| User | Bộ phận tiếp nhận | Yêu cầu claim voucherId |
| Kho User | Kiểm tra | userId, claimedVouchers |
| Kho Voucher | Kiểm tra | startDate, endDate, quantityClaimed, quantityTotal |
| Cập nhật | Kho User | Thêm bản ghi claimedVouchers |
| Cập nhật | Kho Voucher | Tăng quantityClaimed |
| Xác nhận | User | Mã voucher, thông báo thành công |

---

### 1.3. Lưu đồ chi tiết DFD – Luồng Viết Review

```mermaid
flowchart LR
    subgraph EXT2[Thực thể ngoài]
        USER2[NGƯỜI DÙNG]
    end

    subgraph BP_R1[TIẾP NHẬN REVIEW]
        R1_1[Nhận rating comment media]
        R1_2[Validate input]
    end

    subgraph BP_R2[KIỂM TRA GIỚI HẠN]
        R2_1[Đếm số review đã viết]
        R2_2{Đủ 3 lần chưa}
    end

    subgraph BP_R3[LƯU TRỮ]
        R3_1[Upload media vào disk]
        R3_2[Tạo bản ghi Review]
        R3_3[Cập nhật rating địa điểm]
    end

    subgraph DS_R[Kho dữ liệu]
        DR1[(Review)]
        DR2[(Location)]
    end

    USER2 -->|rating comment files| R1_1
    R1_1 --> R1_2
    R1_2 --> R2_1
    R2_1 --> DR1
    DR1 --> R2_2
    R2_2 -->|Đã đủ| USER2
    R2_2 -->|Chưa đủ| R3_1
    R3_1 --> R3_2
    R3_2 --> DR1
    R3_2 --> R3_3
    R3_3 --> DR2
    R3_3 -->|Thông báo thành công| USER2
```

**Tài liệu / dữ liệu luân chuyển:**

| Từ | Đến | Nội dung |
|----|-----|----------|
| User | Tiếp nhận | rating 1-5, comment, media files |
| Kho Review | Kiểm tra | count user location |
| Lưu trữ | Kho Review | user, location, rating, comment, media |
| Lưu trữ | Kho Location | rating trung bình mới |
| Kết quả | User | Thông báo tạo review thành công |

---

### 1.4. Lưu đồ chi tiết DFD – Luồng Owner Tạo Địa Điểm

```mermaid
flowchart LR
    subgraph EXT3[Thực thể ngoài]
        OWNER[CHỦ ĐỊA ĐIỂM]
    end

    subgraph BP_L1[TIẾP NHẬN]
        L1_1[Nhận thông tin địa điểm]
        L1_2[Validate bắt buộc]
    end

    subgraph BP_L2[CHUẨN HÓA]
        L2_1[Infer features menu keywords]
        L2_2[Xử lý priceLevel priceRange]
    end

    subgraph BP_L3[LƯU TRỮ]
        L3_1[Tạo bản ghi Location]
        L3_2[Gắn owner]
    end

    subgraph DS_L[Kho dữ liệu]
        DL1[(Location)]
        DL2[(User)]
    end

    OWNER -->|name description address type city| L1_1
    L1_1 --> L1_2
    L1_2 -->|description đủ 80 ký tự| L2_1
    L2_1 --> L2_2
    L2_2 --> L3_1
    L3_1 --> L3_2
    L3_2 --> DL1
    L3_2 --> DL2
    L3_2 -->|Xác nhận tạo thành công| OWNER
```

**Tài liệu / dữ liệu luân chuyển:**

| Từ | Đến | Nội dung |
|----|-----|----------|
| Owner | Tiếp nhận | name, description, address, type, city, priceRange |
| Chuẩn hóa | Lưu trữ | features, menuHighlights, keywords, priceLevel |
| Lưu trữ | Kho Location | Bản ghi Location mới |
| Lưu trữ | Kho User | owner = userId |
| Kết quả | Owner | Thông báo tạo địa điểm thành công |

---

## 2. Sơ đồ phân rã chức năng (Function Decomposition)

Ở mức cao nhất, hệ thống được xem như **một chức năng tổng quát**:

> HỆ THỐNG QUẢN LÝ VOUCHER, ĐỊA ĐIỂM VÀ ĐÁNH GIÁ KHÁCH HÀNG

Sơ đồ phân rã chức năng thể hiện **cây chức năng** từ tổng quát đến chi tiết.

```mermaid
flowchart TD
    ROOT[HỆ THỐNG QUẢN LÝ VOUCHER và ĐỊA ĐIỂM]
    F1[1. Quản lý tài khoản và phân quyền]
    F2[2. Quản lý địa điểm]
    F3[3. Quản lý voucher]
    F4[4. Quản lý review và phản hồi]
    F5[5. Chatbot và hỗ trợ tìm kiếm thông minh]
    F6[6. Quản trị và báo cáo hệ thống]
    ROOT --> F1
    ROOT --> F2
    ROOT --> F3
    ROOT --> F4
    ROOT --> F5
    ROOT --> F6
    F1 --> F1a[1.1 Đăng ký đăng nhập đăng xuất]
    F1 --> F1b[1.2 Quản lý hồ sơ cá nhân]
    F1 --> F1c[1.3 Phân quyền User Owner Admin]
    F2 --> F2a[2.1 Tạo Sửa Xóa địa điểm]
    F2 --> F2b[2.2 Lưu trữ metadata]
    F2 --> F2c[2.3 Tìm kiếm và lọc địa điểm]
    F3 --> F3a[3.1 Tạo Sửa Xóa voucher]
    F3 --> F3b[3.2 Quản lý số lượng và thời gian]
    F3 --> F3c[3.3 Cho phép User claim voucher]
    F4 --> F4a[4.1 User viết review]
    F4 --> F4b[4.2 Giới hạn số lần review]
    F4 --> F4c[4.3 Cập nhật rating địa điểm]
    F5 --> F5a[5.1 Nhận câu hỏi từ người dùng]
    F5 --> F5b[5.2 Gửi yêu cầu tới n8n Workflow]
    F6 --> F6a[6.1 Dashboard quản trị]
    F6 --> F6b[6.2 Thống kê hệ thống]
```

**Ghi chú**:
- Sơ đồ trên là **cây chức năng logic**, không phải sơ đồ module code.
- Từng nhánh có thể tiếp tục phân rã chi tiết hơn (ví dụ 3.3 claim voucher → kiểm tra điều kiện, cập nhật user, cập nhật voucher, ghi log,...).

### 2.1. Phần quan trọng nhất của mỗi chức năng

| Chức năng | Phần quan trọng nhất |
|-----------|----------------------|
| **1. Quản lý tài khoản và phân quyền** | Xác thực đăng nhập, phân quyền User / Owner / Admin |
| **2. Quản lý địa điểm** | CRUD địa điểm, tìm kiếm và lọc theo loại/giá |
| **3. Quản lý voucher** | User claim voucher, kiểm tra điều kiện và số lượng |
| **4. Quản lý review và phản hồi** | User viết review kèm media, cập nhật rating địa điểm tự động |
| **5. Chatbot và tìm kiếm thông minh** | Nhận câu hỏi, gửi n8n, gợi ý địa điểm kèm link |
| **6. Quản trị và báo cáo** | Dashboard thống kê, quản lý user/location/voucher/review |

```mermaid
flowchart LR
    subgraph CORE[Phần cốt lõi mỗi chức năng]
        F1[Xác thực và phân quyền]
        F2[CRUD địa điểm và tìm kiếm]
        F3[Claim voucher có kiểm tra]
        F4[Review và cập nhật rating]
        F5[Chatbot gợi ý qua n8n]
        F6[Dashboard và quản trị]
    end
```

### 2.2. Hiện thực phần quan trọng trong codebase

| Chức năng | Route / API | Controller | Model | Logic chính |
|-----------|-------------|------------|-------|-------------|
| **1. Xác thực và phân quyền** | `POST /login`, `POST /register`, `POST /logout` | `user.controller` | `User` | `login`, `register`, middleware `requireAuth`, `requireAdmin`, `requireOwner` |
| **2. CRUD địa điểm và tìm kiếm** | `GET /locations`, `GET /locations/:id`, `POST /owner/locations`, `PUT /owner/locations/:id` | `location.controller` | `Location` | `getAllLocations` (text search) `createLocation`, `updateLocation`, `deleteLocation` |
| **3. Claim voucher có kiểm tra** | `POST /vouchers/:voucherId/claim` | `voucher.controller` | `Voucher`, `User` | `claimVoucher` kiểm tra thời gian, số lượng, tránh claim trùng |
| **4. Review và cập nhật rating** | `POST /locations/:locationId/reviews` | `review.controller` | `Review`, `Location` | `createReview` upload media, giới hạn 3 review/user/location, cập nhật `location.rating` |
| **5. Chatbot gợi ý qua n8n** | `POST /api/chatbot/query` | `chatbot.routes` | - | Gọi n8n webhook, `linkifyLocations` trong câu trả lời |
| **6. Dashboard và quản trị** | `GET /admin/dashboard`, `/admin/users`, `/admin/locations`, `/admin/vouchers`, `/admin/reviews` | `admin.routes`, `review.controller` | `User`, `Location`, `Voucher`, `Review` | Thống kê, CRUD user/location/voucher/review |

**Cấu trúc file hiện thực:**

```
src/
├── routes/
│   ├── user.routes.js      → 1. Xác thực, đăng ký, đăng nhập
│   ├── location.routes.js  → 2. CRUD địa điểm, 4. Tạo review
│   ├── voucher.routes.js   → 3. Claim voucher, CRUD voucher
│   ├── chatbot.routes.js   → 5. Chatbot query
│   └── admin.routes.js     → 6. Dashboard, quản trị
├── controllers/
│   ├── user.controller.js
│   ├── location.controller.js
│   ├── voucher.controller.js
│   ├── review.controller.js
│   └── owner.controller.js
├── middleware/
│   └── auth.js             → requireAuth, requireAdmin, requireOwner
└── models/
    ├── user.model.js
    ├── location.model.js
    ├── voucher.model.js
    └── review.model.js
```

---

## 3. Mối liên hệ với tổ chức & hệ thống bên ngoài

Phần này mô tả **hệ sinh thái xung quanh hệ thống**: các phòng ban trong tổ chức, các tác nhân bên ngoài và hệ thống tích hợp.

```mermaid
graph LR
    subgraph ORG["TỔ CHỨC / DOANH NGHIỆP"]
        MKT[Bộ phận Marketing]
        CSKH[Bộ phận CSKH]
        IT[Đội ngũ IT / Vận hành hệ thống]
        SALE[Đội Kinh doanh / Đối tác địa điểm]
    end

    subgraph SYSTEM["HỆ THỐNG WEB QUẢN LÝ VOUCHER và ĐỊA ĐIỂM"]
        APP[Ứng dụng Web Node.js Express]
        DB[CSDL MongoDB]
        UPLOAD[Kho file upload ảnh video review]
    end

    subgraph EXTERNAL["HỆ THỐNG BÊN NGOÀI"]
        N8N[n8n Workflow Chatbot AI Assistant]
        EMAIL[Email Provider SMTP dịch vụ ngoài]
        MAPS[Google Maps / Dịch vụ bản đồ]
    end

    %% Tác nhân bên ngoài
    USER[Người dùng cuối User] 
    OWNER[Chủ địa điểm Owner]
    ADMIN[Quản trị viên Admin]

    %% Quan hệ
    USER -->|Truy cập web claim voucher gửi review chat với chatbot| APP
    OWNER -->|Quản lý địa điểm và voucher| APP
    ADMIN -->|Quản trị dữ liệu, xem báo cáo| APP

    MKT -->|Xem báo cáo hiệu quả chiến dịch đề xuất cấu hình| APP
    CSKH -->|Xử lý khiếu nại, xem lịch sử tương tác| APP
    IT -->|Triển khai, bảo trì, backup| APP
    SALE -->|Hợp tác với chủ địa điểm cập nhật thông tin đối tác| APP

    APP --> DB
    APP --> UPLOAD

    APP -->|Gửi/nhận request phân tích câu hỏi| N8N
    APP -->|Gửi email thông báo nếu có| EMAIL
    APP -->|Nhúng/bản đồ địa điểm| MAPS
```

---

## 4. Sơ đồ dòng chảy dữ liệu (DFD) – Mức ngữ cảnh (Level 0)

Ở **mức ngữ cảnh (Level 0)**, hệ thống được xem như **một tiến trình duy nhất**: “Hệ thống quản lý voucher & địa điểm”. Các tác nhân bên ngoài gửi yêu cầu và nhận kết quả, dữ liệu được lưu trong các kho dữ liệu chính.

```mermaid
flowchart LR
    %% Tác nhân ngoài
    U[Người dùng User]
    O[Chủ địa điểm Owner]
    A[Quản trị viên Admin]
    N8N[Hệ thống Chatbot n8n]

    %% Hệ thống như một tiến trình duy nhất
    P0[HỆ THỐNG QUẢN LÝ VOUCHER và ĐỊA ĐIỂM]

    %% Kho dữ liệu chính
    D_USER[Kho dữ liệu User]
    D_LOC[Kho dữ liệu Địa điểm]
    D_VOUCHER[Kho dữ liệu Voucher]
    D_REVIEW[Kho dữ liệu Review]

    %% Luồng dữ liệu từ/đến tác nhân
    U -->|Yêu cầu: đăng ký/đăng nhập,xem địa điểm, claim voucher,gửi review, hỏi chatbot| P0
    P0 -->|Phản hồi: trang web, danh sách địa điểm,kết quả claim, kết quả chatbot| U

    O -->|Yêu cầu: quản lý địa điểm,quản lý voucher, xem review| P0
    P0 -->|Báo cáo và màn hình quản lý| O

    A -->|Yêu cầu: quản trị users,địa điểm, voucher, review,xem thống kê| P0
    P0 -->|Báo cáo tổng quan và chi tiết| A

    N8N <-->|Trao đổi câu hỏi/trả lời chatbot| P0

    %% Luồng giữa tiến trình và kho dữ liệu
    P0 -->|Ghi đọc thông tin user| D_USER
    P0 -->|Ghi đọc dữ liệu địa điểm| D_LOC
    P0 -->|Ghi đọc dữ liệu voucher| D_VOUCHER
    P0 -->|Ghi đọc dữ liệu review| D_REVIEW
```

---

## 5. DFD Mức 1 – Phân rã các tiến trình chính

Ở **mức 1**, tiến trình tổng `HỆ THỐNG QUẢN LÝ VOUCHER & ĐỊA ĐIỂM` được phân rã thành các nhóm xử lý chính:

1. Quản lý người dùng & phân quyền.
2. Quản lý địa điểm.
3. Quản lý voucher & claim.
4. Quản lý review.
5. Chatbot & tìm kiếm thông minh.
6. Quản trị & báo cáo.

```mermaid
flowchart LR
    %% Tác nhân ngoài
    U[User]
    O[Owner]
    A[Admin]
    N8N[Hệ thống Chatbot n8n]

    %% Các tiến trình mức 1
    P1_1[1. Quản lý Người dùng]
    P1_2[2. Quản lý Địa điểm]
    P1_3[3. Quản lý Voucher và Claim]
    P1_4[4. Quản lý Review]
    P1_5[5. Chatbot và Tìm kiếm thông minh]
    P1_6[6. Quản trị và Báo cáo]

    %% Kho dữ liệu
    D_USER[D1 User]
    D_LOC[D2 Địa điểm]
    D_VOUCHER[D3 Voucher]
    D_REVIEW[D4 Review]

    %% Luồng dữ liệu với tác nhân
    U -->|Thông tin đăng ký/đăng nhập| P1_1
    P1_1 -->|Thông tin tài khoản, session| U

    U -->|Yêu cầu xem địa điểm| P1_2
    P1_2 -->|Danh sách/chi tiết địa điểm| U

    U -->|Yêu cầu claim voucher| P1_3
    P1_3 -->|Kết quả claim, mã voucher| U

    U -->|Review rating comment media| P1_4
    P1_4 -->|Kết quả tạo sửa xóa review| U

    U -->|Câu hỏi, từ khóa tìm kiếm| P1_5
    P1_5 -->|Câu trả lời, gợi ý địa điểm| U

    O -->|Quản lý địa điểm| P1_2
    O -->|Quản lý voucher| P1_3
    O -->|Xem review địa điểm của mình| P1_4
    P1_2 -->|Báo cáo địa điểm, dữ liệu thống kê| O
    P1_3 -->|Báo cáo hiệu quả voucher| O
    P1_4 -->|Danh sách review| O

    A -->|Quản trị user, location,voucher, review| P1_1
    A --> P1_2
    A --> P1_3
    A --> P1_4
    A -->|Xem dashboard, thống kê| P1_6
    P1_6 -->|Báo cáo tổng hợp| A

    %% Liên kết với n8n
    P1_5 <-->|Câu hỏi/Trả lời đã xử lý| N8N

    %% Luồng dữ liệu với kho
    P1_1 -->|Tạo Cập nhật Tra cứu user| D_USER
    P1_2 -->|Tạo Cập nhật Tra cứu địa điểm| D_LOC
    P1_3 -->|Tạo Cập nhật Tra cứu voucher| D_VOUCHER
    P1_3 -->|Cập nhật claim trong user| D_USER
    P1_4 -->|Tạo Cập nhật Tra cứu review| D_REVIEW
    P1_4 -->|Cập nhật rating địa điểm| D_LOC
    P1_6 -->|Đọc tổng hợp từ D1 đến D4| D_USER
    P1_6 --> D_LOC
    P1_6 --> D_VOUCHER
    P1_6 --> D_REVIEW
```

---

## 6. DFD Mức 2 – Phân rã tiến trình “3. Quản lý Voucher & Claim”

Tiến trình `3. Quản lý Voucher & Claim` là một trong các nghiệp vụ quan trọng nhất của hệ thống, được phân rã chi tiết hơn ở **mức 2**.

```mermaid
flowchart LR
    %% Tác nhân và kho
    U[User]
    O[Owner]
    A[Admin]

    D_USER[D1 User]
    D_LOC[D2 Địa điểm]
    D_VOUCHER[D3 Voucher]

    %% Các tiến trình con Mức 2
    P3_1[3.1 Tạo hoặc Cập nhật voucher]
    P3_2[3.2 Kiểm tra điều kiện voucher]
    P3_3[3.3 Xử lý yêu cầu claim voucher]
    P3_4[3.4 Cập nhật số liệu và lịch sử claim]

    %% Owner/Admin quản lý voucher
    O -->|Thông tin tạo sửa xóa voucher code discount quantity thời gian location| P3_1
    A -->|Tạo sửa xóa voucher đặc biệt| P3_1

    P3_1 -->|Ghi đọc thông tin voucher| D_VOUCHER
    P3_1 -->|Thông báo kết quả tạo sửa xóa| O
    P3_1 -->|Thông báo kết quả thao tác| A

    %% User yêu cầu claim
    U -->|Yêu cầu claim voucher thông tin user và id voucher| P3_3

    %% P3_3 dùng P3_2 để kiểm tra
    P3_3 -->|Gửi voucherId, userId, thời gian hiện tại| P3_2
    P3_2 -->|Kết quả Hợp lệ hoặc Không hợp lệ và Lý do chi tiết| P3_3

    %% P3_2 thao tác với dữ liệu
    P3_2 -->|Đọc thông tin voucher| D_VOUCHER
    P3_2 -->|Đọc thông tin user voucher đã claim| D_USER

    %% Nếu hợp lệ, P3_3 -> P3_4
    P3_3 -->|Yêu cầu cập nhật claim userId voucherId| P3_4

    %% P3_4 cập nhật kho dữ liệu
    P3_4 -->|Cập nhật claimedVouchers của user| D_USER
    P3_4 -->|Tăng quantityClaimed| D_VOUCHER

    %% Phản hồi lại user
    P3_3 -->|Kết quả claim thành công hoặc thất bại mã voucher thông báo lỗi| U
```

**Diễn giải các tiến trình mức 2**:
- **P3.1 Tạo/Cập nhật voucher**: nhận thông tin từ Owner/Admin, kiểm tra trùng mã, validate thời gian và số lượng, sau đó lưu vào `D3: Voucher`.
- **P3.2 Kiểm tra điều kiện voucher**: đọc `D3: Voucher` và `D1: User` để đảm bảo voucher còn hiệu lực, còn số lượng, user chưa claim trước đó,...
- **P3.3 Xử lý yêu cầu claim voucher**: là trung tâm tiếp nhận yêu cầu claim từ User, gọi P3.2 để kiểm tra, nếu pass thì yêu cầu P3.4 cập nhật dữ liệu; sau đó gửi kết quả lại cho User.
- **P3.4 Cập nhật số liệu & lịch sử claim**: ghi nhận claim vào `claimedVouchers` của user và cập nhật `quantityClaimed` của voucher, phục vụ cho các báo cáo sau này.

---

## 7. Gợi ý DFD Mức 2 cho các tiến trình khác

Tùy yêu cầu đồ án, bạn có thể **vẽ thêm DFD mức 2** cho các tiến trình quan trọng khác. Ví dụ:

- **Tiến trình 2. Quản lý Địa điểm**:
  - 2.1 Tiếp nhận thông tin địa điểm mới.
  - 2.2 Chuẩn hóa & làm giàu metadata (giá, city, features, menu, keywords).
  - 2.3 Lưu địa điểm & cập nhật chỉ mục tìm kiếm.
  - 2.4 Phục vụ tra cứu & hiển thị danh sách/chi tiết.

- **Tiến trình 4. Quản lý Review**:
  - 4.1 Kiểm tra quyền và giới hạn số review.
  - 4.2 Xử lý upload media & lưu file.
  - 4.3 Lưu review & cập nhật rating địa điểm.
  - 4.4 Xóa review & dọn dẹp file media.

Việc phân rã sâu hơn nên **bám sát logic đã triển khai trong code** (controllers, models) để đảm bảo tài liệu phân tích thống nhất với hệ thống thực tế.