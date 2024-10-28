import React, {useState} from "react";
import {MESSAGES} from "../../tools/constants";
import Select, {createFilter} from "react-select";

const InputSelectReact = props => {
    const [inputText, setInputText] = useState('')

    const handleInputChange = (inputText, meta) => {
        if (meta.action !== 'input-blur' && meta.action !== 'menu-close') {
            setInputText(inputText)
        }
    }

    const { input, meta, required, label, options, inline, prompt, button, placeholder, disabled, noOptionsMessage ,id} = props;
    const hasError = meta.error && meta.touched;
    return (
        <div id={id} className={`${inline? "" : "form-group"} ${hasError ? "has-error" : ""}`}>
            {!inline && <label htmlFor={input.name}>
                {label}
                {required && <span className="text-danger">{" *"}</span>}
            </label>}

            {
                button ?
                    (<div className="input-group">
                        <Select className="form-group" {...input} options={options} placeholder={placeholder}
                                filterOption={
                                    createFilter({
                                        matchFrom: 'any',
                                        stringify: option => `${option.label}`,
                                    })}
                                styles={{
                                    option: (base) => ({
                                        ...base,
                                        textAlign: "left",
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        display: "none",
                                    }),
                                }}
                                onInputChange={handleInputChange}
                        />
                        <div className="input-group-addon" data-tippy-content={button.tooltip? button.tooltip : undefined} ><a href={button.href_path} className={button.icon}>{button.text}</a></div>
                    </div>)
                    :
                    (
                        <div >
                            <Select inputProps={{ id: id }} className={"react-select form-control p-0"} {...input} options={options} isDisabled={disabled}
                                    noOptionsMessage={() => noOptionsMessage}
                                    placeholder={placeholder}
                                    filterOption={
                                        createFilter({
                                            matchFrom: 'any',
                                            stringify: option => `${option.label}`,
                                        })}
                                    styles={{
                                        control: (baseStyles) => ({}),
                                        option: (base) => ({
                                            ...base,
                                            textAlign: "left",
                                        }),
                                        dropdownIndicator: (base) => ({
                                            ...base,
                                            display: "none",
                                        }),
                                    }}
                                    onInputChange={handleInputChange}
                            />
                            {meta.error === "requis"?"":<div className="mt-3 text-danger">{meta.error}</div>}

                        </div>
                    )
            }



        </div>
    );
};


export default InputSelectReact;