import React, { useState } from "react";
import { IAnalyticsAPI } from "../api/analytics/IAnalyticsAPI";
import { useAuth } from "../hooks/useAuthHook";
import { KreirajRacunDTO } from "../models/analytics/KreirajRacunDTO";

type Props = {
  analyticsAPI: IAnalyticsAPI;
};

export const AnalyticsPage: React.FC<Props> = ({ analyticsAPI }) => {
  const { token } = useAuth();

  const [ukupno, setUkupno] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  const testPrihodUkupno = async () => {
    try {
      setMessage("");
      const res = await analyticsAPI.prihodUkupno(token ?? "");
      setUkupno(res);
    } catch (e: any) {
      setMessage("Greška pri pozivu prihoda ukupno (proveri gateway rutu /analytics).");
    }
  };

  const testCreateRacun = async () => {
    try {
      setMessage("");

      const dto: KreirajRacunDTO = {
        brojRacuna: "FR-" + Math.floor(Math.random() * 100000),
        datumVreme: new Date().toISOString(),
        stavke: [
          { proizvodId: 1, naziv: "Proizvod 1", kolicina: 2, cena: 150 },
          { proizvodId: 2, naziv: "Proizvod 2", kolicina: 1, cena: 300 },
        ],
      };

      await analyticsAPI.createRacun(token ?? "", dto);
      setMessage("✅ Račun kreiran!");
    } catch (e: any) {
      setMessage("❌ Neuspešno kreiranje računa (proveri validacije/back).");
    }
  };

  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div className="window" style={{ width: "1100px", maxWidth: "95%", margin: "30px auto" }}>
        <div className="titlebar">
          <span className="titlebar-title">Analytics microservice</span>
        </div>

        <div className="window-content" style={{ padding: 24 }}>
          <div className="flex" style={{ gap: 12, marginBottom: 16 }}>
            <button className="btn btn-accent" onClick={testPrihodUkupno}>
              Prihod ukupno
            </button>
            <button className="btn btn-ghost" onClick={testCreateRacun}>
              Kreiraj test račun
            </button>
          </div>

         {typeof ukupno === "number" && (
  <div className="card" style={{ padding: 16, marginBottom: 12 }}>
    Ukupno: <b>{ukupno}</b>
  </div>
)}


          {message && (
            <div className="card" style={{ padding: 16 }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
