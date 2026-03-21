import { defineContract } from "../../../../../../../packages/core/contract/index.ts";
import { z } from "zod";

export const ReportContract = defineContract({
  method: "GET",
  path: "/reports/:reportId",
  schemas: {
    params: z.object({
      reportId: z.string(),
    }),
    response: z.string().transform((value) => Number(value)),
  },
});
