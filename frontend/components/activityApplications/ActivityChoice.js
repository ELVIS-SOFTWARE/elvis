import React, {Fragment} from "react";
import _ from "lodash";

import AdditionalStudentSelection from "./../AdditionalStudentSelection.js";
import {frenchEnumeration} from "../utils/index.js";

const moment = require("moment-timezone");
require("moment/locale/fr");

const getDisplayPrice = (ref, season) => {
    if (ref == undefined || season == undefined)
        return (ref || {}).display_price || "--";

    return ref.display_prices_by_season[season.id] || ref.display_price || "--";
};

const getDisplayDuration = ref => {
    if (ref == undefined) return "--";
    if (ref.duration >= 60) {
        const hours = Math.floor(ref.duration / 60);
        const minutes = ref.duration % 60;
        return `${hours}h${minutes < 10 ? "0" : ""}${minutes}`;
    } else if (ref.duration > 0) {
        return `${ref.duration} min`;
    } else {
        return "";
    }
};

const ActivityChoice = ({
                            schoolName,
                            adhesionPrices,
                            selectedActivities,
                            activityRefs,
                            activityRefsChildhood,
                            activityRefsCham,
                            allActivityRefs,
                            allActivityRefKinds,
                            currentUserIsAdmin,
                            handleAddActivity,
                            handleRemoveActivity,
                            validation,
                            additionalStudents,
                            handleChangeAdditionalStudent,
                            infos,
                            season,
                            adhesionEnabled,
                            packs,
                            handleRemovePack,
                            handleAddPack,
                            selectedPacks,
                        }) => {
    const seasonStart = moment(season.start);
    const isInAgeRange = a => {
        if (a.activity_type === "child") {
            const birthday = moment(infos.birthday);
            const nextBirthday = moment(infos.birthday).year(seasonStart.year());
            const age = nextBirthday.diff(birthday, "years");

            return a.from_age <= age && age < a.to_age;
        } else {
            const seasonEnd = moment(season.end);
            // const seasonEnd = moment(); // tmp : reset the calculated age to "relative from today"
            const userAge = seasonEnd.diff(moment(infos.birthday), "years");
            return userAge >= a.from_age && userAge <= a.to_age;
        }
    };

    // Only display activities that are suitable for student
    const filteredActivityRefs = activityRefs.filter(isInAgeRange);
    const filteredActivityRefsChildhood = activityRefsChildhood.filter(isInAgeRange);
    const cantSelectChildhood =
        _.intersection(
            selectedActivities,
            filteredActivityRefsChildhood.map(aref => aref.id),
        ).length > 0;
    const unpopularActivities = allActivityRefs.filter(ref => ref.is_unpopular);
    const unpopularActivityChosen =
        _.intersection(
            unpopularActivities.map(a => a.id),
            selectedActivities,
        ).length > 0;

    const renderChildrenAccompaniments = () => {
        /* additionalStudents only exist here in Edit Mode while adding activities */
        if (additionalStudents && additionalStudents.length > 0) {
            const family = {};

            _.map(infos.user.family_member_users, member => {
                family[member.member_id] = {
                    id: member.id,
                    link: member.link,
                    first_name: member.member.first_name,
                    last_name: member.member.last_name,
                };
            });

            return (
                <div id="tab-2" className="tab-pane text-justify">
                    <AdditionalStudentSelection
                        family={family}
                        additionalStudents={additionalStudents}
                        handleChangeAdditionalStudent={(index, value) =>
                            handleChangeAdditionalStudent(index, value)
                        }
                    />
                </div>
            );
        }
    };

    const groupedRefs = _.groupBy(filteredActivityRefs.filter(r => r.substitutable === true), "kind");

    const filteredActivityRefsDisplay = _.map(groupedRefs, (refs, kind) => {
        const displayRefs = refs.map((ref, i) => {
            const amount = _.filter(
                selectedActivities,
                activity_id => activity_id == ref.id,
            ).length;

            return (
                <div key={i} className="row m-b-md">
                    <div className="col-xs-6">
                        <strong>{ref.kind}</strong>
                    </div>
                    <div className="col-xs-6 text-center">
                        <span className="activite-amount pull-left">
                            {getDisplayPrice(ref, season)}{" "}
                            €
                        </span>

                        <div
                            className="btn-group-horizontal pull-right btn-group btn-group-flex"
                            role="group"
                        >
                            <button
                                className="btn btn-white btn-secondary"
                                onClick={() => handleRemoveActivity(ref.id)}
                                disabled={amount == 0}
                            >
                                -
                            </button>
                            <button
                                className="btn btn-white btn-secondary"
                                onClick={() => handleAddActivity(ref.id)}
                            >
                                &nbsp;+&nbsp;
                            </button>
                        </div>
                    </div>
                </div>
            );
        });

        return <div key={kind}>{_.compact(displayRefs)}</div>;
    });

    const individualRefs =
        _.uniqBy(
            _.union(
                filteredActivityRefsChildhood,
                allActivityRefs.filter(ar => ar.substitutable === false && isInAgeRange(ar)),
            ), "id");

    const filteredIndividualActivityRefsDisplay = _.map(
        individualRefs,
        (ref, i) => {
            const amount = _.filter(
                selectedActivities,
                activity_id => activity_id == ref.id,
            ).length;

            return (
                <div key={i} className="row m-b-md d-flex align-items-center">
                    <div className="col-xs-6">
                        <strong>{ref.label}</strong>
                    </div>
                    <div className="col-xs-2 text-center">
                        <span className="activite-amount pull-left">
                            {getDisplayDuration(ref)}
                        </span>
                    </div>
                    <div className="col-xs-4 text-center">
                        <span className="activite-amount pull-left">
                            {getDisplayPrice(ref, season)}{" "}
                            €
                        </span>

                        <div
                            className="btn-group-horizontal pull-right btn-group"
                            role="group"
                        >
                            <button
                                className="btn btn-white btn-secondary"
                                onClick={() => handleRemoveActivity(ref.id)}
                                disabled={amount == 0}
                            >
                                -
                            </button>
                            <button
                                className="btn btn-white btn-secondary"
                                onClick={() => handleAddActivity(ref.id)}
                                disabled={cantSelectChildhood}
                            >
                                {" "}
                                +{" "}
                            </button>
                        </div>
                    </div>
                </div>
            );
        },
    );

    const activityRefsDisplayCham = _.map(activityRefsCham, (ref, i) => {
        const amount = _.filter(
            selectedActivities,
            activity_id => activity_id == ref.id,
        ).length;

        return (
            <div key={i} className="row m-b-md d-flex align-items-center">
                <div className="col-xs-6">
                    <strong>{ref.label}</strong>
                </div>
                <div className="col-xs-2 text-center">
                    <span className="activite-amount pull-left">
                        {getDisplayDuration(ref)}
                    </span>
                </div>
                <div className="col-xs-4 text-center">
                    <span className="activite-amount pull-left">
                        {getDisplayPrice(ref, season)} €
                    </span>

                    <div
                        className="btn-group-horizontal pull-right btn-group"
                        role="group"
                    >
                        <button
                            className="btn btn-white btn-secondary"
                            onClick={() => handleRemoveActivity(ref.id)}
                            disabled={amount == 0}
                        >
                            -
                        </button>
                        <button
                            className="btn btn-white btn-secondary"
                            onClick={() => handleAddActivity(ref.id)}
                        >
                            {" "}
                            +{" "}
                        </button>
                    </div>
                </div>
            </div>
        );
    });

    const selectedActivitiesCounted = _.countBy(selectedActivities);
    const unpopularActivitiesSelected = unpopularActivities.filter(a =>
        selectedActivities.includes(a.id),
    );
    const selectedActivityRefsDisplay = _.map(
        selectedActivitiesCounted,
        (amount, selectedActivityId) => {
            let selectedActivity = _.find(
                allActivityRefs,
                ar => ar.id == parseInt(selectedActivityId, 10),
            );

            let displayPrice = "--";
            if (
                selectedActivity.activity_type == "child" ||
                selectedActivity.activity_type == "cham"
            ) {
                displayPrice = selectedActivity.display_price;
            } else {
                displayPrice =
                    parseInt(
                        getDisplayPrice(selectedActivity, season),
                        10,
                    ) * amount;

                if (isNaN(displayPrice))
                    displayPrice = "--";
            }

            return (
                <React.Fragment key={selectedActivityId}>
                    <div className="row m-b-md">
                        <div className="col-xs-5 m-t-sm">
                            <strong>
                                {selectedActivity.display_name}
                            </strong>
                        </div>
                        <div className="col-xs-7 text-center">
                            <div className="pull-left">
                                <span className="activite-amount">
                                    x{amount}
                                </span>
                                <span className="activite-amount">
                                    {displayPrice} €
                                </span>
                            </div>

                            <div
                                className="btn-group-horizontal pull-right btn-group"
                                role="group"
                            >
                                <button
                                    className="btn btn-white btn-secondary"
                                    onClick={() =>
                                        handleRemoveActivity(
                                            selectedActivity.id,
                                        )
                                    }
                                    disabled={amount == 0}
                                >
                                    -
                                </button>
                                <button
                                    className="btn btn-white btn-secondary"
                                    onClick={() =>
                                        handleAddActivity(selectedActivity.id)
                                    }
                                    disabled={
                                        selectedActivity.activity_type ===
                                        "child" && cantSelectChildhood
                                    }
                                >
                                    {" "}
                                    +{" "}
                                </button>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            );
        },
    );


    function DisplayPacks(packArray, key) {
        return packArray.map((pack, i) => {
            const pricing_category = pack.pricing_category;

            return (
                <Fragment key={pack.id}>
                    <div className="row m-b-md">
                        <div className="col-xs-6 m-t-sm">
                            <p className="ml-3">
                                {pricing_category.name}
                            </p>
                        </div>
                        <div className="col-xs-2 text-center">
                            <span className="activite-amount pull-left">
                                {getDisplayDuration(pack.activity_ref)}
                            </span>
                        </div>
                        <div className="col-xs-4 text-center">
                            <div className="pull-left">
                                <span className="activite-amount">
                                    {pack.price} €
                                </span>
                            </div>

                            <div
                                className="btn-group-horizontal pull-right btn-group"
                                role="group"
                            >
                                <button
                                    className="btn btn-white btn-secondary"
                                    onClick={() =>
                                        handleRemovePack(key, pricing_category.id)
                                    }
                                >
                                    -
                                </button>
                                <button
                                    className="btn btn-white btn-secondary"
                                    onClick={() =>
                                        handleAddPack(key, pricing_category.id)
                                    }
                                >
                                    {" "}
                                    +{" "}
                                </button>
                            </div>
                        </div>
                    </div>
                </Fragment>
            );
        });
    }

    function selectedPacksDisplay(packArray, key) {
        return packArray.map((packId, i) => {
            const pack = packs[key].find(p => p.pricing_category.id === packId);
            const pricing_category = pack.pricing_category;

            return (
                <Fragment key={packId}>
                    <div className="row m-b-md">
                        <div className="col-xs-6 m-t-sm">
                            <p className="ml-3">
                                {pricing_category.name}
                            </p>
                        </div>
                        <div className="col-xs-6 text-center">
                            <div className="pull-left">
                                <span className="activite-amount">
                                    {pack.price} €
                                </span>
                            </div>

                            <div
                                className="btn-group-horizontal pull-right btn-group"
                                role="group"
                            >
                                <button
                                    className="btn btn-white btn-secondary"
                                    onClick={() =>
                                        handleRemovePack(key, pricing_category.id)
                                    }
                                >
                                    -
                                </button>
                                <button
                                    className="btn btn-white btn-secondary"
                                    onClick={() =>
                                        handleAddPack(key, pricing_category.id)
                                    }
                                >
                                    {" "}
                                    +{" "}
                                </button>
                            </div>
                        </div>
                    </div>
                </Fragment>
            );
        });
    }

    // si une des activités sélectionnée est substituable,
    // on doit informer l'utilisateur que le tarif affiché est indicatif
    const showPriceWarning = () => {
        const selectedAct = allActivityRefs.filter(ar => selectedActivities.includes(ar.id));

        return !!selectedAct.find(ar => ar.substitutable === true);
    };

    return (
        <Fragment>

            <div>

                {showPriceWarning() &&
                    <div className="alert alert-info col-md-8 d-inline-flex align-items-center m-b-md pl-0"
                         style={{border: "1px solid #0079BF", borderRadius: "5px", color: "#0079BF"}}>
                        <div className="col-1 p-0 text-center">
                            <i className="fas fa-info-circle"></i>
                        </div>
                        <div className="col p-0">
                            <small className="m-b-xs">
                                Les tarifs affichés sont à titre indicatif. Ils
                                correspondent au coût pour une personne inscrite en
                                cours collectif payé mensuellement.
                            </small>
                            {adhesionEnabled && adhesionPrices.length > 0 && <small className="m-b-xs">
                                À ce tarif, s'ajoute une adhésion annuelle à{" "}
                                {schoolName}. Cette dernière est d'un montant de{" "}
                                {(adhesionPrices.find(a => a.season_id == season.id) || _.maxBy(adhesionPrices, a => a.season_id) || {}).price || 0} euros.
                            </small>}
                            <small>
                                Des réductions sont possibles. Elles seront
                                précisées lors de votre passage au secrétariat pour
                                valider votre inscription.
                            </small>
                        </div>

                    </div>}

                <div className="row">
                    <div className="col-md-6">
                        <div>
                            <div>
                                <h3>Choix de l&rsquo;activité</h3>
                                <div className="d-inline-flex justify-content-between mb-2 w-100">
                                    <div>
                                        <button
                                            className="btn btn-xs mr-3"
                                            style={{
                                                borderRadius: '40px',
                                                border: '1px solid #00334A',
                                                color: '#00334A'
                                            }}
                                        >
                                            Niveau <i className="fas fa-caret-down"></i>

                                        </button>
                                        <button
                                            className="btn btn-xs"
                                            style={{
                                                borderRadius: '40px',
                                                border: '1px solid #00334A',
                                                color: '#00334A'
                                            }}
                                        >
                                            Durée <i className="fas fa-caret-down"></i>

                                        </button>
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder={` Rechercher  \uD83D\uDD0D`}
                                            style={{borderRadius: '40px', border: '0', color: "#8AA4B1"}}
                                        />
                                    </div>
                                </div>
                            </div>
                            {filteredActivityRefsDisplay.length > 0 && (
                                <div className="ibox-content">
                                    {filteredActivityRefsDisplay}
                                </div>
                            )}
                            {activityRefsDisplayCham.length > 0 && (
                                <div className="ibox-content">
                                    {activityRefsDisplayCham}
                                </div>
                            )}
                            {filteredIndividualActivityRefsDisplay.length > 0 && (
                                <div className="ibox-content">
                                    {filteredIndividualActivityRefsDisplay}
                                </div>
                            )}

                            {Object.keys(packs).length !== 0 && (
                                <div>
                                    <div className="ibox-title">
                                        <h3>Choix des Packs</h3>
                                    </div>

                                    <div className="ibox-content">
                                        {Object.keys(packs).map(key => (
                                            <div key={key}>
                                                <strong>{key}</strong>
                                                {DisplayPacks(packs[key], key)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <div className="ibox">
                            <div className="ibox-title">
                                <h3>Activités sélectionnées</h3>
                            </div>
                            <div className="ibox-content">
                                {selectedActivityRefsDisplay}
                                {Object.keys(selectedPacks).map(key => (
                                    <div key={key}>
                                        <strong>{key}</strong>
                                        {selectedPacksDisplay(selectedPacks[key], key)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {unpopularActivityChosen && (
                            <div className="alert alert-danger">
                                <div className="m-b-sm">
                                    Les inscriptions aux activités suivantes sont
                                    soumises à un nombre minimum d'élèves par cours:
                                </div>
                                <ul>
                                    {unpopularActivitiesSelected.map(unpopularA => {
                                        return (
                                            <li key={unpopularA.id}>
                                                {unpopularA.label}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}


                    </div>

                    <div className="col-lg-12 text-center">
                        {renderChildrenAccompaniments()}
                    </div>
                </div>
            </div>

        </Fragment>
    );
};

export default ActivityChoice;
