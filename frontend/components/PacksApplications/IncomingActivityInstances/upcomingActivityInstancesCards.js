import React, {Fragment, useState} from "react";
import moment from "moment";
import 'moment/locale/fr';
moment.locale('fr');

export default function upcomingActivityInstancesCards(props) {

    const {activity} = props;
    const teacher = activity.teacher;
    const room = activity.room;
    const date = activity.time_interval;
    const activity_ref = activity.activity_ref;
    const minimalDisplay = props.minimalDisplay;

    function getHours(start, end) {
        return moment(start).format('HH:mm') + " - " + moment(end).format('HH:mm');
    }

    function getDate(dateStr) {
        return <Fragment>
            <h1 className="font-bold">{moment(dateStr).format('DD')}</h1>
            <p className="card-title font-bold color-red font-size-big">{moment(dateStr).format('MMMM')}</p>
        </Fragment>
    }

    return (
        <div className="row">
            <div className={`${minimalDisplay ? "col-md-11 ml-4" : "col-sm-5"}`}>
                <div className={`ibox animated fadeInRight`}>
                    <div className="ibox-content text-align-center-sm">
                        <div className="row">
                            <div className={`${minimalDisplay ? "col-sm-4" : "col-sm-2"} project-status p-xs`} >
                                {date !== undefined ? getDate(date.start) : "" }
                            </div>
                            <div className={`${minimalDisplay ? "col-sm-4" : "col-sm-3"} p-xs ml-3`}>
                                <div className="activity-details mt-4">
                                    { date !== undefined ? <p>{getHours(date.start, date.end)}</p> : <p>Heures non définies</p> }
                                    <p className="font-bold">
                                        {activity_ref !== undefined ? activity_ref.label : ""}
                                    </p>
                                </div>
                            </div>
                            <div className={`${minimalDisplay ? "col-sm-3" : "col-sm-3"} p-xs`}>
                                <div className="activity_infos mt-4">
                                    <p>{room.label}</p>
                                    <p>{teacher.first_name} {teacher.last_name}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}