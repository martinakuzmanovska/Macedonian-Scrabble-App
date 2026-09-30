/**
 * Ask the AI for a legal-looking Scrabble move. The game engine remains the
 * authority for applying and scoring the returned placements.
 */
export async function generateAIMove(boardState, rack, isFirstMove, age) {
  const requestId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.info("[ai-move] request", {
    requestId,
    boardRows: Array.isArray(boardState) ? boardState.length : null,
    rackSize: Array.isArray(rack) ? rack.length : null,
    isFirstMove,
    age,
  });

  try {
    const response = await fetch("/api/ai-move", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Request-Id": requestId },
      credentials: "include",
      body: JSON.stringify({
        boardState,
        rack,
        isFirstMove,
        age,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      let data = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { raw: responseText };
      }
      console.error("[ai-move] response error", {
        requestId,
        status: response.status,
        statusText: response.statusText,
        responseUrl: response.url,
        responseType: response.type,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseText,
        data,
      });
      return { error: data.error || `AI request failed (${response.status})` };
    }
    const data = await response.json();
    console.info("[ai-move] response success", {
      requestId,
      status: response.status,
      word: data.word,
      placementCount: Array.isArray(data.placements) ? data.placements.length : null,
      pass: data.pass,
    });
    return data.success === false
      ? { error: data.error || "AI request failed" }
      : data;
  } catch (error) {
    console.error("[ai-move] network error", { requestId, error });
    return { error: error.message || "AI request failed" };
  }
}
