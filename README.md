# notera

Türkçe notlarından test oluşturur. Notlarını yazabilir, `.txt` / `.md` dosyası veya not fotoğrafları yükleyebilirsin.

## Kurulum

1. Google AI Studio'dan bir Gemini API anahtarı al.
2. Bu projenin ana klasöründe `.env.local` adında bir dosya oluştur. Yani `package.json` dosyasının yanına.
3. `.env.local` içine bunu yaz ve kendi anahtarını ekle:

```env
GEMINI_API_KEY=buraya_api_anahtarini_yaz
```

4. Terminalde çalıştır:

```bash
npm run dev
```

5. Tarayıcıda `http://localhost:3000` adresini aç.

API anahtarını `app/page.tsx` içine yazma. Anahtar `.env.local` dosyasında kalır ve tarayıcıya gönderilmez.
