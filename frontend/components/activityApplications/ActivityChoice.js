import React, {Component, Fragment} from "react";
import _ from "lodash";
import AdditionalStudentSelection from "./../AdditionalStudentSelection.js";
import {frenchEnumeration} from "../utils/index.js";
import {Editor, EditorState, convertFromRaw, ContentState} from "draft-js";
import WysiwygViewer from "../utils/WysiwygViewer";
import {toast} from "react-toastify";
import {MESSAGES} from "../../tools/constants";

const moment = require("moment-timezone");
require("moment/locale/fr");

class ActivityChoice extends Component {
    constructor(props) {
        super(props);
        this.state = {
            durationFilter: null,
            searchTerm: "",
        };

        this.handleDurationFilterClick = this.handleDurationFilterClick.bind(this);
        this.handleSearchChange = this.handleSearchChange.bind(this);
    }

    isValidated() {
        const {selectedActivities, selectedPacks} = this.props;

        if (selectedActivities.length === 0 && Object.keys(selectedPacks).length === 0) {
            toast.error("Vous devez choisir au moins une activité ou un pack", {autoClose: 3000});
            return false;
        }

        return true;
    }

    handleDurationFilterClick() {
        this.setState(prevState => ({
            durationFilter: prevState.durationFilter === 'asc' ? 'desc' : 'asc'
        }));
    }

    handleSearchChange(event) {
        this.setState({searchTerm: event.target.value});
    }

    getDisplayPrice(ref, season) {
        if (ref == undefined || season == undefined)
            return (ref || {}).display_price || "--";

        return ref.display_prices_by_season[season.id] || ref.display_price || "--";
    }

    getDisplayDuration(ref) {
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
    }

    renderChildrenAccompaniments() {
        const {additionalStudents, infos, handleChangeAdditionalStudent} = this.props;
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
    }

    generateActivityRow(item, key, isPack = false, isSelected = false) {
        const {
            selectedActivitiesAndPacks = [],
            handleRemovePack,
            handleRemoveActivity,
            handleAddPack,
            handleAddActivity
        } = this.props;
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

    render() {
        let {
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
            infoText
        } = this.props;

        const {durationFilter, searchTerm} = this.state;

        const seasonStart = moment(season.start);
        const isInAgeRange = a => {
            if (a.activity_type === "child") {
                const birthday = moment(infos.birthday);
                const nextBirthday = moment(infos.birthday).year(seasonStart.year());
                const age = nextBirthday.diff(birthday, "years");

                return a.from_age <= age && age < a.to_age;
            } else {
                const seasonEnd = moment(season.end);
                const userAge = seasonEnd.diff(moment(infos.birthday), "years");
                return userAge >= a.from_age && userAge <= a.to_age;
            }
        };

        const filteredActivityRefs = activityRefs.filter(isInAgeRange);
        const filteredActivityRefsChildhood = activityRefsChildhood.filter(isInAgeRange);
        const cantSelectChildhood =
            _.intersection(
                selectedActivities,
                filteredActivityRefsChildhood.map(aref => aref.id),
            ).length > 0;
        const unpopularActivities = activityRefs.filter(ref => ref.is_unpopular);
        const unpopularActivityChosen =
            _.intersection(
                unpopularActivities.map(a => a.id),
                selectedActivities,
            ).length > 0;
        const unpopularActivitiesSelected = unpopularActivities.filter(a => selectedActivities.includes(a.id));

        if (!currentUserIsAdmin) {
            activityRefsCham = activityRefsCham.filter(ar => ar.is_visible_admin === true);
        }

        const groupedRefs = _.groupBy(filteredActivityRefs.filter(r => r.substitutable === true), "kind");

        const individualRefs = _.uniqBy(
            _.union(
                filteredActivityRefsChildhood,
                activityRefs.filter(ar => {
                    const suitableActivityRefs = ar.substitutable === false && isInAgeRange(ar);
                    if (currentUserIsAdmin) {
                        return suitableActivityRefs;
                    }
                    return suitableActivityRefs && ar.is_visible_admin !== true;
                }),
            ), "id"
        );

        const availableActivities = _.uniqBy([...Object.values(groupedRefs).flat(1), ...individualRefs, ...activityRefsCham].map(item => {
            return {
                id: item.id,
                key: null,
                label: item.display_name,
                duration: this.getDisplayDuration(item),
                price: `${this.getDisplayPrice(item, season)} €`,
                isPack: false,
                isSelected: false,
            };
        }), a => a.id);
        const availablePacks = Object.entries(packs).flatMap(([key, packArray]) => packArray.map(item => {
            return {
                id: item.id,
                pricing_category_id: item.pricing_category.id,
                key: key,
                label: `${item.activity_ref.display_name} - ${item.pricing_category.name}`,
                duration: this.getDisplayDuration(item.activity_ref),
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
                label: selectedActivity.display_name,
                duration: this.getDisplayDuration(selectedActivity),
                price: `${this.getDisplayPrice(selectedActivity, season)} €`,
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
                label: `${item.activity_ref.display_name} - ${item.pricing_category.name}`,
                duration: this.getDisplayDuration(item.activity_ref),
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
            return this.generateActivityRow(item, item.key, item.isPack, item.isSelected);
        });
        const availableActivitiesAndPacksDisplay = availableActivitiesAndPacks.map((item, i) => {
            return this.generateActivityRow(item, item.key, item.isPack, item.isSelected);
        });

        return (
            <Fragment>
                <div>
                    {infoText && (
                        <div className="alert alert-info col-md-8 d-inline-flex align-items-center p-1"
                             style={{border: "1px solid #0079BF", borderRadius: "5px", color: "#0079BF"}}>
                            <div className="col-sm-1 p-0 text-center">
                                <i className="fas fa-info-circle"></i>
                            </div>
                            <WysiwygViewer
                                className="col-sm p-0"
                                wysiwygStrData={infoText}
                            />
                        </div>
                    )}
                </div>

                <div className="row">
                    <div className="col-xs-12 col-lg-6">
                        <div>
                            <h3 className="mb-4" style={{color: "#8AA4B1"}}>Choix de l'activité</h3>
                            <div className="d-inline-flex justify-content-between mt-1 mb-2 w-100">
                                <button className="btn btn-xs" onClick={this.handleDurationFilterClick}
                                        style={{
                                            borderRadius: '40px',
                                            border: '1px solid #00334A',
                                            color: '#00334A',
                                            padding: '4px 10px',
                                        }}
                                >
                                    Durée <i className={`fas fa-caret-${durationFilter === 'asc' ? 'up' : 'down'}`}></i>
                                </button>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    borderRadius: '40px',
                                    border: '0',
                                    color: "#8AA4B1",
                                    padding: '4px 10px',
                                    backgroundColor: 'white'
                                }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Rechercher"
                                        style={{border: 'none', backgroundColor: 'transparent'}}
                                        value={searchTerm}
                                        onChange={this.handleSearchChange}
                                    />
                                    <i className="fas fa-search"></i>
                                </div>
                            </div>
                        </div>
                        <div>
                            <table className="table table-striped" style={{borderRadius: '12px', overflow: 'hidden'}}>
                                <thead>
                                <tr style={{backgroundColor: "#00334A", color: "white"}}>
                                    <th>Activité</th>
                                    <th className="text-center">Durée</th>
                                    <th className="text-center">Prix</th>
                                    <th className="text-center">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {availableActivitiesAndPacksDisplay}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="col-xs-12 col-lg-6">
                        <div>
                            <h3 style={{color: "#8AA4B1"}}>Activités sélectionnées</h3>
                        </div>
                        <div>
                            <table className="table table-striped" style={{borderRadius: '12px', overflow: 'hidden'}}>
                                <thead>
                                <tr style={{backgroundColor: "#00334A", color: "white"}}>
                                    <th>Activité</th>
                                    <th className="text-center">Durée</th>
                                    <th className="text-center">Prix</th>
                                    <th className="text-center">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {selectedActivitiesAndPacksDisplay}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {unpopularActivityChosen && (
                        <div className="alert alert-danger">
                            <div className="m-b-sm">
                                Attention, vous avez sélectionné des activités impopulaires :
                            </div>
                            <ul>
                                {unpopularActivitiesSelected.map(activity => (
                                    <li key={activity.id}>{activity.display_name}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="col-lg-12 text-center">
                        {this.renderChildrenAccompaniments()}
                    </div>
                </div>
            </Fragment>
        );
    }
}

export default ActivityChoice;