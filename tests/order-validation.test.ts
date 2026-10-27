import { describe, expect, it } from "vitest";
import { orderRequestSchema, productUpsertSchema } from "../src/validation";

const validOrder = {
  customerName: "Nguyễn An",
  customerPhone: "090 123 4567",
  fulfillmentType: "delivery",
  deliveryStreet: "12 Nguyễn Huệ",
  deliveryWardCode: "21012",
  deliveryDistrictId: 1452,
  deliveryWardName: "Phường Bến Nghé",
  deliveryDistrictName: "Quận 1",
  deliveryDate: "2026-10-30",
  deliveryTime: "14:00 - 16:00",
  customerNote: "Giao nhẹ tay giúp mình",
  paymentMethod: "vnpay",
  items: [
    {
      productId: "banh-kem-dau-tay-kem-tuoi",
      quantity: 1,
      cakeMessage: "Chúc mừng sinh nhật Mẹ yêu"
    }
  ]
};

describe("orderRequestSchema", () => {
  it("accepts valid delivery and pickup cake orders with cake messages", () => {
    expect(orderRequestSchema.safeParse(validOrder).success).toBe(true);
    expect(
      orderRequestSchema.safeParse({
        ...validOrder,
        fulfillmentType: "pickup",
        deliveryStreet: "",
        deliveryWardCode: "",
        deliveryDistrictId: undefined,
        deliveryWardName: "",
        deliveryDistrictName: ""
      }).success
    ).toBe(true);
  });

  it("requires an address for delivery", () => {
    const result = orderRequestSchema.safeParse({
      ...validOrder,
      deliveryStreet: "",
      deliveryWardCode: ""
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "deliveryStreet")).toBe(true);
    }
  });

  it("accepts manual delivery without GHN address codes and bank transfer payment", () => {
    expect(
      orderRequestSchema.safeParse({
        ...validOrder,
        deliveryStreet: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
        deliveryWardCode: "",
        deliveryDistrictId: undefined,
        deliveryWardName: "",
        deliveryDistrictName: "",
        paymentMethod: "bank_transfer"
      }).success
    ).toBe(true);
  });

  it("rejects duplicate products, invalid quantities, and malformed phone numbers", () => {
    expect(
      orderRequestSchema.safeParse({
        ...validOrder,
        items: [
          { productId: "banh-kem-dau-tay-kem-tuoi", quantity: 1 },
          { productId: "banh-kem-dau-tay-kem-tuoi", quantity: 2 }
        ]
      }).success
    ).toBe(false);
    expect(
      orderRequestSchema.safeParse({
        ...validOrder,
        items: [{ productId: "banh-kem-dau-tay-kem-tuoi", quantity: 100 }]
      }).success
    ).toBe(false);
    expect(
      orderRequestSchema.safeParse({ ...validOrder, customerPhone: "call-me" }).success
    ).toBe(false);
  });
});

describe("productUpsertSchema", () => {
  it("validates valid cake product for admin creation", () => {
    const validProduct = {
      id: "banh-mousse-sau-rieng",
      name: "Bánh Mousse Sầu Riêng Ri6",
      description: "Mousse thơm nức vị sầu riêng Ri6 tươi nguyên chất và kem phô mai béo ngậy.",
      category: "banh-mousse",
      categoryLabel: "Bánh mousse",
      price: 360000,
      originalPrice: 400000,
      stock: 15,
      isAvailable: true,
      isFeatured: true,
      isBestseller: false,
      isNew: true,
      weightG: 700
    };
    expect(productUpsertSchema.safeParse(validProduct).success).toBe(true);
  });

  it("rejects negative prices and invalid ID characters", () => {
    expect(
      productUpsertSchema.safeParse({
        id: "Invalid ID with spaces!",
        name: "Cake",
        description: "Valid description",
        category: "banh-mousse",
        categoryLabel: "Bánh mousse",
        price: -50000
      }).success
    ).toBe(false);
  });
});
