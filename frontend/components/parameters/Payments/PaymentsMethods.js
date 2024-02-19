import React, {Component, Fragment} from "react";
import swal from "sweetalert2";
import {csrfToken} from "../../utils";
import {makeDebounce} from "../../../tools/inputs";
import ReactTable from "react-table";
import BaseDataTable from "../BaseDataTable";

export default class PaymentsMethods extends BaseDataTable {
    constructor(props) {
        super(props);

        this.state.columns = [
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
                id: "show_payment_method_to_user",
                Header: "Afficher au client ?",
                accessor: d => d.show_payment_method_to_user,
                Cell: props => <div>{props.original.show_payment_method_to_user ? "Oui" : "Non"}</div>
            },
            {
                id: "is_special",
                Header: "Est spécial ?",
                accessor: d => d.is_special,
                Cell: props => <div>{props.original.is_special ? "Oui" : "Non"}</div>
            },
            {
                id: "is_credit_note",
                Header: "Est à crédit ?",
                accessor: d => d.is_credit_note,
                Cell: props => <div>{props.original.is_credit_note ? "Oui" : "Non"}</div>
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return <div className="btn-wrapper">
                        <a className="btn-sm btn-primary m-r-sm"
                           href={'/payment_method/' + props.original.id + "/edit"}>
                            <i className="fas fa-edit"/>
                        </a>

                        {props.original.built_in ?
                            null
                            :
                            <a className="btn-sm btn-warning" onClick={() => this.deleteStatus(props.original)}>
                                <i className="fas fa-trash"/>
                            </a>}
                    </div>
                },
                sortable: false,
                filterable: false,
            },
        ];

        this.deleteStatus = this.deleteStatus.bind(this);
    }

    deleteStatus(status) {
        swal({
            title: "Voulez-vous vraiment supprimer la méthode de paiement '" + status.label + "' ?",
            type: "warning",
            showCancelButton: true,
            cancelButtonText: "non",
            confirmButtonText: 'oui'
        }).then(res => {
            if (res.value) {
                fetch(`/payment_method/${status.id}`,
                    {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            "X-CSRF-Token": csrfToken,
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        }
                    })
                    .then(result => {
                        if (result.status === 200) {
                            this.fetchData(this.state.tableState)
                        } else {
                            result.text().then(text => {
                                swal({
                                    title: "Erreur",
                                    type: "error",
                                    text: text
                                })
                            })
                        }
                    })
            }
        });
    }
}