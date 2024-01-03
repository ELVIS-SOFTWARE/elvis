import React from "react";
import { fullname } from "../../tools/format";
import ContactInfos from "./ContactInfos.js";

class FamilyMemberUser extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                    <h3>{"Ajouter un contact"}</h3>
                    <hr />

                    {this.props.infos.possibleMatches &&
                    this.props.infos.possibleMatches.length > 0 ? (
                        <div className="alert alert-success col-md-12">
                            <p>
                                Utilisateurs déja existants (cliquez
                                pour sélectionner):{" "}
                            </p>
                            {_.map(
                                this.props.infos.possibleMatches,
                                (m, i) => {
                                    return (
                                        <p
                                            key={i}
                                            onClick={() =>
                                                this.props.handleSelectParentMatch(
                                                    this.props.idx,
                                                    m.id
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
                                            {`(adhérent N° ${
                                                m.adherent_number
                                            })`}
                                        </p>
                                    );
                                }
                            )}
                        </div>
                    ) : null}

                    <div className="row m-b-sm">
                        <div className="col-md-6 col-sm-12 m-b-sm">
                            <label>Nom</label>
                            <input
                                type="text"
                                className="form-control"
                                name="last_name"
                                value={this.props.infos.last_name || ""}
                                onChange={e =>
                                    this.props.handleChangeMemberInfos(e)
                                }
                            />
                        </div>

                        <div className="col-md-6 col-sm-12">
                            <label>Prénom</label>
                            <input
                                type="text"
                                className="form-control"
                                name="first_name"
                                value={this.props.infos.first_name || ""}
                                onChange={e =>
                                    this.props.handleChangeMemberInfos(e)
                                }
                            />
                        </div>
                    </div>

                    <div className="row m-b-sm">
                        <div className="col-md-6 col-sm-12">
                            <label>Numéro d'adhérent</label>
                            <input
                                type="text"
                                className="form-control"
                                name="adherent_number"
                                value={this.props.infos.adherent_number || ""}
                                onChange={e =>
                                    this.props.handleChangeMemberInfos(e)
                                }
                            />
                        </div>
                    </div>

                    <ContactInfos
                        title={false}
                        infos={this.props.infos}
                        identicalMailUserId={null}
                        handleChangeInfos={e =>
                            this.props.handleChangeMemberInfos(e)
                        }
                        handleAddEmptyPhoneNumber={() =>
                            this.props.handleAddEmptyPhoneNumber(this.props.idx)
                        }
                        handleUpdatePhoneInfos={this.props.handleUpdatePhoneInfos}
                        handleDeletePhoneNumber={(idx) => this.props.handleDeleteFamilyMemberPhoneNumber(idx, this.props.idx)}
                    />

                    {this.props.infos.first_name != undefined &&
                    this.props.infos.last_name != undefined ? (
                        <div className="row">
                            <div className="col-xs-12">
                                <label>Lien de parenté</label>
                                <p>
                                    <strong>{fullname(this.props.infos)}</strong>
                                    {" est "}
                                    {this.props.infos.link ? <strong>{this.props.infos.link}</strong> : "..."}
                                    {" de "}
                                    <strong>{fullname(this.props.orig)}</strong>
                                </p>
                                <select
                                    className="form-control m-b-xs"
                                    name="link"
                                    value={this.props.infos.link || "0"}
                                    onChange={e =>
                                        this.props.handleChangeMemberInfos(e)
                                    }
                                >
                                    <option value="0" disabled>
                                        Sélectionner un lien familial
                                    </option>
                                    <option value="père">Père</option>
                                    <option value="mère">Mère</option>
                                    <option value="grand-père">
                                        Grand-Père
                                    </option>
                                    <option value="grand-mère">
                                        Grand-Mère
                                    </option>
                                    <option value="frère">Frère</option>
                                    <option value="soeur">Soeur</option>
                                    <option value="enfant">Enfant</option>
                                    <option value="époux">Epoux</option>
                                    <option value="autre">Autre</option>
                                </select>
                            </div>
                        </div>
                    ) : null}

                    <div className="row ">
                        <div className="col-xs-12">
                            <div className="row m-b-md">
                                <div className="col-md-3 col-sm-12">
                                    <div className="checkbox checkbox-primary">
                                        <input
                                            type="checkbox"
                                            id={"paying" + this.props.idx}
                                            name="is_paying_for"
                                            checked={
                                                this.props.infos.is_paying_for ||
                                                false
                                            }
                                            onChange={e =>
                                                this.props.handleChangeMemberInfos(
                                                    e
                                                )
                                            }
                                        />
                                        <label
                                            className="control-label"
                                            htmlFor={"paying" + this.props.idx}
                                        >
                                            Payeur
                                        </label>
                                    </div>
                                </div>

                                <div className="col-md-3 col-sm-12">
                                    <div className="checkbox checkbox-primary">
                                        <input
                                            type="checkbox"
                                            id={"legal" + this.props.idx}
                                            name="is_legal_referent"
                                            checked={
                                                this.props.infos
                                                    .is_legal_referent || false
                                            }
                                            onChange={e =>
                                                this.props.handleChangeMemberInfos(
                                                    e
                                                )
                                            }
                                        />
                                        <label
                                            className="control-label"
                                            htmlFor={"legal" + this.props.idx}
                                        >
                                            Référent légal
                                        </label>
                                    </div>
                                </div>

                                <div className="col-md-3 col-sm-12">
                                    <div className="checkbox checkbox-primary">
                                        <input
                                            type="checkbox"
                                            id={"accomp" + this.props.idx}
                                            name="is_accompanying"
                                            checked={
                                                this.props.infos
                                                    .is_accompanying || false
                                            }
                                            onChange={e =>
                                                this.props.handleChangeMemberInfos(
                                                    e
                                                )
                                            }
                                        />
                                        <label
                                            className="control-label"
                                            htmlFor={"accomp" + this.props.idx}
                                        >
                                            Accompagnant
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-3 col-sm-12">
                                    <div className="checkbox checkbox-primary">
                                        <input
                                            type="checkbox"
                                            id={"tocall" + this.props.idx}
                                            name="is_to_call"
                                            checked={
                                                this.props.infos
                                                    .is_to_call || false
                                            }
                                            onChange={e =>
                                                this.props.handleChangeMemberInfos(
                                                    e
                                                )
                                            }
                                        />
                                        <label
                                            className="control-label"
                                            htmlFor={"tocall" + this.props.idx}
                                        >
                                            À contacter en premier
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {/*<div className="row" >
                                <div className="col-xs-12">

                                    <button
                                        className="btn btn-warning"
                                        onClick={() => this.props.handleDeleteUserLink(
                                            this.props.idx,
                                            this.props.infos.is_inverse,
                                        )}>
                                        Supprimer définitivement ce lien familial
                                        <i className="fas fa-trash m-l"
                                            style={{ cursor: "pointer" }}>
                                        </i>
                                    </button>
                                </div>
                            </div>*/}

                            <div className="clearfix">
                                <button 
                                    type="button"
                                    className="btn btn-md btn-primary pull-right"
                                    onClick={this.props.onClose}
                                >
                                    {"Valider"}
                                </button>
                            </div>
                        </div>
                    </div>
            </React.Fragment>
        );
    }
}

export default FamilyMemberUser;
