import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "./AdminHeader";
import AdminRoute from "./AdminRoute";
import { getAdminApiUrl } from "../../utils/apiConfig";
import { formatINR } from "../../utils/format";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN");

const toCsv = (rows) => {
  const cols = ["name", "email", "signInMethod", "role", "company", "phone", "createdAt", "lastLoginAt", "orders", "totalSpent", "enquiries"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
};

const Stat = ({ label, value, note }) => (
  <div className="gw-stat">
    <span className="gw-stat-label">{label}</span>
    <span className="gw-stat-value">{value}</span>
    {note && <span className="gw-stat-note">{note}</span>}
  </div>
);

// 30 daily bars; the table under it carries the same numbers for screen readers.
const VisitsChart = ({ daily }) => {
  const max = Math.max(1, ...daily.map((d) => d.visitors));
  return (
    <figure className="gw-chart">
      <figcaption className="gw-chart-title">Visitors per day, last 30 days</figcaption>
      <div className="gw-bars" aria-hidden="true">
        {daily.map((d) => (
          <div key={d.date} className="gw-bar-col" title={`${fmtDate(d.date)}: ${d.visitors} visitors, ${d.views} page views`}>
            <div className="gw-bar" style={{ height: `${(d.visitors / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="gw-bars-axis" aria-hidden="true">
        <span>{fmtDate(daily[0]?.date)}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>Visitors and page views per day</caption>
        <thead>
          <tr><th>Date</th><th>Visitors</th><th>Page views</th></tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.date}><td>{d.date}</td><td>{d.visitors}</td><td>{d.views}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
};

const ManageUsers = () => {
  const { token } = useAuth();
  const [visits, setVisits] = useState(null);
  const [people, setPeople] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const headers = { Authorization: `Bearer ${token}` };
    // Load both halves in parallel and show each as soon as it arrives; the account list
    // can be slower because Google sign-ins are fetched from Clerk.
    const get = async (path, set) => {
      const res = await fetch(getAdminApiUrl(path), { headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Couldn't load users and visitors.");
      set(data);
    };
    const results = await Promise.allSettled([
      get("/api/admin/analytics", setVisits),
      get("/api/admin/users", setPeople),
    ]);
    const failed = results.find((r) => r.status === "rejected");
    if (failed) setError(failed.reason.message);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (people?.users || []).filter(
      (u) =>
        (method === "all" || u.signInMethod === method) &&
        (!q || [u.name, u.email, u.company, u.phone].some((v) => String(v || "").toLowerCase().includes(q)))
    );
  }, [people, search, method]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `giftingwellness-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AdminRoute>
      <div className="admin-page-layout">
        <AdminHeader />
        <main className="container admin-main-content gw-users-page">
          <div className="admin-breadcrumb-bar">
            <div>
              <h1 className="admin-page-title">
                <i className="fa-solid fa-users" aria-hidden="true"></i> Users & visitors
              </h1>
              <p className="admin-page-desc">
                How many people visit the shop, and everyone who has an account.
              </p>
            </div>
            <div className="admin-header-actions">
              <button type="button" className="btn-admin-action" onClick={load} disabled={loading}>
                <i className={`fa-solid fa-arrows-rotate ${loading ? "fa-spin" : ""}`} aria-hidden="true"></i> Refresh
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {loading && !visits && <p className="gw-loading">Loading users and visitors…</p>}

          {visits && !people && loading && <p className="gw-loading">Loading accounts…</p>}

          {visits && (
            <section aria-labelledby="visitors-h" className="gw-panel">
              <h2 id="visitors-h" className="gw-panel-title">Visitors</h2>
              <div className="gw-stats">
                <Stat label="Visitors today" value={fmtNum(visits.today.visitors)} note={`${fmtNum(visits.today.views)} page views`} />
                <Stat label="Last 7 days" value={fmtNum(visits.last7Days.visitors)} note={`${fmtNum(visits.last7Days.views)} page views`} />
                <Stat label="Last 30 days" value={fmtNum(visits.last30Days.visitors)} note={`${fmtNum(visits.last30Days.views)} page views`} />
              </div>
              <div className="gw-visits-grid">
                <VisitsChart daily={visits.daily} />
                <div className="gw-top-pages">
                  <h3 className="gw-chart-title">Most viewed pages, 30 days</h3>
                  {visits.topPages.length === 0 ? (
                    <p className="gw-muted">No visits recorded yet. Counts start as soon as people browse the shop.</p>
                  ) : (
                    <ol>
                      {visits.topPages.map((p) => (
                        <li key={p.path}>
                          <a href={p.path} target="_blank" rel="noreferrer">{p.path}</a>
                          <span>{fmtNum(p.views)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
              <p className="gw-muted gw-fineprint">
                A visitor is one browser. Counts are anonymous: no names, emails or IP addresses are stored,
                and visitors who ask not to be tracked aren&apos;t counted.
              </p>
            </section>
          )}

          {people && (
            <section aria-labelledby="accounts-h" className="gw-panel">
              <h2 id="accounts-h" className="gw-panel-title">Accounts</h2>
              <div className="gw-stats">
                <Stat label="Registered users" value={fmtNum(people.total)} />
                <Stat label="New this week" value={fmtNum(people.newThisWeek)} />
                <Stat label="Have ordered" value={fmtNum(people.withOrders)} />
                <Stat label="Admins" value={fmtNum(people.admins)} />
              </div>
              {people.clerkError && <p className="gw-muted">Note: {people.clerkError}</p>}

              <div className="gw-table-tools">
                <div className="form-group">
                  <label className="form-label" htmlFor="user-search">Search</label>
                  <input
                    id="user-search"
                    type="search"
                    className="form-input"
                    placeholder="Name, email, company or phone"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="user-method">Sign-in method</label>
                  <select id="user-method" className="form-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="all">All</option>
                    <option value="Email & password">Email & password</option>
                    <option value="Google (Clerk)">Google</option>
                  </select>
                </div>
                <button type="button" className="btn-admin-outline" onClick={exportCsv} disabled={rows.length === 0}>
                  <i className="fa-solid fa-file-csv" aria-hidden="true"></i> Export {rows.length} to CSV
                </button>
              </div>

              <div className="admin-table-responsive">
                <table className="admin-table gw-users-table">
                  <thead>
                    <tr>
                      <th scope="col">Person</th>
                      <th scope="col">Sign-in</th>
                      <th scope="col">Joined</th>
                      <th scope="col">Last signed in</th>
                      <th scope="col" className="num">Orders</th>
                      <th scope="col" className="num">Spent</th>
                      <th scope="col" className="num">Enquiries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="gw-muted">No accounts match that search.</td>
                      </tr>
                    ) : (
                      rows.map((u) => (
                        <tr key={`${u.signInMethod}-${u.id}`}>
                          <td>
                            <div className="gw-person">
                              <strong>{u.name || "No name given"}</strong>
                              <a href={`mailto:${u.email}`}>{u.email}</a>
                              {(u.company || u.phone) && (
                                <span className="gw-muted">{[u.company, u.phone].filter(Boolean).join(" · ")}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {u.signInMethod === "Google (Clerk)" ? "Google" : "Email"}
                            {u.role === "admin" && <span className="gw-role">Admin</span>}
                          </td>
                          <td>{fmtDate(u.createdAt)}</td>
                          <td>{fmtDate(u.lastLoginAt)}</td>
                          <td className="num">{fmtNum(u.orders)}</td>
                          <td className="num">{u.totalSpent ? formatINR(u.totalSpent) : "—"}</td>
                          <td className="num">{fmtNum(u.enquiries)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </AdminRoute>
  );
};

export default ManageUsers;
