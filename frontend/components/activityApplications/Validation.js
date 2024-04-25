import React, {Fragment} from "react";
import _ from "lodash";
import TimePreferencesTable from "./TimePreferencesTable";
import SelectedActivitiesTable from "./SelectedActivitiesTable";
import EvaluationChoiceTable from "./EvaluationChoiceTable";



const moment = require("moment");
require("moment/locale/fr");

const Validation = ({
                        application,
                        activityRefs,
                        allActivityRefs,
                        allActivityRefKinds,
                        handleSubmit,
                        additionalStudents,
                        buttonDisabled,
                        handleComment,
                        selectedPacks,
                        packs,
                        paymentTerms,
                        availPaymentScheduleOptions,
                        availPaymentMethods,
                    }) => {
    const addStudents = [...additionalStudents];

    const activitiesWithEveilIds = _.chain(activityRefs)
        .filter(ref => ref.activity_type == "eveil_musical")
        .map(ref => ref.id)
        .value();

    const arrayfy = object => {
        var res = [];
        _.forEach(object, (value, key) => {
            if (!_.includes(activitiesWithEveilIds, parseInt(key))) {
                res.push([key, value]);
            } else {
                // cas des activités nécessitant un paramètre (éveil parental par ex)
                for (let i = 0; i < value; i++) {
                    res.push([key, 1]);
                }
            }
        });
        return res;
    };

    const enumerate = array => {
        var res = {};
        _.forEach(array, x => (res[x] = (res[x] || 0) + 1));
        return res;
    };

    const selectedActivities = application.selectedActivities.map(a =>
        _.find(allActivityRefs, ar => ar.id == a)
    );

    const selectedActivityIds = _.map(selectedActivities, sa => sa.id);

    const distinctSelectedActivityIds = arrayfy(enumerate(selectedActivityIds));

    const showChildhoodActivities = Object.keys(application.childhoodPreferences).length > 0;
    const showOtherActivities = _.intersection(activityRefs.filter(a => a.allow_timeslot_selection == false).map(a => a.id), application.selectedActivities).length > 0;
    const showTimePreferences = application.intervals.length > 0 || showChildhoodActivities || showOtherActivities;

    const address = Object.values(application.infos.addresses).filter(a => a.city && a.country && a.postcode)[0];

    const selectedEvaluations = Object.entries(application.selectedEvaluationIntervals)
        .map(([refId, timeInterval]) => ({refId, timeInterval}));


    // Récupération des contacts et des payeurs -------------------------------------------------------------------------------------------------------------
    const pushPayerToList = (payer, list) => {
        const { first_name, last_name } = payer;
        list.push({
            name: `${first_name} ${last_name}`,
        });
    };
    const payersList = [];
    const emergencyContacts = [];
    const legalReferents = [];
    const accompanying = [];

    const { infos } = application;
    const { is_paying, id, first_name, last_name, family_links_with_user, payers } = infos;
    is_paying && (!payers || payers.includes(id)) ? pushPayerToList({ first_name, last_name }, payersList) : null;

    // récupération des contacts et des payeurs parmis les membres de la famille
    family_links_with_user && family_links_with_user.forEach(familyMember => {
        const { id, first_name, last_name, is_paying_for, is_accompanying, is_to_call, is_legal_referent } = familyMember;
        is_paying_for && (!payers || payers.includes(id)) ? pushPayerToList({ first_name, last_name }, payersList) : null;
        is_accompanying ? accompanying.push({ name: `${first_name} ${last_name}` }) : null;
        is_to_call ? emergencyContacts.push({ name: `${first_name} ${last_name}` }) : null;
        is_legal_referent ? legalReferents.push({ name: `${first_name} ${last_name}` }) : null;
    });
    payersList.length === 0 ? payersList.push({ name: "/" }) : null;
    accompanying.length === 0 ? accompanying.push({ name: "/" }) : null;
    emergencyContacts.length === 0 ? emergencyContacts.push({ name: "/" }) : null;
    legalReferents.length === 0 ? legalReferents.push({ name: "/" }) : null;


    // Affichage des disponibilités -------------------------------------------------------------------------------------------------------------
    const preferencesArray = [];
    if (application.intervals.length > 0) {
        preferencesArray.push({
            intervals: application.intervals
        });
    }
    if (showChildhoodActivities) {
        Object.keys(application.childhoodPreferences).forEach(refId => {
            preferencesArray.push({
                activityRef: allActivityRefs.find(ref => ref.id === parseInt(refId)),
                preferences: application.childhoodPreferences[refId]
            });
        });
    }

    // Affichage des préférences de paiement -------------------------------------------------------------------------------------------------------------
    let selectedPaymentMethod
    let selectedPaymentScheduleOption
    if (paymentTerms && paymentTerms[0]) {
        const paymentMethod = availPaymentMethods.find(pm => pm.id === paymentTerms[0].payment_method_id);
        if (paymentMethod) {
            selectedPaymentMethod = paymentMethod.label;
        }
        const paymentScheduleOption = availPaymentScheduleOptions.find(pso => pso.id === paymentTerms[0].payment_schedule_options_id);
        if (paymentScheduleOption) {
            selectedPaymentScheduleOption = paymentScheduleOption.label;
        }
    }


    return (
        <div className="row mb-5">

            <div className="col-md-7">
                <p className="small font-weight-bold mb-2" style={{color: "#8AA4B1"}}>
                    RECAPITULATIF DE LA DEMANDE
                </p>

                <div className="p-5" style={{backgroundColor: "white", borderRadius: 12}}>

                    {/*Elève*/}
                    <div className="d-inline-flex mb-4 pt-3">
                        <div className="mr-5">
                            <img className="img-circle m-t-none" alt="avatar" src="" width="60" height="60"/>
                        </div>
                        <div>
                            <h3 className="font-weight-bold" style={{color: "#00283B"}}>
                                {application.infos.first_name}{" "}
                                {application.infos.last_name}
                            </h3>
                        </div>
                    </div>

                    {/*Informations personnelles*/}
                    <div className="mb-4">
                        <p className="small font-weight-bold mb-3" style={{color: "#8AA4B1"}}>
                            INFORMATIONS PERSONNELLES
                        </p>
                        <div className="row">
                            <div className="col-md-6">
                                <p className="m-0 small">Date de naissance</p>
                                <p className="font-weight-bold" style={{color: "#00283B"}}>
                                    {moment(application.infos.birthday).format(
                                        "DD/MM/YYYY"
                                    )}
                                </p>
                            </div>
                            {application.infos.sex ?
                                <div className="col">
                                    <p className="m-0 small">Sexe</p>
                                    <p className="font-weight-bold"
                                       style={{color: "#00283B"}}>{application.infos.sex}</p>
                                </div>
                                : ""}
                        </div>
                    </div>

                    {/*Coordonnées personnelles*/}
                    <div className="mb-4">
                        <p className="small font-weight-bold" style={{color: "#8AA4B1"}}>
                            COORDONNES PERSONNELLES
                        </p>

                        <div className="row">
                            <div className="col-md-6">
                                <p className="m-0 small">Adresse(s)</p>
                                {_.map(application.infos.addresses, (address, i) => (
                                    <div key={i}>
                                        <p className="font-weight-bold" style={{color: "#00283B"}}>
                                            {address.street_address}<br/>
                                            {address.postcode} {address.city}<br/>
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="col">
                                {_.map(_.filter(application.infos.telephones, p => p.label && p.number), (p, i) => (
                                    <div key={i}>
                                        <p className="m-0 small">Télephone {p.label}:</p>
                                        <p className="font-weight-bold" style={{color: "#00283B"}}>{p.number}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/*Contacts*/}
                    <div className="mb-4">
                        <p className="small font-weight-bold" style={{color: "#8AA4B1"}}>
                            CONTACTS
                        </p>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <p className="m-0 small">Représentant légal</p>
                                    <p className="font-weight-bold" style={{color: "#00283B"}}>
                                        {legalReferents.map(p => p.name).join(", ")}
                                    </p>
                                </div>
                                <div>
                                    <p className="m-0 small">Accompagnant</p>
                                    <p className="font-weight-bold" style={{color: "#00283B"}}>
                                        {accompanying.map(p => p.name).join(", ")}
                                    </p>
                                </div>
                            </div>
                            <div className="col">
                                <p className="m-0 small">Contact d'urgence</p>
                                <p className="font-weight-bold" style={{color: "#00283B"}}>
                                    {emergencyContacts.map(p => p.name).join(", ")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/*Activités sélectionnées*/}
                    <div className="mb-4">
                        <p className="small font-weight-bold" style={{color: "#8AA4B1"}}>
                            ACTIVITES SELECTIONNEES
                        </p>
                        <div>
                            <SelectedActivitiesTable
                                duration={application.duration}
                                selectedActivities={selectedActivities}
                                selectedPacks={selectedPacks}
                                packs={packs}
                                allActivityRefs={allActivityRefs}
                            />
                        </div>
                    </div>

                    {/*Disponibilités*/}
                    {showTimePreferences ? (
                        <div className="mb-4">
                            <p className="small font-weight-bold" style={{color: "#8AA4B1"}}>
                                DISPONIBILITES
                            </p>
                            {preferencesArray.map((pref, index) => (
                                <TimePreferencesTable
                                    key={index}
                                    activityRef={pref.activityRef}
                                    preferences={pref.preferences}
                                    intervals={pref.intervals}
                                />
                            ))}
                        </div>
                    ) : null}

                    {/*Evaluations*/}
                    {selectedEvaluations.length > 0 && _.size(application.selectedEvaluationIntervals) > 0 ? (
                        <div className="mb-4">
                            <p className="small font-weight-bold" style={{color: "#8AA4B1"}}>
                                EVALUATION DE NIVEAU
                            </p>
                            <EvaluationChoiceTable
                                activityRefs={allActivityRefs}
                                data={selectedEvaluations}
                                showChoiceNumber={false}/>
                        </div>

                    ) : null}

                    {/*Préférence de paiement*/}
                    {paymentTerms.length > 0 ? (
                        <div className="mb-4">
                            <p className="small font-weight-bold" style={{color: "#8AA4B1"}}>
                                PREFERENCE DE PAIEMENT
                            </p>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <p className="m-0 small">Echéancier</p>
                                        <p className="font-weight-bold" style={{color: "#00283B"}}>{selectedPaymentScheduleOption}</p>
                                    </div>
                                    <div>
                                        <p className="m-0 small">Moyen de paiement</p>
                                        <p className="font-weight-bold" style={{color: "#00283B"}}>{selectedPaymentMethod}</p>
                                    </div>
                                </div>
                                <div className="col">
                                    <p className="m-0 small">Payeur(s)</p>
                                    <p className="font-weight-bold" style={{color: "#00283B"}}>
                                        {payersList.map(p => p.name).join(", ")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}


                </div>
                <button
                    onClick={handleSubmit}
                    disabled={buttonDisabled}
                    className="btn btn-primary btn-md submit-activity"
                >
                    {buttonDisabled ? (
                        <Fragment><i className="fa fa-spinner fa-spin"/> &nbsp;</Fragment>
                    ) : ""}
                    {"Envoyer la demande"}
                </button>
            </div>


            <div className="col-md-5">
                <div className=" small font-weight-bold mb-2" style={{color: "#8AA4B1"}}>
                    COMMENTAIRE
                </div>
                <div>
                        <textarea name="comment" className="form-control" style={{borderRadius: 12, border: 0}}
                                  onChange={(e) => handleComment(e.target.value)}/>
                </div>
            </div>
        </div>
    )
        ;
};

export default Validation;
