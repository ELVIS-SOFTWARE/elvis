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
            <div className="row mt-2 ml-1">
                <p>Pour rappel, il vous reste <span className={"font-bold"}>{props.pack.lessons_remaining} séances à réserver pour le cours de {props.activity_ref.label}</span></p>
            </div>

            {Object.keys(activities).map((month, index) => (
                activities[month].length > 0 && (
                    <div key={index}>
                        <h3 className="animated fadeInRight">{month}</h3>
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