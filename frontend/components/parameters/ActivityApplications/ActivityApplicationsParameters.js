import BaseParameters from "../BaseParameters";
import React from "react";
import ApplicationStatusTable from "./ApplicationStatusTable";
import ConsentDocumentsList from "./ConsentDocumentsList";

export default function ActivityApplicationsParameters({ planningId, auth_token, seasons, availabilityChecked }) {


    return <BaseParameters
        tabsNames={["Statuts d'inscription", "Documents de consentement à l'inscription"]}
        divObjects={[
            <ApplicationStatusTable />,
            <ConsentDocumentsList />,
        ]}
    />;
}