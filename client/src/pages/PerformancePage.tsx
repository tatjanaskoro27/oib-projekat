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
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          fontWeight: 800,
          borderBottom: "1px solid rgba(0,0,0,0.10)",
          background: "#fff",
          color: "#111",
        }}
      >
        {title}
      </div>

      <div style={{ padding: 12 }}>
        {data.length === 0 ? (
          <div style={{ fontSize: 13, color: "rgba(0,0,0,0.60)" }}>Nema dovoljno podataka za grafikon.</div>
        ) : (
          <>
            <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
              <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
              <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />

              {data.map((b, i) => {
                const x = pad + i * bw + 6;
                const barH = ((h - 2 * pad) * b.value) / maxV;
                const y = h - pad - barH;

                return (
                  <g key={b.label}>
                    <rect x={x} y={y} width={Math.max(4, bw - 12)} height={barH} fill="rgba(47,163,107,0.75)" rx={4} />
                    <text
                      x={x + Math.max(4, bw - 12) / 2}
                      y={y - 6}
                      textAnchor="middle"
                      fontSize="11"
                      fill="rgba(0,0,0,0.65)"
                    >
                      {valueLabel(b.value)}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "space-between",
                marginTop: 8,
                fontSize: 12,
                color: "rgba(0,0,0,0.55)",
                flexWrap: "wrap",
              }}
            >
              {data.map((d) => (
                <span key={d.label}>{d.label}</span>
              ))}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
              max: <b style={{ color: "#111" }}>{valueLabel(maxV)}</b>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: 14, background: "#fff", border: "1px solid rgba(0,0,0,0.12)" }}>
      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.60)" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#111", marginTop: 6 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: "rgba(0,0,0,0.55)", marginTop: 6 }}>{sub}</div> : null}
    </div>
  );
}

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

  const eff = useMemo(() => {
    const p = efficiencyPercent(detailOutput.success, detailOutput.errors);
    return clamp(p, 0, 100);
  }, [detailOutput.success, detailOutput.errors]);

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

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <div className="window" style={{ width: "1200px", maxWidth: "96%", margin: "24px auto", background: "#fff" }}>
        <div className="titlebar" style={{ background: "#fff", color: "#111" }}>
          <span className="titlebar-title">Analiza performansi</span>
        </div>

        <div
          className="window-content"
          style={{
            padding: 20,
            maxHeight: "75vh",
            overflowY: "auto",
            background: "#ffffff",
            color: "#111111",
          }}
        >
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#111" }}>Dashboard</div>
              <div style={{ fontSize: 13, color: "rgba(0,0,0,0.60)", marginTop: 6 }}>
                Pokreni simulaciju, pregledaj izveštaje, uporedi algoritme i preuzmi PDF.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-standard" onClick={() => window.history.back()}>
                ← Nazad na meni
              </button>

              <button className="btn btn-ghost" onClick={ucitajIzvestaje} disabled={!canCallApi || loadingList}>
                {loadingList ? "Učitavam..." : "Osveži listu"}
              </button>
            </div>
          </div>

          {!auth?.token ? (
            <div
              className="card"
              style={{
                padding: 14,
                background: "#fff",
                border: "1px solid rgba(196,43,28,0.25)",
                marginBottom: 12,
              }}
            >
              <b style={{ color: "#c42b1c" }}>Info:</b> Nisi ulogovana ili token nije dostupan. Uloguj se pa se vrati ovde.
            </div>
          ) : null}

          {/* SIMULACIJA (ulepšano) */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: "hidden",
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.12)",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                fontWeight: 900,
                borderBottom: "1px solid rgba(0,0,0,0.10)",
                color: "#111",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span>Pokretanje simulacije</span>
              <span style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
                {simLoading ? "Simulacija u toku..." : "Podesi parametre i pokreni"}
              </span>
            </div>

            <div style={{ padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr 0.9fr 1fr 0.7fr", gap: 12 }}>
                <div>
                  <label>Algoritam</label>
                  <select value={algoritam} onChange={(e) => setAlgoritam(e.target.value)}>
                    <option value="">-- izaberi --</option>
                    <option value="Dijkstra">Dijkstra</option>
                    <option value="AStar">A*</option>
                    <option value="AlgoritamA">AlgoritamA</option>
                    <option value="Greedy">Pohlepni</option>
                    <option value="Genetic">Genetski</option>
                  </select>
                </div>

                <div>
                  <label>Broj zahteva</label>
                  <input type="number" value={brojZahteva} min={1} onChange={(e) => setBrojZahteva(Number(e.target.value))} />
                </div>

                <div>
                  <label>Target latency (ms)</label>
                  <input type="number" value={targetLatency} min={1} onChange={(e) => setTargetLatency(Number(e.target.value))} />
                </div>

                <div>
                  <label>Target throughput (/s)</label>
                  <input
                    type="number"
                    value={targetThroughput}
                    min={1}
                    onChange={(e) => setTargetThroughput(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label>Error rate</label>
                  <input type="number" step="0.01" value={errorRate} min={0} max={1} onChange={(e) => setErrorRate(Number(e.target.value))} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  {simError ? <span style={{ color: "#c42b1c", fontSize: 13 }}>{simError}</span> : null}
                </div>

                <button className="btn btn-accent" onClick={pokreniSimulaciju} disabled={!canCallApi || simLoading}>
                  {simLoading ? "Pokrećem..." : "Pokreni simulaciju"}
                </button>
              </div>

              {/* Rezultat simulacije – lepši card */}
              {simResult ? (
                <div
                  className="card"
                  style={{
                    marginTop: 12,
                    padding: 0,
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.12)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      fontWeight: 800,
                      borderBottom: "1px solid rgba(0,0,0,0.10)",
                      color: "#111",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <span>Rezultat simulacije</span>
                    <button className="btn btn-ghost" onClick={() => setSimResult(null)} style={{ padding: "8px 10px" }}>
                      Sakrij
                    </button>
                  </div>

                  <div style={{ padding: 12 }}>
                    <pre
                      style={{
                        margin: 0,
                        overflowX: "auto",
                        fontSize: 12,
                        color: "rgba(0,0,0,0.80)",
                        background: "rgba(0,0,0,0.03)",
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 10,
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
            <MetricCard title="Broj izveštaja" value={loadingList ? "..." : String(izvestaji.length)} />
            <MetricCard title="Algoritama" value={loadingList ? "..." : String(new Set(latencyChartData.map((d) => d.label)).size)} />
            <MetricCard title="Filter algoritam" value={algoritamFilter?.trim() ? algoritamFilter : "Svi"} />
            <MetricCard title="Izabran izveštaj" value={selectedId ? `ID ${selectedId}` : "—"} />
          </div>

          {/* GRAFICI – pored drugog */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <SvgBarChart title="Poređenje latencyAvgMs po algoritmu" data={latencyChartData} valueLabel={(v) => `${Math.round(v)} ms`} />
            <SvgBarChart title="Poređenje throughputPerSec po algoritmu" data={throughputChartData} valueLabel={(v) => `${Math.round(v)} /s`} />
          </div>

          {/* IZVEŠTAJI */}
          <div className="card" style={{ padding: 0, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.12)", marginBottom: 12 }}>
            <div style={{ padding: "10px 12px", fontWeight: 900, borderBottom: "1px solid rgba(0,0,0,0.10)", color: "#111" }}>
              Izveštaji
            </div>

            <div style={{ padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px auto", gap: 12, alignItems: "end", marginBottom: 12 }}>
                <div>
                  <label>Algoritam (filter)</label>
                  <select value={algoritamFilter} onChange={(e) => setAlgoritamFilter(e.target.value)}>
                    <option value="">-- svi algoritmi --</option>
                    <option value="Dijkstra">Dijkstra</option>
                    <option value="AStar">A*</option>
                    <option value="AlgoritamA">AlgoritamA</option>
                    <option value="Greedy">Pohlepni</option>
                    <option value="Genetic">Genetski</option>
                  </select>
                </div>

                <div>
                  <label>Od</label>
                  <input type="date" value={od} onChange={(e) => setOd(e.target.value)} />
                </div>

                <div>
                  <label>Do</label>
                  <input type="date" value={doDat} onChange={(e) => setDoDat(e.target.value)} />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="btn btn-standard" onClick={ucitajIzvestaje} disabled={!canCallApi || loadingList}>
                    {loadingList ? "Učitavam..." : "Primeni filter"}
                  </button>
                </div>
              </div>

              {listError ? (
                <div className="card" style={{ padding: 12, background: "#fff", border: "1px solid rgba(196,43,28,0.25)", marginBottom: 12 }}>
                  <b style={{ color: "#c42b1c" }}>Greška:</b> {listError}
                </div>
              ) : null}

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", fontSize: 12, color: "rgba(0,0,0,0.60)" }}>
                      <th style={{ padding: "6px 8px", width: 70 }}>ID</th>
                      <th style={{ padding: "6px 8px" }}>Naziv</th>
                      <th style={{ padding: "6px 8px", width: 140 }}>Algoritam</th>
                      <th style={{ padding: "6px 8px", width: 120 }}>Latency</th>
                      <th style={{ padding: "6px 8px", width: 140 }}>Throughput</th>
                      <th style={{ padding: "6px 8px", width: 240 }}>Akcije</th>
                    </tr>
                  </thead>

                  <tbody>
                    {izvestaji.map((i) => {
                      const parsed = safeParseRezultati(i.rezultatiJson);
                      const lat = parsed?.output?.latencyAvgMs;
                      const thr = parsed?.output?.throughputPerSec;

                      return (
                        <tr key={i.id} style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                          <td style={{ padding: "8px", color: "#111" }}>{i.id}</td>
                          <td style={{ padding: "8px", color: "#111" }}>{i.nazivIzvestaja ?? "-"}</td>
                          <td style={{ padding: "8px", color: "#111" }}>{i.algoritam ?? parsed?.algorithm ?? "-"}</td>
                          <td style={{ padding: "8px", color: "#111" }}>{formatNumber(lat)} ms</td>
                          <td style={{ padding: "8px", color: "#111" }}>{formatNumber(thr)} /s</td>
                          <td style={{ padding: "8px" }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button className="btn btn-standard" onClick={() => ucitajDetalje(i.id)} disabled={!canCallApi || detailsLoading}>
                                Detalji
                              </button>

                              {/* PDF -> ZELENO */}
                              <button className="btn btn-accent" onClick={() => downloadPdf(i.id)} disabled={!canCallApi}>
                                PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!loadingList && izvestaji.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "10px 8px", color: "rgba(0,0,0,0.55)" }}>
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
          <div className="card" style={{ padding: 0, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.12)" }}>
            <div
              style={{
                padding: "10px 12px",
                fontWeight: 900,
                borderBottom: "1px solid rgba(0,0,0,0.10)",
                color: "#111",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span>Detalji izveštaja</span>

              {selectedId ? (
                <button className="btn btn-accent" onClick={() => downloadPdf(selectedId)} disabled={!canCallApi}>
                  Preuzmi PDF (ID {selectedId})
                </button>
              ) : null}
            </div>

            <div style={{ padding: 12 }}>
              {!selectedId ? <div style={{ color: "rgba(0,0,0,0.55)" }}>Izaberi izveštaj iz tabele.</div> : null}
              {detailsLoading ? <div style={{ color: "rgba(0,0,0,0.55)" }}>Učitavam detalje...</div> : null}
              {detailsError ? <div style={{ color: "#c42b1c" }}>{detailsError}</div> : null}

              {details ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 12 }}>
                    <MetricCard
                      title="Broj zahteva"
                      value={`${formatNumber(detailInput.brojZahteva)}`}
                      sub={`target latency: ${formatNumber(detailInput.targetLatency)} ms`}
                    />
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

                  <div className="card" style={{ marginTop: 12, padding: 12, background: "#fff", border: "1px solid rgba(0,0,0,0.12)" }}>
                    <div style={{ fontSize: 12, color: "rgba(0,0,0,0.60)" }}>Zaključak</div>
                    <div style={{ fontSize: 14, color: "#111", marginTop: 6 }}>{details.zakljucak ?? "—"}</div>
                  </div>

                  <details style={{ marginTop: 12 }}>
                    <summary style={{ cursor: "pointer", color: "rgba(0,0,0,0.60)", fontSize: 13 }}>Prikaži sirove podatke (debug)</summary>
                    <pre style={{ marginTop: 8, overflowX: "auto", fontSize: 12, color: "rgba(0,0,0,0.80)" }}>
                      {JSON.stringify(details, null, 2)}
                    </pre>
                    <pre style={{ marginTop: 8, overflowX: "auto", fontSize: 12, color: "rgba(0,0,0,0.80)" }}>
                      {JSON.stringify(detailsParsed, null, 2)}
                    </pre>
                  </details>
                </>
              ) : null}
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
            Napomena: PDF download radi preko <b>gateway</b> rute <code>/performance/izvestaji/:id/pdf</code>.
          </div>
        </div>
      </div>
    </div>
  );
};
