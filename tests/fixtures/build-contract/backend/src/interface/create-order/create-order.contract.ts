import { defineContract } from "../../../../../../../packages/core/contract/index.ts";
import { z } from "zod";

import { OrderDTOShape } from "../../dto/order.dto.ts";

export const CreateOrderContract = defineContract({
  method: "POST",
  path: "/orders/:orderId",
  schemas: {
    body: z.object({
      quantity: z.number().int().positive(),
    }),
    query: z.object({
      preview: z.boolean().optional(),
    }),
    headers: z.object({
      "x-request-id": z.string(),
    }),
    params: z.object({
      orderId: z.string(),
    }),
    response: z.object(OrderDTOShape),
  },
});
