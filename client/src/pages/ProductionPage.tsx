import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Plant = {
    name: string;
    latin: string;
    strength: number;
    qty: number;
    status: "Posađena" | "Ubrana" | "Prerađena";
};

type LogItem = {
    time: string;
    type: "INFO" | "WARNING" | "ERROR";
    message: string;
};

export const ProductionPage: React.FC = () => {
    const navigate = useNavigate();

    const [plants, setPlants] = useState<Plant[]>([
        { name: "Lavanda", latin: "Lavandula angustifolia", strength: 3.2, qty: 50, status: "Posađena" },
        { name: "Ruža", latin: "Rosa damascena", strength: 4.5, qty: 30, status: "Ubrana" },
        { name: "Bergamot", latin: "Citrus bergamia", strength: 2.8, qty: 20, status: "Prerađena" },
    ]);

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const [log, setLog] = useState<LogItem[]>([
        { time: "14:23", type: "INFO", message: "Zasađena biljka: Lavanda" },
        { time: "14:20", type: "INFO", message: "Prerada završena: 5 bočica parfema" },
        { time: "14:15", type: "WARNING", message: "Upozorenje: Jačina ulja prelazi 4.0" },
    ]);

    const selected = useMemo(() => {
        if (selectedIndex === null) return null;
        return plants[selectedIndex] ?? null;
    }, [plants, selectedIndex]);

    const addLog = (item: LogItem) => setLog((prev) => [item, ...prev]);

    const nowHHmm = () => {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    };

    const onPlant = () => {
        // za sada demo: doda biljku + log
        const newPlant: Plant = {
            name: "Nova biljka",
            latin: "Plantus demo",
            strength: Number((1 + Math.random() * 4).toFixed(1)),
            qty: 10,
            status: "Posađena",
        };

        setPlants((prev) => [newPlant, ...prev]);
        addLog({ time: nowHHmm(), type: "INFO", message: `Zasađena biljka: ${newPlant.name}` });
    };

    const onHarvest = () => {
        if (selectedIndex === null) return;

        setPlants((prev) =>
            prev.map((p, i) => (i === selectedIndex ? { ...p, status: "Ubrana" } : p))
        );

        addLog({ time: nowHHmm(), type: "INFO", message: `Ubrana biljka: ${selected?.name ?? ""}` });
    };

    const onChangeStrength = () => {
        if (selectedIndex === null) return;

        setPlants((prev) =>
            prev.map((p, i) => {
                if (i !== selectedIndex) return p;
                const next = Number(Math.min(5, p.strength + 0.2).toFixed(1));
                return { ...p, strength: next };
            })
        );

        const nextStrength = plants[selectedIndex]?.strength ?? 0;
        const predicted = Number(Math.min(5, nextStrength + 0.2).toFixed(1));

        if (predicted > 4.0) {
            addLog({ time: nowHHmm(), type: "WARNING", message: "Upozorenje: Jačina ulja prelazi 4.0" });
        } else {
            addLog({ time: nowHHmm(), type: "INFO", message: "Promenjena jačina ulja." });
        }
    };

    const statusPillStyle = (s: Plant["status"]) => {
        const base: React.CSSProperties = {
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.06)",
        };

        if (s === "Posađena") return { ...base, background: "rgba(76, 175, 80, 0.22)" };
        if (s === "Ubrana") return { ...base, background: "rgba(255, 193, 7, 0.20)" };
        return { ...base, background: "rgba(96, 205, 255, 0.18)" };
    };

    const logIcon = (t: LogItem["type"]) => {
        if (t === "INFO") return "✅";
        if (t === "WARNING") return "⚠️";
        return "❌";
    };

    return (
        <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
            <div
                className="window"
                style={{
                    width: "100%",
                    height: "100%",
                    margin: 0,
                    borderRadius: 0,
                }}
            >

                {/* Top tabs + back */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 12px 0 12px",
                    }}
                >
                    <div style={{ display: "flex", gap: 6 }}>
                        <button
                            type="button"
                            className="btn-standard"
                            style={{ padding: "8px 12px" }}
                            onClick={() => navigate("/production")}
                            title="Služba proizvodnje"
                        >
                            🏭 Servis proizvodnje
                        </button>

                        <button
                            type="button"
                            className="btn-standard"
                            style={{ padding: "8px 12px", opacity: 0.85 }}
                            onClick={() => navigate("/processing")}
                            title="Služba prerade (ako je implementiraš kao poseban route)"
                        >
                            ⚙️ Servis prerade
                        </button>
                    </div>

                    <div style={{ flex: 1 }} />

                    <button
                        type="button"
                        className="btn-standard"
                        style={{ padding: "8px 12px" }}
                        onClick={() => navigate("/dashboard")}
                    >
                        ← Nazad na meni
                    </button>
                </div>

                {/* Content */}
                <div
                    className="window-content"
                    style={{ padding: 12, height: "100%", boxSizing: "border-box" }}
                >

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>
                        {/* LEFT: plants */}
                        <div className="acrylic" style={{ borderRadius: 12, overflow: "hidden" }}>
                            <div
                                style={{
                                    background: "rgba(96, 205, 255, 0.18)",
                                    padding: "10px 12px",
                                    fontWeight: 700,
                                }}
                            >
                                Upravljanje biljkama
                            </div>

                            <div style={{ padding: 12, display: "flex", gap: 8 }}>
                                <button type="button" className="btn-accent" onClick={onPlant}>
                                    + Zasadi biljku
                                </button>
                                <button type="button" className="btn-standard" onClick={onHarvest} disabled={selectedIndex === null}>
                                    Uberi biljku
                                </button>
                                <button type="button" className="btn-standard" onClick={onChangeStrength} disabled={selectedIndex === null}>
                                    Promeni jačinu
                                </button>
                            </div>

                            <div style={{ padding: "0 12px 12px 12px" }}>
                                <div
                                    style={{
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: 10,
                                        overflow: "hidden",
                                    }}
                                >
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead style={{ background: "rgba(255,255,255,0.05)" }}>
                                            <tr>
                                                <th style={{ textAlign: "left", padding: 10, fontSize: 13 }}>Naziv</th>
                                                <th style={{ textAlign: "left", padding: 10, fontSize: 13 }}>Latinski naziv</th>
                                                <th style={{ textAlign: "right", padding: 10, fontSize: 13 }}>Jačina</th>
                                                <th style={{ textAlign: "right", padding: 10, fontSize: 13 }}>Količina</th>
                                                <th style={{ textAlign: "center", padding: 10, fontSize: 13 }}>Stanje</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {plants.map((p, i) => {
                                                const isSelected = i === selectedIndex;
                                                return (
                                                    <tr
                                                        key={`${p.name}-${i}`}
                                                        onClick={() => setSelectedIndex(i)}
                                                        style={{
                                                            cursor: "pointer",
                                                            background: isSelected ? "rgba(96,205,255,0.10)" : "transparent",
                                                        }}
                                                    >
                                                        <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                                            {p.name}
                                                        </td>
                                                        <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", opacity: 0.85, fontStyle: "italic" }}>
                                                            {p.latin}
                                                        </td>
                                                        <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "right", color: p.strength > 4 ? "#ff6b6b" : undefined }}>
                                                            {p.strength.toFixed(1)}
                                                        </td>
                                                        <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "right" }}>
                                                            {p.qty}
                                                        </td>
                                                        <td style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                                                            <span style={statusPillStyle(p.status)}>{p.status}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ marginTop: 10, opacity: 0.8, fontSize: 12 }}>
                                    Ukupno biljaka: <b>{plants.reduce((a, b) => a + b.qty, 0)}</b> | Selektovana:{" "}
                                    <b>{selected ? selected.name : "Nema"}</b>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: diary */}
                        <div className="acrylic" style={{ borderRadius: 12, overflow: "hidden" }}>
                            <div
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    padding: "10px 12px",
                                    fontWeight: 700,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span>🕒 Dnevnik proizvodnje</span>
                                <span style={{ opacity: 0.75, fontSize: 12 }}>Ukupno akcija: {log.length}</span>
                            </div>

                            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                                {log.map((l, idx) => (
                                    <div
                                        key={`${l.time}-${idx}`}
                                        style={{
                                            border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: 10,
                                            padding: 10,
                                            background: "rgba(0,0,0,0.12)",
                                        }}
                                    >
                                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                            <div style={{ width: 26, textAlign: "center" }}>{logIcon(l.type)}</div>
                                            <div style={{ fontSize: 12, opacity: 0.8, width: 44 }}>{l.time}</div>
                                            <div style={{ fontSize: 13 }}>{l.message}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
