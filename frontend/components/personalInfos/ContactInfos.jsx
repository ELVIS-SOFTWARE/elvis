import React from "react";
import { fullname } from "../../tools/format";

const moment = require("moment");
require("moment/locale/fr");

const testId = id => id || id === 0;

const renderUserOptions = users => users.map(
    (u, i) => <option key={i} value={i}>{fullname(u)}</option>
);

const renderPhoneOptions = phones => phones.map(
    (p, i) => <option key={i} value={i}>{`${_.capitalize(p.label)} ${i + 1} : ${p.number}`}</option>
);

const ContactInfos = ({
    title,
    infos,
    validationState,
    identicalTelephones,
    identicalMailUserId,
    handleChangeInfos,
    handleAddEmptyPhoneNumber,
    handleUpdatePhoneInfos,
    handleDeletePhoneNumber,
    handleSetIdenticalMailUserId,
    handleSetIdenticalTelephone,
    handleUnsetIdenticalTelephone,
}) => {
    const family = _.get(infos, "family");
    const hasFamily = Array.isArray(family) && family.length;

    const phoneNumbers = _.map(infos.telephones, (t, i) => {
        const hasIdenticalTelephone = Array.isArray(identicalTelephones) 
            && identicalTelephones.length;

        const identicalTelephone = hasIdenticalTelephone && identicalTelephones[i];

        const handleIdenticalPhoneCheck = (e) => {
            if(e.target.checked) {
                handleSetIdenticalTelephone(i, 0, 0);
            } else {
                handleUnsetIdenticalTelephone(i);
            }
        }

        return (
            <div key={i} className="row form-group">
                <div className="col-xs-12">
                    {hasFamily ?
                        <div className="flex flex-center-aligned flex-wrap m-b-sm p-xs b-r-md">
                            <input
                                type="checkbox"
                                checked={hasIdenticalTelephone}
                                onChange={handleIdenticalPhoneCheck}
                            />

                            <span
                                className="m-l-sm m-r"
                                style={{ textDecoration: identicalTelephone ? "none" : "line-through" }}
                            >
                                {"Identique à"}
                            </span>

                            {hasIdenticalTelephone ?
                                <select
                                    style={{ width: "min-content" }}
                                    className="form-control m-b-xs"
                                    onChange={e => handleSetIdenticalTelephone(i, parseInt(e.target.value), 0)}
                                    value={identicalTelephone.userIdx}
                                >
                                        {renderUserOptions(family)}
                                </select>
                            : null}

                            {hasIdenticalTelephone && testId(identicalTelephone.userIdx) ?
                                <select
                                    style={{ width: "min-content" }}
                                    className="form-control"
                                    onChange={e => handleSetIdenticalTelephone(i, identicalTelephone.userIdx, parseInt(e.target.value))}
                                    value={identicalTelephone.telephoneIdx || ""}
                                >
                                    {renderPhoneOptions(_.get(family[identicalTelephone.userIdx], "telephones"))}
                                </select>
                            : null}
                        </div>
                    : null}
                        
                    <div className="row">
                        <div className="col-sm-6 m-b-xs">
                            <input
                                type="text"
                                className="form-control"
                                name="number"
                                value={t.number || ""}
                                onChange={e => handleUpdatePhoneInfos(i, e)}
                                />
                        </div>
                        <div className="col-sm-4 m-b-xs">
                            <select
                                value={t.label || ""}
                                name="label"
                                className="form-control"
                                onChange={e => handleUpdatePhoneInfos(i, e)}
                                >
                                <option value="">Sélectionner un type</option>
                                <option value="domicile">Domicile</option>
                                <option value="portable">Portable</option>
                                <option value="travail">Travail</option>
                            </select>
                        </div>
                        <div className="col-sm-2">
                            <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleDeletePhoneNumber(i)}
                                >
                                <i className="fas fa-trash" />
                                {"supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    });

    const emailError =
        (validationState && validationState.failed.includes("email")) || false;

    return (
        <div className="clearfix">
            {title ? <h3>Contact</h3> : null}
            
            <div className="row">
                <div
                    className={"col-xs-12 m-b-md" + (emailError ? " has-warning" : "")}
                >
                    <label>
                        Email{" "}
                        {infos.birthday !== "" && moment().diff(infos.birthday, "years") < 18
                            ? "du représentant légal"
                            : null}
                        <small className="text-danger"> *</small>
                    </label><br />
                    {hasFamily ?
                        <div className="flex flex-center-aligned m-b-sm p-xs b-r-md">
                            <input
                                type="checkbox"
                                checked={identicalMailUserId !== null}
                                onChange={e =>
                                    handleSetIdenticalMailUserId(
                                        e.target.checked ? 0 : null,
                                        _.get(family, "[0].email"),
                                    )} />
                            <span
                                className="m-l-sm m-r"
                                style={{ textDecoration: identicalMailUserId === null ? "line-through" : "none" }}
                            >
                                {"Identique à"}
                            </span>

                            {identicalMailUserId !== null ?
                                <select
                                    style={{ width: "min-content" }}
                                    className="form-control"
                                    onChange={e => {
                                        const idx = parseInt(e.target.value);
                                        handleSetIdenticalMailUserId(idx, family[idx].email);
                                    }}
                                    value={identicalMailUserId}
                                >
                                    {renderUserOptions(family)}
                                </select>
                            : null}
                        </div>
                    : null}

                    <input
                        type="text"
                        className="form-control"
                        name="email"
                        value={infos.email || ""}
                        disabled={identicalMailUserId !== null}
                        onChange={e => handleChangeInfos(e)} 
                    />
                </div>

                <div
                    className="col-xs-12">
                    <label>
                        {"Téléphone.s"}
                        <small className="text-danger"> *</small>
                    </label>
                    <br />
                    {phoneNumbers}
                    <button
                        className="btn btn-primary btn-sm m-b-md"
                        onClick={handleAddEmptyPhoneNumber}
                    >
                        <i className="fas fa-plus" /> {"Ajouter un téléphone"}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ContactInfos;
