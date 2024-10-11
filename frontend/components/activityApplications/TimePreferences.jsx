import React from "react";
import _ from "lodash";

import Planning from "../planning/Planning";
import moment from "moment";

const TimePreferences = ({
    intervals,
    handleUpdateIntervalsSelection,
    season,
    seasons
}) => {
    return (
        <div className="row">
            <div className="col-lg-12">
                <div className="ibox">
                    <div className="ibox-title">
                        <h3>{"Préferences horaires des activités (hors Eveil)"}</h3>
                    </div>
                    <div className="ibox-content">
                        <Planning
                            isTeacher={false}
                            generic={true}
                            displayOnly={false}
                            modal={false}
                            detailsModal={true}
                            intervals={intervals}
                            season={season}
                            seasons={seasons}
                            day={moment().startOf("week").toDate()}
                            updateTimePreferences={ints =>
                                handleUpdateIntervalsSelection(ints)
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimePreferences;
