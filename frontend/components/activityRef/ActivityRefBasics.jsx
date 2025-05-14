import React from "react";
import { csrfToken } from "../utils";
import swal from "sweetalert2";
import { Form, Field, FormSpy } from "react-final-form";
import Input from "../common/Input";
import InputSelect from "../common/InputSelect";
import InputColor from "../common/InputColor";
import DragAndDrop from "../editParameters/DragAndDrop";
import BaseDataTable from "../common/baseDataTable/BaseDataTable";
import ActivityRefPricingModal from "./ActivityRefPricingModal";
import DefaultActionButtons from "../common/baseDataTable/DefaultActionButtons";
import DefaultCreateButton from "../common/baseDataTable/DefaultCreateButton";
import * as api from "../../tools/api";
import ActivityRefDataService from "./ActivityRefDataService";
import NewActivityRefDataService from "./NewActivityRefDataService";

const required = value => (value ? undefined : 'requis')
const mustBeNumber = value => ((value!==undefined && isNaN(value)) ? 'doit être un nombre' : undefined)
const mustBeInteger = value => (!Number.isInteger(Number(value)) ? 'doit être un entier' : undefined)
const mustBeIntegerOrUndefined = value => ((value!==undefined && !Number.isInteger(Number(value))) ? 'doit être un entier' : undefined)
const minValue = min => value =>
    isNaN(value) || value >= min ? undefined : `doit être supérieur à ${min}`
const composeValidators = (...validators) => value =>
    validators.reduce((error, validator) => error || validator(value), undefined)


export default class ActivityRefBasics extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            tabs: [],
            activityRefKinds: this.props.activityRefKinds.map(ark => { return { value: ark[1], label: ark[0] } }),
            seasons: [],
            pricingCategories: [],
            activityRefPricings: [],
            packs: [],
        }

        this.activityTypes = this.props.activityTypes
        this.addKind = this.addKind.bind(this);
        this.fetchSeasonsAndPricings();
        this.handleSaveForNewActivity = this.handleSaveForNewActivity.bind(this);
        this.handleUpdateForNewActivity = this.handleUpdateForNewActivity.bind(this);
        this.handleDeleteForNewActivity = this.handleDeleteForNewActivity.bind(this);
    }

    addKind()
    {
        swal({
            title: 'Ajouter une famille d\'activité',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Ajouter',
            showLoaderOnConfirm: true,
            preConfirm: async (text) =>
            {
                const response = await fetch('/activity_ref_kinds', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ activity_ref_kind: { name: text } })
                });

                const data = await response.json();

                if (data.message !== undefined && data.message !== "ok") {
                    swal.showValidationMessage(
                        data.message
                    )
                }

                return data
            }
        }).then(res =>
        {
            const value = (res.value || {}).value;

            if (value)
            {
                this.setState({ activityRefKinds: [...this.state.activityRefKinds, { value: value.id, label: value.name }] })
            }
        });
    }

    fetchSeasonsAndPricings = () => {
        api.set()
            .success(res => {
                this.setState({
                    seasons: res.seasons,
                    pricingCategories: res.pricing_categories,
                    activityRefPricings: this.props.activityRef.id === null ? [] : res.activity_ref_pricings,
                    packs: res.packs
                })
            })
            .error(res => {
                swal("Une erreur est survenue lors de la récupération des saisons ou des catégories de prix", res.error, "error");
            })
            .get("/activity_ref_pricings/get_seasons_and_pricing_categories", {});
    }

    handleSaveForNewActivity(pricingCategory) {
        this.props.addPricingCategoriesToSave(pricingCategory);
    }

    handleUpdateForNewActivity(pricingCategory) {
        this.props.updatePricingCategoriesToSave(pricingCategory);
    }

    handleDeleteForNewActivity(pricingCategory) {
        this.props.deletePricingCategoriesToSave(pricingCategory);
    }

    CreateButton({onCreate}) {
        return (
            <DefaultCreateButton
                label={"Créer un tarif"}
                onCreate={onCreate}
            />
        );
    }

    render() {
        if (this.state.seasons.length === 0) {
            return <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
            </div>
        } else {
            const columns = [
                {
                    id: "pricing_name",
                    Header: "Nom",
                    accessor: "pricing_category.name",
                },
                {
                    id: "activity_quantity",
                    Header: "Nombre de cours",
                    accessor: "pricing_category.number_lessons",
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
                        const seasonStart = this.state.seasons.find(s => s.id === row.original.from_season_id);
                        const seasonEnd = row.original.to_season_id !== undefined ? this.state.seasons.find(s => s.id === row.original.to_season_id) : null;
                        return seasonEnd !== undefined ? seasonStart.label + " > " + seasonEnd.label : seasonStart.label + " > ...";
                    }
                },
            ];

            const {activityRef} = this.props;
            let dataService = null;

            if (activityRef.id !== null)
                // si l'activité existe déjà, on utilise le dataService classique
                dataService = new ActivityRefDataService(activityRef.id, this.state.packs);
            else
                // sinon, on utilise le dataService pour les nouvelles activités
                dataService = new NewActivityRefDataService(this.handleSaveForNewActivity, this.handleUpdateForNewActivity, this.handleDeleteForNewActivity, this.state.activityRefPricings, this.state.pricingCategories);

            return (
                <div>
                    <hr/>
                    <div className="row">
                        <DragAndDrop
                            file_url={this.props.activityRefImage}
                            setFile={f => this.props.onImageChange ? this.props.onImageChange(f) : ""}
                            acceptedTypes={"image/jpeg, image/png, image/jpg"}
                            textDisplayed={"Pour ajouter une image, déposez un fichier ici ou"}/>
                    </div>

                    <div className="row">

                        <div className="col-sm-6">
                            <Field
                                label="Nom"
                                name="activityRef.label"
                                type="text"
                                required
                                validate={required}
                                render={Input}
                            />
                        </div>

                        <div className="col-sm-6">
                            <Field
                                label="Famille"
                                name="activityRef.activity_ref_kind_id"
                                type="select"
                                required
                                validate={required}
                                componentAdd={this.state.activityRefKinds.length === 0 ?
                                    <i className="fa fa-plus pointer-event" onClick={this.addKind}/> : undefined}
                                options={this.state.activityRefKinds}
                                render={InputSelect}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-6">
                            <Field
                                label="Nombre de places"
                                name="activityRef.occupation_limit"
                                type="number"
                                required
                                validate={composeValidators(required, mustBeInteger, minValue(0))}
                                render={Input}
                            />
                        </div>

                        <div className="col-sm-6">
                            <Field
                                label={"Places (avec surbooking)"}
                                name="activityRef.occupation_hard_limit"
                                type="number"
                                required
                                tooltip="En remplissant ce champ, vous pouvez ajouter des nouvelles places sur cette activité. Les nouvelles places seront disponibles à l'inscription."
                                validate={composeValidators(required, mustBeInteger, minValue(0))}
                                render={Input}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-6">
                            <Field
                                label="Âge minimum (inclus)"
                                name="activityRef.from_age"
                                type="number"
                                required
                                validate={composeValidators(required, mustBeInteger, minValue(0))}
                                render={Input}
                            />
                        </div>

                        <div className="col-sm-6">
                            <Field
                                label="Âge maximum (exclu)"
                                name="activityRef.to_age"
                                type="number"
                                required
                                validate={composeValidators(required, mustBeInteger, minValue(0))}
                                render={Input}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-6">
                            <Field
                                label="Type d'activité"
                                name="activityRef.activity_type"
                                type="select"
                                render={InputSelect}
                                options={this.activityTypes}
                            />
                        </div>
                        <div className="col-sm-6">
                            <Field
                                label="Durée (en minutes)"
                                name="activityRef.duration"
                                type="number"
                                required
                                validate={composeValidators(required, mustBeIntegerOrUndefined, minValue(0))}
                                render={Input}
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-sm-6">
                            <div className="form-group">
                                <label className="small d-block mb-1" style={{ color: "#003E5C" }}>
                                    Couleur du créneau dans le planning
                                </label>

                                <p className="text-muted small mb-2">
                                    Choisissez une couleur pour identifier facilement cette activité sur le planning
                                </p>

                                <Field
                                    name="activityRef.color_code"
                                    component={InputColor}
                                    label={null}
                                />
                            </div>
                        </div>
                    </div>


                    <hr />

                    <div className="row">
                        <div className="col-sm-6">
                            <label>Nombre de cours et tarifs</label>
                            <p className="mt-3">Vous pouvez paramétrer un nombre de séances et un tarif pour votre
                                activité</p>
                        </div>

                        <div className="col-sm-12 mt-4 mb-5">
                            <BaseDataTable
                                dataService={dataService}
                                columns={columns}
                                actionButtons={DefaultActionButtons}
                                createButton={this.CreateButton.bind(this)}
                                formContentComponent={
                                    (props) => <ActivityRefPricingModal
                                        {...props}
                                        seasons={this.state.seasons}
                                        pricingCategories={this.state.pricingCategories}
                                    />
                                }
                                showFullScreenButton={false}
                                oneResourceTypeName="un tarif"
                                thisResourceTypeName="ce tarif"
                                defaultSorted={[{id: "to_season_id", desc: true}, {id: "pricing_category_id", asc: true}]}
                            />
                        </div>

                        {/*<div className="col-sm-12">*/}
                        {/*    <label>Choix des séances</label><br/>*/}
                        {/*    <Field*/}
                        {/*        name="activityRef.studentCanPick"*/}
                        {/*        type="checkbox"*/}
                        {/*        component="input"*/}
                        {/*        className="form-check-input mt-3 ml-2"*/}
                        {/*    />*/}
                        {/*    <span className="ml-2">L'élève peut choisir le créneau de sa séance de cours depuis son interface</span>*/}
                        {/*</div>*/}
                    </div>

                </div>
            );
        }
    }
}