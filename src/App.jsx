import { useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./lib/supabase";

// ─── Decision Tree Data ────────────────────────────────────────────────────
const TREE = {
  id: "root",
  question: "Kapan waktu pelanggaran terjadi?",
  hint: "Waktu Pengamatan ≤ 0.5 mengacu pada rentang waktu pagi hingga siang hari",
  options: [
    {
      label: "Pagi / Siang Hari",
      sub: "Waktu Pengamatan ≤ 0.5",
      icon: "☀️",
      next: {
        id: "left1",
        question: "Siapakah profil pelanggar?",
        hint: "Profil Pelanggar ≤ 2.5 berarti pelanggar termasuk kategori dewasa",
        options: [
          {
            label: "Dewasa",
            sub: "Profil Pelanggar ≤ 2.5",
            icon: "🧑",
            next: {
              id: "left2",
              question: "Apa jenis pelanggarannya?",
              hint: "Jenis Pelanggaran ≤ 0.5 mengacu pada pelanggaran ringan / tunggal",
              options: [
                {
                  label: "Pelanggaran Ringan / Tunggal",
                  sub: "Jenis Pelanggaran ≤ 0.5",
                  icon: "🚦",
                  result: "dewasa-siang",
                },
                {
                  label: "Pelanggaran Berat / Ganda",
                  sub: "Jenis Pelanggaran > 0.5",
                  icon: "🚨",
                  result: "ganda",
                },
              ],
            },
          },
          {
            label: "Remaja",
            sub: "Profil Pelanggar > 2.5",
            icon: "🧒",
            result: "remaja-siang",
          },
        ],
      },
    },
    {
      label: "Sore / Malam Hari",
      sub: "Waktu Pengamatan > 0.5",
      icon: "🌙",
      next: {
        id: "right1",
        question: "Siapakah profil pelanggar?",
        hint: "Profil Pelanggar ≤ 2.5 berarti pelanggar termasuk kategori dewasa",
        options: [
          {
            label: "Dewasa",
            sub: "Profil Pelanggar ≤ 2.5",
            icon: "🧑",
            next: {
              id: "right2",
              question: "Apa jenis pelanggarannya?",
              hint: "Jenis Pelanggaran ≤ 1.0 mengacu pada pelanggaran ringan / tunggal",
              options: [
                {
                  label: "Pelanggaran Ringan / Tunggal",
                  sub: "Jenis Pelanggaran ≤ 1.0",
                  icon: "🚦",
                  result: "dewasa-sore",
                },
                {
                  label: "Pelanggaran Berat / Ganda",
                  sub: "Jenis Pelanggaran > 1.0",
                  icon: "🚨",
                  result: "ganda",
                },
              ],
            },
          },
          {
            label: "Remaja",
            sub: "Profil Pelanggar > 2.5",
            icon: "🧒",
            result: "remaja-sore",
          },
        ],
      },
    },
  ],
};

// ─── Result Metadata ───────────────────────────────────────────────────────
const RESULTS = {
  "dewasa-siang": {
    cssClass: "dewasa-siang",
    icon: "🚗",
    label: "Kategori Teridentifikasi",
    title: "Pelanggar Dewasa\nSiang Hari",
    desc: "Pelanggar merupakan individu dewasa yang melakukan pelanggaran lalu lintas pada jam siang hari.",
    samples: 57,
    gini: "0.000",
    confidence: "100%",
  },

  "remaja-siang": {
    cssClass: "remaja-siang",
    icon: "🛵",
    label: "Kategori Teridentifikasi",
    title: "Pelanggar Remaja\nSiang Hari",
    desc: "Pelanggar adalah remaja yang melanggar lalu lintas di siang hari.",
    samples: 31,
    gini: "0.000",
    confidence: "100%",
  },

  "dewasa-sore": {
    cssClass: "dewasa-sore",
    icon: "🚙",
    label: "Kategori Teridentifikasi",
    title: "Pelanggar Dewasa\nSore Hari",
    desc: "Pelanggar adalah orang dewasa yang melakukan pelanggaran pada sore hari.",
    samples: 34,
    gini: "0.000",
    confidence: "100%",
  },

  "remaja-sore": {
    cssClass: "remaja-sore",
    icon: "🏍️",
    label: "Kategori Teridentifikasi",
    title: "Pelanggar Remaja\nSore Hari",
    desc: "Pelanggar adalah remaja yang melanggar lalu lintas di sore hari.",
    samples: 22,
    gini: "0.000",
    confidence: "100%",
  },

  ganda: {
    cssClass: "ganda",
    icon: "⚠️",
    label: "Kategori Teridentifikasi",
    title: "Pelanggar\nPelanggaran Ganda",
    desc: "Pelanggar melakukan lebih dari satu pelanggaran sekaligus.",
    samples: 7,
    gini: "0.000",
    confidence: "100%",
  },
};

// ─── Component ────────────────────────────────────────────────────────────
export default function App() {
  const [currentNode, setCurrentNode] = useState(TREE);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  // TEST KONEKSI SUPABASE
  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    const { data, error } = await supabase
      .from("result_categories")
      .select("*");

    console.log("DATA :", data);
    console.log("ERROR :", error);
  };

  const totalSteps = 3;
  const stepNum = history.length + 1;

  // SIMPAN JAWABAN USER KE SUPABASE
  const saveAnswer = async (question, answer) => {
    const { error } = await supabase.from("identification_answers").insert([
      {
        question: question,
        chosen_answer: answer,
      },
    ]);

    if (error) {
      console.log("ERROR SIMPAN :", error);
    } else {
      console.log("Jawaban berhasil disimpan");
    }
  };

 const handleOption = async (option) => {
   const newHistory = [
     ...history,
     {
       question: currentNode.question,
       chosen: option.label,
     },
   ];

   setHistory(newHistory);

   // HASIL AKHIR
   if (option.result) {
     let waktu = "";
     let profil = "";
     let jenis = "";

     newHistory.forEach((item) => {
       if (item.question.includes("Kapan")) {
         waktu = item.chosen;
       }

       if (item.question.includes("profil")) {
         profil = item.chosen;
       }

       if (item.question.includes("jenis")) {
         jenis = item.chosen;
       }
     });

     // JIKA TIDAK ADA PERTANYAAN JENIS
     if (!jenis) {
       jenis = option.label;
     }

     const { data, error } = await supabase.from("pelanggaran_history").insert([
       {
         waktu_pelanggaran: waktu,
         profil_pelanggar: profil,
         jenis_pelanggaran: jenis,
       },
     ]);

     console.log("DATA :", data);
     console.log("ERROR :", error);

     setResult(RESULTS[option.result]);
   } else {
     setAnimKey((k) => k + 1);
     setCurrentNode(option.next);
   }
 };

  const handleReset = () => {
    setCurrentNode(TREE);
    setHistory([]);
    setResult(null);
    setAnimKey((k) => k + 1);
  };

  const progressPercent = result
    ? 100
    : Math.round((history.length / totalSteps) * 100);

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', marginBottom: '2rem', flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <img
            src="/Logo Utama.png"
            alt="Politeknik Caltex Riau"
            style={{ height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}
          />
          <img
            src="/Logo Unggul.png"
            alt="Akreditasi Unggul"
            style={{ height: '60px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}
          />
          <img
            src="/IDEAL.png"
            alt="I.D.E.A.L."
            style={{ height: '35px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}
          />
          <img
            src="/Logo ITSA.png"
            alt="ITSA"
            style={{ height: '60px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}
          />
        </div>
        <div className="header-badge">Decision Tree · Lalu Lintas</div>

        <h1>
          Identifikasi <span>Pelanggar</span>
          <br />
          Lalu Lintas
        </h1>

        <p>
          Jawab beberapa pertanyaan singkat untuk menentukan profil pelanggaran
          lalu lintas berdasarkan model decision tree.
        </p>
      </header>

      {/* PROGRESS */}
      <div className="progress-bar-wrap">
        <div className="progress-label">
          <span>
            Langkah {result ? totalSteps : history.length} / {totalSteps}
          </span>

          <span>{progressPercent}%</span>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* QUESTION */}
      {!result && (
        <div className="card" key={animKey}>
          <div className="step-num">
            Pertanyaan {stepNum} dari {totalSteps}
          </div>

          <h2 className="question">{currentNode.question}</h2>

          <p className="question-hint">{currentNode.hint}</p>

          <div className="options">
            {currentNode.options.map((opt, i) => (
              <button
                key={i}
                className="option-btn"
                onClick={() => handleOption(opt)}>
                <span className="option-icon">{opt.icon}</span>

                <span>
                  <div className="option-label">{opt.label}</div>

                  <div className="option-sub">{opt.sub}</div>
                </span>

                <span className="option-arrow">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className={`result-card ${result.cssClass}`}>
          <div className="result-glow" />

          <span className="result-icon">{result.icon}</span>

          <div className="result-label">{result.label}</div>

          <h2 className="result-title">
            {result.title.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </h2>

          <p className="result-desc">{result.desc}</p>

          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-val">{result.samples}</div>

              <div className="stat-key">Sampel Data</div>
            </div>

            <div className="stat-box">
              <div className="stat-val">{result.gini}</div>

              <div className="stat-key">Gini Index</div>
            </div>

            <div className="stat-box">
              <div className="stat-val">{result.confidence}</div>

              <div className="stat-key">Kepastian</div>
            </div>
          </div>

          <button className="reset-btn" onClick={handleReset}>
            ↺ &nbsp; Mulai Ulang Identifikasi
          </button>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div className="trail">
          {history.map((item, i) => (
            <div className="trail-item" key={i}>
              <span className="trail-dot" />
              {item.chosen}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
