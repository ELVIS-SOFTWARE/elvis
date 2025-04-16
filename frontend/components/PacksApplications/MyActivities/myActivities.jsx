import React, { Fragment, useEffect, useState } from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import ActivityCard from "./activityCards";
import RegularActivityCard from "./regularActivityCards";
import UpcomingActivityInstancesList from "../UpcomingActivityInstances/upcomingActivityInstancesList";
import PlaceholderCard from "./placeholderCard";
import _ from "lodash";

export default function myActivities() {
    const [loading, setLoading] = useState(true);
    const [selectedSeason, setSelectedSeason] = useState(0);
    const [season_list, setSeasonList] = useState(null);
    const [user, setUser] = useState(null);
    const [userActivities, setUserActivities] = useState(null);
    const [regularActivities, setRegularActivities] = useState([]);
    const [showTeacherContacts, setShowTeacherContacts] = useState(false);

    const allowPreApplication = true;

    function isDesiredActivitySet(desiredActivities) {
        return !!desiredActivities[0].activity;
    }


    function isRegistrationOpen() {
        const now = new Date();

        // Vérifier si les inscriptions sont ouvertes pour la saison en cours
        const ss = season_list.find(season => season.id == selectedSeason);
        if (!ss) return false;

        const opening_date_for_new_applications = new Date(ss.opening_date_for_new_applications);
        const closing_date_for_applications = new Date(ss.closing_date_for_applications);
        const isCurrentSeasonOpen = now >= opening_date_for_new_applications && now < closing_date_for_applications;
        if (isCurrentSeasonOpen) {
            return true;
        }

        // Vérifier si les inscriptions sont ouvertes pour la saison suivante
        const ns = season_list.find(season => season.id == ss.next_season_id);
        if (!ns) return false;

        const next_opening_date_for_new_applications = new Date(ns.opening_date_for_new_applications);
        const next_closing_date_for_new_applications = new Date(ns.closing_date_for_applications);
        const isNextSeasonOpen = now >= next_opening_date_for_new_applications && now < next_closing_date_for_new_applications;

        return isNextSeasonOpen;
    }

    const isReRegistrationPeriodOpen = () => {
        const now = new Date();
        const ss = season_list.find(season => season.id == selectedSeason);
        if (!ss || !ss.next_season_id) return false;

        const nextSeason = season_list.find(season => season.id == ss.next_season_id);
        if (!nextSeason) return false;

        const openingDate = new Date(nextSeason.opening_date_for_applications);
        const closingDate = new Date(nextSeason.closing_date_for_applications);

        const isOpen = now >= openingDate && now < closingDate;

        return isOpen;
    };

    function isActivityReinscriptible(activity, allowPreApplication, isDesiredActivitySet) {
        if (activity.pre_application_activity !== undefined) {
            const result = !activity.pre_application_activity.status && allowPreApplication;
            return result;
        }
        if (activity.desired_activities) {
            const result = isDesiredActivitySet(activity.desired_activities);
            return result;
        }
        return false;
    }

    function canReRegister() {
        const fromUserActivities = (userActivities || []).some(activity =>
            isActivityReinscriptible(activity, allowPreApplication, isDesiredActivitySet)
        );
        const fromRegularActivities = (regularActivities || []).some(activity =>
            isActivityReinscriptible(activity, allowPreApplication, isDesiredActivitySet)
        );
        return fromUserActivities || fromRegularActivities;
    }

    const fetchSeason = async () => {
        return await api.set()
            .useLoading()
            .success(res => {
                const currentSeason = res.seasons.find(season => season.is_current) || res.seasons[0];
                setSelectedSeason(currentSeason.id);
                setSeasonList(_.sortBy(res.seasons || [], 'start').reverse());
                return res.current_season;
            })
            .error(res => {
                swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
            })
            .get(``, {});
    }

    const fetchData = async (season_id) => {
        await api.set()
            .useLoading()
            .success(res => {
                setUser(res.user);
                setUserActivities(res.userActivities);
                setRegularActivities(res.regular_user_activities);
                setShowTeacherContacts(res.config.show_teacher_contacts || false);
                setLoading(false);
            })
            .error(res => {
                swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
            })
            .get(`/get_user_activities_data` + window.location.pathname, { season_id });
    }

    const handleSeasonChange = (event) => {
        setSelectedSeason(event.target.value);
    };

    useEffect(() => {
        fetchSeason().then(r => {
            fetchData(r.id);
        });
    }, []);

    useEffect(() => {
        if (selectedSeason) {
            fetchData(selectedSeason);
        }
    }, [selectedSeason]);

    if (!loading) {
        return (
            <Fragment>
                <div className="p-lg-5">
                    <div className="row">
                        <div className="col-md-12">
                            <h1 className="title font-bold">
                                Bonjour {user.first_name}
                            </h1>
                        </div>
                    </div>

                    <div className="row mt-lg-3">
                        <div className="col-xl-8 col-lg-11 no-padding h-100">
                            <div className="d-flex justify-content-between align-items-center mb-2 mx-4 mx-lg-0 flex-wrap activity-header">
                                <div className="px-lg-4">
                                    <h4 className="title font-bold">
                                        MES ACTIVITÉS
                                    </h4>
                                </div>
                                <div className="d-flex flex-column inscription-btn-container">
                                    {season_list.length > 1 && (
                                        <select
                                            className="custom-select"
                                            value={selectedSeason}
                                            onChange={handleSeasonChange}
                                        >
                                            <option value="">
                                                Sélectionner une saison
                                            </option>
                                            {season_list.map(season => (
                                                <option key={season.id} value={season.id}>
                                                    {season.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {(isReRegistrationPeriodOpen() && canReRegister()) && (
                                        <a
                                            href={`/new_application/${user.id}`}
                                            className="btn btn-primary mt-2 inscription-btn"
                                        >
                                            Se réinscrire
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex flex-wrap activity-cards mx-4 mt-3">
                                {isRegistrationOpen() && (
                                    <PlaceholderCard user={user} />
                                )}

                                {regularActivities.length > 0 &&
                                    regularActivities.map(
                                        (activity, index) =>
                                            isDesiredActivitySet(activity.desired_activities) && (
                                                <RegularActivityCard
                                                    key={index}
                                                    activityApplication={activity}
                                                    showTeacherContacts={showTeacherContacts}
                                                />
                                            )
                                    )}

                                {userActivities.length > 0 &&
                                    userActivities.map((pack, index) => (
                                        <ActivityCard
                                            key={index}
                                            pack={pack}
                                        />
                                    ))}

                                {userActivities.length === 0 &&
                                    regularActivities.length === 0 && (
                                        <div className="w-100 text-center">
                                            <i className="fa fa-info-circle" aria-hidden="true" />
                                            <h3>
                                                Vous n'avez pas de cours pour la saison sélectionnée
                                            </h3>
                                        </div>
                                    )}
                            </div>
                        </div>

                        <div className="col-xl-4 col-lg-12 d-flex flex-column">
                            <div className="d-flex align-items-baseline justify-content-between mt-3">
                                <h4 className="title font-bold">
                                    MES PROCHAINS COURS
                                </h4>
                                <a
                                    href={window.location.href + "/upcoming"}
                                    className="font-weight-bold mr-4"
                                    style={{ color: "#00334A" }}
                                >
                                    Voir mon planning &nbsp; &gt;
                                </a>
                            </div>
                            <UpcomingActivityInstancesList user_id={user.id} />
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    } else {
        return <Fragment></Fragment>;
    }
}
