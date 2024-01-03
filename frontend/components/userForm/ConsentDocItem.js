import React, {Fragment, useEffect, useRef} from "react";
import { Field } from "react-final-form";
import AlertCheckbox from "../common/AlertCheckbox";
import AlertYesNoRadio from "../common/AlertYesNoRadio";
import PropTypes from "prop-types";

export default function ConsentDocItem({ docItem, defaultValue, schoolName })
{
    const span = docItem.attached_file_url ? undefined : useRef();

    useEffect(() => {
        if(span && span.current)
        {
            span.current.innerHTML = docItem.content.replaceAll(/https?:\/\/[^\s]+/g, function(match, _){
                return `<a target="_blank" href="${match}">${match}</a>`
            }).replaceAll("{schoolName}", schoolName);
        }
    }, [span]);

    const text = <React.Fragment>
        {
            docItem.attached_file_url ? <Fragment>
                <span>{docItem.content}</span> &nbsp;
                <a href={docItem.attached_file_url} target="_blank" >{docItem.title}</a>
            </Fragment> : <Fragment>
                <span ref={span} ></span>
            </Fragment>
        }
    </React.Fragment>

    return <Fragment>
        {
            docItem.expected_answer ? <Fragment>
                {/* checkbox case */}
                <Field
                    name={`consent_docs[id_${docItem.id}].agreement`}
                    type="checkbox"
                    alertType="info"
                    component={AlertCheckbox}
                    required
                    ignoreValidate={false}
                    text={text}
                />
            </Fragment> : <Fragment>
                {/* yes - no case */}
                <AlertYesNoRadio
                    name={`consent_docs[id_${docItem.id}].agreement`}
                    alertType="info"
                    ignoreValidate={true}
                    text={text} />
            </Fragment>
        }
    </Fragment>
}

ConsentDocItem.propTypes = {
    defaultValue: PropTypes.bool,
    docItem: PropTypes.shape({
        title: PropTypes.string.isRequired,
        content: PropTypes.string,
        expected_answer: PropTypes.bool.isRequired,
        index: PropTypes.number.isRequired,
        attached_file_url: PropTypes.string,
    }).isRequired,
}