import BaseParameters from "../BaseParameters";
import React from "react";
import ApplicationStatusTable from "./ApplicationStatusTable";
import ConsentDocumentsList from "./ConsentDocumentsList";
import ApplicationParameters from "./ApplicationParameters";

export default function ActivityApplicationsParameters({planningId, auth_token, seasons, availabilityChecked}) {
    let dayForCollection = {day: null};
    let paymentTermsId = {id: null};

    const payerPaymentTerms = {
        payer_id: 1,
        season_id: 6,
        payment_terms_id: null,
        day_for_collection: null,
    }

    const availPaymentTerms = [
        {
            id: 2,
            label: "Paiement comptant",
            terms_number: 1,
            collect_on_months: [9],
            days_allowed_for_collection: [10]
        },
        {
            id: 1,
            label: "Paiement 3 fois sans frais",
            terms_number: 3,
            collect_on_months: [1, 2, 3],
            days_allowed_for_collection: [5, 15, 25]
        }
    ]

    function handleChangePaymentTerms(res) {
        console.log("handleChangePaymentTerms : ", paymentTermsId);
    }

    function handleChangeDayForCollection(res) {
        console.log("handleChangeDayForCollection : ", dayForCollection);
    }

    return <BaseParameters
        tabsNames={["Statuts d'inscription", "Documents de consentement à l'inscription", "Paramètres d'inscription"]}
        divObjects={[
            <ApplicationStatusTable />,
            <ConsentDocumentsList />,
            <ApplicationParameters />
        ]}
    />
}