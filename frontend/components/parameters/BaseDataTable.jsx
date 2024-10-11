import React, {Component, Fragment} from "react";
import ReactTable from "react-table";
import {csrfToken} from "../utils";

/**
 * Il faut hériter de cette classe.
 * Elle permet de faire rapidement un tableau avec actions crud. Pour cela il faut:
 * mettre l'URL de récupération en json des données dans les propriétés de l'élément enfant sous le nom "urllistdata'
 * Modifier le state "column" pour mettre un tableau de colonne.
 */
export default class BaseDataTable extends Component
{
    constructor(props)
    {
        super(props);

        this.state = {
            data: [],
            pages: null,
            loading: true,
            filter: {},
            tableState: {},
            subComponent: null
        };
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
        return fetch(`${this.props.urlListData}${format ? "." + format : ""}`,
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

    render()
    {
        const { data, pages, loading } = this.state;

        return <Fragment>
            <div className="row">
                <div className="col">
                    <a className="btn btn-success pull-right" href={this.props.urlNew}><i className="fas fa-plus"></i> Créer</a>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <ReactTable
                        data={data}
                        manual
                        pages={pages}
                        loading={loading}
                        onFetchData={(state, instance) => this.fetchData.call(this, state, instance)}
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
                </div>
            </div>
        </Fragment>
    }
}