import React, {Fragment, useEffect, useState} from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import BookingCardsList from "./BookingCardsList";
import moment from "moment/moment";
import BookedCardsList from "./BookedCardsList";
import TabbedComponent from "../../utils/ui/tabs";

export default function ActivityBooking() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [activities, setActivities] = useState(null);
    const [activity_ref, setActivityRef] = useState(null);
    const [wishList, setWishList] = useState([]);
    const [myActivities, setMyActivities] = useState([]);
    const [hoursBeforeCancelling, setHoursBeforeCancelling] = useState(0);
    const [activityRefPricing, setActivityRefPricing] = useState(null);
    const [pack, setPack] = useState(null);
    const [secondTabActive, setSecondTabActive] = useState(false);

    const fetchData = async () => {
        try {
            await api.set()
                .useLoading()
                .success(res =>
                {
                    setUser(res.user);
                    setActivities(sortActivitiesByMonth(res.availabilities));
                    setMyActivities(sortActivitiesByMonth(res.my_activities));
                    setActivityRef(res.activity_ref);
                    setHoursBeforeCancelling(res.hours_before_cancelling)
                    setActivityRefPricing(res.activity_ref_pricing);
                    setPack(res.pack);
                })
                .error(res =>
                {
                    swal("Une erreur est survenue lors de la récupération des données", res.error, "error");
                })
                .get(`/get_bookings_and_availabilities` + window.location.pathname, {});
        } catch (error) {
            swal("Une erreur est survenue lors de la récupération des données", error, "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    /**
     * trier les activités par mois
     * @param data
     */
    function sortActivitiesByMonth(data) {
        let sortedActivities = {};

        data.forEach(activity => {
            const month = moment(activity.time_interval.start).format('MMMM');
            if (sortedActivities[month] === undefined) {
                sortedActivities[month] = [];
            }
            sortedActivities[month].push(activity);
        });

        // retirer les doublons par date
        Object.keys(sortedActivities).forEach(month => {
            sortedActivities[month] = sortedActivities[month].filter((thing, index, self) =>
                index === self.findIndex((t) => (
                    t.time_interval.start === thing.time_interval.start
                ))
            )
        });

        return sortedActivities;
    }

    function addToWishList(activity) {
        wishList.length >= pack.lessons_remaining ?
            swal("Nombre de séances dépassé", "Vous avez déjà sélectionné toutes vos séances", "error")
            : !wishList.includes(activity) && setWishList([...wishList, activity]);
    }

    function removeFromWishList(activity) {
        const index = wishList.indexOf(activity);
        if (index > -1) {
            setWishList(wishList.filter(item => item !== activity));
        }
    }

    function submitWishList() {
        if (wishList.length === 0) {
            swal("Aucune activité sélectionnée", "Veuillez sélectionner au moins une activité", "error");
            return;
        }

        api.set()
            .useLoading()
            .success(res => {
                swal("Vos souhaits ont bien été enregistrés", "", "success");
            })
            .error(res => {
                swal(res.message, res.error, "error");
            })
            .post(`/submit_user_wish_list`, {
                user_id: user.id,
                wish_list: wishList,
                pack_id: pack.id,
            })
        .then(() => {
            fetchData();
        });
    }

    function removeAttendance(activity) {
        swal({
            title: "Attention",
            text: "Voulez-vous vraiment vous désinscrire de cette séance ?",
            type: "warning",
            buttons: true,
            showCancelButton: true,
            confirmButtonText: "Je confirme",
            cancelButtonText: "Annuler",
        }).then((willPost) => {
            if (willPost.value) {
                api.set()
                    .useLoading()
                    .success(res => {
                        swal("Désinscription réussie", res.message, "success");
                    })
                    .error(res => {
                        swal("Une erreur est survenue lors de la désinscription", res.error, "error");
                    })
                    .post(`/remove_wished_attendance`, {
                        activity_instance: activity,
                        user: user,
                        pack_id: pack.id
                    });
            }
        }).then(() => {
            fetchData();
        });
    }

    function setSecondTab() {
        secondTabActive ? setSecondTabActive(false) : setSecondTabActive(true);
    }

    if(loading)
        return "Loading..."

    return (
        <Fragment>
            <div className="p-5">
                <div className="row">
                    <div className="col-md-12">
                        <h4 className="title font-bold">RÉSERVER DES SÉANCES DE COURS</h4>
                    </div>
                </div>

                <div className="row mt-2 ml-1">
                    <p>Sélectionner les créneaux de cours que vous souhaitez</p>
                </div>

                <TabbedComponent
                    tabs={[
                        {
                            id: "tab1",
                            header: "À venir",
                            active: true,
                            headerStyle:{color: "inherit", textDecoration: "none"},
                            body: <BookingCardsList
                                activities={activities}
                                activity_ref={activity_ref}
                                pack={pack}
                                addToWishList={addToWishList}
                                removeFromWishList={removeFromWishList}
                                setSecondTab={setSecondTab}
                            />
                        },
                        {
                            id: "tab2",
                            header: "Mes séances",
                            active: false,
                            headerStyle:{color: "inherit", textDecoration: "none"},
                            body: <BookedCardsList
                                myActivities={myActivities}
                                activity_ref={activity_ref}
                                removeAttendance={removeAttendance}
                                hoursBeforeCancelling={hoursBeforeCancelling}
                                setSecondTab={setSecondTab}
                            />
                        },
                    ]}
                    mode="buttons"
                />
            </div>

            { secondTabActive &&
                <div className="app-footer" style={{zIndex: "1", position: "fixed"}}>
                    <button className="btn btn-primary pull-right" onClick={submitWishList}>Réserver</button>
                </div>
            }
        </Fragment>
    );
}