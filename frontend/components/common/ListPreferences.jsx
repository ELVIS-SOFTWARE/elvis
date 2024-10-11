import React, { useState } from "react";
import _ from "lodash";
import Modal from "react-modal";

const MODAL_STYLE = {
    content: {
        margin: "auto",
        maxWidth: "600px",
        height: "720px",
    }
};

export default function ListPreferences({ preferences, presets = [], columns, className = "", onSubmit}) {
    const defaultPreferences = () => columns.map(c => ({
            id: c.id,
            name: c.Header,
            disabled: false,
        }));

    // This function is used to prevent bugs from evolutions of list columns set
    const mergePreferences = () => {
        // remove prefs for unidentified columns
        const prefs = _.filter(preferences, ({id}) => _.find(columns, { id }));

        return Object.values({
            ..._.keyBy(defaultPreferences(), "id"),
            ..._.keyBy(prefs, "id"),
        });
    };

    // HOOKS
    const [values, setValues] = useState(mergePreferences());
    const [isOpen, setIsOpen] = useState(false);
    // END HOOKS

    // MUTATORS
    const setDisabled = (idx, val) => {
        const newValue = { ...values[idx] };
        newValue.disabled = val;

        const newValues = [...values];
        newValues.splice(idx, 1, newValue);

        setValues(newValues);
    }

    const changeOrder = e => {
        const { dir, idx: idxS } = e.currentTarget.dataset;
        const idx = parseInt(idxS);
        let newIndex = idx;

        const newValues = [...values];

        const constrainToSize = i => Math.min(newValues.length - 1, Math.max(0, i));

        switch(dir) {
            case "up":
                // Look for 
                newIndex = _.findLastIndex(newValues, { disabled : false }, constrainToSize(idx - 1));
                break;
            case "down":
                // Look for first enabled element after current
                newIndex = _.findIndex(newValues, { disabled : false }, constrainToSize(idx + 1));
                break;
        }

        // -1 -> Element cannot go up, already first/last
        if(newIndex !== -1) {
            const [col] = newValues.splice(idx, 1);
            newValues.splice(newIndex, 0, col);
        }

        setValues(newValues);
    }

    const handleSubmit = () => {
        onSubmit(values);
        setIsOpen(false);
    }
    // END MUTATORS

    // RENDER HELPERS
    const createColumnEditor = ({id, name, disabled, order}) => <ColumnEditor
        key={id}
        index={order}
        name={name}
        disabled={disabled}
        onChangeOrder={changeOrder}
        onToggleDisabled={() => setDisabled(order, !disabled)} />;
    // END RENDER HELPERS

    // Conserve original list's indices
    const valuesWithOrder = values.map((v, order) => ({...v, order}))

    // Split the list in two : enabled and disabled
    const enabledValues = valuesWithOrder.filter(v => !v.disabled);
    const disabledValues = valuesWithOrder.filter(v => v.disabled);

    return <div className={className}>
        <button
            className="btn btn-primary"
            onClick={() => setIsOpen(true)}
            data-tippy-content="Préférences de la liste">
            <i className="fas fa-cog"></i>
        </button>
        <Modal
            ariaHideApp={false}
            style={MODAL_STYLE}
            onRequestClose={() => setIsOpen(false)}
            isOpen={isOpen}>
            <h1>Préférences de la liste</h1>
            <hr style={{marginBottom: "0"}}/>
            <div style={{maxHeight: "550px", overflowY: "auto"}}>
                <div className="flex m-b m-t" >
                    <div className="columns-preferences m-r">
                        <h4>Activées</h4>
                        {enabledValues.map(createColumnEditor)}
                    </div>
                    <div className="columns-preferences">
                        <h4>Désactivées</h4>
                        {disabledValues.map(createColumnEditor)}
                    </div>
                </div>
            </div>
            <hr style={{marginTop: "0"}}/>
            <div>
                <button
                    type="reset"
                    className="btn btn-outline btn-primary"
                    onClick={() => setValues(defaultPreferences)}>
                    <i className="fas fa-times"></i> Réinitialiser
                </button>
                <button
                    onClick={() => handleSubmit()}
                    className="btn btn-primary pull-right">
                    <i className="fas fa-check"></i> Valider
                </button>
            </div>
        </Modal>
    </div>;
}

const ColumnEditor = ({ disabled, name, index, onChangeOrder, onToggleDisabled }) => <div className="column">
    <input
        type="checkbox"
        className="toggle-check"
        onClick={onToggleDisabled}
        checked={!disabled} />

    <p style={{margin: "auto 0"}}>
        <strong>
            {
                disabled ?
                    <strike>{name}</strike> :
                    name 
            }
        </strong>
    </p>

    <div
        className="flex flex-column"
        style={{
            visibility: disabled ? "hidden" : "visible",
        }}>
        <button
            onClick={onChangeOrder}
            data-idx={index}
            data-dir="up"
            className="btn btn-sm btn-outline btn-primary sort-button">
            <i className="fas fa-caret-up"></i>
        </button>
        <button
            onClick={onChangeOrder}
            data-idx={index}
            data-dir="down"
            className="btn btn-sm btn-outline btn-primary sort-button">
            <i className="fas fa-caret-down"></i>
        </button>
    </div>
</div>