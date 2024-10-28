import React, { Component } from "react";
import { WEEKDAYS, MONTHS } from "../../tools/constants";


export default class AddCourseSummary extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let summary = this.props.summary;
        const firstDayStartTime = summary.firstDayStartTime
            ? summary.firstDayStartTime
            : undefined;
        const firstDayEndTime = summary.firstDayEndTime
            ? summary.firstDayEndTime
            : undefined;

        return (
            <div className="ibox">
                <div className="ibox-title flex">
                    <i className="fas fa-clipboard-list m-b-sm m-r-sm"></i>
                    <h3>Récapitulatif</h3>
                </div>

                <div className="ibox-content">
                    <div className="border-bottom m-t-xs">
                        <div className="flex">
                            <i className={`fas fa-music m-r-sm m-t-xs`}></i>
                            <h4>Activité</h4>
                        </div>

                        {summary.activityRef ? (
                            <p className="m-l-lg m-t-sm">
                                {summary.activityRef}
                            </p>
                        ) : (
                            <p className=" m-l-lg m-t-sm">---</p>
                        )}
                    </div>

                    <div className="border-bottom m-t-xs">
                        <div className="flex">
                            <i className={`fas fa-clock m-r-sm m-t-xs`}></i>
                            <h4>Créneau</h4>
                        </div>

                        {firstDayStartTime &&
                        firstDayEndTime &&
                        summary.dayOfWeek ? (
                            <p className="m-l-lg m-t-sm">
                                {WEEKDAYS[summary.dayOfWeek % 7]}{" "}
                                {firstDayStartTime._d.getDate()}{" "}
                                {MONTHS[firstDayStartTime._d.getMonth()]}{" "}
                                {firstDayStartTime._d.getFullYear()} de{" "}
                                {firstDayStartTime
                                    .format("HH:mm")
                                    .replace(":", "h")}{" "}
                                à{" "}
                                {firstDayEndTime
                                    .format("HH:mm")
                                    .replace(":", "h")}
                            </p>
                        ) : (
                            <p className=" m-l-lg m-t-sm">---</p>
                        )}
                    </div>

                    <div className="border-bottom m-t-xs">
                        <div className="flex">
                            <i className={`fas fa-user m-r-sm m-t-xs`}></i>
                            <h4>Professeur</h4>
                        </div>

                        {summary.teacher ? (
                            <p className="m-l-lg m-t-sm">
                                {summary.teacher.first_name}{" "}
                                {summary.teacher.last_name}
                            </p>
                        ) : (
                            <p className=" m-l-lg m-t-sm">---</p>
                        )}
                    </div>

                    <div className="border-bottom m-t-xs">
                        <div className="flex">
                            <i
                                className={`fas fa-map-marker-alt m-r-sm m-t-xs`}
                            ></i>
                            <h4>Lieu</h4>
                        </div>

                        {summary.location && summary.room ? (
                            <div className="m-l-lg m-t-sm">
                                <p>
                                    <strong>Lieu</strong>
                                    <br />
                                    {summary.location}
                                </p>
                                <p>
                                    <strong>Salle</strong>
                                    <br />
                                    {summary.room}
                                </p>
                            </div>
                        ) : (
                            <p className="m-l-lg m-t-sm">---</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
