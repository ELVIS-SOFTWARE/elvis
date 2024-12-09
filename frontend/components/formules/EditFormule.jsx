import React, { Fragment, useEffect, useState } from "react";
import * as api from "../../tools/api";
import swal from "sweetalert2";
import ReactTable from "react-table";
import BaseDataTable from "../common/baseDataTable/BaseDataTable";
import ActivityRefPricingModal from "../activityRef/ActivityRefPricingModal";
import DefaultActionButtons from "../common/baseDataTable/DefaultActionButtons";
import FormulePricingDataService from "./FormulePricingDataService";
import NewFormulePricingDataService from "./NewFormulePricingDataService";
import DefaultCreateButton from "../common/baseDataTable/DefaultCreateButton";

/**
 *
 * @param {{
 * id: number,
 * name: string,
 * description: string,
 * active: boolean,
 * number_of_items: number,
 * formule_items: {
 *   id: number,
 *   item: {
 *      id: number,
 *      name: string
 *   },
 *   is_for_kind: boolean
 * }[]
 * formule_pricings: {
 *     id: number,
 *     price: number,
 *     pricing_category: {
 *      id: number,
 *      name: string
 *     },
 *     from_season: {
 *         id: number,
 *         name: string
 *     },
 *     to_season: {
 *         id: number,
 *         name: string
 *     }
 * }[]
 * }} formule
 * @returns {Element}
 * @constructor
 */
export default function EditFormule({formule})
{
    const [name, setName] = useState(formule.name);
    const [description, setDescription] = useState(formule.description);
    const [active, setActive] = useState(formule.active);
    const [number_of_items, setNumberOfItems] = useState(formule.number_of_items);

    const fActivities = formule.formule_items.filter(i => !i.is_for_kind).map(i => i.item);
    const fKinds = formule.formule_items.filter(i => i.is_for_kind).map(i => i.item);

    const [selectedActivities, setSelectedActivities] = useState(fActivities);
    const [selectedKinds, setSelectedKinds] = useState(fKinds);
    const [selectedPricings, setSelectedPricings] = useState(formule.formule_pricings);

    const [allActivities, setAllActivities] = useState([]);
    const [allKinds, setKinds] = useState([]);
    const [allSeasons, setAllSeasons] = useState([]);
    const [allPricingCategories, setAllPricingCategories] = useState([]);

    const [validationError, setValidationError] = useState({
        selectedActivities: '',
        nbActivitiesToSelect: '',
        priceCategory: '',
        price: '',
        fromSeason: ''
    });


    async function fetchActivityRefKind()
    {
        try
        {
            await api.set()
                .success(res =>
                {
                    setKinds(res);
                })
                .error(res =>
                {
                    swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
                })
                .get('/activity_ref_kind', {});
        }
        catch (e)
        {
            await swal("Une erreur est survenue lors de la récupération des données", e.message, "error");
        }
    }

    async function fetchActivities()
    {
        try
        {
            await api.set()
                .success(res =>
                {
                    setAllActivities(res);
                })
                .error(res =>
                {
                    swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
                })
                .get('/activity_ref', {});
        }
        catch (e)
        {
            await swal("Une erreur est survenue lors de la récupération des données", e.message, "error");
        }
    }

    async function fetchSeasonsAndPricings()
    {
        try
        {
            await api.set()
                .success(res =>
                {
                    setAllSeasons(res.seasons);
                    setAllPricingCategories(res.pricing_categories);
                })
                .error(res =>
                {
                    swal("Une erreur est survenue lors de la récupération des saisons ou des catégories de prix", res.error, "error");
                })
                .get("/activity_ref_pricings/get_seasons_and_pricing_categories", {});
        }
        catch (e)
        {
            await swal("Une erreur est survenue lors de la récupération des saisons ou des catégories de prix", e.message, "error");
        }

    }

    useEffect(async () =>
    {
        await Promise.all([fetchActivityRefKind(), fetchActivities(), fetchSeasonsAndPricings()]);
    }, []);


    // --------------------------------- Gestion des activités ---------------------------------
    function displayActivities()
    {
        const familyOptions = allKinds.map(kind => ({
            label: kind.name,
            value: kind.id,
            isFamily: true,
            activities: allActivities
                .filter(activity => activity.activity_ref_kind_id === kind.id)
                .map(activity => ({
                    label: activity.label,
                    value: activity.id,
                })),
        }));

        return familyOptions.reduce((acc, family) =>
        {
            acc.push({
                ...family,
                activities: family.activities, // Inclure les activités sous la famille
            });
            family.activities.forEach(activity => acc.push(activity));
            return acc;
        }, []);
    }

    // --------------------------------- HandleChanges ---------------------------------

    function handleNbActivitiesToSelectChange(e)
    {
        const value = e.target.value;
        if (isNaN(value))
        {
            setValidationError(prevState => ({
                ...prevState,
                nbActivitiesToSelect: 'Veuillez entrer un nombre valide.'
            }));
        }
        else
        {
            setNumberOfItems(parseInt(value));
            setValidationError(prevState => ({
                ...prevState,
                nbActivitiesToSelect: ''
            }));
        }
    }

    async function handleSubmit(e)
    {
        e.preventDefault();
    }

    function handleSavePricingForNewFormule(pricing) {
        setSelectedPricings([...selectedPricings, pricing]);
    }

    function handleUpdatePricingForNewFormule(pricing) {
        setSelectedPricings(selectedPricings.map(p => p.id === pricing.id ? pricing : p));
    }

    function handleDeletePricingForNewFormule(pricing) {
        setSelectedPricings(selectedPricings.filter(p => p.id !== pricing.id));
    }

    const pricingColumns = [
        {
            id: "pricing_name",
            Header: "Nom",
            accessor: "pricing_category.name",
        },
        {
            id: "amount",
            Header: "Tarif en €",
            accessor: "price",
        },
        {
            id: "selectedSeasons",
            Header: "Saisons concernées",
            Cell: row => {
                const seasonStart = allSeasons.find(s => s.id === row.original.from_season_id);
                const seasonEnd = row.original.to_season_id !== undefined ? allSeasons.find(s => s.id === row.original.to_season_id) : null;
                return seasonEnd !== undefined ? seasonStart.label + " > " + seasonEnd.label : seasonStart.label + " > ...";
            }
        },
    ];

    const pricingDataService = formule.id ? new FormulePricingDataService(formule.id) : new NewFormulePricingDataService(handleSavePricingForNewFormule, handleUpdatePricingForNewFormule, handleDeletePricingForNewFormule, selectedPricings, allPricingCategories)

    return <div className="row p-2">
        <form onSubmit={handleSubmit}>
            <div className="row">
                <div className="col-md-6 col-xs-12">
                    <div className="form-group mb-5">
                        <label htmlFor="name">Nom de la formule</label>
                        <input type="text" className="form-control" value={name}
                               onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="form-group mb-5">
                        <label htmlFor="description">Description</label>
                        <textarea className="form-control" id="description" rows="3" value={description}
                                  onChange={e => setDescription(e.target.value)} />
                    </div>

                    <div className="row">
                        <div className="col-sm-10">
                            <label htmlFor="activites">Activités</label>
                        </div>
                        <div className="col-sm-2 text-right">
                            <button type="button" className="btn btn-primary">
                                Ajouter une activité
                            </button>
                        </div>

                    </div>

                    {selectedKinds.map(kind => (
                        <div key={`kind_${activity.id}`} className="form-group mt-3 m-0">
                            <div
                                className="form-control d-inline-flex align-items-center justify-content-between p-5">
                                <label style={{ color: "#00334A" }}><small><i>Famille
                                    d'activité:</i></small> {kind.display_name}</label>
                                <button type="button" className="btn"
                                        onClick={() => setSelectedKinds(selectedKinds.filter(a => a.id !== kind.id))}>
                                    <i className="fas fa-trash" style={{ color: "#00334A" }} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {selectedActivities.map(activity => (
                        <div key={`activity_${activity.id}`} className="form-group mt-3 m-0">
                            <div
                                className="form-control d-inline-flex align-items-center justify-content-between p-5">
                                <label style={{ color: "#00334A" }}><small><i>activité:</i></small> {activity.display_name}
                                </label>
                                <button type="button" className="btn"
                                        onClick={() => setSelectedActivities(selectedActivities.filter(a => a.id !== activity.id))}>
                                    <i className="fas fa-trash" style={{ color: "#00334A" }} />
                                </button>
                            </div>
                        </div>
                    ))}

                </div>
            </div>

            <div className="col-md-10 col-xs-12 pl-0 mt-5">
                <div className="ibox mt-3">
                    <div className="ibox-content p-5">
                        <BaseDataTable
                            dataService={pricingDataService}
                            columns={pricingColumns}
                            actionButtons={DefaultActionButtons}
                            createButton={CreateButton.bind(this)}
                            formContentComponent={
                                (props) => <ActivityRefPricingModal
                                    {...props}
                                    seasons={allSeasons}
                                    pricingCategories={allPricingCategories}
                                />
                            }
                            showFullScreenButton={false}
                            oneResourceTypeName="un tarif"
                            thisResourceTypeName="ce tarif"
                            defaultSorted={[{id: "to_season_id", desc: true}, {id: "pricing_category_id", asc: true}]}
                        />
                    </div>
                </div>
            </div>
        </form>
    </div>
}

function CreateButton({onCreate}) {
    return (
        <DefaultCreateButton
            label={"Créer un tarif"}
            onCreate={onCreate}
        />
    );
}