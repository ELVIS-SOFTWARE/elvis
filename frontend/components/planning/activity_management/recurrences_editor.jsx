import React from "react";

import YearlyCalendar from "../YearlyCalendar";

export default function RecurrencesEditor({
    recurrences,
    existingDates,
    season,
    onUpdateInstances,
}) {
    return <div>
            <YearlyCalendar
                season={season}
                activityInstances={Object.values(recurrences)}
                existingDates={existingDates}
                handlePickDate={onUpdateInstances}
            />
    </div>;
}