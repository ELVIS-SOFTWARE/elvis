import React, { Component, Fragment, useRef } from "react";
import { csrfToken } from "../../utils";
import { makeDebounce } from "../../../tools/inputs";
import moment from "moment";
import ReactTable from "react-table";
import swal from "sweetalert2";

const requestData = (pageSize, page, sorted, filtered, format) => {
    return fetch(
        `/parameters/activity_application_parameters/list_status${
            format ? "." + format : ""
        }`,
        {
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
        }
    );
};

const debounce = makeDebounce();

// créer un nouveau statut
/* auparavant, dans activity_application_parameters/index.html.erb :
  <%#= link_to new_activity_application_status_path, class:"btn btn-sm btn-primary pull-right" do %>
            <i class="fas fa-plus"></i> Créer un nouveau statut
        <%# end %>
 */
export default class ApplicationStatusTable extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: [],
            pages: null,
            loading: true,
            filter: {},
            tableState: {},
        };

        this.fetchData = this.fetchData.bind(this);
        this.deleteStatus = this.deleteStatus.bind(this);
    }

    fetchData(state, instance) {
        this.setState({ loading: true, filter: state, tableState: state });

        debounce(() => {
            requestData(
                state.pageSize,
                state.page,
                state.sorted,
                state.filtered
            )
                .then(response => response.json())
                .then(data => {
                    return {
                        data: data.status,
                        pages: data.pages,
                        total: data.total,
                    };
                })
                .then(res => {
                    this.setState({
                        ...res,
                        loading: false,
                    });
                });
        }, 400);
    }

    render() {
        const { data, pages, loading } = this.state;

        const columns = [
            {
                Header: "#",
                accessor: "id",
                width: 75,
            },
            {
                id: "label",
                Header: "Libellé",
                accessor: d => d.label,
            },
            {
                id: "is_stopping",
                Header: "Arrêt ?",
                accessor: d => d.is_stopping,
                Cell: props => (
                    <p>{props.original.is_stopping ? "Oui" : "Non"}</p>
                ),
            },
            {
                id: "is_active",
                Header: "Actif ?",
                accessor: d => d.is_active,
                Cell: props => (
                    <p>{props.original.is_active ? "Oui" : "Non"}</p>
                ),
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return props.original.built_in ? "" :
                        <div className="btn-wrapper">
                            <a
                                className="btn-sm btn-primary m-r-sm"
                                href={
                                    "/activity_application_statuses/" +
                                    props.original.id +
                                    "/edit"
                                }
                            >
                                <i className="fas fa-edit" />
                            </a>

                            <a
                                className="btn-sm btn-warning"
                                onClick={() =>
                                    this.deleteStatus(props.original)
                                }
                            >
                                <i className="fas fa-trash" />
                            </a>
                        </div>
                },
                sortable: false,
                filterable: false,
            },
        ];

        return (
            <Fragment>
                <ReactTable
                    data={data}
                    manual
                    pages={pages}
                    loading={loading}
                    onFetchData={this.fetchData}
                    columns={columns}
                    defaultSorted={[{ id: "id", desc: true }]}
                    filterable
                    defaultFilterMethod={(filter, row) => {
                        if (row[filter.id] != null) {
                            return row[filter.id]
                                .toLowerCase()
                                .startsWith(filter.value.toLowerCase());
                        }
                    }}
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
            </Fragment>
        );
    }

    deleteStatus(status) {
        swal({
            title:
                "Voulez-vous vraiment supprimer le status '" +
                status.label +
                "' ?",
            type: "warning",
            showCancelButton: true,
            cancelButtonText: "non",
            confirmButtonText: "oui",
        }).then(res => {
            if (res.value) {
                fetch(`/activity_application_statuses/${status.id}`, {
                    method: "DELETE",
                    credentials: "same-origin",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }).then(result => {
                    if (result.status === 200) {
                        this.fetchData(this.state.tableState);
                    } else {
                        result.text().then(text => {
                            swal({
                                title: "Erreur",
                                type: "error",
                                text: text,
                            });
                        });
                    }
                });
            }
        });
    }
}
