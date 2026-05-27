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
            <div>
                {/*Liste des messages modifiables dans les paramètres de parcours d'inscription (update or create)*/}
                <ApplicationStepParameters
                    key='pricing_info'
                    parameter_label='pricing_info_application'
                    desc='Message tarifs'
                />
                <hr></hr>
                <ApplicationStepParameters
                    key='availability_info'
                    parameter_label='availability_info_application'
                    desc='Message disponibilités'
                />
            </div>
        ]}
    />
}