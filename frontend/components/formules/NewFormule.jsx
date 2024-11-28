import React, {useEffect, useState} from 'react';
import Modal from "react-modal";
import * as api from "../../tools/api";
import swal from "sweetalert2";
import Select, {default as ReactSelect, components} from "react-select";
import ReactTable from "react-table";

const Option = (props) => {
    const {data, isSelected} = props;

    return (
        <components.Option {...props}>
            {data.isFamily ? (
                <div style={{fontWeight: "bold"}}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => null}
                        style={{marginRight: "10px"}}
                    />
                    {data.label}
                </div>
            ) : (
                <div className="ml-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => null}
                        style={{marginRight: "10px"}}
                    />
                    {data.label}
                </div>
            )}
        </components.Option>
    );
};

export default function NewFormule() {
    const [activityModalIsOpen, setActivityModalIsOpen] = useState(false);
    const [priceModalIsOpen, setPriceModalIsOpen] = useState(false);
    const [activities, setActivities] = useState([]);
    const [activityRefKind, setActivityRefKind] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [pricingCategories, setPricingCategories] = useState([]);
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [nbActivitiesToSelect, setNbActivitiesToSelect] = useState(0);
    const [formulePrices, setFormulePrices] = useState([]);
    const [currentFormulePrice, setCurrentFormulePrice] = useState({
        priceCategory: '',
        price: '',
        from: '',
        to: ''
    });
    const [validationError, setValidationError] = useState({
        selectedActivities: '',
        nbActivitiesToSelect: '',
        priceCategory: '',
        price: '',
        from: ''
    });

    async function fetchActivities() {
        try {
            await api.set()
                .success(res => {
                    setActivities(res);
                })
                .error(res => {
                    swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
                })
                .get('/activity_ref');
        } catch (e) {
            swal("Une erreur est survenue lors de la récupération des données", e.message, "error");
        }
    }

    async function fetchActivityRefKind() {
        try {
            await api.set()
                .success(res => {
                    setActivityRefKind(res);
                })
                .error(res => {
                    swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
                })
                .get('/activity_ref_kind');
        } catch (e) {
            swal("Une erreur est survenue lors de la récupération des données", e.message, "error");
        }
    }

    async function fetchSeasonsAndPricings() {
        try {
            await api.set()
                .success(res => {
                    setSeasons(res.seasons);
                    setPricingCategories(res.pricing_categories);
                })
                .error(res => {
                    swal("Une erreur est survenue lors de la récupération des saisons ou des catégories de prix", res.error, "error");
                })
                .get("/activity_ref_pricings/get_seasons_and_pricing_categories", {});
        } catch (e) {
            swal("Une erreur est survenue lors de la récupération des saisons ou des catégories de prix", e.message, "error");
        }

    }

    useEffect(() => {
        fetchActivities();
        fetchActivityRefKind();
        fetchSeasonsAndPricings();
    }, []);

    // --------------------------------- Gestion des activités ---------------------------------
    function displayActivities() {
        const familyOptions = activityRefKind.map(kind => ({
            label: `${kind.name}`,
            value: `family-${kind.id}`,
            isFamily: true,
            activities: activities
                .filter(activity => activity.activity_ref_kind_id === kind.id)
                .map(activity => ({
                    label: activity.label,
                    value: `activity-${activity.id}`,
                    isFamily: false,
                })),
        }));

        return familyOptions.reduce((acc, family) => {
            acc.push({
                ...family,
                activities: family.activities, // Inclure les activités sous la famille
            });
            family.activities.forEach(activity => acc.push(activity));
            return acc;
        }, []);
    }

    function handleActivityChange(selectedOptions) {
        if (!selectedOptions) {
            setSelectedActivities([]);
            setValidationError(prevState => ({
                ...prevState,
                selectedActivities: 'Veuillez sélectionner au moins une activité.'
            }));
            return;
        }
        const selected = [];

        selectedOptions.forEach(option => {
            if (option.isFamily) {   // Ajouter toutes les activités de la famille sélectionnée
                const familyActivities = activities
                    .filter(activity => `family-${activity.activity_ref_kind_id}` === option.value)
                    .map(activity => ({
                        label: activity.label,
                        value: `activity-${activity.id}`,
                    }));
                selected.push(...familyActivities);
            } else {// Ajouter une activité spécifique
                selected.push(option);
            }
        });
        const uniqueSelectedActivities = Array.from(
            new Map(selected.map(item => [item.value, item])).values()
        );

        setSelectedActivities(uniqueSelectedActivities);
        setValidationError(prevState => ({
            ...prevState,
            selectedActivities: ''
        }));
    }

    function handleNbActivitiesToSelectChange(e) {
        const value = e.target.value;
        if (isNaN(value)) {
            setValidationError(prevState => ({
                ...prevState,
                nbActivitiesToSelect: 'Veuillez entrer un nombre valide.'
            }));
        } else {
            setNbActivitiesToSelect(value);
            setValidationError(prevState => ({
                ...prevState,
                nbActivitiesToSelect: ''
            }));
        }
    }

    function handleValidateActivityModal() {
        let errors = {
            selectedActivities: '',
            nbActivitiesToSelect: ''
        };
        if (selectedActivities.length === 0) {
            errors.selectedActivities = 'Veuillez sélectionner au moins une activité.';
        }
        if (nbActivitiesToSelect === 0) {
            errors.nbActivitiesToSelect = `Veuillez indiquer le nombre d'activités à choisir.`;
        }
        setValidationError(errors);

        if (!errors.selectedActivities && !errors.nbActivitiesToSelect) {
            setActivityModalIsOpen(false);
        }
    }

    function handleCloseActivityModal() {
        setSelectedActivities([]);
        setNbActivitiesToSelect(0);
        setActivityModalIsOpen(false);
    }

    function handleDeleteActivity(activityValue) {
        setSelectedActivities(selectedActivities.filter(activity => activity.value !== activityValue));
    }


    // --------------------------------- Gestion des tarifs ---------------------------------

    function displayFormulePrices() {
        return [
            {
                id: "name",
                Header: "Nom",
                accessor: d => d.priceCategory,
            },
            {
                id: "price",
                Header: "Tarif en €",
                accessor: d => d.price,
            },
            {
                id: "from",
                Header: "Saisons concernées",
                accessor: d => {
                    if (d.to) {
                        return `${d.fromLabel} - ${d.toLabel}`;
                    } else {
                        return d.fromLabel;
                    }
                }
            },
            {
                id: "actions",
                Header: "Actions",
                Cell: props => {
                    return (
                        <div className="btn-wrapper">
                            <button className="btn-sm btn-warning"
                                    onClick={() => handleDeleteFormulePrice(props.original)}>
                                <i className="fas fa-trash"/>
                            </button>
                        </div>
                    );
                },
                sortable: false,
                filterable: false,
            }
        ];
    }

    function displayPricingCategories() {
        return pricingCategories.map(category => ({
            label: category.name,
            value: category.id
        }));
    }

    function displaySeasons() {
        return seasons.map(season => ({
            label: season.label,
            value: season.id
        }));
    }

    function handlePriceFormuleChange(selectedOption, field) {
        const value = selectedOption ? selectedOption.value : '';
        const label = selectedOption ? selectedOption.label : '';
        let error = '';

        switch (field) {
            case 'price':
                if (isNaN(value)) {
                    error = 'Veuillez entrer un prix valide.';
                }
                break;
            case 'priceCategory':
                if (!value) {
                    error = 'Veuillez sélectionner une catégorie de tarif.';
                }
                break;
            case 'from':
                if (!value) {
                    error = 'Veuillez sélectionner une saison.';
                }
                break;
            default:
                break;
        }

        setCurrentFormulePrice(prevState => ({
            ...prevState,
            [`${field}Id`]: value,
            [field]: field === 'priceCategory' ? label : value,
            [`${field}Label`]: field === 'from' || field === 'to' ? label : ''

        }));

        setValidationError(prevState => ({
            ...prevState,
            [field]: error
        }));

    }


    function handleValidatePriceModal() {
        let errors = {
            priceCategory: '',
            price: '',
            from: ''
        };

        if (!currentFormulePrice.price) {
            errors.price = 'Veuillez entrer un prix.';
        }

        if (!currentFormulePrice.priceCategory) {
            errors.priceCategory = 'Veuillez sélectionner un type de tarif.';
        }

        if (!currentFormulePrice.from) {
            errors.from = 'Veuillez sélectionner une saison.';
        }

        setValidationError(errors);

        if (!errors.priceCategory && !errors.price && !errors.from) {
            setFormulePrices(prevState => [
                ...prevState,
                {...currentFormulePrice}
            ]);
            setCurrentFormulePrice({
                priceCategory: '',
                price: '',
                from: '',
                to: ''
            });
            setPriceModalIsOpen(false);
        }
    }

    function handleClosePriceModal() {
        setCurrentFormulePrice({priceCategory: '', price: '', from: '', to: ''});
        setPriceModalIsOpen(false);
    }

    function handleDeleteFormulePrice(formulePrice) {
        setFormulePrices(formulePrices.filter(price => price !== formulePrice));
    }

    return (
        <div className="row p-2">
            <form>
                <div className="row">
                    <div className="col-md-6 col-xs-12">

                        <div className="form-group mb-5">
                            <label htmlFor="nom">Nom de la formule</label>
                            <input type="text" className="form-control" id="nom"/>
                        </div>

                        <div className="form-group mb-5">
                            <label htmlFor="description">Description</label>
                            <textarea className="form-control" id="description"/>
                        </div>

                        <div className="d-inline-flex justify-content-between w-100 mt-5">
                            <div>
                                <label htmlFor="activites">Activités</label>
                            </div>
                            <div>
                                <button type="button" className="btn btn-primary"
                                        onClick={() => setActivityModalIsOpen(true)}>
                                    Ajouter une activité
                                </button>
                            </div>

                        </div>

                        {selectedActivities.map(activity => (
                            <div key={activity.value} className="form-group mt-3 m-0">
                                <div
                                    className="form-control d-inline-flex align-items-center justify-content-between p-5">
                                    <label style={{color: "#00334A"}}>{activity.label}</label>
                                    <button type="button" className="btn"
                                            onClick={() => handleDeleteActivity(activity.value)}>
                                        <i className="fas fa-trash" style={{color: "#00334A"}}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-md-10 col-xs-12 pl-0 mt-5">
                    <div className="d-inline-flex justify-content-between w-100 mt-5">
                        <div>
                            <label htmlFor="activites">Tarif</label>
                        </div>
                        <div>
                            <button type="button" className="btn btn-primary" onClick={() => setPriceModalIsOpen(true)}>
                                Créer un tarif
                            </button>
                        </div>
                    </div>
                    <div className="ibox mt-3">
                        <div className="ibox-content p-5">
                            <ReactTable
                                columns={displayFormulePrices()}
                                data={formulePrices}
                                defaultPageSize={5}
                                className="-striped -highlight"
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

                <div className="row">
                    <div className="col-md-10 col-xs-12 text-right mt-5">
                        <button type="submit" className="btn btn-primary">Enregistrer</button>
                    </div>
                </div>
            </form>

            {/*---------------------------------Activity Modal------------------------------------*/}
            <Modal isOpen={activityModalIsOpen} contentLabel="addActivityModal" className="Modal p-3"
                   ariaHideApp={false}>
                <button type="button" className="close" onClick={handleCloseActivityModal}>&times;</button>

                <div className="row m-5">
                    <h2 className="m-0">Ajouter des activités à une formule</h2>
                    <div className="mt-5">
                        <div className="form-group mb-5">
                            <label htmlFor="activites">Sélectionner une famille ou des activités</label>
                            <ReactSelect
                                options={displayActivities()}
                                isMulti={true}
                                isClearable={true}
                                components={{Option}}
                                value={selectedActivities}
                                onChange={handleActivityChange}
                                closeMenuOnSelect={false}
                                required
                            />
                            {validationError.selectedActivities &&
                                <div className="text-danger">{validationError.selectedActivities}</div>}
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="activitiesToSelect">Nombre d'activités à choisir parmi les activités
                                sélectionnées</label>
                            <input
                                type="text"
                                className="form-control"
                                id="activitiesToSelect"
                                onChange={handleNbActivitiesToSelectChange}
                                required={true}
                            />
                            {validationError.nbActivitiesToSelect &&
                                <div className="text-danger">{validationError.nbActivitiesToSelect}</div>}
                        </div>
                    </div>
                </div>
                <div className="row text-right m-5">
                    <button className="btn btn-primary" onClick={handleValidateActivityModal}>Valider</button>
                </div>
            </Modal>

            {/*---------------------------------Price Modal------------------------------------*/}
            <Modal isOpen={priceModalIsOpen} contentLabel="addPriceModal" className="Modal p-3" ariaHideApp={false}>
                <button type="button" className="close" onClick={handleClosePriceModal}>&times;</button>

                <div className="row m-5">
                    <h2 className="m-0">Créer un tarif</h2>
                    <div className="mt-5">
                        <div className="form-group mb-5">
                            <label htmlFor="price">Type de tarif</label>
                            <Select
                                options={displayPricingCategories()}
                                onChange={(selectedOption) => handlePriceFormuleChange(selectedOption, 'priceCategory')}

                                required
                            />
                            {validationError.priceCategory &&
                                <div className="text-danger">{validationError.priceCategory}</div>}
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="price">Prix</label>
                            <input
                                type="text"
                                className="form-control"
                                id="activitiesToSelect"
                                onChange={(e) => handlePriceFormuleChange({value: e.target.value}, 'price')}

                                required={true}
                            />
                            {validationError.price &&
                                <div className="text-danger">{validationError.price}</div>}
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="price">A partir de</label>
                            <Select
                                options={displaySeasons()}
                                onChange={(selectedOption) => handlePriceFormuleChange(selectedOption, 'from')}

                                required
                            />
                            {validationError.from && <div className="text-danger">{validationError.from}</div>}
                        </div>
                        <div className="form-group mb-5">
                            <label htmlFor="price">Jusqu'à (optionnel)</label>
                            <Select
                                options={displaySeasons()}
                                onChange={(selectedOption) => handlePriceFormuleChange(selectedOption, 'to')}
                            />
                        </div>
                    </div>
                </div>
                <div className="row text-right m-5">
                    <button className="btn btn-primary" onClick={handleValidatePriceModal}>Valider</button>
                </div>
            </Modal>

        </div>
    );
}
