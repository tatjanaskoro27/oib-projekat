import React, { useEffect, useMemo, useState } from "react";
import { IAnalyticsAPI } from "../api/analytics/IAnalyticsAPI";
import { useAuth } from "../hooks/useAuthHook";
import {
  MesecnaProdajaItem,
  TrendProdajeItem,
  Top10KolicinaItem,
  Top10PrihodItem,
} from "../models/analytics/AnalyticsDTOs";

type Props = {
  analyticsAPI: IAnalyticsAPI;
};

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtRsd(n: number) {
  const x = Number(n || 0);
  return x.toLocaleString("sr-RS") + " RSD";
}

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

const inputStyle: React.CSSProperties = {
  background: "#fff",
  color: "#111",
  border: "1px solid rgba(0,0,0,0.18)",
  borderRadius: 6,
  padding: "6px 8px",
};

const cardStyle: React.CSSProperties = {
  padding: 14,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.12)",
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(0,0,0,0.60)",
};

const cardValueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  color: "#111111",
  letterSpacing: "0.2px",
};

const cardValueSmallStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: "#111111",
  letterSpacing: "0.2px",
};

/** Mini SVG line chart (bez biblioteka) */
function LineChart({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  const w = 520;
  const h = 180;
  const pad = 26;

  const values = items.map((i) => i.value);
  const minY = Math.min(...values, 0);
  const maxY = Math.max(...values, 1);

  const sx = (i: number) =>
    pad + (i * (w - 2 * pad)) / Math.max(1, items.length - 1);
  const sy = (v: number) =>
    h - pad - ((v - minY) * (h - 2 * pad)) / Math.max(1, maxY - minY);

  const d = items
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${sx(i).toFixed(1)} ${sy(p.value).toFixed(1)}`
    )
    .join(" ");

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.12)" }}>
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

      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {/* axes */}
        <line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1"
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={h - pad}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1"
        />

        {/* line */}
        <path d={d} fill="none" stroke="rgba(47,163,107,0.95)" strokeWidth="2.5" />

        {/* dots */}
        {items.map((p, i) => (
          <circle key={i} cx={sx(i)} cy={sy(p.value)} r="3" fill="rgba(47,163,107,0.95)" />
        ))}
      </svg>

      <div style={{ padding: "8px 12px", fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
        {items.length
          ? `${items[0].label} → ${items[items.length - 1].label}`
          : "Nema podataka"}
      </div>
    </div>
  );
}

/** Mini SVG bar chart (bez biblioteka) */
function BarChart({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  const w = 520;
  const h = 180;
  const pad = 26;

  const maxV = Math.max(...items.map((i) => i.value), 1);
  const bw = (w - 2 * pad) / Math.max(1, items.length);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.12)" }}>
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

      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {/* axes */}
        <line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1"
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={h - pad}
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="1"
        />

        {items.map((b, i) => {
          const x = pad + i * bw + 6;
          const barH = ((h - 2 * pad) * b.value) / maxV;
          const y = h - pad - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={Math.max(4, bw - 12)}
              height={barH}
              fill="rgba(47,163,107,0.75)"
            />
          );
        })}
      </svg>

      <div style={{ padding: "8px 12px", fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
        Max: {fmtRsd(maxV)}
      </div>
    </div>
  );
}

export const AnalyticsPage: React.FC<Props> = ({ analyticsAPI }) => {
  const { token } = useAuth();

  // UI state
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  // period (trend)
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return iso(d);
  });
  const [end, setEnd] = useState(() => iso(new Date()));

  // year (monthly)
  const [godina, setGodina] = useState<number>(new Date().getFullYear());

  // data
  const [ukupnoPrihod, setUkupnoPrihod] = useState<number>(0);
  const [ukupnoKomada, setUkupnoKomada] = useState<number>(0);
  const [trend, setTrend] = useState<TrendProdajeItem[]>([]);
  const [mesecnaPrihod, setMesecnaPrihod] = useState<MesecnaProdajaItem[]>([]);

  const [top10Kolicina, setTop10Kolicina] = useState<Top10KolicinaItem[]>([]);
  const [top10Prihod, setTop10Prihod] = useState<Top10PrihodItem[]>([]);
  const [top10PrihodUkupno, setTop10PrihodUkupno] = useState<number>(0);

  const canLoad = useMemo(() => Boolean(token), [token]);

  const loadAll = async () => {
    if (!token) return;

    setLoading(true);
    setErr("");

    try {
      const [
        rPrihod,
        rKomada,
        rTrend,
        rMesecna,
        rTopK,
        rTopP,
        rTopPUkupno,
      ] = await Promise.all([
        analyticsAPI.prihodUkupno(token),
        analyticsAPI.kolicinaUkupno(token),
        analyticsAPI.prihodTrend(token, start, end),
        analyticsAPI.prihodMesecna(token, godina),
        analyticsAPI.top10Kolicina(token),
        analyticsAPI.top10Prihod(token),
        analyticsAPI.top10PrihodUkupno(token),
      ]);

      setUkupnoPrihod(clamp(rPrihod.ukupnaProdaja));
      setUkupnoKomada(clamp(rKomada.ukupnoKomada));

      setTrend(rTrend ?? []);
      setMesecnaPrihod((rMesecna ?? []).slice().sort((a, b) => a.mesec - b.mesec));

      setTop10Kolicina(rTopK ?? []);
      setTop10Prihod(rTopP ?? []);
      setTop10PrihodUkupno(clamp(rTopPUkupno.ukupno));
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Greška pri učitavanju analytics podataka.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canLoad) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, godina]);

  // Derived (for charts)
  const trendChart = (trend ?? []).map((t) => ({
    label: t.datum?.slice(0, 10) ?? "",
    value: clamp(t.ukupno),
  }));

  const mesecnaChart = (mesecnaPrihod ?? []).map((m) => ({
    label: String(m.mesec),
    value: clamp(m.ukupno),
  }));

  // Join top10 into one table (by name)
  const topRows = useMemo(() => {
    const mapK = new Map<string, number>();
    for (const k of top10Kolicina ?? []) mapK.set(k.parfemNaziv, clamp(k.kolicina));

    const allNames = new Set<string>();
    (top10Prihod ?? []).forEach((x) => allNames.add(x.parfemNaziv));
    (top10Kolicina ?? []).forEach((x) => allNames.add(x.parfemNaziv));

    const rows = Array.from(allNames).map((name) => ({
      name,
      quantity: mapK.get(name) ?? 0,
      revenue: clamp(
        (top10Prihod ?? []).find((p) => p.parfemNaziv === name)?.prihod ?? 0
      ),
    }));

    rows.sort((a, b) => b.revenue - a.revenue);
    return rows.slice(0, 10);
  }, [top10Kolicina, top10Prihod]);

  const onRefresh = async () => {
    await loadAll();
  };

  const onExportPdf = () => {
    try {
      const base = import.meta.env.VITE_GATEWAY_URL; // npr. http://localhost:4000/api/v1
      const qs = new URLSearchParams();
      if (start) qs.set("start", start);
      if (end) qs.set("end", end);
      if (godina) qs.set("godina", String(godina));

      const url = `${base}/analytics/izvestaj/pdf?${qs.toString()}`;
      window.open(url, "_blank");
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Greška pri preuzimanju PDF-a.");
    }
  };

  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh", background: "#ffffff" }}>
      <div className="window" style={{ width: "1200px", maxWidth: "96%", margin: "24px auto", background: "#fff" }}>
        <div className="titlebar" style={{ background: "#fff", color: "#111" }}>
          <span className="titlebar-title">Analitika prodaje</span>
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
          {/* HEADER CONTROLS */}
          <div
            className="flex"
            style={{
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 14,
              background: "#fff",
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: "#111" }}>Dashboard</div>

              <label style={{ display: "flex", gap: 6, alignItems: "center", color: "#111" }}>
                Godina:
                <input
                  value={godina}
                  type="number"
                  onChange={(e) => setGodina(Number(e.target.value))}
                  style={{ ...inputStyle, width: 100 }}
                />
              </label>

              <label style={{ display: "flex", gap: 6, alignItems: "center", color: "#111" }}>
                Start:
                <input value={start} type="date" onChange={(e) => setStart(e.target.value)} style={inputStyle} />
              </label>

              <label style={{ display: "flex", gap: 6, alignItems: "center", color: "#111" }}>
                End:
                <input value={end} type="date" onChange={(e) => setEnd(e.target.value)} style={inputStyle} />
              </label>

              <button className="btn btn-ghost" onClick={onRefresh} disabled={loading}>
                Osveži
              </button>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-accent" onClick={onExportPdf}>
                Export PDF
              </button>
            </div>
          </div>

          {/* ERROR */}
          {err ? (
            <div className="card" style={{ ...cardStyle, marginBottom: 12, border: "1px solid rgba(196,43,28,0.25)" }}>
              <b style={{ color: "#c42b1c" }}>Greška:</b> {err}
            </div>
          ) : null}

          {/* SUMMARY CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
            <div className="card" style={cardStyle}>
              <div style={cardLabelStyle}>Ukupan prihod</div>
              <div style={cardValueStyle}>{loading ? "..." : fmtRsd(Number(ukupnoPrihod || 0))}</div>
            </div>

            <div className="card" style={cardStyle}>
              <div style={cardLabelStyle}>Ukupno komada</div>
              <div style={cardValueSmallStyle}>
                {loading ? "..." : Number(ukupnoKomada || 0).toLocaleString("sr-RS")}
              </div>
            </div>

            <div className="card" style={cardStyle}>
              <div style={cardLabelStyle}>Top lista</div>
              <div style={cardValueSmallStyle}>Top 10 parfema</div>
            </div>

            <div className="card" style={cardStyle}>
              <div style={cardLabelStyle}>Ukupan prihod Top10</div>
              <div style={cardValueSmallStyle}>
                {loading ? "..." : fmtRsd(Number(top10PrihodUkupno || 0))}
              </div>
            </div>
          </div>

          {/* CHARTS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <LineChart title="Trend prihoda (period)" items={trendChart} />
            <BarChart title={`Prihod po mesecima (${godina})`} items={mesecnaChart} />
          </div>

          {/* BOTTOM: ANALYSIS + TOP10 TABLE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="card" style={{ ...cardStyle }}>
              <div style={{ fontWeight: 900, marginBottom: 8, color: "#111" }}>Kratka analiza</div>

              {loading ? (
                <div style={{ color: "rgba(0,0,0,0.55)" }}>Učitavanje...</div>
              ) : (
                <div style={{ fontSize: 13, lineHeight: 1.45, color: "#111" }}>
                  <div>
                    • Izabrani period trenda: <b>{start}</b> → <b>{end}</b>
                  </div>
                  <div>
                    • Ukupan prihod u sistemu: <b>{fmtRsd(Number(ukupnoPrihod || 0))}</b>
                  </div>
                  <div>
                    • Ukupan prihod Top10: <b>{fmtRsd(Number(top10PrihodUkupno || 0))}</b>
                  </div>
                </div>
              )}
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden", background: "#fff", border: "1px solid rgba(0,0,0,0.12)" }}>
              <div style={{ padding: "10px 12px", fontWeight: 900, borderBottom: "1px solid rgba(0,0,0,0.10)", color: "#111" }}>
                Top 10 (prodaja / prihod)
              </div>

              <div style={{ padding: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", fontSize: 12, color: "rgba(0,0,0,0.60)" }}>
                      <th style={{ padding: "6px 8px" }}>Parfem</th>
                      <th style={{ padding: "6px 8px", width: 120 }}>Komada</th>
                      <th style={{ padding: "6px 8px", width: 160 }}>Prihod</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: "10px 8px", color: "rgba(0,0,0,0.55)" }}>
                          Nema podataka.
                        </td>
                      </tr>
                    ) : (
                      topRows.map((r, idx) => (
                        <tr key={r.name} style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                          <td style={{ padding: "8px", color: "#111" }}>
                            <b>{idx + 1}.</b> {r.name}
                          </td>
                          <td style={{ padding: "8px", color: "#111" }}>
                            {Number(r.quantity || 0).toLocaleString("sr-RS")}
                          </td>
                          <td style={{ padding: "8px", color: "#111" }}>{fmtRsd(Number(r.revenue || 0))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div style={{ marginTop: 10, fontSize: 12, color: "rgba(0,0,0,0.60)" }}>
                  Ukupan prihod Top10:{" "}
                  <b style={{ color: "#111" }}>{fmtRsd(Number(top10PrihodUkupno || 0))}</b>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div style={{ marginTop: 14, fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
            Napomena: PDF export radi preko <b>gateway</b> rute <code>/analytics/izvestaj/pdf</code>.
          </div>
        </div>
      </div>
    </div>
  );
};
