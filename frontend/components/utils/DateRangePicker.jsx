import React, {useState} from "react";
import DateRangePickerLib from "@wojtekmaj/react-daterange-picker";
import swal from 'sweetalert2';

/**
 * @param {{defaultStart: Date, defaultEnd: Date, onChange: ({start: Date, end: Date}) => void}} props onChange was call only when start AND end values was set
 * @returns {JSX.Element}
 * @constructor
 */
export default function DateRangePicker({defaultStart, defaultEnd, onChange})
{
    let start = defaultStart;
    let end = defaultEnd;

    return <DateRangePickerLib
        locale={"fr-FR"}
        format={"d/M/y"}
        value={[start, end]}
        onChange={(values) =>
        {
            if (values == undefined)
            {
                onChange({start: undefined, end: undefined});
                return;
            }

            if(values[0] && new Date(values[0]).getFullYear() < 1000 || values[1] && new Date(values[1]).getFullYear() < 1000) {
                return;
            }

            if(values[0])
                start = values[0];

            if(values[1])
                end = values[1];

            if(start && end && onChange)
                onChange({ start, end });
        }}
         />
}