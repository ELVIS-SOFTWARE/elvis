import _ from "lodash";
import React from "react";
import { reactOptionMapper } from "../../utils";
import TARGETS from "./select_targets";
import Select from "react-select";
import { MESSAGES } from "../../../tools/constants";
import { parseValues } from ".";
import { fullname } from "../../../tools/format";

function createTargetOptions(selectTarget, referenceData) {
    const target = TARGETS[selectTarget];

    try {
        return referenceData[target.setName]
            .map(reactOptionMapper({
                id: target.valueAccessor,
                label: target.labelAccessor
            }));
    } catch (err) {
        console.error("Target %s is not supported, please add it to select_question source");
        return [
            { label: `TARGET ${selectTarget} NOT SUPPORTED` },
        ];
    }
}

function createStaticOptions(options) {
    return parseValues(options)
        .map(([label, value]) => ({
            value,
            label,
        }));
}

function createOptions(selectValues, selectTarget, referenceData) {
    let result = [];

    if(selectValues !== null)
        result = result.concat(createStaticOptions(selectValues));

    if(selectTarget !== null)
        result = result.concat(createTargetOptions(selectTarget, referenceData));

    return result;
}

function formatActivities(activities, referenceData) {
    const groups = activities.map((a, i) => {
        const ref = referenceData.find(r => r.id === parseInt(a));

        if (ref) {
            return (
                <li key={i}>
                    <span className="label label-primary">{ref.group_name}</span>
                    <ul>
                        {ref.users.slice(0, 3).map((u, j) => (
                            <li key={j}>{fullname(u)}</li>
                        ))}
                        <li key={ref.users.length}>{"..."}</li>
                    </ul>
                </li>
            );
        }

        return null;
    });

    if(_.compact(groups).length === 0)
        return undefined;

    return (
        <ul>{groups}</ul>
    );
}

export default function SelectQuestion({
    value,
    question,
    readOnly,
    onChange,
    referenceData,
}) {
    const {
        select_target,
        select_values,
        is_multiple_select: isMulti = false,
        name,
    } = question;

    const values = value && value.split(",") || [];

    const options = [
        { value: "", label: question.placeholder || "" },
        ...createOptions(select_values, select_target, referenceData),
    ];

    const selectValues = options.filter(o => values.includes(o.value.toString()));

    if (readOnly) {
        if (select_target === "activities") {
            const formatedActs = formatActivities(values, referenceData[select_target]);

            if(formatedActs)
                return formatedActs;
        }

        return selectValues.length ? (
            <div className="flex-column">
                {selectValues.map(({ value, label }) =>
                    <span key={value}>{selectValues.length > 1 && "- "}{label}</span>
                )}
            </div>
        ) : question.placeholder || MESSAGES.no_answer;
    }
    else {
        const onChangeValue = val => {
            const values = isMulti ? val.map(v => v.value) : [val.value];
            onChange(values.join(","));
        };

        return <Select
            name={name}
            options={options}
            defaultValue={selectValues}
            isMulti={isMulti}
            onChange={onChangeValue} />;
    }
}