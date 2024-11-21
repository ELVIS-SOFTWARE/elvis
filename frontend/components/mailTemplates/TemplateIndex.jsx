import React, {Component, Fragment, useRef} from 'react';
import ReactTable from "react-table";
import {csrfToken} from "../utils";
import swal from "sweetalert2";

const requestData = (pageSize, page, sorted, filtered, format) => {
    return fetch(`/notification_templates/list${format ? "." + format : ""}`, {
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
            sorted:sorted[0],
            filtered,
        }),
    });
};

class TemplateIndex extends Component {

    constructor(props) {
        super(props);

        this.state = {
            data: [],
            pages: null,
            sorted: '',
            loading: false,
            filter: {},
        };

        this.fetchData = this.fetchData.bind(this);
    }

    fetchData(state) {
        this.setState({ loading: true, filter: state });

        requestData(
            state.pageSize,
            state.page,
            state.sorted,
            state.filtered
        )
            .then(response => response.json())
            .then(data => {
                const res = {
                    data: data.templates,
                    pages: data.pages,
                    total: data.total,
                };

                return res;
            })
            .then(res => {
                this.setState({
                    ...res,
                    loading: false,
                });
            });
    }

    // handleDeleteProcess(e, id) {
    //     e.preventDefault();
    //     swal({
    //         title: "Êtes vous sûr de supprimer ce template ?",
    //         type: "warning",
    //         confirmButtonText: "Oui !",
    //         cancelButtonText: "Annuler",
    //         showCancelButton: true,
    //     }).then(a => {
    //         if (a.value) {
    //             fetch(`/notification_templates/` + id,
    //                 {
    //                     method: "DELETE",
    //                     credentials: "same-origin",
    //                     headers: {
    //                         "X-CSRF-Token": csrfToken,
    //                         "Content-Type": "application/json",
    //                     },
    //
    //                     body: JSON.stringify({
    //                         id: id,
    //                     }),
    //                 }).then(response => {
    //                 if (!response.ok)
    //                     swal("Erreur", "Erreur lors de l'acheminement", "error")
    //
    //                 this.fetchData(this.state.filter);
    //                 swal("Réussite", "Template supprimé", "success");
    //             })
    //         }
    //     })
    // }

    render () {
        const { data, pages, loading } = this.state;

        const columns = [
            {
                id: "label",
                Header: "Nom du template",
                accessor: "name",
            },
            {
                id: "",
                Header: "Chemin",
                accessor: "path",
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return props.original.built_in ? "" :
                        <div className="btn-wrapper text-center">
                            <a
                                className="btn-sm btn-primary m-r-sm"
                                href={
                                    "/notification_templates/edit/" +
                                    encodeURIComponent(props.original.path)
                                }
                            >
                                <i className="fas fa-edit" />
                            </a>
                        </div>
                },
                sortable: false,
                filterable: false,
                width: 200
            },
        ];

        return (
            <Fragment>
                <div className="row wrapper border-bottom white-bg page-heading mb-5">
                    <h1>Édition des templates emails</h1>
                </div>


                <div className="col-lg-12 col-sm-12">
                    <div className="row">
                        <div className="col-12">
                            <div className="mb-3 pl-4 pr-4">
                                <ReactTable
                                    id="templateTable"
                                    data={data}
                                    manual
                                    loading={loading}
                                    onFetchData={this.fetchData}
                                    defaultSorted={[{ id: "label", desc: false }]}
                                    columns={columns}
                                    resizable={false}
                                    showPagination={false}
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
                        </div>
                    </div>
                </div>
            </Fragment>
        )};
}

export default TemplateIndex