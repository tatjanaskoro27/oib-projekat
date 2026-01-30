import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuthHook";

import { ProductionAPI } from "../api/production/ProductionAPI";
import { DogadjajiAPI } from "../api/dogadjaji/DogadjajiAPI";
import { IDogadjajiAPI } from "../api/dogadjaji/IDogadjajiAPI";

import { PlantDTO } from "../models/production/PlantDTO";
import { PlantStatus } from "../enums/PlantStatus";
import { GetPlantsQueryDTO } from "../models/production/GetPlantsQueryDTO";

import { DogadjajDTO } from "../models/dogadjaji/DogadjajDTO";
import { TipDogadjaja } from "../models/dogadjaji/TipDogadjaja";

import { CreatePlantDTO } from "../models/production/CreatePlantDTO";
import { UpdateOilStrengthDTO } from "../models/production/UpdateOilStrengthDTO";

/* ---------------- Types ---------------- */

type PlantRowGrouped = {
  key: string;
  name: string;
  latinName: string;
  strengthAvg: number;
  qty: number;
  status: PlantStatus;
  statusLabel: "Posađena" | "Ubrana" | "Prerađena";
  ids: number[];
};

type PlantRowFlat = {
  id: number;
  name: string;
  latinName: string;
  strength: number;
  status: PlantStatus;
  statusLabel: "Posađena" | "Ubrana" | "Prerađena";
};

/* -------------- Helpers --------------- */

const toNumber = (v: string | number): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const statusLabelOf = (s: PlantStatus): "Posađena" | "Ubrana" | "Prerađena" => {
  if (s === PlantStatus.PLANTED) return "Posađena";
  if (s === PlantStatus.HARVESTED) return "Ubrana";
  return "Prerađena";
};

const statusPillStyle = (label: "Posađena" | "Ubrana" | "Prerađena"): React.CSSProperties => {
  const base: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    display: "inline-block",
    minWidth: 86,
    textAlign: "center",
  };

  if (label === "Posađena") return { ...base, background: "rgba(76, 175, 80, 0.22)" };
  if (label === "Ubrana") return { ...base, background: "rgba(255, 193, 7, 0.20)" };
  return { ...base, background: "rgba(96, 205, 255, 0.18)" };
};

const logIcon = (t: TipDogadjaja): string => {
  if (t === "INFO") return "✅";
  if (t === "WARNING") return "⚠️";
  return "❌";
};

const hhmm = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const groupPlantsToRows = (plants: PlantDTO[]): PlantRowGrouped[] => {
  const map = new Map<string, PlantRowGrouped>();

  for (const p of plants) {
    const strength = toNumber(p.oilStrength);
    const key = `${p.name}__${p.status}`;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        key,
        name: p.name,
        latinName: p.latinName,
        strengthAvg: strength,
        qty: 1,
        status: p.status,
        statusLabel: statusLabelOf(p.status),
        ids: [p.id],
      });
    } else {
      const newQty = existing.qty + 1;
      existing.strengthAvg = (existing.strengthAvg * existing.qty + strength) / newQty;
      existing.qty = newQty;
      existing.ids.push(p.id);
    }
  }

  const order = (s: PlantStatus): number =>
    s === PlantStatus.PLANTED ? 0 : s === PlantStatus.HARVESTED ? 1 : 2;

  return Array.from(map.values()).sort((a, b) => {
    const od = order(a.status) - order(b.status);
    if (od !== 0) return od;
    return a.name.localeCompare(b.name);
  });
};

const flatPlantsToRows = (plants: PlantDTO[]): PlantRowFlat[] => {
  const order = (s: PlantStatus): number =>
    s === PlantStatus.PLANTED ? 0 : s === PlantStatus.HARVESTED ? 1 : 2;

  return plants
    .map((p) => ({
      id: p.id,
      name: p.name,
      latinName: p.latinName,
      strength: toNumber(p.oilStrength),
      status: p.status,
      statusLabel: statusLabelOf(p.status),
    }))
    .sort((a, b) => {
      const od = order(a.status) - order(b.status);
      if (od !== 0) return od;
      return a.name.localeCompare(b.name);
    });
};

const sortDogadjajiNewestFirst = (items: DogadjajDTO[]): DogadjajDTO[] => {
  return [...items].sort((a, b) => {
    const ta = new Date(a.datumVreme).getTime();
    const tb = new Date(b.datumVreme).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });
};

/* -------------- Component -------------- */

export const ProductionPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const productionAPI = useMemo(() => new ProductionAPI(), []);
  const dogadjajiAPI: IDogadjajiAPI = useMemo(() => new DogadjajiAPI(), []);

  const [rawPlants, setRawPlants] = useState<PlantDTO[]>([]);
  const [groupedRows, setGroupedRows] = useState<PlantRowGrouped[]>([]);
  const [flatRows, setFlatRows] = useState<PlantRowFlat[]>([]);

  const [rawDogadjaji, setRawDogadjaji] = useState<DogadjajDTO[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [selectedGroupedIndex, setSelectedGroupedIndex] = useState<number | null>(null);
  const [selectedFlatIndex, setSelectedFlatIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [plantsError, setPlantsError] = useState<string | null>(null);

  // toast poruka (3s)
  const [toast, setToast] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlantStatus>("all");
  const [sortBy, setSortBy] = useState<GetPlantsQueryDTO["sortBy"]>("createdAt");
  const [sortDir, setSortDir] = useState<GetPlantsQueryDTO["sortDir"]>("DESC");

  // View mode
  const [viewMode, setViewMode] = useState<"grouped" | "all">("grouped");

  // Panels (Plant + Strength)
  const [showPlantPanel, setShowPlantPanel] = useState(false);
  const [showStrengthPanel, setShowStrengthPanel] = useState(false);

  // Plant form
  const [plantName, setPlantName] = useState("");
  const [latinName, setLatinName] = useState("");
  const [originCountry, setOriginCountry] = useState("");

  // Strength form (percent multiplier)
  const [percent, setPercent] = useState<number>(100);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const loadPlants = async (): Promise<void> => {
    if (!token) return;

    setIsLoading(true);
    setPlantsError(null);

    try {
      const query: GetPlantsQueryDTO = {
        search: search.trim() ? search.trim() : undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        sortBy: sortBy ?? undefined,
        sortDir: sortDir ?? undefined,
      };

      const plants = await productionAPI.getPlants(token, query);

      setRawPlants(plants);
      setGroupedRows(groupPlantsToRows(plants));
      setFlatRows(flatPlantsToRows(plants));
      setSelectedGroupedIndex(null);
      setSelectedFlatIndex(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Greška pri učitavanju biljaka.";
      setPlantsError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDogadjaji = async (): Promise<void> => {
    if (!token) return;

    setEventsError(null);

    try {
      const events = await dogadjajiAPI.getDogadjaji(token);
      setRawDogadjaji(sortDogadjajiNewestFirst(events));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Greška pri učitavanju događaja.";
      setEventsError(msg);
    }
  };

  const loadAll = async (): Promise<void> => {
    await Promise.all([loadPlants(), loadDogadjaji()]);
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => {
      void loadDogadjaji();
    }, 10000);
    return () => window.clearInterval(id);
  }, [token]);

  const selectedGrouped = selectedGroupedIndex !== null ? groupedRows[selectedGroupedIndex] : null;
  const selectedFlat = selectedFlatIndex !== null ? flatRows[selectedFlatIndex] : null;

  // ✅ akcije su sada omogućene
  const disabledAction = false;

  /* ---------------- Actions ---------------- */

  const handleCreatePlant = async () => {
    if (!token) return;

    const name = plantName.trim();
    if (!name) {
      showToast("Unesi naziv biljke.");
      return;
    }

    const dto: CreatePlantDTO = {
      name,
      latinName: latinName.trim() ? latinName.trim() : undefined,
      originCountry: originCountry.trim() ? originCountry.trim() : undefined,
    };

    try {
      setIsLoading(true);
      await productionAPI.createPlant(token, dto);
      showToast("Biljka uspješno zasađena");
      setShowPlantPanel(false);
      setPlantName("");
      setLatinName("");
      setOriginCountry("");
      await loadAll();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Greška pri sadnji biljke.";
      setPlantsError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStrength = async () => {
    if (!token) return;

    const p = Number(percent);

    if (!Number.isFinite(p)) {
      showToast("Jačina (percent) mora biti broj.");
      return;
    }

    if (p < 0 || p > 100) {
      showToast("Jačina mora biti između 0 i 100.");
      return;
    }


    // možeš primijeniti na selektovanu grupu ili pojedinačnu biljku
    let ids: number[] = [];

    if (viewMode === "grouped" && selectedGrouped) ids = selectedGrouped.ids;
    if (viewMode === "all" && selectedFlat) ids = [selectedFlat.id];

    if (ids.length === 0) {
      showToast("Selektuj biljku (ili grupu) pa promijeni jačinu.");
      return;
    }

    const dto: UpdateOilStrengthDTO = { percent: p };

    try {
      setIsLoading(true);
      await Promise.all(ids.map((id) => productionAPI.updateOilStrength(token, id, dto)));
      showToast(`Jačina uspješno promijenjena (× ${p}%)`);
      setShowStrengthPanel(false);
      await loadAll();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Greška pri promjeni jačine.";
      setPlantsError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overlay-blur-none" style={{ width: "100%", height: "100vh" }}>
      <div
        className="window"
        style={{
          width: "100%",
          height: "100%",
          margin: 0,
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top tabs + back */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px 0 12px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn-standard" style={{ padding: "8px 12px" }} onClick={() => navigate("/production")}>
              🏭 Servis proizvodnje
            </button>
            <button type="button" className="btn-standard" style={{ padding: "8px 12px", opacity: 0.85 }} onClick={() => navigate("/processing")}>
              ⚙️ Servis prerade
            </button>
          </div>

          <div style={{ flex: 1 }} />

          <button type="button" className="btn-standard" style={{ padding: "8px 12px" }} onClick={() => navigate("/dashboard")}>
            ← Nazad na meni
          </button>
        </div>

        {/* Content */}
        <div className="window-content" style={{ padding: 12, flex: 1, boxSizing: "border-box", minHeight: 0 }}>
          {/* toast */}
          {toast && (
            <div
              style={{
                marginBottom: 10,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(0,200,120,0.40)",
                background: "rgba(0,200,120,0.12)",
                fontWeight: 700,
              }}
            >
              ✅ {toast}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 12, height: "100%", minHeight: 0 }}>
            {/* LEFT */}
            <div className="acrylic" style={{ borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* Header */}
              <div
                style={{
                  background: "rgba(96, 205, 255, 0.18)",
                  padding: "10px 12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span>Upravljanje biljkama</span>
                <button type="button" className="btn-standard" style={{ padding: "6px 10px" }} onClick={() => void loadAll()}>
                  ⟳ Osveži
                </button>
              </div>

              {/* Toolbar */}
              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1fr) 170px 170px 120px 140px", gap: 8 }}>
                  <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pretraga (naziv / latin / zemlja)…" />

                  <select
                    className="input"
                    value={statusFilter}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "all") setStatusFilter("all");
                      else if (v === PlantStatus.PLANTED) setStatusFilter(PlantStatus.PLANTED);
                      else if (v === PlantStatus.HARVESTED) setStatusFilter(PlantStatus.HARVESTED);
                      else setStatusFilter(PlantStatus.PROCESSED);
                    }}
                  >
                    <option value="all">Sva stanja</option>
                    <option value={PlantStatus.PLANTED}>Posađena</option>
                    <option value={PlantStatus.HARVESTED}>Ubrana</option>
                    <option value={PlantStatus.PROCESSED}>Prerađena</option>
                  </select>

                  <select
                    className="input"
                    value={sortBy ?? "createdAt"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "createdAt" || v === "oilStrength" || v === "name") setSortBy(v);
                    }}
                  >
                    <option value="createdAt">Sort: datum</option>
                    <option value="oilStrength">Sort: jačina</option>
                    <option value="name">Sort: naziv</option>
                  </select>

                  <select
                    className="input"
                    value={sortDir ?? "DESC"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "ASC" || v === "DESC") setSortDir(v);
                    }}
                  >
                    <option value="DESC">DESC</option>
                    <option value="ASC">ASC</option>
                  </select>

                  <button type="button" className="btn-standard" onClick={() => void loadAll()}>
                    Primeni
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="button" className="btn-accent" disabled={disabledAction} onClick={() => setShowPlantPanel((v) => !v)}>
                    + Zasadi biljku
                  </button>

                  <button type="button" className="btn-standard" disabled={disabledAction} onClick={() => setShowStrengthPanel((v) => !v)}>
                    Promeni jačinu
                  </button>

                  <div style={{ flex: 1 }} />

                  <div style={{ display: "flex", gap: 6, alignItems: "center", opacity: 0.9 }}>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>Prikaz:</span>
                    <button
                      type="button"
                      className="btn-standard"
                      style={{ padding: "6px 10px", opacity: viewMode === "grouped" ? 1 : 0.75 }}
                      onClick={() => {
                        setViewMode("grouped");
                        setSelectedFlatIndex(null);
                      }}
                    >
                      Grupisano
                    </button>
                    <button
                      type="button"
                      className="btn-standard"
                      style={{ padding: "6px 10px", opacity: viewMode === "all" ? 1 : 0.75 }}
                      onClick={() => {
                        setViewMode("all");
                        setSelectedGroupedIndex(null);
                      }}
                    >
                      Sve biljke
                    </button>
                  </div>
                </div>

                {/* Panel: Zasadi */}
                {showPlantPanel && (
                  <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Zasadi biljku</div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, alignItems: "end" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        Naziv *
                        <input className="input" value={plantName} onChange={(e) => setPlantName(e.target.value)} placeholder="npr. Lavanda" />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        Latinski naziv
                        <input className="input" value={latinName} onChange={(e) => setLatinName(e.target.value)} placeholder="npr. Lavandula" />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        Zemlja porijekla
                        <input className="input" value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} placeholder="npr. BiH" />
                      </label>

                      <button type="button" className="btn-accent" onClick={() => void handleCreatePlant()} disabled={isLoading}>
                        {isLoading ? "..." : "Zasadi"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Panel: Jačina */}
                {showStrengthPanel && (
                  <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Promijeni jačinu ulja (percent)</div>

                    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr auto", gap: 8, alignItems: "end" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        Percent (npr. 80, 100, 120)
                        <input
                          className="input"
                          type="number"
                          min={1}
                          value={percent}
                          onChange={(e) => setPercent(Number(e.target.value))}
                        />
                      </label>

                      <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                        Primjenjuje se na selektovanu biljku (u “Sve biljke”) ili na sve u selektovanoj grupi (u “Grupisano”).<br />
                        Primjer: 80% smanji, 120% poveća.
                      </div>

                      <button type="button" className="btn-standard" onClick={() => void handleUpdateStrength()} disabled={isLoading}>
                        {isLoading ? "..." : "Primijeni"}
                      </button>
                    </div>
                  </div>
                )}

                {isLoading && <div style={{ opacity: 0.8 }}>Učitavam…</div>}
                {plantsError && <div style={{ color: "#ff6b6b" }}>Greška: {plantsError}</div>}
              </div>

              {/* Table area (scroll) */}
              <div style={{ padding: "0 12px 12px 12px", flex: 1, minHeight: 0 }}>
                <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden", height: "100%" }}>
                  <div style={{ height: "100%", overflow: "auto" }}>
                    {viewMode === "grouped" ? (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13 }}>Naziv</th>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13 }}>Latinski naziv</th>
                            <th style={{ textAlign: "right", padding: 10, fontSize: 13 }}>Jačina (avg)</th>
                            <th style={{ textAlign: "right", padding: 10, fontSize: 13 }}>Količina</th>
                            <th style={{ textAlign: "center", padding: 10, fontSize: 13 }}>Stanje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupedRows.map((r, i) => {
                            const isSel = i === selectedGroupedIndex;
                            return (
                              <tr key={r.key} onClick={() => setSelectedGroupedIndex(i)} style={{ cursor: "pointer", background: isSel ? "rgba(96,205,255,0.10)" : "transparent" }}>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>{r.name}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", opacity: 0.85, fontStyle: "italic" }}>{r.latinName}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "right", color: r.strengthAvg > 4 ? "#ff6b6b" : undefined }}>
                                  {Number(r.strengthAvg).toFixed(2)}
                                </td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "right" }}>{r.qty}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                                  <span style={statusPillStyle(r.statusLabel)}>{r.statusLabel}</span>
                                </td>
                              </tr>
                            );
                          })}

                          {!isLoading && groupedRows.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ padding: 12, opacity: 0.75 }}>
                                Nema podataka.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ background: "rgba(255,255,255,0.05)", position: "sticky", top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13 }}>ID</th>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13 }}>Naziv</th>
                            <th style={{ textAlign: "left", padding: 10, fontSize: 13 }}>Latinski naziv</th>
                            <th style={{ textAlign: "right", padding: 10, fontSize: 13 }}>Jačina</th>
                            <th style={{ textAlign: "center", padding: 10, fontSize: 13 }}>Stanje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flatRows.map((r, i) => {
                            const isSel = i === selectedFlatIndex;
                            return (
                              <tr key={r.id} onClick={() => setSelectedFlatIndex(i)} style={{ cursor: "pointer", background: isSel ? "rgba(96,205,255,0.10)" : "transparent" }}>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", opacity: 0.9 }}>{r.id}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>{r.name}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", opacity: 0.85, fontStyle: "italic" }}>{r.latinName}</td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "right", color: r.strength > 4 ? "#ff6b6b" : undefined }}>
                                  {Number(r.strength).toFixed(2)}
                                </td>
                                <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                                  <span style={statusPillStyle(r.statusLabel)}>{r.statusLabel}</span>
                                </td>
                              </tr>
                            );
                          })}

                          {!isLoading && flatRows.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ padding: 12, opacity: 0.75 }}>
                                Nema podataka.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 10, opacity: 0.8, fontSize: 12 }}>
                  Ukupno iz baze: <b>{rawPlants.length}</b> | Selektovana:{" "}
                  <b>
                    {viewMode === "grouped"
                      ? selectedGrouped
                        ? `${selectedGrouped.name} (${selectedGrouped.qty})`
                        : "Nema"
                      : selectedFlat
                        ? `${selectedFlat.name} (id=${selectedFlat.id})`
                        : "Nema"}
                  </b>
                </div>
              </div>
            </div>

            {/* RIGHT - Events (tvoj postojeći kod ispod) */}
            <div className="acrylic" style={{ borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  padding: "10px 12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span>🕒 Događaji</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ opacity: 0.75, fontSize: 12 }}>Ukupno: {rawDogadjaji.length}</span>
                  <button type="button" className="btn-standard" style={{ padding: "6px 10px" }} onClick={() => void loadDogadjaji()}>
                    ⟳
                  </button>
                </div>
              </div>

              {eventsError && <div style={{ padding: 12, color: "#ff6b6b" }}>Greška: {eventsError}</div>}

              <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, overflow: "auto", minHeight: 0 }}>
                {rawDogadjaji.slice(0, 50).map((d) => (
                  <div
                    key={d.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                      padding: 10,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 800 }}>
                        {logIcon(d.tip)} {d.tip}
                      </div>
                      <div style={{ opacity: 0.8, fontSize: 12 }}>{hhmm(d.datumVreme)}</div>
                    </div>
                    <div style={{ marginTop: 6, opacity: 0.9 }}>{d.opis}</div>
                  </div>
                ))}

                {rawDogadjaji.length === 0 && <div style={{ opacity: 0.75 }}>Nema događaja.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
