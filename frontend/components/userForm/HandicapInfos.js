import React from "react";
import { Field } from "react-final-form";

const HandicapInfos = () => {
    return (
        <div>
            <h3>{"Informations complémentaires"}</h3>
            <p>
                <i>
                    {
                        "Informations importantes à fournir au personnel encadrant sur la personne inscrite aux activités."
                    }
                </i>
            </p>

            <Field
                name="handicap_description"
                component="textarea"
                className="form-control" />
        </div>
    );
};

export default HandicapInfos;
