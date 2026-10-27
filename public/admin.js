const TOKEN_KEY = "sweet-cake-admin-token";
const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

// DOM Elements
const loginCard = document.querySelector("#login-card");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const dashboard = document.querySelector("#dashboard");
const adminNav = document.querySelector("#admin-nav");
const logoutBtn = document.querySelector("#logout");

// Tabs
const tabOrders = document.querySelector("#tab-orders");
const tabProducts = document.querySelector("#tab-products");
const contentOrders = document.querySelector("#content-orders");
const contentProducts = document.querySelector("#content-products");

// Orders View
const ordersList = document.querySelector("#orders-list");
const orderDetail = document.querySelector("#order-detail");
const dashboardError = document.querySelector("#dashboard-error");
const orderSearch = document.querySelector("#order-search");
const statusFilter = document.querySelector("#status-filter");
const refreshOrdersBtn = document.querySelector("#refresh-orders");
const resultCount = document.querySelector("#result-count");

// Products View
const productsTbody = document.querySelector("#products-tbody");
const productSearch = document.querySelector("#product-search");
const productCatFilter = document.querySelector("#product-cat-filter");
const btnAddProduct = document.querySelector("#btn-add-product");
const refreshProductsBtn = document.querySelector("#refresh-products");

// Modals
const productModal = document.querySelector("#product-modal");
const productForm = document.querySelector("#product-form");
const modalProductTitle = document.querySelector("#modal-product-title");
const formProductMode = document.querySelector("#form-product-mode");
const formProductName = document.querySelector("#form-product-name");
const formProductId = document.querySelector("#form-product-id");
const formProductCategory = document.querySelector("#form-product-category");
const formProductPrice = document.querySelector("#form-product-price");
const formProductOriginalPrice = document.querySelector("#form-product-original-price");
const formProductStock = document.querySelector("#form-product-stock");
const formProductWeight = document.querySelector("#form-product-weight");
const formProductDesc = document.querySelector("#form-product-desc");
const formProductAvailable = document.querySelector("#form-product-available");
const formProductFeatured = document.querySelector("#form-product-featured");
const formProductBestseller = document.querySelector("#form-product-bestseller");
const formProductNew = document.querySelector("#form-product-new");
const productFormError = document.querySelector("#product-form-error");

const imageModal = document.querySelector("#image-modal");
const imageForm = document.querySelector("#image-form");
const uploadProductName = document.querySelector("#upload-product-name");
const imageFileInput = document.querySelector("#image-file-input");
const imagePreview = document.querySelector("#image-preview");
const imageFormError = document.querySelector("#image-form-error");

const toast = document.querySelector("#admin-toast");

// State
let adminToken = sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem("moc-admin-token") || "";
let orders = [];
let adminProducts = [];
let selectedOrderId = "";
let selectedImageProductId = "";
let toastTimeout;
let ghnEnabled = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function api(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${adminToken}`,
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers
    }
  });
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 3000);
}

function setAuthenticated(authenticated) {
  loginCard.hidden = authenticated;
  dashboard.hidden = !authenticated;
  adminNav.hidden = !authenticated;
  logoutBtn.hidden = !authenticated;
}

function logout() {
  adminToken = "";
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem("moc-admin-token");
  setAuthenticated(false);
}

logoutBtn.addEventListener("click", logout);

// Tab switching
tabOrders.addEventListener("click", () => {
  tabOrders.classList.add("active");
  tabProducts.classList.remove("active");
  contentOrders.hidden = false;
  contentProducts.hidden = true;
  void loadOrders();
});

tabProducts.addEventListener("click", () => {
  tabProducts.classList.add("active");
  tabOrders.classList.remove("active");
  contentOrders.hidden = true;
  contentProducts.hidden = false;
  void loadAdminProducts();
});

// Login Form
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const token = document.querySelector("#admin-token").value.trim();
  if (!token) return;

  try {
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? "Mã quản trị không hợp lệ.");

    adminToken = token;
    sessionStorage.setItem(TOKEN_KEY, token);
    setAuthenticated(true);
    notify("Đăng nhập quản trị thành công!");
    await loadOrders();
  } catch (error) {
    loginError.textContent = error instanceof Error ? error.message : "Đăng nhập thất bại.";
    loginError.hidden = false;
  }
});

// Check existing session
if (adminToken) {
  fetch("/api/admin/session", {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` }
  })
    .then((res) => {
      if (res.ok) {
        setAuthenticated(true);
        void loadOrders();
      } else {
        logout();
      }
    })
    .catch(() => logout());
}

// ---------------- ORDERS MANAGEMENT ---------------- //

async function loadOrders() {
  dashboardError.hidden = true;
  refreshOrdersBtn.disabled = true;
  try {
    const [response, configResponse] = await Promise.all([
      api("/api/admin/orders"),
      fetch("/api/config")
    ]);
    const [result, config] = await Promise.all([response.json(), configResponse.json()]);
    if (response.status === 401) {
      logout();
      throw new Error("Phiên quản trị hết hạn. Vui lòng đăng nhập lại.");
    }
    if (!response.ok || !Array.isArray(result)) {
      throw new Error(result.error ?? "Không tải được danh sách đơn.");
    }

    ghnEnabled = config.ghnEnabled === true;
    orders = result;
    updateMetrics();
    document.querySelector("#orders-updated").textContent =
      `Cập nhật: ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
    renderOrders();
  } catch (error) {
    dashboardError.textContent = error instanceof Error ? error.message : "Lỗi tải đơn hàng.";
    dashboardError.hidden = false;
  } finally {
    refreshOrdersBtn.disabled = false;
  }
}

function updateMetrics() {
  document.querySelector("#metric-total").textContent = String(orders.length);
  document.querySelector("#metric-new").textContent = String(
    orders.filter((o) => o.status === "new" || o.status === "confirmed").length
  );
  document.querySelector("#metric-unpaid").textContent = String(
    orders.filter((o) => o.payment_status === "unpaid" && o.status !== "cancelled").length
  );
  const paidTotal = orders.reduce(
    (sum, o) => sum + (o.payment_status === "paid" ? o.total_vnd : 0),
    0
  );
  document.querySelector("#metric-paid").textContent = currency.format(paidTotal);
}

function getVisibleOrders() {
  const query = orderSearch.value.trim().toLowerCase();
  const status = statusFilter.value;
  return orders.filter((o) => {
    if (status && o.status !== status) return false;
    if (!query) return true;
    const searchString = [
      o.id,
      o.customer_name,
      o.customer_phone,
      o.delivery_address ?? "",
      o.delivery_date ?? "",
      o.ghn_order_code ?? ""
    ]
      .join(" ")
      .toLowerCase();
    return searchString.includes(query);
  });
}

function renderOrders() {
  ordersList.replaceChildren();
  const visible = getVisibleOrders();
  resultCount.textContent = `${visible.length} / ${orders.length} đơn`;

  if (!visible.length) {
    ordersList.append(
      element("div", "orders-empty", orders.length ? "Không tìm thấy đơn phù hợp." : "Chưa có đơn hàng nào.")
    );
    orderDetail.replaceChildren();
    orderDetail.append(element("div", "detail-empty", "Chọn một đơn hàng để xem chi tiết."));
    return;
  }

  if (!visible.some((o) => o.id === selectedOrderId)) {
    selectedOrderId = visible[0].id;
  }

  for (const order of visible) {
    const card = element("button", `order-card${order.status === "new" ? " order-card--new" : ""}`);
    card.type = "button";
    card.setAttribute("aria-current", String(order.id === selectedOrderId));

    const top = element("div", "order-card__top");
    top.append(element("span", "order-card__id", `#CAKE-${String(order.id).slice(0, 8).toUpperCase()}`));
    top.append(makeBadge(statusLabel(order.status), badgeClassForStatus(order.status)));

    const name = element("p", "order-card__name", order.customer_name);

    const bottom = element("div", "order-card__bottom");
    bottom.append(element("span", "", `${order.items.length} món · ${formatDate(order.created_at)}`));
    bottom.append(element("strong", "", currency.format(order.total_vnd)));

    const meta = element("div", "order-card__meta");
    meta.append(
      makeBadge(
        order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
        order.payment_status === "paid" ? "badge--success" : "badge--warning"
      )
    );

    if (order.delivery_date) {
      meta.append(makeBadge(`📅 ${order.delivery_date} (${order.delivery_time || "Trong ngày"})`, "badge--info"));
    }

    card.append(top, name, bottom, meta);
    card.addEventListener("click", () => {
      selectedOrderId = order.id;
      renderOrders();
    });
    ordersList.append(card);
  }

  const selected = visible.find((o) => o.id === selectedOrderId) ?? visible[0];
  if (selected) {
    selectedOrderId = selected.id;
    renderOrderDetail(selected);
  }
}

function renderOrderDetail(order) {
  orderDetail.replaceChildren();

  const heading = element("div", "detail-heading");
  const headingInfo = element("div");
  headingInfo.append(element("h2", "", `Đơn #${String(order.id).slice(0, 8).toUpperCase()}`));
  headingInfo.append(element("span", "detail-date", `Đặt lúc: ${formatDate(order.created_at)}`));

  const badges = element("div", "order-badges");
  badges.append(makeBadge(statusLabel(order.status), badgeClassForStatus(order.status)));
  badges.append(
    makeBadge(
      order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
      order.payment_status === "paid" ? "badge--success" : "badge--warning"
    )
  );
  heading.append(headingInfo, badges);
  orderDetail.append(heading);

  // Customer info & Delivery schedule
  const customerSec = element("section", "detail-section");
  customerSec.append(element("h3", "", "Thông tin khách & Lịch hẹn bánh"));
  customerSec.append(element("p", "", `Khách hàng: ${order.customer_name} — SĐT: ${order.customer_phone}`));

  if (order.delivery_date) {
    const scheduleP = element("p");
    scheduleP.append(document.createTextNode("Hẹn giao bánh: "));
    scheduleP.append(element("strong", "", `${order.delivery_time || ""} ngày ${order.delivery_date}`));
    customerSec.append(scheduleP);
  }

  customerSec.append(
    element(
      "p",
      "",
      order.fulfillment_type === "delivery"
        ? `Địa chỉ giao: ${order.delivery_address || "Chưa có địa chỉ"}`
        : "Hình thức: Khách đến lấy trực tiếp tại tiệm"
    )
  );

  if (order.customer_note) {
    customerSec.append(element("p", "", `Ghi chú đơn: ${order.customer_note}`));
  }
  orderDetail.append(customerSec);

  // Items
  const itemsSec = element("section", "detail-section");
  itemsSec.append(element("h3", "", "Món bánh & Yêu cầu chữ"));
  for (const item of order.items) {
    const row = element("div", "item-row");
    const nameCol = element("div");
    nameCol.append(document.createTextNode(`${item.product_name} × ${item.quantity}`));
    nameCol.append(element("small", "", currency.format(item.unit_price_vnd)));

    if (item.cake_message) {
      nameCol.append(element("span", "cake-message-badge", `✍️ Chữ trên bánh: "${item.cake_message}"`));
    }

    row.append(nameCol, element("strong", "", currency.format(item.line_total_vnd)));
    itemsSec.append(row);
  }

  const subtotalRow = element("div", "item-row");
  subtotalRow.append(element("span", "", "Tạm tính bánh"), element("span", "", currency.format(order.subtotal_vnd)));
  itemsSec.append(subtotalRow);

  const shipRow = element("div", "item-row");
  shipRow.append(element("span", "", "Phí giao hàng"), element("span", "", currency.format(order.delivery_fee_vnd)));
  itemsSec.append(shipRow);

  const totalRow = element("div", "total-row");
  totalRow.append(element("span", "", "Tổng thanh toán"), element("strong", "", currency.format(order.total_vnd)));
  itemsSec.append(totalRow);
  orderDetail.append(itemsSec);

  // Payment
  const paymentSec = element("section", "detail-section");
  paymentSec.append(element("h3", "", "Thanh toán"));
  paymentSec.append(element("p", "", `Phương thức: ${paymentMethodLabel(order.payment_method)}`));
  if (order.payment_transaction_no) {
    paymentSec.append(element("p", "", `Mã giao dịch: ${order.payment_transaction_no}`));
  }
  if (order.paid_at) {
    paymentSec.append(element("p", "", `Thời gian thanh toán: ${formatDate(order.paid_at)}`));
  }
  orderDetail.append(paymentSec);

  // Actions
  const actionsSec = element("div", "detail-actions");

  // Status Selector
  const statusSelect = document.createElement("select");
  const statuses = [
    ["new", "Mới (Chờ duyệt)"],
    ["confirmed", "Đã xác nhận"],
    ["preparing", "Đang làm bánh"],
    ["shipping", "Đang giao hàng"],
    ["ready", "Sẵn sàng"],
    ["completed", "Đã hoàn thành"],
    ["cancelled", "Hủy đơn hàng"]
  ];
  for (const [val, label] of statuses) {
    const opt = new Option(label, val);
    opt.selected = order.status === val;
    statusSelect.append(opt);
  }
  statusSelect.addEventListener("change", async () => {
    try {
      const res = await api(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusSelect.value })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Cập nhật trạng thái thất bại.");
      order.status = data.status;
      notify(`Đã cập nhật trạng thái đơn thành "${statusLabel(data.status)}"!`);
      await loadOrders();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Lỗi cập nhật.");
      statusSelect.value = order.status;
    }
  });
  actionsSec.append(statusSelect);

  // Mark Paid Button
  if (order.payment_status !== "paid" && order.status !== "cancelled") {
    const markPaidBtn = element("button", "action-primary", "✓ Xác nhận đã thu tiền");
    markPaidBtn.type = "button";
    markPaidBtn.addEventListener("click", async () => {
      try {
        const res = await api(`/api/admin/orders/${order.id}/mark-paid`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Không thể cập nhật.");
        order.payment_status = "paid";
        notify("Đã xác nhận thanh toán đơn hàng thành công!");
        await loadOrders();
      } catch (err) {
        notify(err instanceof Error ? err.message : "Lỗi cập nhật.");
      }
    });
    actionsSec.append(markPaidBtn);
  }

  orderDetail.append(actionsSec);
}

orderSearch.addEventListener("input", renderOrders);
statusFilter.addEventListener("change", renderOrders);
refreshOrdersBtn.addEventListener("click", loadOrders);

// ---------------- PRODUCTS MANAGEMENT ---------------- //

async function loadAdminProducts() {
  refreshProductsBtn.disabled = true;
  try {
    const res = await api("/api/admin/products");
    if (!res.ok) throw new Error("Không thể tải danh sách sản phẩm.");
    adminProducts = await res.json();
    renderAdminProducts();
  } catch (err) {
    notify(err instanceof Error ? err.message : "Lỗi tải bánh.");
  } finally {
    refreshProductsBtn.disabled = false;
  }
}

function renderAdminProducts() {
  productsTbody.replaceChildren();
  const q = productSearch.value.trim().toLowerCase();
  const cat = productCatFilter.value;

  const filtered = adminProducts.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8;
    td.textContent = "Không tìm thấy bánh kem nào.";
    td.style.textAlign = "center";
    td.style.padding = "30px";
    td.style.color = "var(--muted)";
    tr.append(td);
    productsTbody.append(tr);
    return;
  }

  for (const product of filtered) {
    const tr = document.createElement("tr");

    // Thumb
    const tdThumb = document.createElement("td");
    const img = document.createElement("img");
    img.className = "table-thumb";
    img.src = product.imageUrl || `/images/${product.id}.jpg`;
    img.alt = product.name;
    img.onerror = () => { img.src = "/images/cake-default.jpg"; };
    tdThumb.append(img);

    // Name & ID
    const tdName = document.createElement("td");
    tdName.append(element("span", "table-name", product.name));
    tdName.append(element("span", "table-id", product.id));
    if (product.hasR2Image) {
      tdName.append(makeBadge("Ảnh R2", "badge--info"));
    }

    // Category
    const tdCat = document.createElement("td");
    tdCat.textContent = product.categoryLabel;

    // Price
    const tdPrice = document.createElement("td");
    tdPrice.className = "table-price";
    tdPrice.textContent = currency.format(product.price);

    // Original Price
    const tdOrigPrice = document.createElement("td");
    tdOrigPrice.textContent = product.originalPrice ? currency.format(product.originalPrice) : "—";

    // Stock
    const tdStock = document.createElement("td");
    tdStock.textContent = String(product.stock);

    // Status
    const tdStatus = document.createElement("td");
    tdStatus.append(
      makeBadge(
        product.isAvailable ? "Đang bán" : "Đã ẩn",
        product.isAvailable ? "badge--success" : "badge--danger"
      )
    );

    // Actions
    const tdActions = document.createElement("td");
    const actionsDiv = element("div", "table-actions");

    const btnEdit = element("button", "btn-table", "Sửa");
    btnEdit.type = "button";
    btnEdit.addEventListener("click", () => openEditProduct(product));

    const btnImage = element("button", "btn-table", "Đổi ảnh R2");
    btnImage.type = "button";
    btnImage.addEventListener("click", () => openImageUpload(product));

    const btnDelete = element(
      "button",
      `btn-table ${product.isAvailable ? "btn-table--danger" : ""}`,
      product.isAvailable ? "Ẩn" : "Hiện lại"
    );
    btnDelete.type = "button";
    btnDelete.addEventListener("click", async () => {
      try {
        if (product.isAvailable) {
          const res = await api(`/api/admin/products/${product.id}`, { method: "DELETE" });
          const data = await res.json();
          notify(data.message ?? "Đã ẩn sản phẩm.");
        } else {
          // Re-enable
          await api(`/api/admin/products/${product.id}`, {
            method: "PUT",
            body: JSON.stringify({ ...product, isAvailable: true })
          });
          notify(`Đã kích hoạt lại "${product.name}".`);
        }
        await loadAdminProducts();
      } catch (err) {
        notify(err instanceof Error ? err.message : "Thao tác thất bại.");
      }
    });

    actionsDiv.append(btnEdit, btnImage, btnDelete);
    tdActions.append(actionsDiv);

    tr.append(tdThumb, tdName, tdCat, tdPrice, tdOrigPrice, tdStock, tdStatus, tdActions);
    productsTbody.append(tr);
  }
}

productSearch.addEventListener("input", renderAdminProducts);
productCatFilter.addEventListener("change", renderAdminProducts);
refreshProductsBtn.addEventListener("click", loadAdminProducts);

// Product Modal Handlers
btnAddProduct.addEventListener("click", () => {
  formProductMode.value = "create";
  modalProductTitle.textContent = "Thêm mẫu bánh kem mới";
  formProductId.disabled = false;
  productForm.reset();
  formProductAvailable.checked = true;
  productFormError.hidden = true;
  productModal.showModal();
});

function openEditProduct(product) {
  formProductMode.value = "edit";
  modalProductTitle.textContent = `Chỉnh sửa: ${product.name}`;
  formProductId.value = product.id;
  formProductId.disabled = true; // cannot change ID on edit
  formProductName.value = product.name;
  formProductCategory.value = product.category;
  formProductPrice.value = product.price;
  formProductOriginalPrice.value = product.originalPrice ?? "";
  formProductStock.value = product.stock;
  formProductWeight.value = product.weightG ?? 500;
  formProductDesc.value = product.description;
  formProductAvailable.checked = product.isAvailable;
  formProductFeatured.checked = product.isFeatured;
  formProductBestseller.checked = product.isBestseller;
  formProductNew.checked = product.isNew;
  productFormError.hidden = true;
  productModal.showModal();
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  productFormError.hidden = true;

  const mode = formProductMode.value;
  const categorySelect = formProductCategory;
  const categoryLabel = categorySelect.selectedOptions[0]?.dataset.label || categorySelect.value;

  const payload = {
    name: formProductName.value.trim(),
    id: formProductId.value.trim(),
    category: categorySelect.value,
    categoryLabel,
    price: Number(formProductPrice.value),
    originalPrice: formProductOriginalPrice.value ? Number(formProductOriginalPrice.value) : null,
    stock: Number(formProductStock.value),
    weightG: Number(formProductWeight.value) || 500,
    description: formProductDesc.value.trim(),
    isAvailable: formProductAvailable.checked,
    isFeatured: formProductFeatured.checked,
    isBestseller: formProductBestseller.checked,
    isNew: formProductNew.checked
  };

  try {
    const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${payload.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await api(url, {
      method,
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error ?? (result.details ? result.details.join(", ") : "Lỗi lưu sản phẩm."));
    }

    productModal.close();
    notify(result.message ?? "Đã lưu sản phẩm thành công!");
    await loadAdminProducts();
  } catch (err) {
    productFormError.textContent = err instanceof Error ? err.message : "Lỗi xử lý.";
    productFormError.hidden = false;
  }
});

// Image Upload to R2 Modal Handlers
function openImageUpload(product) {
  selectedImageProductId = product.id;
  uploadProductName.textContent = `${product.name} (${product.id})`;
  imageFileInput.value = "";
  imagePreview.src = product.imageUrl || `/images/${product.id}.jpg`;
  imageFormError.hidden = true;
  imageModal.showModal();
}

imageFileInput.addEventListener("change", () => {
  const file = imageFileInput.files?.[0];
  if (file) {
    imagePreview.src = URL.createObjectURL(file);
  }
});

imageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  imageFormError.hidden = true;
  const file = imageFileInput.files?.[0];
  if (!file) return;

  const submitBtn = document.querySelector("#btn-upload-image");
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang tải lên R2…";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api(`/api/admin/products/${selectedImageProductId}/image`, {
      method: "POST",
      body: formData
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? "Tải ảnh thất bại.");

    imageModal.close();
    notify(`Đã cập nhật ảnh R2 thành công cho bánh "${uploadProductName.textContent}"!`);
    await loadAdminProducts();
  } catch (err) {
    imageFormError.textContent = err instanceof Error ? err.message : "Lỗi tải ảnh.";
    imageFormError.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Tải lên R2 ngay";
  }
});

document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modalId = btn.dataset.closeModal;
    document.querySelector(`#${modalId}`)?.close();
  });
});

// Helpers
function statusLabel(status) {
  const map = {
    new: "Mới (Chờ duyệt)",
    confirmed: "Đã xác nhận",
    preparing: "Đang làm bánh",
    shipping: "Đang giao hàng",
    ready: "Sẵn sàng",
    completed: "Hoàn tất",
    cancelled: "Đã hủy"
  };
  return map[status] ?? status;
}

function badgeClassForStatus(status) {
  if (status === "cancelled") return "badge--danger";
  if (status === "completed") return "badge--success";
  if (status === "preparing" || status === "shipping") return "badge--info";
  if (status === "confirmed") return "badge--warning";
  return "";
}

function paymentMethodLabel(method) {
  const map = {
    cash: "Tiền mặt khi nhận bánh (COD)",
    bank_transfer: "Chuyển khoản VietQR",
    vnpay: "Online qua VNPay"
  };
  return map[method] ?? method;
}

function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("vi-VN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function makeBadge(text, className = "") {
  const b = element("span", `badge ${className}`.trim(), text);
  return b;
}
