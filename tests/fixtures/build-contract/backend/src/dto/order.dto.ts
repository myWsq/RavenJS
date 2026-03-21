import { z } from "zod";

export const OrderDTOShape = {
  id: z.string(),
  quantity: z.number(),
};
