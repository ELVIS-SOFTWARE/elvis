import React from "react";
import PropTypes from "prop-types";
import _ from "lodash";
const moment = require("moment");
require("moment/locale/fr");

import ReactTable from "react-table";

function durationToString(duration) {
    if (moment.isDuration(duration))
        return `${Math.floor(duration.asHours())}h${Math.floor(
            duration.minutes(),
        )}`;

    return "";
}

class PlanningListTeachers extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const columns = [
            {
                Header: "#",
                accessor: "id",
                width: 50,
                filterable: false,
                Cell: row => <a href={`/planning/${row.original.id}`} className="w-100 d-flex text-dark">
                    {row.original.id}
                </a>
            },
            {
                Header: "Dernière modification",
                id: "date",
                accessor: p => moment(p.updated_at).format("DD-MM-YYYY"),
                filterable: false,
                Cell: p => <a href={`/planning/${p.original.id}`} className="w-100 d-flex text-dark">
                    {moment(p.original.updated_at).format("DD-MM-YYYY")}
                </a>
            },
            {
                id: "lastname",
                Header: "Nom",
                accessor: d => d.user.last_name,
                Cell: d => <a href={`/planning/${d.original.id}`} className="w-100 d-flex text-dark">
                    {d.original.user.last_name}
                </a>
            },
            {
                id: "firstname",
                Header: "Prénom",
                accessor: d => d.user.first_name,
                Cell: d => <a href={`/planning/${d.original.id}`} className="w-100 d-flex text-dark">
                    {d.original.user.first_name}
                </a>
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return <div className="text-center">
                        <a href={`/users/${props.original.user.id}`}>
                            <button className="btn btn-sm btn-primary ">
                                <i className="fas fa-user" />
                                &nbsp; Profil
                            </button>
                        </a>
                        <a
                            className="m-l"
                            href={`/teachers/${props.original.user.id}/previsional_groups`}>
                            <button className="btn btn-sm btn-primary ">
                                <i className="fas fa-users" />
                                &nbsp; Simulation groupes
                            </button>
                        </a>
                    </div>
                },
                sortable: false,
                filterable: false,
            },
        ];

        return (
            <ReactTable
                data={this.props.plannings}
                columns={columns}
                defaultSorted={[{ id: "lastname", asc: true }]}
                resizable={false}
                filterable
                defaultFilterMethod={(filter, row) => {
                    if (row[filter.id] != null) {
                        return row[filter.id]
                            .toLowerCase()
                            .startsWith(filter.value.toLowerCase());
                    }
                }}
                previousText="Précedent"
                nextText="Suivant"
                loadingText="Chargement..."
                noDataText="Aucune donnée"
                pageText="Page"
                ofText="sur"
                rowsText="résultats"
                minRows={1}
            />
        );
    }
}

export default PlanningListTeachers;
