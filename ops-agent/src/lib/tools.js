import { tool } from "@openai/agents";
import { z } from "zod";

export const checkserverhealth = tool({
  name: "check_server_health",
  description: "Check the order api /health request GET /api/orders.",
  parameters: z.object({}),
  async execute() {
    console.log("Checking server health...running");
    const health = await callDemoService("/health");
    const orders = await callDemoService("/api/orders");

    return { health, orders };
  },
});

export const getrecentlogs = tool({
  name: "get_recent_logs",
  description: "Return the last 20 lines order api , newest first.",
  parameters: z.object({}),
  async execute() {
    console.log("get_recent_logs...running");
    const result = await callDemoService("/logs");

    if (Array.isArray(result?.body)) {
      return result.body.map((line) => ({
        ...line,
        message: line.message ? line.message.slice(0, 200) : "",
      }));
    }

    return result;
  },
});

export const getproductioninfo = tool({
  name: "get_production_info",
  description: "Return current production status and version details.",
  parameters: z.object({}),
  async execute() {
    console.log("get_production_info...running");
    const info = await callDemoService("/production-info");
    return info;
  },
});