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

    function archiveFormule(formule)
    {
        const isArchived = formule["archived?"];
        api.set()
            .success(() => {
                fetchData({page: 0, pageSize: 10, sorted: [], filtered: {}}, null);
                swal({
                    title: isArchived ? "Formule désarchivée" : "Formule archivée",
                    text: isArchived
                        ? "La formule est de nouveau proposée à l'inscription."
                        : "La formule n'est plus proposée à l'inscription. Les inscriptions existantes ne sont pas impactées.",
                    type: "success",
                    timer: 2500,
                });
            })
            .error(res => {
                swal("Une erreur est survenue lors de l'archivage de la formule", res.error, "error");
            })
            .patch('/formules/' + formule.id + '/archive', {});
    }

    function columns()
    {
        return [
            {
                id: "name",
                Header: "Nom de la formule",
                accessor: d => d.name,
                Cell: props => (
                    <span>
                        {props.original.name}
                        {props.original["archived?"] &&
                            <span className="badge badge-secondary m-l-sm">Archivée</span>}
                    </span>
                ),
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
<<<<<<< HEAD
                    const isUsed = props.original["used?"];
=======
                    const isArchived = props.original["archived?"];
>>>>>>> origin/main
                    return (
                        <div className="btn-wrapper">
                            <a className="btn-sm btn-primary m-r-sm" href={'/formules/' + props.original.id + "/edit"}>
                                <i className="fas fa-edit"/>
                            </a>

<<<<<<< HEAD
                            {isUsed ? (
                                <span className="btn-sm btn-warning disabled"
                                      style={{opacity: 0.5, cursor: "not-allowed"}}
                                      title="Impossible de supprimer une formule utilisée">
                                    <i className="fas fa-trash"/>
                                </span>
                            ) : (
                                <a className="btn-sm btn-warning" onClick={() => deleteFormule(props.original)}>
                                    <i className="fas fa-trash"/>
                                </a>
                            )}
=======
                            <a className="btn-sm btn-info m-r-sm"
                               title={isArchived ? "Désarchiver" : "Archiver"}
                               onClick={() => archiveFormule(props.original)}>
                                <i className={isArchived ? "fas fa-box-open" : "fas fa-archive"}/>
                            </a>

                            <a className="btn-sm btn-warning" onClick={() => deleteFormule(props.original)}>
                                <i className="fas fa-trash"/>
                            </a>
>>>>>>> origin/main
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