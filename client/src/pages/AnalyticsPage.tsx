import React, { useState } from "react";
import { IAnalyticsAPI } from "../api/analytics/IAnalyticsAPI";
import { useAuth } from "../hooks/useAuthHook";

// Ako si napravila ovaj zajednički fajl sa tipovima:
import {
  FiskalniRacunDTO,
  KreirajRacunDTO,
  MesecnaProdajaItem,
  MesecnaKomadaItem,
  TrendProdajeItem,
  Top10KolicinaItem,
  Top10PrihodItem,
} from "../models/analytics/AnalyticsDTOs";

// Ako NISI napravila AnalyticsDTOs.ts nego imaš stare fajlove pojedinačno,
// onda samo promeni import-e na tvoje postojeće DTO fajlove.

type Props = {
  analyticsAPI: IAnalyticsAPI;
};

export const AnalyticsPage: React.FC<Props> = ({ analyticsAPI }) => {
  const { token } = useAuth();

  // --------- OSNOVNO ----------
  const [ukupnoPrihod, setUkupnoPrihod] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  // --------- RACUNI ----------
  const [racuni, setRacuni] = useState<FiskalniRacunDTO[]>([]);
  const [racuniError, setRacuniError] = useState<string>("");

  // --------- TOP10 ----------
  const [top10Kolicina, setTop10Kolicina] = useState<Top10KolicinaItem[]>([]);
  const [top10Prihod, setTop10Prihod] = useState<Top10PrihodItem[]>([]);
  const [top10PrihodUkupno, setTop10PrihodUkupno] = useState<number | null>(null);

  // --------- PERIOD ----------
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-01-31");
  const [prihodPeriod, setPrihodPeriod] = useState<number | null>(null);
  const [kolicinaPeriod, setKolicinaPeriod] = useState<number | null>(null);

  // --------- GODINA ----------
  const [godina, setGodina] = useState<number>(2026);
  const [mesecnaPrihod, setMesecnaPrihod] = useState<MesecnaProdajaItem[]>([]);
  const [mesecnaKomada, setMesecnaKomada] = useState<MesecnaKomadaItem[]>([]);
  const [godisnjaPrihod, setGodisnjaPrihod] = useState<number | null>(null);
  const [godisnjaKomada, setGodisnjaKomada] = useState<number | null>(null);

  // --------- TREND ----------
  const [trend, setTrend] = useState<TrendProdajeItem[]>([]);

  // --------- UKUPNO KOMADA ----------
  const [ukupnoKomada, setUkupnoKomada] = useState<number | null>(null);

  // =====================================================
  // 1) PRIHOD UKUPNO
  // =====================================================
  const testPrihodUkupno = async () => {
    try {
      setMessage("");
      const res = await analyticsAPI.prihodUkupno(token ?? "");

      // Ako ti API vraća { ukupnaProdaja: number }
      setUkupnoPrihod(res.ukupnaProdaja);

      // Ako ti API JOŠ vraća number (stari kod), onda stavi:
      // setUkupnoPrihod(res as any);

    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "Greška pri pozivu prihoda ukupno.");
    }
  };

  // =====================================================
  // 2) UKUPNO KOMADA
  // =====================================================
  const loadUkupnoKomada = async () => {
    try {
      setMessage("");
      const res = await analyticsAPI.kolicinaUkupno(token ?? "");
      setUkupnoKomada(res.ukupnoKomada);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "Greška pri pozivu ukupno komada.");
    }
  };

  // =====================================================
  // 3) PERIOD PRIHOD + KOLICINA
  // =====================================================
  const loadPeriod = async () => {
    try {
      setMessage("");
      const t = token ?? "";
      const prihod = await analyticsAPI.prihodNedeljna(t, start, end);
      const kom = await analyticsAPI.kolicinaNedeljna(t, start, end);

      setPrihodPeriod(prihod.ukupno);
      setKolicinaPeriod(kom.ukupnoKomada);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "Greška pri pozivu period analitike.");
    }
  };

  // =====================================================
  // 4) TREND
  // =====================================================
  const loadTrend = async () => {
    try {
      setMessage("");
      const data = await analyticsAPI.prihodTrend(token ?? "", start, end);
      setTrend(data);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "Greška pri pozivu trenda.");
    }
  };

  // =====================================================
  // 5) GODINA - MESECNO + GODISNJE
  // =====================================================
  const loadGodina = async () => {
    try {
      setMessage("");
      const t = token ?? "";

      const mp = await analyticsAPI.prihodMesecna(t, godina);
      const mk = await analyticsAPI.kolicinaMesecna(t, godina);

      const gp = await analyticsAPI.prihodGodisnja(t, godina);
      const gk = await analyticsAPI.kolicinaGodisnja(t, godina);

      setMesecnaPrihod(mp);
      setMesecnaKomada(mk);

      setGodisnjaPrihod(gp.ukupno);
      setGodisnjaKomada(gk.ukupnoKomada);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "Greška pri učitavanju mesečnih/godišnjih analiza.");
    }
  };

  // =====================================================
  // 6) TOP10
  // =====================================================
  const loadTop10 = async () => {
    try {
      setMessage("");
      const t = token ?? "";

      const k = await analyticsAPI.top10Kolicina(t);
      const p = await analyticsAPI.top10Prihod(t);
      const u = await analyticsAPI.top10PrihodUkupno(t);

      setTop10Kolicina(k);
      setTop10Prihod(p);
      setTop10PrihodUkupno(u.ukupno);
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "Greška pri učitavanju Top10.");
    }
  };

  // =====================================================
  // 7) RACUNI (GET)
  // =====================================================
  const loadRacuni = async () => {
    try {
      setRacuniError("");
      setMessage("");
      const data = await analyticsAPI.getRacuni(token ?? "");
      setRacuni(data);
    } catch (e: any) {
      console.error(e);
      setRacuniError(e?.message ?? "Greška pri učitavanju računa.");
    }
  };

  // =====================================================
  // 8) KREIRAJ TEST RACUN (POST)
  // =====================================================
  const testCreateRacun = async () => {
    try {
      setMessage("");

      // ⚠️ OVO MORA DA ODGOVARA TVOM BACKEND DTO-u.
      // Ako tvoj backend očekuje brojRacuna/datumVreme/proizvodId/cena...
      // ostavi tako. Ako očekuje (parfemNaziv, kolicina, cenaPoKomadu) itd,
      // uskladi ovde.

      const dto: KreirajRacunDTO = {
        datum: new Date().toISOString().slice(0, 10),
        stavke: [
          { parfemNaziv: "Parfem 1", kolicina: 2, cenaPoKomadu: 150 },
          { parfemNaziv: "Parfem 2", kolicina: 1, cenaPoKomadu: 300 },
        ],
      };

      await analyticsAPI.createRacun(token ?? "", dto);
      setMessage("✅ Račun kreiran!");

      // refresh liste ako već postoji
      await loadRacuni();
    } catch (e: any) {
      console.error(e);
      setMessage(e?.message ?? "❌ Neuspešno kreiranje računa.");
    }
  };

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div className="window" style={{ width: "1100px", maxWidth: "95%", margin: "30px auto" }}>
        <div className="titlebar">
          <span className="titlebar-title">Analytics microservice</span>
        </div>

        <div
          className="window-content"
          style={{
            padding: 24,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {/* TOP ACTIONS */}
          <div className="flex" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <button className="btn btn-accent" onClick={testPrihodUkupno}>
              Prihod ukupno
            </button>

            <button className="btn btn-ghost" onClick={testCreateRacun}>
              Kreiraj test račun
            </button>

            <button className="btn btn-ghost" onClick={loadRacuni}>
              Učitaj račune
            </button>

            <button className="btn btn-ghost" onClick={loadTop10}>
              Top 10
            </button>

            <button className="btn btn-ghost" onClick={loadUkupnoKomada}>
              Ukupno komada
            </button>
          </div>

          {/* PRIHOD UKUPNO */}
          {typeof ukupnoPrihod === "number" && (
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              Ukupno prihod: <b>{ukupnoPrihod}</b>
            </div>
          )}

          {/* UKUPNO KOMADA */}
          {typeof ukupnoKomada === "number" && (
            <div className="card" style={{ padding: 16, marginBottom: 12 }}>
              Ukupno komada: <b>{ukupnoKomada}</b>
            </div>
          )}

          {/* PERIOD */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Period (start/end)</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label>
                Start:{" "}
                <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="YYYY-MM-DD" />
              </label>

              <label>
                End:{" "}
                <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="YYYY-MM-DD" />
              </label>

              <button className="btn btn-ghost" onClick={loadPeriod}>
                Prihod + količina (period)
              </button>

              <button className="btn btn-ghost" onClick={loadTrend}>
                Trend (po danima)
              </button>
            </div>

            <div style={{ marginTop: 10, opacity: 0.9 }}>
              {typeof prihodPeriod === "number" && (
                <div>
                  Prihod u periodu: <b>{prihodPeriod}</b>
                </div>
              )}
              {typeof kolicinaPeriod === "number" && (
                <div>
                  Komada u periodu: <b>{kolicinaPeriod}</b>
                </div>
              )}
            </div>

            {trend.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Trend</div>
                <ul>
                  {trend.map((x) => (
                    <li key={x.datum}>
                      {x.datum}: <b>{x.ukupno}</b>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* GODINA */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Godina</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label>
                Godina:{" "}
                <input
                  type="number"
                  value={godina}
                  onChange={(e) => setGodina(Number(e.target.value))}
                  style={{ width: 110 }}
                />
              </label>

              <button className="btn btn-ghost" onClick={loadGodina}>
                Učitaj mesečno + godišnje
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              {typeof godisnjaPrihod === "number" && (
                <div>
                  Godišnji prihod: <b>{godisnjaPrihod}</b>
                </div>
              )}
              {typeof godisnjaKomada === "number" && (
                <div>
                  Godišnje komada: <b>{godisnjaKomada}</b>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 240 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Mesečni prihod</div>
                {mesecnaPrihod.length === 0 ? (
                  <div style={{ opacity: 0.85 }}>Nema podataka.</div>
                ) : (
                  <ul>
                    {mesecnaPrihod.map((x) => (
                      <li key={x.mesec}>
                        Mesec {x.mesec}: <b>{x.ukupno}</b>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{ minWidth: 240 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Mesečno komada</div>
                {mesecnaKomada.length === 0 ? (
                  <div style={{ opacity: 0.85 }}>Nema podataka.</div>
                ) : (
                  <ul>
                    {mesecnaKomada.map((x) => (
                      <li key={x.mesec}>
                        Mesec {x.mesec}: <b>{x.ukupnoKomada}</b>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* TOP10 */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>Top 10</div>
              <button className="btn btn-ghost" onClick={loadTop10}>
                Učitaj Top 10
              </button>
            </div>

            {typeof top10PrihodUkupno === "number" && (
              <div style={{ marginTop: 10 }}>
                Ukupno prihod Top10: <b>{top10PrihodUkupno}</b>
              </div>
            )}

            <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              <div style={{ minWidth: 260 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Top10 po količini</div>
                {top10Kolicina.length === 0 ? (
                  <div style={{ opacity: 0.85 }}>Nema podataka.</div>
                ) : (
                  <ol>
                    {top10Kolicina.map((x) => (
                      <li key={x.parfemNaziv}>
                        {x.parfemNaziv} — <b>{x.kolicina}</b>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div style={{ minWidth: 260 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Top10 po prihodu</div>
                {top10Prihod.length === 0 ? (
                  <div style={{ opacity: 0.85 }}>Nema podataka.</div>
                ) : (
                  <ol>
                    {top10Prihod.map((x) => (
                      <li key={x.parfemNaziv}>
                        {x.parfemNaziv} — <b>{x.prihod}</b>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>

          {/* RACUNI */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 700 }}>Fiskalni računi</div>
              <button className="btn btn-ghost" onClick={loadRacuni}>
                Učitaj račune
              </button>
            </div>

            {racuniError && <div style={{ marginTop: 10, opacity: 0.9 }}>{racuniError}</div>}

            <div style={{ marginTop: 10 }}>
              {racuni.length === 0 ? (
                <div style={{ opacity: 0.85 }}>Nema računa (ili nisu učitani).</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: 8 }}>ID</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Datum</th>
                      <th style={{ textAlign: "left", padding: 8 }}>Ukupan iznos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {racuni.map((r) => (
                      <tr key={r.id}>
                        <td style={{ padding: 8 }}>{r.id}</td>
                        <td style={{ padding: 8 }}>{new Date(r.datum).toISOString().slice(0, 10)}</td>
                        <td style={{ padding: 8 }}>
                          <b>{r.ukupanIznos}</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* MESSAGE */}
          {message && (
            <div className="card" style={{ padding: 16, marginTop: 12 }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
