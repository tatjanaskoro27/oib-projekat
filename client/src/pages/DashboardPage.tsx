import React from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "../components/dashboard/navbar/Navbar";
import { IUserAPI } from "../api/users/IUserAPI";
import type { MicroserviceLink } from "../models/MicroserviceLink";

type Props = {
  userAPI: IUserAPI;
};

const SERVICES: MicroserviceLink[] = [
  {
    key: "user",
    title: "User microservice",
    description: "Upravljanje korisnicima, uloge, profil.",
    path: "/users",
    badge: "CORE",
  },
  {
    key: "auth",
    title: "Auth microservice",
    description: "Registracija, login, JWT, autorizacija.",
    path: "/auth-ms",
    badge: "CORE",
  },
  {
    key: "analytics",
    title: "Analytics microservice",
    description: "Fiskalni računi, analize prodaje i izveštaji.",
    path: "/analytics",
    badge: "DATA",
  },
  {
    key: "dogadjaji",
    title: "Dogadjaji microservice",
    description: "Evidencija događaja / audit log.",
    path: "/dogadjaji",
    badge: "OPS",
  },
  {
    key: "processing",
    title: "Processing microservice",
    description: "Prerada i obrada podataka / tokovi.",
    path: "/processing",
    badge: "DATA",
  },
  {
    key: "production",
    title: "Production microservice",
    description: "Produkcija / proces proizvodnje.",
    path: "/production",
    badge: "DATA",
  },
  {
    key: "sales",
    title: "Sales microservice",
    description: "Prodaja, narudžbine, artikli.",
    path: "/sales",
    badge: "CORE",
  },
];

export const DashboardPage: React.FC<Props> = ({ userAPI }) => {
  const navigate = useNavigate();

  const badgeClass = (b: MicroserviceLink["badge"]) => {
    if (b === "CORE") return "ms-badge core";
    if (b === "DATA") return "ms-badge data";
    if (b === "OPS") return "ms-badge ops";
    return "ms-badge";
  };

  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div className="window" style={{ width: "1100px", maxWidth: "95%", margin: "30px auto" }}>
        <DashboardNavbar userAPI={userAPI} />

   <div
  className="window-content"
  style={{
    padding: 24,
    maxHeight: "70vh",
    overflowY: "auto",
  }}
>

          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>Meni mikroservisa</h2>
              <div style={{ opacity: 0.8, marginTop: 6 }}>
                Izaberi servis koji želiš da testiraš u frontu.
              </div>
            </div>

            <div className="ms-pill">
              Ukupno: <b>{SERVICES.length}</b>
            </div>
          </div>

          <div className="ms-grid" style={{ marginTop: 18 }}>
            {SERVICES.map((s) => (
              <button
                key={s.key}
                className="ms-card"
                onClick={() => navigate(s.path)}
                type="button"
                title={s.title}
              >
                <div className="ms-card-top">
                  <div className="ms-icon" aria-hidden>
                    {s.key === "analytics" ? "📊" :
                     s.key === "auth" ? "🔐" :
                     s.key === "dogadjaji" ? "🧾" :
                     s.key === "processing" ? "⚙️" :
                     s.key === "production" ? "🏭" :
                     s.key === "sales" ? "🛒" : "👤"}
                  </div>

                  <div className={badgeClass(s.badge)}>{s.badge}</div>
                </div>

                <div className="ms-title">{s.title}</div>
                <div className="ms-desc">{s.description}</div>

                <div className="ms-go">
                  Otvori <span aria-hidden>→</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
