import React, {Fragment, useEffect, useState} from "react";
import UpcomingActivityInstancesCards from "./upcomingActivityInstancesCards";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import moment from "moment";

export default function upcomingActivityInstancesList(props) {
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState(null);
    const [prevActivities, setPrevActivities] = useState(null);
    let minimalDisplay = false;
    let url = `/get_upcoming_activities` + window.location.pathname;

    if (!url.includes("/upcoming")){
        url += "/upcoming";
        minimalDisplay = true;
    }

    const fetchData = async () => {
        await api.set()
            .useLoading()
            .success(res =>
            {
                setActivities(sortActivitiesByMonth(minimalDisplay ? res.slice(0, 4) : res));
                setLoading(false);
            })
            .error(res =>
            {
                swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
            })
            .get(url, {});
    }

    useEffect(() => {
        fetchData()
    }, [])

    /**
     * trier les activités par mois
     * @param data
     */
    function sortActivitiesByMonth(data) {
        const currentDate = moment();
        let sortedActivities = {};
        let pastActivities = {};

        data.forEach(activity => {
            const activityStartDate = moment(activity.time_interval.start);

            // Vérifiez si l'activité est à venir ou du jour même
            if (activityStartDate.isBefore(currentDate, 'day')) {
                const month = activityStartDate.format('MMMM');
                if (pastActivities[month] === undefined) {
                    pastActivities[month] = [];
                }
                pastActivities[month].push(activity);
            } else {
                const month = activityStartDate.format('MMMM');
                if (sortedActivities[month] === undefined) {
                    sortedActivities[month] = [];
                }
                sortedActivities[month].push(activity);
            }

        });

        // Retirer les doublons par date
        Object.keys(sortedActivities).forEach(month => {
            sortedActivities[month] = sortedActivities[month].filter((thing, index, self) =>
                    index === self.findIndex((t) => (
                        t.time_interval.start === thing.time_interval.start
                    ))
            );
        });

        Object.keys(pastActivities).forEach(month => {
            pastActivities[month] = pastActivities[month].filter((thing, index, self) =>
                index === self.findIndex((t) => (
                    t.time_interval.start === thing.time_interval.start
                ))
            );
        });

        return {...sortedActivities, ...pastActivities};
    }

    if (loading) return (
        <Fragment>Chargement...</Fragment>
    );

    const allActivities = { ...activities };

    if (prevActivities && prevActivities.length > 0) {
        allActivities["Passé"] = prevActivities;
    }

    if (Object.keys(allActivities).length === 0) {
        return (
            <div className="col-md-12">
                <div className="ibox">
                    <div className="ibox-content text-center">
                        <h3 className="font-bold">Vous n'avez pas de cours prévus {minimalDisplay ? "pour ce mois" : ""}</h3>
                        <i className="fa fa-pause" aria-hidden="true"></i>
                    </div>
                </div>
            </div>
        )
    } else {
        return <Fragment>
            <div>
                {Object.keys(allActivities).map((month, index) => (
                    allActivities[month].length > 0 && (
                        <div key={index}>
                            {minimalDisplay ? "" : <h2 className="animated fadeInRight">{month}</h2>}
                            {allActivities[month].map((item, itemIndex) => (
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