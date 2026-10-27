import { z } from "zod";

export const orderRequestSchema = z
  .object({
    customerName: z.string().trim().min(2, "Tên khách hàng phải từ 2 ký tự trở lên.").max(80),
    customerPhone: z
      .string()
      .trim()
      .min(8, "Số điện thoại phải từ 8 ký tự trở lên.")
      .max(20)
      .regex(/^[0-9+().\-\s]+$/, "Số điện thoại chứa ký tự không hợp lệ."),
    fulfillmentType: z.enum(["pickup", "delivery"]),
    deliveryStreet: z.string().trim().max(180).optional().default(""),
    deliveryWardCode: z.string().trim().max(32).optional().default(""),
    deliveryDistrictId: z.number().int().positive().optional(),
    deliveryWardName: z.string().trim().max(100).optional().default(""),
    deliveryDistrictName: z.string().trim().max(100).optional().default(""),
    deliveryDate: z.string().trim().max(30).optional().default(""),
    deliveryTime: z.string().trim().max(30).optional().default(""),
    customerNote: z.string().trim().max(500).optional().default(""),
    paymentMethod: z.enum(["cash", "bank_transfer", "vnpay"]).default("cash"),
    items: z
      .array(
        z.object({
          productId: z.string().min(1).max(80),
          quantity: z.number().int().min(1, "Số lượng tối thiểu là 1.").max(99, "Số lượng tối đa là 99."),
          cakeMessage: z.string().trim().max(200, "Nội dung chữ trên bánh tối đa 200 ký tự.").optional().default("")
        })
      )
      .min(1, "Giỏ hàng phải có ít nhất 1 sản phẩm.")
      .max(30, "Mỗi đơn tối đa 30 món.")
  })
  .superRefine((order, context) => {
    if (
      order.fulfillmentType === "delivery" &&
      (order.deliveryStreet.length < 5 ||
        Boolean(order.deliveryWardCode) !== Boolean(order.deliveryDistrictId) ||
        Boolean(order.deliveryWardCode) !== Boolean(order.deliveryWardName) ||
        Boolean(order.deliveryWardCode) !== Boolean(order.deliveryDistrictName))
    ) {
      context.addIssue({
        code: "custom",
        path: ["deliveryStreet"],
        message: "Vui lòng nhập địa chỉ giao hàng và chọn đủ quận, phường."
      });
    }

    const productIds = order.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Mỗi sản phẩm chỉ được xuất hiện một lần trong giỏ hàng."
      });
    }
  });

export const shippingQuoteSchema = z.object({
  deliveryDistrictId: z.number().int().positive(),
  deliveryWardCode: z.string().trim().min(1).max(32),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(80),
        quantity: z.number().int().min(1).max(99),
        cakeMessage: z.string().trim().max(200).optional().default("")
      })
    )
    .min(1)
    .max(30)
});

export const adminStatusSchema = z.object({
  status: z.enum(["new", "confirmed", "preparing", "shipping", "ready", "completed", "cancelled"])
});

export const productUpsertSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2, "Mã sản phẩm từ 2 ký tự.")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Mã sản phẩm chỉ gồm chữ thường không dấu, số và gạch ngang")
    .optional(),
  name: z.string().trim().min(2, "Tên bánh từ 2 ký tự.").max(120),
  description: z.string().trim().min(5, "Mô tả từ 5 ký tự.").max(1000),
  category: z.string().trim().min(2).max(50),
  categoryLabel: z.string().trim().min(2).max(50),
  price: z.number().int().min(0, "Giá bán không âm.").max(100_000_000),
  originalPrice: z.number().int().min(0).max(100_000_000).nullable().optional(),
  stock: z.number().int().min(0, "Tồn kho không âm.").max(10_000).default(50),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  weightG: z.number().int().min(10).max(50_000).default(500)
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;
export type ProductUpsert = z.infer<typeof productUpsertSchema>;
