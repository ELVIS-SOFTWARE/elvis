import React, { Component } from "react";
import Table from "react-table";

export default class StudentEvaluationStats extends Component {
    constructor(props) {
        super(props);
        
        this.state = {};
    }

    render() {
        const columns = [
            {
                id: "teacher",
                Header: "Professeur",
                accessor: d => `${d.teacher.last_name} ${d.teacher.first_name}`,
                Cell: c => <a href={`/users/${c.original.teacher.id}`}>
                    {c.value}
                </a>
            },
            {
                id: "nb_students",
                Header: "Nombre élèves",
                accessor: d => d.nb_students,
                Cell: c => <div className="text-right font-bold font-size-big">
                    {c.value}
                </div>,
            },
            {
                id: "nb_evaluated_students",
                Header: "Nombre évaluations",
                accessor: d => d.nb_evaluated_students,
                Cell: c => <div className={`text-right font-bold font-size-big text-${c.original.evaluations_completion_rate_level}`}>
                    {c.value}
                </div>,
            },
            {
                id: "nb_redirections",
                Header: "Nombre changements",
                accessor: d => d.nb_redirections,
                Cell: c => <div className={`text-right font-bold font-size-big`}>
                    {c.value}
                </div>,
            },
            {
                id: "nb_informed_redirections",
                Header: "Nombre élèves/parents prévenus",
                accessor: d => d.nb_informed_redirections,
                Cell: c => <div className={`text-right font-bold font-size-big text-${c.original.redirection_information_rate_level}`}>
                    {c.value}
                </div>,
            },
            {
                id: "evaluations_completion_rate",
                Header: "% d'évaluations complétées",
                accessor: d => d.evaluations_completion_rate,
                Cell: c => <div className="progress" style={{margin: "0", background: "white"}}>
                    <div className={`progress-bar progress-bar-${c.original.evaluations_completion_rate_level}`}
                        style={{
                            width: c.value + "%",
                            minWidth: "2em",
                        }}>
                        {c.value}%
                    </div>
                </div>,
            },
        ];

        return <Table
            columns={columns}
            data={this.props.stats}
            sortable />;
    }
}