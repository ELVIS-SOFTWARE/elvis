import React from "react";
import {toDate, toHourMin} from "../../tools/format";
import {WEEKDAYS} from "../../tools/constants";
import _ from 'lodash';

const DEFAULT_NO_INTERVAL_MESSAGE = "Aucun créneau d'évaluation disponible actuellement, nous reviendrons vers vous très vite pour vous en proposer un.";

export default function EvaluationChoiceTable({
                                                  data,
                                                  activityRefs,
                                                  noIntervalMessage = DEFAULT_NO_INTERVAL_MESSAGE,
                                                  ...prefsProps
                                              }) {
    const choices = data.map(({refId, timeInterval}) => {
        const ref = activityRefs.find(ref => ref.id == refId);

        return (
            <tr key={refId} style={{color: "#00283B"}}>
                <td>
                    {timeInterval ?
                        <div className="space-between flex-center-aligned bg-muted p-sm m-sm">
                            <div className="row flex-fill timeslot-weekday">
                                <div className="col-xs-12 col-sm-8">
                                    <span className="font-bold">
                                        {WEEKDAYS[toDate(timeInterval.start).getDay()]}
                                    </span>
                                </div>
                                <div className="col-xs-12 col-sm-4">
                                    <div className="timeslot-hours">
                                        <span>{toHourMin(toDate(timeInterval.start))}</span>{" "}
                                        <i className="fas fa-angle-right" />{" "}
                                        <span>{toHourMin(toDate(timeInterval.end))}</span>
                                    </div>
                                </div>
                            </div>
                        </div> :
                        <span className="text-danger font-bold">
                            {noIntervalMessage}
                        </span>
                    }
                </td>
            </tr>
        );
    });

    return <table className="table m-0">
        <thead>
        <tr style={{backgroundColor: "#F7FBFC", color: "#8AA4B1"}}>
            <th scope="col">{`Créneaux d'évaluation sélectionnés pour ${activityRefs.kind}`}</th>
        </tr>
        </thead>
        <tbody>
        {choices}
        </tbody>
    </table>
};