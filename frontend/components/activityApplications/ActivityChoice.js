import React, {Fragment} from "react";
import {useState} from "react";
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

    // Display the available activities
    function generateAvailableActivitiesRow(item, i, key, isPack = false) {
        const [isSelected, setIsSelected] = React.useState(false);

        const label = isPack ? `${key} - ${item.pricing_category.name}` : item.label || item.kind;
        const duration = isPack ? getDisplayDuration(item.activity_ref) : getDisplayDuration(item);
        const price = isPack ? `${item.price} €` : `${getDisplayPrice(item, season)} €`;
        const handleAdd = isPack ? () => handleAddPack(key, item.pricing_category.id) : () => handleAddActivity(item.id);

        const handleClick = () => {
            const itemId = isPack ? `p${item.id}` : `a${item.id}`;
            handleAdd();
            setIsSelected(prevState => ({...prevState, [itemId]: true}));
        }

        return (
            <tr key={item.id} style={{color: "rgb(0, 51, 74)"}}>
                <td style={{fontWeight: "bold"}}>{label}</td>
                <td className="text-center">{duration}</td>
                <td className="text-center">{price}</td>
                <td>
                    <div
                        className="btn-group-horizontal pull-right btn-group btn-group-flex"
                        role="group"
                    >
                        <button
                            onClick={handleClick}
                            disabled={isSelected[`${isPack ? 'p' : 'a'}${item.id}`]}
                            style={{
                                borderRadius: "50%",
                                color: "white",
                                backgroundColor: isSelected[`${isPack ? 'p' : 'a'}${item.id}`] ? "#86D69E" : "#0079BF",
                                border: 0,
                                width: "32px",
                                height: "32px",
                            }}
                        >
                            {isSelected[`${isPack ? 'p' : 'a'}${item.id}`] ? <i className="fas fa-check"></i> :
                                <i className="fas fa-plus"></i>}
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    const individualRefs = _.uniqBy(
        _.union(
            filteredActivityRefsChildhood,
            allActivityRefs.filter(ar => ar.substitutable === false && isInAgeRange(ar)),
        ), "id"
    );
    const filteredActivityRefsDisplay = _.flatMap(groupedRefs, refs =>
        refs.map((ref, i) => generateAvailableActivitiesRow(ref, i))
    );
    const filteredIndividualActivityRefsDisplay = individualRefs.map((ref, i) =>
        generateAvailableActivitiesRow(ref, i, null, false)
    );
    const activityRefsDisplayCham = activityRefsCham.map((ref, i) =>
        generateAvailableActivitiesRow(ref, i, null, false)
    );
    const packsDisplay = _.flatMap(packs, (packArray, key) =>
        packArray.map((pack, i) => generateAvailableActivitiesRow(pack, i, key, true))
    );


    // Display the selected activities
    function generateSelectedActivitiesRow(item, key, isPack = false) {
        const label = isPack ? `${item.activity_ref.label} - ${item.pricing_category.name}` : item.display_name;
        const duration = isPack ? getDisplayDuration(item.activity_ref) : getDisplayDuration(item);
        const price = isPack ? `${item.price} €` : `${getDisplayPrice(item, season)} €`;

        const handleRemove = () => {
            if (isPack) {
                handleRemovePack(key, item.pricing_category.id);
            } else {
                handleRemoveActivity(item.id);
            }
        };

        return (
            <React.Fragment key={item.id}>
                <tr style={{color: "rgb(0, 51, 74)"}}>
                    <td style={{fontWeight: "bold"}}>{label}</td>
                    <td className="text-center">{duration}</td>
                    <td className="text-center">{price}</td>
                    <td>
                        <div className="btn-group-horizontal pull-right btn-group" role="group">
                            <button onClick={handleRemove}
                                    style={{
                                        borderRadius: "50%",
                                        color: "white",
                                        backgroundColor: "#00334A",
                                        border: 0,
                                        width: "32px",
                                        height: "32px",
                                    }}
                            >
                                <i className="fas fa-minus"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            </React.Fragment>
        );
    }

    const selectedActivityRefsDisplay = selectedActivities.map(activityId => {
        const selectedActivity = _.find(allActivityRefs, ar => ar.id == parseInt(activityId, 10));
        return generateSelectedActivitiesRow(selectedActivity, false);
    });

    const selectedPacksDisplay = Object.keys(selectedPacks).flatMap(key => selectedPacks[key].map(packId => {
        const pack = packs[key].find(p => p.pricing_category.id === packId);
        return generateSelectedActivitiesRow(pack, key,true);
    }));

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
                            <h4 style={{color: "#8AA4B1"}}>CHOIX DE L'ACTIVITE</h4>
                            <div className="d-inline-flex justify-content-between mb-2 w-100">
                                <div>
                                    <button className="btn btn-xs mr-3" style={{
                                        borderRadius: '40px',
                                        border: '1px solid #00334A',
                                        color: '#00334A'
                                    }}>
                                        Niveau <i className="fas fa-caret-down"></i>
                                    </button>
                                    <button className="btn btn-xs" style={{
                                        borderRadius: '40px',
                                        border: '1px solid #00334A',
                                        color: '#00334A'
                                    }}>
                                        Durée <i className="fas fa-caret-down"></i>
                                    </button>
                                </div>
                                <div>
                                    <input type="text" placeholder={` Rechercher  \uD83D\uDD0D`}
                                           style={{borderRadius: '40px', border: '0', color: "#8AA4B1"}}/>
                                </div>
                            </div>
                        </div>
                        <div>
                            <table className="table table-striped" style={{borderRadius: '20px', overflow: 'hidden'}}>
                                <thead>
                                <tr style={{backgroundColor: "#00334A", color: "white"}}>
                                    <th className="pl-4">Activité</th>
                                    <th>Durée</th>
                                    <th>Tarif estimé</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredActivityRefsDisplay}
                                {activityRefsDisplayCham}
                                {filteredIndividualActivityRefsDisplay}
                                {packsDisplay}
                                </tbody>
                            </table>
                        </div>
                    </div>


                    <div className="col-lg-6">

                        <div>
                            <h4 style={{color: "#8AA4B1"}}>ACTIVITES SELECTIONNEES </h4>
                        </div>
                        <div>
                            <table className="table table-striped" style={{borderRadius: '20px', overflow: 'hidden'}}>
                                <thead>
                                <tr style={{backgroundColor: "#00334A", color: "white"}}>
                                    <th className="pl-4">Activité</th>
                                    <th>Durée</th>
                                    <th>Tarif estimé</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {selectedActivityRefsDisplay.length === 0 && Object.keys(selectedPacks).length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center">aucune activité sélectionnée</td>
                                    </tr>
                                ) : (
                                    <React.Fragment>
                                        {selectedActivityRefsDisplay}
                                        {selectedPacksDisplay}
                                    </React.Fragment>
                                )}
                                </tbody>
                            </table>
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


                    <div className="col-lg-12 text-center">
                        {renderChildrenAccompaniments()}
                    </div>
                </div>
            </div>

        </Fragment>
    );
};

export default ActivityChoice;
