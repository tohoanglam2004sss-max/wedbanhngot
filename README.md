# Sweet Cake Bakery — Website Thương Mại Điện Tử Bán Bánh Kem

Website thương mại điện tử chuyên bán bánh kem hiện đại, tinh tế, ngọt ngào với phong cách pastel (hồng, kem, trắng), thiết kế tối ưu hóa trải nghiệm trên điện thoại (Mobile-first). Đầy đủ frontend và backend HonoJS, cơ sở dữ liệu Cloudflare D1 (SQLite) và lưu trữ hình ảnh trên Cloudflare R2.

---

## 1. Công nghệ & Kiến trúc

- **Backend**: [HonoJS](https://hono.dev/) chạy trên Cloudflare Workers.
- **Database**: Cloudflare D1 (SQLite) lưu trữ danh mục, bánh kem, đơn hàng và chi tiết món bánh.
- **Image Storage**: Cloudflare R2 (`PRODUCT_IMAGES`) lưu trữ ảnh tải lên từ trang quản trị; kèm bộ vector SVG minh họa pastel sắc nét, tải tức thì.
- **Frontend**: Mobile-first Responsive HTML5 / CSS3 / Vanilla JavaScript hiện đại, không phụ thuộc thư viện nặng.
- **Thanh toán & Vận chuyển**: Hỗ trợ COD (Thanh toán khi nhận bánh), Chuyển khoản VietQR tự động, VNPay và giao hàng GHN (hoặc phí giao hàng tiêu chuẩn của quán).

---

## 2. Danh mục sản phẩm & Tính năng

### 6 Danh mục bánh kem chuẩn:
1. **Bánh sinh nhật (`banh-sinh-nhat`)**: Bánh kem dâu tây, socola Bỉ, matcha Uji, hoa hồng trái vải...
2. **Bánh kem mini / Bento cake (`banh-kem-mini`)**: Bento Hàn Quốc vintage, bento trà sữa trân châu, bento marshmallow...
3. **Bánh mousse tươi (`banh-mousse`)**: Mousse xoài chanh leo, việt quất kem cheese, bắp non sữa dừa...
4. **Bánh Tiramisu (`banh-tiramisu`)**: Tiramisu Ý truyền thống, tiramisu matcha Kyoto, tiramisu hộp thiếc tiện lợi...
5. **Bánh theo yêu cầu (`banh-theo-yeu-cau`)**: Bánh tạo hình Fondant 3D, bánh tầng sự kiện, bánh vẽ chibi theo ảnh thật...
6. **Phụ kiện trang trí bánh (`phu-kien`)**: Nến số nhũ vàng kim, mũ sinh nhật pastel, topper mica mạ vàng, dao dĩa dĩa giấy nến xoắn...

### Chức năng chính phía khách hàng:
- **Tìm kiếm & Lọc bánh**: Tìm theo tên, phân loại theo danh mục, sắp xếp theo giá (tăng/giảm), lọc bánh bán chạy / mới ra lò / nổi bật.
- **Modal chi tiết sản phẩm**: Xem ảnh lớn, mô tả nguyên liệu, giá bán, giá gốc khuyến mãi, số lượng tồn kho.
- **Ghi chú chữ trên bánh**: Cho phép khách nhập trực tiếp lời chúc / chữ viết lên bánh (Ví dụ: "Happy Birthday Mẹ yêu").
- **Giỏ hàng lưu trữ tự động**: Lưu trên thiết bị (`localStorage`), tăng giảm số lượng, kiểm tra tồn kho, xem lại nội dung chữ viết.
- **Đặt bánh & Hẹn giờ giao**: Chọn ngày nhận bánh (`min="hôm nay"`), chọn khung giờ nhận bánh (Sáng, Trưa, Chiều, Tối), chọn hình thức nhận bánh (giao tận nơi hoặc lấy tại tiệm).
- **Thanh toán**: Tiền mặt khi nhận bánh, Chuyển khoản VietQR (tạo QR code tự động kèm nội dung `CAKE-XXXXXX`), hoặc thanh toán VNPay.

### Chức năng phía Quản trị viên (`/admin.html`):
- **Đăng nhập an toàn**: Xác thực bằng `ADMIN_TOKEN` qua HTTP Header Bearer.
- **Quản lý đơn hàng**:
  - Xem danh sách đơn mới nhất, lọc theo trạng thái: Mới, Đã xác nhận, Đang làm bánh, Đang giao, Sẵn sàng, Hoàn thành, Đã hủy.
  - Xem chi tiết lịch hẹn nhận bánh (ngày, giờ), thông tin khách, nội dung chữ viết lên từng bánh.
  - Cập nhật trạng thái đơn hàng (tự động hoàn kho nếu hủy đơn).
  - Xác nhận đã nhận tiền (Mark Paid) đối với đơn COD / chuyển khoản.
- **Quản lý bánh kem**:
  - Thêm mẫu bánh mới, chỉnh sửa thông tin bánh (tên, mô tả, danh mục, giá bán, giá gốc, tồn kho, trọng lượng, tag nổi bật/bán chạy/mới).
  - Ẩn hoặc kích hoạt lại sản phẩm.
  - Tải ảnh bánh thật trực tiếp lên Cloudflare R2 bucket.

---

## 3. Hướng dẫn chạy Local & Kiểm thử

Yêu cầu môi trường: **Node.js 20.19+ hoặc 22.12+**.

### Bước 1: Cài đặt thư viện
```bash
npm install
```

### Bước 2: Áp dụng migrations vào Cloudflare D1 Local
```bash
npm run db:migrate:local
```

### Bước 3: Chạy ứng dụng kiểm thử
```bash
# Kiểm tra TypeScript typecheck
npm run typecheck

# Chạy toàn bộ Unit Tests & Integration Tests
npm test
```

### Bước 4: Khởi động máy chủ phát triển
```bash
npm run dev
```
Mở trình duyệt truy cập:
- Trang mua bánh: `http://localhost:8787/`
- Trang quản trị tiệm: `http://localhost:8787/admin.html`

> **Lưu ý cấu hình Admin Local**: Tạo file `.dev.vars` ở thư mục gốc project (đã nằm trong `.gitignore`) và thêm token quản trị:
> ```ini
> ADMIN_TOKEN=admin_secret_token_2026
> ```

---

## 4. Danh sách các API Endpoint

| Phương thức | Đường dẫn API | Mô tả | Quyền truy cập |
|---|---|---|---|
| `GET` | `/api/health` | Kiểm tra trạng thái máy chủ | Công khai |
| `GET` | `/api/config` | Cấu hình cửa hàng, phương thức thanh toán | Công khai |
| `GET` | `/api/categories` | Lấy danh mục bánh kem kèm số lượng | Công khai |
| `GET` | `/api/products` | Danh sách bánh (lọc category, search, sort, tags) | Công khai |
| `GET` | `/api/products/:productId` | Chi tiết một mẫu bánh | Công khai |
| `GET` | `/api/images/:productId` | Phục vụ ảnh sản phẩm lưu từ Cloudflare R2 | Công khai |
| `POST` | `/api/shipping/quote` | Báo cước phí giao hàng GHN | Công khai |
| `POST` | `/api/orders` | Đặt bánh mới (kiểm tra tồn kho, trừ kho, lưu D1) | Công khai |
| `GET` | `/api/orders/:orderId` | Xem trạng thái đơn hàng | Công khai |
| `POST` | `/api/admin/session` | Xác thực đăng nhập quản trị viên | Admin |
| `GET` | `/api/admin/orders` | Danh sách 100 đơn hàng gần nhất (kèm lọc trạng thái) | Admin |
| `GET` | `/api/admin/orders/:orderId`| Xem chi tiết đơn hàng (ngày giờ hẹn, chữ viết bánh)| Admin |
| `PATCH` | `/api/admin/orders/:orderId/status`| Đổi trạng thái đơn (new, confirmed, preparing, shipping...)| Admin |
| `POST` | `/api/admin/orders/:orderId/mark-paid`| Xác nhận đã thanh toán tiền mặt / chuyển khoản | Admin |
| `GET` | `/api/admin/products` | Lấy toàn bộ bánh (kể cả bánh đã ẩn) | Admin |
| `POST` | `/api/admin/products` | Tạo mẫu bánh kem mới | Admin |
| `PUT` | `/api/admin/products/:productId` | Cập nhật thông tin bánh kem | Admin |
| `DELETE`| `/api/admin/products/:productId` | Ẩn hoặc xóa mẫu bánh | Admin |
| `POST` | `/api/admin/products/:productId/image` | Tải ảnh lên Cloudflare R2 | Admin |
