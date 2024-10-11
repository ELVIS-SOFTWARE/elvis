import React from "react";
import PropTypes from "prop-types";

const PersonChoice = ({ personSelection, handleSelectPerson }) => (
    <div className="row">
        <div className="col-lg-4 col-lg-offset-4">
            <div className="ibox">
                <div className="ibox-title">
                    <h3>Première Etape</h3>
                </div>
                <div className="ibox-content person_selection_container">
                    <div
                        className={`person_selection ${
                            personSelection == "myself" ? "selected" : null
                        }`}
                        onClick={() => handleSelectPerson("myself")}
                    >
                        <p>Je m'inscris</p>
                    </div>
                    <div
                        className={`person_selection ${
                            personSelection == "other" ? "selected" : null
                        }`}
                        onClick={() => handleSelectPerson("other")}
                    >
                        <p>J'inscris une autre personne</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default PersonChoice;
