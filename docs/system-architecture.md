# Voucher Management System - System Architecture

## 1. System Overview Diagram (Sơ đồ tổng quan hệ thống)

```mermaid
graph TB
    subgraph "Frontend Layer"
        A["EJS Templates"] --> B["Bootstrap 5 UI"]
        B --> C["User Interface"]
    end
    
    subgraph "Backend Layer"
        D["Express.js Server"] --> E["Controllers"]
        E --> F["Business Logic"]
        F --> G["Authentication Middleware"]
    end
    
    subgraph "Data Layer"
        H["MongoDB Database"] --> I["User Collection"]
        H --> J["Location Collection"]
        H --> K["Voucher Collection"]
        H --> L["Review Collection"]
    end
    
    subgraph "User Roles"
        M["Admin User"] --> N["Full System Access"]
        O["Owner User"] --> P["Business Management"]
        Q["Regular User"] --> R["Browse & Claim Vouchers"]
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
    A["User visits website"] --> B{"User logged in?"}
    B -->|No| C["Show Login/Register"]
    B -->|Yes| D["Show Dashboard"]
    
    C --> E["Register/Login"]
    E --> F{"Login successful?"}
    F -->|No| C
    F -->|Yes| D
    
    D --> G{"User Role?"}
    G -->|Admin| H["Admin Dashboard"]
    G -->|Owner| I["Owner Dashboard"]
    G -->|User| J["User Dashboard"]
    
    H --> K["Manage Users"]
    H --> L["Manage Locations"]
    H --> M["Manage Vouchers"]
    H --> N["Manage Reviews"]
    
    I --> O["My Locations"]
    I --> P["My Vouchers"]
    I --> Q["Create Location"]
    I --> R["Create Voucher"]
    
    J --> S["Browse Locations"]
    J --> T["Browse Vouchers"]
    J --> U["Claim Voucher"]
    J --> V["Write Review"]
```

## 4. Component Architecture Diagram (Sơ đồ kiến trúc component)

```mermaid
graph TB
    subgraph "Presentation Layer"
        A["Home Page"] --> B["Location Detail"]
        A --> C["Voucher List"]
        A --> D["Login/Register"]
        A --> E["User Profile"]
    end
    
    subgraph "Admin Interface"
        F["Admin Dashboard"] --> G["User Management"]
        F --> H["Location Management"]
        F --> I["Voucher Management"]
        F --> J["Review Management"]
    end
    
    subgraph "Owner Interface"
        K["Owner Dashboard"] --> L["My Locations"]
        K --> M["My Vouchers"]
        K --> N["Create Location"]
        K --> O["Create Voucher"]
    end
    
    subgraph "Business Logic Layer"
        P["User Controller"] --> Q["Authentication"]
        R["Location Controller"] --> S["CRUD Operations"]
        T["Voucher Controller"] --> U["Claim Logic"]
        V["Review Controller"] --> W["Rating System"]
    end
    
    subgraph "Data Access Layer"
        X["User Model"] --> Y["User Schema"]
        Z["Location Model"] --> AA["Location Schema"]
        BB["Voucher Model"] --> CC["Voucher Schema"]
        DD["Review Model"] --> EE["Review Schema"]
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
    A["User clicks Claim Voucher"] --> B{"User logged in?"}
    B -->|No| C["Redirect to Login"]
    B -->|Yes| D["Check voucher validity"]
    
    D --> E{"Voucher active?"}
    E -->|No| F["Show error message"]
    E -->|Yes| G{"Quantity available?"}
    
    G -->|No| H["Show sold out message"]
    G -->|Yes| I["Update quantityClaimed"]
    
    I --> J["Save to database"]
    J --> K["Show success message"]
    K --> L["Update UI"]
    
    C --> M["User logs in"]
    M --> A
```

## 7. File Structure Diagram (Sơ đồ cấu trúc thư mục)

```mermaid
graph TD
    A["Project Root"] --> B["src/"]
    A --> C["package.json"]
    A --> D["README.md"]
    A --> E[".gitignore"]
    
    B --> F["models/"]
    B --> G["controllers/"]
    B --> H["routes/"]
    B --> I["views/"]
    B --> J["middleware/"]
    B --> K["config/"]
    B --> L["public/"]
    B --> M["app.js"]
    
    F --> N["user.model.js"]
    F --> O["location.model.js"]
    F --> P["voucher.model.js"]
    F --> Q["review.model.js"]
    
    G --> R["user.controller.js"]
    G --> S["location.controller.js"]
    G --> T["voucher.controller.js"]
    G --> U["review.controller.js"]
    
    H --> V["user.routes.js"]
    H --> W["location.routes.js"]
    H --> X["voucher.routes.js"]
    H --> Y["admin.routes.js"]
    
    I --> Z["pages/"]
    I --> AA["admin/"]
    I --> BB["owner/"]
    I --> CC["layout.ejs"]
    
    L --> DD["css/"]
    L --> EE["js/"]
    L --> FF["images/"]
```

## 8. API Endpoints Diagram (Sơ đồ các endpoint API)

```mermaid
graph LR
    subgraph "Public Routes"
        A["GET /"] --> B["Home Page"]
        C["GET /locations"] --> D["Location List"]
        E["GET /vouchers"] --> F["Voucher List"]
        G["GET /auth"] --> H["Login/Register"]
    end
    
    subgraph "User Routes"
        I["POST /login"] --> J["User Login"]
        K["POST /register"] --> L["User Registration"]
        M["POST /logout"] --> N["User Logout"]
        O["GET /profile"] --> P["User Profile"]
    end
    
    subgraph "Voucher Routes"
        Q["POST /vouchers/:id/claim"] --> R["Claim Voucher"]
    end
    
    subgraph "Admin Routes"
        S["GET /admin/dashboard"] --> T["Admin Dashboard"]
        U["GET /admin/users"] --> V["User Management"]
        W["GET /admin/locations"] --> X["Location Management"]
        Y["GET /admin/vouchers"] --> Z["Voucher Management"]
    end
    
    subgraph "Owner Routes"
        AA["GET /owner/dashboard"] --> BB["Owner Dashboard"]
        CC["GET /owner/locations"] --> DD["My Locations"]
        EE["GET /owner/vouchers"] --> FF["My Vouchers"]
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
