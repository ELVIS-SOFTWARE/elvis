import React from "react";
import PropTypes from "prop-types";
const moment = require("moment");
require("moment/locale/fr");

import ReactTable from "react-table";

class PlanningListRooms extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const columns = [
            {
                Header: "#",
                accessor: "id",
                width: 50,
            },
            {
                Header: "Salle",
                id: "room",
                accessor: r => r.label,
                sortMethod: (a, b) => {
                    if (a === b) return 0;
                    return a.toLowerCase() > b.toLowerCase() ? 1 : -1;
                },
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return (
                        <a href={`/rooms/${props.original.id}/planning`}>
                            <button className="btn btn-xs btn-primary ">
                                Voir Planning
                            </button>
                        </a>
                    );
                },
                sortable: false,
            },
        ];

        return (
            <ReactTable
                data={this.props.plannings}
                columns={columns}
                defaultSorted={[{ id: "room", desc: false }]}
                resizable={false}
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

export default PlanningListRooms;
