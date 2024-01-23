import React, {Fragment, useEffect, useState} from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import ActivityCard from "./activityCards";
import RegularActivityCard from "./regularActivityCards";
import IncomingActivityInstancesList from "../IncomingActivityInstances/upcomingActivityInstancesList";

export default function myActivities()
{
    const [loading, setLoading] = useState(true);
    const [selectedSeason, setSelectedSeason] = useState(null);
    const [season_list, setSeasonList] = useState(null);
    const [user, setUser] = useState(null);
    const [userActivities, setUserActivities] = useState(null);
    const [regularActivities, setRegularActivities] = useState([]);

    const fetchSeason = async () => {
        return await api.set()
            .useLoading()
            .success(res =>
            {
                setSelectedSeason(res.current_season);
                setSeasonList(res.seasons);
                return res.current_season;
            })
            .error(res =>
            {
                swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
            })
            .get(``, {});
    }

    const fetchData = async (season_id) => {
        await api.set()
            .useLoading()
            .success(res =>
            {
                setUser(res.user);
                setUserActivities(res.userActivities);
                setRegularActivities(res.regular_user_activities);
                setLoading(false);
            })
            .error(res =>
            {
                swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
            })
            .get(`/get_user_activities_data` + window.location.pathname, {season_id});
    }

    const handleSeasonChange = (event) => {
        setSelectedSeason(event.target.value);
    };

    function isDesiredActivitySet(da) {
        return !!da[0].activity;
    }

    // Appel API pour récupérer les saisons et les données de la saison en cours
    useEffect(() => {
        fetchSeason().then(r => {
            fetchData(r.id);
        });
    }, [])

    // Déclenché à chaque changement d'état du select pour changer la saison
    useEffect(() => {
        if (selectedSeason) {
            fetchData(selectedSeason);
        }
    }, [selectedSeason]);

    if (!loading) {
        return <Fragment>
            <div className="p-5">
                <div className="row">
                    <div className="col-md-12">
                        <h1 className="title font-bold">Bonjour {user.first_name}</h1>
                    </div>
                </div>

                <div className="row mt-5">
                    <div className="col-md-6">
                        <h4 className="title font-bold">MES ACTIVITÉS</h4>
                    </div>

                    <div className="col-md-2 text-right">
                        {season_list.length > 1 &&
                            <select className="custom-select" value={selectedSeason.id} onChange={handleSeasonChange}>
                                <option value="">Selectionner une saison</option>
                                {season_list.map((season) => (
                                    <option key={season.id} value={season.id}>
                                        {season.label}
                                    </option>
                                ))}
                            </select>
                        }
                    </div>

                    <div className="col-md-4 d-flex align-items-center justify-content-between">
                        <h4 className="title font-bold">MES PROCHAINS COURS</h4>
                        <a href={window.location.href + "/incoming"} className="color-black font-bold mr-4">Voir mon
                            planning &nbsp; &gt;</a>
                    </div>
                </div>

                    <div className="row mt-3">
                        <div className="col-md-8 no-padding h-100">
                            {regularActivities.length > 0 &&
                                regularActivities.map((activity, index) => (
                                    isDesiredActivitySet(activity.desired_activities) &&
                                    <div key={index}>
                                        <RegularActivityCard
                                            activityApplication={regularActivities[index]}
                                        />
                                    </div>
                                ))
                            }

                            {userActivities.length > 0 &&
                                userActivities.map((pack, index) => (
                                    <div key={index}>
                                        <ActivityCard
                                            pack={userActivities[index]}
                                        />
                                    </div>
                                ))
                            }

                            {userActivities.length === 0 &&
                                regularActivities.length === 0 &&
                                <div className="w-100 text-center">
                                    <i className="fa fa-info-circle" aria-hidden="true" />
                                    <h3>Vous n'avez pas de cours pour la saison selectionnée</h3>
                                </div>
                            }
                        </div>

                        <div className="d-flex flex-column">
                            <IncomingActivityInstancesList />
                        </div>

                    </div>
                </div>
        </Fragment>
    } else {
        return <Fragment></Fragment>
    }
}