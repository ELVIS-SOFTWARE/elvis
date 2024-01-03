import React from "react";
import { Field } from "react-final-form";
import { agreement } from "../../tools/validators";
import AlertCheckbox from "../common/AlertCheckbox";

const GDPR = ({ shouldCheckGdpr, ignoreValidate, schoolName }) => (
    <div>
        <Field
            id="GDPR"
            name="checked_gdpr"
            type="checkbox"
            alertType="info"
            component={AlertCheckbox}
            ignoreValidate={ignoreValidate}
            text={<React.Fragment>
                Je consens à ce que mes données personnelles soient utilisées
                à des fins de traitements associés au fonctionnement de la
                plateforme comme décrits dans&nbsp;
                <a href="/cgu">
                    la politique de confidentialité
                    et traitement des données personnelles par {schoolName}
                </a>
            </React.Fragment>}
        />
    </div>
);

export default GDPR;
