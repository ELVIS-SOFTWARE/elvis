import React, {Fragment, useState} from "react";
import BookingCard from "./bookingCards";

export default function BookingCardsList(props) {

    const activities = props.activities;

    if (Object.keys(activities).length === 0) {
        return <div className="col-md-12">
            <div className="ibox">
                <div className="ibox-content text-center">
                    <h3 className="font-bold">Aucune activité disponible pour le moment</h3>
                    <p>Le professeur n'a pas encore publié ses créneaux de cours pour cette activité</p>
                    <i className="fa fa-pause" aria-hidden="true"></i>
                </div>
            </div>
        </div>
    }

    return <Fragment>
        <div className="div-scrollable">
            {Object.keys(activities).map((month, index) => (
                activities[month].length > 0 && (
                    <div key={index}>
                        <h2 className="animated fadeInRight">{month}</h2>
                        {activities[month].map((item, itemIndex) => (
                            <div key={itemIndex}>
                                <BookingCard
                                    key={index}
                                    activity={item}
                                    activity_ref={props.activity_ref}
                                    addToWishList={props.addToWishList}
                                    removeFromWishList={props.removeFromWishList}
                                />
                            </div>
                        ))}
                    </div>
                )
            ))}
        </div>
    </Fragment>
}