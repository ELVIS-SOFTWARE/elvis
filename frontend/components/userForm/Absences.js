import React, {Fragment} from "react";
import ReactTableFullScreen from "../ReactTableFullScreen";
import * as api from "../../tools/api";
import {isValidDate} from "@fullcalendar/react";

export default class Absences extends React.Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            absences: [],
            page: 0,
            loading: false,
            current_season: this.props.seasons.filter(season => season.is_current)[0],
        };

        this.confTabCols();

        this.fetchData = this.fetchData.bind(this);
    }

    confTabCols()
    {
        this.state.tabCols = [
            {
                id: "date",
                Header: "Date de l'absence",
                accessor: "date",
                Filter: ({filter, onChange}) =>
                {
                    return <input
                        type="date"
                        defaultValue={filter ? filter.value : ""}
                        onChange={event => {
                            const date = new Date(event.target.value);

                            if(date.getFullYear() > 1970)
                                onChange(event.target.value);

                            if(!isValidDate(date))
                                onChange(undefined);
                        }}
                    />
                }
            },
            {
                id: "teacher",
                Header: "Professeur",
                accessor: "teacher",
            },
            {
                id: "activity",
                Header: "Cours",
                accessor: "activity",
            },
            {
                id: "type",
                Header: "Type d'absence",
                accessor: "type",
                sortable: false,
                Cell: row =>
                {
                    let text = "";

                    switch(row.original.type)
                    {
                        case 0: text = "Absence injustifiée";break;
                        case 1: text = "Présent";break;
                        case 2: text = "???";break;
                        case 3: text = "Absence justifiée";break;
                        default: text = "Non renseigné";
                    }

                    return <span>{text}</span>;
                },
                Filter: ({filter, onChange}) =>
                {
                    return <select
                        onChange={event => onChange(event.target.value)}
                        style={{width: "100%"}}
                        value={filter ? filter.value : "all"}
                    >
                        <option value="all">Tous</option>
                        <option value="0">Absence injustifiée</option>
                        <option value="3">Absence justifiée</option>
                        <option value="-1">Non renseigné</option>
                    </select>
                }
            }
        ];
    }

    render()
    {
        const events = [];

        return <div className="row">
            <div className="col-sm-6">
                <h3 className="font-bold my-4">{this.state.absences.length} absences au total</h3>
            </div>
            <div className="col-sm-6 text-right my-3">
                <select className="custom-select" onChange={(event) => {
                    this.setState({current_season: this.props.seasons.filter(season => season.id === parseInt(event.target.value))[0]}, () => {
                        this.fetchData(this.state.filter, null);
                    });
                }}>
                    {this.props.seasons.map(season => <option key={season.id} value={season.id} selected={season.is_current}>{season.label}</option>)}
                </select>
            </div>
            <div className="col-sm-12">
                <ReactTableFullScreen
                    events={events}
                    data={this.state.absences}
                    columns={this.state.tabCols}
                    filterable
                    defaultPageSize={10}
                    previousText="Précédent"
                    nextText="Suivant"
                    loadingText="Chargement..."
                    noDataText="Aucune donnée"
                    pageText="Page"
                    ofText="sur"
                    rowsText="lignes"
                    minRows={5}
                    resizable={false}
                    pages={this.state.pages}
                    loading={this.state.loading}
                    onFetchData={this.fetchData}
                    manual
                    defaultSorted={[{id: 'date', desc: true}]}
                />
            </div>
        </div>
    }

    fetchData(state, instance)
    {
        this.setState({loading: true, filter: state});

        api.set()
            .success(data =>
            {
                this.setState({
                    absences: data.data,
                    pages: state.pages,
                    loading: false,
                    total: data.total
                });
            })
            .error(err =>
            {
                this.setState({loading: false});
            })
            .post(`/users/${this.props.user_id}/absences_list?sid=${this.state.current_season.id}`, {
                page: state.page,
                pageSize: state.pageSize,
                sorted: state.sorted[0] || {},
                filtered: state.filtered
            });
    }
}