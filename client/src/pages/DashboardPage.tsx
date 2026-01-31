import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardNavbar } from "../components/dashboard/navbar/Navbar";
import { IUserAPI } from "../api/users/IUserAPI";
import { useAuth } from "../hooks/useAuthHook";

type Props = {
  userAPI: IUserAPI;
};

type Role = "admin" | "seller" | "manager";

type Tile = {
  key: string;
  title: string;
  path: string;
  roles: Role[];
  icon: React.ReactNode;
};

const IconBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="dash-iconBox" aria-hidden>
    {children}
  </div>
);

// --- SVG icons (clean, serious) ---
const IconChart = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M4 19V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 19H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 15l3-3 3 2 4-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconGauge = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M20 13a8 8 0 10-16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 13l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 21h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconReceipt = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3z"
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconUsers = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M16 11a3 3 0 10-6 0 3 3 0 006 0z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 20a6 6 0 0116 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M19 8.5a2.5 2.5 0 11-1.5 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconLeaf = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M20 4c-7 1-12 6-13 13 7-1 12-6 13-13z"
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M7 17c-1.5 1.2-2.5 2.6-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconFlask = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M10 2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 2v6l-4.5 7.5A4 4 0 009 21h6a4 4 0 003.5-5.5L14 8V2"
      stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M9 14h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconCart = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M6 6h15l-2 8H7L6 6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M6 6l-1-3H2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 20a1 1 0 100-2 1 1 0 000 2zM18 20a1 1 0 100-2 1 1 0 000 2z"
      fill="currentColor" />
  </svg>
);

const IconWarehouse = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M3 10l9-6 9 6v10H3V10z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M7 20v-6h10v6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M10 14v6M14 14v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const DashboardPage: React.FC<Props> = ({ userAPI }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = (String(user?.role || "").toLowerCase() as Role) || "seller";

  const TILES: Tile[] = [
    // ADMIN
    { key: "analytics", title: "Analytics", path: "/analytics", roles: ["admin"], icon: <IconChart /> },
    { key: "performance", title: "Performance", path: "/performance", roles: ["admin"], icon: <IconGauge /> },
    { key: "dogadjaji", title: "Događaji", path: "/dogadjaji", roles: ["admin"], icon: <IconReceipt /> },
    { key: "users", title: "Korisnici", path: "/users", roles: ["admin"], icon: <IconUsers /> },

    // SELLER / MANAGER
    { key: "production", title: "Proizvodnja", path: "/production", roles: ["seller", "manager"], icon: <IconLeaf /> },
    { key: "processing", title: "Prerada", path: "/processing", roles: ["seller", "manager"], icon: <IconFlask /> },
    { key: "sales", title: "Prodaja", path: "/sales", roles: ["seller", "manager"], icon: <IconCart /> },
    { key: "skladiste", title: "Skladište", path: "/skladiste", roles: ["seller", "manager"], icon: <IconWarehouse /> },
  ];

  const visible = useMemo(() => TILES.filter(t => t.roles.includes(role)), [role]);

  return (
    <div
      className="overlay-blur-none"
      style={{
        position: "fixed",
        backgroundColor: "#f5f6f8",
        inset: 0,
      }}
    >
      <div
        className="window"
        style={{
          width: "1100px",
          maxWidth: "95%",
          margin: "30px auto",
          height: "70vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <DashboardNavbar userAPI={userAPI} />

        <div
          className="window-content"
          style={{
            padding: 24,
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="dash-grid">
            {visible.map((t) => (
              <button
                key={t.key}
                className="dash-tile"
                onClick={() => navigate(t.path)}
                type="button"
                title={t.title}
              >
                <IconBox>{t.icon}</IconBox>
                <div className="dash-title">{t.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
