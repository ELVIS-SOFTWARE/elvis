import React from "react";
import swal from "sweetalert2";
import { csrfToken } from "../../utils";
import _ from "lodash";
import ReactTable from "react-table";


export default class Localisations extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            data: [],
            pages: null,
            loading: true,
            filter: {},
            tableState: {},
            subComponent: null,
        };

        this.state.columns = [
            {
                Header: "#",
                accessor: "id",
                width: 75,
            },
            {
                id: "label",
                Header: "Site",
                accessor: props => (
                    <a href={"/rooms?location=" + props.id}>{props.label}</a>
                ),
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return (
                        <div className="btn-wrapper">
                            <a
                                className="btn-sm btn-primary m-r-sm"
                                href={
                                    "/locations/" + props.original.id + "/edit"
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
                    );
                },
                sortable: false,
                filterable: false,
            },
        ];
        const LocationList = ({ rooms, location }) => (
            <ul>
                {_.orderBy(rooms, room => room.label)
                    .filter(room => room.location_id === location)
                    .map(room => (
                        <li key={room.id}>
                            <a href={"/rooms?location=" + location}>
                                {room.label}
                            </a>
                        </li>
                    ))}
            </ul>
        );

        this.state.subComponent = row => {
            if (
                this.props.rooms.filter(
                    room => room.location_id === row.original.id
                ).length > 0
            ) {
                return (
                    <LocationList
                        rooms={this.props.rooms}
                        location={row.original.id}
                    />
                );
            } else {
                return null;
            }
        };

        this.deleteStatus = this.deleteStatus.bind(this);
    }
    
    fetchData(state, instance)
    {
        this.setState({ loading: true, filter: state, tableState: state });

        this.requestData.call(this,
            state.pageSize,
            state.page,
            state.sorted,
            state.filtered,
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
    }

    requestData(pageSize, page, sorted, filtered, format)
    {
        return fetch(`/parameters/rooms_parameters/list${format ? "." + format : ""}`,
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
            });
    }

    deleteStatus(status) {
        swal({
            title:
                "Voulez-vous vraiment supprimer la localisation '" +
                status.label +
                "' ?",
            type: "warning",
            showCancelButton: true,
            cancelButtonText: "non",
            confirmButtonText: "oui",
        }).then(res => {
            if (res.value) {
                fetch(`/locations/${status.id}`, {
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

    render() {
        const { data, pages, loading } = this.state;

        return (
            <ReactTable
                data={data}
                manual
                pages={pages}
                loading={loading}
                onFetchData={(state, instance) =>
                    this.fetchData.call(this, state, instance)
                }
                columns={this.state.columns}
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
                SubComponent={this.state.subComponent}
            />
        );
    }
}
