import React from "react";
import {Field} from "react-final-form";

const HandicapInfos = () => {
    return (
        <div className="mb-4">
            <h3 style={{color: "#8AA4B1"}}>Informations complémentaires</h3>

            <Field
                name="handicap_description"
                component="textarea"
                className="form-control primary"
                placeholder="Informations importantes à fournir au personnel encadrant sur la personne inscrite aux activités."
                style={{borderRadius: "8px", height: "100px"}}
            />

        </div>
    );
};

export default HandicapInfos;
