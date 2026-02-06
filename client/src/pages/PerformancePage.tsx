import { useContext, useEffect, useMemo, useState } from "react";
import AuthContext from "../contexts/AuthContext";

type IzvestajPerformanse = {
  id: number;
  nazivIzvestaja?: string;
  algoritam?: string;
  rezultatiJson?: string;
  zakljucak?: string;
  datumKreiranja?: string;
  [key: string]: any;
};

type SimulacijaRequest = {
  algoritam: string;
  [key: string]: any;
};

type RezultatiPayload = {
  algorithm?: string;
  input?: {
    brojZahteva?: number;
    targetLatency?: number;
    targetThroughput?: number;
    errorRate?: number;
    seed?: any;
    [k: string]: any;
  };
  output?: {
    latencyAvgMs?: number;
    throughputPerSec?: number;
    errors?: number;
    success?: number;
    durationSec?: number;
    timestamp?: string;
    [k: string]: any;
  };
  [k: string]: any;
};

function safeParseRezultati(rezultatiJson?: string): RezultatiPayload | null {
  if (!rezultatiJson || typeof rezultatiJson !== "string") return null;
  try {
    return JSON.parse(rezultatiJson) as RezultatiPayload;
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatNumber(n: number | undefined | null, digits = 0) {
  if (n === undefined || n === null || Number.isNaN(n)) return "-";
  return n.toFixed(digits);
}

function efficiencyPercent(success?: number, errors?: number) {
  const s = success ?? 0;
  const e = errors ?? 0;
  const total = s + e;
  if (total <= 0) return 0;
  return (s / total) * 100;
}

function pickLatestPerAlgorithm(items: IzvestajPerformanse[]) {
  const map = new Map<string, IzvestajPerformanse>();
  for (const it of items) {
    const key = (it.algoritam ?? safeParseRezultati(it.rezultatiJson)?.algorithm ?? "Nepoznato").toString();
    const prev = map.get(key);
    if (!prev) {
      map.set(key, it);
      continue;
    }
    const prevDate = prev.datumKreiranja ? Date.parse(prev.datumKreiranja) : NaN;
    const curDate = it.datumKreiranja ? Date.parse(it.datumKreiranja) : NaN;

    if (!Number.isNaN(curDate) && !Number.isNaN(prevDate)) {
      if (curDate > prevDate) map.set(key, it);
    } else {
      if ((it.id ?? 0) > (prev.id ?? 0)) map.set(key, it);
    }
  }
  return Array.from(map.entries()).map(([alg, report]) => ({ alg, report }));
}

function SvgBarChart({
  title,
  data,
  valueLabel,
}: {
  title: string;
  data: { label: string; value: number }[];
  valueLabel: (v: number) => string;
}) {
  const w = 520;
  const h = 180;
  const pad = 26;

  const maxV = Math.max(...data.map((i) => i.value), 1);
  const bw = (w - 2 * pad) / Math.max(1, data.length);

  return (
    <div style={ui.card}>
      <div style={ui.cardHead}>{title}</div>

      <div style={{ padding: "10px 14px 12px 14px" }}>
        {data.length === 0 ? (
          <div style={ui.mutedSmall}>Nema dovoljno podataka za grafikon.</div>
        ) : (
          <>
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
              <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(2,6,23,0.22)" strokeWidth="1" />
              <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="rgba(2,6,23,0.22)" strokeWidth="1" />

              {data.map((b, i) => {
                const x = pad + i * bw + 6;
                const barH = ((h - 2 * pad) * b.value) / maxV;
                const y = h - pad - barH;

                return (
                  <g key={b.label}>
                    <rect
                      x={x}
                      y={y}
                      width={Math.max(4, bw - 12)}
                      height={barH}
                      fill="rgba(22,163,74,0.75)"
                      rx={6}
                    />
                    <text
                      x={x + Math.max(4, bw - 12) / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fill="rgba(2,6,23,0.62)"
                    >
                      {valueLabel(b.value)}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div style={ui.chartLabels}>
              {data.map((d) => (
                <span key={d.label} style={{ whiteSpace: "nowrap" }}>
                  {d.label}
                </span>
              ))}
            </div>

            <div style={ui.mutedSmall}>
              max: <b style={{ color: "#0f172a" }}>{valueLabel(maxV)}</b>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div style={ui.statCard}>
      <div style={ui.statLabel}>{title}</div>
      <div style={ui.statValue}>{value}</div>
      {sub ? <div style={ui.mutedSmall}>{sub}</div> : null}
    </div>
  );
}

/** UI stilovi (analytics fazon) – samo vizuelno, bez promene logike */
const ui: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#0f172a",
    padding: "18px 0 26px",
  },
  shell: {
    width: "1200px",
    maxWidth: "96%",
    margin: "0 auto",
  },

  top: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 14,
    padding: "14px 14px 10px 14px",
    borderRadius: 16,
    background: "#fff",
    border: "1px solid rgba(2,6,23,0.08)",
    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
    flexWrap: "wrap",
  },
  kicker: {
    fontWeight: 900,
    fontSize: 12,
    color: "rgba(15,23,42,0.55)",
    letterSpacing: "0.2px",
  },
  h1: {
    margin: "2px 0 0 0",
    fontSize: 22,
    fontWeight: 950,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(15,23,42,0.62)",
    maxWidth: 720,
  },

  topRight: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  btn: {
    border: "1px solid rgba(2,6,23,0.12)",
    background: "#fff",
    color: "#0f172a",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
  },
  btnPrimary: {
    background: "#16a34a",
    border: "1px solid rgba(22,163,74,0.25)",
    color: "#fff",
    boxShadow: "0 10px 22px rgba(22,163,74,0.22)",
  },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },

  alert: {
    marginTop: 12,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(196,43,28,0.24)",
    background: "rgba(196,43,28,0.06)",
    color: "#7f1d1d",
    fontWeight: 850,
  },

  card: {
    background: "#fff",
    border: "1px solid rgba(2,6,23,0.10)",
    borderRadius: 16,
    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
    overflow: "hidden",
  },
  cardHead: {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(2,6,23,0.06)",
    fontWeight: 950,
    letterSpacing: "0.2px",
  },
  cardBody: { padding: 14 },

  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.9fr 0.9fr 1fr 0.7fr",
    gap: 12,
  },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 12, fontWeight: 950, color: "rgba(15,23,42,0.60)" },
  input: {
    width: "100%",
    background: "#fff",
    border: "1px solid rgba(2,6,23,0.14)",
    borderRadius: 12,
    padding: "10px 10px",
    fontWeight: 850,
    color: "#0f172a",
    outline: "none",
  },

  stats: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  statCard: {
    padding: 14,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid rgba(2,6,23,0.08)",
    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
  },
  statLabel: { fontSize: 12, fontWeight: 950, color: "rgba(15,23,42,0.64)", marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: 950, color: "#0f172a", letterSpacing: "0.2px" },

  grid2: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    alignItems: "stretch",
  },

  mutedSmall: { fontSize: 12, color: "rgba(15,23,42,0.62)", fontWeight: 750 },
  chartLabels: {
    display: "flex",
    gap: 8,
    justifyContent: "space-between",
    marginTop: 8,
    fontSize: 12,
    color: "rgba(15,23,42,0.62)",
    flexWrap: "wrap",
  },

  tableWrap: {
    overflow: "auto",
    borderRadius: 12,
    border: "1px solid rgba(2,6,23,0.08)",
    maxHeight: 360,
  },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 820 },
  th: {
    textAlign: "left",
    fontSize: 12,
    color: "rgba(15,23,42,0.62)",
    padding: "10px 10px",
    background: "rgba(15,23,42,0.02)",
    borderBottom: "1px solid rgba(2,6,23,0.08)",
    fontWeight: 950,
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: "10px 10px",
    borderTop: "1px solid rgba(2,6,23,0.06)",
    fontWeight: 750,
    color: "#0f172a",
    verticalAlign: "top",
  },
};

export const PerformancePage = () => {
  const auth = useContext(AuthContext);
  const gatewayUrl = import.meta.env.VITE_GATEWAY_URL as string;

  const headers = useMemo(() => {
    return {
      Authorization: `Bearer ${auth?.token ?? ""}`,
      "Content-Type": "application/json",
    };
  }, [auth?.token]);

  const [algoritamFilter, setAlgoritamFilter] = useState<string>("");
  const [od, setOd] = useState<string>("");
  const [doDat, setDoDat] = useState<string>("");

  const [izvestaji, setIzvestaji] = useState<IzvestajPerformanse[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string>("");

  const [algoritam, setAlgoritam] = useState<string>("");
  const [brojZahteva, setBrojZahteva] = useState<number>(200);
  const [targetLatency, setTargetLatency] = useState<number>(180);
  const [targetThroughput, setTargetThroughput] = useState<number>(40);
  const [errorRate, setErrorRate] = useState<number>(0.01);

  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string>("");
  const [simResult, setSimResult] = useState<any>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [details, setDetails] = useState<IzvestajPerformanse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string>("");

  const canCallApi = !!auth?.token && !!gatewayUrl;

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (algoritamFilter.trim()) params.set("algoritam", algoritamFilter.trim());
    if (od.trim()) params.set("od", od.trim());
    if (doDat.trim()) params.set("do", doDat.trim());
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const ucitajIzvestaje = async () => {
    if (!canCallApi) return;

    setLoadingList(true);
    setListError("");
    try {
      const r = await fetch(`${gatewayUrl}/performance/izvestaji${buildQuery()}`, {
        headers: { Authorization: `Bearer ${auth!.token}` },
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`Neuspešno učitavanje izveštaja (${r.status}). ${txt}`);
      }

      const data = (await r.json()) as IzvestajPerformanse[];
      setIzvestaji(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setListError(e?.message ?? "Greška pri učitavanju izveštaja.");
      setIzvestaji([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (canCallApi) ucitajIzvestaje();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCallApi]);

  const pokreniSimulaciju = async () => {
    if (!canCallApi) {
      setSimError("Nema tokena (uloguj se).");
      return;
    }
    if (!algoritam.trim()) {
      setSimError("Izaberi algoritam.");
      return;
    }

    setSimLoading(true);
    setSimError("");
    setSimResult(null);

    const payload: SimulacijaRequest = {
      algoritam: algoritam.trim(),
      brojZahteva,
      targetLatency,
      targetThroughput,
      errorRate,
    };

    try {
      const r = await fetch(`${gatewayUrl}/performance/simulacije`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`Simulacija nije uspela (${r.status}). ${txt}`);
      }

      const data = await r.json();
      setSimResult(data);

      await ucitajIzvestaje();
    } catch (e: any) {
      setSimError(e?.message ?? "Greška pri pokretanju simulacije.");
    } finally {
      setSimLoading(false);
    }
  };

  const ucitajDetalje = async (id: number) => {
    if (!canCallApi) return;

    setSelectedId(id);
    setDetails(null);
    setDetailsLoading(true);
    setDetailsError("");

    try {
      const r = await fetch(`${gatewayUrl}/performance/izvestaji/${id}`, {
        headers: { Authorization: `Bearer ${auth!.token}` },
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`Ne mogu da učitam detalje (${r.status}). ${txt}`);
      }

      const data = (await r.json()) as IzvestajPerformanse;
      setDetails(data);
    } catch (e: any) {
      setDetailsError(e?.message ?? "Greška pri učitavanju detalja.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const downloadPdf = async (id: number) => {
    if (!canCallApi) return;

    try {
      const r = await fetch(`${gatewayUrl}/performance/izvestaji/${id}/pdf`, {
        headers: { Authorization: `Bearer ${auth!.token}` },
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`PDF nije dostupan (${r.status}). ${txt}`);
      }

      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);

      const cd = r.headers.get("content-disposition") || "";
      const match = cd.match(/filename="([^"]+)"/i);
      const filename = match?.[1] || `izvestaj_${id}.pdf`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message ?? "Greška pri preuzimanju PDF-a.");
    }
  };

  const latestPerAlg = useMemo(() => pickLatestPerAlgorithm(izvestaji), [izvestaji]);

  const latencyChartData = useMemo(() => {
    return latestPerAlg
      .map(({ alg, report }) => {
        const parsed = safeParseRezultati(report.rezultatiJson);
        const v = parsed?.output?.latencyAvgMs ?? NaN;
        return { label: alg, value: Number.isFinite(v) ? Number(v) : 0 };
      })
      .filter((d) => d.label && d.value >= 0);
  }, [latestPerAlg]);

  const throughputChartData = useMemo(() => {
    return latestPerAlg
      .map(({ alg, report }) => {
        const parsed = safeParseRezultati(report.rezultatiJson);
        const v = parsed?.output?.throughputPerSec ?? NaN;
        return { label: alg, value: Number.isFinite(v) ? Number(v) : 0 };
      })
      .filter((d) => d.label && d.value >= 0);
  }, [latestPerAlg]);

  const detailsParsed = useMemo(() => safeParseRezultati(details?.rezultatiJson), [details?.rezultatiJson]);

  const detailInput = detailsParsed?.input ?? {};
  const detailOutput = detailsParsed?.output ?? {};

  const eff = useMemo(() => clamp(efficiencyPercent(detailOutput.success, detailOutput.errors), 0, 100), [
    detailOutput.success,
    detailOutput.errors,
  ]);

  const latencyOk = useMemo(() => {
    const cur = detailOutput.latencyAvgMs;
    const target = detailInput.targetLatency;
    if (cur === undefined || target === undefined) return null;
    return cur <= target;
  }, [detailOutput.latencyAvgMs, detailInput.targetLatency]);

  const throughputOk = useMemo(() => {
    const cur = detailOutput.throughputPerSec;
    const target = detailInput.targetThroughput;
    if (cur === undefined || target === undefined) return null;
    return cur >= target;
  }, [detailOutput.throughputPerSec, detailInput.targetThroughput]);

  const isNarrow = typeof window !== "undefined" ? window.innerWidth < 980 : false;
  const statsCols = isNarrow ? "repeat(2, 1fr)" : "repeat(4, 1fr)";
  const chartsCols = isNarrow ? "1fr" : "1fr 1fr";

  return (
    <div style={ui.page}>
      <div style={ui.shell}>
        {/* TOP HEADER (kao analytics) */}
        <div style={ui.top}>
          <div>
            <div style={ui.kicker}>Dashboard</div>
            <h1 style={ui.h1}>Analiza performansi</h1>
            <div style={ui.subtitle}>Pokreni simulaciju, pregledaj izveštaje, uporedi algoritme i preuzmi PDF.</div>
          </div>

          <div style={ui.topRight}>
            <button style={ui.btn} onClick={() => window.history.back()}>
              ← Nazad na meni
            </button>

            <button
              style={{ ...ui.btn, ...(loadingList ? ui.btnDisabled : null) }}
              onClick={ucitajIzvestaje}
              disabled={!canCallApi || loadingList}
            >
              {loadingList ? "Učitavam..." : "Osveži listu"}
            </button>
          </div>
        </div>

        {!auth?.token ? (
          <div style={ui.alert}>
            <b>Info:</b> Nisi ulogovana ili token nije dostupan. Uloguj se pa se vrati ovde.
          </div>
        ) : null}

        {/* SIMULACIJA */}
        <div style={{ ...ui.card, marginTop: 12 }}>
          <div style={ui.cardHead}>Pokretanje simulacije</div>

          <div style={ui.cardBody}>
            <div style={{ ...ui.mutedSmall, marginBottom: 10 }}>
              {simLoading ? "Simulacija u toku..." : "Podesi parametre i pokreni"}
            </div>

            <div style={{ ...ui.fieldGrid, gridTemplateColumns: isNarrow ? "1fr 1fr" : ui.fieldGrid.gridTemplateColumns }}>
              <div style={ui.field}>
                <span style={ui.label}>Algoritam</span>
                <select value={algoritam} onChange={(e) => setAlgoritam(e.target.value)} style={ui.input as any}>
                  <option value="">-- izaberi --</option>
                  <option value="Dijkstra">Dijkstra</option>
                  <option value="AStar">A*</option>
                  <option value="AlgoritamA">AlgoritamA</option>
                  <option value="Greedy">Pohlepni</option>
                  <option value="Genetic">Genetski</option>
                </select>
              </div>

              <div style={ui.field}>
                <span style={ui.label}>Broj zahteva</span>
                <input type="number" value={brojZahteva} min={1} onChange={(e) => setBrojZahteva(Number(e.target.value))} style={ui.input} />
              </div>

              <div style={ui.field}>
                <span style={ui.label}>Target latency (ms)</span>
                <input type="number" value={targetLatency} min={1} onChange={(e) => setTargetLatency(Number(e.target.value))} style={ui.input} />
              </div>

              <div style={ui.field}>
                <span style={ui.label}>Target throughput (/s)</span>
                <input type="number" value={targetThroughput} min={1} onChange={(e) => setTargetThroughput(Number(e.target.value))} style={ui.input} />
              </div>

              <div style={ui.field}>
                <span style={ui.label}>Error rate</span>
                <input
                  type="number"
                  step="0.01"
                  value={errorRate}
                  min={0}
                  max={1}
                  onChange={(e) => setErrorRate(Number(e.target.value))}
                  style={ui.input}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {simError ? <span style={{ color: "#7f1d1d", fontWeight: 850, fontSize: 13 }}>{simError}</span> : null}
              </div>

              <button
                style={{ ...ui.btn, ...ui.btnPrimary, ...(simLoading ? ui.btnDisabled : null) }}
                onClick={pokreniSimulaciju}
                disabled={!canCallApi || simLoading}
              >
                {simLoading ? "Pokrećem..." : "Pokreni simulaciju"}
              </button>
            </div>

            {simResult ? (
              <div style={{ ...ui.card, marginTop: 12 }}>
                <div style={{ ...ui.cardHead, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span>Rezultat simulacije</span>
                  <button style={ui.btn} onClick={() => setSimResult(null)}>
                    Sakrij
                  </button>
                </div>

                <div style={ui.cardBody}>
                  <pre
                    style={{
                      margin: 0,
                      overflowX: "auto",
                      fontSize: 12,
                      color: "rgba(2,6,23,0.86)",
                      background: "rgba(15,23,42,0.03)",
                      border: "1px solid rgba(2,6,23,0.08)",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* KPI */}
        <div style={{ ...ui.stats, gridTemplateColumns: statsCols }}>
          <MetricCard title="Broj izveštaja" value={loadingList ? "..." : String(izvestaji.length)} />
          <MetricCard title="Algoritama" value={loadingList ? "..." : String(new Set(latencyChartData.map((d) => d.label)).size)} />
          <MetricCard title="Filter algoritam" value={algoritamFilter?.trim() ? algoritamFilter : "Svi"} />
          <MetricCard title="Izabran izveštaj" value={selectedId ? `ID ${selectedId}` : "—"} />
        </div>

        {/* GRAFICI */}
        <div style={{ ...ui.grid2, gridTemplateColumns: chartsCols }}>
          <SvgBarChart title="Poređenje latencyAvgMs po algoritmu" data={latencyChartData} valueLabel={(v) => `${Math.round(v)} ms`} />
          <SvgBarChart title="Poređenje throughputPerSec po algoritmu" data={throughputChartData} valueLabel={(v) => `${Math.round(v)} /s`} />
        </div>

        {/* IZVEŠTAJI */}
        <div style={{ ...ui.card, marginTop: 12 }}>
          <div style={ui.cardHead}>Izveštaji</div>

          <div style={ui.cardBody}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isNarrow ? "1fr 1fr" : "1fr 170px 170px auto",
                gap: 12,
                alignItems: "end",
                marginBottom: 12,
              }}
            >
              <div style={ui.field}>
                <span style={ui.label}>Algoritam (filter)</span>
                <select value={algoritamFilter} onChange={(e) => setAlgoritamFilter(e.target.value)} style={ui.input as any}>
                  <option value="">-- svi algoritmi --</option>
                  <option value="Dijkstra">Dijkstra</option>
                  <option value="AStar">A*</option>
                  <option value="AlgoritamA">AlgoritamA</option>
                  <option value="Greedy">Pohlepni</option>
                  <option value="Genetic">Genetski</option>
                </select>
              </div>

              <div style={ui.field}>
                <span style={ui.label}>Od</span>
                <input type="date" value={od} onChange={(e) => setOd(e.target.value)} style={ui.input} />
              </div>

              <div style={ui.field}>
                <span style={ui.label}>Do</span>
                <input type="date" value={doDat} onChange={(e) => setDoDat(e.target.value)} style={ui.input} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: isNarrow ? "flex-start" : "flex-end" }}>
                <button
                  style={{ ...ui.btn, ...(loadingList ? ui.btnDisabled : null) }}
                  onClick={ucitajIzvestaje}
                  disabled={!canCallApi || loadingList}
                >
                  {loadingList ? "Učitavam..." : "Primeni filter"}
                </button>
              </div>
            </div>

            {listError ? (
              <div style={ui.alert}>
                <b>Greška:</b> {listError}
              </div>
            ) : null}

            <div style={ui.tableWrap}>
              <table style={ui.table}>
                <thead>
                  <tr>
                    <th style={{ ...ui.th, width: 70 }}>ID</th>
                    <th style={ui.th}>Naziv</th>
                    <th style={{ ...ui.th, width: 140 }}>Algoritam</th>
                    <th style={{ ...ui.th, width: 120 }}>Latency</th>
                    <th style={{ ...ui.th, width: 140 }}>Throughput</th>
                    <th style={{ ...ui.th, width: 240 }}>Akcije</th>
                  </tr>
                </thead>

                <tbody>
                  {izvestaji.map((i, idx) => {
                    const parsed = safeParseRezultati(i.rezultatiJson);
                    const lat = parsed?.output?.latencyAvgMs;
                    const thr = parsed?.output?.throughputPerSec;

                    return (
                      <tr
                        key={i.id}
                        style={{
                          background: idx % 2 === 0 ? "rgba(15,23,42,0.02)" : "#fff",
                        }}
                      >
                        <td style={ui.td}>{i.id}</td>
                        <td style={ui.td}>{i.nazivIzvestaja ?? "-"}</td>
                        <td style={ui.td}>{i.algoritam ?? parsed?.algorithm ?? "-"}</td>
                        <td style={ui.td}>{formatNumber(lat)} ms</td>
                        <td style={ui.td}>{formatNumber(thr)} /s</td>
                        <td style={ui.td}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button style={ui.btn} onClick={() => ucitajDetalje(i.id)} disabled={!canCallApi || detailsLoading}>
                              Detalji
                            </button>
                            <button style={{ ...ui.btn, ...ui.btnPrimary }} onClick={() => downloadPdf(i.id)} disabled={!canCallApi}>
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!loadingList && izvestaji.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...ui.td, color: "rgba(15,23,42,0.62)" }}>
                        Nema izveštaja za izabrane filtere.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DETALJI */}
        <div style={{ ...ui.card, marginTop: 12 }}>
          <div
            style={{
              ...ui.cardHead,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span>Detalji izveštaja</span>

            {selectedId ? (
              <button style={{ ...ui.btn, ...ui.btnPrimary }} onClick={() => downloadPdf(selectedId)} disabled={!canCallApi}>
                Preuzmi PDF (ID {selectedId})
              </button>
            ) : null}
          </div>

          <div style={ui.cardBody}>
            {!selectedId ? <div style={ui.mutedSmall}>Izaberi izveštaj iz tabele.</div> : null}
            {detailsLoading ? <div style={ui.mutedSmall}>Učitavam detalje...</div> : null}
            {detailsError ? <div style={{ ...ui.alert, marginTop: 10 }}>{detailsError}</div> : null}

            {details ? (
              <>
                <div style={{ ...ui.stats, gridTemplateColumns: isNarrow ? "repeat(2, 1fr)" : "repeat(4, 1fr)", marginTop: 10 }}>
                  <MetricCard title="Broj zahteva" value={`${formatNumber(detailInput.brojZahteva)}`} sub={`target latency: ${formatNumber(detailInput.targetLatency)} ms`} />
                  <MetricCard
                    title="Prosečno vreme obrade"
                    value={`${formatNumber(detailOutput.latencyAvgMs)} ms`}
                    sub={latencyOk === null ? "n/a" : latencyOk ? "OK (≤ target)" : "Loše (> target)"}
                  />
                  <MetricCard
                    title="Propusnost"
                    value={`${formatNumber(detailOutput.throughputPerSec)} /s`}
                    sub={throughputOk === null ? "n/a" : throughputOk ? "OK (≥ target)" : "Loše (< target)"}
                  />
                  <MetricCard
                    title="Efikasnost"
                    value={`${formatNumber(eff, 0)}%`}
                    sub={`success: ${formatNumber(detailOutput.success)} | errors: ${formatNumber(detailOutput.errors)}`}
                  />
                </div>

                <div style={{ ...ui.card, marginTop: 12 }}>
                  <div style={ui.cardHead}>Zaključak</div>
                  <div style={ui.cardBody}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{details.zakljucak ?? "—"}</div>
                  </div>
                </div>

                <details style={{ marginTop: 12 }}>
                  <summary style={{ cursor: "pointer", color: "rgba(15,23,42,0.62)", fontSize: 13, fontWeight: 850 }}>
                    Prikaži sirove podatke (debug)
                  </summary>
                  <pre style={{ marginTop: 8, overflowX: "auto", fontSize: 12, color: "rgba(2,6,23,0.86)" }}>
                    {JSON.stringify(details, null, 2)}
                  </pre>
                  <pre style={{ marginTop: 8, overflowX: "auto", fontSize: 12, color: "rgba(2,6,23,0.86)" }}>
                    {JSON.stringify(detailsParsed, null, 2)}
                  </pre>
                </details>
              </>
            ) : null}
          </div>
        </div>

        {/* footer napomena – ostaje, samo lepša */}
        <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "rgba(15,23,42,0.60)" }}>
          Napomena: PDF download radi preko <b>gateway</b> rute <code>/performance/izvestaji/:id/pdf</code>.
        </div>
      </div>
    </div>
  );
};
