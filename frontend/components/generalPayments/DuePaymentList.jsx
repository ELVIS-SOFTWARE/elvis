import _, {isDate} from "lodash";
import React from "react";
import Select from "react-select";
import ReactTableFullScreen from "../ReactTableFullScreen";
import swal from "sweetalert2";
import {makeDebounce} from "../../tools/inputs";
import {
    csrfToken,
    findAndGet,
    optionMapper,
    reactOptionMapper,
} from "../utils";
import BulkEditModal from "./BulkEditModal";
import MessageModal from "./MessageModal";
import SubPaymentList from "./SubPaymentList";
import DateRangePicker from "../utils/DateRangePicker";
import * as api from "../../tools/api";
import * as DuePaymentStatus from '../utils/DuePaymentStatuses'
import {UNPAID_ID} from "../utils/DuePaymentStatuses";


const moment = require("moment");
require("moment/locale/fr");

const FILTER_STORAGE_KEY = "general_due_payments_list_filters";

const defaultTableProps = () => ({
    page: 0,
    pageSize: 12,
    sorted: [{id: "previsional_date"}],
    filtered: [],
    resized: [],
    expanded: {},
});

const NB_DISPLAYED_RECIPIENTS = 3;
const MESSAGE_MODAL_ID = "messagesModal";
const BULK_MODAL_ID = "bulkEditModal";

const debounce = makeDebounce();

const requestData = (pageSize, page, sorted, filtered, format) => {
    return fetch(`/due_payments/list${format ? `.${format}` : ""}`, {
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
                    totalAmount: data.totalDueAmount,
                    totalPaidAmount: data.totalPaidAmount,
                };
            } else {
                return data;
            }
        });
};

class DuePaymentList extends React.Component {
    constructor(props) {
        super(props);

        const localStorageValue = localStorage.getItem(FILTER_STORAGE_KEY);
        const filter =
            localStorageValue != null
                ? JSON.parse(localStorageValue)
                : defaultTableProps();

        const duePaymentMethodsOptions = [
            {
                label: "Sans mode de règlement",
                value: "null",
            },
            ..._.map(this.props.paymentMethods, reactOptionMapper()),
        ];

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
                                    targetStatus: (this.state.data.filter(r => {return r.due_payment_status_id === DuePaymentStatus.UNPAID_ID})
                                                                  .map(r => r.id)),
                                })
                                : this.setState({
                                    targets: [],
                                    targetStatus: []
                                })
                        }
                    />
                ),
                Cell: d => (
                    <input
                        type="checkbox"
                        checked={this.state.targets === "all" || this.state.targets.includes(d.original.id)}
                        onChange={e => {
                                this.updateTarget(d.original.id, e.target.checked, d.original.due_payment_status_id)
                            }
                        }
                    />
                ),
            },
            {
                Header: "Validité",
                id: "validity",
                maxWidth: 50,
                accessor: d => this.state.validityMap[d.id],
                sortable: false,
                Filter: ({filter, onChange}) => {
                    const options = [
                        {value: null, color: "white"},
                        {value: "N", color: "#ff2e00"},
                        {value: "NE", color: "#ffbf00"},
                        {value: "E", color: "#57d500"},
                    ];

                    const value = options.find(
                        o => o.value == (filter && filter.value)
                    );

                    return (
                        <Select
                            options={options}
                            defaultValue={options[0]}
                            value={value}
                            onChange={v => onChange(v.value)}
                            isSearchable={false}
                            isMulti={false}
                            getOptionLabel={() => "●"}
                            styles={{
                                option: (styles, {data}) => {
                                    return {
                                        ...styles,
                                        color: data.color,
                                        fontSize: "25px",
                                    };
                                },
                                singleValue: (styles, {data}) => ({
                                    ...styles,
                                    color: data.color,
                                    fontSize: "25px",
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
                Cell: row => {
                    let color = "";

                    switch (row.value) {
                        case "N":
                            color = "#ff2e00";
                            break;
                        case "NE":
                            color = "#ffbf00";
                            break;
                        case "E":
                            color = "#57d500";
                            break;
                    }

                    return (
                        <div className="flex flex-center-start flex-center-justified">
                            <span style={{color, fontSize: "25px"}}>
                                &#x25cf;
                            </span>
                        </div>
                    );
                },
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
                id: "due_payment_status_id",
                maxWidth: 100,
                className: "flex flex-center-justified",
                accessor: d => d.due_payment_status_id,
                Cell: c => this.renderStatus(c),
                Filter: ({filter, onChange}) => (
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{width: "100%"}}
                        value={filter ? filter.value : ""}
                    >
                        <option value=""/>
                        {this.props.statuses.map(method => (
                            <option key={method.id} value={method.id}>
                                {method.label}
                            </option>
                        ))}
                    </select>
                ),
            },
            {
                Header: "Date prévisionnelle",
                id: "previsional_date",
                width: 250,
                accessor: d => moment(d.previsional_date).format("DD/MM/YYYY"),
                Filter: ({filter, onChange}) => {

                    let start = _.get(filter, "value.start");
                    let end = _.get(filter, "value.end");

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
                Header: "Mode règlement échéance",
                id: "payment_method_id",
                maxWidth: 300,
                accessor: d => {
                    const pm = _.find(
                        this.props.paymentMethods,
                        pm => pm.id == d.payment_method_id
                    );
                    return pm ? pm.label : "#";
                },
                sortable: false,
                Filter: ({filter, onChange}) => (
                    <Select
                        options={duePaymentMethodsOptions}
                        isMulti={true}
                        isClearable={true}
                        defaultValue={
                            filter &&
                            filter.value &&
                            duePaymentMethodsOptions.filter(o =>
                                filter.value.includes(o.value)
                            )
                        }
                        onChange={v =>
                            onChange((v.length && v.map(v => v.value)) || "")
                        }
                        styles={{
                            option: base => ({
                                ...base,
                                textAlign: "left",
                            }),
                            dropdownIndicator: base => ({
                                ...base,
                                display: "none",
                            }),
                        }}
                    />
                ),
            },
            {
                Header: "Payeur",
                maxWidth: 175,
                id: "payer_name",
                Cell: props => {
                    const user = _.get(props.original, "payment_schedule.user");
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
                filterable: false,
                sortable: false,
            },
            /* Retiré car plus utilisé */
            // {
            //     Header: "Actions",
            //     maxWidth: 75,
            //     id: "actions",
            //     filterable: false,
            //     sortable: false,
            //     accessor: d => ({
            //         userId: d.payment_schedule.payable_id,
            //         mail: this.state.validityMap[d.id] !== "E",
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
            validityMap: {},
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
                const validityMap = _.reduce(
                    res.data,
                    (acc, due) => {
                        let result = "N";

                        if (due.payments.length) {
                            const total = due.payments.reduce(
                                (n, p) => parseFloat(p.adjusted_amount) + n,
                                0
                            );

                            const difference = Math.abs(
                                parseFloat(due.adjusted_amount) - total
                            );

                            if (difference >= 0.01) {
                                result = "NE";
                            } else {
                                result = "E";
                            }
                        }

                        return {
                            ...acc,
                            [due.id]: result,
                        };
                    },
                    {}
                );

                this.setState({
                    ...res,
                    validityMap,
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

        const url = `/due_payments/export?${searchParams.toString()}`
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
                    ({id}) =>
                        this.state.targets.includes(id) &&
                        this.state.validityMap[id] === "N"
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
            text: "Voulez vous envoyer un mail de relance pour les paiements sélectionnés ?",
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
                        `/due_payments/send_payment_mail`,{
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
                fetch("/due_payments/edit_status", {
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
                            data: this.state.data.map(dp => {
                                if (dp.id === id) {
                                    return {
                                        ...dp,
                                        due_payment_status_id: parseInt(
                                            newStatusId
                                        ),
                                    };
                                }

                                return dp;
                            }),
                        });
                });
            }
        });
    }

    renderStatus(cell) {
        if (cell.value) {
            let status = this.props.statuses.find(s => s.id === cell.value);
            let dueId = cell.original.id;

            return status ? (
                <div
                    className="badge"
                    value={status.id}
                    style={{
                        background: status.color,
                        color: "white",
                        cursor: "pointer",
                    }}
                    onClick={e => this.promptStatusEdit(dueId, status.id)}
                >
                    {status.label}
                </div>
            ) : null;
        }
        return null;
    }

    updateTarget(id, checked, status) {
        if (checked) {
            //add target to bulk targets list
            this.setState({
                targets: [...this.state.targets, id]
            });

            if (status === DuePaymentStatus.UNPAID_ID)
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

    updateStatusTarget(id, checked, status) {
        if (checked) {
            this.setState({
                targetStatus: {
                    ...this.state.targetStatus,
                    [id]: status
                }
            })
        } else {
            this.setState({
                targetStatus: _.omit(this.state.targetStatus, id)
            })
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
                        Vous avez sélectionné {count} échéance(s){" "}
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
                                Envoyer un mail de relance aux paiements impayés
                            </button>
                        ) : ""}
                        <button
                            className="btn btn-sm btn-primary m-r"
                            data-toggle="modal"
                            data-target={`#${BULK_MODAL_ID}`}
                        >
                            Édition de masse
                        </button>
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
                "Voulez-vous supprimer toutes les échéances sélectionnées et les paiements associés ?",
            type: "question",
            showCancelButton: true,
        }).then(r => {
            if (r.value) {
                fetch("/due_payments/bulkdelete", {
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

    render() {
        const {data, pages, loading} = this.state;


        const totalRecipients = _.chain(this.state.data)
            .filter(
                d =>
                    this.state.validityMap[d.id] === "N" &&
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

        const events = []

        return (
            <div>
                <div
                    className="flex flex-space-between-justified flex-start-aligned reglement-table-header m-b-sm"
                    style={{width: "100%"}}
                >
                    <div className="flex flex-center-aligned">
                        <h2 className="m-r">
                            {this.state.rowsCount} échéances
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
                            className="btn btn-primary m-r-sm"
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
                            style={{width: "auto"}}
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
                    </div>

                    <div className="ibox-title-right">
                        <span>
                            Total échéances:{" "}
                            {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                            }).format(this.state.totalAmount)}
                        </span>

                        <span>
                            Total paiements:{" "}
                            {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                            }).format(this.state.totalPaidAmount)}
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
                        pageSizeOptions={[10, 12, 15, 20, 50, 100]}
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
                        minRows={10}
                        SubComponent={row => {
                            if (row.original.payments.length > 0) {
                                return (
                                    <SubPaymentList
                                        data={row.original.payments}
                                        original={row.original}
                                        paymentMethods={
                                            this.props.paymentMethods
                                        }
                                        locations={this.props.locations}
                                        minYear={this.props.minYear}
                                        maxYear={this.props.maxYear}
                                        statuses={this.props.paymentStatuses}
                                    />
                                );
                            }

                            return null;
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
                <BulkEditModal
                    id={BULK_MODAL_ID}
                    onChange={(k, v) =>
                        this.setState({
                            bulkEdit: {
                                ...this.state.bulkEdit,
                                [k]: v,
                            },
                        })
                    }
                    onSubmit={() => this.submitBulkEdit()}
                />
            </div>
        );
    }
}

export default DuePaymentList;
