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
    const unpopularActivitiesSelected = unpopularActivities.filter(a => selectedActivities.includes(a.id));
    const groupedRefs = _.groupBy(filteredActivityRefs.filter(r => r.substitutable === true), "kind");

    // Duration filter ---------------------------------------------------------------------------------------------------------------------------------------------
    const [durationFilter, setDurationFilter] = useState(null);
    const handleDurationFilterClick = () => {
        setDurationFilter(durationFilter === 'asc' ? 'desc' : 'asc');
    };

    // Search filter ---------------------------------------------------------------------------------------------------------------------------------------------
    const [searchTerm, setSearchTerm] = useState("");
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Display the Activities and Packs ---------------------------------------------------------------------------------------------------------------------------------------------
    function generateActivityRow(item, key, isPack = false, isSelected = false) {
        const label = item.label;
        const duration = item.duration;
        const price = item.price;

        const uniqueId = isPack ? `p${item.id}` : `a${item.id}`;
        const isItemSelected = selectedActivitiesAndPacks.some(selectedItem => selectedItem.id === item.id && selectedItem.isPack === isPack);
        const iconClass = isItemSelected && !isSelected ? "fas fa-check" : (isSelected ? "fas fa-minus" : "fas fa-plus");
        const handleAction = () => {
            if (isSelected) {
                if (isPack) {
                    handleRemovePack(key, item.pricing_category_id);
                } else {
                    handleRemoveActivity(item.id);
                }
            } else {
                const handleAdd = isPack ? () => handleAddPack(key, item.pricing_category_id) : () => handleAddActivity(item.id);
                handleAdd();
            }
        };

        const buttonStyle = isSelected
            ? {
                borderRadius: "50%",
                color: "white",
                backgroundColor: "#00334A",
                border: 0,
                width: "32px",
                height: "32px"
            }
            : isItemSelected
                ? {
                    borderRadius: "50%",
                    color: "white",
                    backgroundColor: "#86D69E",
                    border: 0,
                    width: "32px",
                    height: "32px"
                }
                : {
                    borderRadius: "50%",
                    color: "white",
                    backgroundColor: "#0079BF",
                    border: 0,
                    width: "32px",
                    height: "32px"
                };

        return (
            <React.Fragment key={uniqueId}>
                <tr style={{color: "rgb(0, 51, 74)"}}>
                    <td style={{fontWeight: "bold"}}>{label}</td>
                    <td className="text-center">{duration}</td>
                    <td className="text-center">{price}</td>
                    <td>
                        <div className="btn-group-horizontal pull-right btn-group" role="group">
                            <button onClick={handleAction} style={buttonStyle} disabled={isItemSelected && !isSelected}>
                                <i className={iconClass}></i>
                            </button>
                        </div>
                    </td>
                </tr>
            </React.Fragment>
        );
    }

    const individualRefs = _.uniqBy(
        _.union(
            filteredActivityRefsChildhood,
            allActivityRefs.filter(ar => ar.substitutable === false && isInAgeRange(ar)),
        ), "id"
    );
    const availableActivities = [...groupedRefs, ...individualRefs, ...activityRefsCham].map(item => {
        return {
            id: item.id,
            key: null,
            label: item.label || item.kind,
            duration: getDisplayDuration(item),
            price: `${getDisplayPrice(item, season)} €`,
            isPack: false,
            isSelected: false,
        };
    });
    const availablePacks = Object.entries(packs).flatMap(([key, packArray]) => packArray.map(item => {
        return {
            id: item.id,
            pricing_category_id: item.pricing_category.id,
            key: key,
            label: `${item.activity_ref.label} - ${item.pricing_category.name}`,
            duration: getDisplayDuration(item.activity_ref),
            price: `${item.price} €`,
            isPack: true,
            isSelected: false,
        };
    }));
    let availableActivitiesAndPacks = [...availableActivities, ...availablePacks];
    if (durationFilter) {
        availableActivitiesAndPacks.sort((a, b) => {
            const durationA = parseInt(a.duration, 10);
            const durationB = parseInt(b.duration, 10);

            return isNaN(durationA) ? 1 :
                isNaN(durationB) ? -1 :
                    durationFilter === 'asc' ? durationA - durationB :
                        durationB - durationA;
        });
    }
    if (searchTerm) {
        availableActivitiesAndPacks = availableActivitiesAndPacks.filter(item => {
            return item.label.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }

    const selectedActivitiesArray = selectedActivities.map(activityId => {
        const selectedActivity = _.find(allActivityRefs, ar => ar.id == parseInt(activityId, 10));
        return {
            id: selectedActivity.id,
            key: null,
            label: selectedActivity.label || selectedActivity.kind,
            duration: getDisplayDuration(selectedActivity),
            price: `${getDisplayPrice(selectedActivity, season)} €`,
            isPack: false,
            isSelected: true,
        };
    });
    const selectedPacksArray = Object.keys(selectedPacks).flatMap(key => selectedPacks[key].map(packId => {
        const item = packs[key].find(p => p.pricing_category.id === packId);
        return {
            id: item.id,
            pricing_category_id: item.pricing_category.id,
            key: key,
            label: `${item.activity_ref.label} - ${item.pricing_category.name}`,
            duration: getDisplayDuration(item.activity_ref),
            price: `${item.price} €`,
            isPack: true,
            isSelected: true,
        };
    }));
    const selectedActivitiesAndPacks = [...selectedActivitiesArray, ...selectedPacksArray];
    const totalSelectedPrice = selectedActivitiesAndPacks.reduce((acc, item) => {
        return acc + parseFloat(item.price);
    }, 0);

    const selectedActivitiesAndPacksDisplay = selectedActivitiesAndPacks.map((item, i) => {
        return generateActivityRow(item, item.key, item.isPack, item.isSelected);
    });
    const availableActivitiesAndPacksDisplay = availableActivitiesAndPacks.map((item, i) => {
        return generateActivityRow(item, item.key, item.isPack, item.isSelected);
    });


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
                                    <button className="btn btn-xs" style={{
                                        borderRadius: '40px',
                                        border: '1px solid #00334A',
                                        color: '#00334A'
                                    }} onClick={handleDurationFilterClick}>
                                        Durée <i
                                        className={`fas fa-caret-${durationFilter === 'asc' ? 'up' : 'down'}`}></i>
                                    </button>
                                </div>
                                <div>
                                    <input type="text" placeholder={` Rechercher  \uD83D\uDD0D`}
                                           style={{borderRadius: '40px', border: '0', color: "#8AA4B1"}}
                                           value={searchTerm}
                                           onChange={handleSearchChange}
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <table className="table table-striped" style={{borderRadius: '12px', overflow: 'hidden'}}>
                                <thead>
                                <tr style={{backgroundColor: "#00334A", color: "white"}}>
                                    <th className="pl-4">Activité</th>
                                    <th>Durée</th>
                                    <th>Tarif estimé</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {availableActivitiesAndPacksDisplay}
                                </tbody>
                            </table>
                        </div>
                    </div>


                    <div className="col-lg-6">

                        <div>
                            <h4 style={{color: "#8AA4B1"}}>ACTIVITES SELECTIONNEES </h4>
                        </div>
                        <div>
                            <table className="table table-striped" style={{borderRadius: '12px', overflow: 'hidden'}}>
                                <thead>
                                <tr style={{backgroundColor: "#00334A", color: "white"}}>
                                    <th className="pl-4">Activité</th>
                                    <th>Durée</th>
                                    <th>Tarif estimé</th>
                                    <th></th>
                                </tr>
                                </thead>

                                {selectedActivitiesAndPacksDisplay.length === 0 ? (
                                    <tbody>
                                    <tr>
                                        <td colSpan="4" className="text-center">aucune activité sélectionnée</td>
                                    </tr>
                                    </tbody>
                                ) : (
                                    <tbody>
                                    {selectedActivitiesAndPacksDisplay}
                                    <tr>
                                        <td colSpan="3" style={{fontWeight: "bold"}} className="text-right">Total
                                            estimé
                                        </td>
                                        <td colSpan="3" className="text-center">{totalSelectedPrice} €</td>
                                    </tr>
                                    </tbody>
                                )}

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
