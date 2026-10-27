import { Hono } from "hono";
import { z } from "zod";
import {
  createGhnShipment,
  getGhnShipment,
  ghnIsConfigured,
  listGhnDistricts,
  listGhnProvinces,
  listGhnWards,
  quoteGhnShipping,
  totalWeight,
  type GhnEnv,
  type GhnParcelItem
} from "./ghn";
import {
  adminStatusSchema,
  orderRequestSchema,
  productUpsertSchema,
  shippingQuoteSchema
} from "./validation";
import {
  createVnpayPaymentUrl,
  verifyVnpayCallback,
  vnpayIsConfigured,
  type VnpayEnv
} from "./vnpay";

interface Env extends GhnEnv, VnpayEnv {
  DB: D1Database;
  PRODUCT_IMAGES: R2Bucket;
  ADMIN_TOKEN?: string;
  DELIVERY_FEE_VND?: string;
  BANK_NAME?: string;
  BANK_BIN?: string;
  BANK_ACCOUNT_NUMBER?: string;
  BANK_ACCOUNT_HOLDER?: string;
  AI_TOKEN?: string;
}

interface ProductRow {
  id: string;
  name: string;
  description: string;
  category: string;
  category_label: string;
  price_vnd: number;
  original_price_vnd: number | null;
  image_key: string | null;
  weight_g: number;
  stock: number;
  is_available: number;
  is_featured: number;
  is_bestseller: number;
  is_new: number;
}

interface OrderItemRow {
  product_id: string;
  product_name: string;
  unit_price_vnd: number;
  quantity: number;
  line_total_vnd: number;
  weight_g: number;
  cake_message?: string | null;
}

interface AdminOrderRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  fulfillment_type: string;
  delivery_street: string | null;
  delivery_ward_code: string | null;
  delivery_district_id: number | null;
  delivery_ward_name: string | null;
  delivery_district_name: string | null;
  delivery_date: string | null;
  delivery_time: string | null;
  customer_note: string;
  subtotal_vnd: number;
  total_vnd: number;
  status: string;
  payment_method: string;
  payment_status: string;
  payment_transaction_no: string | null;
  paid_at: string | null;
  ghn_order_code: string | null;
  ghn_status: string | null;
  ghn_fee_vnd: number | null;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (context) => context.json({ status: "ok", service: "sweet-cake-bakery" }));

app.get("/api/config", (context) =>
  context.json({
    storeName: "Sweet Cake Bakery",
    storeSlogan: "Bánh Kem Ngọt Ngào & Tinh Tế",
    ghnEnabled: ghnIsConfigured(context.env),
    vnpayEnabled: vnpayIsConfigured(context.env),
    manualDeliveryFee: getManualDeliveryFee(context.env),
    bankTransfer: getBankTransferDetails(context.env)
  })
);

app.get("/api/ghn/provinces", async (context) => {
  if (!ghnIsConfigured(context.env)) {
    return context.json({ error: "Dịch vụ giao hàng GHN chưa được cấu hình." }, 503);
  }
  return context.json(await listGhnProvinces(context.env));
});

app.get("/api/ghn/districts", async (context) => {
  if (!ghnIsConfigured(context.env)) {
    return context.json({ error: "Dịch vụ giao hàng GHN chưa được cấu hình." }, 503);
  }
  const provinceId = Number(context.req.query("provinceId"));
  if (!Number.isSafeInteger(provinceId) || provinceId < 1) {
    return context.json({ error: "Mã tỉnh/thành không hợp lệ." }, 400);
  }
  return context.json(await listGhnDistricts(context.env, provinceId));
});

app.get("/api/ghn/wards", async (context) => {
  if (!ghnIsConfigured(context.env)) {
    return context.json({ error: "Dịch vụ giao hàng GHN chưa được cấu hình." }, 503);
  }
  const districtId = Number(context.req.query("districtId"));
  if (!Number.isSafeInteger(districtId) || districtId < 1) {
    return context.json({ error: "Mã quận/huyện không hợp lệ." }, 400);
  }
  return context.json(await listGhnWards(context.env, districtId));
});

app.get("/api/categories", async (context) => {
  const { results = [] } = await context.env.DB.prepare(
    `SELECT category, category_label, COUNT(*) as count
     FROM products
     WHERE is_available = 1
     GROUP BY category, category_label
     ORDER BY category_label`
  ).all<{ category: string; category_label: string; count: number }>();

  return context.json(
    results.map((c) => ({
      id: c.category,
      name: c.category_label,
      count: c.count
    }))
  );
});

app.get("/api/products", async (context) => {
  const category = context.req.query("category");
  const search = context.req.query("search")?.trim().toLowerCase();
  const sort = context.req.query("sort");
  const featured = context.req.query("featured");
  const bestseller = context.req.query("bestseller");
  const isNew = context.req.query("new");

  let sql = `SELECT id, name, description, category, category_label, price_vnd,
                    original_price_vnd, image_key, weight_g, stock, is_available,
                    is_featured, is_bestseller, is_new
             FROM products
             WHERE is_available = 1`;
  const params: unknown[] = [];

  if (category && category !== "all") {
    sql += ` AND category = ?`;
    params.push(category);
  }

  if (search) {
    sql += ` AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (featured === "1" || featured === "true") {
    sql += ` AND is_featured = 1`;
  }

  if (bestseller === "1" || bestseller === "true") {
    sql += ` AND is_bestseller = 1`;
  }

  if (isNew === "1" || isNew === "true") {
    sql += ` AND is_new = 1`;
  }

  if (sort === "price_asc") {
    sql += ` ORDER BY price_vnd ASC`;
  } else if (sort === "price_desc") {
    sql += ` ORDER BY price_vnd DESC`;
  } else if (sort === "newest") {
    sql += ` ORDER BY is_new DESC, created_at DESC`;
  } else if (sort === "bestseller") {
    sql += ` ORDER BY is_bestseller DESC, name ASC`;
  } else {
    sql += ` ORDER BY is_featured DESC, is_bestseller DESC, category, name ASC`;
  }

  const statement = context.env.DB.prepare(sql);
  const { results = [] } = params.length
    ? await statement.bind(...params).all<ProductRow>()
    : await statement.all<ProductRow>();

  return context.json(
    results.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      categoryLabel: product.category_label,
      price: product.price_vnd,
      originalPrice: product.original_price_vnd,
      weightG: product.weight_g,
      stock: product.stock,
      isAvailable: product.is_available === 1,
      isFeatured: product.is_featured === 1,
      isBestseller: product.is_bestseller === 1,
      isNew: product.is_new === 1,
      imageUrl: product.image_key
        ? `/api/images/${encodeURIComponent(product.id)}`
        : `/images/${product.id}.jpg`
    }))
  );
});

app.get("/api/products/:productId", async (context) => {
  const productId = context.req.param("productId");
  const product = await context.env.DB.prepare(
    `SELECT id, name, description, category, category_label, price_vnd,
            original_price_vnd, image_key, weight_g, stock, is_available,
            is_featured, is_bestseller, is_new
     FROM products
     WHERE id = ? AND is_available = 1`
  )
    .bind(productId)
    .first<ProductRow>();

  if (!product) {
    return context.json({ error: "Không tìm thấy bánh kem này." }, 404);
  }

  return context.json({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    categoryLabel: product.category_label,
    price: product.price_vnd,
    originalPrice: product.original_price_vnd,
    weightG: product.weight_g,
    stock: product.stock,
    isAvailable: product.is_available === 1,
    isFeatured: product.is_featured === 1,
    isBestseller: product.is_bestseller === 1,
    isNew: product.is_new === 1,
    imageUrl: product.image_key
      ? `/api/images/${encodeURIComponent(product.id)}`
      : `/images/${product.id}.jpg`
  });
});

app.get("/api/images/:productId", async (context) => {
  const product = await context.env.DB.prepare(
    "SELECT image_key FROM products WHERE id = ?"
  )
    .bind(context.req.param("productId"))
    .first<{ image_key: string | null }>();

  if (!product?.image_key) {
    return context.json({ error: "Không tìm thấy ảnh sản phẩm." }, 404);
  }

  const image = await context.env.PRODUCT_IMAGES.get(product.image_key);
  if (!image) {
    return context.json({ error: "Ảnh sản phẩm hiện không khả dụng." }, 404);
  }

  return context.body(image.body, 200, {
    "Content-Type": image.httpMetadata?.contentType ?? "application/octet-stream",
    "Cache-Control": "public, max-age=86400",
    ETag: image.httpEtag
  });
});

app.post("/api/shipping/quote", async (context) => {
  if (!ghnIsConfigured(context.env)) {
    return context.json({ error: "Dịch vụ giao hàng GHN chưa được cấu hình." }, 503);
  }
  const body: unknown = await context.req.json().catch(() => null);
  const parsed = shippingQuoteSchema.safeParse(body);
  if (!parsed.success) return context.json({ error: "Thông tin nhận hàng chưa hợp lệ." }, 400);

  const products = await findProducts(context.env.DB, parsed.data.items.map((item) => item.productId));
  if (products.size !== parsed.data.items.length) {
    return context.json({ error: "Một hoặc nhiều mẫu bánh đã hết hàng hoặc không tồn tại." }, 409);
  }
  const parcelItems = makeParcelItems(parsed.data.items, products);
  const weight = totalWeight(parcelItems);
  const insuranceValue = parcelItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const fee = await quoteGhnShipping(
    context.env,
    { districtId: parsed.data.deliveryDistrictId, wardCode: parsed.data.deliveryWardCode },
    weight,
    insuranceValue
  );
  return context.json({ fee, weight });
});

app.post("/api/orders", async (context) => {
  const rawBody: unknown = await context.req.json().catch(() => null);
  const parsedOrder = orderRequestSchema.safeParse(rawBody);
  if (!parsedOrder.success) {
    return context.json(
      {
        error: "Thông tin đặt bánh chưa hợp lệ.",
        details: parsedOrder.error.issues.map(({ path, message }) => ({
          field: path.join("."),
          message
        }))
      },
      400
    );
  }

  const order = parsedOrder.data;
  if (order.paymentMethod === "vnpay" && !vnpayIsConfigured(context.env)) {
    return context.json({ error: "Thanh toán VNPay chưa được cấu hình." }, 503);
  }
  const products = await findProducts(context.env.DB, order.items.map((item) => item.productId));
  if (products.size !== order.items.length) {
    return context.json(
      { error: "Một hoặc nhiều mẫu bánh trong giỏ đã hết hàng. Vui lòng tải lại thực đơn." },
      409
    );
  }

  for (const item of order.items) {
    const product = products.get(item.productId);
    if (!product) continue;
    if (product.stock < item.quantity) {
      return context.json(
        {
          error: `Bánh "${product.name}" hiện chỉ còn ${product.stock} chiếc trong kho.`
        },
        409
      );
    }
  }

  const lines = order.items.map((item) => {
    const product = products.get(item.productId);
    if (!product) throw new Error("Validated order product was not found.");
    return {
      product,
      quantity: item.quantity,
      cakeMessage: item.cakeMessage || "",
      lineTotal: product.price_vnd * item.quantity
    };
  });
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  if (
    lines.some((line) => !Number.isSafeInteger(line.lineTotal)) ||
    !Number.isSafeInteger(subtotal)
  ) {
    return context.json({ error: "Tổng đơn hàng vượt quá giới hạn cho phép." }, 400);
  }

  let deliveryFee = 0;
  let deliveryAddress: string | null = null;
  if (order.fulfillmentType === "delivery") {
    if (ghnIsConfigured(context.env)) {
      if (!order.deliveryDistrictId || !order.deliveryWardCode) {
        return context.json({ error: "Vui lòng chọn tỉnh, quận và phường giao bánh." }, 400);
      }
      const parcelItems = makeParcelItems(order.items, products);
      deliveryFee = await quoteGhnShipping(
        context.env,
        { districtId: order.deliveryDistrictId, wardCode: order.deliveryWardCode },
        totalWeight(parcelItems),
        subtotal
      );
      deliveryAddress = [
        order.deliveryStreet,
        order.deliveryWardName,
        order.deliveryDistrictName
      ]
        .filter(Boolean)
        .join(", ");
    } else {
      deliveryFee = getManualDeliveryFee(context.env);
      deliveryAddress = order.deliveryStreet;
    }
  }
  const total = subtotal + deliveryFee;
  if (!Number.isSafeInteger(total)) {
    return context.json({ error: "Tổng đơn hàng vượt quá giới hạn cho phép." }, 400);
  }
  if (order.paymentMethod === "vnpay" && !Number.isSafeInteger(total * 100)) {
    return context.json({ error: "Số tiền vượt quá giới hạn của cổng VNPay." }, 400);
  }

  const orderId = crypto.randomUUID();
  const paymentUrl =
    order.paymentMethod === "vnpay"
      ? await createVnpayPaymentUrl(
          context.env,
          orderId,
          total,
          context.req.url,
          context.req.header("CF-Connecting-IP") ?? "127.0.0.1"
        )
      : null;

  const statements = [
    context.env.DB.prepare(
      `INSERT INTO orders (
         id, customer_name, customer_phone, fulfillment_type, delivery_address,
         customer_note, subtotal_vnd, delivery_fee_vnd, total_vnd,
         delivery_street, delivery_ward_code, delivery_district_id,
         delivery_ward_name, delivery_district_name, delivery_date, delivery_time,
         payment_method, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`
    ).bind(
      orderId,
      order.customerName,
      order.customerPhone,
      order.fulfillmentType,
      deliveryAddress,
      order.customerNote,
      subtotal,
      deliveryFee,
      total,
      order.fulfillmentType === "delivery" ? order.deliveryStreet : null,
      order.fulfillmentType === "delivery" ? order.deliveryWardCode : null,
      order.fulfillmentType === "delivery" ? order.deliveryDistrictId ?? null : null,
      order.fulfillmentType === "delivery" ? order.deliveryWardName : null,
      order.fulfillmentType === "delivery" ? order.deliveryDistrictName : null,
      order.deliveryDate || null,
      order.deliveryTime || null,
      order.paymentMethod
    ),
    ...lines.map(({ product, quantity, lineTotal, cakeMessage }) =>
      context.env.DB.prepare(
        `INSERT INTO order_items (
           order_id, product_id, product_name, unit_price_vnd, quantity,
           line_total_vnd, weight_g, cake_message
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        orderId,
        product.id,
        product.name,
        product.price_vnd,
        quantity,
        lineTotal,
        product.weight_g,
        cakeMessage
      )
    ),
    ...lines.map(({ product, quantity }) =>
      context.env.DB.prepare(
        `UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`
      ).bind(quantity, product.id)
    )
  ];

  const results = await context.env.DB.batch(statements);
  if (results.some((result) => !result.success)) {
    throw new Error("Không thể lưu đơn hàng đầy đủ vào cơ sở dữ liệu.");
  }

  return context.json(
    {
      id: orderId,
      status: "new",
      paymentMethod: order.paymentMethod,
      subtotal,
      deliveryFee,
      total,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      paymentUrl,
      bankTransfer:
        order.paymentMethod === "bank_transfer"
          ? makeBankTransferInstructions(context.env, orderId, total)
          : null
    },
    201
  );
});

app.get("/api/orders/:orderId", async (context) => {
  const orderId = context.req.param("orderId");
  const order = await context.env.DB.prepare(
    `SELECT id, customer_name, customer_phone, fulfillment_type, delivery_address,
            customer_note, subtotal_vnd, delivery_fee_vnd, total_vnd, status, created_at,
            delivery_date, delivery_time, payment_method, payment_status
     FROM orders WHERE id = ?`
  )
    .bind(orderId)
    .first<Record<string, unknown>>();

  if (!order) {
    return context.json({ error: "Không tìm thấy đơn hàng." }, 404);
  }

  const items = await getItemsForOrders(context.env.DB, [orderId]);
  return context.json({
    ...order,
    items: items.get(orderId) ?? []
  });
});

app.get("/api/payments/vnpay/ipn", async (context) => {
  const callback = await verifyVnpayCallback(new URL(context.req.url), context.env);
  if (!callback) return vnpayIpnResponse("97", "Invalid signature");
  const order = await context.env.DB.prepare(
    "SELECT total_vnd, payment_method, payment_status, status FROM orders WHERE id = ?"
  )
    .bind(callback.orderId)
    .first<{
      total_vnd: number;
      payment_method: string;
      payment_status: string;
      status: string;
    }>();
  if (!order) return vnpayIpnResponse("01", "Order not found");
  if (
    order.payment_method !== "vnpay" ||
    callback.amount !== order.total_vnd ||
    order.status === "cancelled"
  ) {
    return vnpayIpnResponse("04", "Invalid order amount or state");
  }
  if (order.payment_status === "paid") return vnpayIpnResponse("00", "Confirm Success");

  const paid = callback.responseCode === "00" && callback.transactionStatus === "00";
  await context.env.DB.prepare(
    `UPDATE orders
     SET payment_status = ?, payment_transaction_no = ?,
         paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, ?) ELSE paid_at END
     WHERE id = ? AND payment_method = 'vnpay' AND payment_status != 'paid'`
  )
    .bind(
      paid ? "paid" : "failed",
      callback.transactionNo || null,
      paid ? "paid" : "failed",
      new Date().toISOString(),
      callback.orderId
    )
    .run();
  return vnpayIpnResponse("00", "Confirm Success");
});

app.get("/api/payments/vnpay/return", async (context) => {
  const callback = await verifyVnpayCallback(new URL(context.req.url), context.env);
  if (!callback) return context.json({ error: "Chữ ký kết quả thanh toán không hợp lệ." }, 400);
  const order = await context.env.DB.prepare(
    "SELECT total_vnd, payment_method, status FROM orders WHERE id = ?"
  )
    .bind(callback.orderId)
    .first<{ total_vnd: number; payment_method: string; status: string }>();
  if (!order || order.payment_method !== "vnpay" || order.total_vnd !== callback.amount) {
    return context.json({ error: "Không tìm thấy giao dịch hợp lệ." }, 404);
  }

  const success =
    callback.responseCode === "00" &&
    callback.transactionStatus === "00" &&
    order.status !== "cancelled";
  if (success) {
    await context.env.DB.prepare(
      `UPDATE orders
       SET payment_status = 'paid', payment_transaction_no = ?,
           paid_at = COALESCE(paid_at, ?)
       WHERE id = ? AND payment_method = 'vnpay' AND status != 'cancelled'`
    )
      .bind(callback.transactionNo || null, new Date().toISOString(), callback.orderId)
      .run();
  } else {
    await context.env.DB.prepare(
      `UPDATE orders SET payment_status = 'failed'
       WHERE id = ? AND payment_method = 'vnpay' AND payment_status = 'unpaid'`
    )
      .bind(callback.orderId)
      .run();
  }
  return context.json({ orderId: callback.orderId, success });
});

// Admin Authentication & Session
app.post("/api/admin/session", (context) => {
  if (!isAdmin(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Mã quản trị không chính xác." }, 401);
  }
  return context.json({ authenticated: true });
});

// Admin Orders
app.get("/api/admin/orders", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }
  const status = context.req.query("status");
  const where = status && ["new", "confirmed", "preparing", "shipping", "ready", "completed", "cancelled"].includes(status)
    ? "WHERE status = ?"
    : "";
  const statement = context.env.DB.prepare(
    `SELECT id, customer_name, customer_phone, fulfillment_type, delivery_address,
            delivery_district_id, delivery_ward_code, delivery_date, delivery_time,
            customer_note, subtotal_vnd, delivery_fee_vnd, total_vnd, status, created_at,
            payment_method, payment_status, payment_transaction_no, paid_at,
            ghn_order_code, ghn_status, ghn_fee_vnd
     FROM orders ${where}
     ORDER BY created_at DESC LIMIT 100`
  );
  const { results = [] } = where
    ? await statement.bind(status).all<Record<string, unknown>>()
    : await statement.all<Record<string, unknown>>();

  const itemsByOrder = await getItemsForOrders(context.env.DB, results.map((row) => String(row.id)));
  return context.json(results.map((row) => ({ ...row, items: itemsByOrder.get(String(row.id)) ?? [] })));
});

app.get("/api/admin/orders/:orderId", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }
  const order = await context.env.DB.prepare(
    "SELECT * FROM orders WHERE id = ?"
  )
    .bind(context.req.param("orderId"))
    .first<Record<string, unknown>>();
  if (!order) return context.json({ error: "Không tìm thấy đơn hàng." }, 404);
  const items = await getItemsForOrders(context.env.DB, [String(order.id)]);
  return context.json({ ...order, items: items.get(String(order.id)) ?? [] });
});

app.patch("/api/admin/orders/:orderId/status", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }
  const body: unknown = await context.req.json().catch(() => null);
  const parsed = adminStatusSchema.safeParse(body);
  if (!parsed.success) return context.json({ error: "Trạng thái đơn hàng không hợp lệ." }, 400);

  const orderId = context.req.param("orderId");
  const currentOrder = await context.env.DB.prepare(
    "SELECT status, ghn_order_code FROM orders WHERE id = ?"
  )
    .bind(orderId)
    .first<{ status: string; ghn_order_code: string | null }>();
  if (!currentOrder) return context.json({ error: "Không tìm thấy đơn hàng." }, 404);

  if (parsed.data.status === "cancelled" && currentOrder.ghn_order_code) {
    return context.json(
      { error: "Hãy hủy vận đơn trực tiếp với GHN trước khi hủy đơn hàng." },
      409
    );
  }

  // If newly cancelled from an active status, return items back to stock
  if (parsed.data.status === "cancelled" && currentOrder.status !== "cancelled") {
    const items = await getItemsForOrders(context.env.DB, [orderId]);
    const orderItems = items.get(orderId) ?? [];
    for (const item of orderItems) {
      await context.env.DB.prepare(
        "UPDATE products SET stock = stock + ? WHERE id = ?"
      )
        .bind(item.quantity, item.product_id)
        .run();
    }
  }

  const result = await context.env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?")
    .bind(parsed.data.status, orderId)
    .run();
  if (!result.success) throw new Error("Unable to update order status.");
  if (result.meta.changes !== 1) return context.json({ error: "Không tìm thấy đơn hàng." }, 404);
  return context.json({ status: parsed.data.status });
});

app.post("/api/admin/orders/:orderId/mark-paid", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }
  const result = await context.env.DB.prepare(
    `UPDATE orders SET payment_status = 'paid', paid_at = COALESCE(paid_at, ?)
     WHERE id = ? AND payment_method IN ('cash', 'bank_transfer') AND payment_status = 'unpaid'
       AND status != 'cancelled'`
  )
    .bind(new Date().toISOString(), context.req.param("orderId"))
    .run();
  if (!result.success) throw new Error("Unable to update manual payment status.");
  if (result.meta.changes !== 1) {
    return context.json({ error: "Đơn không tồn tại hoặc đã được ghi nhận thanh toán." }, 409);
  }
  return context.json({ paymentStatus: "paid" });
});

app.post("/api/admin/orders/:orderId/shipment", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }
  if (!ghnIsConfigured(context.env)) {
    return context.json({ error: "Chưa cấu hình dịch vụ GHN." }, 503);
  }
  const orderId = context.req.param("orderId");
  const order = await context.env.DB.prepare("SELECT * FROM orders WHERE id = ?")
    .bind(orderId)
    .first<AdminOrderRow>();
  if (!order) return context.json({ error: "Không tìm thấy đơn hàng." }, 404);
  if (order.fulfillment_type !== "delivery" || order.status === "cancelled") {
    return context.json({ error: "Đơn này không thể tạo vận đơn." }, 409);
  }
  if (!order.delivery_district_id || !order.delivery_ward_code || !order.delivery_street) {
    return context.json(
      { error: "Đơn này dùng địa chỉ giao thủ công, không đủ mã địa chỉ để tạo vận đơn GHN." },
      409
    );
  }
  if (order.payment_method === "vnpay" && order.payment_status !== "paid") {
    return context.json({ error: "Chỉ tạo vận đơn sau khi VNPay xác nhận thanh toán." }, 409);
  }
  const reservation = await context.env.DB.prepare(
    `UPDATE orders SET ghn_status = 'creating'
     WHERE id = ? AND ghn_order_code IS NULL AND (ghn_status IS NULL OR ghn_status != 'creating')`
  )
    .bind(orderId)
    .run();
  if (!reservation.success) throw new Error("Unable to reserve shipment creation.");
  if (reservation.meta.changes !== 1) {
    return context.json({ error: "Vận đơn đã được tạo hoặc đang xử lý." }, 409);
  }

  const items = await getItemsForOrders(context.env.DB, [orderId]);
  const orderItems = items.get(orderId) ?? [];
  let shipment: { orderCode: string; fee: number | null };
  try {
    shipment = await createGhnShipment(context.env, {
      orderId,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      destination: {
        street: order.delivery_street ?? "",
        districtId: order.delivery_district_id ?? 0,
        wardCode: order.delivery_ward_code ?? ""
      },
      districtName: order.delivery_district_name ?? "",
      wardName: order.delivery_ward_name ?? "",
      items: orderItems.map((item) => ({
        name: item.product_name,
        code: item.product_id,
        quantity: item.quantity,
        price: item.unit_price_vnd,
        weight: item.weight_g
      })),
      codAmount: order.payment_status === "paid" ? 0 : order.total_vnd,
      insuranceValue: order.subtotal_vnd,
      note: order.customer_note
    });
  } catch (error) {
    await context.env.DB.prepare(
      "UPDATE orders SET ghn_status = NULL WHERE id = ? AND ghn_status = 'creating'"
    )
      .bind(orderId)
      .run();
    throw error;
  }
  const update = await context.env.DB.prepare(
    `UPDATE orders SET ghn_order_code = ?, ghn_status = 'ready_to_pick',
                       ghn_fee_vnd = ?, shipping_created_at = ?
     WHERE id = ? AND ghn_status = 'creating'`
  )
    .bind(shipment.orderCode, shipment.fee, new Date().toISOString(), orderId)
    .run();
  if (!update.success || update.meta.changes !== 1) {
    console.error("GHN shipment was created but could not be linked to the order.", {
      orderId,
      ghnOrderCode: shipment.orderCode
    });
    throw new Error("GHN đã tạo vận đơn nhưng chưa lưu được mã. Liên hệ hỗ trợ trước khi thử lại.");
  }
  return context.json({ orderCode: shipment.orderCode, fee: shipment.fee }, 201);
});

app.post("/api/admin/orders/:orderId/shipment/refresh", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }
  if (!ghnIsConfigured(context.env)) {
    return context.json({ error: "Chưa cấu hình dịch vụ GHN." }, 503);
  }
  const order = await context.env.DB.prepare("SELECT ghn_order_code FROM orders WHERE id = ?")
    .bind(context.req.param("orderId"))
    .first<{ ghn_order_code: string | null }>();
  if (!order) return context.json({ error: "Không tìm thấy đơn hàng." }, 404);
  if (!order.ghn_order_code) return context.json({ error: "Đơn chưa có mã vận đơn." }, 409);
  const details = await getGhnShipment(context.env, order.ghn_order_code);
  const status = readGhnStatus(details);
  if (status) {
    await context.env.DB.prepare("UPDATE orders SET ghn_status = ? WHERE id = ?")
      .bind(status, context.req.param("orderId"))
      .run();
  }
  return context.json({ orderCode: order.ghn_order_code, status, details });
});

// Admin Product Management
app.get("/api/admin/products", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }

  const { results = [] } = await context.env.DB.prepare(
    `SELECT id, name, description, category, category_label, price_vnd,
            original_price_vnd, image_key, weight_g, stock, is_available,
            is_featured, is_bestseller, is_new, created_at
     FROM products
     ORDER BY is_available DESC, category, name ASC`
  ).all<ProductRow & { created_at: string }>();

  return context.json(
    results.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      categoryLabel: p.category_label,
      price: p.price_vnd,
      originalPrice: p.original_price_vnd,
      weightG: p.weight_g,
      stock: p.stock,
      isAvailable: p.is_available === 1,
      isFeatured: p.is_featured === 1,
      isBestseller: p.is_bestseller === 1,
      isNew: p.is_new === 1,
      hasR2Image: Boolean(p.image_key),
      imageUrl: p.image_key
        ? `/api/images/${encodeURIComponent(p.id)}`
        : `/images/${p.id}.jpg`
    }))
  );
});

app.post("/api/admin/products", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }

  const body: unknown = await context.req.json().catch(() => null);
  const parsed = productUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return context.json(
      {
        error: "Thông tin sản phẩm chưa hợp lệ.",
        details: parsed.error.issues.map((i) => i.message)
      },
      400
    );
  }

  const data = parsed.data;
  const id =
    data.id ||
    data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    `cake-${crypto.randomUUID().slice(0, 8)}`;

  const existing = await context.env.DB.prepare("SELECT id FROM products WHERE id = ?")
    .bind(id)
    .first<{ id: string }>();
  if (existing) {
    return context.json({ error: `Mã sản phẩm "${id}" đã tồn tại.` }, 409);
  }

  await context.env.DB.prepare(
    `INSERT INTO products (
       id, name, description, category, category_label, price_vnd,
       original_price_vnd, stock, is_available, is_featured, is_bestseller,
       is_new, weight_g
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      data.name,
      data.description,
      data.category,
      data.categoryLabel,
      data.price,
      data.originalPrice ?? null,
      data.stock,
      data.isAvailable ? 1 : 0,
      data.isFeatured ? 1 : 0,
      data.isBestseller ? 1 : 0,
      data.isNew ? 1 : 0,
      data.weightG
    )
    .run();

  return context.json({ id, message: "Đã thêm sản phẩm mới thành công." }, 201);
});

app.put("/api/admin/products/:productId", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }

  const productId = context.req.param("productId");
  const existing = await context.env.DB.prepare("SELECT id FROM products WHERE id = ?")
    .bind(productId)
    .first<{ id: string }>();
  if (!existing) {
    return context.json({ error: "Không tìm thấy sản phẩm." }, 404);
  }

  const body: unknown = await context.req.json().catch(() => null);
  const parsed = productUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return context.json(
      {
        error: "Thông tin cập nhật chưa hợp lệ.",
        details: parsed.error.issues.map((i) => i.message)
      },
      400
    );
  }

  const data = parsed.data;
  await context.env.DB.prepare(
    `UPDATE products
     SET name = ?, description = ?, category = ?, category_label = ?,
         price_vnd = ?, original_price_vnd = ?, stock = ?, is_available = ?,
         is_featured = ?, is_bestseller = ?, is_new = ?, weight_g = ?
     WHERE id = ?`
  )
    .bind(
      data.name,
      data.description,
      data.category,
      data.categoryLabel,
      data.price,
      data.originalPrice ?? null,
      data.stock,
      data.isAvailable ? 1 : 0,
      data.isFeatured ? 1 : 0,
      data.isBestseller ? 1 : 0,
      data.isNew ? 1 : 0,
      data.weightG,
      productId
    )
    .run();

  return context.json({ id: productId, message: "Đã cập nhật sản phẩm thành công." });
});

app.delete("/api/admin/products/:productId", async (context) => {
  if (!hasAdminAccess(context.req.header("Authorization"), context.env)) {
    return context.json({ error: "Không có quyền truy cập." }, 401);
  }

  const productId = context.req.param("productId");
  // Check if product is in order_items
  const inOrders = await context.env.DB.prepare(
    "SELECT COUNT(*) as count FROM order_items WHERE product_id = ?"
  )
    .bind(productId)
    .first<{ count: number }>();

  if (inOrders && inOrders.count > 0) {
    // Soft delete to protect relational integrity with past orders
    await context.env.DB.prepare("UPDATE products SET is_available = 0 WHERE id = ?")
      .bind(productId)
      .run();
    return context.json({
      message: "Sản phẩm đã có trong các đơn hàng trước đây, hệ thống đã chuyển sang trạng thái Ẩn."
    });
  }

  await context.env.DB.prepare("DELETE FROM products WHERE id = ?")
    .bind(productId)
    .run();
  return context.json({ message: "Đã xóa sản phẩm hoàn toàn khỏi hệ thống." });
});

app.post("/api/admin/products/:productId/image", async (context) => {
  if (!context.env.ADMIN_TOKEN) {
    return context.json({ error: "Chưa cấu hình quyền tải ảnh sản phẩm." }, 503);
  }
  const authorized =
    hasAdminAccess(context.req.header("Authorization"), context.env) ||
    constantTimeEqual(
      context.req.header("X-Admin-Token") ?? "",
      context.env.ADMIN_TOKEN
    );
  if (!authorized) {
    return context.json({ error: "Bạn không có quyền thực hiện thao tác này." }, 401);
  }

  const productId = context.req.param("productId");
  const product = await context.env.DB.prepare("SELECT id FROM products WHERE id = ?")
    .bind(productId)
    .first<{ id: string }>();
  if (!product) return context.json({ error: "Không tìm thấy sản phẩm." }, 404);

  const formData = await context.req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return context.json({ error: "Vui lòng đính kèm tệp ảnh trong trường file." }, 400);
  }
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };
  const extension = extensions[file.type];
  if (!extension) return context.json({ error: "Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP." }, 415);
  if (file.size === 0 || file.size > 5 * 1024 * 1024) {
    return context.json({ error: "Ảnh phải có dung lượng từ 1 byte đến 5 MB." }, 413);
  }

  const imageKey = `products/${productId}/${crypto.randomUUID()}.${extension}`;
  await context.env.PRODUCT_IMAGES.put(imageKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  });
  try {
    const updateResult = await context.env.DB.prepare(
      "UPDATE products SET image_key = ? WHERE id = ?"
    )
      .bind(imageKey, productId)
      .run();
    if (!updateResult.success || updateResult.meta.changes !== 1) {
      throw new Error("Unable to associate the uploaded image with its product.");
    }
  } catch (error) {
    try {
      await context.env.PRODUCT_IMAGES.delete(imageKey);
    } catch (cleanupError) {
      console.error("Failed to remove an unlinked product image from R2.", cleanupError);
    }
    throw error;
  }

  return context.json({ imageUrl: `/api/images/${encodeURIComponent(productId)}` });
});

app.notFound((context) => context.json({ error: "Không tìm thấy API." }, 404));
app.onError((error, context) => {
  console.error("Request failed.", error);
  return context.json({ error: "Đã có lỗi xảy ra. Vui lòng thử lại sau." }, 500);
});

// Helper functions
async function findProducts(db: D1Database, ids: string[]): Promise<Map<string, ProductRow>> {
  if (!ids.length) return new Map();
  const placeholders = ids.map(() => "?").join(", ");
  const { results = [] } = await db
    .prepare(
      `SELECT id, name, description, category, category_label, price_vnd,
              original_price_vnd, image_key, weight_g, stock, is_available,
              is_featured, is_bestseller, is_new
       FROM products WHERE is_available = 1 AND id IN (${placeholders})`
    )
    .bind(...ids)
    .all<ProductRow>();
  return new Map(results.map((product) => [product.id, product]));
}

function makeParcelItems(
  requestedItems: { productId: string; quantity: number }[],
  products: Map<string, ProductRow>
): GhnParcelItem[] {
  return requestedItems.map((item) => {
    const product = products.get(item.productId);
    if (!product) throw new Error("Requested product was not found.");
    return {
      name: product.name,
      code: product.id,
      quantity: item.quantity,
      price: product.price_vnd,
      weight: product.weight_g
    };
  });
}

async function getItemsForOrders(
  db: D1Database,
  ids: string[]
): Promise<Map<string, OrderItemRow[]>> {
  if (!ids.length) return new Map();
  const placeholders = ids.map(() => "?").join(", ");
  const { results = [] } = await db
    .prepare(
      `SELECT order_id, product_id, product_name, unit_price_vnd, quantity,
              line_total_vnd, weight_g, cake_message
       FROM order_items WHERE order_id IN (${placeholders}) ORDER BY id`
    )
    .bind(...ids)
    .all<OrderItemRow & { order_id: string }>();
  const grouped = new Map<string, OrderItemRow[]>();
  for (const { order_id: orderId, ...item } of results) {
    const items = grouped.get(orderId) ?? [];
    items.push(item);
    grouped.set(orderId, items);
  }
  return grouped;
}

function isAdmin(authorization: string | undefined, env: Env): boolean {
  if (!env.ADMIN_TOKEN || !authorization?.startsWith("Bearer ")) return false;
  return constantTimeEqual(authorization.slice(7), env.ADMIN_TOKEN);
}

function hasAdminAccess(authorization: string | undefined, env: Env): boolean {
  return isAdmin(authorization, env);
}

function vnpayIpnResponse(code: string, message: string): Response {
  return Response.json({ RspCode: code, Message: message });
}

function readGhnStatus(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const data = isRecord(value.data) ? value.data : value;
  return typeof data.status === "string" ? data.status : null;
}

function getManualDeliveryFee(env: Env): number {
  const fee = Number(env.DELIVERY_FEE_VND ?? "20000");
  if (!Number.isSafeInteger(fee) || fee < 0 || fee > 10_000_000) {
    throw new Error("DELIVERY_FEE_VND must be a whole number between 0 and 10000000.");
  }
  return fee;
}

interface BankTransferDetails {
  bankName: string;
  bankBin: string;
  accountNumber: string;
  accountHolder: string;
}

function getBankTransferDetails(env: Env): BankTransferDetails | null {
  const { BANK_NAME, BANK_BIN, BANK_ACCOUNT_NUMBER, BANK_ACCOUNT_HOLDER } = env;
  if (!BANK_NAME || !BANK_BIN || !BANK_ACCOUNT_NUMBER || !BANK_ACCOUNT_HOLDER) return null;
  return {
    bankName: BANK_NAME,
    bankBin: BANK_BIN,
    accountNumber: BANK_ACCOUNT_NUMBER,
    accountHolder: BANK_ACCOUNT_HOLDER
  };
}

function makeBankTransferInstructions(
  env: Env,
  orderId: string,
  amount: number
): (BankTransferDetails & { amount: number; transferContent: string; qrUrl: string }) | null {
  const details = getBankTransferDetails(env);
  if (!details) return null;
  const transferContent = `CAKE ${orderId.slice(0, 8).toUpperCase()}`;
  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: transferContent,
    accountName: details.accountHolder
  });
  return {
    ...details,
    amount,
    transferContent,
    qrUrl: `https://img.vietqr.io/image/${encodeURIComponent(details.bankBin)}-${encodeURIComponent(details.accountNumber)}-compact2.png?${query}`
  };
}

async function getEmbedding(text: string, env: Env): Promise<number[] | null> {
  if (!env.AI_TOKEN) return null;
  try {
    const response = await fetch("https://api.cloudflare.com/client/v4/ai/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.AI_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3",
        input: text
      })
    });
    if (!response.ok) return null;
    const data: { data: { embedding: number[] }[] } = await response.json();
    if (data.data && data.data.length > 0 && Array.isArray(data.data[0].embedding)) {
      return data.data[0].embedding;
    }
    return null;
  } catch (e) {
    console.error("Embedding error:", e);
    return null;
  }
}

app.post("/api/chat", async (context) => {
  const body: unknown = await context.req.json().catch(() => null);
  const parsed = z
    .object({
      message: z.string().trim().min(1).max(500)
    })
    .safeParse(body);
  if (!parsed.success) {
    return context.json({ error: "Thông điệp không hợp lệ." }, 400);
  }

  const message = parsed.data.message;
  const embedding = await getEmbedding(message, context.env);

  const { results = [] } = await context.env.DB.prepare(
    "SELECT id, name, description, category, category_label, price_vnd FROM products WHERE is_available = 1"
  ).all<{ id: string; name: string; description: string; category: string; category_label: string; price_vnd: number }>();

  const scored: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    similarity: number;
  }> = [];

  const commonWords = message.toLowerCase().split(" ").filter((w) => w.length > 2).length;
  for (const row of results) {
    const nameLower = (row.name || "").toLowerCase();
    const descLower = (row.description || "").toLowerCase();
    let matchCount = 0;
    for (const word of message.toLowerCase().split(" ")) {
      if (word.length > 2 && (nameLower.includes(word) || descLower.includes(word))) {
        matchCount++;
      }
    }
    const similarity = commonWords > 0 ? matchCount / commonWords : 0;
    if (similarity > 0) {
      scored.push({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category_label,
        price: row.price_vnd,
        similarity
      });
    }
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  const topN = scored.slice(0, 5);

  let responseText = "";
  if (topN.length === 0) {
    responseText = "Tiệm bánh chúng tôi có nhiều mẫu bánh sinh nhật, bento mini, mousse và tiramisu tuyệt ngon. Bạn có thể xem thực đơn chi tiết bên dưới nhé!";
  } else if (topN.length === 1) {
    const p = topN[0];
    responseText = `Gợi ý ngọt ngào cho bạn: **${p.name}** (${p.category}) - ${p.description}. Giá: ${Number(p.price).toLocaleString()}₫. Bạn có muốn thêm vào giỏ hàng không?`;
  } else {
    responseText = "Dưới đây là các gợi ý bánh kem phù hợp với bạn:\n";
    for (const p of topN) {
      responseText += `- **${p.name}** (${p.category}): ${p.description} - ${Number(p.price).toLocaleString()}₫\n`;
    }
  }

  return context.json({
    response: responseText,
    suggestions: topN.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      similarity: p.similarity
    }))
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function constantTimeEqual(candidate: string, expected: string): boolean {
  const candidateBytes = new TextEncoder().encode(candidate);
  const expectedBytes = new TextEncoder().encode(expected);
  let difference = candidateBytes.length ^ expectedBytes.length;
  const length = Math.max(candidateBytes.length, expectedBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (candidateBytes[index] ?? 0) ^ (expectedBytes[index] ?? 0);
  }
  return difference === 0;
}

export default app;
