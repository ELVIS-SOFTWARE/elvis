import React, { Fragment } from "react";

import NamePicker from "./NamePicker";

const moment = require("moment");
require("moment/locale/fr");

class GeneralInfos extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const necessaryColor = { color: "#D63031" };

        const birthdayError =
            this.props.validationState &&
            this.props.validationState.failed.includes("birthday");
        const sexError =
            this.props.validationState &&
            this.props.validationState.failed.includes("sex");

        return (
            <Fragment>
                <div className="form form-group">
                    <NamePicker
                        user={this.props.user}
                        personSelection={"other"}
                        validationState={this.props.validationState}
                        infos={this.props.infos}
                        handleChangeInfos={e =>
                            this.props.handleChangeInfos(e)
                        }
                        possibleMatches={this.props.possibleMatches}
                        handleSelectMatch={matchId =>
                            this.props.handleSelectMatch(matchId)
                        }
                    />
                    <div className="row">
                        <label className="col-md-2 col-sm-2 control-label">
                            Date de naissance{" "}
                            <small className="text-danger">*</small>
                        </label>
                        <div
                            className={
                                "col-md-4 col-sm-3" +
                                (birthdayError ? " has-warning" : "")
                            }
                        >
                            <input
                                type="date"
                                className="form-control"
                                value={this.props.infos.birthday ? this.props.infos.birthday.split("T")[0] : ""}
                                onChange={e =>
                                    this.props.handleSelectAge(e)
                                }
                            />
                            {this.props.infos.birthday ? (
                                <i>
                                    <small>
                                        {moment().diff(
                                            moment(this.props.infos.birthday),
                                            "years"
                                        ) + " ans"}
                                    </small>
                                </i>
                            ) : null}
                            <p id="birthdayError" style={necessaryColor} />
                        </div>

                        <label className="col-md-2 col-sm-2 control-label">
                            Sexe <small className="text-danger">*</small>
                        </label>
                        <div
                            className={
                                "col-md-4 col-sm-3" +
                                (sexError ? " has-warning" : "")
                            }
                        >
                            <select
                                className="form-control m-b"
                                name="sex"
                                value={this.props.infos.sex}
                                onChange={e =>
                                    this.props.handleChangeInfos(e)
                                }
                            >
                                <option value="0" disabled>
                                    Sélectionnez le sexe
                                </option>
                                <option value="F">Féminin</option>
                                <option value="M">Masculin</option>
                                <option value="A">Autre</option>
                            </select>
                            <p id="sexError" style={necessaryColor} />
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}

export default GeneralInfos;
