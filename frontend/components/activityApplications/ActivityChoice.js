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

    // Display the available activities
    const generateTableRow = (item, i, key, isPack = false) => {
        const [selected, setSelected] = React.useState(false);
        const amount = _.filter(
            selectedActivities,
            activity_id => activity_id == item.id,
        ).length;

        const label = isPack ? `${key} - ${item.pricing_category.name}` : item.label || item.kind;
        const duration = isPack ? getDisplayDuration(item.activity_ref) : getDisplayDuration(item);
        const price = isPack ? `${item.price} €` : `${getDisplayPrice(item, season)} €`;
        const handleRemove = isPack ? () => handleRemovePack(key, item.pricing_category.id) : () => handleRemoveActivity(item.id);
        const handleAdd = isPack ? () => handleAddPack(key, item.pricing_category.id) : () => handleAddActivity(item.id);
        const disableAddButton = isPack ? false : cantSelectChildhood;

        const handleClick = () => {
            if (selected) {
                handleRemove();
            } else {
                handleAdd();
            }
            setSelected(!selected);
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
                            disabled={disableAddButton}
                            style={{
                                borderRadius: "50%",
                                color: "white",
                                backgroundColor: selected ? "#86D69E" : "#0079BF",
                                border: 0,
                                width: "32px",
                                height: "32px",
                            }}
                        >
                            {selected ? <i className="fas fa-check"></i> : <i className="fas fa-plus"></i>}
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    const individualRefs = _.uniqBy(
        _.union(
            filteredActivityRefsChildhood,
            allActivityRefs.filter(ar => ar.substitutable === false && isInAgeRange(ar)),
        ), "id"
    );
    const filteredActivityRefsDisplay = _.flatMap(groupedRefs, refs =>
        refs.map((ref, i) => generateTableRow(ref, i))
    );
    const filteredIndividualActivityRefsDisplay = individualRefs.map((ref, i) =>
        generateTableRow(ref, i, null, false)
    );
    const activityRefsDisplayCham = activityRefsCham.map((ref, i) =>
        generateTableRow(ref, i, null, false)
    );
    const packsDisplay = _.flatMap(packs, (packArray, key) =>
        packArray.map((pack, i) => generateTableRow(pack, i, key, true))
    );


    // Display the selected activities
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
                    <tr style={{color: "rgb(0, 51, 74)"}}>
                        <td style={{fontWeight: "bold"}}>{selectedActivity.display_name}</td>
                        <td className="text-center">{getDisplayDuration(selectedActivity)}</td>
                        <td className="text-center">{displayPrice} €</td>
                        <td>
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
                        </td>
                    </tr>
                </React.Fragment>
            );
        },
    );

    function selectedPacksDisplay(packArray, key) {
        return packArray.map((packId, i) => {
            const pack = packs[key].find(p => p.pricing_category.id === packId);
            const pricing_category = pack.pricing_category;

            return (
                <Fragment key={packId}>
                    <tr style={{color: "rgb(0, 51, 74)"}}>
                        <td style={{fontWeight: "bold"}}> {key} - {pricing_category.name}</td>
                        <td className="text-center">{getDisplayDuration(pack.activity_ref)}</td>
                        <td className="text-center">{pack.price} €</td>
                        <td>
                            <div className="btn-group-horizontal pull-right btn-group" role="group">
                                <button className="btn btn-white btn-secondary"
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
                        </td>

                    </tr>
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
                                {/*{selectedActivityRefsDisplay}*/}
                                {/*{Object.keys(selectedPacks).map(key => (*/}
                                {/*    <div key={key}>*/}
                                {/*        {selectedPacksDisplay(selectedPacks[key], key)}*/}
                                {/*    </div>*/}
                                {/*))}*/}
                                </tbody>
                            </table>
                        </div>
                        <div className="ibox-content">

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
