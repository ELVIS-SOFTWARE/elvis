import React, {useEffect, useRef, useState} from "react";
import IntervalPreferencesEditor from "./IntervalPreferencesEditor";
import AvailabilityManager from "../availability/AvailabilityManager";
import * as api from "../../tools/api";

export const PLANNING_MODE = Symbol("PLANNING MODE");
export const PREFERENCES_MODE = Symbol("PREFERENCES MODE");
export const PLANNING_AND_PREFERENCES_MODE = Symbol("PLANNING_AND_PREFERENCES MODE");

export default function TimePreferencesStep({
                                                mode,
                                                intervals,
                                                authToken,
                                                planningId,
                                                onAvailabilityAdd,
                                                onAvailabilityDelete,
                                                handleUpdateChildhoodPreferences,
                                                season,
                                                activityRefs,
                                                childhoodPreferences,
                                                selectionLabels,
                                                disableLiveReload = true,
                                                availabilityMessage
                                            })
{
    const availabilityRef = useRef();
    const [defaultFetched, setDefaultFetched] = useState(false);

    useEffect(() => {
        if (mode === PLANNING_MODE && !defaultFetched && (intervals || []).length === 0) {
            api.set()
                .success(intervals => {
                    onAvailabilityAdd(_.compact(intervals).map((interval, i) => ({...interval, tabId: interval.id || i})));
                    availabilityRef.current.componentDidMount();
                    setDefaultFetched(true);
                })
                .get(`/planning/${planningId}/availabilities/defaults?season_id=${season.id}&save_defaults_to_planning=${!disableLiveReload}`)
        }
    }, [defaultFetched]);

    switch (mode)
    {
        case PLANNING_MODE:
            return <AvailabilityManager
                selectionLabels={selectionLabels}
                ref={availabilityRef}
                day={season.start}
                intervals={intervals}
                authToken={authToken}
                isTeacher={false}
                locked={false}
                kinds={["p"]}
                seasonId={season.id}
                forSeason
                disableLiveReload={disableLiveReload}
                planningId={planningId}
                onAdd={onAvailabilityAdd}
                onDelete={onAvailabilityDelete}
                availabilityMessage={availabilityMessage}
            />;
        case PREFERENCES_MODE:
            return <IntervalPreferencesEditor
                preferences={childhoodPreferences}
                activityRefs={activityRefs}
                season={season}
                onUpdate={handleUpdateChildhoodPreferences}/>;
        case PLANNING_AND_PREFERENCES_MODE:
            return <React.Fragment>
                <IntervalPreferencesEditor
                    preferences={childhoodPreferences}
                    activityRefs={activityRefs}
                    season={season}
                    onUpdate={handleUpdateChildhoodPreferences}/>
                <AvailabilityManager
                    selectionLabels={selectionLabels}
                    ref={availabilityRef}
                    day={season.start}
                    seasonId={season.id}
                    intervals={intervals}
                    authToken={authToken}
                    isTeacher={false}
                    locked={false}
                    kinds={["p"]}
                    forSeason
                    disableLiveReload={disableLiveReload}
                    planningId={planningId}
                    onAdd={onAvailabilityAdd}
                    onDelete={onAvailabilityDelete}
                    availabilityMessage={availabilityMessage}
                />
            </React.Fragment>;
        default:
            return null;
    }
}