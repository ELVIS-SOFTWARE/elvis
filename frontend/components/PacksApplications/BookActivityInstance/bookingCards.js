import React, {Fragment, useState} from "react";
import moment from "moment";
import 'moment/locale/fr';

moment.locale('fr');

export default function bookingCards(props) {

    const {activity, activity_ref, addToWishList, removeFromWishList} = props;
    const teacher = activity.teacher;
    const room = activity.room;
    const date = activity.time_interval;

    const [isClicked, setIsClicked] = useState(false);

    function getHours(start, end) {
        return moment(start).format('HH:mm') + " - " + moment(end).format('HH:mm');
    }

    function getDate(dateStr) {
        return <Fragment>
            <h1 className="font-bold">{moment(dateStr).format('DD')}</h1>
            <p className="card-title font-bold color-red font-size-big">{moment(dateStr).format('MMMM')}</p>
        </Fragment>
    }


    function handleClick() {
        setIsClicked(!isClicked)
        if (activity.student_attendances.length >= activity_ref.occupation_limit) {
            return;
        }
        isClicked ? removeFromWishList(activity) : addToWishList(activity);
    }

    return (
        <div className="row">
            <div className="col-sm-5">
                <div
                    className={`ibox animated fadeInRight border-${isClicked ? 'lightblue' : 'transparent'}`}
                    onClick={() => handleClick()}
                    style={activity.student_attendances.length >= activity_ref.occupation_limit ? {
                        pointerEvents: "none",
                        cursor: "not-allowed",
                    } : {
                        cursor: "pointer"
                    }}
                >
                    <div className="ibox-content text-align-center-sm"
                         style={activity.student_attendances.length >= activity_ref.occupation_limit ? {
                             backgroundColor: "rgb(221, 223, 225)"
                         } : {
                         }}
                    >
                        <div className="row">
                            <div className="col-sm-2 project-status p-xs">
                                {date !== undefined ? getDate(date.start) : ""}
                            </div>
                            <div className="col-sm-3 p-xs ml-3">
                                <div className="activity-details mt-4">
                                    {date !== undefined ? <p>{getHours(date.start, date.end)}</p> :
                                        <p>Heures non définies</p>}
                                    <p className="font-bold">
                                        {activity_ref.label}
                                    </p>
                                </div>
                            </div>
                            <div className="col-sm-3 p-xs">
                                <div className="activity_infos mt-4">
                                    <p>{room.label}</p>
                                    <p>{teacher.first_name} {teacher.last_name}</p>
                                </div>
                            </div>
                            {activity.student_attendances.length >= activity_ref.occupation_limit ?
                                (
                                    <div className="col-sm-3 p-xs">
                                        <div className="delete-icon mt-5">
                                            <h4 className="pull-right">COMPLET</h4>
                                        </div>
                                    </div>
                                ) : null
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}