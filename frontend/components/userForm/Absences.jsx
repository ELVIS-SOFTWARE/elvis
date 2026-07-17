import React, { useEffect, useMemo, useState } from "react";
import * as api from "../../tools/api";
import Swal from "sweetalert2";

const COLORS = {
    card: "#ffffff",
    border: "#e6e8ef",
    text: "#1f2a44",
    muted: "#7b8499",
    primary: "#1f3a8a",
    dangerBg: "#fde8ea",
    dangerText: "#d13c4b",
    successBg: "#e5f6ec",
    successText: "#1f9d57",
    warnBg: "#fff1e2",
    warnText: "#e07b1a",
};

/**
 * Onglet "Absences" de la fiche élève.
 * KPIs, filtres (saison, type, cours, recherche dans les remarques),
 * tableau paginé et navigation croisée vers le suivi global.
 */
export default function Absences({ user_id, seasons = [] }) {
    const currentSeason = useMemo(
        () => seasons.find(s => s.is_current) || seasons[0],
        [seasons]
    );

    const [seasonId, setSeasonId] = useState(currentSeason ? currentSeason.id : null);
    const [absences, setAbsences] = useState([]);
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    const [type, setType] = useState("all");
    const [courseId, setCourseId] = useState("all");
    const [search, setSearch] = useState("");
    const [sortDesc, setSortDesc] = useState(true);

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (!seasonId) return;

        setLoading(true);
        api.get(`/users/${user_id}/absences_summary`, { sid: seasonId })
            .then(({ data }) => {
                setAbsences((data && data.absences) || []);
                setCourses((data && data.courses) || []);
                setStats((data && data.stats) || null);
                setPage(0);
            })
            .finally(() => setLoading(false));
    }, [seasonId, user_id]);

    const kpis = useMemo(() => {
        const total = absences.length;
        const justified = absences.filter(a => a.justified).length;
        const unjustified = total - justified;
        const pct = n => (total ? Math.round((n / total) * 100) : 0);
        return { total, justified, unjustified, justifiedPct: pct(justified), unjustifiedPct: pct(unjustified) };
    }, [absences]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = absences.filter(a => {
            if (type === "justified" && !a.justified) return false;
            if (type === "unjustified" && a.justified) return false;
            if (courseId !== "all" && String(a.activity_ref_id) !== String(courseId)) return false;
            if (q && !(a.remarks || "").toLowerCase().includes(q)) return false;
            return true;
        });
        return rows.sort((a, b) =>
            sortDesc ? (a.date_iso < b.date_iso ? 1 : -1) : (a.date_iso > b.date_iso ? 1 : -1)
        );
    }, [absences, type, courseId, search, sortDesc]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pageCount - 1);
    const pageRows = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

    useEffect(() => setPage(0), [type, courseId, search, pageSize]);

    const updateRemarks = (id, value) => {
        const current = absences.find(a => a.id === id);
        if (current && (current.remarks || "") === value) return;

        api.set()
            .success(() => {
                setAbsences(prev => prev.map(a => (a.id === id ? { ...a, remarks: value } : a)));
                Swal.fire({
                    title: "Enregistré !", text: "La remarque a été enregistrée.", icon: "success",
                    timer: 2000, showConfirmButton: false, toast: true, position: "top-end",
                });
            })
            .error(() => {
                Swal.fire({ title: "Erreur", text: "Échec de l'enregistrement de la remarque.", icon: "error" });
            })
            .patch(`/student_attendances/${id}/update_remarks`, { remarks: value });
    };

    const exportCsv = () => {
        const header = ["Date", "Cours", "Professeur", "Type d'absence", "Remarque"];
        const lines = filtered.map(a => [
            a.date, a.activity, a.teacher, a.justified ? "Justifiée" : "Injustifiée", a.remarks,
        ]);
        downloadCsv(header, lines, `absences_${user_id}.csv`);
    };

    return (
        <div style={{ color: COLORS.text, fontSize: "14px" }}>
            <ScopedStyles />

            {/* Navigation croisée */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <a href="/absences" style={S.linkBtn}>
                    <i className="fas fa-external-link-alt" style={{ marginRight: "8px" }} />
                    Voir dans le suivi global
                </a>
            </div>

            {/* KPIs */}
            <div style={{ ...S.kpiRow, flexWrap: "wrap" }}>
                <KpiCard icon="fa-user-check" iconBg={COLORS.successBg} iconColor={COLORS.successText}
                    label="Présences" value={stats ? stats.present : "…"} sub="Séances suivies" />
                <KpiCard icon="fa-calendar-times" iconBg={COLORS.dangerBg} iconColor={COLORS.dangerText}
                    label="Total absences" value={kpis.total} sub="sur la période" />
                <KpiCard icon="fa-check-circle" iconBg={COLORS.successBg} iconColor={COLORS.successText}
                    label="Justifiées" value={kpis.justified} sub={`${kpis.justifiedPct}% du total`} />
                <KpiCard icon="fa-exclamation-triangle" iconBg={COLORS.warnBg} iconColor={COLORS.warnText}
                    label="Injustifiées" value={kpis.unjustified} sub={`${kpis.unjustifiedPct}% du total`} />
                <KpiCard icon="fa-hourglass-half" iconBg="#eef1fb" iconColor={COLORS.primary}
                    label="Cours restants" value={stats ? stats.remaining : "…"} sub="À venir sur la saison" />
            </div>

            {/* Barre d'actions */}
            <div style={{ ...S.card, display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "14px" }}>
                <Field label="Saison">
                    <select style={S.input} value={seasonId || ""} onChange={e => setSeasonId(parseInt(e.target.value, 10))}>
                        {seasons.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </Field>
                <Field label="Type d'absence">
                    <select style={S.input} value={type} onChange={e => setType(e.target.value)}>
                        <option value="all">Tous</option>
                        <option value="unjustified">Injustifiée</option>
                        <option value="justified">Justifiée</option>
                    </select>
                </Field>
                <Field label="Cours">
                    <select style={S.input} value={courseId} onChange={e => setCourseId(e.target.value)}>
                        <option value="all">Tous</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                </Field>
                <Field label="Recherche" grow>
                    <div style={{ position: "relative" }}>
                        <i className="fas fa-search" style={S.searchIcon} />
                        <input type="text" style={{ ...S.input, paddingLeft: "34px" }}
                            placeholder="Rechercher dans les remarques..."
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </Field>
                <button style={S.exportBtn} onClick={exportCsv}>
                    <i className="fas fa-download" style={{ marginRight: "8px" }} />Exporter
                </button>
            </div>

            {/* Tableau */}
            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                <table style={S.table}>
                    <thead>
                        <tr style={S.theadRow}>
                            <th style={{ ...S.th, cursor: "pointer" }} onClick={() => setSortDesc(d => !d)}>
                                Date <i className={`fas fa-sort${sortDesc ? "-down" : "-up"}`} style={{ color: COLORS.muted }} />
                            </th>
                            <th style={S.th}>Cours</th>
                            <th style={S.th}>Professeur</th>
                            <th style={S.th}>Type d'absence</th>
                            <th style={S.th}>Remarque</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={5} style={S.emptyCell}>Chargement…</td></tr>
                        )}
                        {!loading && pageRows.length === 0 && (
                            <tr><td colSpan={5} style={S.emptyCell}>Aucune absence pour ces critères.</td></tr>
                        )}
                        {!loading && pageRows.map(a => (
                            <tr key={a.id} style={S.tr}>
                                <td style={S.td}>{a.date}</td>
                                <td style={S.td}>{a.activity || "—"}</td>
                                <td style={S.td}>{a.teacher || "—"}</td>
                                <td style={S.td}><TypeBadge justified={a.justified} /></td>
                                <td style={S.td}>
                                    <RemarkInput value={a.remarks} onSave={v => updateRemarks(a.id, v)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {!loading && filtered.length > 0 && (
                    <div style={S.pagination}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: COLORS.muted }}>
                            <span>Lignes par page</span>
                            <select style={{ ...S.input, width: "72px", height: "34px" }}
                                value={pageSize} onChange={e => setPageSize(parseInt(e.target.value, 10))}>
                                {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <PagerBtn disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
                                <i className="fas fa-chevron-left" />
                            </PagerBtn>
                            {Array.from({ length: pageCount }).map((_, i) => (
                                <button key={i} onClick={() => setPage(i)}
                                    style={i === currentPage ? S.pageActive : S.pageBtn}>{i + 1}</button>
                            ))}
                            <PagerBtn disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>
                                <i className="fas fa-chevron-right" />
                            </PagerBtn>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ----------------------------- Sous-composants ----------------------------- */

const Field = ({ label, children, grow }) => (
    <div style={{ flex: grow ? 1 : "0 0 auto", minWidth: grow ? "220px" : "150px" }}>
        <label style={{ display: "block", fontSize: "13px", color: COLORS.muted, marginBottom: "6px" }}>{label}</label>
        {children}
    </div>
);

const KpiCard = ({ icon, iconBg, iconColor, label, value, sub }) => (
    <div style={{ ...S.card, flex: 1, display: "flex", alignItems: "center", gap: "16px", margin: 0 }}>
        <div style={{ ...S.kpiIcon, background: iconBg, color: iconColor }}><i className={`fas ${icon}`} /></div>
        <div>
            <div style={{ color: COLORS.muted, fontSize: "13px" }}>{label}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
            {sub && <div style={{ color: COLORS.muted, fontSize: "12px" }}>{sub}</div>}
        </div>
    </div>
);

const TypeBadge = ({ justified }) => (
    <span style={{
        ...S.badge,
        background: justified ? COLORS.successBg : COLORS.dangerBg,
        color: justified ? COLORS.successText : COLORS.dangerText,
    }}>
        {justified ? "Justifiée" : "Injustifiée"}
    </span>
);

const PagerBtn = ({ disabled, onClick, children }) => (
    <button onClick={onClick} disabled={disabled}
        style={{ ...S.pageBtn, opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer" }}>
        {children}
    </button>
);

// Remarque affichée comme texte, éditable au focus (préserve la fonctionnalité existante).
function RemarkInput({ value, onSave }) {
    const [val, setVal] = useState(value || "");
    useEffect(() => setVal(value || ""), [value]);

    return (
        <input
            className="abs-remark"
            value={val}
            placeholder="Ajouter une remarque…"
            onChange={e => setVal(e.target.value)}
            onBlur={() => onSave(val)}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
            style={S.remarkInput}
        />
    );
}

/* -------------------------------- Helpers -------------------------------- */

function downloadCsv(header, lines, filename) {
    const escape = v => {
        const s = v == null ? "" : String(v);
        return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header, ...lines].map(row => row.map(escape).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

const ScopedStyles = () => (
    <style>{`
        .abs-remark { border: 1px solid transparent; background: transparent; }
        .abs-remark:hover { border-color: ${COLORS.border}; }
        .abs-remark:focus { border-color: ${COLORS.primary}; background: #fff; outline: none; }
    `}</style>
);

/* --------------------------------- Styles --------------------------------- */

const S = {
    card: {
        background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "14px",
        padding: "18px", marginBottom: "18px",
    },
    linkBtn: {
        display: "inline-flex", alignItems: "center", border: `1px solid ${COLORS.border}`,
        background: "#fff", color: COLORS.text, borderRadius: "9px", padding: "8px 14px",
        fontSize: "14px", textDecoration: "none",
    },
    kpiRow: { display: "flex", gap: "18px", marginBottom: "18px" },
    kpiIcon: {
        width: "54px", height: "54px", borderRadius: "12px", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0,
    },
    input: {
        width: "100%", height: "40px", padding: "0 12px", borderRadius: "9px",
        border: `1px solid ${COLORS.border}`, background: "#fff", fontSize: "14px", color: COLORS.text,
    },
    searchIcon: {
        position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: COLORS.muted,
    },
    exportBtn: {
        border: "none", background: "#0f172a", color: "#fff", borderRadius: "9px",
        padding: "0 18px", height: "40px", cursor: "pointer", fontSize: "14px", fontWeight: 600, flexShrink: 0,
    },
    table: { width: "100%", borderCollapse: "collapse" },
    theadRow: { borderBottom: `1px solid ${COLORS.border}` },
    th: { textAlign: "left", padding: "14px 16px", color: COLORS.muted, fontSize: "13px", fontWeight: 600 },
    tr: { borderBottom: `1px solid ${COLORS.border}` },
    td: { padding: "12px 16px", verticalAlign: "middle" },
    emptyCell: { padding: "40px", textAlign: "center", color: COLORS.muted },
    badge: { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" },
    remarkInput: {
        width: "100%", minWidth: "220px", height: "34px", padding: "0 10px",
        borderRadius: "7px", fontSize: "14px", color: COLORS.text,
    },
    pagination: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", borderTop: `1px solid ${COLORS.border}`,
    },
    pageBtn: {
        minWidth: "34px", height: "34px", borderRadius: "8px", border: `1px solid ${COLORS.border}`,
        background: "#fff", color: COLORS.text, cursor: "pointer", fontSize: "13px",
    },
    pageActive: {
        minWidth: "34px", height: "34px", borderRadius: "8px", border: "none",
        background: "#0f172a", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600,
    },
};
