import React, {useState} from 'react';
import ReactTable from "react-table";
import * as api from "../../tools/api";


export default function Formules() {
    const [data, setData] = useState([]);
    const [pages, setPages] = useState(null);
    const [loading, setLoading] = useState(false);

    function columns() {
        return [
            {
                id: "nom",
                Header: "Nom de la formule",
                accessor: d => d.nom,
            },
            {
                id: "activites",
                Header: "Activités ou familles d'activités",
                accessor: d => d.activites,
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return (
                        <div className="btn-wrapper">
                            <a className="btn-sm btn-primary m-r-sm" href={'/formules/' + props.original.id + "/edit"}>
                                <i className="fas fa-edit"/>
                            </a>

                            <a className="btn-sm btn-warning" onClick={() => deleteFormule(props.original)}>
                                <i className="fas fa-trash"/>
                            </a>
                        </div>
                    );
                },
                sortable: false,
                filterable: false,
            }
        ];
    }

    async function fetchData(state) {
        setLoading(true);
        try {
            await api.set()
                .success(res => {
                    setData(res.data);
                    setPages(res.pages);
                })
                .error(res => {
                    swal("Une erreur est survenue lors de la récupération des données", res.error, "error");

                })
                .get('/formules', {
                    page: state.page + 1,
                    pageSize: state.pageSize,
                    sorted: state.sorted,
                    filtered: state.filtered
                })
        } catch (error) {
            swal("Une erreur est survenue lors de la récupération des données", error, "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <p>Vous pouvez créer des formules pour proposer un prix pour plusieurs activités.</p>
            <div className="text-right">
                <button className="btn btn-primary"><i className="fa fa-plus mr-2"></i>Créer une formule</button>
            </div>

            <div className="ibox mt-5">
                <div className="ibox-content">
                    <ReactTable
                        columns={columns()}
                        data={data}
                        pages={pages}
                        loading={loading}
                        onFetchData={fetchData}
                        manual
                        className="-striped -highlight"
                        defaultPageSize={10}
                        previousText="Précédent"
                        nextText="Suivant"
                        loadingText="Chargement..."
                        noDataText="Aucune donnée"
                        pageText="Page"
                        ofText="sur"
                        rowsText="lignes"
                    />
                </div>
            </div>
        </div>
    )
}