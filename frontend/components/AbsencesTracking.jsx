import React, { useEffect, useMemo, useState } from "react";
import * as api from "../tools/api";

const DAYS_ORDER = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const COLORS = {
    bg: "#f4f5f9",
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
 * Suivi des absences — vue globale des absences des élèves.
 * Regroupement métier : Professeur > Jour > Cours > élèves.
 * Un clic sur "Voir" ouvre un panneau latéral avec le détail de l'élève.
 */
export default function AbsencesTracking({ seasons = [], teachers = [], activities = [] }) {
    const currentSeason = useMemo(
        () => seasons.find(s => s.is_current) || seasons[0],
        [seasons]
    );

    const [seasonId, setSeasonId] = useState(currentSeason ? currentSeason.id : null);
    const [absences, setAbsences] = useState([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        start: "",
        end: "",
        teacherId: "",
        day: "",
        activityRefId: "",
        type: "",
    });

    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [collapsed, setCollapsed] = useState({});

    const season = useMemo(
        () => seasons.find(s => String(s.id) === String(seasonId)),
        [seasons, seasonId]
    );

    // Récupère toutes les absences de la saison ; le filtrage fin est fait côté client.
    useEffect(() => {
        if (!seasonId) return;

        setLoading(true);
        api.get("/absences/data", { season_id: seasonId })
            .then(({ data }) => setAbsences((data && data.absences) || []))
            .finally(() => setLoading(false));
    }, [seasonId]);

    // Initialise la période sur les bornes de la saison.
    useEffect(() => {
        if (season) {
            setFilters(f => ({
                ...f,
                start: (season.start || "").slice(0, 10),
                end: (season.end || "").slice(0, 10),
            }));
        }
    }, [season]);

    const filtered = useMemo(() => {
        return absences.filter(a => {
            if (filters.teacherId && String(a.teacher_id) !== String(filters.teacherId)) return false;
            if (filters.activityRefId && String(a.activity_ref_id) !== String(filters.activityRefId)) return false;
            if (filters.day && a.day !== filters.day) return false;
            if (filters.type === "justified" && !a.justified) return false;
            if (filters.type === "unjustified" && a.justified) return false;
            if (filters.start && a.date_iso < filters.start) return false;
            if (filters.end && a.date_iso > filters.end) return false;
            return true;
        });
    }, [absences, filters, teachers, activities]);

    // KPIs
    const kpis = useMemo(() => {
        const students = new Set(filtered.map(a => a.student.id));
        const unjustified = filtered.filter(a => !a.justified).length;
        const total = filtered.length;
        return {
            total,
            students: students.size,
            enrolled: new Set(absences.map(a => a.student.id)).size,
            unjustified,
            unjustifiedPct: total ? Math.round((unjustified / total) * 100) : 0,
        };
    }, [filtered, absences]);

    // Regroupement Professeur > Jour > Cours > élèves
    const grouped = useMemo(() => buildGroups(filtered), [filtered]);

    const selectedStudent = useMemo(() => {
        if (!selectedStudentId) return null;
        const rows = absences.filter(a => a.student.id === selectedStudentId);
        if (!rows.length) return null;
        return { student: rows[0].student, absences: rows };
    }, [selectedStudentId, absences]);

    const resetFilters = () =>
        setFilters({
            start: season ? (season.start || "").slice(0, 10) : "",
            end: season ? (season.end || "").slice(0, 10) : "",
            teacherId: "",
            day: "",
            activityRefId: "",
            type: "",
        });

    const toggle = key => setCollapsed(c => ({ ...c, [key]: !c[key] }));

    const exportCsv = () => {
        const header = ["Professeur", "Jour", "Cours / activité", "Élève", "N° adhérent", "Date", "Type", "Remarque"];
        const lines = filtered.map(a => [
            a.teacher, a.day, a.activity, a.student.full_name,
            a.student.adherent_number, a.date,
            a.justified ? "Justifiée" : "Injustifiée", a.remarks,
        ]);
        downloadCsv(header, lines, `suivi_absences_${todayStamp()}.csv`);
    };

    return (
        <div style={{ background: COLORS.bg, padding: "24px", color: COLORS.text, fontSize: "14px" }}>
            <ScopedStyles />

            <div style={S.headerRow}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700 }}>Suivi des absences</h1>
                    <div style={{ color: COLORS.muted, marginTop: "4px" }}>Vision globale des absences des élèves</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ color: COLORS.muted, fontSize: "13px" }}>
                        {filters.start && filters.end
                            ? `${frDate(filters.start)} – ${frDate(filters.end)}`
                            : ""}
                    </span>
                    <button style={S.primaryBtn} onClick={exportCsv}>
                        <i className="fas fa-download" style={{ marginRight: "8px" }} />Exporter
                    </button>
                </div>
            </div>

            {/* Filtres */}
            <div style={S.card}>
                <div style={S.filterGrid}>
                    <Field label="Saison">
                        <select style={S.input} value={seasonId || ""} onChange={e => setSeasonId(e.target.value)}>
                            {seasons.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </Field>
                    <Field label="Période — du">
                        <input type="date" style={S.input} value={filters.start}
                            onChange={e => setFilters(f => ({ ...f, start: e.target.value }))} />
                    </Field>
                    <Field label="Période — au">
                        <input type="date" style={S.input} value={filters.end}
                            onChange={e => setFilters(f => ({ ...f, end: e.target.value }))} />
                    </Field>
                    <Field label="Professeur">
                        <select style={S.input} value={filters.teacherId}
                            onChange={e => setFilters(f => ({ ...f, teacherId: e.target.value }))}>
                            <option value="">Tous</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Jour">
                        <select style={S.input} value={filters.day}
                            onChange={e => setFilters(f => ({ ...f, day: e.target.value }))}>
                            <option value="">Tous</option>
                            {DAYS_ORDER.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </Field>
                    <Field label="Cours / activité">
                        <select style={S.input} value={filters.activityRefId}
                            onChange={e => setFilters(f => ({ ...f, activityRefId: e.target.value }))}>
                            <option value="">Tous</option>
                            {activities.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                        </select>
                    </Field>
                    <Field label="Type d'absence">
                        <select style={S.input} value={filters.type}
                            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                            <option value="">Tous</option>
                            <option value="unjustified">Injustifiée</option>
                            <option value="justified">Justifiée</option>
                        </select>
                    </Field>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                        <button style={S.ghostBtn} onClick={resetFilters}>
                            <i className="fas fa-redo" style={{ marginRight: "8px" }} />Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div style={S.kpiRow}>
                <KpiCard icon="fa-calendar-times" iconBg={COLORS.dangerBg} iconColor={COLORS.dangerText}
                    label="Absences totales" value={kpis.total} sub="Sur la période" />
                <KpiCard icon="fa-users" iconBg="#eef1fb" iconColor={COLORS.primary}
                    label="Élèves concernés" value={kpis.students}
                    sub={kpis.enrolled ? `${Math.round((kpis.students / kpis.enrolled) * 100)}% des inscrits` : ""} />
                <KpiCard icon="fa-exclamation-triangle" iconBg={COLORS.warnBg} iconColor={COLORS.warnText}
                    label="Injustifiées à traiter" value={kpis.unjustified}
                    sub={`${kpis.unjustifiedPct}% du total`} />
            </div>

            <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                {/* Tableau groupé */}
                <div style={{ ...S.card, flex: 1, padding: 0, overflow: "hidden" }}>
                    <div style={S.tableHead}>
                        <div style={{ flex: 1 }}>Élève</div>
                        <div style={S.colNb}>Nb absences</div>
                        <div style={S.colDate}>Dernière absence</div>
                        <div style={S.colType}>Type</div>
                        <div style={S.colRemark}>Remarque</div>
                        <div style={S.colAction}>Action</div>
                    </div>

                    {loading && <div style={S.emptyState}>Chargement…</div>}
                    {!loading && grouped.length === 0 && (
                        <div style={S.emptyState}>Aucune absence pour ces critères.</div>
                    )}

                    {!loading && grouped.map(teacher => {
                        const tKey = `t:${teacher.key}`;
                        const tCollapsed = collapsed[tKey];
                        return (
                            <div key={tKey}>
                                <Row level={0} onClick={() => toggle(tKey)} collapsed={tCollapsed}
                                    icon="fa-chalkboard-teacher"
                                    label={`${teacher.name} — ${teacher.count} absence${plural(teacher.count)}`} />
                                {!tCollapsed && teacher.days.map(day => {
                                    const dKey = `${tKey}|d:${day.key}`;
                                    const dCollapsed = collapsed[dKey];
                                    return (
                                        <div key={dKey}>
                                            <Row level={1} onClick={() => toggle(dKey)} collapsed={dCollapsed}
                                                icon="fa-calendar-day"
                                                label={`${day.name} — ${day.count} absence${plural(day.count)}`} />
                                            {!dCollapsed && day.courses.map(course => {
                                                const cKey = `${dKey}|c:${course.key}`;
                                                const cCollapsed = collapsed[cKey];
                                                return (
                                                    <div key={cKey}>
                                                        <Row level={2} onClick={() => toggle(cKey)} collapsed={cCollapsed}
                                                            icon="fa-guitar"
                                                            label={`${course.name} — ${course.count} absence${plural(course.count)}`} />
                                                        {!cCollapsed && course.students.map(st => (
                                                            <StudentRow key={st.student.id} row={st}
                                                                active={selectedStudentId === st.student.id}
                                                                onView={() => setSelectedStudentId(st.student.id)} />
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Panneau latéral */}
                {selectedStudent && (
                    <StudentPanel data={selectedStudent} onClose={() => setSelectedStudentId(null)} />
                )}
            </div>
        </div>
    );
}

/* ----------------------------- Sous-composants ----------------------------- */

const Field = ({ label, children }) => (
    <div>
        <label style={{ display: "block", fontSize: "13px", color: COLORS.muted, marginBottom: "6px" }}>{label}</label>
        {children}
    </div>
);

const KpiCard = ({ icon, iconBg, iconColor, label, value, sub }) => (
    <div style={{ ...S.card, flex: 1, display: "flex", alignItems: "center", gap: "16px", margin: 0 }}>
        <div style={{ ...S.kpiIcon, background: iconBg, color: iconColor }}>
            <i className={`fas ${icon}`} />
        </div>
        <div>
            <div style={{ color: COLORS.muted, fontSize: "13px" }}>{label}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
            {sub && <div style={{ color: COLORS.muted, fontSize: "12px" }}>{sub}</div>}
        </div>
    </div>
);

const Row = ({ level, label, icon, onClick, collapsed }) => (
    <div className="abs-row" style={{ ...S.groupRow, paddingLeft: `${16 + level * 22}px` }} onClick={onClick}>
        <i className={`fas ${collapsed ? "fa-chevron-right" : "fa-chevron-down"}`}
            style={{ fontSize: "11px", color: COLORS.muted, width: "14px" }} />
        <i className={`fas ${icon}`} style={{ color: COLORS.muted }} />
        <span style={{ fontWeight: level === 0 ? 700 : 600 }}>{label}</span>
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

const StudentRow = ({ row, onView, active }) => (
    <div className="abs-student-row" style={{ ...S.studentRow, background: active ? "#f0f3fd" : "transparent" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", paddingLeft: "82px" }}>
            <Avatar student={row.student} />
            <span style={{ fontWeight: 600 }}>{row.student.full_name}</span>
        </div>
        <div style={S.colNb}>{row.count}</div>
        <div style={S.colDate}>{row.lastDate}</div>
        <div style={S.colType}><TypeBadge justified={row.lastJustified} /></div>
        <div style={{ ...S.colRemark, color: COLORS.muted }}>{row.lastRemark || "—"}</div>
        <div style={S.colAction}>
            <button style={S.viewBtn} onClick={onView}>
                <i className="far fa-eye" style={{ marginRight: "6px" }} />Voir
            </button>
        </div>
    </div>
);

const Avatar = ({ student, size = 30 }) => {
    const initials = `${(student.first_name || " ")[0]}${(student.last_name || " ")[0]}`.toUpperCase();
    const style = {
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#dfe3f3", color: COLORS.primary, fontSize: size / 2.6, fontWeight: 700,
        objectFit: "cover",
    };
    if (student.avatar_url) return <img src={student.avatar_url} alt={initials} style={style} />;
    return <div style={style}>{initials}</div>;
};

function StudentPanel({ data, onClose }) {
    const { student, absences } = data;
    const total = absences.length;
    const justified = absences.filter(a => a.justified).length;
    const unjustified = total - justified;
    const pct = n => (total ? Math.round((n / total) * 100) : 0);

    const sorted = [...absences].sort((a, b) => (a.date_iso < b.date_iso ? 1 : -1));

    return (
        <div style={S.panel}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button style={S.closeBtn} onClick={onClose}><i className="fas fa-times" /></button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
                <Avatar student={student} size={56} />
                <div>
                    <div style={{ fontSize: "18px", fontWeight: 700 }}>{student.full_name}</div>
                    {student.adherent_number != null && (
                        <div style={{ color: COLORS.muted, fontSize: "13px" }}>Adhérent n°{student.adherent_number}</div>
                    )}
                    <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
                        <span style={{ ...S.pill, background: "#eef1fb", color: COLORS.primary }}>Élève</span>
                        {student.adherent_number != null && (
                            <span style={{ ...S.pill, background: "#f3e9fb", color: "#8a3fb5" }}>Adhérent</span>
                        )}
                    </div>
                </div>
            </div>

            <div style={S.panelStats}>
                <PanelStat label="Total absences" value={total} />
                <PanelStat label="Injustifiées" value={unjustified} color={COLORS.dangerText} sub={`${pct(unjustified)}%`} />
                <PanelStat label="Justifiées" value={justified} color={COLORS.successText} sub={`${pct(justified)}%`} />
            </div>

            <div style={{ fontWeight: 700, margin: "18px 0 10px" }}>Dernières absences</div>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {sorted.slice(0, 8).map(a => (
                    <div key={a.id} style={S.panelAbsence}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <div style={{ fontSize: "13px", color: COLORS.muted }}>{a.date}</div>
                                <div style={{ fontWeight: 600 }}>{a.activity}</div>
                            </div>
                            <TypeBadge justified={a.justified} />
                        </div>
                        {a.remarks && (
                            <div style={{ color: COLORS.muted, fontSize: "13px", marginTop: "4px" }}>{a.remarks}</div>
                        )}
                    </div>
                ))}
            </div>

            <a href={`/users/${student.id}`} style={{ ...S.ghostBtn, display: "block", textAlign: "center", marginTop: "16px", textDecoration: "none" }}>
                <i className="far fa-eye" style={{ marginRight: "8px" }} />Voir la fiche élève
            </a>
            <button style={{ ...S.darkBtn, width: "100%", marginTop: "10px" }}
                onClick={() => {
                    const header = ["Date", "Cours / activité", "Professeur", "Type", "Remarque"];
                    const lines = sorted.map(a => [a.date, a.activity, a.teacher, a.justified ? "Justifiée" : "Injustifiée", a.remarks]);
                    downloadCsv(header, lines, `absences_${student.last_name}_${student.first_name}.csv`);
                }}>
                <i className="fas fa-download" style={{ marginRight: "8px" }} />Exporter l'historique
            </button>
        </div>
    );
}

const PanelStat = ({ label, value, color, sub }) => (
    <div style={S.panelStat}>
        <div style={{ color: COLORS.muted, fontSize: "11px" }}>{label}</div>
        <div style={{ fontSize: "22px", fontWeight: 700, color: color || COLORS.text }}>{value}</div>
        {sub && <div style={{ color: COLORS.muted, fontSize: "11px" }}>{sub}</div>}
    </div>
);

/* -------------------------------- Helpers -------------------------------- */

function buildGroups(rows) {
    const teachers = {};
    rows.forEach(a => {
        const tk = a.teacher || "—";
        const t = (teachers[tk] = teachers[tk] || { key: tk, name: tk, count: 0, days: {} });
        t.count++;
        const dk = a.day || "—";
        const d = (t.days[dk] = t.days[dk] || { key: dk, name: dk, count: 0, courses: {} });
        d.count++;
        const ck = a.activity || "—";
        const c = (d.courses[ck] = d.courses[ck] || { key: ck, name: ck, count: 0, students: {} });
        c.count++;
        const sid = a.student.id;
        const s = (c.students[sid] = c.students[sid] || { student: a.student, count: 0, rows: [] });
        s.count++;
        s.rows.push(a);
    });

    const dayIndex = d => {
        const i = DAYS_ORDER.indexOf(d.name);
        return i === -1 ? 99 : i;
    };

    return Object.values(teachers)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(t => ({
            ...t,
            days: Object.values(t.days)
                .sort((a, b) => dayIndex(a) - dayIndex(b))
                .map(d => ({
                    ...d,
                    courses: Object.values(d.courses)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(c => ({
                            ...c,
                            students: Object.values(c.students)
                                .map(s => {
                                    const last = [...s.rows].sort((x, y) => (x.date_iso < y.date_iso ? 1 : -1))[0];
                                    return {
                                        student: s.student,
                                        count: s.count,
                                        lastDate: last.date,
                                        lastJustified: last.justified,
                                        lastRemark: last.remarks,
                                    };
                                })
                                .sort((a, b) => b.count - a.count),
                        })),
                })),
        }));
}

const plural = n => (n > 1 ? "s" : "");

function frDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

function todayStamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

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
        .abs-row { cursor: pointer; user-select: none; }
        .abs-row:hover { background: #f7f8fc; }
        .abs-student-row:hover { background: #f7f8fc !important; }
    `}</style>
);

/* --------------------------------- Styles --------------------------------- */

const S = {
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
    card: {
        background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "14px",
        padding: "20px", marginBottom: "20px",
    },
    filterGrid: {
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px",
    },
    input: {
        width: "100%", height: "40px", padding: "0 12px", borderRadius: "9px",
        border: `1px solid ${COLORS.border}`, background: "#fff", fontSize: "14px", color: COLORS.text,
    },
    kpiRow: { display: "flex", gap: "20px", marginBottom: "20px" },
    kpiIcon: {
        width: "54px", height: "54px", borderRadius: "12px", display: "flex",
        alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0,
    },
    tableHead: {
        display: "flex", alignItems: "center", padding: "14px 16px",
        borderBottom: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: "13px", fontWeight: 600,
    },
    groupRow: {
        display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
        borderBottom: `1px solid ${COLORS.border}`,
    },
    studentRow: {
        display: "flex", alignItems: "center", padding: "10px 16px",
        borderBottom: `1px solid ${COLORS.border}`,
    },
    colNb: { width: "110px", textAlign: "left" },
    colDate: { width: "140px" },
    colType: { width: "120px" },
    colRemark: { width: "220px", fontSize: "13px" },
    colAction: { width: "90px", textAlign: "right" },
    badge: { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap" },
    viewBtn: {
        border: `1px solid ${COLORS.border}`, background: "#fff", borderRadius: "8px",
        padding: "5px 12px", cursor: "pointer", fontSize: "13px", color: COLORS.text,
    },
    primaryBtn: {
        border: "none", background: COLORS.primary, color: "#fff", borderRadius: "9px",
        padding: "10px 18px", cursor: "pointer", fontSize: "14px", fontWeight: 600,
    },
    ghostBtn: {
        border: `1px solid ${COLORS.border}`, background: "#fff", color: COLORS.text, borderRadius: "9px",
        padding: "9px 16px", cursor: "pointer", fontSize: "14px",
    },
    darkBtn: {
        border: "none", background: "#0f172a", color: "#fff", borderRadius: "9px",
        padding: "11px 16px", cursor: "pointer", fontSize: "14px", fontWeight: 600,
    },
    emptyState: { padding: "40px", textAlign: "center", color: COLORS.muted },
    panel: {
        width: "360px", flexShrink: 0, background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: "14px", padding: "18px", position: "sticky", top: "20px",
    },
    closeBtn: {
        border: "none", background: "transparent", cursor: "pointer", color: COLORS.muted, fontSize: "18px",
    },
    panelStats: { display: "flex", gap: "10px" },
    panelStat: {
        flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "10px", textAlign: "center",
    },
    pill: { padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
    panelAbsence: { border: `1px solid ${COLORS.border}`, borderRadius: "10px", padding: "10px 12px", marginBottom: "8px" },
};
