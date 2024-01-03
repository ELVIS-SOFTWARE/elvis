import React from "react";
import _ from "lodash";

const moment = require("moment");
require("moment/locale/fr");

import ReactTable from "react-table";
import swal from "sweetalert2";
import { csrfToken } from "./utils";

const requestData = (pageSize, page, sorted, filtered) => {
    return fetch("/adhesions/list", {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "X-CSRF-Token": csrfToken,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            pageSize,
            page,
            sorted: sorted[0],
            filtered,
        }),
    })
        .then(response => response.json())
        .then(data => {
            const res = {
                data: data.adhesions,
                pages: data.pages,
                total: data.total,
            };

            return res;
        });
};

class AdhesionList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: [],
            pages: null,
            total: 0,
            page: 0,
            loading: true,
        };

        this.fetchData = this.fetchData.bind(this);
    }

    fetchData(state) {
        this.setState({ loading: true });

        requestData(
            state.pageSize,
            state.page,
            state.sorted,
            state.filtered
        ).then(res => {
            this.setState({
                ...res,
                loading: false,
            });
        });
    }

    handleSendReminder(id) {
        const xcsrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        swal({
            title: "Confirmer l'envoi d'un email de relance ?",
            type: "warning",
            confirmButtonText: "Oui !",
            cancelButtonText: "Annuler",
            showCancelButton: true,
        }).then(a => {
            if (a.value)
                fetch(`/adhesions/${id}/reminder`, {
                    method: "POST",
                    headers: {
                        "X-CSRF-Token": xcsrfToken,
                    },
                }).then(res => {
                    if (res.ok)
                        swal("Réussite", "Relance effectuée", "success");
                });
        });
    }

    promptDelete(id) {
        const xcsrfToken = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

        swal({
            title: "Êtes vous sûr de supprimer cette adhésion ?",
            type: "warning",
            confirmButtonText: "Oui !",
            cancelButtonText: "Annuler",
            showCancelButton: true,
        }).then(a => {
            if (a.value)
                fetch(`/adhesions/${id}`, {
                    method: "DELETE",
                    headers: {
                        "X-CSRF-Token": xcsrfToken,
                    },
                }).then(res => {
                    if (res.ok)
                        swal("Réussite", "Suppression réussie", "success").then(
                            () =>
                                this.setState({
                                    data: this.state.data.filter(
                                        adh => adh.id !== id
                                    ),
                                })
                        );
                });
        });
    }

    render() {
        const { data, pages, loading } = this.state;

        const end_dates_diffs = {};

        data.forEach(adh => {
            const endDate = new Date(adh.validity_end_date);
            const diff = (endDate - new Date().getTime()) / (1000 * 3600 * 24);

            end_dates_diffs[adh.id] = diff;
        });

        const columns = [
            {
                Header: "#",
                id: "users.adherent_number",
                accessor: d => <a href={`/users/${d.user.id}`} className="w-100 d-flex text-dark">
                    {d.user.adherent_number}
                </a>,
                width: 100,
            },
            {
                Header: "Nom",
                id: "users.last_name",
                accessor: d => <a href={`/users/${d.user.id}`} className="w-100 d-flex text-dark">
                    {d.user.last_name}
                </a>,
            },
            {
                Header: "Prénom",
                id: "users.first_name",
                accessor: d => <a href={`/users/${d.user.id}`} className="w-100 d-flex text-dark">
                    {d.user.first_name}
                </a>,
            },
            {
                Header: "Date de début",
                id: "validity_start_date",
                accessor: d => <a href={`/users/${d.user.id}`} className="w-100 d-flex text-dark">
                    {d.validity_start_date
                        ? moment(d.validity_start_date).format("DD MMM YYYY")
                        : "Non précisée"}
                </a>,
                filterable: false,
            },
            {
                Header: "Date de fin",
                id: "validity_end_date",
                accessor: d => <a href={`/users/${d.user.id}`} className="w-100 d-flex text-dark">
                    {d.validity_end_date
                        ? moment(d.validity_end_date).format("DD MMM YYYY")
                        : "Non précisée"}
                </a>,
                filterable: true,
                Filter: ({ onChange }) => (
                    <div
                        className="flex flex-center-aligned"
                        style={{ height: "100%" }}
                    >
                        <i
                            className="fas fa-exclamation-circle m-r-xs text-muted"
                            onClick={e => {
                                e.target.classList.toggle("text-muted");
                                e.target.classList.toggle("text-danger");
                                e.target.checked = !e.target.checked;
                                onChange(e.target.checked);
                            }}
                            style={{ cursor: "pointer" }}
                        />
                        <span className="text-danger">Bientôt expirés</span>
                    </div>
                ),
                Cell: d => {
                    const diff = end_dates_diffs[d.original.id];

                    return (
                        <div>
                            {d.value}
                            {diff < 30 && diff >= 0 ? (
                                <span className="m-l-md text-danger">
                                    <i className="fas fa-exclamation-circle m-r-xs" />
                                    Expire dans {Math.ceil(diff)} jours
                                </span>
                            ) : null}
                        </div>
                    );
                },
            },
            {
                id: "adhesion_prices.price",
                Header: "Prix de l'adhésion",
                filterable: false,
                sortable: true,
                accessor: d => (d.adhesion_price || {}).price,
            },
            {
                Header: "Actions",
                filterable: false,
                sortable: false,
                maxWidth: 100,
                Cell: d => (
                    <div className="flex flex-space-around-justified flex-center-aligned">
                        <button
                            onClick={() => this.promptDelete(d.original.id)}
                            className="btn btn-warning btn-xs"
                        >
                            <i className="fas fa-trash" />
                        </button>
                        {
                            end_dates_diffs[d.original.id] < 30 ? (
                                <button
                                    className="btn btn-danger btn-xs"
                                    onClick={() =>
                                        this.handleSendReminder(d.original.id)
                                    }
                                >
                                    <i className="fas fa-envelope" />
                                </button>
                            ) : null}
                    </div>
                ),
            },
            {
                Header: "Dernière relance",
                id: "last_reminder",
                accessor: d => <a href={`/users/${d.user.id}`} className="w-100 d-flex text-dark">
                    {d.last_reminder
                        ? moment(d.last_reminder).format("DD MMM YYYY")
                        : "Non précisée"}
                </a>,
                filterable: false,
            },
        ];

        return (
            <div>
                <ReactTable
                    data={data}
                    manual
                    pages={pages}
                    loading={loading}
                    onFetchData={this.fetchData}
                    columns={columns}
                    defaultSorted={[{ id: "validity_end_date", desc: true }]}
                    filterable
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

                <div className="flex flex-center-justified m-t-xs">
                    <h3>{`${this.state.total} Adhésions au total`}</h3>
                </div>
            </div>
        );
    }
}

export default AdhesionList;
