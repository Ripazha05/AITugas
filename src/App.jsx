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
  
  // DASHBOARD STATS STATE
  const [showStats, setShowStats] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // AMBIL DATA STATISTIK DARI SUPABASE
  const fetchHistoryData = async () => {
    setIsLoadingStats(true);
    setShowStats(true);
    const { data, error } = await supabase
      .from("pelanggaran_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setHistoryData(data);
    } else {
      console.log("ERROR AMBIL STATS:", error);
    }
    setIsLoadingStats(false);
  };

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

  // ANALYTICS DATA CALCULATION
  const totalSamples = Object.values(RESULTS).reduce((sum, r) => sum + r.samples, 0);
  let currentAccum = 0;
  const gradientStops = Object.values(RESULTS).map((r) => {
    const percent = (r.samples / totalSamples) * 100;
    const start = currentAccum;
    const end = currentAccum + percent;
    currentAccum = end;
    return `var(--${r.cssClass}) ${start}% ${end}%`;
  }).join(', ');

  return (
    <div className="app">
      {/* BACKGROUND AMBIENCE & DECORATIONS */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="bg-shape shape-1">✦</div>
      <div className="bg-shape shape-2">🚦</div>
      <div className="bg-shape shape-3">+</div>
      <div className="bg-shape shape-4">🚗</div>
      <div className="bg-shape shape-5">✦</div>
      <div className="bg-shape shape-6">⚠️</div>
      <div className="bg-shape shape-7">x</div>
      <div className="bg-shape shape-8">🛑</div>

      {/* HEADER */}
      <header className="header">
        <div className="header-logos">
          <img src="/Logo Utama.png" alt="Politeknik Caltex Riau" className="floating-logo l-1" />
          <img src="/Logo Unggul.png" alt="Akreditasi Unggul" className="floating-logo l-2" />
          <img src="/IDEAL.png" alt="I.D.E.A.L." className="floating-logo l-3" />
          <img src="/Logo ITSA.png" alt="ITSA" className="floating-logo l-4" />
        </div>
        <div className="header-badge">Decision Tree · Lalu Lintas</div>

        <h3 className="kelompok-title">Kelompok 2</h3>

        <h1>
          Sistem Deteksi <span>Pelanggar</span>
          <br />
          Lalu Lintas
        </h1>

        <p>
          Jawab beberapa pertanyaan singkat untuk menentukan profil pelanggaran
          lalu lintas berdasarkan model decision tree.
        </p>
      </header>

      {/* PROGRESS */}
      {!showStats && (
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
      )}

      {/* QUESTION */}
      {!result && !showStats && (
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

          {/* TOMBOL STATS DI HALAMAN AWAL */}
          {history.length === 0 && (
            <button className="view-stats-btn" onClick={fetchHistoryData}>
              📊 Lihat Database & Statistik Pelanggar
            </button>
          )}
        </div>
      )}

      {/* RESULT */}
      {result && !showStats && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
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

            <div className="stats-row" style={{ marginBottom: 0 }}>
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
          </div>

          {/* AI ANALYTICS DASHBOARD */}
          <div className="analytics-card">
            <div className="analytics-header">
              <div style={{ textAlign: 'left' }}>
                <div className="analytics-subtitle">AI Analytics</div>
                <h3 className="analytics-title">Smart Dashboard</h3>
              </div>
              <div className="analytics-icon">🧠</div>
            </div>

            <div className="donut-wrapper">
              <div 
                className="donut-chart" 
                style={{ background: `conic-gradient(${gradientStops})` }}
              >
                <div className="donut-hole">
                  <div className="donut-center-text">{totalSamples}</div>
                  <div className="donut-center-sub">Total Data</div>
                </div>
              </div>
            </div>

            <div className="analytics-stats-grid">
              {Object.values(RESULTS).map((r, idx) => {
                const pct = Math.round((r.samples / totalSamples) * 100);
                return (
                  <div key={idx} className={`stat-card ${r.cssClass}`}>
                    <div className="stat-card-pct">{pct}%</div>
                    <div className="stat-card-label">{r.title.replace('\n', ' ')}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <button className="reset-btn" onClick={handleReset} style={{ marginTop: '32px' }}>
            ↺ &nbsp; Mulai Ulang Identifikasi
          </button>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && !result && !showStats && (
        <div className="trail">
          {history.map((item, i) => (
            <div className="trail-item" key={i}>
              <span className="trail-dot" />
              {item.chosen}
            </div>
          ))}
        </div>
      )}

      {/* STATS DASHBOARD (NEW FEATURE) */}
      {showStats && (
        <div className="stats-dashboard-container">
          <div className="stats-dashboard-header">
            <h2 className="stats-dashboard-title">Rekapitulasi Database Pelanggar</h2>
            <button className="back-btn" onClick={() => setShowStats(false)}>
              ✖ Tutup Dashboard
            </button>
          </div>

          {isLoadingStats ? (
            <div className="loading-state">Memuat data dari Supabase...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="stats-overview-grid">
                <div className="overview-card">
                  <div className="overview-val">{historyData.length}</div>
                  <div className="overview-label">Total Data</div>
                </div>
                <div className="overview-card">
                   <div className="overview-val" style={{ color: 'var(--dewasa-siang)' }}>
                     {historyData.filter(d => d.profil_pelanggar === 'Dewasa').length}
                   </div>
                   <div className="overview-label">Dewasa</div>
                </div>
                <div className="overview-card">
                   <div className="overview-val" style={{ color: 'var(--remaja-siang)' }}>
                     {historyData.filter(d => d.profil_pelanggar === 'Remaja').length}
                   </div>
                   <div className="overview-label">Remaja</div>
                </div>
              </div>

              {/* BAR CHART DECORATION */}
              <div className="stats-chart-wrapper">
                <h3 className="chart-title">Distribusi Jenis Pelanggaran</h3>
                <div className="bar-chart">
                  {(() => {
                    const groupedData = historyData.reduce((acc, curr) => {
                      acc[curr.jenis_pelanggaran] = (acc[curr.jenis_pelanggaran] || 0) + 1;
                      return acc;
                    }, {});
                    const chartData = Object.entries(groupedData)
                      .map(([label, count]) => ({ label, count }))
                      .sort((a, b) => b.count - a.count);
                    const maxCount = Math.max(...chartData.map(d => d.count), 1);

                    if (chartData.length === 0) {
                      return <div className="bar-empty">Belum ada data untuk ditampilkan</div>;
                    }

                    return chartData.map((item, idx) => (
                      <div className="bar-row" key={idx}>
                        <div className="bar-label">{item.label}</div>
                        <div className="bar-track">
                          <div 
                            className="bar-fill" 
                            style={{ 
                              width: `${(item.count / maxCount) * 100}%`,
                              background: `linear-gradient(90deg, rgba(249,115,22,0.8), rgba(168,85,247,0.8))`
                            }}
                          >
                             <span className="bar-value">{item.count}</span>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Data Table */}
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Waktu</th>
                      <th>Profil</th>
                      <th>Jenis Pelanggaran</th>
                      <th>Tanggal Record</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <span className={`table-badge ${item.waktu_pelanggaran?.includes('Pagi') ? 'badge-pagi' : 'badge-sore'}`}>
                            {item.waktu_pelanggaran}
                          </span>
                        </td>
                        <td>{item.profil_pelanggar}</td>
                        <td>{item.jenis_pelanggaran}</td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(item.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                      </tr>
                    ))}
                    {historyData.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{textAlign:'center', padding: '3rem', color: 'var(--text-muted)'}}>
                          Belum ada data riwayat di database Supabase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
