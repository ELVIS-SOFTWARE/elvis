import React from 'react';
import {toDate, toHourMin, toLocaleDate} from "../../tools/format";
import {WEEKDAYS} from "../../tools/constants";

export default function TimePreferencesTable(props) {
 const items = props.preferences
    function createTimeTable(item, i) {
        const start = toDate(item.start);
        const end = toDate(item.end);

        return (
            <tr key={i} style={{color: "#00283B"}}>
                <td>
                    <span className="font-weight-bold">
                        {WEEKDAYS[start.getDay()]}
                    </span><br/>
                    {toHourMin(start)}{" "}{"\u2192"}{toHourMin(end)}
                </td>
                <td style={{textAlign: "right"}}>
                    <span className="badge badge-pill badge-primary p-3" style={{borderRadius: 40, backgroundColor: "#0079BF"}}>
                        {`Choix n°${i + 1}`}
                    </span>
                </td>
            </tr>
        );
    }
    const timeTable = items.map(createTimeTable);

    return (
        <table className="table m-0">
            <thead>
            <tr style={{backgroundColor: "#F7FBFC", color: "#8AA4B1"}}>
                <th scope="col">{`Mes choix de créneaux pour ${props.activityRef.label}`}</th>
            </tr>
            </thead>
            <tbody>
            {timeTable}
            </tbody>
        </table>
    );
};