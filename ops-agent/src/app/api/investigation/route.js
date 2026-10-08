import { run } from "@openai/agents";
import { agent } from "../../../lib/agent"; // ייבוא ה-agent המתאים
import { saveInvestigation } from "../../../lib/db";

export async function POST(request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }
      const toolsresult = [];

      try {
        // תיקון: שימוש ב-agent המיוצא ושימוש ב-AbortSignal באותיות גדולות
        const result = await run(agent, "Investigation orders-api.", {
          stream: true,
          maxTokens: 600, // הוגדל מ-6 כדי לא לחתוך את תשובת ה-Agent באמצע
          signal: AbortSignal.any([
            request.signal,
            AbortSignal.timeout(60_000),
          ]),
        });

        for await (const event of result) {
          if (event.type !== "run_item_stream_event") {
            continue;
          }

          if (event.item.type === "tool_call_item") {
            const tool = event.item.rawItem.name;

            send({
              type: "tool_called",
              tool,
            });
          }

          if (event.item.type === "tool_call_output_item") {
            send({
              type: "tool_output",
              output: event.item.output,
            });

            // תיקון: דחיפה למערך toolsresult שמוגדר למעלה
            toolsresult.push({
              output: event.item.output,
            });
          }
        }

        await result.complete;
        if (result.cancelled) {
          throw new Error("החקירה נעצרה: עברה דקה או שהדפדפן נסגר");
        }

        // תיקון: finalOutput באותיות גדולות (CamelCase)
        const report = result.finalOutput;
        send({ type: "report", report });

        await saveInvestigation({ createdAt: new Date(), report, toolsresult });
      } catch (error) {
        send({ type: "error", message: error.message });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    // תיקון: headers במקום eaders
    headers: { "Content-Type": "application/x-ndjson" },
  });
}