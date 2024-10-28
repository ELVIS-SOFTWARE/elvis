import _ from "lodash";
import React from "react";
import ReactTableFullScreen from "../ReactTableFullScreen";
import swal from "sweetalert2";
import {makeDebounce} from "../../tools/inputs";
import {
    csrfToken,
    findAndGet,
    optionMapper,
    reactOptionMapper,
} from "../utils";
import MessageModal from "./MessageModal";
import DateRangePicker from "../utils/DateRangePicker";
import * as api from "../../tools/api";
import * as PaymentStatus from "../utils/PaymentStatuses";

const moment = require("moment");
require("moment/locale/fr");

const FILTER_STORAGE_KEY = "general_payments_list_filters";

const PAYMENT_STATUS = {
    VALIDATED: 1,
    FAILED: 2,
    PENDING: 3,
    UNPAID: 4
};

const defaultTableProps = () => ({
    page: 0,
    pageSize: 11,
    sorted: [{id: "cashing_date"}],
    filtered: [],
    resized: [],
    expanded: {},
});

const NB_DISPLAYED_RECIPIENTS = 3;
const MESSAGE_MODAL_ID = "messagesModal";

const debounce = makeDebounce();

const pageSizeOptions = [5, 10, 11, 15, 20, 50, 100];

const requestData = (pageSize, page, sorted, filtered, format) => {
    return fetch(`/payments/list${format ? `.${format}` : ""}`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "X-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            pageSize,
            page,
            sorted: sorted[0],
            filtered,
        }),
    })
        .catch(reason => alert(reason))
        .then(response => {
            if (!format || format === "json") return response.json();
            else {
                return response.blob();
            }
        })
        .then(data => {
            if (!format || format === "json") {
                return {
                    data: data.payments,
                    pages: data.pages,
                    rowsCount: data.rowsCount,
                    totalAmount: data.totalAmount,
                };
            } else {
                return data;
            }
        });
};

class PaymentList extends React.Component {
    constructor(props) {
        super(props);

        const localStorageValue = localStorage.getItem(FILTER_STORAGE_KEY);
        const filter =
            localStorageValue != null
                ? JSON.parse(localStorageValue)
                : defaultTableProps();


        const columns = [
            {
                Header: "",
                id: "selection",
                width: 25,
                sortable: false,
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
                                    targetStatus: (this.state.data.filter(r => {return r.payment_status_id === PaymentStatus.UNPAID_ID})
                                        .map(r => r.id)),
                                })
                                : this.setState({
                                    targets: [],
                                    targetStatus: []
                                })
                        }
                    />
                ),
                Cell: d => <input
                            type="checkbox"
                            checked={this.state.targets === "all" || this.state.targets.includes(d.original.id)}
                            onChange={e => {
                                    console.log(d);
                                    this.updateTarget(d.original.id, e.target.checked, d.original.payment_status_id)
                                }
                            }
                        />,
            },
            {
                Header: "N°",
                id: "number",
                maxWidth: 70,
                accessor: d => d.number,
                Filter: ({onChange, filter}) => {
                    let nextValue = "t";
                    let badgeClass = "badge ";
                    let label = "Tous";

                    switch ((filter && filter.value) || "") {
                        case "t":
                            nextValue = "f";
                            badgeClass += "badge-primary";
                            label = "Adh";
                            break;
                        case "f":
                            nextValue = "";
                            badgeClass += "badge-warning";
                            label = "Non Adh";
                            break;
                    }

                    return (
                        <div
                            style={{height: "100%"}}
                            className="flex flex-center-aligned flex-center-justified"
                        >
                            <span
                                className={badgeClass}
                                style={{
                                    padding: "initial 10px initial 10px",
                                    cursor: "pointer",
                                }}
                                onClick={e => onChange(nextValue)}
                            >
                                {label}
                            </span>
                        </div>
                    );
                },
            },
            {
                Header: "Statut",
                id: "payment_status_id",
                maxWidth: 75,
                className: "flex flex-center-justified",
                accessor: d => d.payment_status_id,
                Cell: c => this.renderStatus(c),
                //filterable: true,
                Filter: ({filter, onChange}) => (
                    <select
                        onChange={event => {
                            console.log("Selected value:", event.target.value);
                            onChange(event.target.value)
                        }}
                        style={{width: "100%"}}
                        value={filter ? filter.value : ""}
                    >
                        <option value="all">Tous</option>
                        <option value={0}>Aucun</option>
                        {this.props.paymentStatuses.map(method => (
                            <option key={method.id} value={method.id}>
                                {method.label}
                            </option>
                        ))}
                    </select>
                ),
            },
            {
                Header: "Date encaissement",
                id: "cashing_date",
                width: 320,
                accessor: p =>
                    moment(p.cashing_date)
                        .local()
                        .format("DD/MM/YYYY"),
                Filter: ({filter, onChange}) => {
                    const start = _.get(filter, "value.start");
                    const end = _.get(filter, "value.end");

                    return (
                        <React.Fragment>
                            <DateRangePicker
                                onChange={onChange}
                                defaultStart={start}
                                defaultEnd={end}
                            />
                        </React.Fragment>
                    );
                },
            },
            {
                Header: "Mode règlement",
                id: "payment_method_id",
                sortable: false,
                accessor: p => {
                    const pm = _.find(
                        this.props.paymentMethods,
                        pm => pm.id == p.payment_method_id
                    );

                    return pm ? pm.label : `Aucun mode de règlement renseigné`;
                },
                Filter: ({filter, onChange}) => (
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{width: "100%"}}
                        value={filter ? filter.value : ""}
                    >
                        <option key={-2} value=""/>
                        <option key={-1} value="null">
                            Sans mode de règlement
                        </option>
                        {_.orderBy(
                            this.props.paymentMethods,
                            pm => pm.label
                        ).map(method => (
                            <option key={method.id} value={method.id}>
                                {method.label}
                            </option>
                        ))}
                    </select>
                ),
            },
            {
                Header: "Payeur",
                maxWidth: 175,
                id: "users.last_name",
                Cell: props => {
                    const user = _.get(
                        props.original,
                        "due_payment.payment_schedule.user"
                    );
                    return (
                        (user && (
                            <a href={`/payments/summary/${user.id}`}>
                                {`${user.last_name} ${user.first_name}`}
                            </a>
                        )) ||
                        "Inconnu"
                    );
                },
            },
            {
                Header: "Emplacement",
                id: "location_id",
                maxWidth: 120,
                accessor: d =>
                    d.location_id && this.props.locations[d.location_id].label,
                Filter: ({filter, onChange}) => (
                    <select
                        value={(filter && filter.value) || ""}
                        onChange={e => onChange(e.target.value)}
                    >
                        <option value=""/>
                        {_.orderBy(
                            Object.values(this.props.locations),
                            l => l.label
                        ).map(l => (
                            <option key={l.id} value={l.id}>
                                {l.label}
                            </option>
                        ))}
                    </select>
                ),
            },
            {
                Header: "Montant",
                maxWidth: 100,
                id: "amount",
                style: {
                    display: "block",
                    textAlign: "right",
                },
                accessor: d => `${d.amount || "?"} €`,
                filterable: true,
                sortable: false,
            },
            // n'est plus utilisé depuis la mise en place de la nouvelle interface d'envoi de mail
            // {
            //     Header: "Actions",
            //     maxWidth: 75,
            //     id: "actions",
            //     filterable: false,
            //     sortable: false,
            //     accessor: p => ({
            //         userId: p.due_payment.payment_schedule.payable_id,
            //         mail: p.payment_status_id !== PAYMENT_STATUS.VALIDATED,
            //     }),
            //     Cell: d => (
            //         <div className="flex">
            //             {d.value.mail ? (
            //                 <button
            //                     data-toggle="modal"
            //                     onClick={() =>
            //                         this.setState({targets: [d.original.id]})
            //                     }
            //                     data-target={`#${MESSAGE_MODAL_ID}`}
            //                     className="btn btn-xs btn-primary"
            //                     title="Envoyer un rappel"
            //                 >
            //                     <i className="fas fa-envelope"/>
            //                 </button>
            //             ) : null}
            //         </div>
            //     ),
            // },
        ];

        this.state = {
            columns: columns,
            data: [],
            pages: null,
            message: {
                title: "Rappel pour paiement",
                content: "",
                isEmail: true,
                isSMS: false,
            },
            bulkEdit: {},
            page: 0,
            filter,
            loading: true,
            rowsCount: 0,
            totalAmount: 0,
            targets: [],
            targetStatus: [],
            csv_export_loading: false,
        };

        this.fetchData = this.fetchData.bind(this);
        this.downloadFile = this.downloadFile.bind(this);
        this.returnBlob = this.returnBlob.bind(this);
        this.onCsvExport = this.onCsvExport.bind(this);
    }

    componentDidMount() {
        this.mounted = true;
        this.fetchData(this.state.filter, 0);
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    componentDidUpdate() {
        localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify(this.state.filter)
        );

        loadTippy(getTippyNodes());
    }

    fetchData(filter, delay = 400) {
        this.setState({filter});

        debounce(() => {
            if (!this.mounted) return;
            this.setState({loading: true, file: undefined});
            requestData(
                filter.pageSize,
                filter.page,
                filter.sorted,
                filter.filtered,
                "json"
            ).then(res => {
                if (!this.mounted) return;

                this.setState({
                    ...res,
                    loading: false,
                });
            });
        }, delay);
    }

    resetFilters() {
        localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify(defaultTableProps())
        );
        this.setState({filter: defaultTableProps()}, () => {
            this.fetchData(this.state.filter);
        });
    }

    handleChangeSeason(value) {
        const filter = {...this.state.filter};

        const indexFiltered = _.keyBy(filter.filtered, "id");

        if (value) indexFiltered.season_id = {id: "season_id", value};
        else delete indexFiltered.season_id;

        filter.filtered = Object.values(indexFiltered);

        this.fetchData(filter);
    }

    returnBlob(res) {
        if (res.headers.has("content-disposition")) {

            const content = res.headers.get("content-disposition");
            const match = content.match(/filename=\"(.*)\"/);
            if (match) {
                this.filename = match[1]
            }
        }
        return res.blob();
    }

    downloadFile(file) {
        const download = document.createElement("a");
        download.download = this.filename || `${moment().format(
            "DD_MM_YYYY-HH_mm_ss"
        )}.csv`;
        download.href = URL.createObjectURL(file);
        document.body.appendChild(download);
        download.click();
        document.body.removeChild(download);
    }

    onCsvExport() {
        this.setState({csv_export_loading: true})
        const filter = this.state.filter.filtered;
        let ids = [];

        if(this.state.targets === "all")
        {
            ids = "all";
        }
        else
        {
            ids = this.state.targets && this.state.targets.length > 0 ? this.state.targets : this.state.data.map(d => d.id);
        }

        let searchParams;

        if (ids === "all") {
            searchParams = new URLSearchParams({
                filtered: JSON.stringify(filter),
                stream: true
            });
        } else {
            searchParams = new URLSearchParams({
                list: JSON.stringify(ids),
                stream: true
            });
        }

        const url = `/payments/export?${searchParams.toString()}`
        fetch(url, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
                "Content-Type": "application/json",
            }
        }).then(res => this.returnBlob(res))
            .then(file => this.downloadFile(file))
            .then(() => this.setState({csv_export_loading: false}));
    }

    sendReminderMail() {
        const to = _.uniq(
            this.state.data
                .filter(
                    ({id, payment_status_id}) =>
                        this.state.targets.includes(id) &&
                        (payment_status_id === PAYMENT_STATUS.UNPAID || payment_status_id === PAYMENT_STATUS.PENDING)
                )
                .map(d => _.get(d, "payment_schedule.user.id"))
                .filter(id => id)
        );

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
                            `Erreur ${res.status} : ${res.statusText}`
                        );
                }
            })
            .catch(reason =>
                swal({
                    title: "Erreur",
                    text: reason,
                    type: "error",
                })
            );
    }

    sendPaymentMail() {
        swal({
            title: "Envoyer un mail de relance",
            text: "Voulez vous envoyer un mail de relance pour les règlements sélectionnés ?",
            type: "question",
            showCancelButton: true,
            cancelButtonText: "Annuler",
        }).then(res => {
            if (res.value) {
                api.set()
                    .success(res => {
                        if (res.status === "success")
                            swal({title: "Succès", text: "Mail envoyé", type: "success"});
                    })
                    .error(errorMsg => {
                        swal({
                            type: "error",
                            title: "Une erreur est survenue",
                            text: errorMsg,
                        });
                    })
                    .post(
                        `/payments/send_reglement_mail`,{
                            targets: this.state.targetStatus,
                        }
                    );
            }
        });
    }

    submitBulkEdit() {
        fetch("/due_payments/bulkedit/general", {
            method: "POST",
            headers: {
                "X-Csrf-Token": csrfToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                targets: this.state.targets,
                filter: this.state.targets === "all" ? this.state.filter : null,
                due_payment: {
                    ...this.state.bulkEdit,
                },
            }),
        }).then(res => {
            if (res.ok) {
                let targets =
                    this.state.targets === "all"
                        ? this.state.data.map(d => d.id)
                        : this.state.targets;

                let data = [...this.state.data].map(d => {
                    if (targets.includes(d.id))
                        return {
                            ...d,
                            ...this.state.bulkEdit,
                        };

                    return {
                        ...d,
                    };
                });

                this.setState({
                    data,
                });
            }
        });
    }

    promptStatusEdit(id, statusId) {
        swal({
            title: "Édition du statut",
            type: "warning",
            confirmButtonText: "Valider",
            input: "select",
            inputOptions: _.zipObject(
                this.props.statuses.map(status => status.id),
                this.props.statuses.map(status => status.label)
            ),
            inputClass: "form-control",
            inputValue: statusId,
            showCancelButton: true,
            cancelButtonText: "Annuler",
        }).then(res => {
            const newStatusId = res.value;
            if (newStatusId) {
                fetch("/payments/edit_status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken,
                    },
                    body: JSON.stringify({id, status: res.value}),
                }).then(res => {
                    if (!res.ok) swal("Echec", "", "error");
                    else
                        this.setState({
                            data: this.state.data.map(p => {
                                if (p.id == id) {
                                    return {
                                        ...p,
                                        payment_status_id: parseInt(
                                            newStatusId
                                        ),
                                    };
                                }

                                return p;
                            }),
                        });
                });
            }
        });
    }

    renderStatus(cell) {
        let status = this.props.paymentStatuses.find(s => s.id === cell.value);
        let paymentId = cell.original.id;

        return (
            <div
                className="badge"
                value={status ? status.id : 0}
                style={{
                    background: status ? status.color : "grey",
                    color: "white",
                    cursor: "pointer",
                }}
                onClick={e => this.promptStatusEdit(paymentId, status.id)}
            >
                {status ? status.label : "Aucun"}
            </div>
        );
    }

    updateTarget(id, checked, status) {
        if (checked) {
            //add target to bulk targets list
            this.setState({
                targets: [...this.state.targets, id]
            });

            if (status === PaymentStatus.UNPAID_ID)
                this.setState({targetStatus: [...this.state.targetStatus, id]});

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
                    targetStatus: this.state.targetStatus.filter(r => r !== id),
                });
        }
    }

    //Goto ActivitiesApplicationsList#bulkAlert
    targetsAlert() {
        const count =
            (this.state.targets === "all" && this.state.rowsCount) ||
            this.state.targets.length;

        return (
            <div className="alert alert-info m-t-sm" style={{width: "100%"}}>
                <div className="flex flex-space-between-justified flex-center-aligned">
                    <div id="targets-infos">
                        Vous avez sélectionné {count} règlement(s){" "}
                        {this.state.targets.length === this.state.data.length &&
                        Math.max(
                            this.state.rowsCount - this.state.targets.length,
                            0
                        ) ? (
                            <button
                                onClick={() =>
                                    this.setState({targets: "all"})
                                }
                                className="btn btn-sm btn-info m-l-sm"
                            >
                                Sélectionner les{" "}
                                {this.state.rowsCount -
                                    this.state.targets.length}{" "}
                                restantes
                            </button>
                        ) : null}
                    </div>
                    <div id="targets-actions">
                        {this.state.targetStatus.length > 0 || this.state.targets.length === this.state.data.length ? (
                            <button
                                className="btn btn-sm btn-primary m-r animated"
                                disabled={this.state.targets === "all"}
                                data-toggle="modal"
                                onClick={() => this.sendPaymentMail()}
                            >
                                Envoyer un mail de relance aux règlements impayés
                            </button>
                        ) : ""}
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={this.bulkDelete.bind(this)}
                        >
                            Supprimer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    bulkDelete() {
        swal({
            title: "Confirmation",
            text:
                "Voulez-vous supprimer tous les paiements sélectionnés ?",
            type: "question",
            showCancelButton: true,
            cancelButtonText: "Annuler",
        }).then(r => {
            if (r.value) {
                fetch("/payments/bulkdelete", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken,
                    },
                    body: JSON.stringify({
                        targets: this.state.targets,
                    }),
                })
                    .catch(res => console.error(res))
                    .then(res => res.json())
                    .then(res => {
                        this.setState({
                            data: this.state.data.filter(
                                d => !this.state.targets.includes(d.id)
                            ),
                            targets: [],
                        });
                    });
            }
        });
    }

    handleFilesDropped(files) {
        const body = new FormData();
        body.append("file", files[0]);

        fetch("/payments/import_file", {
            headers: {
                "X-CSRF-Token": csrfToken,
            },
            method: "POST",
            body,
        })
            .then(res => res.json())
            .then(res => {
                swal({
                    type: "info",
                    title: "Résultats",
                    text: `Réussites : ${res.inserted}, Échecs : ${res.failed}, Ignorés : ${res.ignored}`,
                }).then(() =>
                    this.setState({
                        failedCount: this.state.failedCount + res.failed,
                    })
                );
            });
    }

    promptStatusEdit(id, statusId) {
        swal({
            title: "Édition du statut",
            type: "warning",
            confirmButtonText: "Valider",
            input: "select",
            inputOptions: _.zipObject(
                this.props.statuses.map(status => status.id),
                this.props.statuses.map(status => status.label)
            ),
            inputClass: "form-control",
            inputValue: statusId,
            showCancelButton: true,
            cancelButtonText: "Annuler",
        }).then(res => {
            const newStatusId = res.value;
            if (newStatusId) {
                fetch("/payments/edit_status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken,
                    },
                    body: JSON.stringify({id, status: res.value}),
                }).then(res => {
                    if (!res.ok) swal("Echec", "", "error");
                    else
                        this.setState({
                            data: this.state.data.map(p => {
                                if (p.id === id) {
                                    return {
                                        ...p,
                                        payment_status_id: parseInt(newStatusId),
                                    };
                                }

                                return p;
                            }),
                        });
                });
            }
        });
    }

    render() {
        const {data, pages, loading} = this.state;

        const duePaymentMethodsOptions = [
            {
                label: "Sans mode de règlement",
                value: "null",
            },
            ..._.map(this.props.paymentMethods, reactOptionMapper()),
        ];

        const totalRecipients = _.chain(this.state.data)
            .filter(
                d =>
                    (d.payment_status_id === PAYMENT_STATUS.UNPAID || d.payment_status_id === PAYMENT_STATUS.PENDING) &&
                    (this.state.targets === "all" ||
                        this.state.targets.includes(d.id))
            )
            .map(d => _.get(d, "payment_schedule.user"))
            .compact()
            .uniqBy(u => u.id)
            .value();

        let recipientsToDisplay = totalRecipients.slice(
            0,
            NB_DISPLAYED_RECIPIENTS
        );

        let recipients = recipientsToDisplay
            .map(u => `${u.first_name} ${u.last_name}`)
            .join(", ");

        const restCount = Math.max(
            0,
            this.state.targets === "all"
                ? this.state.total - NB_DISPLAYED_RECIPIENTS
                : totalRecipients.length - NB_DISPLAYED_RECIPIENTS
        );
        if (restCount) recipients += `, et ${restCount} autres`;

        const filteredSeasonId =
            findAndGet(
                this.state.filter.filtered,
                f => f.id === "season_id",
                "value"
            ) || "";

        const events = [];

        return (
            <div>
                <div
                    className="flex flex-space-between-justified flex-center-aligned reglement-table-header m-b-sm"
                    style={{width: "100%"}}
                >
                    <div className="flex flex-center-aligned">
                        <h2 className="m-r">
                            {this.state.rowsCount} règlements
                        </h2>
                        <button
                            className="btn btn-primary m-r-sm"
                            data-tippy-content="Recharger la liste"
                            onClick={() => this.fetchData(this.state.filter)}
                        >
                            <i className="fas fa-sync"/>
                        </button>
                        <button
                            data-tippy-content="Réinitialiser les filtres"
                            className="btn btn-primary m-r"
                            onClick={() => this.resetFilters()}
                        >
                            <i className="fas fa-times"></i>
                        </button>

                        <button
                            data-tippy-content="Mettre le tableau en plein écran"
                            className="btn btn-primary m-r"
                            onClick={() => events[0]()}
                        >
                            <i className="fas fa-expand-arrows-alt"></i>
                        </button>

                        <select
                            onChange={e =>
                                this.handleChangeSeason(e.target.value)
                            }
                            value={filteredSeasonId}
                            className="form-control m-r"
                        >
                            <option value="">SAISON</option>
                            {this.props.seasons.map(optionMapper())}
                        </select>

                        <button
                            className="btn btn-primary"
                            data-tippy-content={'Exporter en CSV ' + (this.state.targets.length > 0 ? `les ${this.state.targets === "all" ? this.state.rowsCount : this.state.targets.length} lignes sélectionnées)` : "tous les paiements visibles")}
                            onClick={() => {this.onCsvExport()}}
                            disabled={this.state.csv_export_loading}
                        >
                            {this.state.csv_export_loading ? <i className="fas fa-circle-notch fa-spin"/> : <i className="fas fa-upload"/>}
                        </button>

                        {/*todo: restore import functionnality... so do not delete */}
                        {/*<a*/}
                        {/*    href="/payments/failed_imports"*/}
                        {/*    className="btn btn-primary"*/}
                        {/*    data-tippy-content="Imports ratés"*/}
                        {/*    style={{height: "100%"}}*/}
                        {/*>*/}
                        {/*    <i className="fas fa-eye m-r-sm"/>*/}
                        {/*    {this.state.failedCount > 100*/}
                        {/*        ? "100+"*/}
                        {/*        : this.state.failedCount || "0"}*/}
                        {/*</a>*/}
                    </div>

                    <div className="ibox-title-right">
                        <span>
                            Total paiements:{" "}
                            {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                            }).format(this.state.totalAmount)}
                        </span>
                    </div>
                </div>
                {this.state.targets.length > 0 ? this.targetsAlert() : null}

                <div className="ibox-content no-padding">
                    <ReactTableFullScreen
                        events={events}
                        data={data}
                        manual
                        pages={pages}
                        loading={loading}
                        columns={this.state.columns}
                        pageSizeOptions={pageSizeOptions}
                        page={
                            this.state.filter.page <= this.state.pages
                                ? this.state.filter.page
                                : this.state.pages - 1
                        }
                        pageSize={this.state.filter.pageSize}
                        sorted={this.state.filter.sorted}
                        filtered={this.state.filter.filtered}
                        onPageChange={page =>
                            this.fetchData({...this.state.filter, page})
                        }
                        onPageSizeChange={(pageSize, page) =>
                            this.fetchData({
                                ...this.state.filter,
                                page,
                                pageSize,
                            })
                        }
                        onSortedChange={sorted =>
                            this.fetchData({...this.state.filter, sorted})
                        }
                        onFilteredChange={filtered =>
                            this.fetchData({
                                ...this.state.filter,
                                filtered,
                            })
                        }
                        filterable
                        resizable={false}
                        previousText="Précédent"
                        nextText="Suivant"
                        loadingText="Chargement..."
                        noDataText="Aucune donnée"
                        pageText="Page"
                        ofText="sur"
                        rowsText="résultats"
                        minRows={8}
                        SubComponent={row => {
                            return (
                                <SubDuePayment
                                    data={row.original.due_payment}
                                    paymentMethods={this.props.paymentMethods}
                                />
                            );
                        }}
                    />
                </div>
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
                    onSend={() => this.sendReminderMail()}
                />
            </div>
        );
    }
}

function SubDuePayment({data, paymentMethods}) {
    const paymentMethod = paymentMethods.find(
        pm => pm.id === data.payment_method_id
    );

    return (
        <table className="table table-striped">
            <thead>
            <tr>
                <th>Numéro</th>
                <th>Date prévisionnelle</th>
                <th>Mode règlement</th>
                <th>Montant</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>{data.number}</td>
                <td>{data.previsional_date}</td>
                <td>{paymentMethod && paymentMethod.label}</td>
                <td>{data.adjusted_amount}</td>
            </tr>
            </tbody>
        </table>
    );
}

export default PaymentList;
