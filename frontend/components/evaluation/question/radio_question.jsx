import React from "react";
import { MESSAGES } from "../../../tools/constants";
import { parseValues } from ".";

export const radioValue = ({radio_values}, value) => value ?
    parseValues(radio_values).find(([, val]) => val === value)[0] :
    MESSAGES.no_answer;

export default function RadioQuestion({
    readOnly,
    question,
    onChange,
    value,
}) {
    if(readOnly) {
        return <p>{radioValue(question, value)}</p>;
    }
    else {
        const radioValues = parseValues(question.radio_values);

        return <div>
            {
                radioValues
                    .map(([lab, val]) => {
                        const inputId = `question${question.id}-${val}`;

                        return (
                            <div key={val} className="p-w-xs m-b-xs bg-muted">
                                <label className="full-width">
                                    <input
                                        type="radio"
                                        id={inputId}
                                        name={question.name}
                                        defaultChecked={value === val}
                                        onChange={e => onChange(e.target.value)}
                                        value={val}
                                    />

                                    <span className="m-l-sm">
                                        {lab}
                                    </span>
                                </label>
                            </div>
                        );
                    })
            }
        </div>;
    }
}