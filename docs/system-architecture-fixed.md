# Voucher Management System - System Architecture

## 1. System Overview Diagram (Sơ đồ tổng quan hệ thống)

```mermaid
graph TB
    subgraph "Frontend Layer"
        A["EJS Templates<br/>Mẫu EJS"] --> B["Bootstrap 5 UI<br/>Giao diện Bootstrap"]
        B --> C["User Interface<br/>Giao diện người dùng"]
    end
    
    subgraph "Backend Layer"
        D["Express.js Server<br/>Máy chủ Express"] --> E["Controllers<br/>Bộ điều khiển"]
        E --> F["Business Logic<br/>Logic nghiệp vụ"]
        F --> G["Authentication Middleware<br/>Middleware xác thực"]
    end
    
    subgraph "Data Layer"
        H["MongoDB Database<br/>Cơ sở dữ liệu MongoDB"] --> I["User Collection<br/>Bộ sưu tập người dùng"]
        H --> J["Location Collection<br/>Bộ sưu tập địa điểm"]
        H --> K["Voucher Collection<br/>Bộ sưu tập voucher"]
        H --> L["Review Collection<br/>Bộ sưu tập đánh giá"]
    end
    
    subgraph "User Roles"
        M["Admin User<br/>Người dùng quản trị"] --> N["Full System Access<br/>Truy cập toàn hệ thống"]
        O["Owner User<br/>Người dùng chủ quán"] --> P["Business Management<br/>Quản lý kinh doanh"]
        Q["Regular User<br/>Người dùng thường"] --> R["Browse & Claim Vouchers<br/>Duyệt và nhận voucher"]
    end
    
    C --> D
    D --> H
    M --> C
    O --> C
    Q --> C
```

## 2. Database Schema Diagram (Sơ đồ cấu trúc cơ sở dữ liệu)

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String username
        String email
        String password
        String role
        Date createdAt
    }
    
    LOCATION {
        ObjectId _id PK
        String name
        String description
        String address
        String type
        Number rating
        String imageUrl
        ObjectId owner FK
        Date createdAt
    }
    
    VOUCHER {
        ObjectId _id PK
        String code
        Number discountPct
        Number quantityTotal
        Number quantityClaimed
        Date startDate
        Date endDate
        ObjectId location FK
        String conditions
        Date createdAt
    }
    
    REVIEW {
        ObjectId _id PK
        ObjectId user FK
        ObjectId location FK
        Number rating
        String comment
        Date createdAt
    }
    
    USER ||--o{ LOCATION : "owns"
    LOCATION ||--o{ VOUCHER : "has"
    LOCATION ||--o{ REVIEW : "receives"
    USER ||--o{ REVIEW : "writes"
```

## 3. User Flow Diagram (Sơ đồ luồng người dùng)

```mermaid
flowchart TD
    A["User visits website<br/>Người dùng truy cập website"] --> B{"User logged in?<br/>Đã đăng nhập?"}
    B -->|No| C["Show Login/Register<br/>Hiển thị đăng nhập/đăng ký"]
    B -->|Yes| D["Show Dashboard<br/>Hiển thị bảng điều khiển"]
    
    C --> E["Register/Login<br/>Đăng ký/Đăng nhập"]
    E --> F{"Login successful?<br/>Đăng nhập thành công?"}
    F -->|No| C
    F -->|Yes| D
    
    D --> G{"User Role?<br/>Vai trò người dùng?"}
    G -->|Admin| H["Admin Dashboard<br/>Bảng điều khiển quản trị"]
    G -->|Owner| I["Owner Dashboard<br/>Bảng điều khiển chủ quán"]
    G -->|User| J["User Dashboard<br/>Bảng điều khiển người dùng"]
    
    H --> K["Manage Users<br/>Quản lý người dùng"]
    H --> L["Manage Locations<br/>Quản lý địa điểm"]
    H --> M["Manage Vouchers<br/>Quản lý voucher"]
    H --> N["Manage Reviews<br/>Quản lý đánh giá"]
    
    I --> O["My Locations<br/>Địa điểm của tôi"]
    I --> P["My Vouchers<br/>Voucher của tôi"]
    I --> Q["Create Location<br/>Tạo địa điểm"]
    I --> R["Create Voucher<br/>Tạo voucher"]
    
    J --> S["Browse Locations<br/>Duyệt địa điểm"]
    J --> T["Browse Vouchers<br/>Duyệt voucher"]
    J --> U["Claim Voucher<br/>Nhận voucher"]
    J --> V["Write Review<br/>Viết đánh giá"]
```

## 4. Component Architecture Diagram (Sơ đồ kiến trúc component)

```mermaid
graph TB
    subgraph "Presentation Layer"
        A["Home Page<br/>Trang chủ"] --> B["Location Detail<br/>Chi tiết địa điểm"]
        A --> C["Voucher List<br/>Danh sách voucher"]
        A --> D["Login/Register<br/>Đăng nhập/Đăng ký"]
        A --> E["User Profile<br/>Hồ sơ người dùng"]
    end
    
    subgraph "Admin Interface"
        F["Admin Dashboard<br/>Bảng điều khiển quản trị"] --> G["User Management<br/>Quản lý người dùng"]
        F --> H["Location Management<br/>Quản lý địa điểm"]
        F --> I["Voucher Management<br/>Quản lý voucher"]
        F --> J["Review Management<br/>Quản lý đánh giá"]
    end
    
    subgraph "Owner Interface"
        K["Owner Dashboard<br/>Bảng điều khiển chủ quán"] --> L["My Locations<br/>Địa điểm của tôi"]
        K --> M["My Vouchers<br/>Voucher của tôi"]
        K --> N["Create Location<br/>Tạo địa điểm"]
        K --> O["Create Voucher<br/>Tạo voucher"]
    end
    
    subgraph "Business Logic Layer"
        P["User Controller<br/>Bộ điều khiển người dùng"] --> Q["Authentication<br/>Xác thực"]
        R["Location Controller<br/>Bộ điều khiển địa điểm"] --> S["CRUD Operations<br/>Thao tác CRUD"]
        T["Voucher Controller<br/>Bộ điều khiển voucher"] --> U["Claim Logic<br/>Logic nhận voucher"]
        V["Review Controller<br/>Bộ điều khiển đánh giá"] --> W["Rating System<br/>Hệ thống đánh giá"]
    end
    
    subgraph "Data Access Layer"
        X["User Model<br/>Mô hình người dùng"] --> Y["User Schema<br/>Lược đồ người dùng"]
        Z["Location Model<br/>Mô hình địa điểm"] --> AA["Location Schema<br/>Lược đồ địa điểm"]
        BB["Voucher Model<br/>Mô hình voucher"] --> CC["Voucher Schema<br/>Lược đồ voucher"]
        DD["Review Model<br/>Mô hình đánh giá"] --> EE["Review Schema<br/>Lược đồ đánh giá"]
    end
    
    A --> P
    F --> P
    K --> R
    P --> X
    R --> Z
    T --> BB
    V --> DD
```

## 5. Authentication Flow Diagram (Sơ đồ luồng xác thực)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database
    participant S as Session
    
    U->>F: Access protected route
    F->>B: Check authentication
    B->>S: Verify session
    S-->>B: Session status
    B-->>F: Authentication result
    
    alt Not authenticated
        F->>U: Redirect to login
        U->>F: Enter credentials
        F->>B: POST /login
        B->>D: Validate credentials
        D-->>B: User data
        B->>S: Create session
        S-->>B: Session created
        B-->>F: Success response
        F->>U: Redirect to dashboard
    else Authenticated
        F->>U: Show protected content
    end
```

## 6. Voucher Claim Process Diagram (Sơ đồ quy trình nhận voucher)

```mermaid
flowchart TD
    A["User clicks Claim Voucher<br/>Người dùng nhấn Nhận voucher"] --> B{"User logged in?<br/>Đã đăng nhập?"}
    B -->|No| C["Redirect to Login<br/>Chuyển hướng đến đăng nhập"]
    B -->|Yes| D["Check voucher validity<br/>Kiểm tra tính hợp lệ của voucher"]
    
    D --> E{"Voucher active?<br/>Voucher có hoạt động?"}
    E -->|No| F["Show error message<br/>Hiển thị thông báo lỗi"]
    E -->|Yes| G{"Quantity available?<br/>Còn số lượng?"}
    
    G -->|No| H["Show sold out message<br/>Hiển thị thông báo hết hàng"]
    G -->|Yes| I["Update quantityClaimed<br/>Cập nhật số lượng đã nhận"]
    
    I --> J["Save to database<br/>Lưu vào cơ sở dữ liệu"]
    J --> K["Show success message<br/>Hiển thị thông báo thành công"]
    K --> L["Update UI<br/>Cập nhật giao diện"]
    
    C --> M["User logs in<br/>Người dùng đăng nhập"]
    M --> A
```

## 7. File Structure Diagram (Sơ đồ cấu trúc thư mục)

```mermaid
graph TD
    A["Project Root<br/>Thư mục gốc"] --> B["src/<br/>Mã nguồn"]
    A --> C["package.json<br/>Cấu hình dự án"]
    A --> D["README.md<br/>Tài liệu"]
    A --> E[".gitignore<br/>Bỏ qua Git"]
    
    B --> F["models/<br/>Mô hình"]
    B --> G["controllers/<br/>Bộ điều khiển"]
    B --> H["routes/<br/>Định tuyến"]
    B --> I["views/<br/>Giao diện"]
    B --> J["middleware/<br/>Middleware"]
    B --> K["config/<br/>Cấu hình"]
    B --> L["public/<br/>Tài nguyên công khai"]
    B --> M["app.js<br/>Ứng dụng chính"]
    
    F --> N["user.model.js<br/>Mô hình người dùng"]
    F --> O["location.model.js<br/>Mô hình địa điểm"]
    F --> P["voucher.model.js<br/>Mô hình voucher"]
    F --> Q["review.model.js<br/>Mô hình đánh giá"]
    
    G --> R["user.controller.js<br/>Bộ điều khiển người dùng"]
    G --> S["location.controller.js<br/>Bộ điều khiển địa điểm"]
    G --> T["voucher.controller.js<br/>Bộ điều khiển voucher"]
    G --> U["review.controller.js<br/>Bộ điều khiển đánh giá"]
    
    H --> V["user.routes.js<br/>Định tuyến người dùng"]
    H --> W["location.routes.js<br/>Định tuyến địa điểm"]
    H --> X["voucher.routes.js<br/>Định tuyến voucher"]
    H --> Y["admin.routes.js<br/>Định tuyến quản trị"]
    
    I --> Z["pages/<br/>Trang"]
    I --> AA["admin/<br/>Quản trị"]
    I --> BB["owner/<br/>Chủ quán"]
    I --> CC["layout.ejs<br/>Bố cục"]
    
    L --> DD["css/<br/>Biểu định kiểu"]
    L --> EE["js/<br/>JavaScript"]
    L --> FF["images/<br/>Hình ảnh"]
```

## 8. API Endpoints Diagram (Sơ đồ các endpoint API)

```mermaid
graph LR
    subgraph "Public Routes"
        A["GET /"] --> B["Home Page<br/>Trang chủ"]
        C["GET /locations"] --> D["Location List<br/>Danh sách địa điểm"]
        E["GET /vouchers"] --> F["Voucher List<br/>Danh sách voucher"]
        G["GET /auth"] --> H["Login/Register<br/>Đăng nhập/Đăng ký"]
    end
    
    subgraph "User Routes"
        I["POST /login"] --> J["User Login<br/>Đăng nhập người dùng"]
        K["POST /register"] --> L["User Registration<br/>Đăng ký người dùng"]
        M["POST /logout"] --> N["User Logout<br/>Đăng xuất người dùng"]
        O["GET /profile"] --> P["User Profile<br/>Hồ sơ người dùng"]
    end
    
    subgraph "Voucher Routes"
        Q["POST /vouchers/:id/claim"] --> R["Claim Voucher<br/>Nhận voucher"]
    end
    
    subgraph "Admin Routes"
        S["GET /admin/dashboard"] --> T["Admin Dashboard<br/>Bảng điều khiển quản trị"]
        U["GET /admin/users"] --> V["User Management<br/>Quản lý người dùng"]
        W["GET /admin/locations"] --> X["Location Management<br/>Quản lý địa điểm"]
        Y["GET /admin/vouchers"] --> Z["Voucher Management<br/>Quản lý voucher"]
    end
    
    subgraph "Owner Routes"
        AA["GET /owner/dashboard"] --> BB["Owner Dashboard<br/>Bảng điều khiển chủ quán"]
        CC["GET /owner/locations"] --> DD["My Locations<br/>Địa điểm của tôi"]
        EE["GET /owner/vouchers"] --> FF["My Vouchers<br/>Voucher của tôi"]
    end
```

## Cách sử dụng:

1. **Copy code Mermaid** từ các diagram trên
2. **Paste vào Mermaid editor** (mermaid.live) hoặc VS Code với Mermaid extension
3. **Render diagram** để xem kết quả
4. **Export** thành PNG/SVG nếu cần

## Các diagram này bao gồm:
- ✅ **System Architecture**: Kiến trúc tổng thể
- ✅ **Database Schema**: Cấu trúc cơ sở dữ liệu
- ✅ **User Flow**: Luồng người dùng
- ✅ **Component Architecture**: Kiến trúc component
- ✅ **Authentication Flow**: Luồng xác thực
- ✅ **Voucher Claim Process**: Quy trình claim voucher
- ✅ **File Structure**: Cấu trúc thư mục
- ✅ **API Endpoints**: Các endpoint API

Bạn có thể sử dụng các diagram này để:
- 📊 **Trình bày project** trong báo cáo
- 🔧 **Hiểu rõ kiến trúc** hệ thống
- 📝 **Tài liệu hóa** cho team
- 🎯 **Phân tích** và cải thiện hệ thống
