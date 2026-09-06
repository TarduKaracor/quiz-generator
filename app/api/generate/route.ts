type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY ayarlanmadı. .env.local dosyana Google AI Studio anahtarını ekle." }, { status: 503 });
  }

  try {
    const { notes = "", images = [], count = 10, difficulty = "Orta" } = await request.json();
    if ((typeof notes !== "string" || notes.trim().length < 30) && (!Array.isArray(images) || images.length === 0)) {
      return Response.json({ error: "Yeterli not bulunamadı." }, { status: 400 });
    }

    const prompt = `Sen Türkçe eğitim içerikleri hazırlayan bir uzmansın. Aşağıdaki notlara dayanarak ${count} adet, ${difficulty.toLowerCase()} zorlukta çoktan seçmeli test sorusu oluştur. Sorular yalnızca verilen notlardaki bilgilerle cevaplanabilsin. Her soruda tam 4 seçenek olsun ve doğru cevabın index numarasını (0-3) belirt. Yalnızca geçerli JSON döndür, markdown kullanma.

JSON şeması: {"questions":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}

NOTLAR:
${notes || "Notlar, eklenen fotoğraflardaki metinlerden okunmalıdır."}`;

    const imageParts = Array.isArray(images)
      ? images.slice(0, 10).map((image: { data?: string; mimeType?: string }) => ({
        inlineData: { mimeType: image.mimeType, data: image.data?.split(",")[1] || image.data },
      }))
      : [];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...imageParts] }], generationConfig: { responseMimeType: "application/json", temperature: 0.65 } }),
    });
    if (!response.ok) {
      const providerError = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      const message = providerError?.error?.message || "Google AI isteği reddetti.";
      return Response.json({ error: `Google AI: ${message}` }, { status: response.status === 401 || response.status === 403 ? 502 : response.status });
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("AI yanıtı boş döndü.");
    const parsed = JSON.parse(text) as { questions: QuizQuestion[] };
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "Test oluşturulurken bir sorun oluştu. Notlarını ve API ayarlarını kontrol et." }, { status: 500 });
  }
}