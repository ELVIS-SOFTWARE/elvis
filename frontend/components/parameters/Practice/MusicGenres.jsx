import BaseDataTable from "../BaseDataTable";
import swal from "sweetalert2";
import {csrfToken} from "../../utils";
import React from "react";

export default class MusicGenres extends BaseDataTable
{
    constructor(props)
    {
        super(props);

        this.state.columns = [
            {
                Header: "#",
                accessor: "id",
                width: 75,
            },
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
                            <a className="btn-sm btn-primary m-r-sm" href={'/practice/music_genres/' + props.original.id + "/edit"}>
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
            },
        ];
    }

    deleteStatus(status)
    {
        swal({
            title: "Voulez-vous vraiment supprimer le genre '" + status.name + "' ?",
            type: "warning",
            showCancelButton: true,
            cancelButtonText: "non",
            confirmButtonText: 'oui'
        }).then(res =>
        {
            if(res.value)
            {
                fetch(`/practice/music_genres/${status.id}`,
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
                        if(result.status === 200)
                        {
                            this.fetchData(this.state.tableState)
                        }
                        else
                        {
                            result.text().then(text =>
                            {
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