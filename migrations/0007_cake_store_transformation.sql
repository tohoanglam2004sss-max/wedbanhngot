-- Migration 0007: Chuyển đổi sang hệ thống Tiệm Bánh Kem Sweet Cake & Bakery

-- 1. Bổ sung các cột mới cho bảng products
ALTER TABLE products ADD COLUMN original_price_vnd INTEGER;
ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 50 CHECK (stock >= 0);
ALTER TABLE products ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1));
ALTER TABLE products ADD COLUMN is_bestseller INTEGER NOT NULL DEFAULT 0 CHECK (is_bestseller IN (0, 1));
ALTER TABLE products ADD COLUMN is_new INTEGER NOT NULL DEFAULT 0 CHECK (is_new IN (0, 1));

-- 2. Bổ sung các cột mới cho bảng order_items
ALTER TABLE order_items ADD COLUMN cake_message TEXT DEFAULT '';

-- 3. Tạo lại bảng orders để mở rộng trạng thái: new, confirmed, preparing, shipping, ready, completed, cancelled
PRAGMA defer_foreign_keys = ON;

CREATE TABLE orders_v2 (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('pickup', 'delivery')),
  delivery_address TEXT,
  customer_note TEXT NOT NULL DEFAULT '',
  subtotal_vnd INTEGER NOT NULL CHECK (subtotal_vnd >= 0),
  delivery_fee_vnd INTEGER NOT NULL CHECK (delivery_fee_vnd >= 0),
  total_vnd INTEGER NOT NULL CHECK (total_vnd >= 0),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'preparing', 'shipping', 'ready', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivery_street TEXT,
  delivery_ward_code TEXT,
  delivery_district_id INTEGER,
  delivery_ward_name TEXT,
  delivery_district_name TEXT,
  delivery_date TEXT,
  delivery_time TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'vnpay')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  payment_transaction_no TEXT,
  paid_at TEXT,
  ghn_order_code TEXT,
  ghn_status TEXT,
  ghn_fee_vnd INTEGER,
  shipping_label_url TEXT,
  shipping_created_at TEXT
);

INSERT INTO orders_v2 (
  id, customer_name, customer_phone, fulfillment_type, delivery_address,
  customer_note, subtotal_vnd, delivery_fee_vnd, total_vnd, status, created_at,
  delivery_street, delivery_ward_code, delivery_district_id, delivery_ward_name,
  delivery_district_name, payment_method, payment_status,
  payment_transaction_no, paid_at, ghn_order_code, ghn_status, ghn_fee_vnd,
  shipping_label_url, shipping_created_at
)
SELECT
  id, customer_name, customer_phone, fulfillment_type, delivery_address,
  customer_note, subtotal_vnd, delivery_fee_vnd, total_vnd, status, created_at,
  delivery_street, delivery_ward_code, delivery_district_id, delivery_ward_name,
  delivery_district_name, payment_method, payment_status,
  payment_transaction_no, paid_at, ghn_order_code, ghn_status, ghn_fee_vnd,
  shipping_label_url, shipping_created_at
FROM orders;

DROP TABLE orders;
ALTER TABLE orders_v2 RENAME TO orders;

CREATE INDEX orders_created_at_idx ON orders (created_at DESC);
CREATE UNIQUE INDEX orders_ghn_order_code_idx ON orders (ghn_order_code) WHERE ghn_order_code IS NOT NULL;

-- 4. Ẩn toàn bộ sản phẩm cà phê và đồ uống cũ
UPDATE products SET is_available = 0;

-- 5. Seed danh mục bánh kem chuẩn 6 nhóm theo yêu cầu
INSERT INTO products (
  id, name, description, category, category_label, price_vnd, original_price_vnd,
  stock, is_available, is_featured, is_bestseller, is_new, weight_g
) VALUES
  ('banh-kem-dau-tay-kem-tuoi', 'Bánh kem dâu tây kem tươi', 'Bánh cốt chiffon vani mềm xốp kết hợp kem tươi New Zealand béo nhẹ và dâu tây Đà Lạt tươi mọng.', 'banh-sinh-nhat', 'Bánh sinh nhật', 350000, 380000, 25, 1, 1, 1, 0, 800),
  ('banh-kem-socola-belgium', 'Bánh kem Socola Bỉ đậm vị', 'Cốt gato socola ẩm mịn xen kẽ lớp ganache socola Bỉ 70% nguyên chất, vị ngọt đắng quyến rũ.', 'banh-sinh-nhat', 'Bánh sinh nhật', 380000, 420000, 20, 1, 1, 0, 0, 850),
  ('banh-kem-tra-xanh-matcha', 'Bánh sinh nhật Matcha Uji đậu đỏ', 'Matcha Uji Nhật Bản nguyên chất hòa quyện kem tươi thanh mát và lớp nhân đậu đỏ bùi ngọt dịu.', 'banh-sinh-nhat', 'Bánh sinh nhật', 360000, NULL, 18, 1, 0, 0, 1, 750),
  ('banh-kem-hoa-hong-vai', 'Bánh kem hoa hồng trái vải', 'Hương hoa hồng hữu cơ dịu nhẹ kết hợp thịt vải tươi mọng nước và kem phô mai mascarpone mềm tan.', 'banh-sinh-nhat', 'Bánh sinh nhật', 390000, 430000, 15, 1, 1, 0, 0, 800),
  ('bento-cake-vintage-pastel', 'Bento Cake Hàn Quốc Vintage', 'Bánh kem mini size 10cm xinh xắn, tone màu pastel ngọt ngào, nhận vẽ chữ và họa tiết theo yêu cầu.', 'banh-kem-mini', 'Bánh kem mini', 135000, 150000, 40, 1, 0, 1, 1, 300),
  ('bento-cake-socola-marshmallow', 'Bento Cake Socola Marshmallow', 'Cốt chiffon socola ẩm mịn, kem cheese béo dịu và topping kẹo dẻo marshmallow nướng thơm lừng.', 'banh-kem-mini', 'Bánh kem mini', 140000, NULL, 30, 1, 0, 0, 0, 300),
  ('bento-cake-tra-sua-tran-chau', 'Bento Trà Sữa Trân Châu Phô Mai', 'Cốt trà Earl Grey thơm ngát, sốt kem phô mai chảy béo ngậy kèm hộp trân châu hoàng kim dẻo mềm.', 'banh-kem-mini', 'Bánh kem mini', 145000, NULL, 35, 1, 1, 1, 0, 320),
  ('mousse-xoai-chanh-leo', 'Mousse xoài chanh leo nhiệt đới', 'Lớp mousse chanh leo chua thanh mát lạnh kết hợp thạch xoài cát chín mọng, thanh nhẹ không ngấy.', 'banh-mousse', 'Bánh mousse', 320000, 350000, 20, 1, 1, 1, 0, 650),
  ('mousse-viet-quat-kem-cheese', 'Mousse việt quất kem cheese', 'Phô mai kem béo dịu kết hợp mứt việt quất rừng chua ngọt và đế bánh quy bơ giòn thơm.', 'banh-mousse', 'Bánh mousse', 340000, NULL, 22, 1, 1, 0, 0, 700),
  ('mousse-bap-non-kem-dua', 'Mousse bắp non sữa dừa', 'Vị ngọt thanh tự nhiên từ bắp ngọt non xay nhuyễn kết hợp thạch dừa non giòn sần sật độc đáo.', 'banh-mousse', 'Bánh mousse', 310000, NULL, 15, 1, 0, 0, 1, 650),
  ('tiramisu-y-truyen-thong', 'Tiramisu Ý truyền thống', 'Bánh Savoiardi ngâm cà phê và rượu rum cao cấp, xen kẽ kem Mascarpone béo mịn rắc bột cacao Bỉ.', 'banh-tiramisu', 'Bánh tiramisu', 320000, 360000, 30, 1, 1, 1, 0, 700),
  ('tiramisu-matcha-mascarpone', 'Tiramisu Matcha Kyoto', 'Biến tấu trà xanh Nhật Bản với kem Mascarpone dịu ngọt, đượm vị trà xanh thanh nhã nguyên bản.', 'banh-tiramisu', 'Bánh tiramisu', 330000, NULL, 20, 1, 0, 0, 0, 700),
  ('tiramisu-hop-thiec-cao-cap', 'Tiramisu hộp thiếc cao cấp (450g)', 'Hộp thiếc sang trọng giữ lạnh hoàn hảo, tiện lợi mang đi dã ngoại hoặc làm món quà ngọt ngào.', 'banh-tiramisu', 'Bánh tiramisu', 175000, NULL, 40, 1, 0, 0, 1, 450),
  ('banh-kem-tao-hinh-fondant', 'Bánh kem tạo hình Fondant', 'Thiết kế riêng theo concept tiệc, tạo hình nhân vật, động vật hoặc hoa đường 3D thủ công sắc sảo.', 'banh-theo-yeu-cau', 'Bánh theo yêu cầu', 550000, 600000, 10, 1, 1, 0, 0, 1200),
  ('banh-kem-tang-sang-trong', 'Bánh kem 2 tầng sự kiện & tiệc cưới', 'Thiết kế 2 tầng sang trọng trang trí hoa tươi hoặc vương miện ngọc trai, cốt bánh tùy chọn theo sở thích.', 'banh-theo-yeu-cau', 'Bánh theo yêu cầu', 850000, NULL, 8, 1, 1, 0, 0, 2200),
  ('banh-kem-ve-hinh-theo-anh', 'Bánh kem vẽ hình chibi theo ảnh', 'Nghệ nhân phác họa chân dung chibi dễ thương của người nhận từ ảnh thật kèm lời chúc ý nghĩa.', 'banh-theo-yeu-cau', 'Bánh theo yêu cầu', 420000, NULL, 12, 1, 0, 1, 1, 900),
  ('set-nen-so-nhu-vang', 'Set nến số nhũ vàng kim cao cấp', 'Nến số mạ nhũ vàng lấp lánh (chọn từ số 0-9), ngọn lửa sáng đẹp và an toàn cho thực phẩm.', 'phu-kien', 'Phụ kiện trang trí', 15000, NULL, 150, 1, 0, 1, 0, 50),
  ('set-mu-sinh-nhat-pastel', 'Set 5 mũ sinh nhật phong cách Hàn Quốc', 'Bộ 5 mũ chóp giấy họa tiết chấm bi và caro pastel xinh xắn, phụ kiện chụp hình sống ảo lung linh.', 'phu-kien', 'Phụ kiện trang trí', 25000, NULL, 100, 1, 0, 0, 0, 80),
  ('hop-phu-kien-dao-dia-nen', 'Hộp phụ kiện dao, dĩa & nến xoắn', 'Gồm 1 dao cắt bánh mica cao cấp, 5 dĩa giấy chịu nhiệt, 5 thìa gỗ và 1 vỉ nến xoắn sắc màu.', 'phu-kien', 'Phụ kiện trang trí', 20000, NULL, 200, 1, 1, 1, 0, 100),
  ('bang-topper-chuc-mung', 'Topper Happy Birthday mạ vàng', 'Topper mica cao cấp cắm trang trí mặt bánh với nhiều mẫu chữ thư pháp ánh vàng bắt mắt.', 'phu-kien', 'Phụ kiện trang trí', 18000, NULL, 150, 1, 0, 0, 0, 30);

