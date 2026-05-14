import { useState } from "react";
import "./App.css";

// ─── Decision Tree Data ────────────────────────────────────────────────────
// Reflects the tree in the image exactly.
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
    desc: "Pelanggar merupakan individu dewasa yang melakukan pelanggaran lalu lintas pada jam siang hari. Umumnya terjadi karena kesibukan atau terburu-buru.",
    samples: 57,
    gini: "0.000",
    confidence: "100%",
  },
  "remaja-siang": {
    cssClass: "remaja-siang",
    icon: "🛵",
    label: "Kategori Teridentifikasi",
    title: "Pelanggar Remaja\nSiang Hari",
    desc: "Pelanggar adalah remaja yang melanggar lalu lintas di siang hari. Kelompok ini sering kurang memperhatikan rambu-rambu lalu lintas.",
    samples: 31,
    gini: "0.000",
    confidence: "100%",
  },
  "dewasa-sore": {
    cssClass: "dewasa-sore",
    icon: "🚙",
    label: "Kategori Teridentifikasi",
    title: "Pelanggar Dewasa\nSore Hari",
    desc: "Pelanggar adalah orang dewasa yang melakukan pelanggaran pada sore hari, biasanya saat jam pulang kerja dengan kepadatan lalu lintas tinggi.",
    samples: 34,
    gini: "0.000",
    confidence: "100%",
  },
  "remaja-sore": {
    cssClass: "remaja-sore",
    icon: "🏍️",
    label: "Kategori Teridentifikasi",
    title: "Pelanggar Remaja\nSore Hari",
    desc: "Pelanggar adalah remaja yang melanggar lalu lintas di sore hari. Risiko kecelakaan lebih tinggi akibat kurangnya pengalaman berkendara.",
    samples: 22,
    gini: "0.000",
    confidence: "100%",
  },
  ganda: {
    cssClass: "ganda",
    icon: "⚠️",
    label: "Kategori Teridentifikasi",
    title: "Pelanggar\nPelanggaran Ganda",
    desc: "Pelanggar termasuk dalam kategori pelanggaran ganda — melakukan lebih dari satu jenis pelanggaran sekaligus. Memerlukan penanganan lebih serius.",
    samples: 7,
    gini: "0.000",
    confidence: "100%",
  },
};

// ─── Component ────────────────────────────────────────────────────────────
export default function App() {
  const [currentNode, setCurrentNode] = useState(TREE);
  const [history, setHistory] = useState([]);  // [{question, chosen}]
  const [result, setResult] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const totalSteps = 3; // max depth of tree
  const stepNum = history.length + 1;

  const handleOption = (option) => {
    const newHistory = [...history, { question: currentNode.question, chosen: option.label }];
    setHistory(newHistory);

    if (option.result) {
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
      {/* ── Header ── */}
      <header className="header">
        <div className="header-badge">Decision Tree · Lalu Lintas</div>
        <h1>
          Identifikasi <span>Pelanggar</span>
          <br />
          Lalu Lintas
        </h1>
        <p>
          Jawab beberapa pertanyaan singkat untuk menentukan profil
          pelanggaran lalu lintas berdasarkan model decision tree.
        </p>
      </header>

      {/* ── Progress ── */}
      <div className="progress-bar-wrap">
        <div className="progress-label">
          <span>Langkah {result ? totalSteps : history.length} / {totalSteps}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* ── Question Card ── */}
      {!result && (
        <div className="card" key={animKey}>
          <div className="step-num">Pertanyaan {stepNum} dari {totalSteps}</div>
          <h2 className="question">{currentNode.question}</h2>
          <p className="question-hint">{currentNode.hint}</p>

          <div className="options">
            {currentNode.options.map((opt, i) => (
              <button
                key={i}
                className="option-btn"
                onClick={() => handleOption(opt)}
              >
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

      {/* ── Result Card ── */}
      {result && (
        <div className={`result-card ${result.cssClass}`}>
          <div className="result-glow" />
          <span className="result-icon">{result.icon}</span>
          <div className="result-label">{result.label}</div>
          <h2 className="result-title">
            {result.title.split("\n").map((line, i) => (
              <span key={i}>{line}<br /></span>
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

      {/* ── Breadcrumb Trail ── */}
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
