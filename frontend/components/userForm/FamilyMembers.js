import React from "react";
import _ from "lodash";
import { fullname } from "../../tools/format";
import { displayGenitiveName, isRadioTrue } from "../utils";
import { Field } from "react-final-form";
import { MESSAGES } from "../../tools/constants";

const FamilyMembers = ({ firstName, family, onEdit, onDelete }) => {
    return (
        <Field
            name="family">
            {({meta}) => {
                const hasError = meta.error && meta.touched;

                return <div >
                    <ul className="list-group d-none" style={{
                                display: 'none',
                            }}>
                        {_.map(family, (m, i) => (
                            <li className="list-group-item" key={i}>
                                <div className="pull-right">
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-primary m-r-xs"
                                        onClick={() => onEdit(i)}
                                    >
                                        <i className="fas fa-edit no-margins" />
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-xs btn-warning"
                                        onClick={() => onDelete(i, family[i])}
                                    >
                                        <i className="fas fa-trash no-margins" />
                                    </button>
                                </div>

                                <div>
                                    <span className="font-bold">
                                        {m.first_name && m.last_name
                                            ? fullname(m)
                                            : "NOUVEL UTILISATEUR"}
                                    </span>
                                    {` ${m.link || "PAS DE LIEN"} `}
                                    <span className="font-bold">
                                        {displayGenitiveName(firstName)}
                                    </span>
                                </div>

                                <div className="m-t-xs member-status-icons flex">
                                    {isRadioTrue(m.is_to_call) && <span className="round-icon is-to-call m-r-sm"><i className="fas fa-phone"></i></span>}
                                    {isRadioTrue(m.is_paying_for) && <span className="round-icon is-paying m-r-sm"><i className="fas fa-euro-sign"></i></span>}
                                    {isRadioTrue(m.is_legal_referent) && <span className="round-icon is-legal-referent"><i className="fas fa-balance-scale"></i></span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                    {hasError && <p className="text-center text-danger">{MESSAGES[meta.error]}</p>}
                </div>;
            }}
        </Field>
    );
};

export default FamilyMembers;
