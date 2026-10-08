export async function readEvents(response, onEvent) {
    if (!response.ok) {
        onEvent({ type: "error", message: `HTTP השרת החזיר: ${response.status}` });
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // הוצאת השורה האחרונה ושמירתה ב-buffer כי היא עלולה להיות חלקית
        buffer = lines.pop();

        for (const line of lines) {
            const trimmedLine = line.trim();
            // בדיקה שהשורה אינה ריקה לפני הפענוח
            if (trimmedLine) {
                try {
                    onEvent(JSON.parse(trimmedLine));
                } catch (e) {
                    console.error("שגיאה בפענוח שורת JSON:", trimmedLine, e);
                }
            }
        }
    }

    // טיפול בשורה הנותרת שנשארה ב-buffer בסיום ה-Stream
    if (buffer.trim()) {
        try {
            onEvent(JSON.parse(buffer.trim()));
        } catch (e) {
            console.error("שגיאה בפענוח שארית ה-buffer:", buffer, e);
        }
    }
}