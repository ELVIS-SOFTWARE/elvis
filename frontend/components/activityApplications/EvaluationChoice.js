import React from "react";

import ItemPreferences from "./ItemPreferences";

const DEFAULT_NO_INTERVAL_MESSAGE = "Aucun créneau d'évaluation disponible actuellement, nous reviendrons vers vous très vite pour vous en proposer un.";

export default function EvaluationChoice({ data, activityRefs, noIntervalMessage = DEFAULT_NO_INTERVAL_MESSAGE, ...prefsProps }) {
    const choices = data.map(({refId, timeInterval, teacher}) => {
        const ref = activityRefs.find(ref => ref.id == refId);

        return (
            <div key={refId}>
                <h4>Pour {ref.kind}</h4>
                {
                    timeInterval ? <ItemPreferences
                    sortable={false}
                    showDate
                    items={[{...timeInterval, teacher}]}
                    {...prefsProps} /> :
                    <p className="text-danger font-bold">
                        {noIntervalMessage}
                    </p>
                }
            </div>
        );
    });

    return <div className="ibox">
        <div className="ibox-title">
            <h4>{"Créneaux d'évaluation sélectionnés"}</h4>
        </div>
        <div className="ibox-content">
            {choices}
        </div>
    </div>
};