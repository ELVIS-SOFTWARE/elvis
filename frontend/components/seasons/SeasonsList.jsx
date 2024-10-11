import React from "react";
import swal from "sweetalert2";

require("moment/locale/fr");

import ReactTable from "react-table";
import { csrfToken } from "../utils";
import SeasonSwitch from "./SeasonSwitch";
import RemoveComponent from "../RemoveComponent";

class SeasonsList extends React.Component {
    constructor(props) {
        super(props);

        //current_id = 

        this.state = {
            seasons: this.props.seasons,
            // current_id: current_id,
        };
    }

    deleteSeason(id)
    {
        const selectedSeason = this.state.seasons.find(s => s.id == id);

        if (selectedSeason.is_current)
        {
            swal({
                type: 'error',
                title: 'Impossible de supprimer la saison en cours',
                text: 'Vous devez d\'abord définir une autre saison comme "en cours"',
            });
            return;
        }

        swal({
            title: "Suppression de la saison",
            text: "Êtes-vous sûr ?",
            type: "warning",
            showCancelButton: true,
            cancelButtonText: "Annuler",
            confirmButtonText: "Confirmer",
        }).then(a => {
            if (a.value) {
                fetch(`/seasons/${id}`, {
                    method: "DELETE",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                    },
                }).then(res => {
                    if (res.ok)
                    {
                        const previous = this.state.seasons
                            .find(s => s.next_season_id == id);

                        if (previous)
                        {
                            previous.next_season_id = null;
                            previous.next_season = null;
                        }

                        this.setState({
                            seasons: this.state.seasons.filter(
                                c => c.id !== id,
                            ),
                        });

                        swal("Réussite", "Suppression réussie", "success");
                    }
                });
            }
        });
    }

    switchToSeason(new_current_id) {
        swal({
            title: "Vous allez définir cette saison comme 'en cours'",
            text: "Êtes-vous sûr ?",
            type: "warning",
            showCancelButton: true,
            cancelButtonText: "Annuler",
            confirmButtonText: "Confirmer",
        }).then(a => {
            if (a.value) {
                fetch(`/season/${new_current_id}/make_active`, {
                    method: "POST",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                    },
                }).then(res => {
                    if (res.ok) {
                        res.json().then(datas =>
                        {
                            this.setState(function (previousState, currentProps) {
                                const state = Object.assign({}, previousState);
                                state.seasons
                                    .find(s => s.is_current)
                                    .is_current = false;

                                const new_current = state.seasons
                                    .find(s => s.id == new_current_id);

                                new_current.is_current = true;

                                if (datas.new_next_season)
                                {
                                    state.seasons.sort((a, b) => a.start < b.start);
                                    new_current.next_season = datas.next;
                                    new_current.next_season_id = datas.next.id;
                                    state.seasons.push(datas.next);

                                    swal({
                                        type: 'success',
                                        title: 'Information',
                                        text: 'Puisque vous avez défini cette saison comme "en cours" et qu\'il n\'y a pas de saison suivante, la saison suivante a été créée automatiquement. Vous pouvez la modifier si nécessaire.',
                                    });
                                }

                                return state;
                            });
                        });
                    } else {
                        // il faut mettre à jour le switch qui a été toggled
                        this.setState(function (previousState, currentProps) {
                            const state = Object.assign({}, previousState);

                            state.seasons
                                .find(s => s.id == new_current_id)
                                .is_current = false;

                            return state;
                        })
                        swal("Echec", "L'opération a échoué", "error");
                    }
                });
            } else {
                // il faut mettre à jour le switch qui a été toggled
                this.setState(function (previousState, currentProps) {
                    const state = Object.assign({}, previousState);

                    state.seasons
                        .find(s => s.id == new_current_id)
                        .is_current = false;

                    return state;
                });
            }
        });

    }

    render() {
        const columns = [
            {
                id: "id",
                Header: "#",
                accessor: d => d.id,
                width: 50,
                maxWidth: 100
            },
            {
                id: "label",
                Header: "Label",
                accessor: d => d.label,
            },
            {
                id: "start",
                Header: "Début",
                accessor: d => d.start,
                Cell: props => {
                    return (props.original.start_formatted)
                }
            },
            {
                id: "end",
                Header: "Fin",
                accessor: d => d.end,
                Cell: props => {
                    return (props.original.end_formatted)
                }
            },
            {
                id: "is_current",
                Header: "En cours ?",
                accessor: d => d.is_current,
                Cell: props => {

                    return (
                        <div style={{ 'textAlign': 'center' }}>
                            <SeasonSwitch
                                season_id={props.original.id}
                                checked={props.original.is_current}
                                disabled={props.original.is_current}
                                handleSwitch={() => this.switchToSeason(props.original.id)} />
                        </div>

                    )
                },
                sortable: false,
                filterable: false,
            },
            {
                id: "next",
                Header: "Suivante",
                accessor: d => d.next_season_id ? d.next_season.label : "-",
            },
            {
                id: "is_off",
                Header: "Archivée ?",
                accessor: d => d.is_off ? "oui" : "non",
                sortable: false,
                filterable: false,
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return (
                        <div>
                            <a
                                href={`/seasons/${props.original.id}/edit`}
                                className="m-r-sm"
                            >
                                <button className="btn btn-xs btn-primary ">
                                    <i className="fas fa-edit" />
                                    &nbsp; Editer
                                </button>
                            </a>
                            {/*<button*/}
                            {/*    className="btn btn-xs btn-warning"*/}
                            {/*    onClick={() =>*/}
                            {/*        this.deleteSeason(props.original.id)*/}
                            {/*    }*/}
                            {/*>*/}
                            {/*    <i className="fas fa-trash" />*/}
                            {/*</button>*/}

                            <RemoveComponent
                                classname="season"
                                id={props.original.id}
                                btnProps={{
                                    className: "btn btn-xs btn-warning",
                                }}
                                onSuccess={(data) =>
                                {
                                    const previous = this.state.seasons
                                        .find(s => s.next_season_id == props.original.id);

                                    if (previous)
                                    {
                                        previous.next_season_id = null;
                                        previous.next_season = null;
                                    }

                                    this.setState({
                                        seasons: this.state.seasons.filter(
                                            c => c.id !== props.original.id,
                                        ),
                                    });

                                    swal("Réussite", "Suppression réussie", "success");
                                }}>
                                <i className="fas fa-trash" />
                            </RemoveComponent>
                        </div>
                    );
                },
                sortable: false,
                filterable: false,
            },
        ];

        return (
            <div>
                <ReactTable
                    data={this.state.seasons}
                    columns={columns}
                    defaultSorted={[{ id: "start", desc: true }]}
                    // filterable
                    // defaultFilterMethod={(filter, row) => {
                    //     if (row[filter.id] != null) {
                    //         return row[filter.id]
                    //             .toLowerCase()
                    //             .includes(filter.value.toLowerCase());
                    //     }
                    // }}
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

export default SeasonsList;
