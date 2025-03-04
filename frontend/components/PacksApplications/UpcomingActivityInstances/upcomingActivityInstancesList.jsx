import React, {Fragment, useEffect, useState} from "react";
import UpcomingActivityInstancesCards from "./upcomingActivityInstancesCards";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import moment from "moment";

export default function upcomingActivityInstancesList(props) {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState(null);
    let minimalDisplay = false;
    let url = `/get_upcoming_activities` + window.location.pathname;

    if (!url.includes("/upcoming")) {
        url += "/upcoming";
        minimalDisplay = true;
    }

    const fetchData = () => {
        api.set()
            .useLoading()
            .success(res => {
                let futureActivity = res.filter(activity => moment(activity.time_interval.start).isAfter(moment(), 'minute'));
                setActivities(sortActivitiesByMonth(minimalDisplay ? futureActivity.slice(0, 4) : res));

                setLoading(false);
            })
            .error(res => {
                swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
            })
            .get(url, {});
    }

    useEffect(() => {
        fetchData()

    }, [])

    /**
     * trier les activités par mois
     * @param activities
     */

    function sortActivitiesByDate(activities) {
        return activities.sort((a, b) => moment(a.time_interval.start) - moment(b.time_interval.start));
    }

    function sortActivitiesByMonth(data) {
        const currentDate = moment();
        let sortedActivities = {};

        data.forEach(activity => {
            const startMoment = moment(activity.time_interval.start);
            const currentMonth = startMoment.format('MMMM');

            if (startMoment.isSameOrAfter(moment(), 'month')) {
                if (sortedActivities[currentMonth] === undefined) {
                    sortedActivities[currentMonth] = [];
                }
                sortedActivities[currentMonth].push(activity);
            }
        });

        Object.keys(sortedActivities).forEach(month => {
            sortedActivities[month] = sortActivitiesByDate(sortedActivities[month]);
        });

        Object.keys(sortedActivities).forEach(month => {
            sortedActivities[month] = sortedActivities[month].filter((thing, index, self) =>
                    index === self.findIndex((t) => (
                        t.time_interval.start === thing.time_interval.start
                    ))
            );
        });

        return sortedActivities;
    }

    if (loading) return (
        <Fragment>Chargement...</Fragment>
    );

    if (Object.keys(activities).length === 0) {
        return (
            <div className="col-md-12 mt-5 mb-5">
                <div className="card" style={{
                    height: "200px",
                    background: "none",
                    border: "none"
                }}>
                    <div className="text-center my-auto">
                        <p className="font-weight-bold" style={{color: "#00334A"}}>Vous n'avez pas de cours prévus</p>
                        <p> Pas encore inscrit ? Réaliser un demande d'inscription pour une ou plusieurs activités</p>
                        <a href={`/inscriptions/new?user_id=${props.user_id}`}
                           className="btn btn-primary mt-5">S'inscrire</a></div>
                </div>
            </div>
        )
    } else {
        return <Fragment>
            <div>
                {Object.keys(activities).map((month, index) => (
                    activities[month].length > 0 && (
                        <div key={index}>
                            {minimalDisplay ? "" : <h2 className="animated fadeInRight">{month}</h2>}
                            {activities[month].map((item, itemIndex) => (

                                <UpcomingActivityInstancesCards
                                    key={itemIndex}
                                    activity={item}
                                    minimalDisplay={minimalDisplay}
                                />

                            ))}
                        </div>
                    )
                ))}
            </div>
        </Fragment>
    }
}