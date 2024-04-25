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

    let ref = activityRefs[0];

    const choices = data.map(({refId, timeInterval}, i) => {
        ref = activityRefs.find(ref => ref.id == refId) || ref;

        return (
            timeInterval ?
                <tr key={i} style={{color: "#00283B"}}>
                    <td>
                    <span className="font-weight-bold">
                        {WEEKDAYS[toDate(timeInterval.start).getDay()]}
                    </span><br/>
                        {toHourMin(timeInterval.start)}{" "}{"\u2192"}{toHourMin(timeInterval.end)}
                    </td>
                    <td style={{textAlign: "right"}}>
                    <span className="badge badge-pill badge-primary p-3"
                          style={{borderRadius: 40, backgroundColor: "#0079BF"}}>
                        {`Choix n°${i + 1}`}
                    </span>
                    </td>
                </tr> :
                <tr>
                    <td>
                    <span className="text-danger font-bold">
                        {noIntervalMessage}
                    </span>
                    </td>
                </tr>
        );
    });

    return <table className="table m-0">
        <thead>
        <tr style={{backgroundColor: "#F7FBFC", color: "#8AA4B1"}}>
            <th scope="col">{`Créneaux d'évaluation sélectionnés pour ${ref.kind}`}</th>
        </tr>
        </thead>
        <tbody>
        {choices}
        </tbody>
    </table>
}
;