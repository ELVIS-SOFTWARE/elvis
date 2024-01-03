import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

import ReactTable from "react-table";
import BulkEditModalAlert from "../utils/alerts/BulkEditModalAlert";

// import { ADHESION_PRICE } from "./PaymentsManagement";
import swal from "sweetalert2";
import {Fragment} from "@fullcalendar/react";
import {MONTHS} from "../courses/AddCourseSummary";

class DuePaymentsList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            numberOfDuePayments: 0,
            numberOfDuePaymentsSelect: 0,
            arbitraryNumberOfDuePayments: false,
            startingDate: "",
            areSpecialDues: false,
            specialDues: {},
            generatedDuePayments: [],
            duePaymentToEdit: {
                amount: "",
                previsional_date: null,
                payment_method_id: 0,
                due_payment_status_id: "",
            },
            adhesionIncluded: false,
            adhesionNewDuePayment: this.props.adhesionEnabled,
            isolateAdhesion: false,
            payment_method_id: 0,
            newDuePayment: {
                amount: "",
                previsional_date: null,
                payment_method_id: 0,
                payer: {...this.props.payer},
                isAdhesionDue: false,
            },
            selectedRows: [],
            bulkEdit: {},
        };
    }

    handleSelectPaymentMethodToGenerate(e) {
        this.setState({
            ...this.state,
            payment_method_id: e.target.value,
            generatedDuePayments: this.generateDuePayments({
                startingDate: this.state.startingDate,
                n: this.state.numberOfDuePayments,
                payment_method_id: e.target.value,
                specialDues: this.state.specialDues,
                adhesionNewDuePayment: this.state.adhesionNewDuePayment,
                isolateAdhesion: this.state.adhesionIsolated,
            }),
        });
    }

    handleCheckIsAdhesionDue() {
        const newDuePayment = {...this.state.newDuePayment};
        newDuePayment.isAdhesionDue = !newDuePayment.isAdhesionDue;

        newDuePayment.amount = _.round(this.props.adhesionEnabled ? this.props.itemsForPayment.filter(item => item.id == 0).reduce((acc, i) => acc + i.discountedTotal, 0) : 0, 2);
        this.setState({
            newDuePayment,
        });
    }

    handleChangeNewDuePaymentAmount(e) {
        this.setState({
            ...this.state,
            newDuePayment: {
                ...this.state.newDuePayment,
                amount: e.target.value,
            },
        });
    }

    handleChangeNewDuePaymentDate(e) {
        const newDate = e.target.valueAsDate;
        this.setState({
            newDuePayment: {
                ...this.state.newDuePayment,
                previsional_date: newDate,
            },
        });
    }

    handleSelectDuePaymentsNumber(e) {
        const numberOfDuePayments = e.target.value;
        if (numberOfDuePayments == 11) {
            this.setState({
                arbitraryNumberOfDuePayments: true,
                numberOfDuePayments: null,
                numberOfDuePaymentsSelect: 11,
            });
        } else {
            this.setState({
                numberOfDuePayments,
                generatedDuePayments: this.generateDuePayments({
                    startingDate: this.state.startingDate,
                    n: numberOfDuePayments,
                    payment_method_id: this.state.payment_method_id,
                    specialDues: this.state.specialDues,
                    adhesionNewDuePayment: this.state.adhesionNewDuePayment,
                    isolateAdhesion: this.state.adhesionIsolated,
                }),
                numberOfDuePaymentsSelect: numberOfDuePayments,
            });
        }
    }

    handleSelectStartingDate(e) {
        const startingDate = e.target.value;
        this.setState({
            startingDate,
            generatedDuePayments: this.generateDuePayments({
                startingDate,
                n: this.state.numberOfDuePayments,
                payment_method_id: this.state.payment_method_id,
                specialDues: this.state.specialDues,
                adhesionNewDuePayment: this.state.adhesionNewDuePayment,
                isolateAdhesion: this.state.adhesionIsolated,
            }),
        });
    }

    handleAddAdhesionToSchedule(e) {
        this.setState({adhesionIncluded: e.target.checked});
    }

    handleCreateDuePaymentForAdhesion(e) {
        this.setState({
            adhesionNewDuePayment: e.target.checked,
            generatedDuePayments: this.generateDuePayments({
                startingDate: this.state.startingDate,
                n: this.state.numberOfDuePayments,
                payment_method_id: this.state.payment_method_id,
                specialDues: this.state.specialDues,
                adhesionNewDuePayment: e.target.checked,
                isolateAdhesion: this.state.adhesionIsolated,
            })
        });
    }

    handleIsolateDuePaymentForAdhesion(e) {
        this.setState({
            adhesionIsolated: e.target.checked,
            generatedDuePayments: this.generateDuePayments({
                startingDate: this.state.startingDate,
                n: this.state.numberOfDuePayments,
                payment_method_id: this.state.payment_method_id,
                specialDues: this.state.specialDues,
                adhesionNewDuePayment: this.state.adhesionNewDuePayment,
                isolateAdhesion: e.target.checked,
            })
        });
    }

    handleSelectPaymentMethodForNewDuePayment(e) {
        this.setState({
            ...this.state,
            newDuePayment: {
                ...this.state.newDuePayment,
                payment_method_id: e.target.value,
            },
        });
    }

    handleSelectStatusForNewDuePayment(e) {
        this.setState({
            newDuePayment: {
                ...this.state.newDuePayment,
                due_payment_status_id: e.target.value || null,
            },
        });
    }

    //Conditions: a starting date, a number of dues and valid special dues (each one has both fields filled)
    canGenerateDuePayments(numberOfDuePayments, startingDate, specialDues) {
        const areSpecialDuesOK = _.reduce(specialDues, (acc, d) => acc && d.count && d.amount, true);
        return numberOfDuePayments > 0 && startingDate && areSpecialDuesOK;
    }

    generateDuePayments({
                            startingDate,
                            n,
                            payment_method_id = null,
                            specialDues = {},
                            adhesionNewDuePayment = false,
                            isolateAdhesion = false
                        }) {
        if (!this.canGenerateDuePayments(n, startingDate, specialDues))
            return this.state.generatedDuePayments;

        const number = parseInt(n, 10);
        let dates = [];
        if (startingDate) {
            if (number == 3) {
                dates = _.chain(0)
                    .range(parseInt(number, 10))
                    .map(inc => moment(startingDate).add(inc * 3, "month"))
                    .value();
            } else {
                dates = _.chain(0)
                    .range(parseInt(number, 10))
                    .map(n => moment(startingDate).add(n, "month"))
                    .value();
            }
        }

        const starting_number =
            this.props.data.length > 0
                ? _.chain(this.props.data)
                    .map(d => d.number)
                    .max()
                    .value()
                : 0;

        let results = [];
        let adhesionPrice = this.props.adhesionEnabled ? this.props.itemsForPayment.filter(item => item.id == 0).reduce((acc, i) => acc + i.discountedTotal, 0) : 0;

        adhesionPrice = _.round(adhesionPrice, 2);

        if (adhesionNewDuePayment && dates.length) {
            const date = _.head(dates);
            results.push({
                id: 0,
                amount: adhesionPrice,
                date: moment(date).hour(12),
                payment_method_id: payment_method_id,
            });
        }

        const totalLeft = this.props.itemsForPayment
            // On ne garde l'adhésion que dans le cas où
            // l'on veut créer une adh isolée
            .filter(item => adhesionNewDuePayment && isolateAdhesion || item.id !== 0)
            .reduce((acc, i) => acc + i.discountedTotal, 0) - _.reduce(specialDues, (acc, due) => acc + due.count * due.amount, 0);

        const duePayments = _.map(dates, (date, i) => {
            let amount = (totalLeft / number);

            if (i == 0 && adhesionNewDuePayment && isolateAdhesion)
                amount -= adhesionPrice;

            return {
                id: starting_number + i + 1,
                date: moment(date).hour(12),
                amount: _.floor(amount, 2),
                payment_method_id: payment_method_id,
                number: starting_number,
            };
        });

        _.each(specialDues, ({count, amount}, payment_method_id) => {
            for (let i = 0; i < count; i++) {
                duePayments.push({
                    id: starting_number + duePayments.length + 1,
                    date: moment(_.max(dates)).hour(12),
                    amount: _.floor(amount, 2),
                    payment_method_id,
                    number: starting_number,
                })
            }
        });

        return [...results, ...duePayments];
    }

    handleCreateDuePaymentSchedule() {
        this.props.handleCreatePaymentSchedule({
            duePayments: this.state.generatedDuePayments,
            payer: this.props.payer,
        });

        this.setState({
            selectedRows: [],
            numberOfDuePayments: 0,
            startingDate: "",
            generatedDuePayments: [],
        });
    }

    handleSelectDuePaymentToEdit(id) {
        const duePayment = _.find(this.props.data, d => d.id == id);
        this.setState({
            duePaymentToEdit: {
                ...duePayment,
                previsional_date:
                    duePayment.previsional_date != null
                        ? duePayment.previsional_date
                        : null,
            },
        });
    }

    handleChangeDuePaymentOperation(e) {
        this.setState({
            ...this.state,
            duePaymentToEdit: {
                ...this.state.duePaymentToEdit,
                operation: e.target.value,
            },
        });
    }

    handleChangeDuePaymentAmount(e) {
        this.setState({
            ...this.state,
            duePaymentToEdit: {
                ...this.state.duePaymentToEdit,
                amount: e.target.value,
            },
        });
    }

    handleChangeDuePaymentDate(e) {
        this.setState({
            ...this.state,
            duePaymentToEdit: {
                ...this.state.duePaymentToEdit,
                previsional_date: e.target.value,
            },
        });
    }

    handleSelectPaymentMethod(e) {
        this.setState({
            ...this.state,
            duePaymentToEdit: {
                ...this.state.duePaymentToEdit,
                payment_method_id: parseInt(e.target.value, 10),
            },
        });
    }

    handleSelectStatus(e) {
        this.setState({
            duePaymentToEdit: {
                ...this.state.duePaymentToEdit,
                due_payment_status_id: e.target.value || null,
            },
        });
    }

    handleArbitraryNumberOfDuePaymentChange(e) {
        let value = parseInt(e.target.value);
        if (value == null) {
            value = parseInt(value, 10);
        }
        this.setState({
            numberOfDuePayments: value, generatedDuePayments: this.generateDuePayments({
                startingDate: this.state.startingDate,
                n: value,
                payment_method_id: this.state.payment_method_id,
                specialDues: this.state.specialDues,
                adhesionNewDuePayment: this.state.adhesionNewDuePayment,
                isolateAdhesion: this.state.adhesionIsolated,
            })
        });
    }

    handleSaveDuePayment() {
        this.props.handleSaveDuePayment(
            this.state.duePaymentToEdit,
            this.props.payer.id
        );
        this.setState({
            ...this.state,
            duePaymentToEdit: {
                amount: "",
                previsional_date: new Date().toISOString().split("T")[0],
                payment_method_id: 0,
            },
        });
    }

    handleAllRowsSelected(e) {
        const selectedRows = e.target.checked
            ? this.props.data.map(dP => dP.id)
            : [];
        this.setState({selectedRows});
    }

    handleRowSelected(e) {
        const id = parseInt(e.target.value);
        const selectedRows = this.state.selectedRows.slice();
        const idx = selectedRows.indexOf(id);

        if (idx === -1) selectedRows.push(id);
        else selectedRows.splice(idx, 1);

        this.setState({
            selectedRows,
        });
    }

    handleBulkEditChange(e) {
        const bulkEdit = {...this.state.bulkEdit};

        const target = e.target.name;
        if (target == "amount") {
            if (e.target.value != "") {
                bulkEdit[target] = parseFloat(e.target.value.replace(",", "."));
            }
        } else {
            bulkEdit[target] = parseInt(e.target.value, 10);
        }

        this.setState({
            bulkEdit,
        });
    }

    handleBulkEditCommit() {
        this.props.handleBulkEditCommit(
            this.props.payer.id,
            this.state.selectedRows,
            this.state.bulkEdit
        );
    }

    handleBulkDelete() {
        if (this.state.selectedRows.length > 0)
            swal({
                title: "Suppression en masse",
                text: `Êtes-vous sûr de vouloir supprimer ces ${this.state.selectedRows.length
                } échéances ?`,
                type: "warning",
                confirmButtonText: "Oui !",
                showCancelButton: true,
                cancelButtonText: "Annuler",
            }).then(v => {
                if (v.value) {
                    this.props.handleBulkDelete(
                        this.props.payer.id,
                        this.state.selectedRows
                    );
                }
            });
    }

    renderStatus(cell) {
        if (cell.value) {
            let status = _.find(
                this.props.statuses,
                status => status.id == cell.value
            );

            return status ? (
                <div
                    className="badge"
                    value={status.id}
                    style={{
                        background: status.color,
                        color: "white",
                    }}
                    onClick={e =>
                        this.promptStatusEdit(cell.original.id, status.id)
                    }
                >
                    {status.label}
                </div>
            ) : null;
        }
        return null;
    }

    render() {
        const selectedRows = this.state.selectedRows;
        const headSelectorColumn =
            [{
                Header: () => (
                    <input
                        type="checkbox"
                        checked={this.state.selectedRows.length && this.state.selectedRows.length === this.props.data.length}
                        onChange={e => this.handleAllRowsSelected(e)}
                    />
                ),
                sortable: false,
                Cell: d => (
                    <input
                        type="checkbox"
                        value={d.original.id}
                        checked={selectedRows.includes(d.original.id)}
                        onChange={e => this.handleRowSelected(e)}
                    />
                ),
                width: 25,
                className: "flex flex-center-justified",
            }];
        let columns = [
            {
                Header: "N°",
                id: "number",
                maxWidth: 30,
                accessor: d => d.number,
            },
            {
                Header: "Statut",
                id: "payment_status_id",
                maxWidth: 75,
                className: "flex flex-center-justified",
                accessor: d => d.due_payment_status_id,
                Cell: c => this.renderStatus(c),
            },
            {
                Header: "Date",
                id: "date",
                accessor: d =>
                    d.previsional_date != null
                        ? moment(d.previsional_date).format("DD-MM-YYYY")
                        : null,
            },
            {
                Header: "Mode",
                id: "payment_method",
                accessor: d => {
                    const pm = _.find(
                        this.props.paymentMethods,
                        pm => pm.id == d.payment_method_id
                    );
                    return pm ? pm.label : null;
                },
            },
            {
                Header: "Montant",
                id: "amount",
                width: 100,
                style: {
                    display: "block",
                    textAlign: "right",
                },
                accessor: d => `(${d.operation}) ${d.amount} €`,
            },
            {
                Header: "Actions",
                id: "actions",
                sortable: false,
                style: {
                    display: "block",
                    textAlign: "right",
                },
                Cell: props => {

                    return (
                        <div className="flex flex-center-justified">
                            {this.props.isStudentView ?
                                "" :
                                <Fragment>
                                    <button
                                        className="btn btn-primary btn-xs m-r-sm"
                                        data-toggle="modal"
                                        data-target={`#due-payments-modal-edit-${this.props.payer.id
                                        }`}
                                        key="edit"
                                        onClick={id =>
                                            this.handleSelectDuePaymentToEdit(
                                                props.original.id
                                            )
                                        }
                                    >
                                        <i className="fas fa-edit"/>
                                    </button>
                                    <button
                                        className="btn btn-xs btn-warning m-r-sm"
                                        key="delete"
                                        onClick={id =>
                                            this.props.handleDeleteDuePayment(
                                                props.original.id,
                                                this.props.payer.id
                                            )
                                        }
                                    >
                                        <i className="fas fa-trash"/>
                                    </button>
                                </Fragment>
                            }

                            {(this.props.extraButtons || []).map((button) => {
                                if (button.shouldDisplay != undefined && button.shouldDisplay(props.original.id))
                                    return (
                                        <button
                                            className={button.class}
                                            key={button.key}
                                            onClick={() => button.onClick(props.original.id)}
                                        >
                                            <i className={button.icon}/>
                                        </button>
                                    );
                                else
                                    return "";
                            })}
                        </div>
                    );
                },
            },
        ];

        if (this.props.isStudentView != true)
            columns = headSelectorColumn.concat(columns);

        return (
            <div className="ibox m-b-md">
                <div className="ibox-title">
                    <h5>Échéancier </h5>
                    {this.props.isStudentView ?
                        "" :
                        <div className="ibox-tools">
                            <button
                                className="btn btn-primary btn-xs dropdown-toggle"
                                type="button"
                                id="dropdownMenu1"
                                data-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="true"
                            >
                                Actions échéancier <span className="caret"/>
                            </button>
                            <ul
                                className="dropdown-menu"
                                aria-labelledby="dropdownMenu1"
                            >
                                <li>
                                    <a
                                        href="#"
                                        data-toggle="modal"
                                        data-target={`#due-payments-modal-${this.props.payer.id
                                        }`}
                                    >
                                        <i className="fas fa-calendar m-r-sm"/>
                                        Créer l’échéancier
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        data-toggle="modal"
                                        data-target={`#due-payment-modal-${this.props.payer.id
                                        }`}
                                        disabled={
                                            this.state.selectedRows.length === 0
                                        }
                                    >
                                        <i className="fas fa-plus m-r-sm"/>
                                        Créer une échéance unique
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        data-toggle="modal"
                                        data-target={`#due-payment-bulk-edit-modal-${this.props.payer.id
                                        }`}
                                    >
                                        <i className="fas fa-edit m-r-sm"/>
                                        Edition de masse
                                    </a>
                                </li>
                                <li>
                                    <a
                                        onClick={() =>
                                            this.props.handleCreatePayments(
                                                this.props.payer.id,
                                                this.state.selectedRows
                                            )
                                        }
                                    >
                                        <i className="fas fa-arrow-right m-r-sm"/>
                                        Générer les règlements
                                    </a>
                                </li>
                                <li className="dropdown-divider"/>
                                <li>
                                    <a onClick={() => this.handleBulkDelete()}>
                                        <i className="fas fa-trash m-r-sm"/>
                                        Suppression de masse
                                    </a>
                                </li>
                            </ul>
                        </div>
                    }
                </div>

                <ReactTable
                    data={this.props.data}
                    columns={columns}
                    defaultSorted={[{id: "number", desc: true}]}
                    resizable={false}
                    previousText="Précedent"
                    nextText="Suivant"
                    loadingText="Chargement..."
                    noDataText="Aucune donnée"
                    pageText="Page"
                    ofText="sur"
                    rowsText="résultats"
                    minRows={1}
                    showPagination={false}
                    className="whitebg"
                />

                <div
                    className="modal inmodal"
                    id={`due-payment-modal-${this.props.payer.id}`}
                    tabIndex="-1"
                    role="dialog"
                    aria-hidden="true"
                >
                    <div className="modal-dialog">
                        <div className="modal-content animated">
                            <div className="modal-header">
                                <h3> Création d’une échéance </h3>
                            </div>
                            <div className="modal-body">
                                {this.alertPaymentTerm(this.props.payer, this.props.seasonId)}

                                {this.props.adhesionEnabled && <div className="form-group">
                                    <input
                                        type="checkbox"
                                        id="forAdhesionDue"
                                        style={{marginRight: "5px"}}
                                        onClick={e =>
                                            this.handleCheckIsAdhesionDue(e)
                                        }
                                    />
                                    <label htmlFor="forAdhesionDue">Échéance pour adhésion.s</label>
                                </div>}
                                <div className="form-group">
                                    <label>Montant</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="XX €"
                                        value={
                                            this.state.newDuePayment.amount ||
                                            ""
                                        }
                                        onChange={e =>
                                            this.handleChangeNewDuePaymentAmount(
                                                e
                                            )
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date prévisionnelle</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        onChange={e =>
                                            this.handleChangeNewDuePaymentDate(
                                                e
                                            )
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mode de Paiement</label>
                                    <select
                                        className="form-control"
                                        defaultValue="placeholder"
                                        onChange={e =>
                                            this.handleSelectPaymentMethodForNewDuePayment(
                                                e
                                            )
                                        }
                                    >
                                        <option value="placeholder" disabled>
                                            Selectionnez un mode de paiement
                                        </option>
                                        <option value=""/>
                                        {_.map(
                                            this.props.paymentMethods,
                                            (pm, i) => {
                                                return (
                                                    <option
                                                        key={i}
                                                        value={pm.id}
                                                    >
                                                        {pm.label}
                                                    </option>
                                                );
                                            }
                                        )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Statut</label>
                                    <select
                                        className="form-control"
                                        defaultValue=""
                                        onChange={e =>
                                            this.handleSelectStatusForNewDuePayment(
                                                e
                                            )
                                        }
                                    >
                                        <option value="">Pas de statut</option>
                                        {this.props.statuses.map(status => (
                                            <option
                                                key={status.id}
                                                value={status.id}
                                            >
                                                {status.label}
                                            </option>
                                        ))}
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
                                    className="btn btn-primary"
                                    data-dismiss="modal"
                                    onClick={() =>
                                        this.props.handleSaveNewDuePayment(
                                            this.state.newDuePayment
                                        )
                                    }
                                >
                                    <i className="fas fa-save m-r-sm"></i>
                                    Sauvegarder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="modal inmodal"
                    id={`due-payment-bulk-edit-modal-${this.props.payer.id}`}
                    tabIndex="-1"
                    role="dialog"
                    aria-hidden="true"
                >
                    <div className="modal-dialog">
                        <div className="modal-content animated">
                            <div className="modal-header">
                                <h3> Modification d’échéances </h3>
                            </div>
                            <BulkEditModalAlert/>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Montant</label>
                                    <div className="flex">
                                        <select
                                            name="operation"
                                            defaultValue={""}
                                            onChange={e => this.handleBulkEditChange(e)}>
                                            <option value=""></option>
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                            <option value="0">0</option>
                                        </select>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="XX €"
                                            name="amount"
                                            onChange={this.handleBulkEditChange.bind(
                                                this
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Mode de Paiement</label>
                                    <select
                                        className="form-control"
                                        name="payment_method_id"
                                        onChange={this.handleBulkEditChange.bind(
                                            this
                                        )}
                                        defaultValue="placeholder"
                                    >
                                        <option value="placeholder" disabled>
                                            Selectionnez un mode de paiement
                                        </option>
                                        <option value=""/>
                                        {_.map(
                                            this.props.paymentMethods,
                                            (pm, i) => {
                                                return (
                                                    <option
                                                        key={i}
                                                        value={pm.id}
                                                    >
                                                        {pm.label}
                                                    </option>
                                                );
                                            }
                                        )}
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
                                    className="btn btn-primary"
                                    data-dismiss="modal"
                                    disabled={
                                        Object.keys(this.state.bulkEdit)
                                            .length === 0
                                    }
                                    onClick={() => this.handleBulkEditCommit()}
                                >
                                    <i className="fas fa-edit m-r-sm"></i>
                                    Editer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="modal inmodal"
                    id={`due-payments-modal-edit-${this.props.payer.id}`}
                    tabIndex="-1"
                    role="dialog"
                    aria-hidden="true">
                    <div className="modal-dialog">
                        <div className="modal-content animated">
                            <div className="modal-header">
                                <h3>
                                    Edition de l’échéance n°{" "}
                                    {this.state.duePaymentToEdit.number}
                                </h3>
                            </div>
                            <div className="modal-body">
                                {this.alertPaymentTerm(this.props.payer, this.props.seasonId)}
                                <div className="form-group">
                                    <label>Montant</label>
                                    <div className="flex">
                                        <select
                                            name="operation"
                                            value={this.state.duePaymentToEdit.operation}
                                            defaultValue={"+"}
                                            onChange={e => this.handleChangeDuePaymentOperation(e)}>
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                            <option value="0">0</option>
                                        </select>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={
                                                this.state.duePaymentToEdit.amount || ""
                                            }
                                            onChange={e =>
                                                this.handleChangeDuePaymentAmount(e)
                                            }/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Date prévisionnelle</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={
                                            this.state.duePaymentToEdit
                                                .previsional_date || ""
                                        }
                                        onChange={e =>
                                            this.handleChangeDuePaymentDate(e)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mode de Paiement</label>
                                    <select
                                        className="form-control"
                                        value={
                                            this.state.duePaymentToEdit
                                                .payment_method_id
                                        }
                                        onChange={e =>
                                            this.handleSelectPaymentMethod(e)
                                        }
                                    >
                                        <option value={0} disabled>
                                            Selectionnez un mode de paiement
                                        </option>
                                        <option value=""/>
                                        {_.map(
                                            this.props.paymentMethods,
                                            (pm, i) => {
                                                return (
                                                    <option
                                                        key={i}
                                                        value={pm.id}
                                                    >
                                                        {pm.label}
                                                    </option>
                                                );
                                            }
                                        )}
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
                                    className="btn btn-primary"
                                    data-dismiss="modal"
                                    onClick={() => this.handleSaveDuePayment()}
                                >
                                    <i className="fas fa-save m-r-sm"></i>
                                    Sauvegarder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className="modal inmodal"
                    id={`due-payments-modal-${this.props.payer.id}`}
                    tabIndex="-1"
                    role="dialog"
                    aria-hidden="true"
                >
                    <div className="modal-dialog">
                        <div className="modal-content animated">
                            <div className="modal-header">
                                <h3>Nouvel échéancier</h3>
                            </div>
                            <div className="modal-body">
                                {this.alertPaymentTerm(this.props.payer, this.props.seasonId)}

                                {this.props.adhesionEnabled &&
                                    <Fragment>
                                        <div className="form-group">
                                            <div className="checkbox checkbox-primary">
                                                <input
                                                    type="checkbox"
                                                    id="new"
                                                    name="new"
                                                    checked={
                                                        this.state.adhesionNewDuePayment
                                                    }
                                                    onChange={e =>
                                                        this.handleCreateDuePaymentForAdhesion(
                                                            e
                                                        )
                                                    }
                                                />
                                                <label
                                                    className="control-label"
                                                    htmlFor="new"
                                                >
                                                    Créer une échéance d'adhésion
                                                </label>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <div className="checkbox checkbox-primary">
                                                <input
                                                    type="checkbox"
                                                    id="isolate"
                                                    name="isolate"
                                                    checked={
                                                        this.state.isolateAdhesion
                                                    }
                                                    onChange={e => this.handleIsolateDuePaymentForAdhesion(e)}
                                                />
                                                <label
                                                    className="control-label"
                                                    htmlFor="isolate">
                                                    Montant adhésion à déduire de la première échéance
                                                </label>
                                            </div>
                                        </div>
                                    </Fragment>}
                                <div className="form-group">
                                    <div className="checkbox checkbox-primary">
                                        <input
                                            type="checkbox"
                                            onChange={e => this.setState({
                                                areSpecialDues: e.target.checked,
                                                specialDues: {},
                                                generatedDuePayments: this.generateDuePayments({
                                                    startingDate: this.state.startingDate,
                                                    n: this.state.numberOfDuePayments,
                                                    payment_method_id: this.state.payment_method_id,
                                                    adhesionNewDuePayment: this.state.adhesionNewDuePayment,
                                                    isolateAdhesion: this.state.adhesionIsolated,
                                                }),
                                            })}
                                            checked={this.state.areSpecialDues}
                                            id={"special"}/>
                                        <label
                                            className="control-label"
                                            htmlFor="special">
                                            Échéances spéciales
                                        </label>
                                    </div>
                                </div>
                                {
                                    this.state.areSpecialDues ?
                                        <div className="form-group">
                                            <label>Echeances spéciales</label>
                                            <table className="table table-bordered">
                                                <thead>
                                                <tr>
                                                    <th>Moyen de paiement</th>
                                                    <th>Nombre échéances</th>
                                                    <th>Montant</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {
                                                    _(this.props.paymentMethods)
                                                        .filter(pm => pm.is_special === true)
                                                        .map(pm => <tr key={pm.id}>
                                                            <td>{pm.label}</td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    onKeyUp={e => {
                                                                        const specialDues = {
                                                                            ...this.state.specialDues,
                                                                            [pm.id]: {
                                                                                ...this.state.specialDues[pm.id] || {},
                                                                                count: parseInt(e.target.value) || 0,
                                                                            },
                                                                        };
                                                                        this.setState({
                                                                            specialDues,
                                                                            generatedDuePayments: this.generateDuePayments({
                                                                                startingDate: this.state.startingDate,
                                                                                n: this.state.numberOfDuePayments,
                                                                                payment_method_id: this.state.payment_method_id,
                                                                                specialDues,
                                                                                adhesionNewDuePayment: this.state.adhesionNewDuePayment,
                                                                                isolateAdhesion: this.state.adhesionIsolated,
                                                                            })
                                                                        })
                                                                    }}/>
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    onKeyUp={e => {
                                                                        const specialDues = {
                                                                            ...this.state.specialDues,
                                                                            [pm.id]: {
                                                                                ...this.state.specialDues[pm.id],
                                                                                amount: parseFloat(e.target.value) || 0,
                                                                            },
                                                                        };

                                                                        this.setState({
                                                                            specialDues,
                                                                            generatedDuePayments: this.generateDuePayments({
                                                                                startingDate: this.state.startingDate,
                                                                                n: this.state.numberOfDuePayments,
                                                                                payment_method_id: this.state.payment_method_id,
                                                                                specialDues,
                                                                                adhesionNewDuePayment: this.state.adhesionNewDuePayment,
                                                                                isolateAdhesion: this.state.adhesionIsolated,
                                                                            })
                                                                        })
                                                                    }}/>
                                                            </td>
                                                        </tr>)
                                                        .value()
                                                }
                                                </tbody>
                                            </table>
                                        </div>
                                        : null
                                }
                                <div className="form-group">
                                    <label>Nombre d’échéances</label>
                                    <select
                                        className="form-control"
                                        value={
                                            this.state.numberOfDuePaymentsSelect
                                        }
                                        onChange={e =>
                                            this.handleSelectDuePaymentsNumber(
                                                e
                                            )
                                        }
                                    >
                                        <option value={0} disabled>
                                            Sélectionnez un nombre d’échéances
                                        </option>
                                        <option value={1}>Annuel (1)</option>
                                        <option value={3}>
                                            Trimestriel (3)
                                        </option>
                                        <option value={10}>Mensuel (10)</option>
                                        <option value={11}>Autre</option>
                                    </select>

                                    {this.state.arbitraryNumberOfDuePayments ? (
                                        <input
                                            type="text"
                                            className="form-control m-t-md"
                                            value={
                                                this.state.numberOfDuePayments
                                            }
                                            onChange={e =>
                                                this.handleArbitraryNumberOfDuePaymentChange(
                                                    e
                                                )
                                            }
                                        />
                                    ) : null}
                                </div>
                                <div className="form-group">
                                    <label>Date de la première échéance</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={this.state.startingDate}
                                        onChange={e =>
                                            this.handleSelectStartingDate(e)
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mode de Paiement</label>
                                    <select
                                        className="form-control"
                                        value={this.state.payment_method_id}
                                        onChange={e =>
                                            this.handleSelectPaymentMethodToGenerate(
                                                e
                                            )
                                        }
                                    >
                                        <option value="placeholder" disabled>
                                            Selectionnez un mode de paiement
                                        </option>
                                        <option value=""/>
                                        {_(this.props.paymentMethods)
                                            .filter(pm => !pm.is_special)
                                            .map((pm, i) => {
                                                return (
                                                    <option
                                                        key={i}
                                                        value={pm.id}
                                                    >
                                                        {pm.label}
                                                    </option>
                                                );
                                            })
                                            .value()
                                        }
                                    </select>
                                </div>

                                {this.state.generatedDuePayments &&
                                this.state.generatedDuePayments.length &&
                                this.state.startingDate != "" > 0 ? (
                                    <table className="table">
                                        <thead>
                                        <tr>
                                            <th>N°</th>
                                            <th>Moyen de paiement</th>
                                            <th>Date</th>
                                            <th>Montant</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {_.map(
                                            this.state.generatedDuePayments,
                                            (dp, i) => (
                                                <tr key={i}>
                                                    <td>{dp.id}</td>
                                                    <td>{(() => {
                                                        const pm = this.props.paymentMethods.find(pm => pm.id == dp.payment_method_id)
                                                        return pm && pm.label
                                                    })()}</td>
                                                    <td>
                                                        {dp.date.format(
                                                            "DD-MM-YYYY"
                                                        )}
                                                    </td>
                                                    <td>{dp.amount} €</td>
                                                </tr>
                                            )
                                        )}
                                        </tbody>
                                    </table>
                                ) : null}
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
                                    className="btn btn-primary"
                                    data-dismiss="modal"
                                    onClick={() =>
                                        this.handleCreateDuePaymentSchedule()
                                    }
                                >
                                    <i className="fas fa-check m-r-sm"></i>
                                    Valider
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    alertPaymentTerm(payer, seasonId)
    {
        if(!payer.payer_payment_terms || payer.payer_payment_terms.filter(ppt => ppt.season_id === seasonId).length === 0)
            return "";

        const ppt = payer.payer_payment_terms.filter(ppt => ppt.season_id === seasonId)[0];
        const payment_term = ppt.payment_terms;

        return <div className={"alert alert-info"}>
            L'élève à renseigné la préférence suivante dans ses modalités de paiement: <br/>

            <strong>{payment_term.label}</strong> ({MONTHS.filter((m, i) => payment_term.collect_on_months.includes(i)).join(", ")}) avec un prélèvement le {payment_term.days_allowed_for_collection[ppt.day_for_collection]} du mois
        </div>
    }
}

export default DuePaymentsList;
