import React, {Fragment} from "react";
import _ from "lodash";
import swal from "sweetalert2";
import * as api from "../../tools/api";

const moment = require("moment");
require("moment/locale/fr");

import ReactTable from "react-table";

import BulkEditModalAlert from "../utils/alerts/BulkEditModalAlert";
import {csrfToken, ISO_DATE_FORMAT} from "../utils";
import {redirectTo} from "../../tools/url";

class PaymentsList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            //data: this.props.payments,
            payment_method_id: 0,
            payment_status_id: 0,
            due_payment_id: 0,
            amount: "",
            reception_date: "",
            cashing_date: "",
            check_number: "",
            check_issuer_name: "",
            bulkEdit: {},
            selectedRows: [],
        };
    }

    handleSelectPaymentMethod(e) {
        this.setState({
            payment_method_id: parseInt(e.target.value),
        });
    }

    handleSelectDuePayment(e) {
        this.setState({
            due_payment_id: e.target.value,
            amount: _.find(this.props.duePayments, d => d.id == e.target.value)
                .amount,
        });
    }

    handleChangeOperation(e) {
        this.setState({operation: e.target.value});
    }

    handleChangeAmount(e) {
        this.setState({amount: e.target.value});
    }

    handleChangeReceptionDate(e) {
        this.setState({reception_date: e.target.value});
    }

    handleChangeCashingDate(e) {
        this.setState({cashing_date: e.target.value});
    }

    handleChangeCheckNumber(e) {
        this.setState({check_number: e.target.value});
    }

    handleChangeCheckIssuerName(e) {
        this.setState({check_issuer_name: e.target.value});
    }

    handleSelectStatus(e) {
        this.setState({payment_status_id: e.target.value});
    }

    handleCreatePayment() {
        this.props.handleCreateNewPayment({
            ...this.state,
            payer: this.props.payer,
        });

        this.setState({
            payment_method_id: 0,
            due_payment_id: 0,
            amount: "",
            reception_date: "",
            cashing_date: "",
            check_number: "",
            check_issuer_name: "",
        });
    }

    handleSelectPaymentToEdit(id) {
        const payment = _.find(this.props.payments, p => p.id == id);

        this.setState({
            payment_method_id: payment.payment_method_id,
            due_payment_id: payment.due_payment_id,
            amount: payment.amount,
            reception_date: moment(payment.reception_date).format(ISO_DATE_FORMAT),
            cashing_date: moment(payment.cashing_date).format(ISO_DATE_FORMAT),
            operation: payment.operation,
            id: payment.id,
            payment_status_id: payment.payment_status_id,
            check_number: payment.check_number,
            check_issuer_name: payment.check_issuer_name,
        });
    }

    handleAllRowsSelected(e) {
        const selectedRows = e.target.checked
            ? this.props.payments.map(p => p.id)
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

        let val = e.target.value;

        if (![
            "cashing_date",
            "reception_date",
            "emitter",
            "operation"
        ].includes(e.target.name))
            val = parseFloat(val);

        bulkEdit[e.target.name] = val;

        this.setState({
            bulkEdit,
        });
    }

    handleBulkEditCommit() {
        this.props.handleBulkEditPayments(
            this.props.payer.id,
            this.state.selectedRows,
            this.state.bulkEdit
        );
    }

    handleBulkDelete() {
        if (this.state.selectedRows.length > 0)
            swal({
                title: "Suppression en masse",
                text: `Êtes-vous sûr de vouloir supprimer ces ${
                    this.state.selectedRows.length
                } échéances ?`,
                type: "warning",
                confirmButtonText: "Oui !",
                showCancelButton: true,
                cancelButtonText: "Annuler",
            }).then(v => {
                if (v.value)
                    this.props.handleBulkDelete(
                        this.props.payer.id,
                        this.state.selectedRows
                    );
            });
    }

    handleIssuedPaidInvoice(payerId) {
        const payer_id = payerId;

        api.set()
            .success(res => {
                const pdfUrl = res.url;
                if (pdfUrl) {
                    window.open(pdfUrl, "_blank");
                }

                swal({
                    title: "La facture a été éditée avec succès !",
                    type: "success",
                });
            })
            .error((res) => {
                swal({
                    title: "Une erreur est survenue lors de l'édition de la facture.",
                    type: "error",
                    text: res.error
                });
                this.setState({isFetching: false});
            })
            .post(
                `/api/student_payments/invoice/${payer_id}/issued_paid_invoice`,
                {
                    payer: payer_id,
                }
            );

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
                        this.props.handlePromptStatusEdit(this.props.payer, cell.original.id, status.id)
                    }>
                    {status.label}
                </div>
            ) : null;
        }
        return null;
    }


    render() {
        const duePayments = this.props.duePayments;
        const settledDuePaymentsIds = _.map(
            this.props.payments,
            d => d.due_payment_id
        );

        const selectedRows = this.state.selectedRows;
        const headSelectorColumn =
            [{
                Header: () => (
                    <input
                        type="checkbox"
                        checked={this.state.selectedRows.length && this.state.selectedRows.length === _.get(this.props, "payments.length")}
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
                width: 30,
                id: "due_payment_number",
                accessor: d => {
                    const due = _.find(
                        duePayments,
                        dp => dp.id == d.due_payment_id
                    );
                    if (due) {
                        return due.number;
                    }
                    return null;
                },
            },
            {
                Header: "Statut",
                id: "payment_status_id",
                maxWidth: 75,
                className: "flex flex-center-justified",
                accessor: d => d.payment_status_id,
                Cell: c => this.renderStatus(c),
            },
            {
                Header: "Mode",
                id: "payment_type",
                accessor: d => {
                    const pm = _.find(
                        this.props.paymentMethods,
                        pm => pm.id == d.payment_method_id
                    );
                    return pm ? pm.label : null;
                },
            },
            {
                Header: "Réception",
                id: "reception_date",
                maxWidth: 100,
                accessor: d =>
                    d.reception_date
                        ? moment(d.reception_date).format("DD-MM-YYYY")
                        : "",
            },
            {
                Header: "Encaissement",
                id: "cashing_date",
                maxWidth: 100,
                accessor: d =>
                    d.cashing_date
                        ? moment(d.cashing_date).format("DD-MM-YYYY")
                        : "",
            },
            {
                Header: "# Chèque",
                id: "check_number",
                maxWidth: 150,
                style: {
                    display: "block",
                    textAlign: "right",
                },
                accessor: d => d.check_number,
            },
            // {
            //     Header: "Emetteur",
            //     id: "check_issuer_name",
            //     maxWidth: 150,
            //     style: {
            //         display: "block",
            //         textAlign: "right",
            //     },
            //     accessor: d => d.check_issuer_name,
            // },
            {
                Header: "Montant",
                id: "amount",
                maxWidth: 100,
                style: {
                    display: "block",
                    textAlign: "right",
                },
                accessor: d => `(${d.operation}) ${d.amount} €`,
            },
            {
                Header: "Actions",
                id: "receipt",
                style: {
                    display: "block",
                    textAlign: "right",
                },
                Cell: row => (
                    <div className="flex flex-center-justified">
                        {this.props.isStudentView ?
                            "" :
                            <Fragment>
                                <button
                                    className="btn btn-xs btn-primary m-r-xs"
                                    data-toggle="modal"
                                    data-target={`#payments-modal-${this.props.payer.id}`}
                                    onClick={id => this.handleSelectPaymentToEdit(row.original.id)}
                                >
                                    <i className="fas fa-edit"/>
                                </button>
                                <button
                                    className="btn btn-xs btn-warning m-r-xs"
                                    onClick={id => this.props.handleDeletePayment(row.original.id, this.props.payer.id)}
                                >
                                    <i className="fas fa-trash"/>
                                </button>
                            </Fragment>
                        }

                        {(this.props.extraButtons || []).map((button) => {
                            if (button.shouldDisplay != undefined && button.shouldDisplay(row.original.id))
                                return (
                                    <button
                                        className={button.class}
                                        onClick={() => button.onClick(row.original.id)}
                                    >
                                        <i className={button.icon}/>
                                    </button>
                                );
                            else
                                return "";
                        })}
                    </div>
                ),
            },
        ];

        if (this.props.isStudentView != true)
            columns = headSelectorColumn.concat(columns);

        return (
            <div className="ibox">
                <div className="ibox-title">
                    <h5>Règlements </h5>
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
                                Actions règlements <span className="caret"/>
                            </button>

                            <ul
                                className="dropdown-menu"
                                aria-labelledby="dropdownMenu1"
                            >
                                <li>
                                    <a
                                        href="#"
                                        data-toggle="modal"
                                        data-target={`#payments-modal-${
                                            this.props.payer.id
                                        }`}
                                    >
                                        <i className="fas fa-plus m-r-sm"/>
                                        Nouveau règlement
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#"
                                        data-toggle="modal"
                                        data-target="#payment-bulk-edit-modal"
                                        disabled={
                                            this.state.selectedRows.length === 0
                                        }
                                    >
                                        <i className="fas fa-edit m-r-sm"/>
                                        Edition de masse
                                    </a>
                                </li>
                                <li className="dropdown-divider"/>
                                <li>
                                    <a onClick={() => this.handleBulkDelete()}>
                                        <i className="fas fa-trash m-r-sm"/>
                                        Suppression de masse
                                    </a>
                                </li>
                                <li>
                                    <a onClick={() => this.handleIssuedPaidInvoice(
                                        this.props.payer.id
                                    )}>
                                        <i className="fas fa-receipt m-r-sm"/>
                                        Éditer facture (acquittée)
                                    </a>
                                </li>
                            </ul>
                        </div>
                    }
                </div>

                <ReactTable
                    data={this.props.payments}
                    columns={columns}
                    resizable={false}
                    defaultSorted={[{id: "due_payment_number", desc: true}]}
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
                    id={`payments-modal-${this.props.payer.id}`}
                    tabIndex="-1"
                    role="dialog"
                    aria-hidden="true"
                >
                    <div className="modal-dialog">
                        <div className="modal-content animated">
                            <div className="modal-header">
                                <h3>
                                    {this.state.id != null
                                        ? "Edition Règlement"
                                        : "Nouveau Règlement"}
                                </h3>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Mode de Paiement</label>
                                    <select
                                        className="form-control"
                                        value={this.state.payment_method_id}
                                        onChange={e =>
                                            this.handleSelectPaymentMethod(e)
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
                                    <label>Choix de l'échéance</label>
                                    <select
                                        className="form-control"
                                        value={this.state.due_payment_id}
                                        onChange={e =>
                                            this.handleSelectDuePayment(e)
                                        }
                                    >
                                        <option value={0}>
                                            Selectionnez une échéance
                                        </option>
                                        {_(duePayments)
                                            .sortBy(d => d.number)
                                            .map((dp, i) => {
                                                return (
                                                    <option key={i} value={dp.id}>
                                                        {dp.number == 0
                                                            ? "Adhésion"
                                                            : `Echéance N°${
                                                                dp.number
                                                            }`}
                                                    </option>
                                                );
                                            })
                                            .value()}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Montant (€)</label>
                                    <div className="flex">
                                        <select
                                            name="operation"
                                            value={this.state.operation}
                                            defaultValue={"+"}
                                            onChange={e => this.handleChangeOperation(e)}>
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                            <option value="0">0</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={this.state.amount}
                                            onChange={e =>
                                                this.handleChangeAmount(e)
                                            }
                                            className="form-control"
                                            placeholder="XX €"/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Statut</label>
                                    <select
                                        className="form-control"
                                        name="status"
                                        onChange={this.handleSelectStatus.bind(
                                            this
                                        )}
                                        value={this.state.payment_status_id}
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
                                {this.state.payment_method_id == 2 ? (
                                    <React.Fragment>
                                        <div className="form-group">
                                            <label>Date de réception</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={
                                                    this.state.reception_date
                                                }
                                                onChange={e =>
                                                    this.handleChangeReceptionDate(
                                                        e
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>N° du Chèque</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={
                                                    this.state.check_number ||
                                                    ""
                                                }
                                                onChange={e =>
                                                    this.handleChangeCheckNumber(
                                                        e
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Emmeteur du Chèque</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={
                                                    this.state
                                                        .check_issuer_name || ""
                                                }
                                                onChange={e =>
                                                    this.handleChangeCheckIssuerName(
                                                        e
                                                    )
                                                }
                                            />
                                        </div>
                                    </React.Fragment>
                                ) : null}
                                <div className="form-group">
                                    <label>Date d'encaissement</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={this.state.cashing_date}
                                        onChange={e =>
                                            this.handleChangeCashingDate(e)
                                        }
                                    />
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
                                    onClick={() => this.handleCreatePayment()}
                                >
                                    <i className="fas fa-plus m-r-sm"></i>
                                    {this.state.id != null
                                        ? "Sauvegarder"
                                        : "Créer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    className="modal inmodal"
                    id="payment-bulk-edit-modal"
                    tabIndex="-1"
                    role="dialog"
                    aria-hidden="true"
                >
                    <div className="modal-dialog">
                        <div className="modal-content animated">
                            <div className="modal-header">
                                <h3>Edition de règlements</h3>
                            </div>
                            <BulkEditModalAlert/>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Montant</label>
                                    <div className="flex">
                                        <select
                                            name="operation"
                                            value={this.state.bulkEdit.operation}
                                            defaultValue={""}
                                            onChange={e => this.handleBulkEditChange(e)}>
                                            <option value=""></option>
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                            <option value="0">0</option>
                                        </select>
                                        <input
                                            type="text"
                                            name="amount"
                                            onChange={e => this.handleBulkEditChange(e)}
                                            className="form-control"
                                            placeholder="XX €"/>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Mode de Paiement</label>
                                    <select
                                        className="form-control"
                                        name="payment_method_id"
                                        defaultValue="placeholder"
                                        onChange={this.handleBulkEditChange.bind(
                                            this
                                        )}
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
                                    <label>Date de réception</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="reception_date"
                                        onChange={this.handleBulkEditChange.bind(
                                            this
                                        )}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date d'encaissement</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="cashing_date"
                                        onChange={this.handleBulkEditChange.bind(
                                            this
                                        )}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Émetteur du chèque</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="emitter"
                                        onChange={this.handleBulkEditChange.bind(
                                            this
                                        )}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        Numéro du premier chèque (les numéros
                                        suivants seront incrémenté
                                        automatiquement)
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="first_check_number"
                                        onChange={this.handleBulkEditChange.bind(
                                            this
                                        )}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Statut</label>
                                    <select
                                        className="form-control"
                                        name="status_id"
                                        onChange={this.handleBulkEditChange.bind(
                                            this
                                        )}
                                        value={this.state.payment_status_id}
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
                                    onClick={() => this.handleBulkEditCommit()}
                                    disabled={
                                        Object.keys(this.state.bulkEdit)
                                            .length === 0
                                    }
                                >
                                    <i className="fas fa-edit m-r-sm"></i>
                                    Editer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default PaymentsList;
