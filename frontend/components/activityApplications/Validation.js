import React, {Fragment} from "react";
import _ from "lodash";
import EvaluationChoice from "./EvaluationChoice";
import TimePreferencesTable from "./TimePreferencesTable";
import {toDate, toHourMin, toLocaleDate} from "../../tools/format";
import {WEEKDAYS} from "../../tools/constants";

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
                        packs
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

    const address = Object.values(application.infos.addresses).filter(a => a.city && a.country && a.postcode)[0];

    const selectedEvaluations = Object.entries(application.selectedEvaluationIntervals)
        .map(([refId, timeInterval]) => ({refId, timeInterval}));


    const displayDuration = (duration) => {
        if (duration) {
            if (duration >= 60) {
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return `${hours}h${minutes.toString().padStart(2, '0')}`;
            } else {
                return `${duration.toString().padStart(2, '0')}min`;
            }
        } else {
            return "/";
        }
    }

    // Activities and packs display ----------------------------------------------------------------------------------
    const groupByDisplayName = (items) => {
        return items.reduce((groups, item) => {
            const key = item.display_name;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    };
    const createDisplayItems = (groupedItems) => {
        return Object.values(groupedItems).map(group => {
            return {
                display_name: group[0].display_name,
                duration: group[0].duration,
                display_price: group.reduce((total, item) => total + item.display_price, 0),
                amount: group.length
            };
        });
    };
    const getSelectedPacks = ({packs, selectedPacks}) => {
        return _.flatMap(selectedPacks, (pack, activityRef) => {
            const packToDisplay = packs[activityRef]
                ? packs[activityRef].filter(p => pack.includes(p.pricing_category_id))
                : null;
            return packToDisplay
                ? packToDisplay.map(activityRefPricing => ({
                    display_name: `${activityRefPricing.activity_ref.label} - ${activityRefPricing.pricing_category.name}`,
                    duration: activityRefPricing.activity_ref.duration,
                    display_price: activityRefPricing.price,
                }))
                : [];
        });
    };
    // Group activities by display name
    const groupedActivities = groupByDisplayName(selectedActivities);
    const groupedPacks = groupByDisplayName(getSelectedPacks({packs: packs, selectedPacks: selectedPacks}));
    // Create display items
    const displayActivities = createDisplayItems(groupedActivities);
    const displayPacks = createDisplayItems(groupedPacks);
    // Concatenate activities and packs
    const displayActivitiesAndPacks = [...displayActivities, ...displayPacks];


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
                            <table className="table">
                                <thead>
                                <tr style={{backgroundColor: "#F7FBFC", color: "#8AA4B1"}}>
                                    <th scope="col">Activité</th>
                                    <th scope="col">Durée</th>
                                    <th scope="col">Tarif estimé</th>
                                </tr>
                                </thead>
                                <tbody>
                                {displayActivitiesAndPacks.map((activity, index) => (
                                    <tr key={index} style={{color: "#00283B"}}>
                                        <td className="font-weight-bold">{activity.display_name}
                                            {activity.amount > 1 ? ` x${activity.amount}` : ""}</td>
                                        <td>{displayDuration(activity.duration)}</td>
                                        <td>{activity.display_price}€</td>
                                    </tr>
                                ))}
                                </tbody>
                                <tfoot>
                                <tr style={{backgroundColor: "#F7FBFC", color: "#8AA4B1"}}>
                                    <td></td>
                                    <td className="text-right font-weight-bold">Total estimé</td>
                                    <td className="font-weight-bold">{displayActivitiesAndPacks.reduce((total, activity) => total + activity.display_price, 0)}€</td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/*Disponibilités*/}
                    <div className="mb-4">
                        <p className="small font-weight-bold" style={{color: "#8AA4B1"}}>
                            DISPONIBILITES
                        </p>

                        {/*Mes disponibilités*/}
                        {application.intervals.length > 0 ? (
                            <table className="table m-0">
                                {/*<thead>*/}
                                {/*<tr style={{backgroundColor: "#F7FBFC", color: "#8AA4B1"}}>*/}
                                {/*    <th scope="col">*/}
                                {/*        Mes disponibilités*/}
                                {/*    </th>*/}
                                {/*</tr>*/}
                                {/*</thead>*/}
                                <tbody>
                                {_.chain(application.intervals)
                                    .orderBy(i => i.start)
                                    .map((int, i) => (
                                        <tr key={i} style={{color: "#00283B"}}>
                                            <td>
                                                    <span className="font-weight-bold">{
                                                        _.capitalize(moment(int.start).format("dddd"))}
                                                    </span><br/>
                                                {moment(int.start).format("HH:mm")}{" "}
                                                {"\u2192"} {moment(int.end).format("HH:mm")}
                                            </td>
                                        </tr>
                                    ))
                                    .value()}
                                </tbody>
                            </table>
                        ) : null}

                        {/*Mes choix de créneaux*/}
                        {showChildhoodActivities ? Object.keys(application.childhoodPreferences).map(
                            refId => (
                                <TimePreferencesTable
                                    key={refId}
                                    activityRef={allActivityRefs.find(ref => ref.id === parseInt(refId))}
                                    preferences={application.childhoodPreferences[refId]}
                                />
                            )
                        ) : null}
                    </div>


                    {/*Evaluations*/}
                    {selectedEvaluations.length > 0 && _.size(application.selectedEvaluationIntervals) > 0 ? (
                        <EvaluationChoice
                            activityRefs={allActivityRefs}
                            data={selectedEvaluations}
                            showChoiceNumber={false}/>
                    ) : null}

                    {/*Préférence de paiement*/}

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
