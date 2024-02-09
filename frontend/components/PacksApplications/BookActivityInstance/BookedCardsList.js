import React, { Fragment, useEffect, useState } from "react";
import BookingCard from "./bookingCards";
import BookedCard from "./bookedCards";

export default function BookedCardsList(props) {

    const myActivities = props.myActivities;
    useEffect(() => {
        props.setSecondTab();
    }, []);

    if (Object.keys(myActivities).length === 0) {
        return <div className="col-md-12">
            <div className="ibox">
                <div className="ibox-content text-center">
                    <h3 className="font-bold">Vous n'avez pas encore réservé de séances</h3>
                    <p>Les séances réservées s'afficheront ici.</p>
                    <i className="fa fa-pause" aria-hidden="true"></i>
                </div>
            </div>
        </div>
    }

    return <Fragment>
        <h1>Mes séances</h1>
        <div>
            {Object.keys(myActivities).map((month, index) => (
                <div key={index}>
                    {myActivities[month].map((item, itemIndex) => (
                        <div key={itemIndex}>
                            <BookedCard
                                key={itemIndex}
                                activity={item}
                                activity_ref={props.activity_ref}
                                removeAttendance={props.removeAttendance}
                                hoursBeforeCancelling={props.hoursBeforeCancelling}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    </Fragment>
}