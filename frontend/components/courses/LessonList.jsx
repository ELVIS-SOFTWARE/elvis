import React from "react";
import ReactTable from "react-table";
import Select from "react-select";
import { toast } from "react-toastify";
import moment from "moment";
import "moment/locale/fr";
import Modal from "react-modal";
import MessageModal from "../generalPayments/MessageModal";
import ListPreferences from "../common/ListPreferences";
import DeleteCourseModal from "./DeleteCourseModal";
import * as api from "../../tools/api";
import swal from "sweetalert2";

moment.locale("fr");

import * as TimeIntervalHelpers from "../planning/TimeIntervalHelpers";
import {
    DownloadButton,
    optionMapper,
    ISO_DATE_FORMAT,
    csrfToken,
    findAndGet,
} from "../utils";
import { formatActivityHeadcount } from "../../tools/format";
import UserWithInfos from "../common/UserWithInfos";
import _ from "lodash";
import { averageAgeDisplay } from "../planning/TimeIntervalHelpers";

const FILTER_STORAGE_KEY = "lessons_list_filters";
const PREFERENCES_STORAGE_KEY = "lessons_list_preferences";

const defaultTableProps = () => ({
    page: 0,
    pageSize: 20,
    sorted: [],
    filtered: [
        { id: "reference_date", value: moment().format(ISO_DATE_FORMAT) },
    ],
    resized: [],
    expanded: {},
});

const NB_DISPLAYED_RECIPIENTS = 3;
const MESSAGE_MODAL_ID = "messagesModal";


const filterUserWithDate = date => u => filterUser(u, date);

const filterUser = (u, date) => {
    if (!u.stopped_at && !u.begin_at) {
        return true;
    }

    let res = true;

    const lessonDate = new Date(date);
    lessonDate.setHours(0, 0, 0, 0);

    if (u.stopped_at) {
        const stopDate = new Date(u.stopped_at);
        stopDate.setHours(0, 0, 0, 0);

        res = res && lessonDate < stopDate;
    }

    if (u.begin_at) {
        const beginDate = new Date(u.begin_at);
        beginDate.setHours(0, 0, 0, 0);

        res = res && beginDate <= lessonDate;
    }

    return res;
};

const debounce = _.debounce((f, ...args) => {
    return f(args);
}, 400);

function fetchInstancesList(filter, format = "json") {
    return fetch(`/activities.${format}`, {
        method: "POST",
        headers: {
            "X-Csrf-Token": csrfToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sorted: filter.sorted[0],
            filtered: filter.filtered,
            page: filter.page,
            page_size: filter.pageSize,
        }),
    })
        .then(res => {
            if (!res.ok) throw new Error();

            switch (format) {
                case "csv":
                    return res.blob();
                case "json":
                default:
                    return res.json();
            }
        })
        .catch((error) => {
            console.error(error);
            toast.error("Erreur lors du rapatriement des données", {
                autoClose: 3000,
            });
        });
}

function formatOccupationRate(studentCount, limit, options) {
    const rate = studentCount / limit;

    let styles = {
        color: "#000",
    };

    if (rate >= 1)
        styles = {
            ...styles,
            color: "#006FB0",
            fontWeight: "bold",
        };

    if (options.length)
        styles = {
            ...styles,
            color: "#1C3041",
            fontWeight: "bold",
        };

    return <span style={styles}>{`${studentCount}/${limit}`}</span>;
}

export default class LessonList extends React.Component {
    constructor(props) {
        super(props);

        const localStorageValue = localStorage.getItem(FILTER_STORAGE_KEY);
        const filter =
            localStorageValue != null
                ? JSON.parse(localStorageValue)
                : defaultTableProps();

        const localStoragePrefs = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        const listPreferences = localStoragePrefs && JSON.parse(localStoragePrefs);

        this.state = {
            data: [],
            pages: null,
            targets: [],
            total: 0,
            filter,
            loading: false,
            listPreferences,
            message: {
                title: "Informations cours",
                content: "",
                isEmail: true,
                isSMS: false,
            },
            isModalOpen: false,
            activity: undefined,
            currentAppsSeason: null,
            filterApplied: false,
        };

        this.toggleModal = this.toggleModal.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }


    componentDidMount() {
        this.fetchData(this.state.filter);

        api.get('/seasons?current=true')
            .then(response => {
                const season = response.data;
                this.setState(
                    { currentAppsSeason: season },
                    () => {
                        const newFilter = {
                            ...this.state.filter,
                            season_id: season.id || ""
                        };
                        this.fetchData(newFilter);
                    }
                );
            })
            .catch(error => console.error("Erreur :", error));
    }

    componentDidUpdate() {
        localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify(this.state.filter),
        );
    }

    toggleModal() {
        this.setState({ isModalOpen: !this.state.isModalOpen });
    }

    onSubmit(values) {
        const activity = this.state.activity;

        if (values.repetition === "all") {
            api.set()
                .success(() => {
                    swal.fire({
                        title: "Succès",
                        type: "success",
                        allowOutsideClick: false,
                        text: "Le cours a été supprimé",
                        width: "400px",
                        confirmButtonText: "Ok",
                    }).then(res => {
                        if (res.value) {
                            window.location.href = `/activities?auth_token=${csrfToken}`;
                        }
                    });
                })
                .error(errorMsg => {
                    console.log("error deleting course : ", errorMsg);
                    swal({
                        type: "error",
                        title: "Une erreur est survenue",
                    });
                })
                .del(`/activity/${activity.id}`);
        } else {
            api.set()
                .success(() => {
                    swal.fire({
                        title: "Succès",
                        type: "success",
                        allowOutsideClick: false,
                        text: "Les instances sélectionnées ont été supprimées",
                        width: "400px",
                        confirmButtonText: "Ok",
                    }).then(res => {
                        if (res.value) {
                            window.location.href = `/activities?auth_token=${csrfToken}`;
                        }
                    });
                })
                .error(errorMsg => {
                    console.log("error deleting course : ", errorMsg);
                    swal({
                        type: "error",
                        title: "Une erreur est survenue",
                    });
                })
                .del(`/activity_instances?instance_ids=${values.instanceIds}&time_interval_ids=${values.timeIntervalIds}&activity_id=${activity.id}`);
        }
    }
    bulkDelete() {
        swal({
            title: "Confirmation",
            text: "Voulez-vous supprimer tous les cours sélectionnés ? Cette action est irréversible.",
            type: "warning",
            showCancelButton: true,
            confirmButtonText: "Oui, supprimer",
            cancelButtonText: "Annuler",
        }).then(r => {
            if (r.value) {
                fetch("/lessons/bulkdelete", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken,
                    },
                    body: JSON.stringify({
                        targets: this.state.targets,
                    }),
                })
                    .then(response => response.json())
                    .then((data) => {
                        if (data.success) {
                            this.setState({
                                data: this.state.data.filter(
                                    d => !this.state.targets.includes(d.id)
                                ),
                                targets: [],
                            });
                            swal({
                                title: "Succès",
                                text: "Les cours sélectionnés ont été supprimés.",
                                type: "success",
                            });
                        } else {
                            swal({
                                type: "error",
                                title: "Échec de la suppression",
                                text: "Une erreur s'est produite côté serveur.",
                            });
                        }
                    })
                    .catch(err => {
                        console.error("Erreur lors de la suppression :", err);
                        swal({
                            type: "error",
                            title: "Erreur",
                            text: "La suppression a échoué. Veuillez réessayer.",
                        });
                    });
            }
        });
    }


    fetchData(filter) {
        const hasSeasonChanged =
            findAndGet(
                this.state.filter.filtered,
                f => f.id === "season_id",
                "value",
            ) !=
            findAndGet(filter.filtered, f => f.id === "season_id", "value");

        if (hasSeasonChanged) {
            const seasonId = findAndGet(
                filter.filtered,
                f => f.id === "season_id",
                "value",
            );
            const season =
                seasonId && this.props.seasons.find(s => s.id == seasonId);
            const refDateFilter = _.find(
                filter.filtered,
                f => f.id === "reference_date",
            );

            if (refDateFilter && _.get(season, "is_next"))
                refDateFilter.value = moment(season.start)
                    .add(1, "week")
                    .format(ISO_DATE_FORMAT);
            else refDateFilter.value = moment().format(ISO_DATE_FORMAT);
        }

        this.setState({
            loading: true,
            filter,
        });

        debounce(() =>
            fetchInstancesList(filter).then(({ data, pages, total }) =>
                this.setState({
                    loading: false,
                    data,
                    pages,
                    total,
                }),
            ),
        );
    }

    downloadExport() {
        fetchInstancesList(this.state.filter, "csv").then(file => {
            const download = document.createElement("a");
            download.download = `${moment().format("DD_MM_YYYY-HH_mm_ss")}.csv`;
            download.href = URL.createObjectURL(file);
            document.body.appendChild(download);
            download.click();
            document.body.removeChild(download);
        });
    }

    async downloadStudentsList() {
        var activityIds = [];
        if (this.state.targets === "all") {
            const filter = { ...this.state.filter };
            delete filter.page;
            delete filter.page_size;
            delete filter.pageSize;

            const res = await fetchInstancesList(filter, "json");
            activityIds = res.data.map(item => item.id);
        } else {
            activityIds = this.state.targets;
        }

        if (activityIds.length === 0) {
            swal({
                type: "error",
                title: "Aucun cours sélectionné",
                text: "Veuillez sélectionner au moins un cours pour télécharger la liste des élèves",
            });
        } else {
            const download = document.createElement("a");
            //download.download = `liste_élèves`;
            let activityIdsString = activityIds.map(id => `activity_ids[]=${id}`).join("&");
            download.href = `/students.pdf?${activityIdsString}`;
            document.body.appendChild(download);
            download.click();
            document.body.removeChild(download);
        }
    }

    handleChangeReferenceDate(value) {
        const filter = { ...this.state.filter };

        const indexFiltered = _.keyBy(filter.filtered, "id");

        indexFiltered.reference_date = { id: "reference_date", value };

        filter.filtered = Object.values(indexFiltered);

        this.fetchData(filter);
    }

    updateTarget(id, checked) {
        if (checked) {
            //add target to bulk targets list
            this.setState({
                targets: [...this.state.targets, id],
            });
        } else {
            if (this.state.targets === "all")
                this.setState({
                    targets: this.state.data
                        .map(d => d.id)
                        .filter(d => d !== id),
                });
            else
                this.setState({
                    targets: this.state.targets.filter(r => r !== id),
                });
        }
    }

    resetFilters() {
        localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify(defaultTableProps()),
        );
        this.setState({ filter: defaultTableProps() }, () => {
            this.fetchData(this.state.filter);
        });
    }

    renderTargetsAlert() {
        const count =
            (this.state.targets === "all" && this.state.total) ||
            this.state.targets.length;

        return (
            <div className="alert alert-info m-t-sm" style={{ width: "100%" }}>
                <div className="flex flex-space-between-justified flex-center-aligned">
                    <div id="targets-infos">
                        Vous avez sélectionné {count} cours{" "}
                        {this.state.targets.length === this.state.data.length &&
                        Math.max(
                            this.state.total - this.state.targets.length,
                            0,
                        ) ? (
                            <button
                                onClick={() =>
                                    this.setState({ targets: "all" })
                                }
                                className="btn btn-sm btn-info m-l-sm"
                            >
                                Sélectionner les{" "}
                                {this.state.total - this.state.targets.length}{" "}
                                restants
                            </button>
                        ) : null}
                    </div>
                    <div id="targets-actions">
                        <button
                            className="btn btn-sm btn-primary m-r"
                            onClick={() => this.downloadStudentsList()}
                        >
                            Télécharger la liste des élèves
                        </button>
                        <button
                            className="btn btn-sm btn-primary m-r"
                            disabled={this.state.targets === "all"}
                            data-toggle="modal"
                            data-target={`#${MESSAGE_MODAL_ID}`}
                        >
                            Envoyer un message
                        </button>
                        <button
                            className="btn btn-sm btn-danger m-r"
                            onClick={() => this.bulkDelete()}
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    sendReminderMail(referenceDate = undefined) {
        const to = _.chain(this.state.data)
            .filter(({ id }) => this.state.targets.includes(id))
            .map(d => d.users)
            .flatten()
            .filter(
                u =>
                    referenceDate == undefined ||
                    (u.begin_at <= referenceDate &&
                        (u.stopped_at == undefined ||
                            u.stopped_at > referenceDate)),
            )
            .compact()
            .map(u => u.id)
            .uniq()
            .value();

        swal({
            title: "Confirmation d'envoi",
            text: "Êtes-vous sûr ?",
            type: "question",
            showCancelButton: true,
        })
            .then(v => {
                if (v.value) {
                    return fetch("/messages/create", {
                        method: "POST",
                        headers: {
                            "X-Csrf-Token": csrfToken,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            message: this.state.message,
                            to,
                        }),
                    });
                }
            })
            .then(res => {
                if (res) {
                    if (res.ok)
                        swal({
                            title: "Succès",
                            text: "Message envoyé",
                            type: "success",
                        });
                    else
                        throw new Error(
                            `Erreur ${res.status} : ${res.statusText}`,
                        );
                }
            })
            .catch(reason =>
                swal({
                    title: "Erreur",
                    text: reason,
                    type: "error",
                }),
            );
    }

    handleUpdateListPreferences(prefs) {
        this.setState(
            {
                listPreferences: prefs,
            },
            () => localStorage.setItem(
                PREFERENCES_STORAGE_KEY,
                JSON.stringify(prefs),
            ),
        );
    }

    render() {
        moment.locale("fr");

        const activity = this.state.activity;

        const refsOptions = _.sortBy(this.props.activityRefs, r => r.label).map(
            optionMapper(),
        );

        const teachersOptions = _.sortBy(
            this.props.teachers,
            t => t.last_name,
        ).map(optionMapper({ label: t => `${t.last_name} ${t.first_name}` }));

        const seasonsOptions = _.sortBy(this.props.seasons, s => s.label).map(
            optionMapper(),
        );

        const roomsOptions = _.sortBy(this.props.rooms, r => r.label).map(
            optionMapper(),
        );

        const locationsOptions = _.sortBy(
            this.props.locations,
            l => l.label,
        ).map(optionMapper());

        const now = moment();

        const daysOptions = [1, 2, 3, 4, 5, 6, 0].map(i => {
            const day = now.day(i);
            return (
                <option key={i} value={i}>
                    {_.capitalize(day.format("dddd"))}
                </option>
            );
        });

        const referenceDate =
            findAndGet(
                this.state.filter.filtered,
                f => f.id === "reference_date",
                "value",
            ) || moment().format(ISO_DATE_FORMAT);

        const totalRecipients = _.chain(this.state.data)
            .filter(
                d =>
                    this.state.targets === "all" ||
                    this.state.targets.includes(d.id),
            )
            .map(d => _.get(d, "users"))
            .flatten()
            .filter(
                u =>
                    referenceDate == undefined ||
                    (u.begin_at <= referenceDate &&
                        (u.stopped_at == undefined ||
                            u.stopped_at > referenceDate)),
            )
            .compact()
            .uniqBy(u => u.id)
            .value();

        let recipientsToDisplay = totalRecipients.slice(
            0,
            NB_DISPLAYED_RECIPIENTS,
        );

        let recipients = recipientsToDisplay
            .map(u => `${u.first_name} ${u.last_name}`)
            .join(", ");

        const restCount = Math.max(
            0,
            this.state.targets === "all"
                ? this.state.total - NB_DISPLAYED_RECIPIENTS
                : totalRecipients.length - NB_DISPLAYED_RECIPIENTS,
        );
        if (restCount) recipients += `, et ${restCount} autres`;

        const tableColumns = [
            {
                Header: "",
                id: "selection",
                width: 25,
                sortable: false,
                accessor: r => this.state.targets.includes(r.id),
                Filter: () => (
                    <input
                        type="checkbox"
                        checked={
                            this.state.targets === "all" ||
                            this.state.targets.length === this.state.data.length
                        }
                        onChange={e =>
                            e.target.checked
                                ? this.setState({
                                    targets: this.state.data.map(r => r.id),
                                })
                                : this.setState({ targets: [] })
                        }
                    />
                ),
                Cell: d => (
                    <input
                        type="checkbox"
                        checked={this.state.targets === "all" || d.value}
                        onChange={e =>
                            this.updateTarget(d.original.id, e.target.checked)
                        }
                    />
                ),
            },
            {
                Header: "Jour",
                id: "day",
                maxWidth: 110,
                accessor: d => d.time_interval,
                Cell: c =>
                    c.value ? moment(c.value.start).format("dddd") : "?",
                Filter: ({ filter, onChange }) => (
                    <select
                        value={(filter && filter.value) || ""}
                        onChange={e => onChange(e.target.value)}
                    >
                        <option value="" />
                        {daysOptions}
                    </select>
                ),
            },
            {
                Header: "Horaires",
                id: "time_interval",
                sortable: false,
                minWidth: 140,
                accessor: d => d.time_interval,
                Filter: ({ filter, onChange }) => {
                    filter = (filter && filter.value) || {};
                    const start = filter.start || "";
                    const end = filter.end || "";

                    return (
                        <div className="flex flex-space-around-justified">
                            <input
                                type="time"
                                defaultValue={start}
                                onChange={e =>
                                    onChange({
                                        ...filter,
                                        start: e.target.value,
                                    })
                                }
                            />
                            <input
                                type="time"
                                defaultValue={end}
                                onChange={e =>
                                    onChange({
                                        ...filter,
                                        end: e.target.value,
                                    })
                                }
                            />
                        </div>
                    );
                },
                Cell: c => {
                    if (c.value) {
                        return `${moment(c.value.start).format(
                            "HH:mm",
                        )} ➝ ${moment(c.value.end).format("HH:mm")}`;
                    } else {
                        return "?";
                    }
                },
            },
            {
                Header: "Groupe",
                id: "group_name",
                maxWidth: 60,
                accessor: d => d.group_name,
                Cell: c => <strong>{c.value}</strong>,
            },
            {
                Header: "Activité",
                id: "activity_ref_id",
                maxWidth: 250,
                accessor: d => d.activity_ref_id,
                Cell: c => {
                    return (
                        <span>
                            {
                                this.props.activityRefs.find(
                                    r => r.id === c.value,
                                ).label
                            }
                        </span>
                    );
                },
                Filter: ({ filter, onChange }) => (
                    <select
                        onChange={e => onChange(e.target.value)}
                        value={filter ? filter.value : ""}
                    >
                        <option value="" />
                        {refsOptions}
                    </select>
                ),
            },
            {
                Header: "Professeur",
                id: "teacher_id",
                maxWidth: 200,
                accessor: d => d.teacher,
                Cell: c => `${c.value.first_name} ${c.value.last_name}`,
                Filter: ({ filter, onChange }) => (
                    <select
                        onChange={e => onChange(e.target.value)}
                        value={filter ? filter.value : ""}
                    >
                        <option value="" />
                        {teachersOptions}
                    </select>
                ),
            },
            {
                Header: "Salle",
                id: "room",
                maxWidth: 125,
                accessor: a => {
                    // filtre les salles en fonction de celle de la premiere instance trouvée. Ne devrais pas contenir plus d'une salle
                    const rooms = this.props.rooms.filter(
                        r => r.id === (a.activity_instance || {}).room_id,
                    );

                    // affiche le nom de la salle de la première instance ou le nom de la salle enregistré dans l'activité sinon. (pas la bonne dans certains cas)
                    return rooms.length > 0 ? rooms[0].label : a.room.label;
                },

                Filter: ({ filter, onChange }) => (
                    <select
                        style={{ maxWidth: "115px" }}
                        onChange={e => onChange(e.target.value)}
                        value={filter ? filter.value : ""}
                    >
                        <option value="" />
                        {roomsOptions}
                    </select>
                ),
            },
            {
                Header: "Emplacement",
                id: "location",
                maxWidth: 125,
                accessor: a => a.location.label,
                Filter: ({ filter, onChange }) => (
                    <select
                        style={{ maxWidth: "115px" }}
                        onChange={e => onChange(e.target.value)}
                        value={filter ? filter.value : ""}
                    >
                        <option value="" />
                        {locationsOptions}
                    </select>
                ),
            },
            {
                Header: "Occupation",
                id: "occupation",
                maxWidth: 110,
                Cell: c => formatActivityHeadcount(c.original, referenceDate),
                Filter: ({ filter, onChange }) => {
                    const options = [
                        { value: null, text: "Tous", icon: "Ω" },
                        {
                            value: "EMPTY",
                            text: "Vide",
                            icon: "fas fa-circle",
                            faIcon: true,
                        },
                        {
                            value: "NOR_EMPTY_NOR_FULL",
                            text: "Non vide",
                            icon: "fas fa-adjust",
                            faIcon: true,
                        },
                        {
                            value: "NOT_FULL",
                            text: "Non plein",
                            icon: "fas fa-adjust fa-flip-horizontal",
                            faIcon: true,
                        },
                        {
                            value: "FULL",
                            text: "Plein",
                            icon: "fas fa-circle",
                            faIcon: true,
                            color: "#d63031",
                        }
                    ];

                    const value = options.find(
                        o => o.value == (filter && filter.value),
                    );

                    return (
                        <Select
                            options={options}
                            defaultValue={options[0]}
                            value={value}
                            onChange={v => onChange(v.value)}
                            isSearchable={false}
                            isMulti={false}
                            getOptionLabel={({ text, icon, faIcon }) => (
                                <React.Fragment>
                                    <b>
                                        {faIcon ? (
                                            <i className={icon + " m-r-xs"} />
                                        ) : (
                                            icon
                                        )}
                                    </b>{" "}
                                    {text}
                                </React.Fragment>
                            )}
                            styles={{
                                option: (styles, { data }) => {
                                    return {
                                        ...styles,
                                        color: data.color || "inherit",
                                    };
                                },
                                singleValue: (styles, { data }) => ({
                                    ...styles,
                                    color: data.color || "inherit",
                                }),
                                dropdownIndicator: styles => ({
                                    ...styles,
                                    display: "none",
                                }),
                                indicatorSeparator: styles => ({
                                    ...styles,
                                    display: "none",
                                }),
                            }}
                        />
                    );
                },
            },
            {
                Header: "Âge",
                id: "average_age",
                maxWidth: 50,
                accessor: d => {
                    return TimeIntervalHelpers.averageAge(d.users);
                },
                Cell: c => TimeIntervalHelpers.averageAgeDisplay(c.value),
            },
            {
                Header: "Saison",
                maxWidth: 150,
                id: "season_id",
                accessor: d => d.time_interval,
                Cell: c => {
                    const season = TimeIntervalHelpers.getSeasonFromDate(
                        c.value && c.value.start,
                        this.props.seasons,
                    );
                    return (season && season.label) || "ø";
                },
                Filter: ({ filter, onChange }) => {
                    const { currentAppsSeason, filterApplied } = this.state;

                    if (currentAppsSeason && !filterApplied) {
                        onChange(currentAppsSeason?.id || "");
                        this.setState({ filterApplied: true });
                    }

                    return (
                        <select
                            onChange={e => onChange(e.target.value)}
                            value={filter?.value ?? ""}
                        >
                            <option value="" />
                            {seasonsOptions}
                        </select>
                    );
                },
            },
            {
                Header: "",
                filterable: false,
                sortable: false,
                Cell: c => (
                    <div className="btn-toolbar">
                        <a
                            className="btn btn-sm btn-primary"
                            data-tippy-content="Visualiser"
                            style={{ pointer: "cursor" }}
                            href={
                                c.original.time_interval
                                    ? `/planning/${
                                        c.original.teacher.planning.id
                                    }/${moment(
                                        c.original.time_interval.start,
                                    ).format(ISO_DATE_FORMAT)}`
                                    : "/activities"
                            }
                        >
                            <i className="fas fa-eye" />
                        </a>
                        <DownloadButton
                            url={`/activity/${c.original.id}/users.csv`}
                            data-tippy-content="Exporter les infos de contact"
                        >
                            <i className="fas fa-table" />
                        </DownloadButton>
                        <button
                            className="btn btn-sm btn-warning"
                            data-tippy-content="Supprimer"
                            style={{ pointer: "cursor" }}
                            onClick={() => {
                                this.toggleModal();
                                this.setState({ activity: c.original });
                            }}
                        >
                            <i className="fas fa-trash" />
                        </button>
                    </div>
                ),
            },
        ];

        let filteredColumns = [...tableColumns];
        if (this.state.listPreferences) {
            filteredColumns = [
                tableColumns[0],
                ..._(tableColumns.slice(1))
                    .filter(c => _.find(this.state.listPreferences, {id: c.id, disabled: false}))
                    .sortBy(c => _.findIndex(this.state.listPreferences, {id: c.id}))
                    .value(),
            ];
        }

        return (
            <div className="ibox">
                <div className="ibox-title">
                    <div className="flex flex-center-aligned">
                        <h2 className="m-r">{this.state.total} cours</h2>
                        <ListPreferences
                            preferences={this.state.listPreferences}
                            columns={tableColumns.slice(1)}
                            className="m-r"
                            onSubmit={prefs => this.handleUpdateListPreferences(prefs)}
                        />
                        <button
                            className="btn btn-primary m-r"
                            data-tippy-content="Réinitialiser les filtres"
                            onClick={() => this.resetFilters()}
                        >
                            <i className="fas fa-times" />
                        </button>
                        <button
                            className="btn btn-primary m-r"
                            data-tippy-content="Exporter en CSV"
                            onClick={() => this.downloadExport()}
                        >
                            <i className="fas fa-download" />
                        </button>
                        <div
                            className="flex flex-end-justified"
                            style={{ flex: "auto" }}
                        >
                            <div
                                className="input-group"
                                data-tippy-content="Date de référence pour effectifs d'élèves"
                                style={{ maxWidth: "250px" }}
                            >
                                <div className="input-group-addon">
                                    <i className="fas fa-calendar" />
                                </div>
                                <input
                                    id="headcount-reference"
                                    type="date"
                                    className="form-control"
                                    value={referenceDate}
                                    onChange={e =>
                                        this.handleChangeReferenceDate(
                                            e.target.value,
                                        )
                                    }
                                />
                                <a
                                    className="input-group-addon ui-pg-button"
                                    onClick={() => {
                                        //todo imprive UI
                                        swal({
                                            type: "info",
                                            customClass: "bigSwal",
                                            title:
                                                "Aide sur la date de référence",
                                            html:
                                                "<p class='text-justify'><u>Ce n'est <strong>pas</strong> un filtre sur les cours</u>. tous les cours sont toujours affichés. C'est un filtre qui ne change que les nombres la colonne \"Occupation\" du tableau.<br />" +
                                                "Il est possible pour des élèves d'être inscrit ou désinscrit d'un cours pendant la saison...\n" +
                                                "Ce filtre est donc ici afin d'avoir l'effectif des cours en fonction d'une date précise. Cela pour avoir une sorte \"d'historique\" de l'effectif des cours. Par défaut la date sélectionnée est celle du jour précédant le jour actuel pour avoir l'effectif actuel des élèves.</p>" +
                                                "<p class='text-left'>Par exemple, imaginons le cas suivant: <br />" +
                                                "il y a 3 élèves à un cours le 10/04/2022 et un des élèves quitte le cours le 11/04/2022. <br />" +
                                                "Si le filtre se situe au 12/04/2022 ou après, l'occupation de ce cours sera de 2, alors que si ce filtre se situe au 11/04/2022 ou avant, l'occupation seras de 3. </p>",
                                        });
                                    }}
                                >
                                    <i className="fas fa-question-circle"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="ibox-content">
                    {this.state.targets.length > 0 ? this.renderTargetsAlert() : null}
                    <ReactTable
                        key={JSON.stringify(this.state.filter.filtered)}
                        style={{ backgroundColor: "white" }}
                        data={this.state.data}
                        manual
                        pages={this.state.pages}
                        columns={filteredColumns}
                        loading={this.state.loading}
                        pageSizeOptions={[5, 10, 15, 20, 50, 100]}
                        page={
                            this.state.filter.page <= this.state.pages
                                ? this.state.filter.page
                                : this.state.pages - 1
                        }
                        pageSize={this.state.filter.pageSize}
                        sorted={this.state.filter.sorted}
                        filtered={this.state.filter.filtered}
                        onPageChange={page =>
                            this.fetchData({ ...this.state.filter, page })
                        }
                        onPageSizeChange={(pageSize, page) =>
                            this.fetchData({
                                ...this.state.filter,
                                page,
                                pageSize,
                            })
                        }
                        onSortedChange={sorted =>
                            this.fetchData({ ...this.state.filter, sorted })
                        }
                        onFilteredChange={filtered =>
                            this.fetchData({
                                ...this.state.filter,
                                filtered,
                                page: 0,
                            })
                        }
                        filterable
                        sortable
                        resizable={false}
                        previousText="Précédent"
                        nextText="Suivant"
                        loadingText="Chargement..."
                        noDataText="Aucune donnée"
                        pageText="Page"
                        ofText="sur"
                        rowsText="résultats"
                        minRows={10}
                        getTrProps={(state, rowInfo, column) => {
                            if (
                                rowInfo &&
                                rowInfo.original.options.length != 0
                            ) {
                            }
                            return {};
                        }}
                        SubComponent={row => {
                            let hasUser =
                                row.original.users.filter(
                                    u =>
                                        referenceDate == undefined ||
                                        (u.begin_at <= referenceDate &&
                                            (u.stopped_at == undefined ||
                                                u.stopped_at > referenceDate)),
                                ).length > 0;

                            if (hasUser || row.original.options.length > 0) {
                                return (
                                    <UserList
                                        activity={row.original}
                                        seasons={this.props.seasons}
                                        referenceDate={referenceDate}
                                    />
                                );
                            } else {
                                return null;
                            }
                        }}
                    />
                    <MessageModal
                        id={MESSAGE_MODAL_ID}
                        recipients={recipients}
                        message={this.state.message}
                        onChange={e =>
                            this.setState({
                                message: {
                                    ...this.state.message,
                                    [e.target.name]: e.target.value,
                                },
                            })
                        }
                        onSend={() => this.sendReminderMail(referenceDate)}
                    />
                    {
                        <Modal
                            isOpen={this.state.isModalOpen}
                            ariaHideApp={false}
                            contentLabel="Supprimer le cours"
                            onRequestClose={this.toggleModal}
                            style={{
                                content: {
                                    top: "5%",
                                    left: "auto",
                                    right: "auto",
                                    bottom: "auto",
                                },
                            }}
                        >
                            <DeleteCourseModal
                                seasons={this.props.seasons}
                                activity={activity}
                                time_interval={
                                    activity
                                        ? activity.time_interval
                                        : undefined
                                }
                                startTime={
                                    activity && activity.time_interval
                                        ? moment(activity.time_interval.start)
                                        : undefined
                                }
                                onSubmit={this.onSubmit}
                                onClose={this.toggleModal}
                            />
                        </Modal>
                    }
                </div>
            </div>
        );
    }
}

const UserList = ({ activity, seasons, referenceDate = undefined }) => (
    <div className="flex-column">
        <div className="flex" style={{ padding: "15px" }}>
            <h3 className="m-r">
                {activity.student_evaluations.length}/{activity.users.length}{" "}
                évaluations remplies
            </h3>
            <a
                className="btn btn-primary"
                href={`/users/${activity.teacher.id}/activity/${activity.id}/evaluate`}
            >
                Consulter les évaluations
            </a>
        </div>
        <table className="table table-bordered">
            <thead>
            <tr>
                <th>Nom</th>
                <th>Âge</th>
                <th>Niveau</th>
                {activity.activity_ref.is_work_group && <th>Instrument</th>}
                <th>Début le</th>
                <th>Arrêt le</th>
            </tr>
            </thead>
            <tbody>
            {_.orderBy(activity.users, u => u.last_name).map(u => (
                <UserRow
                    key={u.id}
                    user={u}
                    seasons={seasons}
                    activity={activity}
                    referenceDate={referenceDate}
                />
            ))}
            {_.orderBy(activity.options, o => o.user.last_name).map(o => (
                <UserRow
                    key={o.user.id}
                    isOption={true}
                    user={o.user}
                    seasons={seasons}
                    activity={activity}
                />
            ))}
            </tbody>
        </table>
    </div>
);

const UserRow = ({
                     user,
                     seasons,
                     activity,
                     isOption = false,
                     referenceDate = undefined,
                 }) => {
    const customStyle = isOption ? { color: "#9575CD" } : {};

    if (referenceDate !== undefined) {
        if (user.begin_at > referenceDate) customStyle.color = "#fca000";
        if (user.stopped_at !== undefined && user.stopped_at <= referenceDate)
            customStyle.color = "#ff001a";
    }

    const {
        time_interval,
        activity_ref_id,
        activity_ref: activityRef,
        activity_ref: { is_work_group: isWorkGroup },
    } = activity;
    const users = [user];

    const userInstrument =
        (isWorkGroup &&
            activity.activities_instruments
                .filter((ai) => ai.user_id === user.id)
                .map((ai) => _.get(ai, "instrument.label"))
                .join(", ")) ||
        "NON ASSIGNÉ";

    const [desiredActivityId, setDesiredActivityId] = React.useState(null);

    React.useEffect(() => {
        api
            .set()
            .error((error) => {
                console.error("Erreur lors de la récupération de la demande d'inscription:", error);
            })
            .success((data) => {
                setDesiredActivityId(data.id);
            })
            .get(`/desired_activities/user/${user.id}/activity/${activity.id}`);
    }, [user.id, activity.id]);

    const inscriptionUrl = desiredActivityId ? `/inscriptions/${desiredActivityId}` : "#";

    return (
        <tr style={customStyle}>
            <td>
                <a
                    href={inscriptionUrl}
                >
                    {user.first_name} {user.last_name}
                </a>
            </td>
            <td>{TimeIntervalHelpers.age(user.birthday)} ans</td>
            <td>
                {TimeIntervalHelpers.levelDisplayForActivity(
                    {
                        users,
                        activity_ref_id,
                        time_interval,
                        activity_ref: activityRef,
                    },
                    seasons
                )}
            </td>
            {isWorkGroup && <td>{userInstrument}</td>}
            <td>
                {(user.begin_at &&
                        Intl.DateTimeFormat("fr").format(new Date(user.begin_at))) ||
                    ""}
            </td>
            <td>
                {(user.stopped_at &&
                        Intl.DateTimeFormat("fr").format(new Date(user.stopped_at))) ||
                    ""}
            </td>
        </tr>
    );
};

