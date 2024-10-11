import BaseParameters from "../BaseParameters";
import React from "react";
import TeacherAvailabilities from "./TeacherAvailabilities";
import SchoolAvailabilities from "./SchoolAvailabilities";
import CancelActivityParameters from "./CancelActivityParameters";

export default function PlanningsParameters({planningId, auth_token, seasons, availabilityChecked})
{
    return <BaseParameters
        tabsNames={["Disponibilité de l'école", "Professeurs", "Annulation des cours"]}
        divObjects={[
            <SchoolAvailabilities planningId={planningId} authToken={auth_token} seasons={seasons} />,
            <TeacherAvailabilities defaultChecked={availabilityChecked} />,
            <CancelActivityParameters />
        ]}
    />
}