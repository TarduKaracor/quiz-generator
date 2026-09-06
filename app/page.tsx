"use client";

import { ChangeEvent, useState } from "react";

type Question = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

type NoteImage = {
  name: string;
  data: string;
  mimeType: string;
};

const sampleNotes = `Fotosentez, bitkilerin ışık enerjisini kimyasal enerjiye dönüştürdüğü süreçtir. Bu olay kloroplastlarda gerçekleşir. Klorofil pigmenti ışığı soğurur. Fotosentez sırasında karbondioksit ve su kullanılır; glikoz ve oksijen üretilir. Işık bağımlı tepkimeler tilakoit zarında, ışıktan bağımsız tepkimeler ise stromada gerçekleşir.`;

export default function Home() {
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [noteImages, setNoteImages] = useState<NoteImage[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Orta");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const textFile = files.find((file) => file.type === "text/plain" || file.name.endsWith(".md"));
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (textFile) setNotes(await textFile.text());
    if (imageFiles.length) {
      const images = await Promise.all(imageFiles.map((file) => new Promise<NoteImage>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, data: String(reader.result), mimeType: file.type });
        reader.onerror = () => reject(new Error("Fotoğraf okunamadı."));
        reader.readAsDataURL(file);
      })));
      setNoteImages((current) => [...current, ...images]);
      setFileName(images.length === 1 ? images[0].name : `${images.length} fotoğraf seçildi`);
    }
    if (!textFile && !imageFiles.length) setError(".txt, .md veya fotoğraf dosyası seçebilirsin.");
    event.target.value = "";
  };

  const generateQuiz = async () => {
    if (notes.trim().length < 30 && !noteImages.length) {
      setError("Önce notlarını yaz veya fotoğraflarını yükle.");
      return;
    }
    setError("");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, images: noteImages, count: questionCount, difficulty }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Test oluşturulamadı.");
      setQuestions(data.questions);
      setActiveQuestion(0);
      setSelectedAnswer(null);
      setAnswers({});
      setIsFinished(false);
      setShowResults(false);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Beklenmeyen bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQuestion = questions[activeQuestion];
  const progress = questions.length ? ((activeQuestion + 1) / questions.length) * 100 : 0;
  const score = questions.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0);

  const selectAnswer = (index: number) => {
    setSelectedAnswer(index);
    setAnswers((current) => ({ ...current, [activeQuestion]: index }));
  };

  const goToQuestion = (index: number) => {
    setActiveQuestion(index);
    setSelectedAnswer(answers[index] ?? null);
  };

  const answerClassName = (index: number) => {
    if (!isFinished) return selectedAnswer === index ? "answer selected" : "answer";
    if (index === currentQuestion?.answer) return "answer correct";
    if (index === selectedAnswer) return "answer incorrect";
    return "answer";
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">n</span><span>notera</span></div>
        <nav className="nav-list" aria-label="Ana menü">
          <button className="nav-item active"><span className="nav-icon">✦</span> Yeni test</button>
          <button className="nav-item"><span className="nav-icon">◷</span> Testlerim <span className="nav-count">0</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="tip-card"><span className="tip-spark">✦</span><strong>Daha iyi sonuç için</strong><p>Notlarını başlıklar ve önemli kavramlarla düzenle.</p></div>
          <div className="profile"><span className="avatar">A</span><span><strong>Alpada</strong><small>Ücretsiz plan</small></span><span className="more">•••</span></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar"><div><span className="eyebrow">ÇALIŞMA ALANI</span><h1>Yeni test oluştur</h1></div><button className="help-button" aria-label="Yardım">?</button></header>

        <div className="content-grid">
          <section className="notes-panel">
            <div className="section-heading"><div><span className="step">01</span><h2>Notlarını ekle</h2></div><span className="format-note">Türkçe desteklenir</span></div>
            <div className="upload-zone">
              <input id="note-file" type="file" accept=".txt,.md,image/*" multiple onChange={handleFile} />
              <label htmlFor="note-file" className="upload-content"><span className="upload-icon">↑</span><strong>{fileName || "Dosya veya fotoğraf yükle"}</strong><span>{fileName ? "Dosya seçildi" : "Not fotoğraflarını veya .txt dosyanı seç"}</span></label>
            </div>
            {noteImages.length > 0 && <div className="image-previews">{noteImages.map((image, index) => <div className="image-preview" key={`${image.name}-${index}`}><img src={image.data} alt={`${image.name} önizleme`} /><button type="button" onClick={() => setNoteImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} aria-label={`${image.name} fotoğrafını kaldır`}>×</button></div>)}</div>}
            <div className="or-divider"><span>veya notlarını buraya yapıştır</span></div>
            <textarea className="notes-input" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ders notlarını, özetlerini veya çalışma metnini buraya ekle..." spellCheck="false" />
            <div className="notes-footer"><span>{notes.length.toLocaleString("tr-TR")} karakter</span><button className="text-button" onClick={() => setNotes(sampleNotes)}>Örnek notları kullan ↗</button></div>

            <div className="section-heading settings-heading"><div><span className="step">02</span><h2>Testini ayarla</h2></div></div>
            <div className="settings-row"><div><label>Soru sayısı</label><p>Testte kaç soru olsun?</p></div><div className="stepper"><button onClick={() => setQuestionCount(Math.max(5, questionCount - 5))} aria-label="Soru sayısını azalt">−</button><strong>{questionCount}</strong><button onClick={() => setQuestionCount(Math.min(20, questionCount + 5))} aria-label="Soru sayısını artır">+</button></div></div>
            <div className="settings-row"><div><label>Zorluk</label><p>Soruların seviyesini seç</p></div><div className="segmented">{["Kolay", "Orta", "Zor"].map((level) => <button key={level} className={difficulty === level ? "selected" : ""} onClick={() => setDifficulty(level)}>{level}</button>)}</div></div>
            {error && <p className="error-message">{error}</p>}
            <button className="generate-button" onClick={generateQuiz} disabled={isGenerating}>{isGenerating ? <><span className="spinner" /> Testin hazırlanıyor...</> : <>Testi oluştur <span>↗</span></>}</button>
          </section>

          <section className={`quiz-panel ${questions.length ? "has-quiz" : ""}`}>
            {showResults ? <div className="results-view"><div className="result-badge">✓</div><span className="eyebrow">TEST TAMAMLANDI</span><h2>Sonuçların hazır.</h2><div className="score-number">{score}<span> / {questions.length}</span></div><p>{score === questions.length ? "Harika, bütün soruları doğru cevapladın!" : `${questions.length} sorudan ${score} tanesini doğru cevapladın.`}</p><button className="next-button" onClick={() => { setShowResults(false); setIsFinished(true); goToQuestion(0); }}>Cevapları incele →</button></div> : currentQuestion ? <>
              <div className="quiz-header"><div><span className="eyebrow">HAZIR</span><h2>Notlarından test</h2></div><span className="question-counter">{activeQuestion + 1} <i>/</i> {questions.length}</span></div>
              <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              <div className="question-card"><span className="question-label">SORU {String(activeQuestion + 1).padStart(2, "0")}</span><h3>{currentQuestion.question}</h3><div className="answers">{currentQuestion.options.map((option, index) => <button key={option} className={answerClassName(index)} onClick={() => selectAnswer(index)} disabled={isFinished}><span>{String.fromCharCode(65 + index)}</span>{option}{isFinished && index === currentQuestion.answer && <b className="answer-status">Doğru</b>}{isFinished && index === selectedAnswer && index !== currentQuestion.answer && <b className="answer-status">Senin cevabın</b>}</button>)}</div></div>
              <div className="quiz-actions"><button className="secondary-button" onClick={() => goToQuestion(Math.max(0, activeQuestion - 1))} disabled={activeQuestion === 0}>← Önceki</button>{activeQuestion === questions.length - 1 ? <button className="next-button" onClick={() => setShowResults(true)}>{isFinished ? "Sonuçlara dön" : "Testi bitir ✓"}</button> : <button className="next-button" onClick={() => goToQuestion(activeQuestion + 1)}>Sonraki →</button>}</div>
            </> : <div className="empty-quiz"><div className="empty-orbit"><span>✦</span></div><span className="eyebrow">TEST ÖNİZLEMESİ</span><h2>Notların burada<br />sorulara dönüşecek.</h2><p>Notlarını eklediğinde yapay zekâ senin için dengeli ve anlaşılır bir test hazırlayacak.</p><div className="empty-line" /><span className="empty-meta">Henüz test oluşturulmadı</span></div>}
          </section>
        </div>
        <footer className="footer-note"><span>notera · akıllı çalışma alanın</span><span>Verilerin güvende · Gemini API ile güçlendirilmiştir</span></footer>
      </section>
    </main>
  );
}
