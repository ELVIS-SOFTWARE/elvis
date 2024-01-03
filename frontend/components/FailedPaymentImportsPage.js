import React from "react";

import ReactTable from "react-table";

import moment from "moment";
import swal from "sweetalert2";
import _ from "lodash";
import { ISO_DATE_FORMAT, csrfToken } from "./utils";

/*
    Propriétés de l'objet passé aux fonctions d'attributs de rendering de cellule
  {
    // Row-level props
    row: Object, // the materialized row of data
    original: , // the original row of data
    index: '', // the index of the row in the original array
    viewIndex: '', // the index of the row relative to the current view
    level: '', // the nesting level of this row
    nestingPath: '', // the nesting path of this row
    aggregated: '', // true if this row's values were aggregated
    groupedByPivot: '', // true if this row was produced by a pivot
    subRows: '', // any sub rows defined by the `subRowKey` prop

    // Cells-level props
    isExpanded: '', // true if this row is expanded
    value: '', // the materialized value of this cell
    resized: '', // the resize information for this cell's column
    show: '', // true if the column is visible
    width: '', // the resolved width of this cell
    maxWidth: '', // the resolved maxWidth of this cell
    tdProps: '', // the resolved tdProps from `getTdProps` for this cell
    columnProps: '', // the resolved column props from 'getProps' for this cell's column
    classes: '', // the resolved array of classes for this cell
    styles: '' // the resolved styles for this cell
  } */

class FailedPaymentImportsPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: this.props.data,
            selectAll: false,
            selectedRows: [],
            selectedReason: null,
        };
    }

    promptBulkDeleteByReason() {
        swal({
            title: "Suppression",
            text: "Voulez-vous vraiment supprimer toutes ces tentatives ?",
            type: "warning",
            confirmButtonText: "Oui",
            showCancelButton: true,
            cancelButtonText: "Non",
            focusCancel: true,
        }).then(reason => {
            if (reason.value) {
                fetch(
                    `/payments/failed_imports/reason/${
                        this.state.selectedReason.id
                    }`,
                    {
                        method: "DELETE",
                        headers: {
                            "X-CSRF-Token": csrfToken,
                        },
                    },
                ).then(res => {
                    if (res.ok) {
                        this.setState({
                            data: this.state.data.filter(
                                x =>
                                    x.failed_payment_import_reason_id !==
                                    this.state.selectedReason.id,
                            ),
                        });
                    }
                });
            }
        });
    }

    promptBulkDelete() {
        

        swal({
            title: "Suppression",
            text: "Voulez-vous vraiment supprimer toutes ces tentatives ?",
            type: "warning",
            confirmButtonText: "Oui",
            showCancelButton: true,
            cancelButtonText: "Non",
            focusCancel: true,
        }).then(reason => {
            if (reason.value) {
                fetch("/payments/failed_imports/many", {
                    method: "DELETE",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        targets: this.state.selectedRows,
                        all: this.state.selectAll,
                    }),
                }).then(res => {
                    if (res.ok) {
                        const newData = this.state.selectAll
                            ? []
                            : this.state.data.filter(
                                  d => !this.state.selectedRows.includes(d.id),
                              );

                        this.setState({
                            data: newData,
                            selectedRows: [],
                            selectAll: false,
                        });
                    }
                });
            }
        });
    }

    promptDelete(id) {
        

        swal({
            title: "Suppression",
            text: "Voulez-vous vraiment supprimer cette tentative ?",
            type: "warning",
            confirmButtonText: "Oui",
            showCancelButton: true,
            cancelButtonText: "Non",
            focusCancel: true,
        }).then(reason => {
            if (reason.value)
                fetch(`/payments/failed_imports/delete?id=${id}`, {
                    headers: {
                        "X-CSRF-Token": csrfToken,
                    },
                    method: "DELETE",
                }).then(res => {
                    if (res.ok)
                        this.setState({
                            data: this.state.data.filter(d => d.id !== id),
                        });
                    else
                        swal({
                            title: "Échec",
                            type: "error",
                            text: "Cet import n'existe pas",
                        });
                });
        });
    }

    promptSubmit(row) {
        const data = { ...row };

        data.due_date = moment(data.due_date).format("DD/MM/YYYY");
        data.cashing_date = moment(data.cashing_date).format("DD/MM/YYYY");

        

        swal({
            title: "Import",
            text: "Êtes-vous sûr des informations ?",
            type: "question",
            confirmButtonText: "Oui",
            showCancelButton: true,
            cancelButtonText: "Non",
            focusCancel: true,
        }).then(reason => {
            if (reason.value)
                fetch(`/payments/failed_imports/import_single`, {
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify(data),
                })
                    .then(res => res.json())
                    .then(res => {
                        if (res.success)
                            swal({
                                title: "Réussite",
                                text: res.message,
                                type: "success",
                            }).then(() => {
                                this.setState({
                                    data: this.state.data.filter(
                                        d => d.id !== data.id,
                                    ),
                                });
                            });
                        else
                            swal({
                                title: "Échec",
                                text: res.message,
                                type: "error",
                            }).then(() => {
                                const { data } = this.state;
                                const index = data.findIndex(
                                    imp =>
                                        imp.id == res.failed_payment_import.id,
                                );

                                if (index > -1) {
                                    data.splice(
                                        index,
                                        1,
                                        res.failed_payment_import,
                                    );
                                    this.setState({ data });
                                }
                            });
                    });
        });
    }

    renderNameCell(cell, editable) {
        if (editable) {
            cell.styles.background = "#d63031";
            cell.styles.color = "white";
        }

        if (editable)
            return (
                <div
                    contentEditable={editable}
                    suppressContentEditableWarning={editable}
                    onBlur={e => {
                        const data = [...this.state.data];
                        data[cell.index][
                            cell.column.id
                        ] = e.target.innerText.replace(/\n/g, "");
                        this.setState({ data });
                    }}
                >
                    {cell.original[cell.column.id]}
                </div>
            );
        else if (cell.original.user_id)
            return (
                <a
                    href={`/payments/summary/${cell.original.user_id}`}
                    target="_blank"
                >
                    {cell.original[cell.column.id]}
                </a>
            );
    }

    renderDateCell(cell, editable) {
        if (editable) {
            cell.styles.padding = "0";

            return (
                <input
                    type="date"
                    disabled={!editable}
                    onChange={e => {
                        const data = [...this.state.data];
                        data[cell.index][cell.column.id] = moment(
                            e.target.value,
                        );
                        this.setState({ data });
                    }}
                    style={{
                        width: "100%",
                        height: "100%",
                        background: "#d63031",
                        color: "white",
                    }}
                    value={cell.value.format(ISO_DATE_FORMAT)}
                />
            );
        }

        return <div>{cell.value.format("DD/MM/YYYY")}</div>;
    }

    renderAmountCell(cell, editable) {
        if (editable)
            return (
                <input
                    type="number"
                    onChange={e => {
                        const { data } = this.state;
                        data[cell.index][cell.column.id] = parseFloat(
                            e.target.value,
                        );
                        this.setState({ data });
                    }}
                    style={{
                        width: "100%",
                        height: "100%",
                        background: "#d63031",
                        color: "white",
                    }}
                    value={cell.value}
                />
            );

        return `${cell.value} €`;
    }

    changeSelectedReason(id) {
        if (id === NaN) {
            this.setState({ selectedReason: null });
        } else {
            const selectedReason = _.find(this.props.reasons, r => r.id === id);
            this.setState({ selectedReason });
        }
    }

    switchSelectAll(checked) {
        if (checked) this.setState({ selectAll: true });
        else this.setState({ selectAll: false, selectedRows: [] });
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

    clearSelection() {
        this.setState({ selectedRows: [], selectAll: false });
    }

    render() {
        const payerNotFound = this.props.reasons.find(
            d => d.code === "payer_not_found",
        );
        const dueNotFound = this.props.reasons.find(
            d => d.code === "due_not_found",
        );
        const differentAmounts = this.props.reasons.find(
            d => d.code === "different_amounts",
        );

        const columns = [
            {
                Header: "Sélection",
                Filter: () => (
                    <div className="flex flex-center-aligned flex-center-justified">
                        <input
                            type="checkbox"
                            onChange={e =>
                                this.switchSelectAll(e.target.checked)
                            }
                            checked={
                                this.state.selectAll ||
                                this.state.selectedRows.length
                            }
                        />
                    </div>
                ),
                filterable: true,
                maxWidth: 75,
                accessor: "id",
                Cell: c => (
                    <div className="flex flex-center-justified flex-center-aligned">
                        <input
                            type="checkbox"
                            checked={
                                this.state.selectAll ||
                                this.state.selectedRows.includes(c.value)
                            }
                            value={c.value}
                            onChange={e => this.handleRowSelected(e)}
                        />
                    </div>
                ),
            },
            {
                Header: "Raison",
                id: "reason",
                accessor: "failed_payment_import_reason_id",
                filterable: true,
                minWidth: 70,
                Filter: ({ filter, onChange }) => (
                    <select
                        onChange={event =>
                            parseInt(onChange(event.target.value))
                        }
                        style={{ width: "100%" }}
                        value={(filter && filter.value) || ""}
                    >
                        <option key="" value="" />
                        {this.props.reasons.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                ),
                Cell: cell => {
                    const reason = _.find(
                        this.props.reasons,
                        rea => rea.id === cell.value,
                    );
                    return (reason && reason.label) || "non précisée";
                },
            },
            {
                Header: "Prénom",
                id: "first_name",
                accessor: "first_name",
                Cell: c =>
                    this.renderNameCell(
                        c,
                        c.original.failed_payment_import_reason_id ===
                            payerNotFound.id,
                    ),
            },
            {
                Header: "Nom",
                id: "last_name",
                accessor: "last_name",
                Cell: c =>
                    this.renderNameCell(
                        c,
                        c.original.failed_payment_import_reason_id ===
                            payerNotFound.id,
                    ),
            },
            {
                Header: "Date d'échéance",
                id: "due_date",
                accessor: d => moment(d.due_date),
                Cell: c =>
                    this.renderDateCell(
                        c,
                        c.original.failed_payment_import_reason_id ===
                            dueNotFound.id,
                    ),
            },
            {
                Header: "Date du prélèvement",
                id: "cashing_date",
                accessor: d => moment(d.cashing_date),
                Cell: cell => cell.value.format("DD/MM/YYYY"),
            },
            {
                Header: "Date d'import",
                id: "import_date",
                accessor: d => moment(d.created_at),
                Cell: cell => cell.value.format("DD/MM/YYYY à hh:mm"),
            },
            {
                Header: "Montant import",
                maxWidth: 125,
                id: "amount",
                accessor: "amount",
                Cell: cell =>
                    this.renderAmountCell(
                        cell,
                        cell.original.failed_payment_import_reason_id ===
                            differentAmounts.id,
                    ),
            },
            {
                Header: "Actions",
                maxWidth: 100,
                Cell: c => (
                    <div className="flex flex-space-around-justified">
                        <button
                            className="btn btn-sm btn-primary"
                            value={c.original.id}
                            onClick={e => this.promptSubmit(c.original)}
                        >
                            <i className="fas fa-check" />
                        </button>
                        <button
                            className="btn btn-sm btn-warning"
                            value={c.original.id}
                            onClick={e =>
                                this.promptDelete(parseInt(e.target.value))
                            }
                        >
                            <i className="fas fa-trash" />
                        </button>
                    </div>
                ),
            },
        ];

        let bulkDeleteButtonLabel = "SUPPRESSION DE MASSE PAR RAISON";

        if (this.state.selectAll)
            bulkDeleteButtonLabel = `TOUT SUPPRIMER (${
                this.state.data.length
            })`;
        else if (this.state.selectedRows.length)
            bulkDeleteButtonLabel = `SUPPRIMER ${
                this.state.selectedRows.length
            } IMPORTS`;
        else if (this.state.selectedReason)
            bulkDeleteButtonLabel = `SUPPRIMER TOU.TE.S LES ${this.state.selectedReason.label.toUpperCase()}`;

        const bulkDeleteButtonOnClickCb =
            this.state.selectAll || this.state.selectedRows.length
                ? () => this.promptBulkDelete()
                : () => this.promptBulkDeleteByReason();

        return (
            <div className="col-lg-12">
                <div className="ibox">
                    <div className="ibox-title">
                        <div className="flex flex-space-between-justified">
                            <h2>Imports ratés</h2>
                            <div className="flex flex-center-aligned">
                                <select
                                    className="form-control m-r-md"
                                    onChange={e =>
                                        this.changeSelectedReason(
                                            parseInt(e.target.value),
                                        )
                                    }
                                    value={
                                        (this.state.selectedReason &&
                                            this.state.selectedReason.id) ||
                                        ""
                                    }
                                    disabled={
                                        this.state.selectAll ||
                                        this.state.selectedRows.length
                                    }
                                >
                                    <option key="" value="" />
                                    {this.props.reasons.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    disabled={
                                        !this.state.selectedReason &&
                                        !this.state.selectedRows.length &&
                                        !this.state.selectAll
                                    }
                                    className="btn btn-warning"
                                    onClick={bulkDeleteButtonOnClickCb}
                                >
                                    <i className="fas fa-exclamation-triangle m-r-xs" />
                                    {bulkDeleteButtonLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="ibox-content no-padding">
                        <ReactTable
                            data={this.state.data}
                            columns={columns}
                            defaultPageSize={10}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default FailedPaymentImportsPage;
