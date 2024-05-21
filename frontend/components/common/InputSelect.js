import React from "react";
import {MESSAGES} from "../../tools/constants";

const InputSelect = ({
                         input,
                         meta,
                         required,
                         label,
                         options,
                         inline,
                         prompt,
                         displayPrompt = true,
                         button,
                         tooltip,
                         componentAdd,
                         disabled,
                         wizard
                     }) => {
    const hasError = meta && meta.error && meta.touched;

    const renderOptions = () => {
        const defaultOption = displayPrompt ? <option key="default" value="">{prompt || ""}</option> : null;
        const optionElements = options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>);

        return [defaultOption, ...optionElements];
    };

    const renderInputGroupAddon = (content) => {
        return content ? <div className="input-group-addon">{content}</div> : null;
    };

    return (
        <div className={`${inline ? "" : "form-group"} ${hasError ? "has-error" : ""}`}>
            {!inline && <label htmlFor={input.name} className="small" style={{color: "#003E5C"}}>
                {label} {required && <span className="text-danger">*</span>}
            </label>}
            <div className={tooltip || componentAdd ? "input-group" : ""}>
                {tooltip ? renderInputGroupAddon(<i className="fa fa-exclamation-circle"
                                                    data-tippy-content={tooltip}/>) : null}
                {renderInputGroupAddon(componentAdd)}
                <select className="form-control" style={{borderRadius: "8px"}} {...input} disabled={disabled}>
                    {renderOptions()}
                </select>
                {button && renderInputGroupAddon(<a href={button.href_path} className={button.icon}>{button.text}</a>)}
            </div>

            {hasError && <p className="help-block">{MESSAGES[meta.error]}</p>}
        </div>
    );
};

export default InputSelect;
