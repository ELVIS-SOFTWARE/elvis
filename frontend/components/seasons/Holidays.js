import React from 'react'
import ReactTable from "react-table";
import { ceil } from "lodash";
import swal from "sweetalert2";
//import fetch from "isomorphic-unfetch";
import { csrfToken } from "../utils";
import "../../tools/format";
import { toLocaleDate } from "../../tools/format";


export default class Holidays extends React.Component {
    columns = [
        {
            Header: "Label",
            accessor: "label",
            sortable: true
        },
        {
            Header: "Date début",
            accessor: "start",
            sortable: true,
            Cell: props => <div className="text-center" title="jj/mm/yyyy">
                {toLocaleDate(new Date(props.original.start))}
            </div>
        },
        {
            Header: "Date de fin",
            accessor: "end",
            sortable: true,
            Cell: props => <div className="text-center" title="jj/mm/yyyy">
                {toLocaleDate(new Date(props.original.end))}
            </div>
        },
        {
            Header: "Action",
            sortable: false,
            width: 75,
            Cell: props => {
                return (<div className="btn-wrapper text-center">
                    <button
                        type={"button"}
                        className="btn btn-xs btn-primary m-r-sm m-b-sm"
                        onClick={() => this.deleteModal(props)}
                    >
                        <i className="fas fa-trash" />
                    </button>
                </div>);
            }
        }
    ];

    constructor(props) {
        super(props);

        this.state = {
            datas: this.props.datas.slice(0, 15) || [],
            pageSize: 15,
            pages: ceil((this.props.datas || []).length / 15),
            sauv: (this.props.datas || []).slice()
        };

        this.changeData = this.changeData.bind(this);
        this.addModal = this.addModal.bind(this);
        this.fetchModal = this.fetchModal.bind(this);
    }

    changeData(state) {
        const columns_sort = state.sorted.length > 0 ? state.sorted[0].id : undefined;

        let data = this.state.sauv.slice();

        if (columns_sort !== undefined) {
            data = data.sort((h1, h2) => {
                if (h1[columns_sort] < h2[columns_sort]) return -1;
                if (h1[columns_sort] == h2[columns_sort]) return 0;
                if (h1[columns_sort] > h2[columns_sort]) return 1;
            });

            if (state.sorted[0].desc)
                data = data.reverse();
        }

        this.setState({ datas: data.slice(state.pageSize * (state.page), state.pageSize * (state.page + 1)), pages: ceil(data.length / state.pageSize), pageSize: state.pageSize })
    }

    addModal() {
        swal({
            title: "Nouvelles vacances ou jour férié",
            confirmButtonText: "confirmer",
            cancelButtonText: "annuler",
            showCancelButton: true,
            showLoaderOnConfirm: true,
            input: 'text',
            html: '<div class="form-group text-center text-danger font-bold h5" id="er"></div>' +
                '<div class="form-group text-left">' +
                '<label>Date début</label>' +
                '<input class="form-control" type="date" id="ds" />' +
                '</div>' +
                '<div class="form-group text-left">' +
                '<label>Date fin</label>' +
                '<input class="form-control" type="date" id="de" />' +
                '</div>' +
                '<div class="text-left">' +
                '<label>Label</label>' +
                '</div>',
            preConfirm: (data) => {
                const er = $("#er");
                er.text("");

                const dateStart = $("#ds").val();
                const dateEnd = $("#de").val();
                const start = Date.parse(dateStart);
                const end = Date.parse(dateEnd);

                if (dateStart == "" || dateEnd == "" || data === undefined || data === "") {
                    er.text("Un des champs est vide.");

                    return false;
                }

                if (start > end) {
                    er.text("La date de début ne peut pas être après la date de fin.");

                    return false;
                }

                // > 3 mois ?
                if (end - start > 3 * 31 * 24 * 60 * 60 * 1000) {
                    er.text("Une durée supérieure à 3 mois n'est pas raisonnable pour des vacances...");

                    return false;
                }

                return fetch(`/season/${this.props.sid}/holidays`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        label: data,
                        start: dateStart,
                        end: dateEnd
                    })
                }).then(response => {
                    return response.json();
                });
            }
        }).then(result => {

            if (result.value) {
                const sauv = this.state.sauv.slice();
                const datas = this.state.datas;

                sauv.push(result.value);
                datas.push(result.value);

                this.setState({ sauv, datas: datas.slice(0, this.state.pageSize), pages: ceil(datas.length / this.state.pageSize) });
            }
        });

        return false;
    }

    fetchModal() {
        swal({
            title: "Importer les vacances et jours fériés ?",
            confirmButtonText: "confirmer",
            cancelButtonText: "annuler",
            showCancelButton: true,
            showLoaderOnConfirm: true,

            preConfirm: (data) => {

                return fetch(`/season/${this.props.sid}/fetch_holidays`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: null
                }).then(response => {
                    return response.json();
                });
            }
        }).then(result => {
            if (result.value) {
                // on réinitialise complètement les données du tableau
                const sauv = [];
                const datas = [];

                for (const elt of result.value) {
                    sauv.push(elt);
                    datas.push(elt);
                }

                this.setState({ sauv, datas: datas.slice(0, this.state.pageSize), pages: ceil(datas.length / this.state.pageSize) });
            }
        });

        return false;
    }




    deleteModal(props) {
        swal({
            title: `Confirmez vous la suppression de '${props.original.label}'`,
            confirmButtonText: "confirmer",
            cancelButtonText: "annuler",
            showCancelButton: true,
            showLoaderOnConfirm: true,
            type: "question",
            preConfirm: () => {
                return fetch(`/season/${this.props.sid}/holidays`, {
                    method: "DELETE",
                    credentials: "same-origin",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        label: props.original.label,
                        start: props.original.start,
                        end: props.original.end
                    })
                })
                    .then(response => response.json());
            }

        }).then(data => {
            if (data.value) {
                const sauv = this.state.sauv.filter(s => s["label"] !== props.original.label && s["start"] !== props.original.start && s["end"] !== props.original.end);
                const datas = this.state.datas.filter(s => s["label"] !== props.original.label && s["start"] !== props.original.start && s["end"] !== props.original.end);

                this.setState({ sauv, datas });
            }
        });
    }



    // =============================
    // SELECT HOLIDAYS ZONES MODAL
    // =============================
    handleOpenSelectZones(newInterval) {
        this.setState({
            isSelectZonesModalOpen: true,
        });
    }

    afterOpenSelectZonesModal() {
        // bla bla
    }
    closeSelectZonesModal() {
        this.setState({ isSelectZonesModalOpen: false });
    }

    handleFetchHolidays() {

    }



    render() {
        return <div>
            <div className="row">
                <div className="col-sm-4 col-md-4 col-xs-4 col-lg-4">
                    <label>Vacances & jours fériés</label>
                </div>

                <div className="col-sm-8 col-md-8 col-xs-8 col-lg-8 text-right">
                    <button
                        className="btn btn-primary m-b-sm"
                        onClick={this.fetchModal}
                        type="button">
                        <i className="fas fa-plus m-r-sm" />
                        Importer
                    </button> &nbsp;
                    <button
                        className="btn right m-b-sm"
                        onClick={this.addModal}
                        type="button">
                        <i className="fas fa-plus m-r-sm" />
                        Ajouter
                    </button>
                </div>
            </div>
            <ReactTable
                pageSizeOptions={[5, 10, 15]}
                defaultPageSize={15}
                data={this.state.datas}
                onFetchData={this.changeData}
                manual
                columns={this.columns}
                resizable={false}
                previousText="Précédent"
                nextText="Suivant"
                noDataText="Aucune vacances"
                pageText="Page"
                ofText="sur"
                pages={this.state.pages} />

        </div>
    }
}