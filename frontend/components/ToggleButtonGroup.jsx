import React, {Fragment, useEffect, useState} from "react";
import ToggleButton from "./ToggleButton";

/**
 * @param {number} maxSelected
 * @param {Array<JSX.Element>} childrenContent
 * @param {Array<number>} selected
 * @param {function} onChange
 * @param {React.CSSProperties} buttonStyles
 * @param {string} buttonClasses
 * @returns {JSX.Element}
 * @constructor
 */
export default function ToggleButtonGroup({maxSelected, childrenContent, selected, onChange, buttonStyles, buttonClasses}) {

    maxSelected = maxSelected || 1;

    const [buttonsState, setButtonsState] = useState([]);

    useEffect(() => {
            setButtonsState(childrenContent.map((child, i) => (
                {active: selected.indexOf(i) !== -1}
            )))
        },
        [childrenContent]
    );

    useEffect(() =>
    {
        if(selected.length > maxSelected)
        {
            selected.length = maxSelected;
            setButtonsState(buttonsState.map((b, i) => ({active: selected.indexOf(i) !== -1})));
            onChange && onChange(selected);
        }

    }, [maxSelected]);

    function handleChange(key, value)
    {
        const newButtonsState = [...buttonsState];

        if (value && (newButtonsState.filter(b => b.active).length >= maxSelected || selected.length >= maxSelected))
        {
            const lastActive = newButtonsState.filter(b => b.active).pop();

            if(lastActive)
                lastActive.active = false;
        }

        newButtonsState[key].active = value;
        setButtonsState(newButtonsState);

        const newSelected = buttonsState
            .filter(b => b.active)
            .map(b => buttonsState.indexOf(b));
        selected.length = 0;
        newSelected.forEach(i => selected.push(i));

        if(onChange && typeof onChange === 'function')
        {
            const onChangeRes = onChange(newSelected);

            return onChangeRes === undefined ? true : onChangeRes;
        }

        return true;
    }

    return <Fragment>
        {childrenContent && childrenContent.map((child, i) =>
            <ToggleButton
                key={i}
                index={i}
                onClick={handleChange}
                status={buttonsState[i]}
                divStyle={buttonStyles}
                divClasses={buttonClasses}
            >
                {child}
            </ToggleButton>
        )}
    </Fragment>
}
