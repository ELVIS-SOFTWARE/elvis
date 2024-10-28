import React, {Fragment, useState} from "react";
import moment from "moment";
import 'moment/locale/fr';
import swal from "sweetalert2";
import * as api from "../../../tools/api";
moment.locale('fr');

export default function bookedCards(props) {

    const {activity, activity_ref, removeAttendance, hoursBeforeCancelling} = props;
    const teacher = activity.teacher;
    const room = activity.room;
    const date = activity.time_interval;
    const todayDate = moment();

    const [isHovered, setIsHovered] = useState(false);

    function getHours(start, end) {
        return moment(start).format('HH:mm') + " - " + moment(end).format('HH:mm');
    }

    function getDate(dateStr) {
        return <Fragment>
            <h1 className="font-bold">{moment(dateStr).format('DD')}</h1>
            <p className="card-title font-bold color-red font-size-big">{moment(dateStr).format('MMMM')}</p>
        </Fragment>
    }

    function dateIsPassed(date) {
        return moment(date).isBefore(todayDate);
    }

    // Check si la date d'aujourd'hui est avant la date de l'activité - hoursBeforeCancelling
    function checkAuthorizedHoursBeforeCancelling() {
        const activityDate = moment(date.start);
        const diff = activityDate.diff(todayDate, 'hours');
        return diff >= hoursBeforeCancelling;
    }

    return (
        <div className="row" style={dateIsPassed(date.start) ? { pointerEvents: 'none', opacity: 0.6 } : {}}>
            <div className="col-sm-5"
                 onMouseEnter={() => setIsHovered(true)}
                 onMouseLeave={() => setIsHovered(false)}
            >
                <div className={`ibox animated fadeInRight`}>
                    <div className="ibox-content text-align-center-sm">
                        <div className="row">
                            <div className="col-sm-2 project-status p-xs">
                                {date !== undefined ? getDate(date.start) : "" }
                            </div>
                            <div className="col-sm-3 p-xs ml-3">
                                <div className="activity-details mt-4">
                                    { date !== undefined ? <p>{getHours(date.start, date.end)}</p> : <p>Heures non définies</p> }
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
                            {dateIsPassed(date.start) ? (
                                <div className="col-sm-3 p-xs">
                                    <div className="delete-icon mt-5">
                                        <h4 className="pull-right">PASSÉ</h4>
                                    </div>
                                </div>
                            ) : (
                                checkAuthorizedHoursBeforeCancelling() &&
                                    isHovered &&
                                        <div className="col-sm-3 p-xs">
                                            <div className="delete-icon mt-5">
                                                <i className="fas fa-trash pull-right pointer-event animated fadeIn" onClick={() => removeAttendance(activity)}></i>
                                            </div>
                                        </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}