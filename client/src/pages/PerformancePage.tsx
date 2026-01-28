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
  // uzmi po algoritmu najnoviji (po datumKreiranja ako postoji; fallback: najveći id)
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
  const width = 820;
  const height = 220;
  const padL = 48;
  const padR = 14;
  const padT = 24;
  const padB = 46;

  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const barGap = 12;
  const barW = data.length > 0 ? (plotW - barGap * (data.length - 1)) / data.length : plotW;

  return (
    <div style={{ padding: 14, border: "1px solid #333", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <span style={{ opacity: 0.7, fontSize: 12 }}>Bar chart (SVG, bez biblioteka)</span>
      </div>

      {data.length === 0 ? (
        <p style={{ marginTop: 10, opacity: 0.8 }}>Nema dovoljno podataka za grafikon.</p>
      ) : (
        <svg width={width} height={height} style={{ marginTop: 8, width: "100%", height: "auto" }}>
          {/* osa */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#666" />
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#666" />

          {/* horizontal grid (3 linije) */}
          {[0.25, 0.5, 0.75].map((t) => {
            const y = padT + plotH - t * plotH;
            return <line key={t} x1={padL} y1={y} x2={padL + plotW} y2={y} stroke="#2a2a2a" />;
          })}

          {/* barovi */}
          {data.map((d, idx) => {
            const x = padL + idx * (barW + barGap);
            const h = (d.value / maxVal) * plotH;
            const y = padT + plotH - h;

            return (
              <g key={d.label}>
                <rect x={x} y={y} width={barW} height={h} rx={8} ry={8} fill="currentColor" opacity={0.25} />
                <rect x={x} y={y} width={barW} height={h} rx={8} ry={8} fill="currentColor" opacity={0.55} />

                {/* value */}
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="#ddd">
                  {valueLabel(d.value)}
                </text>

                {/* label */}
                <text
                  x={x + barW / 2}
                  y={padT + plotH + 22}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#bbb"
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* max label */}
          <text x={padL} y={padT - 6} fontSize="12" fill="#bbb">
            max: {valueLabel(maxVal)}
          </text>
        </svg>
      )}
    </div>
  );
}

function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid #333",
        borderRadius: 12,
        minWidth: 200,
        flex: "1 1 200px",
      }}
    >
      <div style={{ opacity: 0.8, fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ opacity: 0.75, fontSize: 12, marginTop: 6 }}>{sub}</div>}
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

  // ---- State: filteri + lista izveštaja
  const [algoritamFilter, setAlgoritamFilter] = useState<string>("");
  const [od, setOd] = useState<string>(""); // "YYYY-MM-DD"
  const [doDat, setDoDat] = useState<string>(""); // "YYYY-MM-DD"

  const [izvestaji, setIzvestaji] = useState<IzvestajPerformanse[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string>("");

  // ---- State: pokretanje simulacije
  const [algoritam, setAlgoritam] = useState<string>("");
  const [brojZahteva, setBrojZahteva] = useState<number>(200);
  const [targetLatency, setTargetLatency] = useState<number>(180);
  const [targetThroughput, setTargetThroughput] = useState<number>(40);
  const [errorRate, setErrorRate] = useState<number>(0.01);

  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string>("");
  const [simResult, setSimResult] = useState<any>(null);

  // ---- State: detalj
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

    // Tvoj rezultatiJson pokazuje da backend očekuje ove input parametre:
    // brojZahteva, targetLatency, targetThroughput, errorRate
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

  // ---- Derivacije za grafike (poređenje po algoritmu)
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

  // ---- Detalji: izračun metrika
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
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, color: "#eee" }}>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  }}
>
  <div>
    <h1 style={{ margin: 0 }}>Analiza performansi</h1>
    <p style={{ marginTop: 8, opacity: 0.8 }}>
      Pokreni simulaciju, pregledaj izveštaje, uporedi algoritme i preuzmi PDF.
    </p>
  </div>

  <div
    style={{
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
    }}
  >
    {/* NAZAD NA MENI */}
    <button
      onClick={() => window.history.back()}
      style={{
        padding: "10px 14px",
        cursor: "pointer",
        borderRadius: 10,
        border: "1px solid #333",
        background: "#f9f9f9",
      }}
    >
      ← Nazad na meni
    </button>

    {/* OSVEŽI */}
    <button
      onClick={ucitajIzvestaje}
      disabled={!canCallApi || loadingList}
      style={{ padding: "10px 14px", cursor: "pointer" }}
    >
      {loadingList ? "Učitavam..." : "Osveži listu"}
    </button>
  </div>
</div>

      

      {!auth?.token && (
        <div style={{ padding: 12, border: "1px solid #444", borderRadius: 10 }}>
          Nisi ulogovana ili token nije dostupan. Uloguj se pa se vrati ovde.
        </div>
      )}

      {/* 1) Pokretanje simulacije */}
      <div style={{ padding: 16, border: "1px solid #333", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Pokretanje simulacije</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label>Algoritam</label>
            <select
              value={algoritam}
              onChange={(e) => setAlgoritam(e.target.value)}
              style={{ padding: 10, minWidth: 260 }}
            >
              <option value="">-- izaberi --</option>
              <option value="Dijkstra">Dijkstra</option>
              <option value="AStar">A*</option>
              <option value="AlgoritamA">AlgoritamA</option>
              <option value="Greedy">Pohlepni</option>
              <option value="Genetic">Genetski</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label>Broj zahteva</label>
            <input
              type="number"
              value={brojZahteva}
              min={1}
              onChange={(e) => setBrojZahteva(Number(e.target.value))}
              style={{ padding: 10, width: 160 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label>Target latency (ms)</label>
            <input
              type="number"
              value={targetLatency}
              min={1}
              onChange={(e) => setTargetLatency(Number(e.target.value))}
              style={{ padding: 10, width: 180 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label>Target throughput (/s)</label>
            <input
              type="number"
              value={targetThroughput}
              min={1}
              onChange={(e) => setTargetThroughput(Number(e.target.value))}
              style={{ padding: 10, width: 200 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label>Error rate</label>
            <input
              type="number"
              step="0.01"
              value={errorRate}
              min={0}
              max={1}
              onChange={(e) => setErrorRate(Number(e.target.value))}
              style={{ padding: 10, width: 140 }}
            />
          </div>

          <button
            onClick={pokreniSimulaciju}
            disabled={!canCallApi || simLoading}
            style={{
              padding: "10px 14px",
              cursor: "pointer",
              borderRadius: 10,
              border: "1px solid #2b2b2b",
            }}
          >
            {simLoading ? "Pokrećem..." : "Pokreni simulaciju"}
          </button>
        </div>

        {simError && <p style={{ color: "tomato", marginTop: 10 }}>{simError}</p>}

        {simResult && (
          <div style={{ marginTop: 12, padding: 12, border: "1px solid #2f2f2f", borderRadius: 10 }}>
            <b>Rezultat simulacije</b>
            <pre style={{ marginTop: 8, overflowX: "auto" }}>{JSON.stringify(simResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* 2) Poređenje algoritama (grafici) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <SvgBarChart
          title="Poređenje prosečnog vremena obrade (latencyAvgMs) po algoritmu"
          data={latencyChartData}
          valueLabel={(v) => `${Math.round(v)} ms`}
        />
        <SvgBarChart
          title="Poređenje propusnosti (throughputPerSec) po algoritmu"
          data={throughputChartData}
          valueLabel={(v) => `${Math.round(v)} /s`}
        />
      </div>

      {/* 3) Filter + lista izveštaja */}
      <div style={{ padding: 16, border: "1px solid #333", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Izveštaji</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label>Algoritam (filter)</label>
            <select
  value={algoritamFilter}
  onChange={(e) => setAlgoritamFilter(e.target.value)}
  style={{ padding: 10, minWidth: 220 }}
>
  <option value="">-- svi algoritmi --</option>
  <option value="Dijkstra">Dijkstra</option>
  <option value="AStar">A*</option>
  <option value="AlgoritamA">AlgoritamA</option>
  <option value="Greedy">Pohlepni</option>
  <option value="Genetic">Genetski</option>
</select>

          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label>Od</label>
            <input type="date" value={od} onChange={(e) => setOd(e.target.value)} style={{ padding: 10 }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label>Do</label>
            <input type="date" value={doDat} onChange={(e) => setDoDat(e.target.value)} style={{ padding: 10 }} />
          </div>

          <button
            onClick={ucitajIzvestaje}
            disabled={!canCallApi || loadingList}
            style={{ padding: "10px 14px", borderRadius: 10 }}
          >
            {loadingList ? "Učitavam..." : "Primeni filter"}
          </button>
        </div>

        {listError && <p style={{ color: "tomato", marginTop: 10 }}>{listError}</p>}

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>ID</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>Naziv</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>Algoritam</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>Latency</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>Throughput</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #444", padding: 8 }}>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {izvestaji.map((i) => {
                const parsed = safeParseRezultati(i.rezultatiJson);
                const lat = parsed?.output?.latencyAvgMs;
                const thr = parsed?.output?.throughputPerSec;

                return (
                  <tr key={i.id}>
                    <td style={{ borderBottom: "1px solid #333", padding: 8 }}>{i.id}</td>
                    <td style={{ borderBottom: "1px solid #333", padding: 8 }}>{i.nazivIzvestaja ?? "-"}</td>
                    <td style={{ borderBottom: "1px solid #333", padding: 8 }}>
                      {i.algoritam ?? parsed?.algorithm ?? "-"}
                    </td>
                    <td style={{ borderBottom: "1px solid #333", padding: 8 }}>{formatNumber(lat)} ms</td>
                    <td style={{ borderBottom: "1px solid #333", padding: 8 }}>{formatNumber(thr)} /s</td>
                    <td style={{ borderBottom: "1px solid #333", padding: 8, display: "flex", gap: 8 }}>
                      <button onClick={() => ucitajDetalje(i.id)} disabled={!canCallApi || detailsLoading}>
                        Detalji
                      </button>
                      <button onClick={() => downloadPdf(i.id)} disabled={!canCallApi}>
                        PDF
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loadingList && izvestaji.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 12, opacity: 0.8 }}>
                    Nema izveštaja za izabrane filtere.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4) Detalji */}
      <div style={{ padding: 16, border: "1px solid #333", borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ marginTop: 0 }}>Detalji izveštaja</h2>

          {selectedId && (
            <button onClick={() => downloadPdf(selectedId)} disabled={!canCallApi} style={{ padding: "10px 14px" }}>
              Preuzmi PDF (ID {selectedId})
            </button>
          )}
        </div>

        {!selectedId && <p style={{ opacity: 0.8 }}>Izaberi izveštaj iz tabele.</p>}

        {detailsLoading && <p>Učitavam detalje...</p>}
        {detailsError && <p style={{ color: "tomato" }}>{detailsError}</p>}

        {details && (
          <>
            {/* Kartice */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
              <MetricCard
                title="Broj zahteva"
                value={`${formatNumber(detailInput.brojZahteva)}`}
                sub={`target latency: ${formatNumber(detailInput.targetLatency)} ms`}
              />
              <MetricCard
                title="Prosečno vreme obrade"
                value={`${formatNumber(detailOutput.latencyAvgMs)} ms`}
                sub={
                  latencyOk === null
                    ? "n/a"
                    : latencyOk
                    ? "OK (≤ target)"
                    : "Loše (> target)"
                }
              />
              <MetricCard
                title="Propusnost"
                value={`${formatNumber(detailOutput.throughputPerSec)} /s`}
                sub={
                  throughputOk === null
                    ? "n/a"
                    : throughputOk
                    ? "OK (≥ target)"
                    : "Loše (< target)"
                }
              />
              <MetricCard
                title="Efikasnost"
                value={`${formatNumber(eff, 0)}%`}
                sub={`success: ${formatNumber(detailOutput.success)} | errors: ${formatNumber(detailOutput.errors)}`}
              />
            </div>

            {/* Zaključak */}
            <div style={{ marginTop: 14, padding: 14, border: "1px solid #2f2f2f", borderRadius: 10 }}>
              <div style={{ opacity: 0.8, fontSize: 12 }}>Zaključak</div>
              <div style={{ fontSize: 15, marginTop: 8 }}>
                {details.zakljucak ?? "—"}
              </div>
            </div>

            {/* Raw JSON (opciono, korisno za debug) */}
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", opacity: 0.85 }}>Prikaži sirove podatke (debug)</summary>
              <pre style={{ marginTop: 8, overflowX: "auto" }}>{JSON.stringify(details, null, 2)}</pre>
              <pre style={{ marginTop: 8, overflowX: "auto" }}>
                {JSON.stringify(detailsParsed, null, 2)}
              </pre>
            </details>
          </>
        )}
      </div>
    </div>
  );
};
