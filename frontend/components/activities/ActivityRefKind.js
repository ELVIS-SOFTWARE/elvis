import React from "react";
import BaseDataTable from "../parameters/BaseDataTable";
import {csrfToken} from "../utils";
import swal from "sweetalert2";


export default class ActivityRefKind extends BaseDataTable
{
    constructor(props)
    {
        super(props);

        this.state.columns = [
            {
                id: "name",
                Header: "Nom",
                accessor: d => d.name,
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return (
                        <div className="btn-wrapper">
                            <a className="btn-sm btn-primary m-r-sm" href={'/activity_ref_kind/' + props.original.id + "/edit"}>
                                <i className="fas fa-edit"/>
                            </a>

                            <a className="btn-sm btn-warning" onClick={() => this.deleteStatus(props.original)}>
                                <i className="fas fa-trash"/>
                            </a>
                        </div>
                    );
                },
                sortable: false,
                filterable: false,
            }
        ];

        this.deleteStatus = this.deleteStatus.bind(this);
    }

    deleteStatus(status)
    {
        swal({
            title: "Voulez-vous vraiment supprimer le type '" + status.name + "' ?",
            type: "warning",
            showCancelButton: true,
            cancelButtonText: "non",
            confirmButtonText: 'oui'
        }).then(res =>
        {
            if(res.value)
            {
                fetch(`/activity_ref_kind/${status.id}`,
                    {
                        method: "DELETE",
                        credentials: "same-origin",
                        headers: {
                            "X-CSRF-Token": csrfToken,
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        }
                    })
                    .then(result =>
                    {
                        if(result.status === 200) {
                            this.fetchData(this.state.tableState)
                        } else {
                            result.json().then(text => {
                                swal({
                                    title: "Erreur",
                                    type: "error",
                                    text: text['message'] + " (" + text['activities'] + ")"
                                })
                            })
                        }
                    })
            }
        });
    }

}