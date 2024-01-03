import React from "react";
import { toLocaleDate, toDate } from "../../tools/format";

const moment = require("moment");
require("moment/locale/fr");

class NamePicker extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const necessaryColor = { color: "#D63031" };

        const lastNameError =
        this.props.validationState &&
        this.props.validationState.failed.includes("last_name");
        
        const firstNameError =
            this.props.validationState &&
            this.props.validationState.failed.includes("first_name");
            
        return (
            <div className="form form-group">
                {this.props.inEdition ||
                this.props.personSelection == "other" ? (
                    <div className="row">
                        <div className="form-group">
                            <label className="col-md-2 col-sm-2 control-label">
                                Nom <small className="text-danger">*</small>
                            </label>
                            <div
                                className={
                                    "col-md-4 col-sm-3" + (lastNameError
                                        ? " has-warning"
                                        : "")
                                }
                            >
                                <input
                                    type="text"
                                    className="form-control"
                                    name="last_name"
                                    value={this.props.infos.last_name}
                                    onChange={e => {
                                        this.props.handleChangeInfos(e);
                                    }}
                                />
                                <p id="last_nameError" style={necessaryColor}>
                                    {" "}
                                </p>
                            </div>
                            <label className="col-md-2 col-sm-2 control-label">
                                Prénom <small className="text-danger">*</small>
                            </label>
                            <div
                                className={
                                    "col-md-4 col-sm-3" + (firstNameError
                                        ? " has-warning"
                                        : "")
                                }
                            >
                                <input
                                    type="text"
                                    className="form-control"
                                    name="first_name"
                                    value={this.props.infos.first_name}
                                    onChange={e =>
                                        this.props.handleChangeInfos(e)
                                    }
                                />
                                <p id="first_nameError" style={necessaryColor}>
                                    {" "}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}

                {this.props.user.is_admin &&
                this.props.possibleMatches &&
                this.props.possibleMatches.length > 0 ? (
                    <div>
                        <div className="row form-group">
                            <div className="alert alert-warning col-md-12">
                                <p>
                                    Utilisateurs déja existants (cliquez pour
                                    sélectionner):{" "}
                                </p>
                                {_.map(this.props.possibleMatches, (m, i) => {
                                    return (
                                        <p
                                            key={i}
                                            onClick={() =>
                                                this.props.handleSelectMatch(
                                                    m.id,
                                                )
                                            }
                                            style={{
                                                cursor: "pointer",
                                            }}
                                        >
                                            <b>
                                                {m.first_name}
                                                &nbsp;
                                                {m.last_name}
                                            </b>{" "}
                                            {toLocaleDate(toDate(m.birthday))}
                                        </p>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }
}

export default NamePicker;
