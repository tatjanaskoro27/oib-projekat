import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import { UserAPI } from "../api/users/UserAPI";
import type { UserDTO } from "../models/users/UserDTO";
import type { CreateUserDTO } from "../models/users/CreateUserDTO";
import type { UpdateUserDTO } from "../models/users/UpdateUserDTO";

type SortKey = "id" | "username" | "email" | "role";
type SortDir = "asc" | "desc";

const emptyCreate: CreateUserDTO = {
  username: "",
  password: "",
  email: "",
  role: "seller",
  profileImage: "",
};

export const UsersPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const token = auth?.token;

  const navigate = useNavigate(); // ✅ DODATO (minimalno)

  const api = useMemo(() => new UserAPI(), []);

  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false); // za create/edit/delete
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // CREATE state
  const [createOpen, setCreateOpen] = useState(false);
  const [createDto, setCreateDto] = useState<CreateUserDTO>({ ...emptyCreate });

  // EDIT state
  const [editId, setEditId] = useState<number | null>(null);
  const [editDto, setEditDto] = useState<UpdateUserDTO>({});

  const loadUsers = async () => {
    if (!token) return;
    setError(null);
    setInfo(null);

    try {
      setLoading(true);
      const data = await api.getAllUsers(token);
      setUsers(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Greška pri učitavanju korisnika.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, api]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = !term
      ? users
      : users.filter((u) => {
          return (
            String(u.id).includes(term) ||
            (u.username || "").toLowerCase().includes(term) ||
            (u.email || "").toLowerCase().includes(term) ||
            (u.role || "").toLowerCase().includes(term)
          );
        });

    const sorted = [...base].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];

      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }

      const as = String(av ?? "").toLowerCase();
      const bs = String(bv ?? "").toLowerCase();
      if (as < bs) return sortDir === "asc" ? -1 : 1;
      if (as > bs) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [users, q, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const startEdit = (u: UserDTO) => {
    setInfo(null);
    setError(null);
    setEditId(u.id);
    setEditDto({
      username: u.username,
      email: u.email,
      role: u.role,
      profileImage: u.profileImage ?? "",
      // password ne popunjavamo (ne prikazuje se)
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditDto({});
  };

  const submitCreate = async () => {
    if (!token) return;
    setError(null);
    setInfo(null);

    try {
      setBusy(true);

      // minimalna front validacija (backend je glavni)
      if (!createDto.username || createDto.username.trim().length < 3) {
        setError("Username mora imati bar 3 karaktera.");
        return;
      }
      if (!createDto.password || createDto.password.length < 6) {
        setError("Password mora imati bar 6 karaktera.");
        return;
      }
      if (!createDto.email || !createDto.email.includes("@")) {
        setError("Email nije validan.");
        return;
      }

      await api.createUser(token, {
        ...createDto,
        username: createDto.username.trim(),
        email: createDto.email.trim(),
        role: (createDto.role || "seller").trim(),
        profileImage: createDto.profileImage?.trim() || undefined,
      });

      setInfo("Korisnik je kreiran.");
      setCreateDto({ ...emptyCreate });
      setCreateOpen(false);
      await loadUsers();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Greška pri kreiranju korisnika.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async () => {
    if (!token || editId == null) return;
    setError(null);
    setInfo(null);

    try {
      setBusy(true);

      const payload: UpdateUserDTO = {
        username: editDto.username?.trim(),
        email: editDto.email?.trim(),
        role: editDto.role?.trim(),
        profileImage:
          editDto.profileImage === null
            ? null
            : (editDto.profileImage ?? "").toString().trim(),
      };

      // password samo ako korisnik nešto unese
      if (editDto.password && editDto.password.trim().length > 0) {
        payload.password = editDto.password;
      } else {
        delete payload.password;
      }

      await api.updateUser(token, editId, payload);

      setInfo("Korisnik je izmenjen.");
      cancelEdit();
      await loadUsers();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Greška pri izmeni korisnika.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitDelete = async (id: number) => {
    if (!token) return;
    setError(null);
    setInfo(null);

    const ok = window.confirm(`Obrisati korisnika #${id}?`);
    if (!ok) return;

    try {
      setBusy(true);
      await api.deleteUser(token, id);
      setInfo("Korisnik je obrisan.");
      await loadUsers();
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Greška pri brisanju korisnika.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay-blur-none" style={{ minHeight: "100vh" }}>
      <div
        className="window"
        style={{ width: "1100px", maxWidth: "95%", margin: "30px auto" }}
      >
        <div className="window-content" style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>Users microservice</h2>
              <div style={{ opacity: 0.8, marginTop: 6 }}>
                Pregled korisnika (admin).
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* ✅ DODATO: NAZAD NA MENI */}
              <button
                className="btn"
                onClick={() => navigate("/dashboard")}
                disabled={loading || busy}
                title="Nazad na meni"
              >
                ⬅ Nazad na meni
              </button>

              <button
                className="btn btn-accent"
                onClick={() => setCreateOpen((v) => !v)}
                disabled={loading || busy}
              >
                {createOpen ? "Close" : "Create user"}
              </button>
              <button
                className="btn"
                onClick={loadUsers}
                disabled={loading || busy}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* CREATE FORM */}
          {createOpen && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 10 }}>
                Create user
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <input
                  placeholder="Username"
                  value={createDto.username}
                  onChange={(e) =>
                    setCreateDto((p) => ({ ...p, username: e.target.value }))
                  }
                  disabled={busy}
                  style={{ minWidth: 240 }}
                />
                <input
                  placeholder="Email"
                  value={createDto.email}
                  onChange={(e) =>
                    setCreateDto((p) => ({ ...p, email: e.target.value }))
                  }
                  disabled={busy}
                  style={{ minWidth: 260 }}
                />
                <input
                  placeholder="Password"
                  type="password"
                  value={createDto.password}
                  onChange={(e) =>
                    setCreateDto((p) => ({ ...p, password: e.target.value }))
                  }
                  disabled={busy}
                  style={{ minWidth: 220 }}
                />
                <input
                  placeholder='Role (npr "admin" ili "seller")'
                  value={createDto.role ?? ""}
                  onChange={(e) =>
                    setCreateDto((p) => ({ ...p, role: e.target.value }))
                  }
                  disabled={busy}
                  style={{ minWidth: 220 }}
                />
                <input
                  placeholder="Profile image (url/base64) (opciono)"
                  value={createDto.profileImage ?? ""}
                  onChange={(e) =>
                    setCreateDto((p) => ({
                      ...p,
                      profileImage: e.target.value,
                    }))
                  }
                  disabled={busy}
                  style={{ minWidth: 320, flex: 1 }}
                />
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button
                  className="btn btn-accent"
                  onClick={submitCreate}
                  disabled={busy}
                >
                  Create
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setCreateDto({ ...emptyCreate });
                    setCreateOpen(false);
                  }}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* SEARCH + SORT */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <input
              placeholder="Pretraga po ID / username / email / role..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              disabled={loading}
              style={{ minWidth: 320 }}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ opacity: 0.8 }}>Sort:</span>
              <button
                className="btn"
                onClick={() => toggleSort("id")}
                disabled={loading}
              >
                ID {sortKey === "id" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </button>
              <button
                className="btn"
                onClick={() => toggleSort("username")}
                disabled={loading}
              >
                Username{" "}
                {sortKey === "username" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </button>
              <button
                className="btn"
                onClick={() => toggleSort("email")}
                disabled={loading}
              >
                Email{" "}
                {sortKey === "email" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </button>
              <button
                className="btn"
                onClick={() => toggleSort("role")}
                disabled={loading}
              >
                Role {sortKey === "role" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </button>
            </div>
          </div>

          {/* STATUS */}
          {error && (
            <div style={{ marginTop: 14, color: "crimson" }}>{error}</div>
          )}
          {info && (
            <div style={{ marginTop: 14, color: "var(--win11-accent)" }}>
              {info}
            </div>
          )}

          <div style={{ marginTop: 16, opacity: 0.8 }}>
            {loading
              ? "Učitavam..."
              : `Prikazano: ${filtered.length} / ${users.length}`}
          </div>

          {/* TABLE */}
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", opacity: 0.85 }}>
                  <th style={{ padding: "10px 8px" }}>ID</th>
                  <th style={{ padding: "10px 8px" }}>Username</th>
                  <th style={{ padding: "10px 8px" }}>Email</th>
                  <th style={{ padding: "10px 8px" }}>Role</th>
                  <th style={{ padding: "10px 8px" }}>Profile image</th>
                  <th style={{ padding: "10px 8px", width: 220 }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((u) => {
                  const isEdit = editId === u.id;

                  return (
                    <tr
                      key={u.id}
                      style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <td style={{ padding: "10px 8px" }}>{u.id}</td>

                      <td style={{ padding: "10px 8px" }}>
                        {isEdit ? (
                          <input
                            value={editDto.username ?? ""}
                            onChange={(e) =>
                              setEditDto((p) => ({
                                ...p,
                                username: e.target.value,
                              }))
                            }
                            disabled={busy}
                          />
                        ) : (
                          u.username
                        )}
                      </td>

                      <td style={{ padding: "10px 8px" }}>
                        {isEdit ? (
                          <input
                            value={editDto.email ?? ""}
                            onChange={(e) =>
                              setEditDto((p) => ({
                                ...p,
                                email: e.target.value,
                              }))
                            }
                            disabled={busy}
                          />
                        ) : (
                          u.email
                        )}
                      </td>

                      <td style={{ padding: "10px 8px" }}>
                        {isEdit ? (
                          <input
                            value={editDto.role ?? ""}
                            onChange={(e) =>
                              setEditDto((p) => ({
                                ...p,
                                role: e.target.value,
                              }))
                            }
                            disabled={busy}
                          />
                        ) : (
                          u.role
                        )}
                      </td>

                      <td style={{ padding: "10px 8px" }}>
                        {isEdit ? (
                          <input
                            value={(editDto.profileImage ?? "") as any}
                            onChange={(e) =>
                              setEditDto((p) => ({
                                ...p,
                                profileImage: e.target.value,
                              }))
                            }
                            disabled={busy}
                          />
                        ) : u.profileImage ? (
                          u.profileImage
                        ) : (
                          <span style={{ opacity: 0.6 }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: "10px 8px" }}>
                        {!isEdit ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              className="btn"
                              onClick={() => startEdit(u)}
                              disabled={busy}
                            >
                              Edit
                            </button>
                            <button
                              className="btn"
                              onClick={() => submitDelete(u.id)}
                              disabled={busy}
                            >
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <input
                              placeholder="New password (optional)"
                              type="password"
                              value={editDto.password ?? ""}
                              onChange={(e) =>
                                setEditDto((p) => ({
                                  ...p,
                                  password: e.target.value,
                                }))
                              }
                              disabled={busy}
                              style={{ minWidth: 170 }}
                            />
                            <button
                              className="btn btn-accent"
                              onClick={submitEdit}
                              disabled={busy}
                            >
                              Save
                            </button>
                            <button
                              className="btn"
                              onClick={cancelEdit}
                              disabled={busy}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "14px 8px", opacity: 0.75 }}
                    >
                      Nema rezultata.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 14, opacity: 0.65, fontSize: 13 }}>
            Napomena: u tvom GatewayController-u endpoint <code>/users</code> je{" "}
            <strong>admin only</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
