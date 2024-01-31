import React, { Fragment } from "react";
import _ from "lodash";
import EvaluationChoice from "./EvaluationChoice";
import ItemPreferences from "./ItemPreferences";

const moment = require("moment");
require("moment/locale/fr");

const ChildhoodActivities = ({activityRef, preferences}) => {
    return (
        <div className="ibox">
            <div className="ibox-title">
                <h4>{`Préférences horaires : ${activityRef.label}`}</h4>
            </div>
            <div className="ibox-content">
                <ItemPreferences
                    sortable={false}
                    items={preferences}
                />
            </div>
        </div>
    );
};

const displayPacks = ({ packs, selectedPacks }) => {
    return _.map(selectedPacks, (pack, activityRef) => {
        let packToDisplay;
        if (packs && packs[activityRef]) {
            packToDisplay = packs[activityRef].filter(p => pack.includes(p.pricing_category_id));
        }

        if (!packToDisplay)
            return null;

        return _.map(packToDisplay, (activityRefPricing, i) => (
            <li className="list-group-item" key={i}>
                <div className="row">
                    <div className="col-lg-10">
                        <strong>{activityRefPricing.activity_ref.label}</strong>
                        <br />
                        <small>{activityRefPricing.pricing_category.name}</small>
                    </div>
                    <div className="col-lg-2 text-right">
                        <strong>{activityRefPricing.price}€</strong>
                    </div>
                </div>
            </li>
        ));
    });
};


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


    return (
        <div>
            <div className="ibox">
                <div className="ibox-title">
                    <h4>{"Commentaire sur l'inscription"}</h4>
                </div>
                <div className="ibox-content">
                    <textarea name="comment" className="form-control" onChange={(e) => handleComment(e.target.value)}/>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-6">
                    <div className="ibox">
                        <div className="ibox-title">
                            <h4>Activités</h4>
                        </div>
                        <div className="ibox-content no-padding">
                            <ul className="list-group">
                                {_.map(
                                    distinctSelectedActivityIds,
                                    (element, i) => {
                                        const sa = _.find(
                                            selectedActivities,
                                            act => act.id == element[0],
                                        );

                                        const amount = element[1];

                                        const ind = _.includes(
                                            activitiesWithEveilIds,
                                            sa.id,
                                        )
                                            ? _.findIndex(addStudents, p => {
                                                const a = p[0] == sa.id;
                                                return a;
                                            })
                                            : undefined;

                                        let param = "";
                                        if (ind != undefined && ind > -1) {
                                            const child = _.pullAt(
                                                addStudents,
                                                ind,
                                            )[0][1];
                                            param = child
                                                ? "Avec " + child
                                                : "";
                                        }

                                        return (
                                            <li
                                                className="list-group-item"
                                                key={i}
                                            >
                                                <div className="row">
                                                    <div className="col-lg-10">
                                                        <strong>
                                                            {sa.display_name}
                                                        </strong>
                                                        <br />
                                                        <small>{param}</small>
                                                    </div>
                                                    <div className="col-lg-2 text-right">
                                                        <strong>
                                                            x{amount}
                                                        </strong>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    },
                                )}

                                {Object.keys(selectedPacks).length > 0 && (
                                    <div>
                                        <div className="ibox-title mt-3">
                                            <h4>Packs souscrits</h4>
                                        </div>
                                        {displayPacks({ packs: packs, selectedPacks: selectedPacks })}
                                    </div>
                                )}
                            </ul>
                            <div className="clearfix" />
                        </div>
                    </div>

                    {_.size(application.selectedEvaluationIntervals) > 0 &&
                        <EvaluationChoice
                            activityRefs={allActivityRefs}
                            data={selectedEvaluations}
                            showChoiceNumber={false}/>}

                    {/* Chilhood activities if any selected */}
                    {showChildhoodActivities ? Object.keys(application.childhoodPreferences).map(
                        refId => (
                            <ChildhoodActivities
                                key={refId}
                                activityRef={allActivityRefs.find(ref => ref.id === parseInt(refId))}
                                preferences={application.childhoodPreferences[refId]}
                            />
                        )
                    ) : null}

                    {showOtherActivities ?
                        (<div className="ibox">
                            <div className="ibox-title">
                                <h4>Disponibilités horaires</h4>
                            </div>
                            <div className="ibox-content">
                                {_.chain(application.intervals)
                                    .orderBy(i => i.start)
                                    .map((int, i) => {
                                        return (
                                            <p key={i}>
                                                <b>
                                                    {_.capitalize(
                                                        moment(int.start).format(
                                                            "dddd"
                                                        )
                                                    ) + " : "}
                                                </b>
                                                {moment(int.start).format("HH:mm")}{" "}
                                                - {moment(int.end).format("HH:mm")}
                                            </p>
                                        );
                                    })
                                    .value()}
                            </div>
                        </div>) : null}
                </div>

                <div className="col-lg-6">
                    <div className="ibox">
                        <div className="ibox-title">
                            <h4>Coordonnées de l’élève</h4>
                        </div>
                        <div className="ibox-content">
                            <h4>
                                <strong>
                                    {application.infos.first_name}{" "}
                                    {application.infos.last_name}
                                    {application.infos.adherent_number == ""
                                        ? " (pas d'adhésion en cours)"
                                        : ` (#${application.infos.adherent_number
                                        })`}
                                </strong>
                            </h4>
                            <div className="hr-line-dashed"/>

                            {application.infos.sex ? <p>
                                <b>Sexe :</b> {application.infos.sex}
                            </p> : ""}
                            <p>
                                <b>Date de naissance:</b>{" "}
                                {moment(application.infos.birthday).format(
                                    "DD/MM/YYYY"
                                )}
                            </p>

                            {address ? (
                                <React.Fragment>
                                    <div className="hr-line-dashed"/>
                                    <p>
                                        <b>Adresse :</b>
                                        {address.street_address}
                                    </p>
                                    <p>
                                        {address.postcode} {address.city}
                                    </p>
                                    <p>{address.department}</p>
                                </React.Fragment>
                            ) : null}

                            <div className="hr-line-dashed"/>

                            {_.map(_.filter(application.infos.telephones, p => p.label && p.number), (p, i) => (
                                <p key={i}>
                                    <b>Télephone {p.label}:</b> {p.number}
                                </p>
                            ))}

                            {application.infos.telephones &&
                            application.infos.telephones.length > 0 ? (
                                <div key={1} className="hr-line-dashed"/>
                            ) : null}

                            {application.infos.handicap_description ? <p>
                                <b>Informations complémentaires:</b>
                                {application.infos.handicap_description}
                            </p> : ""}
                        </div>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={buttonDisabled}
                        className="btn btn-primary btn-md submit-activity"
                    >
                        {buttonDisabled ? (
                            <Fragment><i className="fa fa-spinner fa-spin"/> &nbsp;</Fragment>
                        ) : ""}
                        {"Terminer l'inscription"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Validation;
