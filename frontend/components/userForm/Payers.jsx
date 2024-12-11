import Resct, { Fragment } from "react";
import SelectMultiple from "../common/SelectMultiple";
import React from "react";

export default function Payers({values, mutators, currentUser})
{
    const family_links_with_user = [...(values.family_links_with_user || [])];

    // Add the current user to the list of family members users to define is_paying column
    family_links_with_user.push({
        id: currentUser.id,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        is_paying_for: currentUser.is_paying

    });

    if(values.payers && values.payers.length > 0)
    {
        values.payers.forEach(payer => {
            const payerUser = family_links_with_user.find(flu => flu.id === payer);
            if(payerUser)
            {
                payerUser.is_paying_for = true;
            }
        });
    }

    const select_payers_all_features = family_links_with_user.map(flwu => [`${flwu.first_name} ${flwu.last_name}`, flwu.id]);
    const select_payers_selected_features = family_links_with_user.filter(flwu => flwu.is_paying_for).map(f => f.is_inverse ? f.id : f.member_id);

    return <Fragment>
        <h3 className="mb-0">Payeurs</h3>

        {values.id > 0 && <SelectMultiple
            title=""
            name="payers"
            isMulti
            mutators={mutators}
            all_features={select_payers_all_features}
            features={select_payers_selected_features}
        />}
    </Fragment>
}