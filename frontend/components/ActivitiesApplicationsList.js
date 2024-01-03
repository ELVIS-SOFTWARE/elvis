import React from "react";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

import ReactTable from "react-table";
import Select from "react-select";
import Loader from 'react-loader-spinner'
import swal from "sweetalert2";

import { age, levelDisplay, } from "./planning/TimeIntervalHelpers";
import { csrfToken, optionMapper, USER_OPTIONS_SHORT } from "./utils";
import { makeDebounce } from "../tools/inputs";
import { PRE_APPLICATION_ACTION_LABELS, PRE_APPLICATION_ACTIONS } from "../tools/constants";
import ListPreferences from "./common/ListPreferences";
import StopList from "./StopList";
import UserWithInfos from "./common/UserWithInfos";
import ButtonModal from "./common/ButtonModal";
import ActivitiesApplicationsDashboard from "./ActivitiesApplicationsDashboard";

const FILTER_STORAGE_KEY = "activities_application_list_filters";
const PREFERENCES_STORAGE_KEY = "activities_applications_list_preferences";

const displayActivityName = a => a.activity_type === "child" || a.activity_type === "cham" ? a.label : a.kind;

const requestData = (pageSize, page, sorted, filtered, format) => {
    return fetch(`/inscriptions/list${format ? `.${format}` : ""}`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json, text/csv",
            "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
            pageSize,
            page,
            sorted: sorted[0],
            filtered,
        }),
    });
};

const defaultTableProps = () => ({
    page: 0,
    pageSize: 16,
    sorted: [{ id: "date", desc: true }],
    filtered: [],
    resized: [],
    expanded: {},
});

const debounce = makeDebounce();

class ActivitiesApplicationsList extends React.Component {
    constructor(props) {
        super(props);
      
        const localStorageFilter = localStorage.getItem(FILTER_STORAGE_KEY);
        const filter =
            localStorageFilter != null
                ? JSON.parse(localStorageFilter)
                : defaultTableProps();

        const localStoragePrefs = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        const listPreferences = localStoragePrefs && JSON.parse(localStoragePrefs);

        this.state = {
            data: [],
            pages: 0,
            loading: true,
            listPreferences,
            filter,
            bulkTargets: [],
            bulkEdit: {
                activity_application_status_id: "",
            }
        };
    }

    componentDidMount() {
        this.nameInput.focus();
      
    }

    componentDidMount() {
        this.fetchData(this.state.filter);
    }

    componentDidUpdate() {
        localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify(this.state.filter)
        );
    }

    handleUpdateListPreferences(prefs) {
        this.setState(
            {
                listPreferences : prefs,
            },
            () => localStorage.setItem(
                PREFERENCES_STORAGE_KEY,
                JSON.stringify(prefs),
            )
        );
    }

    downloadExport() {
        this.setState({
            exportOngoing: true,
        });
        requestData(
            this.state.filter.pageSize,
            this.state.filter.page,
            this.state.filter.sorted,
            this.state.filter.filtered,
            "csv"
        )
            .then(res => res.blob())
            .then(file => {
                this.setState({exportOngoing: false});

                const download = document.createElement("a");
                download.download = `${moment().format("DD_MM_YYYY-HH_mm_ss")}.csv`;
                download.href = URL.createObjectURL(file);
                document.body.appendChild(download);
                download.click();
                document.body.removeChild(download);
            });
    }

    handleUpdateBulkEdit(name, value) {
        this.setState({
            bulkEdit: {
                ...this.state.bulkEdit,
                [name]: value,
            },
        });
    }

    handleBulkEdit() {
        fetch("/inscriptions/bulk", {
            method: "POST",
            headers: {
                "X-Csrf-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                filter: {
                    ...this.state.filter,
                    sorted: this.state.filter.sorted[0],
                },
                targets: this.state.bulkTargets,
                application: this.state.bulkEdit,
            }),
        })
            .then(res => res.json())
            .then(data => ({
                data: data.applications,
                pages: data.pages,
                total: data.total,
            }))
            .then(res => {
                this.setState({
                    ...res,
                    bulkTargets: [],
                    loading: false,
                });
                //close modal
                //TODO close it in a cleaner way
                document.querySelector("#applications-bulk-edit-modal").click();
            });
    }

    resetFilters() {
        localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify(defaultTableProps())
        );
        this.setState({ filter: defaultTableProps() }, () => {
            this.fetchData(this.state.filter);
        });
    }

    updateBulkTarget(id, checked) {
        if (checked) {
            //add target to bulk targets list
            this.setState({
                bulkTargets: [...this.state.bulkTargets, id],
            });
        } else {
            if (this.state.bulkTargets === "all")
                this.setState({
                    bulkTargets: this
                        .state
                        .data
                        .map(d => d.id)
                        .filter(d => d !== id),
                });
            else
                this.setState({
                    bulkTargets: this.state.bulkTargets.filter(r => r !== id),
                });
        }
    }

    //Displays an alert which gives information about how many rows are selected
    //And also suggests the user select all data (across pages) when he checked
    //The "all" checkbox. Bulk actions are on the right of the alert.
    bulkAlert() {
        const count = this.state.bulkTargets === "all" && this.state.total || this.state.bulkTargets.length;

        return <div className="alert alert-info m-t-sm" style={{ marginBottom: "0" }}>
            <div className="flex flex-space-between-justified flex-center-aligned">
                <div id="targets-infos">
                    Vous avez sélectionné {count} demande(s) {
                        this.state.bulkTargets.length === this.state.data.length &&
                            Math.max(this.state.total - this.state.bulkTargets.length, 0) ?
                            <button
                                onClick={() => this.setState({ bulkTargets: "all" })}
                                className="btn btn-info m-l-sm">
                                Sélectionner les {this.state.total - this.state.bulkTargets.length} restantes
                            </button>
                            : null
                    }
                </div>
                <div id="targets-actions">
                    <a
                        href="#"
                        data-toggle="modal"
                        data-target="#applications-bulk-edit-modal"
                        className="btn btn-primary m-r-sm">
                        <i className="fas fa-edit m-r-xs" />
                        Édition de masse
                    </a>
                </div>
            </div>
        </div>;
    }

    fetchData(filter) {
        this.setState({ loading: true, filter });

        debounce(() => {
            requestData(
                filter.pageSize,
                filter.page,
                filter.sorted,
                filter.filtered,
                "json",
            )
                .then(response => response.json())
                .then(data => {
                    const res = {
                        data: data.applications,
                        pages: data.pages,
                        total: data.total,
                    };

                    return res;
                })
                .then(res => {
                    this.setState({
                        ...res,
                        loading: false,
                        bulkTargets: [],
                    });
                });
        }, 400);
    }

    handleToggleNoAvailabilityFilter() {
        const newFilter = [...this.state.filter.filtered];
        const indexOfFilter = newFilter.findIndex(f => f.id === "nb_availabilities");

        if (indexOfFilter === -1) {
            newFilter.push({
                id: "nb_availabilities",
                value: 0,
            });
        } else {
            newFilter.splice(indexOfFilter, 1);
        }

        this.fetchData({
            ...this.state.filter,
            filtered: newFilter,
        });
    }

    sendGroupConfirmationMail() {
        swal({
            title: "Envoi mail confirmation",
            html: '<p>Un mail de confirmation va être envoyé pour <strong>chaque demande d\'inscription sélectionnée dont le cours est attribué ou proposition accepté.</strong></p>',
            type: "question",
            showCancelButton: true,
            cancelButtonText: "Annuler",
            reverseButtons: true,
            input: "checkbox",
            inputValue: 0,
            inputPlaceholder: '<p class="mt-3">Renvoyer les mails ?</p>',
        }).then(v => {
            console.log(v.value);
            if (v.value !== undefined) {
                fetch(`/inscriptions/send_all_confirmation_mail`, {
                    method: "POST",
                    headers: {
                        "X-Csrf-Token": csrfToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        filter: {
                            ...this.state.filter,
                            sorted: this.state.filter.sorted[0],
                        },
                        targets: this.state.bulkTargets,
                        application: this.state.bulkEdit,
                        forceResend: v.value,
                    }),
                }).then(response => response.json())
                    .then(res => {
                        if (res.success)
                            swal.fire('', 'Les mails vont être envoyés', 'success')
                        else
                            swal.fire('', res.message, 'error')
                    })
            }
        });
    }

    render() {
        const activitiesFilterOptions = _.chain(this.props.activities)
            .uniq()
            .map(a => ({
                label: a.label,
                value: a.label
            }))
            .sortBy("label")
            .value();

        const activitiesKindsFilterOptions = _.chain(this.props.activities)
            .filter(a => a.kind != undefined)
            .map(a => ({
                label: a.kind,
                value: a.kind
            }))
            .uniqBy("label")
            .sortBy("label")
            .value();

        const applicationStatusesFilterOptions = _(this.props.statuses)
            .orderBy(s => s.label)
            .map(s => ({
                value: s.id,
                label: s.label,
            }))
            .value();

        const applicationActionsFilterOptions = Object.keys(PRE_APPLICATION_ACTION_LABELS).map(l => ({
            label: PRE_APPLICATION_ACTION_LABELS[l],
            value: l,
        }));

        const columns = [
            {
                Header: "",
                id: "selection",
                width: 25,
                accessor: r => this.state.bulkTargets.includes(r.id),
                Filter: () => <input
                    type="checkbox"
                    defaultChecked={this.state.bulkTargets === "all" /*|| this.state.bulkTargets.length === this.state.data.length*/}
                    onClick={e => e.target.checked ? this.setState({ bulkTargets: this.state.data.map(r => r.id) }) : this.setState({ bulkTargets: [] })} />,
                Cell: d => <input
                    type="checkbox"
                    defaultChecked={this.state.bulkTargets === "all" || d.value}
                    onClick={e => this.updateBulkTarget(d.original.id, e.target.checked)} />,
            },
            {
                Header: "# Adhérent",
                id: "adherent_number",
                width: 70,
                filterable: true,
                accessor: r => <a href={`/users/${r.user_id}`}>{r.user.adherent_number}</a>,
            },
            {
                Header: "# Demande",
                id: "id",
                width: 70,
                filterable: true,
                accessor: r => <a /*href={`/inscriptions/${r.id}`}*/>{r.id}</a>,
            },
            {
                Header: "Date",
                accessor: d => moment(d.created_at),
                width: 100,
                id: "date",
                filterable: false,
                Cell: d => d.value.format("DD MMM YYYY"),
            },
            {
                id: "name",
                Header: "Prénom nom",
                width: 175,
                accessor: d => <UserWithInfos userId={d.user_id}>
                    {`${d.user.first_name} ${d.user.last_name}`}
                </UserWithInfos>,
            },
            {
                id: "age",
                Header: "Âge",
                width: 50,
                accessor: d => d.user.birthday && age(d.user.birthday) || "?",
            },
            {
                id: "level",
                Header: "Niveau",
                width: 130,
                Filter: ({ filter, onChange }) => (
                    <select
                        onChange={e => onChange(e.target.value)}
                        value={filter ? filter.value : ""}>
                        <option value="" />
                        {this.props.evaluationLevelRefs.map(r => <option
                            key={r.id}
                            value={r.id}>
                            {r.label}
                        </option>)}
                    </select>
                ),
                accessor: d => d.user && d.activity_refs[0] && levelDisplay([d.user], d.activity_refs[0].id, d.season_id) || "?",
            },
            {
                id: "activity_ref_id",
                Header: "Activité",
                width: 200,
                sortable: false,
                accessor: d => {
                    return d.activity_refs
                        .map(a => a.label)
                        .join(", ");
                },
                Filter: ({ filter, onChange }) =>
                    <Select
                        options={activitiesFilterOptions}
                        isMulti={true}
                        isClearable={true}
                        value={filter && filter.value && activitiesFilterOptions.filter(o => filter.value.includes(o.value)) || "all"}
                        onChange={v => onChange(v.length && v.map(v => v.value) || "")}
                        styles={{
                            option: (base) => ({
                                ...base,
                                textAlign: "left",
                            }),
                            dropdownIndicator: (base) => ({
                                ...base,
                                display: "none",
                            }),
                        }} />,
            },
            {
                id: "activity_ref_kind_id",
                Header: "Famille d'activité",
                width: 200,
                sortable: false,
                accessor: d => {
                    return d.activity_refs
                        .map(a => a.kind)
                        .filter(a => a != undefined)
                        .join(", ");
                },
                Filter: ({ filter, onChange }) =>
                    <Select
                        options={activitiesKindsFilterOptions}
                        isMulti={true}
                        isClearable={true}
                        value={filter && filter.value && activitiesKindsFilterOptions.filter(o => filter.value.includes(o.value)) || "all"}
                        onChange={v => onChange(v.length && v.map(v => v.value) || "")}
                        styles={{
                            option: (base) => ({
                                ...base,
                                textAlign: "left",
                            }),
                            dropdownIndicator: (base) => ({
                                ...base,
                                display: "none",
                            }),
                        }} />,
            },
            {
                Header: "Action",
                id: "action",
                width: 150,
                sortable: false,
                accessor: d => {
                    if (d.pre_application_desired_activity) {
                        return PRE_APPLICATION_ACTION_LABELS[d.pre_application_desired_activity.action];
                    } else if (d.pre_application_activity) {
                        return PRE_APPLICATION_ACTION_LABELS[d.pre_application_activity.action];
                    }

                    return PRE_APPLICATION_ACTION_LABELS[PRE_APPLICATION_ACTIONS.NEW];
                },
                Filter: ({ filter, onChange }) => (
                    <Select
                        options={applicationActionsFilterOptions}
                        isMulti={true}
                        isClearable={true}
                        value={filter && filter.value && applicationActionsFilterOptions.filter(o => filter.value.includes(o.value)) || "all"}
                        onChange={v => onChange(v.length && v.map(v => v.value) || "")}
                        styles={{
                            option: (base) => ({
                                ...base,
                                textAlign: "left",
                            }),
                            dropdownIndicator: (base) => ({
                                ...base,
                                display: "none",
                            }),
                        }} />
                ),
            },
            {
                id: "season_id",
                Header: "Saison",
                width: 150,
                accessor: d => (d.season ? d.season.label : "n/a"),
                sortable: false,
                Filter: ({ filter, onChange }) => (
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{ width: "100%" }}
                        value={filter ? filter.value : "all"}
                    >
                        <option value="all">Toutes les saisons</option>
                        {_.map(this.props.seasons, (s, i) => (
                            <option key={i} value={s.id}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                ),
            },
            {
                id: "referent_id",
                Header: "Référent.e",
                width: 125,
                accessor: d => d.referent,
                Cell: c => c.value && `${c.value.first_name} ${c.value.last_name.charAt(0)}.` || "",
                Filter: ({ filter, onChange }) => <select
                    className="form-control"
                    defaultValue={filter && filter.value || ""}
                    onChange={e => onChange(e.target.value)}>
                    <option value=""></option>
                    {_.sortBy(this.props.admins, "first_name").map(optionMapper(USER_OPTIONS_SHORT))}
                </select>,
            },
            {
                id: "mail_sent",
                Header: "Mail envoyé ?",
                width: 75,
                accessor: d => d.mail_sent === true ? "Oui" : "Non",
                sortable: false,
                Filter: ({ filter, onChange }) => (
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{ width: "100%" }}
                        value={filter ? filter.value : "all"}
                    >
                        <option value="all">Tous</option>
                        <option value="true">Oui</option>
                        <option value="false">Non</option>
                    </select>
                ),
            },
            {
                id: "activity_application_status_id",
                Header: "Statut",
                accessor: d => d.activity_application_status_id,
                sortable: false,
                filterMethod: (filter, row) => {
                    if (filter.value === "all") {
                        return true;
                    }

                    return row.activity_application_status_id == filter.value;
                },
                Cell: row => {
                    let status = _.find(
                        this.props.statuses,
                        status => status.id === row.value
                    );
                    const referent = row.original.referent;
                    return (
                        status &&
                        `${status.label} ${row.original.status_updated_at ?
                            `(${moment(row.original.status_updated_at).fromNow()})`
                            : ""}`)
                        || "??";
                },
                Filter: ({ filter, onChange }) =>
                    <Select
                        options={applicationStatusesFilterOptions}
                        isMulti={true}
                        isClearable={true}
                        value={filter && filter.value && applicationStatusesFilterOptions.filter(o => filter.value.includes(o.value)) || "all"}
                        onChange={v => onChange(v.length && v.map(v => v.value) || "")}
                        styles={{
                            option: (base) => ({
                                ...base,
                                textAlign: "left",
                            }),
                            dropdownIndicator: (base) => ({
                                ...base,
                                display: "none",
                            }),
                        }} />
            },
        ];

        const withoutAvailabilityMode = this.state.filter.filtered.find(f => f.id === "nb_availabilities");

        let filteredColumns = [...columns];

        if(this.state.listPreferences) {
            filteredColumns = [
                columns[0],
                // Only take enabled columns, and order them according to prefs order
                ..._(columns)
                    .filter(c => _.find(this.state.listPreferences, {id: c.id, disabled: false}))
                    .sortBy(c => _.findIndex(this.state.listPreferences, { id : c.id }))
                    .value(),
            ];
        }

        return (
            <div className="row p-sm">
                <div className="ibox">
                    <div className="ibox-content">
                        <div className="flex flex-column">
                            <div className="flex flex-space-between-justified">
                                <div className="flex">
                                    <h3 className="m-r">En attente de traitement ({this.state.total || 0})</h3>
                                    <ListPreferences
                                        preferences={this.state.listPreferences}
                                        columns={columns.slice(1)}
                                        className="m-r-sm"
                                        onSubmit={prefs => this.handleUpdateListPreferences(prefs)} />
                                    <button
                                        className="btn btn-primary m-r-sm"
                                        data-tippy-content="Réinitialiser les filtres"
                                        onClick={() => this.resetFilters()}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                    <button
                                        className="btn btn-primary m-r-sm"
                                        data-tippy-content="Rafraîchir les données"
                                        onClick={() => this.fetchData(this.state.filter)}>
                                        <i className="fas fa-sync"></i>
                                    </button>
                                    <button
                                        className="btn btn-primary m-r-sm"
                                        data-tippy-content="Exporter en CSV"
                                        onClick={this.downloadExport.bind(this)}>
                                        {
                                            this.state.exportOngoing ?
                                                <Loader
                                                    type="Oval"
                                                    color="white"
                                                    height={15}
                                                    width={15} /> :
                                                <i className="fas fa-upload" />
                                        }
                                    </button>
                                    <button
                                        onClick={e => this.handleToggleNoAvailabilityFilter()}
                                        data-tippy-content="Afficher les élèves sans disponibilités renseignées"
                                        className={`btn m-r-sm btn-${withoutAvailabilityMode ? "primary" : "muted"}`}>
                                        <strong><i className="fas fa-calendar-times"></i></strong>
                                    </button>
                                    <button
                                        onClick={() => this.sendGroupConfirmationMail()}
                                        className="btn btn-primary"
                                        data-tippy-content="Envoi groupé mail confirmation"
                                        disabled={false}>
                                        <i className="fas fa-envelope" />
                                        
                                    </button>
                                </div>
                                <div className="flex">
                                    <ButtonModal
                                        modalProps={{
                                            style: {
                                                content: {
                                                    width: "750px",
                                                    margin: "auto",
                                                    inset: "unset",
                                                }
                                            }
                                        }}
                                        className="btn btn-primary m-r-sm"
                                        tooltip="Statistiques d'inscriptions"
                                        label={<i className="fas fa-chart-pie"/>}>
                                        <ActivitiesApplicationsDashboard
                                            {...this.props.dashboardInfos} />
                                    </ButtonModal>
                                    <StopList seasons={this.props.seasons} />
                                </div>
                            </div>
                            {
                                this.state.bulkTargets.length > 0 ?
                                    this.bulkAlert()
                                    :
                                    null
                            }
                        </div>
                    </div>
                    <div className="ibox-content no-padding">
                        <ReactTable
                            data={this.state.data}
                            manual
                            pages={this.state.pages}
                            loading={this.state.loading}
                            columns={filteredColumns}
                            defaultSorted={[{ id: "date", desc: true }]}
                            filterable={true}
                            defaultFilterMethod={(filter, row) => {
                                if (row[filter.id] !== null) {
                                    return row[filter.id]
                                        .toString()
                                        .toLowerCase()
                                        .startsWith(filter.value.toLowerCase());
                                }
                            }}
                            page={this.state.filter.page}
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
                                })
                            }
                            previousText="Précédent"
                            nextText="Suivant"
                            loadingText="Chargement..."
                            noDataText="Aucune donnée"
                            pageText="Page"
                            ofText="sur"
                            rowsText="résultats"
                            pageSizeOptions={[5,10,15,16,20]}
                            getTdProps={(state, rowInfo, column, instance) => {
                                if (column.id !== "selection" && column.id !== "name")
                                    return {
                                        onClick: (e, handleOriginal) => {
                                            window.open(`/inscriptions/${rowInfo.original.id}`);

                                            if (handleOriginal) {
                                                handleOriginal();
                                            }
                                        },
                                    };

                                return {};
                            }}
                        />

                        <div className="flex flex-center-justified m-t-xs">
                            <h3>
                                {`${
                                    this.state.total
                                    } Demandes d'inscription au total`}
                            </h3>
                        </div>
                    </div>
                </div>

                <BulkEditModal
                    statuses={this.props.statuses}
                    targets={this.state.bulkTargets}
                    state={this.state.bulkEdit}
                    onChange={(name, value) => this.handleUpdateBulkEdit(name, value)}
                    onSave={() => this.handleBulkEdit()} />
            </div>
        );
    }
}

const BulkEditModal = ({ targets, state, statuses, onChange, onSave }) => <div
    id="applications-bulk-edit-modal"
    tabIndex="-1"
    role="dialog"
    aria-hidden="true"
    className="modal inmodal">
    <div className="modal-dialog">
        <div className="modal-content animated">
            <div className="modal-header">
                Édition de masse des demandes
            </div>
            <div className="modal-body">
                <div className="form-group">
                    <label>Statut</label>
                    <select
                        value={state.activity_application_status_id}
                        onChange={e => onChange(e.target.name, parseInt(e.target.value))}
                        name="activity_application_status_id"
                        className="form-control">
                        <option value=""></option>
                        {
                            statuses.map(s => <option key={s.id} value={s.id}>
                                {s.label}
                            </option>)
                        }
                    </select>
                </div>
            </div>
            <div className="modal-footer flex flex-space-between-justified">
                <button
                    type="button"
                    className="btn"
                    data-dismiss="modal">
                    <i className="fas fa-times m-r-sm"></i>
                    Annuler
                </button>
                <button
                    onClick={() => onSave()}
                    disabled={targets.length === 0}
                    className="btn btn-primary">
                    <i className="fas fa-check m-r-xs" />
                    Valider
                </button>
            </div>
        </div>

    </div>
</div>;

export default ActivitiesApplicationsList;
