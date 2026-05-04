import React from "react";
import swal from "sweetalert2";

require("moment/locale/fr");

import ReactTable from "react-table";
import { csrfToken } from "../utils";
import RemoveComponent from "../RemoveComponent";
import SeasonActivationModal from "./SeasonActivationModal";

class SeasonsList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            seasons: this.props.seasons,
            modalRef: React.createRef(),
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
        if (this.state.modalRef.current) {
            this.state.modalRef.current.openModal(new_current_id);
        }
    }

    onActivationSuccess = (data) => {
        this.setState(function (previousState) {
            const state = Object.assign({}, previousState);
            const currentSeason = state.seasons.find(s => s.is_current);
            if (currentSeason) {
                currentSeason.is_current = false;
            }

            const newCurrent = state.seasons.find(s => s.id === data.id);
            if (newCurrent) {
                newCurrent.is_current = true;
            }

            if (data.new_next_season) {
                state.seasons.sort((a, b) => a.start < b.start);
                newCurrent.next_season = data.next;
                newCurrent.next_season_id = data.next.id;
                state.seasons.push(data.next);
            }

            return state;
        });
    };

    render() {
        const columns = [
            // {
            //     id: "id",
            //     Header: "#",
            //     accessor: d => d.id,
            //     width: 50,
            //     maxWidth: 100
            // },
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
                Header: "Statut",
                accessor: d => d.is_current,
                Cell: props => {
                    if (props.original.is_current) {
                        return (
                            <div style={{ 'textAlign': 'center' }}>
                                <span style={{
                                    backgroundColor: '#27ae60',
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    display: 'inline-block'
                                }}>
                                    <i className="fas fa-check-circle"></i> Active
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div style={{ 'textAlign': 'center' }}>
                            <button
                                className="btn btn-xs btn-info"
                                onClick={() => this.switchToSeason(props.original.id)}
                            >
                                <i className="fas fa-play-circle"></i> Activer
                            </button>
                        </div>
                    );
                },
                sortable: false,
                filterable: false,
            },
            {
                id: "next",
                Header: "Suivante",
                accessor: d => d.next_season_id ? d.next_season.label : "-",
            },
            // {
            //     id: "is_off",
            //     Header: "Archivée ?",
            //     accessor: d => d.is_off ? "oui" : "non",
            //     sortable: false,
            //     filterable: false,
            // },
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
                <SeasonActivationModal
                    ref={this.state.modalRef}
                    onSuccess={this.onActivationSuccess}
                />
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
