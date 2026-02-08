import React, { useEffect, useMemo, useState } from "react";
import { IAnalyticsAPI } from "../api/analytics/IAnalyticsAPI";
import { useAuth } from "../hooks/useAuthHook";
import {
  MesecnaProdajaItem,
  TrendProdajeItem,
  Top10KolicinaItem,
  Top10PrihodItem,
} from "../models/analytics/AnalyticsDTOs";

import { useNavigate } from "react-router-dom";

type Props = {
  analyticsAPI: IAnalyticsAPI;
};

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtEur(n: number) {
  const x = Number(n || 0);
  return x.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

function fillMissingDays(
  startISO: string,
  endISO: string,
  points: { datum: string; ukupno: number }[]
) {
  const map = new Map<string, number>();
  for (const p of points || []) {
    const k = (p.datum || "").slice(0, 10);
    map.set(k, clamp(Number(p.ukupno || 0)));
  }

  // čuvamo u lokalnoj vremenskoj zoni
  const startD = new Date(startISO + "T00:00:00");
  const endD = new Date(endISO + "T00:00:00");

  const out: { label: string; value: number }[] = [];
  const cur = new Date(startD);

  while (cur <= endD) {
    const key = iso(cur);
    out.push({
      label: key,
      value: map.get(key) ?? 0,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return out;
}

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

  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid rgba(2,6,23,0.10)",
    borderRadius: 16,
    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
    overflow: "hidden",
  };

  const head: React.CSSProperties = {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(2,6,23,0.06)",
    fontWeight: 950,
    letterSpacing: "0.2px",
  };

  const foot: React.CSSProperties = {
    padding: "10px 14px 12px 14px",
    fontSize: 12,
    color: "rgba(15,23,42,0.62)",
    borderTop: "1px solid rgba(2,6,23,0.05)",
  };

  return (
    <div style={card}>
      <div style={head}>{title}</div>

      <div style={{ padding: "10px 14px 0 14px" }}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          {/* axes */}
          <line
            x1={pad}
            y1={h - pad}
            x2={w - pad}
            y2={h - pad}
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="1"
          />
          <line
            x1={pad}
            y1={pad}
            x2={pad}
            y2={h - pad}
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="1"
          />

          {/* line */}
          <path
            d={d}
            fill="none"
            stroke="rgba(22,163,74,0.95)"
            strokeWidth="2.6"
          />

          {/* dots */}
          {items.map((p, i) => (
            <circle
              key={i}
              cx={sx(i)}
              cy={sy(p.value)}
              r="3.2"
              fill="rgba(22,163,74,0.95)"
            />
          ))}
        </svg>
      </div>

      <div style={foot}>
        {items.length
          ? `${items[0].label} → ${items[items.length - 1].label}`
          : "Nema podataka"}
      </div>
    </div>
  );
}


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

  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid rgba(2,6,23,0.10)",
    borderRadius: 16,
    boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
    overflow: "hidden",
  };

  const head: React.CSSProperties = {
    padding: "12px 14px",
    borderBottom: "1px solid rgba(2,6,23,0.06)",
    fontWeight: 950,
    letterSpacing: "0.2px",
  };

  const foot: React.CSSProperties = {
    padding: "10px 14px 12px 14px",
    fontSize: 12,
    color: "rgba(15,23,42,0.62)",
    borderTop: "1px solid rgba(2,6,23,0.05)",
  };

  return (
    <div style={card}>
      <div style={head}>{title}</div>

      <div style={{ padding: "10px 14px 0 14px" }}>
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          {/* axes */}
          <line
            x1={pad}
            y1={h - pad}
            x2={w - pad}
            y2={h - pad}
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="1"
          />
          <line
            x1={pad}
            y1={pad}
            x2={pad}
            y2={h - pad}
            stroke="rgba(0,0,0,0.22)"
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
                fill="rgba(22,163,74,0.75)"
                rx="4"
              />
            );
          })}
        </svg>
      </div>

      <div style={foot}>Max: {fmtEur(maxV)}</div>
    </div>
  );
}

export const AnalyticsPage: React.FC<Props> = ({ analyticsAPI }) => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return iso(d);
  });
  const [end, setEnd] = useState(() => iso(new Date()));
  const [godina, setGodina] = useState<number>(new Date().getFullYear());

  const [ukupnoPrihod, setUkupnoPrihod] = useState<number>(0);
  const [ukupnoKomada, setUkupnoKomada] = useState<number>(0);
  const [trend, setTrend] = useState<TrendProdajeItem[]>([]);
  const [mesecnaPrihod, setMesecnaPrihod] = useState<MesecnaProdajaItem[]>(
    []
  );

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
  }, [canLoad, godina, start, end]);

  const trendChart = useMemo(() => {
    if (!start || !end) return [];
    return fillMissingDays(start, end, trend ?? []);
  }, [start, end, trend]);

  const mesecnaChart = (mesecnaPrihod ?? []).map((m) => ({
    label: String(m.mesec),
    value: clamp(m.ukupno),
  }));

  const topRows = useMemo(() => {
    const mapK = new Map<string, number>();
    for (const k of top10Kolicina ?? []) mapK.set(k.parfemNaziv, clamp(k.kolicina));

    const allNames = new Set<string>();
    (top10Prihod ?? []).forEach((x) => allNames.add(x.parfemNaziv));
    (top10Kolicina ?? []).forEach((x) => allNames.add(x.parfemNaziv));

    const rows = Array.from(allNames).map((name) => ({
      name,
      quantity: mapK.get(name) ?? 0,
      revenue: clamp((top10Prihod ?? []).find((p) => p.parfemNaziv === name)?.prihod ?? 0),
    }));

    rows.sort((a, b) => b.revenue - a.revenue);
    return rows.slice(0, 10);
  }, [top10Kolicina, top10Prihod]);

  const onRefresh = async () => {
    await loadAll();
  };

  const onExportPdf = async () => {
    try {
      if (!token) {
        setErr("Niste prijavljeni.");
        return;
      }

      const blob = await analyticsAPI.getIzvestajPdf(token, {
        start: start || undefined,
        end: end || undefined,
        godina: godina || undefined,
      });

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

     
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Greška pri preuzimanju PDF izveštaja");
    }
  };

  const s = {
    page: {
      minHeight: "100vh",
      background: "#f5f7fb",
      color: "#0f172a",
      padding: "18px 0 26px",
    } as React.CSSProperties,
    shell: {
      width: "1200px",
      maxWidth: "96%",
      margin: "0 auto",
    } as React.CSSProperties,

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
    } as React.CSSProperties,
    titleKicker: {
      fontWeight: 900,
      fontSize: 12,
      color: "rgba(15,23,42,0.55)",
      letterSpacing: "0.2px",
    } as React.CSSProperties,
    title: {
      margin: "2px 0 0 0",
      fontSize: 22,
      fontWeight: 950,
    } as React.CSSProperties,
    topRight: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
    } as React.CSSProperties,

    btn: {
      border: "1px solid rgba(2,6,23,0.12)",
      background: "#fff",
      color: "#0f172a",
      borderRadius: 12,
      padding: "10px 12px",
      fontWeight: 950,
      cursor: "pointer",
      boxShadow: "0 8px 18px rgba(2,6,23,0.06)",
      transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
    } as React.CSSProperties,
    btnPrimary: {
      background: "#16a34a",
      border: "1px solid rgba(22,163,74,0.25)",
      color: "#fff",
      boxShadow: "0 10px 22px rgba(22,163,74,0.22)",
    } as React.CSSProperties,
    btnDisabled: { opacity: 0.55, cursor: "not-allowed" } as React.CSSProperties,

    card: {
      background: "#fff",
      border: "1px solid rgba(2,6,23,0.08)",
      borderRadius: 16,
      boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
    } as React.CSSProperties,
    cardHead: {
      padding: "12px 14px",
      borderBottom: "1px solid rgba(2,6,23,0.06)",
      fontWeight: 950,
      letterSpacing: "0.2px",
    } as React.CSSProperties,

    cardFill: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
    } as React.CSSProperties,
    cardBodyFill: {
      padding: 14,
      flex: 1,
      display: "flex",
      flexDirection: "column",
    } as React.CSSProperties,

    cardBody: { padding: 14 } as React.CSSProperties,

    filters: {
      marginTop: 12,
      padding: 14,
      display: "grid",
      gridTemplateColumns: "160px 200px 200px 1fr",
      gap: 12,
      alignItems: "end",
    } as React.CSSProperties,
    field: { display: "grid", gap: 6 } as React.CSSProperties,
    label: {
      fontSize: 12,
      fontWeight: 950,
      color: "rgba(15,23,42,0.60)",
    } as React.CSSProperties,
    input: {
      width: "100%",
      background: "#fff",
      border: "1px solid rgba(2,6,23,0.14)",
      borderRadius: 12,
      padding: "10px 10px",
      fontWeight: 850,
      color: "#0f172a",
      outline: "none",
    } as React.CSSProperties,
    pill: {
      display: "inline-flex",
      gap: 8,
      alignItems: "center",
      padding: "9px 12px",
      borderRadius: 999,
      border: "1px solid rgba(2,6,23,0.10)",
      background: "rgba(15,23,42,0.03)",
      fontSize: 12,
      fontWeight: 850,
      color: "rgba(15,23,42,0.75)",
      whiteSpace: "nowrap",
      justifySelf: "end",
    } as React.CSSProperties,
    pillDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: "#16a34a",
      boxShadow: "0 0 0 4px rgba(22,163,74,0.18)",
      display: "inline-block",
    } as React.CSSProperties,

    alert: {
      marginTop: 12,
      padding: "12px 14px",
      borderRadius: 14,
      border: "1px solid rgba(196,43,28,0.24)",
      background: "rgba(196,43,28,0.06)",
      color: "#7f1d1d",
      fontWeight: 850,
    } as React.CSSProperties,

    stats: {
      marginTop: 12,
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12,
    } as React.CSSProperties,
    stat: (_grad: string) =>
      ({
        padding: 14,
        borderRadius: 16,
        background: "#fff",
        border: "1px solid rgba(2,6,23,0.08)",
        boxShadow: "0 10px 24px rgba(2,6,23,0.06)",
        position: "relative",
        overflow: "hidden",
      } as React.CSSProperties),
    statOverlay: (grad: string) =>
      ({
        position: "absolute",
        inset: 0,
        opacity: 0.08,
        background: grad,
      } as React.CSSProperties),
    statLabel: {
      position: "relative",
      fontSize: 12,
      fontWeight: 950,
      color: "rgba(15,23,42,0.64)",
      marginBottom: 6,
    } as React.CSSProperties,
    statValue: {
      position: "relative",
      fontSize: 22,
      fontWeight: 950,
      color: "#0f172a",
      letterSpacing: "0.2px",
    } as React.CSSProperties,

    grid2: {
      marginTop: 12,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      alignItems: "stretch",
    } as React.CSSProperties,

    muted: { color: "rgba(15,23,42,0.6)", fontWeight: 750 } as React.CSSProperties,

    list: {
      display: "grid",
      gap: 8,
      fontSize: 13,
      lineHeight: 1.45,
    } as React.CSSProperties,
    listRow: { display: "flex", gap: 10, alignItems: "flex-start" } as React.CSSProperties,
    bullet: {
      width: 10,
      height: 10,
      borderRadius: 999,
      marginTop: 5,
      background: "#16a34a",
      boxShadow: "0 0 0 4px rgba(22,163,74,0.16)",
      flex: "0 0 auto",
    } as React.CSSProperties,

    tableWrap: {
      overflow: "auto",
      borderRadius: 12,
      border: "1px solid rgba(2,6,23,0.08)",
      maxHeight: 340,
    } as React.CSSProperties,
    table: { width: "100%", borderCollapse: "collapse", minWidth: 520 } as React.CSSProperties,
    th: {
      textAlign: "left",
      fontSize: 12,
      color: "rgba(15,23,42,0.62)",
      padding: "10px 10px",
      background: "rgba(15,23,42,0.02)",
      borderBottom: "1px solid rgba(2,6,23,0.08)",
      fontWeight: 950,
    } as React.CSSProperties,
    td: {
      padding: "10px 10px",
      borderTop: "1px solid rgba(2,6,23,0.06)",
      fontWeight: 750,
      color: "#0f172a",
      verticalAlign: "top",
    } as React.CSSProperties,
    right: { textAlign: "right" as const } as React.CSSProperties,
    rank: {
      display: "inline-flex",
      width: 26,
      height: 26,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      background: "rgba(22,163,74,0.12)",
      border: "1px solid rgba(22,163,74,0.22)",
      color: "rgba(15,23,42,0.92)",
      fontWeight: 950,
      marginRight: 10,
    } as React.CSSProperties,
    sum: { marginTop: 10, fontSize: 12, color: "rgba(15,23,42,0.66)" } as React.CSSProperties,

    foot: { marginTop: 12, textAlign: "center", fontSize: 12, color: "rgba(15,23,42,0.60)" } as React.CSSProperties,
    responsiveNote: { marginTop: 10, fontSize: 12, color: "rgba(15,23,42,0.62)", textAlign: "center" } as React.CSSProperties,

    noData: {
      marginTop: 10,
      padding: "10px 12px",
      borderRadius: 12,
      border: "1px dashed rgba(2,6,23,0.18)",
      background: "rgba(15,23,42,0.02)",
      color: "rgba(15,23,42,0.70)",
      fontSize: 12,
      fontWeight: 850,
    } as React.CSSProperties,
  };

  const isNarrow = typeof window !== "undefined" ? window.innerWidth < 980 : false;
  const statsCols = isNarrow ? "repeat(2, 1fr)" : "repeat(4, 1fr)";
  const gridCols = isNarrow ? "1fr" : "1fr 1fr";
  const filterCols = isNarrow ? "1fr 1fr" : "160px 200px 200px 1fr";

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <div style={s.top}>
          <div>
            <div style={s.titleKicker}>Dashboard</div>
            <h1 style={s.title}>Analitika prodaje</h1>
          </div>

          <div style={s.topRight}>
            <button style={s.btn} onClick={() => navigate(-1)} title="Nazad">
              ⬅ Nazad na meni
            </button>

            <button
              style={{ ...s.btn, ...(loading ? s.btnDisabled : null) }}
              onClick={onRefresh}
              disabled={loading}
            >
              Osveži
            </button>

            <button style={{ ...s.btn, ...s.btnPrimary }} onClick={onExportPdf}>
              Export PDF
            </button>
          </div>
        </div>

        <div style={{ ...s.card, marginTop: 12 }}>
          <div style={{ ...s.filters, gridTemplateColumns: filterCols }}>
            <label style={s.field}>
              <span style={s.label}>Godina</span>
              <input
                value={godina}
                type="number"
                onChange={(e) => setGodina(Number(e.target.value))}
                style={s.input}
              />
            </label>

            <label style={s.field}>
              <span style={s.label}>Start</span>
              <input
                value={start}
                type="date"
                onChange={(e) => setStart(e.target.value)}
                style={s.input}
              />
            </label>

            <label style={s.field}>
              <span style={s.label}>End</span>
              <input
                value={end}
                type="date"
                onChange={(e) => setEnd(e.target.value)}
                style={s.input}
              />
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: isNarrow ? "flex-start" : "flex-end",
              }}
            >
              <div style={s.pill}>
                <span style={s.pillDot} />
                PDF export: <code style={{ fontWeight: 950 }}>/analytics/izvestaj/pdf</code>
              </div>
            </div>
          </div>
        </div>

        {err ? (
          <div style={s.alert}>
            <b>Greška:</b> {err}
          </div>
        ) : null}

        <div style={{ ...s.stats, gridTemplateColumns: statsCols }}>
          <div style={s.stat("x")}>
            <div
              style={s.statOverlay(
                "linear-gradient(135deg, rgba(22,163,74,1), rgba(14,165,233,1))"
              )}
            />
            <div style={s.statLabel}>Ukupan prihod</div>
            <div style={s.statValue}>
              {loading ? "..." : fmtEur(Number(ukupnoPrihod || 0))}
            </div>
          </div>

          <div style={s.stat("x")}>
            <div
              style={s.statOverlay(
                "linear-gradient(135deg, rgba(14,165,233,1), rgba(99,102,241,1))"
              )}
            />
            <div style={s.statLabel}>Ukupno komada</div>
            <div style={s.statValue}>
              {loading ? "..." : Number(ukupnoKomada || 0).toLocaleString("sr-RS")}
            </div>
          </div>

          <div style={s.stat("x")}>
            <div
              style={s.statOverlay(
                "linear-gradient(135deg, rgba(249,115,22,1), rgba(245,158,11,1))"
              )}
            />
            <div style={s.statLabel}>Top lista</div>
            <div style={s.statValue}>Top 10 parfema</div>
          </div>

          <div style={s.stat("x")}>
            <div
              style={s.statOverlay(
                "linear-gradient(135deg, rgba(236,72,153,1), rgba(99,102,241,1))"
              )}
            />
            <div style={s.statLabel}>Ukupan prihod Top10</div>
            <div style={s.statValue}>
              {loading ? "..." : fmtEur(Number(top10PrihodUkupno || 0))}
            </div>
          </div>
        </div>

        <div style={{ ...s.grid2, gridTemplateColumns: gridCols }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <LineChart title="Trend prihoda (period)" items={trendChart} />

            {!loading && trendChart.length > 0 && trendChart.every((x) => x.value === 0) ? (
              <div style={s.noData}>Nema prodaje u izabranom periodu.</div>
            ) : null}
          </div>

          <div>
            <BarChart title={`Prihod po mesecima (${godina})`} items={mesecnaChart} />
            {!loading && mesecnaChart.length === 0 ? (
              <div style={s.noData}>Nema podataka za izabranu godinu.</div>
            ) : null}
          </div>
        </div>

        <div style={{ ...s.grid2, gridTemplateColumns: gridCols }}>
          <div style={{ ...s.card, ...s.cardFill }}>
            <div style={s.cardHead}>Kratka analiza</div>

            <div style={s.cardBodyFill}>
              {loading ? (
                <div style={s.muted}>Učitavanje...</div>
              ) : (
                <div style={s.list}>
                  <div style={s.listRow}>
                    <span style={s.bullet} />
                    Izabrani period trenda: <b>{start}</b> → <b>{end}</b>
                  </div>
                  <div style={s.listRow}>
                    <span style={s.bullet} />
                    Ukupan prihod u sistemu: <b>{fmtEur(Number(ukupnoPrihod || 0))}</b>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ ...s.card, ...s.cardFill }}>
            <div style={s.cardHead}>Top 10 (prodaja / prihod)</div>

            <div style={s.cardBodyFill}>
              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={{ ...s.th, position: "sticky", top: 0, zIndex: 1 }}>
                        Parfem
                      </th>
                      <th
                        style={{
                          ...s.th,
                          ...s.right,
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                        }}
                      >
                        Komada
                      </th>
                      <th
                        style={{
                          ...s.th,
                          ...s.right,
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                        }}
                      >
                        Prihod
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {topRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ ...s.td, ...s.muted, padding: "12px 10px" }}>
                          Nema podataka.
                        </td>
                      </tr>
                    ) : (
                      topRows.map((r, idx) => (
                        <tr
                          key={r.name}
                          style={{
                            background: idx % 2 === 0 ? "rgba(15,23,42,0.02)" : "#fff",
                          }}
                        >
                          <td style={s.td}>
                            <span style={s.rank}>{idx + 1}</span>
                            {r.name}
                          </td>
                          <td style={{ ...s.td, ...s.right }}>
                            {Number(r.quantity || 0).toLocaleString("sr-RS")}
                          </td>
                          <td style={{ ...s.td, ...s.right }}>
                            {fmtEur(Number(r.revenue || 0))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={s.sum}>
                Ukupan prihod Top10:{" "}
                <b style={{ color: "#0f172a" }}>{fmtEur(Number(top10PrihodUkupno || 0))}</b>
              </div>
            </div>
          </div>
        </div>

        <div style={s.foot}></div>

        {isNarrow ? (
          <div style={s.responsiveNote}>(Responsive) Na manjim ekranima layout prelazi u 1 kolonu.</div>
        ) : null}
      </div>
    </div>
  );
};
