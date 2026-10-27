const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
});

const CART_KEY = "sweet-cake-cart-v2";

// DOM Elements
const productGrid = document.querySelector("#product-grid");
const categoryList = document.querySelector("#category-list");
const menuStatus = document.querySelector("#menu-status");
const menuCount = document.querySelector("#menu-count");
const searchInput = document.querySelector("#search-input");
const searchClear = document.querySelector("#search-clear");
const sortSelect = document.querySelector("#sort-select");
const quickTabs = document.querySelector("#quick-tabs");

const cartDialog = document.querySelector("#cart-dialog");
const cartItems = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const cartSubtotal = document.querySelector("#cart-subtotal");
const checkoutButton = document.querySelector("#checkout-button");

const detailDialog = document.querySelector("#detail-dialog");
const detailImg = document.querySelector("#detail-img");
const detailCategory = document.querySelector("#detail-category");
const detailTitle = document.querySelector("#detail-title");
const detailPrice = document.querySelector("#detail-price");
const detailOriginalPrice = document.querySelector("#detail-original-price");
const detailStock = document.querySelector("#detail-stock");
const detailDesc = document.querySelector("#detail-desc");
const detailBadges = document.querySelector("#detail-badges");
const detailCakeMessage = document.querySelector("#detail-cake-message");
const detailQtyMinus = document.querySelector("#detail-qty-minus");
const detailQtyPlus = document.querySelector("#detail-qty-plus");
const detailQtyValue = document.querySelector("#detail-qty-value");
const detailAddBtn = document.querySelector("#detail-add-btn");
const detailBtnTotal = document.querySelector("#detail-btn-total");

const checkoutDialog = document.querySelector("#checkout-dialog");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutTotal = document.querySelector("#checkout-total");
const reviewSubtotal = document.querySelector("#review-subtotal");
const reviewDelivery = document.querySelector("#review-delivery");
const checkoutError = document.querySelector("#checkout-error");
const addressGroup = document.querySelector("#address-group");
const deliveryStreet = document.querySelector("#delivery-street");
const ghnAddressSelects = document.querySelector("#ghn-address-selects");
const deliveryStreetLabel = document.querySelector("#delivery-street-label");
const provinceSelect = document.querySelector("#delivery-province");
const districtSelect = document.querySelector("#delivery-district");
const wardSelect = document.querySelector("#delivery-ward");
const deliveryDateInput = document.querySelector("#delivery-date");
const deliveryTimeSelect = document.querySelector("#delivery-time");
const shippingQuote = document.querySelector("#shipping-quote");
const placeOrderButton = document.querySelector("#place-order");
const toastElement = document.querySelector("#toast");

// Application State
let products = [];
let categories = [];
let activeCategory = "all";
let activeTag = "all";
let searchQuery = "";
let currentSort = "default";

let selectedDetailProduct = null;
let detailQuantity = 1;

let deliveryFee = 0;
let ghnEnabled = false;
let vnpayEnabled = false;
let manualDeliveryFee = 20000;
let bankTransferDetails = null;
let quoteRequest = 0;
let toastTimer;

// Cart State: Array of items { productId, quantity, cakeMessage }
let cart = readCart();

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) =>
          item &&
          typeof item.productId === "string" &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          item.quantity <= 99
      );
    }
  } catch {
    console.error("Failed to read cart from localStorage.");
  }
  return [];
}

function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    showToast("Không thể lưu giỏ hàng vào trình duyệt.");
  }
  renderCart();
  if (
    checkoutDialog.open &&
    document.querySelector('input[name="fulfillmentType"]:checked')?.value === "delivery"
  ) {
    void refreshShippingQuote();
  }
}

function showToast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("toast--visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastElement.classList.remove("toast--visible"), 3200);
}

function makeElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// Format Delivery Date Defaults (Minimum is today)
function initDatePickers() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;
  deliveryDateInput.min = todayStr;
  
  // Default to tomorrow or today
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomYear = tomorrow.getFullYear();
  const tomMonth = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const tomDay = String(tomorrow.getDate()).padStart(2, "0");
  deliveryDateInput.value = `${tomYear}-${tomMonth}-${tomDay}`;
}

// Categories Rendering
function renderCategories() {
  categoryList.replaceChildren();
  const allButton = makeElement("button", "category-chip", "Tất cả bánh kem");
  allButton.type = "button";
  allButton.dataset.category = "all";
  allButton.setAttribute("aria-pressed", String(activeCategory === "all"));
  categoryList.append(allButton);

  for (const cat of categories) {
    const chip = makeElement("button", "category-chip", `${cat.name} (${cat.count})`);
    chip.type = "button";
    chip.dataset.category = cat.id;
    chip.setAttribute("aria-pressed", String(activeCategory === cat.id));
    categoryList.append(chip);
  }
}

// Filter and Sort Products
function getFilteredProducts() {
  let list = [...products];

  // Category filter
  if (activeCategory !== "all") {
    list = list.filter((p) => p.category === activeCategory);
  }

  // Quick tag filter
  if (activeTag === "featured") {
    list = list.filter((p) => p.isFeatured);
  } else if (activeTag === "bestseller") {
    list = list.filter((p) => p.isBestseller);
  } else if (activeTag === "new") {
    list = list.filter((p) => p.isNew);
  }

  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (currentSort === "price_asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (currentSort === "price_desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (currentSort === "bestseller") {
    list.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
  } else if (currentSort === "newest") {
    list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  } else {
    // default: featured, bestseller first
    list.sort((a, b) => {
      const aScore = (a.isFeatured ? 2 : 0) + (a.isBestseller ? 1 : 0);
      const bScore = (b.isFeatured ? 2 : 0) + (b.isBestseller ? 1 : 0);
      return bScore - aScore;
    });
  }

  return list;
}

// Render Products Grid
function renderProducts() {
  const visible = getFilteredProducts();
  productGrid.replaceChildren();

  if (visible.length === 0) {
    menuCount.textContent = "0 mẫu bánh";
    const empty = makeElement(
      "div",
      "status-message",
      searchQuery
        ? `Không tìm thấy mẫu bánh nào phù hợp với từ khóa "${searchQuery}".`
        : "Không có sản phẩm nào trong danh mục này."
    );
    productGrid.append(empty);
    return;
  }

  menuCount.textContent = `${visible.length} mẫu bánh tươi ngon`;

  for (const product of visible) {
    const card = makeElement("article", "product-card");

    // Media & Badges
    const art = makeElement("div", "product-art");
    const img = makeElement("img", "product-art__image");
    img.src = product.imageUrl || `/images/${product.id}.jpg`;
    img.alt = product.name;
    img.loading = "lazy";
    img.onerror = () => { img.src = "/images/cake-default.jpg"; };
    art.append(img);

    const badgesContainer = makeElement("div", "product-card__badges");
    if (product.originalPrice && product.originalPrice > product.price) {
      const discountPercent = Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      );
      badgesContainer.append(makeElement("span", "badge badge--discount", `Giảm ${discountPercent}%`));
    }
    if (product.isBestseller) {
      badgesContainer.append(makeElement("span", "badge badge--bestseller", "Bán chạy"));
    }
    if (product.isNew) {
      badgesContainer.append(makeElement("span", "badge badge--new", "Mới"));
    }
    if (badgesContainer.children.length > 0) {
      art.append(badgesContainer);
    }
    art.addEventListener("click", () => openProductDetail(product));

    // Info
    const info = makeElement("div", "product-info");
    const catLabel = makeElement("p", "product-category", product.categoryLabel);
    const title = makeElement("h3", "product-name", product.name);
    title.addEventListener("click", () => openProductDetail(product));
    const desc = makeElement("p", "product-description", product.description);

    const bottom = makeElement("div", "product-bottom");
    const prices = makeElement("div", "product-prices");
    prices.append(makeElement("span", "product-price", currency.format(product.price)));
    if (product.originalPrice && product.originalPrice > product.price) {
      prices.append(makeElement("span", "product-original-price", currency.format(product.originalPrice)));
    }

    const actions = makeElement("div", "product-actions");
    const viewBtn = makeElement("button", "quick-view-btn", "👁️");
    viewBtn.type = "button";
    viewBtn.setAttribute("aria-label", `Xem chi tiết ${product.name}`);
    viewBtn.title = "Xem chi tiết bánh";
    viewBtn.addEventListener("click", () => openProductDetail(product));

    const addBtn = makeElement("button", "add-button", "+");
    addBtn.type = "button";
    addBtn.setAttribute("aria-label", `Thêm ${product.name} vào giỏ bánh`);
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToCart(product.id, 1, "");
      showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);
    });

    actions.append(viewBtn, addBtn);
    bottom.append(prices, actions);

    info.append(catLabel, title, desc, bottom);
    card.append(art, info);
    productGrid.append(card);
  }
}

// Product Detail Modal
function openProductDetail(product) {
  selectedDetailProduct = product;
  detailQuantity = 1;
  detailQtyValue.textContent = "1";
  detailCakeMessage.value = "";

  detailImg.src = product.imageUrl || `/images/${product.id}.jpg`;
  detailImg.alt = product.name;
  detailImg.onerror = () => { detailImg.src = "/images/cake-default.jpg"; };
  detailCategory.textContent = product.categoryLabel;
  detailTitle.textContent = product.name;
  detailPrice.textContent = currency.format(product.price);

  if (product.originalPrice && product.originalPrice > product.price) {
    detailOriginalPrice.hidden = false;
    detailOriginalPrice.textContent = currency.format(product.originalPrice);
  } else {
    detailOriginalPrice.hidden = true;
  }

  detailStock.textContent = product.stock > 0 ? `Còn ${product.stock} bánh` : "Hết hàng";
  detailDesc.textContent = product.description;

  detailBadges.replaceChildren();
  if (product.isBestseller) detailBadges.append(makeElement("span", "badge badge--bestseller", "Bán chạy nhất"));
  if (product.isNew) detailBadges.append(makeElement("span", "badge badge--new", "Bánh mới ra lò"));
  if (product.isFeatured) detailBadges.append(makeElement("span", "badge badge--featured", "Bánh nổi bật"));

  updateDetailTotal();
  detailDialog.showModal();
}

function updateDetailTotal() {
  if (!selectedDetailProduct) return;
  const total = selectedDetailProduct.price * detailQuantity;
  detailBtnTotal.textContent = currency.format(total);
}

detailQtyMinus.addEventListener("click", () => {
  if (detailQuantity > 1) {
    detailQuantity -= 1;
    detailQtyValue.textContent = String(detailQuantity);
    updateDetailTotal();
  }
});

detailQtyPlus.addEventListener("click", () => {
  if (!selectedDetailProduct) return;
  if (detailQuantity < Math.min(selectedDetailProduct.stock, 99)) {
    detailQuantity += 1;
    detailQtyValue.textContent = String(detailQuantity);
    updateDetailTotal();
  } else {
    showToast(`Số lượng tối đa trong kho là ${selectedDetailProduct.stock} bánh.`);
  }
});

detailAddBtn.addEventListener("click", () => {
  if (!selectedDetailProduct) return;
  const msg = detailCakeMessage.value.trim();
  addToCart(selectedDetailProduct.id, detailQuantity, msg);
  detailDialog.close();
  showToast(`Đã thêm ${detailQuantity} "${selectedDetailProduct.name}" vào giỏ hàng!`);
});

// Cart Logic
function addToCart(productId, quantity, cakeMessage = "") {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existingIndex = cart.findIndex(
    (item) => item.productId === productId && (item.cakeMessage || "") === cakeMessage
  );

  if (existingIndex > -1) {
    const newQty = cart[existingIndex].quantity + quantity;
    if (newQty > product.stock) {
      showToast(`Kho chỉ còn ${product.stock} chiếc bánh "${product.name}".`);
      cart[existingIndex].quantity = product.stock;
    } else {
      cart[existingIndex].quantity = Math.min(newQty, 99);
    }
  } else {
    if (quantity > product.stock) {
      showToast(`Kho chỉ còn ${product.stock} chiếc bánh "${product.name}".`);
      quantity = product.stock;
    }
    cart.push({ productId, quantity: Math.min(quantity, 99), cakeMessage });
  }

  saveCart();
}

function renderCart() {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const validItems = cart.filter((item) => productMap.has(item.productId));
  const totalQuantity = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = validItems.reduce(
    (sum, item) => sum + productMap.get(item.productId).price * item.quantity,
    0
  );

  cartCount.textContent = String(totalQuantity);
  cartTotal.textContent = currency.format(subtotal);
  cartSubtotal.textContent = currency.format(subtotal);
  reviewSubtotal.textContent = currency.format(subtotal);

  const deliverySelected =
    document.querySelector('input[name="fulfillmentType"]:checked')?.value === "delivery";
  const finalTotal = subtotal + (deliverySelected && deliveryFee !== null ? deliveryFee : 0);
  checkoutTotal.textContent = currency.format(finalTotal);
  reviewDelivery.textContent = deliverySelected && deliveryFee !== null ? currency.format(deliveryFee) : "0₫";

  checkoutButton.disabled = totalQuantity === 0;
  updatePlaceOrderAvailability();
  cartItems.replaceChildren();

  if (validItems.length === 0) {
    cartItems.append(makeElement("p", "cart-empty", "Giỏ bánh của bạn đang trống. Hãy chọn mẫu bánh bạn thích nhé!"));
    return;
  }

  validItems.forEach((item, index) => {
    const product = productMap.get(item.productId);
    const line = makeElement("div", "cart-line");

    const details = makeElement("div");
    details.append(makeElement("h4", "cart-line__name", product.name));
    details.append(makeElement("p", "cart-line__price", currency.format(product.price * item.quantity)));

    if (item.cakeMessage) {
      const msgBadge = makeElement("span", "cart-line__msg", `✍️ Chữ trên bánh: "${item.cakeMessage}"`);
      details.append(msgBadge);
    }

    const controls = makeElement("div", "quantity-control");
    const minus = makeElement("button", "", "−");
    minus.type = "button";
    minus.setAttribute("aria-label", "Giảm số lượng");
    minus.addEventListener("click", () => {
      if (item.quantity <= 1) {
        cart.splice(index, 1);
      } else {
        item.quantity -= 1;
      }
      saveCart();
    });

    const qtySpan = makeElement("span", "", String(item.quantity));

    const plus = makeElement("button", "", "+");
    plus.type = "button";
    plus.setAttribute("aria-label", "Tăng số lượng");
    plus.addEventListener("click", () => {
      if (item.quantity < Math.min(product.stock, 99)) {
        item.quantity += 1;
        saveCart();
      } else {
        showToast(`Bánh này chỉ còn ${product.stock} chiếc trong kho.`);
      }
    });

    controls.append(minus, qtySpan, plus);
    line.append(details, controls);
    cartItems.append(line);
  });
}

// Fulfillment & Shipping
function updateFulfillment() {
  const isDelivery =
    document.querySelector('input[name="fulfillmentType"]:checked')?.value === "delivery";

  addressGroup.hidden = !isDelivery;
  ghnAddressSelects.hidden = !ghnEnabled;
  deliveryStreetLabel.textContent = ghnEnabled ? "Số nhà, tên đường *" : "Địa chỉ giao bánh tận nơi *";
  deliveryStreet.placeholder = ghnEnabled
    ? "Ví dụ: Số 24 ngõ 12 đường Hoa Hồng"
    : "Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành";
  deliveryStreet.required = isDelivery;
  provinceSelect.required = isDelivery && ghnEnabled;
  districtSelect.required = isDelivery && ghnEnabled;
  wardSelect.required = isDelivery && ghnEnabled;

  if (isDelivery && ghnEnabled) {
    deliveryFee = null;
    void loadProvinces();
  } else if (isDelivery) {
    deliveryFee = manualDeliveryFee;
    shippingQuote.textContent = `Phí giao tận nơi: ${currency.format(manualDeliveryFee)} (đóng gói hộp giữ nhiệt đá gel).`;
  } else {
    deliveryFee = 0;
    shippingQuote.textContent = "Nhận bánh tại tiệm: Miễn phí vận chuyển.";
  }

  updatePlaceOrderAvailability();
  renderCart();
}

function updatePlaceOrderAvailability() {
  const deliverySelected =
    document.querySelector('input[name="fulfillmentType"]:checked')?.value === "delivery";
  const hasItems = cart.some((item) => item.quantity > 0);
  const addressReady = !deliverySelected || deliveryStreet.value.trim().length >= 5;
  const quoteReady = !deliverySelected || (deliveryFee !== null && Number.isSafeInteger(deliveryFee));
  const ghnAddressReady =
    !deliverySelected || !ghnEnabled || Boolean(districtSelect.value && wardSelect.value);
  const dateReady = Boolean(deliveryDateInput.value);

  placeOrderButton.disabled = !hasItems || !addressReady || !quoteReady || !ghnAddressReady || !dateReady;
}

function setSelectOptions(select, placeholder, entries, valueKey, labelKey) {
  select.replaceChildren(new Option(placeholder, ""));
  for (const entry of entries) {
    const value = String(entry[valueKey] ?? "");
    const label = String(entry[labelKey] ?? "");
    if (value && label) select.add(new Option(label, value));
  }
}

async function fetchGhnOptions(path, select, placeholder, valueKey, labelKey) {
  select.disabled = true;
  select.replaceChildren(new Option("Đang tải…", ""));
  const response = await fetch(path);
  const result = await response.json();
  if (!response.ok || !Array.isArray(result)) {
    throw new Error(result.error ?? "Chưa tải được danh mục địa chỉ GHN.");
  }
  setSelectOptions(select, placeholder, result, valueKey, labelKey);
  select.disabled = false;
}

async function loadProvinces() {
  if (!ghnEnabled || provinceSelect.options.length > 1) return;
  try {
    await fetchGhnOptions(
      "/api/ghn/provinces",
      provinceSelect,
      "Chọn tỉnh / thành",
      "ProvinceID",
      "ProvinceName"
    );
  } catch (error) {
    shippingQuote.textContent =
      error instanceof Error ? error.message : "Chưa tải được danh sách tỉnh / thành.";
  }
}

async function refreshShippingQuote() {
  const requestId = ++quoteRequest;
  deliveryFee = null;
  updatePlaceOrderAvailability();
  renderCart();

  const items = cart.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  if (!ghnEnabled || !districtSelect.value || !wardSelect.value || items.length === 0) {
    shippingQuote.textContent = "Chọn đầy đủ địa chỉ để tính cước phí giao hàng.";
    return;
  }

  shippingQuote.textContent = "Đang tính phí giao hàng GHN…";
  try {
    const response = await fetch("/api/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryDistrictId: Number(districtSelect.value),
        deliveryWardCode: wardSelect.value,
        items
      })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Chưa thể tính phí giao hàng.");
    if (requestId !== quoteRequest) return;
    deliveryFee = result.fee;
    shippingQuote.textContent = `Phí giao hàng: ${currency.format(deliveryFee)}`;
  } catch (error) {
    if (requestId !== quoteRequest) return;
    deliveryFee = null;
    shippingQuote.textContent =
      error instanceof Error ? error.message : "Chưa thể tính phí giao hàng.";
  }
  updatePlaceOrderAvailability();
  renderCart();
}

// Initial Data Load
async function loadData() {
  try {
    const [productsRes, categoriesRes, configRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/categories"),
      fetch("/api/config")
    ]);

    if (!productsRes.ok || !configRes.ok) {
      throw new Error("Không thể kết nối đến máy chủ.");
    }

    products = await productsRes.json();
    categories = categoriesRes.ok ? await categoriesRes.json() : [];
    const config = await configRes.json();

    ghnEnabled = config.ghnEnabled === true;
    vnpayEnabled = config.vnpayEnabled === true;
    manualDeliveryFee = Number.isSafeInteger(config.manualDeliveryFee) ? config.manualDeliveryFee : 20000;
    bankTransferDetails = config.bankTransfer ?? null;

    document.querySelector("#vnpay-choice").hidden = !vnpayEnabled;
    document.querySelector("#delivery-choice-title").textContent = ghnEnabled
      ? "Giao tận nơi nhanh qua GHN"
      : "Giao bánh tận nơi";
    document.querySelector("#delivery-choice-help").textContent = ghnEnabled
      ? "Cước phí tính chuẩn xác theo địa chỉ"
      : `Phí giao tiêu chuẩn ${currency.format(manualDeliveryFee)}`;

    document.querySelector("#bank-transfer-help").textContent = bankTransferDetails
      ? `${bankTransferDetails.bankName} · STK: ${bankTransferDetails.accountNumber}`
      : "Quét mã VietQR tự động hoặc tiệm liên hệ xác nhận tài khoản";

    menuStatus.textContent = products.length ? "" : "Thực đơn bánh kem đang được cập nhật.";
    renderCategories();
    renderProducts();
    renderCart();
  } catch (error) {
    menuStatus.textContent = "Chưa thể tải danh sách bánh. Vui lòng kiểm tra kết nối mạng và tải lại trang.";
    showToast("Không thể kết nối đến máy chủ.");
    console.error(error);
  }
}

// Event Listeners
categoryList.addEventListener("click", (e) => {
  const chip = e.target.closest("button[data-category]");
  if (!chip) return;
  activeCategory = chip.dataset.category;
  renderCategories();
  renderProducts();
});

quickTabs.addEventListener("click", (e) => {
  const tab = e.target.closest("button[data-tag]");
  if (!tab) return;
  quickTabs.querySelectorAll(".tab-chip").forEach((btn) => btn.setAttribute("aria-pressed", "false"));
  tab.setAttribute("aria-pressed", "true");
  activeTag = tab.dataset.tag;
  renderProducts();
});

searchInput.addEventListener("input", () => {
  searchQuery = searchInput.value.trim();
  searchClear.hidden = !searchQuery;
  renderProducts();
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchQuery = "";
  searchClear.hidden = true;
  renderProducts();
});

sortSelect.addEventListener("change", () => {
  currentSort = sortSelect.value;
  renderProducts();
});

document.querySelector("#filter-custom-cakes")?.addEventListener("click", () => {
  activeCategory = "banh-theo-yeu-cau";
  renderCategories();
  renderProducts();
  document.querySelector("#menu").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll("[data-cat-link]").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const cat = link.dataset.catLink;
    activeCategory = cat;
    renderCategories();
    renderProducts();
    document.querySelector("#menu").scrollIntoView({ behavior: "smooth" });
  });
});

provinceSelect.addEventListener("change", async () => {
  districtSelect.disabled = true;
  wardSelect.disabled = true;
  wardSelect.replaceChildren(new Option("Chọn phường / xã", ""));
  if (!provinceSelect.value) return void refreshShippingQuote();
  try {
    await fetchGhnOptions(
      `/api/ghn/districts?provinceId=${encodeURIComponent(provinceSelect.value)}`,
      districtSelect,
      "Chọn quận / huyện",
      "DistrictID",
      "DistrictName"
    );
  } catch (error) {
    shippingQuote.textContent = error instanceof Error ? error.message : "Chưa tải được quận / huyện.";
  }
  refreshShippingQuote();
});

districtSelect.addEventListener("change", async () => {
  wardSelect.disabled = true;
  if (!districtSelect.value) {
    wardSelect.replaceChildren(new Option("Chọn phường / xã", ""));
    return void refreshShippingQuote();
  }
  try {
    await fetchGhnOptions(
      `/api/ghn/wards?districtId=${encodeURIComponent(districtSelect.value)}`,
      wardSelect,
      "Chọn phường / xã",
      "WardCode",
      "WardName"
    );
  } catch (error) {
    shippingQuote.textContent = error instanceof Error ? error.message : "Chưa tải được phường / xã.";
  }
  refreshShippingQuote();
});

wardSelect.addEventListener("change", refreshShippingQuote);
deliveryStreet.addEventListener("input", updatePlaceOrderAvailability);
deliveryDateInput.addEventListener("change", updatePlaceOrderAvailability);

document.querySelector("#open-cart").addEventListener("click", () => cartDialog.showModal());
document.querySelector("#checkout-button").addEventListener("click", () => {
  cartDialog.close();
  checkoutError.hidden = true;
  checkoutForm.hidden = false;
  document.querySelector("#order-success").hidden = true;
  updateFulfillment();
  checkoutDialog.showModal();
  if (document.querySelector('input[name="fulfillmentType"]:checked')?.value === "delivery") {
    refreshShippingQuote();
  }
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.querySelector(`#${button.dataset.close}`);
    if (dialog) dialog.close();
  });
});

document.querySelectorAll('input[name="fulfillmentType"]').forEach((input) => {
  input.addEventListener("change", updateFulfillment);
});

document.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
  input.addEventListener("change", () => {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    document.querySelector("#payment-summary").textContent =
      paymentMethod === "vnpay"
        ? "Thanh toán an toàn qua VNPay"
        : paymentMethod === "bank_transfer"
          ? "Chuyển khoản VietQR"
          : "Thanh toán khi nhận bánh (COD)";
  });
});

// Checkout Order Submission
checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  checkoutError.hidden = true;
  placeOrderButton.disabled = true;
  placeOrderButton.firstElementChild.textContent = "Đang gửi đơn bánh…";

  const formData = new FormData(checkoutForm);
  const fulfillmentType = formData.get("fulfillmentType");
  const order = {
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    fulfillmentType,
    deliveryStreet: formData.get("deliveryStreet"),
    deliveryWardCode: ghnEnabled ? formData.get("deliveryWard") : "",
    deliveryDistrictId: ghnEnabled ? Number(formData.get("deliveryDistrict")) || undefined : undefined,
    deliveryWardName: ghnEnabled ? wardSelect.selectedOptions[0]?.textContent ?? "" : "",
    deliveryDistrictName: ghnEnabled ? districtSelect.selectedOptions[0]?.textContent ?? "" : "",
    deliveryDate: formData.get("deliveryDate"),
    deliveryTime: formData.get("deliveryTime"),
    customerNote: formData.get("customerNote"),
    paymentMethod: formData.get("paymentMethod"),
    items: cart.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      cakeMessage: i.cakeMessage || ""
    }))
  };

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? "Chưa thể đặt bánh. Vui lòng kiểm tra lại thông tin.");
    }

    if (result.paymentUrl) {
      sessionStorage.setItem("cake-pending-payment", result.id);
      window.location.assign(result.paymentUrl);
      return;
    }

    // Success
    cart = [];
    saveCart();

    const shortId = `CAKE-${result.id.slice(0, 8).toUpperCase()}`;
    document.querySelector("#success-order-id").textContent = shortId;
    document.querySelector("#success-schedule").textContent =
      `Hẹn nhận bánh: ${order.deliveryTime} ngày ${order.deliveryDate}`;
    document.querySelector("#success-total").textContent =
      `Tổng thanh toán: ${currency.format(result.total)}`;

    renderBankTransferInstructions(result.bankTransfer);
    checkoutForm.hidden = true;
    document.querySelector("#order-success").hidden = false;
  } catch (error) {
    checkoutError.textContent =
      error instanceof Error ? error.message : "Chưa thể gửi đơn. Vui lòng thử lại.";
    checkoutError.hidden = false;
  } finally {
    updatePlaceOrderAvailability();
    placeOrderButton.firstElementChild.textContent = "Xác nhận đặt bánh ngay";
  }
});

function renderBankTransferInstructions(instructions) {
  const container = document.querySelector("#bank-transfer-instructions");
  container.replaceChildren();
  const isBankTransfer =
    document.querySelector('input[name="paymentMethod"]:checked')?.value === "bank_transfer";
  if (!isBankTransfer) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  container.append(makeElement("h4", "", "Thông tin chuyển khoản VietQR"));
  if (!instructions) {
    container.append(
      makeElement(
        "p",
        "",
        "Tiệm Sweet Cake sẽ liên hệ sớm để gửi hướng dẫn chuyển khoản và đối soát đơn hàng."
      )
    );
    return;
  }

  for (const [label, value] of [
    ["Ngân hàng", instructions.bankName],
    ["Chủ tài khoản", instructions.accountHolder],
    ["Số tài khoản", instructions.accountNumber],
    ["Số tiền", currency.format(instructions.amount)],
    ["Nội dung chuyển khoản", instructions.transferContent]
  ]) {
    const row = makeElement("p");
    row.append(document.createTextNode(`${label}: `));
    row.append(makeElement("strong", "", value));
    container.append(row);
  }

  if (instructions.qrUrl) {
    const qr = makeElement("img", "bank-transfer-qr");
    qr.src = instructions.qrUrl;
    qr.alt = "Mã QR chuyển khoản ngân hàng";
    container.append(qr);
  }
}

async function handleVnpayReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("payment") !== "vnpay") return;
  try {
    const response = await fetch(`/api/payments/vnpay/return?${params.toString()}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Không xác minh được kết quả thanh toán.");
    if (result.success) {
      cart = [];
      saveCart();
      showToast("Thanh toán VNPay thành công. Sweet Cake đã nhận đơn bánh của bạn!");
    } else {
      showToast("Thanh toán chưa hoàn tất. Vui lòng liên hệ tiệm nếu tiền đã bị trừ.");
    }
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Lỗi xác minh thanh toán.");
  } finally {
    sessionStorage.removeItem("cake-pending-payment");
    window.history.replaceState({}, "", window.location.pathname);
  }
}

initDatePickers();
loadData();
void handleVnpayReturn();
