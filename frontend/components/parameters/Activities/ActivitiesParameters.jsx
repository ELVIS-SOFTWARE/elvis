import BaseParameters from "../BaseParameters";
import React, {Fragment} from "react";
import PricingCategoriesEdit from "./PricingCategoriesEdit";

export default function ActivitiesParameters()
{
    return (
        <Fragment>
            <div className="row wrapper border-bottom white-bg page-heading m-b-md">
                <h2>
                    Paramétrage des catégories de prix
                </h2>
            </div>

            <BaseParameters
                tabsNames={["Catégories de prix"]}
                divObjects={[
                    <PricingCategoriesEdit />
                ]}
            />
        </Fragment>
    );
}


/*****************************************************
* DEPRECATED / Moved to PaymentsParameters.js
*****************************************************/