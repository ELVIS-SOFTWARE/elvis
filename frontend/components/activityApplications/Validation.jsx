import React, { Fragment } from "react";
import _ from "lodash";
import TimePreferencesTable from "./TimePreferencesTable";
import SelectedActivitiesTable from "./SelectedActivitiesTable";
import EvaluationChoiceTable from "./EvaluationChoiceTable";
import UserAvatar from "../UserAvatar";


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
                        formulas,
                        paymentTerms,
                        availPaymentScheduleOptions,
                        availPaymentMethods,
                        selectedFormulas,
                        selectedFormulaActivities,
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
        _.find(allActivityRefs, ar => ar.id == a),
    );

    const selectedActivityIds = _.map(selectedActivities, sa => sa.id);

    const distinctSelectedActivityIds = arrayfy(enumerate(selectedActivityIds));

    const showChildhoodActivities = Object.keys(application.childhoodPreferences).length > 0;
    const showOtherActivities = _.intersection(activityRefs.filter(a => a.allow_timeslot_selection == false).map(a => a.id), application.selectedActivities).length > 0;
    const showTimePreferences = application.intervals.length > 0 || showChildhoodActivities || showOtherActivities;

    const address = Object.values(application.infos.addresses).filter(a => a.city && a.country && a.postcode)[0];

    const selectedEvaluations = Object.entries(application.selectedEvaluationIntervals)
        .map(([refId, timeInterval]) => ({ refId, timeInterval }));


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
    const hasContacts = (contacts) => {
        return contacts.some(contact => contact.name !== "/");
    };

    const { infos } = application;
    const { is_paying, id, first_name, last_name, family_links_with_user, payers } = infos;
    if (is_paying || !payers || payers.includes(id)) {
        pushPayerToList({ first_name, last_name }, payersList);
    }

    // récupération des contacts et des payeurs parmis les membres de la famille
    if (family_links_with_user) {
        family_links_with_user.forEach(familyMember => {
            const {
                id,
                first_name,
                last_name,
                is_paying_for,
                is_accompanying,
                is_to_call,
                is_legal_referent,
            } = familyMember;

            if (is_paying_for || payers.includes(id)) {
                pushPayerToList({ first_name, last_name }, payersList);
            }

            if (is_accompanying) {
                accompanying.push({ name: `${first_name} ${last_name}` });
            }

            if (is_to_call) {
                emergencyContacts.push({ name: `${first_name} ${last_name}` });
            }

            if (is_legal_referent) {
                legalReferents.push({ name: `${first_name} ${last_name}` });
            }
        });
    }

    if (payersList.length === 0) {
        payersList.push({ name: "/" });
    }
    if (accompanying.length === 0) {
        accompanying.push({ name: "/" });
    }
    if (emergencyContacts.length === 0) {
        emergencyContacts.push({ name: "/" });
    }
    if (legalReferents.length === 0) {
        legalReferents.push({ name: "/" });
    }


    // Affichage des disponibilités -------------------------------------------------------------------------------------------------------------
    const preferencesArray = [];
    if (application.intervals.length > 0) {
        preferencesArray.push({
            intervals: application.intervals,
        });
    }
    if (showChildhoodActivities) {
        Object.keys(application.childhoodPreferences).forEach(refId => {
            preferencesArray.push({
                activityRef: allActivityRefs.find(ref => ref.id === parseInt(refId)),
                preferences: application.childhoodPreferences[refId],
            });
        });
    }

    // Affichage des préférences de paiement -------------------------------------------------------------------------------------------------------------
    let selectedPaymentMethod;
    let selectedPaymentScheduleOption;
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

    const totalActivitiesCost = selectedActivities.reduce((total, act) => {
        return total + (act && act.display_price ? parseFloat(act.display_price) : 0);
    }, 0);

    const totalFormulasCost = application.selectedFormulas.reduce((total, formulaId) => {
        const formula = (application.formulas || formulas || []).find(f => f.id === formulaId);
        return total + (formula && formula.formule_pricings && formula.formule_pricings[0]
            ? parseFloat(formula.formule_pricings[0].price)
            : 0);
    }, 0);

    const totalEstimatedCost = totalActivitiesCost + totalFormulasCost;


    return <Fragment>
        <div className="row mb-5">

            <div className="col-xl-7 col-md-12">
                <h3 className="font-weight-bold mb-2" style={{color: "#8AA4B1"}}>
                    Récapitulatif de la demande
                </h3>

                <div className="p-5" style={{backgroundColor: "white", borderRadius: 12}}>

                    {/*Elève*/}
                    <div className="d-inline-flex mb-5 pt-3 align-items-center">
                        <UserAvatar user={application.user} size={75}/>
                        <div>
                            <h3 className="font-weight-bold ml-3" style={{color: "#00283B"}}>
                                {application.user.first_name}{" "}
                                {application.user.last_name}
                            </h3>
                        </div>
                    </div>

                    {/*Informations personnelles*/}
                    <div className="mb-5">
                        <h3 className="font-weight-bold mb-3" style={{color: "#8AA4B1"}}>
                            Informations personnelles
                        </h3>
                        <div className="row">
                            <div className="col-md-6">
                                <p className="m-0 small">Date de naissance</p>
                                <p className="font-weight-bold" style={{color: "#00283B"}}>
                                    {moment(application.user.birthday).format(
                                        "DD/MM/YYYY",
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/*Coordonnées personnelles*/}
                    <div className="mb-5">
                        <h3 className="font-weight-bold" style={{color: "#8AA4B1"}}>
                            Coordonnées personnelles
                        </h3>

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
                    {(hasContacts(legalReferents) || hasContacts(accompanying) || hasContacts(emergencyContacts)) && (
                        <div className="mb-5">
                            <h3 className="font-weight-bold" style={{color: "#8AA4B1"}}>
                                Contacts
                            </h3>
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
                    )}

                    {/*Activités sélectionnées*/}
                    {((selectedActivities && selectedActivities.length > 0) || (selectedPacks && selectedPacks.length > 0)) && (
                        <div className="mb-5">
                            <h3 className="font-weight-bold" style={{ color: "#8AA4B1" }}>
                                Activités sélectionnées
                            </h3>
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
                    )}

                    {/* Formules sélectionnées */}
                    {application.selectedFormulas && application.selectedFormulas.length > 0 && (
                        <div className="mb-5">
                            <h3 className="font-weight-bold" style={{ color: "#8AA4B1" }}>
                                Formules sélectionnées
                            </h3>
                            <div>
                                <table className="table table-striped" style={{ borderRadius: "12px", overflow: "hidden" }}>
                                    <thead>
                                    <tr style={{ backgroundColor: "#F7FBFC", color: "#8AA4B1" }}>
                                        <th scope="col">Formule</th>
                                        <th scope="col">Activités incluses</th>
                                        <th scope="col">Tarif estimé</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {application.selectedFormulas.map(formulaId => {
                                        const formula = (application.formulas || formulas || []).find(f => f.id === formulaId);
                                        if (!formula) return null;
                                        const chosenActivities = (application.selectedFormulaActivities && application.selectedFormulaActivities[formula.id]) || [];
                                        const activitiesLabel = chosenActivities
                                            .map(activityId => {
                                                // Recherche dans formule_items
                                                let activityItem = formula.formule_items.find(item => item.item.id === activityId);
                                                if (!activityItem) {
                                                    // Si non trouvé, il s'agit d'une activité issue d'une famille : recherche dans allActivityRefs
                                                    const fullActivity = allActivityRefs.find(activity => activity.id === activityId);
                                                    if (!fullActivity) return null;
                                                    activityItem = {
                                                        item: {
                                                            id: fullActivity.id,
                                                            display_name: fullActivity.display_name || fullActivity.label,
                                                        },
                                                    };
                                                }
                                                return activityItem.item.display_name || activityItem.item.label;
                                            })
                                            .filter(Boolean)
                                            .join(", ");
                                        return (
                                            <tr key={formulaId} style={{ backgroundColor: "#ffffff" }}>
                                                <td className="font-weight-bold">{formula.name}</td>
                                                <td className="text-left">
                                                    {activitiesLabel.length > 0 ? activitiesLabel : "Aucune activité sélectionnée"}
                                                </td>
                                                <td className="text-left">
                                                    {formula.formule_pricings && formula.formule_pricings[0]
                                                        ? `${formula.formule_pricings[0].price} €`
                                                        : "--"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                    {application.selectedFormulas.length > 0 && (
                                        <tfoot>
                                        <tr style={{ backgroundColor: "#F7FBFC", color: "#8AA4B1" }}>
                                            <td></td>
                                            <td className="text-right font-weight-bold">Total estimé</td>
                                            <td className="font-weight-bold">
                                                {application.selectedFormulas.reduce((total, formulaId) => {
                                                    const formula = (application.formulas || formulas || []).find(f => f.id === formulaId);
                                                    return total + (formula && formula.formule_pricings && formula.formule_pricings[0]
                                                        ? parseFloat(formula.formule_pricings[0].price)
                                                        : 0);
                                                }, 0)}€
                                            </td>
                                        </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}


                    <div className="d-flex justify-content-end mt-2">
                        <div className="p-2 bg-light" style={{ borderRadius: "5px", fontWeight: "bold" }}>
                            Coût total estimé : {totalEstimatedCost.toFixed(2)} €
                        </div>
                    </div>



                    {/*Disponibilités*/}
                    {showTimePreferences ? (
                        <div className="mb-5">
                            <h3 className="font-weight-bold" style={{color: "#8AA4B1"}}>
                                Disponibilités
                            </h3>
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
                        <div className="mb-5">
                            <h3 className="font-weight-bold" style={{color: "#8AA4B1"}}>
                                Evaluation de niveau
                            </h3>
                            <EvaluationChoiceTable
                                activityRefs={allActivityRefs}
                                data={selectedEvaluations}
                                showChoiceNumber={false}/>
                        </div>

                    ) : null}

                    {/*Préférence de paiement*/}
                    {paymentTerms.length > 0 ? (
                        <div className="mb-5">
                            <h3 className="font-weight-bold" style={{color: "#8AA4B1"}}>
                                Préférence de paiement
                            </h3>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <p className="m-0 small">Echéancier</p>
                                        <p className="font-weight-bold"
                                           style={{color: "#00283B"}}>{selectedPaymentScheduleOption}</p>
                                    </div>
                                    <div>
                                        <p className="m-0 small">Moyen de paiement</p>
                                        <p className="font-weight-bold"
                                           style={{color: "#00283B"}}>{selectedPaymentMethod}</p>
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
            </div>


            <div className="col-md-5 col-xl-5">
                <h3 className="font-weight-bold mb-2" style={{color: "#8AA4B1"}}>
                    Commentaire
                </h3>
                <div>
                        <textarea name="comment" className="form-control" style={{borderRadius: 12, border: 0}}
                                  onChange={(e) => handleComment(e.target.value)}/>
                </div>
            </div>
        </div>

        <button
            onClick={handleSubmit}
            disabled={buttonDisabled}
            className="btn btn-success font-weight-bold btn-md submit-activity mt-5"
        >
            {buttonDisabled ? (
                <Fragment><i className="fa fa-spinner fa-spin"/> &nbsp;</Fragment>
            ) : ""}
            {"Envoyer la demande"}
        </button>
    </Fragment>;
};

export default Validation;
