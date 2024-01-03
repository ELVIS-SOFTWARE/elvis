import React from "react";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

import ReactTable from "react-table";
import DateFilter from "../utils/DateFilter";

class SubPaymentList extends React.Component {
    constructor(props) {
        super(props);

        const columns = [
            {
                Header: "Mode de réglement",
                id: "payment_method_id",
                accessor: d => {
                    const pm = _.find(
                        this.props.paymentMethods,
                        pm => pm.id == d.payment_method_id
                    );
                    return pm ? pm.label : "Non précisé";
                },
                sortable: false,
                Filter: ({ filter, onChange }) => (
                    <select
                        onChange={event => onChange(event.target.value)}
                        style={{ width: "100%" }}
                        value={filter ? filter.value : ""}
                    >
                        <option value="" />
                        {this.props.paymentMethods.map(method => (
                            <option key={method.id} value={method.id}>
                                {method.label}
                            </option>
                        ))}
                    </select>
                ),
            },
            {
                Header: "Réception",
                id: "reception_date",
                accessor: d =>
                    d.reception_date
                        ? moment(d.reception_date).format("DD-MM-YYYY")
                        : "",
                Filter: ({ filter, onChange }) => (
                    <DateFilter
                        minYear={this.props.minYear}
                        maxYear={this.props.maxYear}
                        onChange={onChange}
                    />
                ),
            },
            {
                Header: "Encaissement",
                id: "cashing_date",
                accessor: d =>
                    d.cashing_date
                        ? moment(d.cashing_date).format("DD-MM-YYYY")
                        : "",
                Filter: ({ filter, onChange }) => (
                    <DateFilter
                        minYear={this.props.minYear}
                        maxYear={this.props.maxYear}
                        onChange={onChange}
                    />
                ),
            },
            {
                Header: "N° du Chèque",
                id: "check_number",
                style: {
                    display: "block",
                    textAlign: "right",
                },
                accessor: d => d.check_number || "Non précisé",
            },
            {
                Header: "Emmeteur du Chèque",
                id: "check_issuer_name",
                style: {
                    display: "block",
                    textAlign: "right",
                },
                accessor: d => d.check_issuer_name || "Inconnu",
            },
            {
                Header: "Montant",
                id: "amount",
                style: {
                    display: "block",
                    textAlign: "right",
                },
                accessor: d => `(${d.operation}) ${d.amount || "#"} €`,
                filterable: false,
            },
        ];

        this.state = {
            columns,
            data: [],
            pages: null,
            page: 0,
            loading: true,
            totalAmount: 0,
            rowsCount: 0,
        };
    }

    render() {
        const { pages } = this.state;

        return (
            <div style={{ padding: "20px 20px", background: "aliceblue" }}>
                <ReactTable
                    style={{ backgroundColor: "white" }}
                    data={this.props.data}
                    manual
                    pages={pages}
                    columns={this.state.columns}
                    defaultSorted={[{ id: "number", desc: true }]}
                    defaultPageSize={10}
                    filterable={false}
                    showPagination={false}
                    sortable={false}
                    resizable={false}
                    previousText="Précédent"
                    nextText="Suivant"
                    loadingText="Chargement..."
                    noDataText="Aucune donnée"
                    pageText="Page"
                    ofText="sur"
                    rowsText="résultats"
                    minRows={1}
                />
            </div>
        );
    }
}

export default SubPaymentList;
