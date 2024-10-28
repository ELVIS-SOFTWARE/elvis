import React from "react";
import Evaluation from "./Evaluation";
import { formatActivityForDisplay } from "../../tools/format";
import { parseValues } from "./question";
import { findAndGet } from "../utils";

export default function EvaluationMenu({
    user,
    season,
    questions,
    activities,
    referenceData,
}) {
    const activitiesList = activities
        .map(a => <ActivityEvaluation
            key={a.id}
            user={user}
            activity={a}
            season={season}
            questions={questions}
            referenceData={referenceData} />);

    return <div className="row">
        <div className="col-lg-6">
            {activitiesList}
        </div>
    </div>;
}

function ActivityEvaluation({
    user,
    season,
    activity,
    questions,
    referenceData,
}) {
    return <div className="ibox">
        <div className="ibox-title">
            <h3>{formatActivityForDisplay(activity)}</h3>
        </div>
        <div className="ibox-content">
            <Evaluation
                user={user}
                season={season}
                activity={activity}
                questions={questions}
                referenceData={referenceData}
                evaluations={activity.student_evaluations} />
        </div>
    </div>;
}