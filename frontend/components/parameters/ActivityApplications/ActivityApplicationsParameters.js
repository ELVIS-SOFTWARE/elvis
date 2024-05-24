import BaseParameters from "../BaseParameters";
import React from "react";
import ApplicationStatusTable from "./ApplicationStatusTable";
import ConsentDocumentsList from "./ConsentDocumentsList";
import ApplicationParameters from "./ApplicationParameters";
import ApplicationStepParameters from "./ApplicationStepParameters";

export default function ActivityApplicationsParameters() {

    return <BaseParameters
        tabsNames={["Statuts d'inscription", "Documents de consentement à l'inscription", "Paramètres d'inscription", "Parcours d'inscription"]}
        divObjects={[
            <ApplicationStatusTable />,
            <ConsentDocumentsList />,
            <ApplicationParameters />,
            <ApplicationStepParameters />
        ]}
    />
}