import React, {useState} from 'react';
import ReactTable from "react-table";
import * as api from "../../tools/api";
import swal from "sweetalert2";


export default function Formules() {
    const [data, setData] = useState([]);
    const [pages, setPages] = useState(0);
    const [loading, setLoading] = useState(false);

    function deleteFormule(formule)
    {
        swal({
            title: "Êtes-vous sûr ?",
            text: "Voulez-vous vraiment supprimer cette formule ?",
            type: "warning",
            buttons: true,
            dangerMode: true,
        })
        .then(async (willDelete) => {
            if (willDelete) {
                try {
                    await api.set()
                        .success(res => {
                            fetchData({page: 0, pageSize: 10, sorted: [], filtered: {}}, null);
                            swal({
                                title: "Formule supprimée",
                                text: "La formule a été supprimée avec succès",
                                type: "success",
                                timer: 1000
                            })
                        })
                        .error(res => {
                            swal("Une erreur est survenue lors de la suppression de la formule", res.error, "error");
                        })
                        .del('/formules/' + formule.id, {})
                } catch (error) {
                    console.error(error);
                    swal("Une erreur est survenue lors de la suppression de la formule", error.message, "error");
                }
            }
        });
    }

    function columns()
    {
        return [
            {
                id: "name",
                Header: "Nom de la formule",
                accessor: d => d.name,
            },
            {
                id: "activites",
                Header: "Activités ou familles d'activités",
                accessor: d => (d.activities || []).map(activite => activite.display_name).join(', '),
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

    async function fetchData(state, instance) {
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
                    sorted: state.sorted[0] ? JSON.stringify(state.sorted[0]) : null,
                    filtered: JSON.stringify(state.filtered)
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
                <a className="btn btn-sm btn-primary" href={"/formules/new"}>
                    <i className="fa fa-plus mr-2"></i>Créer une formule
                </a>
            </div>

            <div className="ibox mt-5">
                <div className="ibox-content p-5">
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