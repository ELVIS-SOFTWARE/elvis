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


    // affichage des disponibilités
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

    // affichage des préférences de paiement
    if (paymentTerms && paymentTerms.length > 0) {
    const selectedPaymentMethod = availPaymentMethods.find(pm => pm.id === paymentTerms[0].payment_method_id).label;
    const selectedPaymentScheduleOption = availPaymentScheduleOptions.find(pso => pso.id === paymentTerms[0].payment_schedule_options_id).label;
    }


    // récupération des contacts
    const payers = [];
    const emergencyContacts = [];
    const legalReferents = [];
    const accompanying = [];
    if (application.infos.is_paying) {
        payers.push({
            name: application.infos.first_name + " " + application.infos.last_name,
        });
    }
    if (application.infos.family_links_with_user && application.infos.family_links_with_user.length > 0) {
        application.infos.family_links_with_user.forEach(familyMember => {
            if (familyMember.is_paying_for) {
                payers.push({
                    name: familyMember.first_name + " " + familyMember.last_name,
                });
            }
            if (familyMember.is_accompanying) {
                accompanying.push({
                        name: familyMember.first_name + " " + familyMember.last_name,
                });
            }
            if (familyMember.is_to_call) {
                emergencyContacts.push({
                        name: familyMember.first_name + " " + familyMember.last_name,
                });
            }
            if (familyMember.is_legal_referent) {
                legalReferents.push( {
                        name: familyMember.first_name + " " + familyMember.last_name,
                });
            }
        });
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
                                    <p className="font-weight-bold" style={{color: "#00283B"}}>/</p>
                                </div>
                                <div>
                                    <p className="m-0 small">Accompagnant</p>
                                    <p className="font-weight-bold" style={{color: "#00283B"}}>/</p>
                                </div>
                            </div>
                            <div className="col">
                                <p className="m-0 small">Contact d'urgence</p>
                                <p className="font-weight-bold" style={{color: "#00283B"}}>/</p>
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
                                        {payers.map(p => p.name).join(", ")}
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
