import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuthHook";
import type { DogadjajDTO } from "../models/dogadjaji/DogadjajDTO";
import type { TipDogadjaja } from "../models/dogadjaji/TipDogadjaja";
import type { IDogadjajiAPI } from "../api/dogadjaji/IDogadjajiAPI";

type Props = {
  dogadjajiAPI: IDogadjajiAPI;
};

const TIPOVI: Array<{ label: string; value: TipDogadjaja | "ALL" }> = [
  { label: "Svi", value: "ALL" },
  { label: "INFO", value: "INFO" },
  { label: "WARNING", value: "WARNING" },
  { label: "ERROR", value: "ERROR" },
];

export const DogadjajiPage: React.FC<Props> = ({ dogadjajiAPI }) => {
  const { token } = useAuth();

  const [tip, setTip] = useState<TipDogadjaja | "ALL">("ALL");
  const [data, setData] = useState<DogadjajDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const badgeClass = useMemo(() => {
    return (t: TipDogadjaja) => {
      if (t === "ERROR") return "ms-badge ops";      // crveno/narandzasto u tvom css-u
      if (t === "WARNING") return "ms-badge data";   // zuto/plavo kako vec
      return "ms-badge core";                        // sivo/plavo
    };
  }, []);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const t = token ?? "";
      const res =
        tip === "ALL"
          ? await dogadjajiAPI.getDogadjaji(t)
          : await dogadjajiAPI.getDogadjajiByTip(t, tip);

      setData(res);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Greška pri učitavanju događaja.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tip]);

  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div className="window" style={{ width: "1100px", maxWidth: "95%", margin: "30px auto" }}>
        <div className="window-content" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>Događaji / Audit log</h2>
              <div style={{ opacity: 0.8, marginTop: 6 }}>
                Pregled i filtriranje događaja po tipu.
              </div>
            </div>

            <button className="ms-pill" type="button" onClick={load} disabled={loading}>
              {loading ? "Učitavam..." : "Osveži"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
            <div style={{ opacity: 0.8 }}>Filter:</div>
            <select
              value={tip}
              onChange={(e) => setTip(e.target.value as any)}
              style={{ padding: "8px 10px", borderRadius: 10 }}
            >
              {TIPOVI.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>

            <div style={{ marginLeft: "auto", opacity: 0.8 }}>
              Ukupno: <b>{data.length}</b>
            </div>
          </div>

          {err && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(255,0,0,0.08)" }}>
              ❌ {err}
            </div>
          )}

          <div style={{ marginTop: 16, maxHeight: "65vh", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", opacity: 0.8 }}>
                  <th style={{ padding: "10px 8px" }}>Datum/vreme</th>
                  <th style={{ padding: "10px 8px" }}>Tip</th>
                  <th style={{ padding: "10px 8px" }}>Opis</th>
                </tr>
              </thead>

              <tbody>
                {data.map((d) => (
                  <tr key={d.id} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                      {new Date(d.datumVreme).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 8px" }}>
                      <span className={badgeClass(d.tip)}>{d.tip}</span>
                    </td>
                    <td style={{ padding: "10px 8px" }}>{d.opis}</td>
                  </tr>
                ))}

                {!loading && data.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 16, opacity: 0.7 }}>
                      Nema događaja za izabrani filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};
