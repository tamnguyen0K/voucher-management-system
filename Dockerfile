# Dockerfile cho Voucher Management System
FROM node:18-alpine

# Đặt thư mục làm việc
WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Tạo thư mục uploads nếu chưa có
RUN mkdir -p src/uploads/reviews

# Expose port
EXPOSE 3000

# Command để chạy ứng dụng
CMD ["npm", "start"]

