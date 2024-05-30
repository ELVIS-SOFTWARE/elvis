import React, {Fragment} from 'react'
import * as api from "../tools/api";
import swal from "sweetalert2";
import PropTypes from "prop-types";

/**
 * @param classname ruby class
 * @param id id of the object to remove
 * @param validationText text to display in the validation popup
 * @param text  text to display in the button. Is not used if children is set
 * @param btnProps props to pass to the button
 * @param onSuccess callback on success. Ne rien mettre pour une redirection par défaut avec un swal. (possible 404)
 * @param onFailed callback on failed. Ne rien mettre pour juste afficher un swal
 * @param children children to display in the button
 * @returns {JSX.Element}
 * @constructor
 */
export default function RemoveComponent({ classname, id, validationText, text, btnProps, onSuccess, onFailed, children, additionalMessage })
{
    const localOnSuccess = (data) =>
    {
        if(typeof onSuccess === "function")
        {
            onSuccess(data);
        }
        else
        {
            swal({
                title: "Succès",
                html: data.message || "Suppression effectuée. La page va se recharger à la fermeture de ce message",
                type: "success",
            })
            .then(() =>
            {
                // redirect to index of model or to root
                let tabParams = window.location.href.split("/");

                if(tabParams[tabParams.length - 1] === "edit")
                {
                    tabParams.pop(); // remove edit
                    tabParams.pop(); // remove id
                }
                else if( !isNaN(parseInt(tabParams[tabParams.length - 1])) ) // if last part is an number
                {
                    tabParams.pop(); // remove id
                }

                window.location = tabParams.join("/");
            });
        }
    };

    const localOnFailed = (data) =>
    {
        if(typeof onFailed === "function")
        {
            onFailed(data);
        }
        else
        {
            swal({
                title: "Erreur",
                html: data.message || "Quelque chose s'est mal passé",
                type: "error",
            })
        }
    };

    const onSubmit = () =>
    {
        swal({
            type: "warning",
            title: validationText || "Etes-vous sûr de vouloir supprimer cet élément ?",
            text: additionalMessage,
            showCancelButton: true,
            confirmButtonText: "Oui",
            cancelButtonText: "Non",
        }).then((result) =>
        {
            if(result.value)
            {
                api
                    .set()
                    .success((data) =>
                    {
                        if(data.success)
                        {
                            localOnSuccess(data);
                        }
                        else
                        {
                            localOnFailed(data);
                        }
                    })
                    .error(data =>
                    {
                        localOnFailed(data);
                    })
                    .del(`/destroy/${classname}/${id}`, undefined);
            }
        });
    };

    btnProps = btnProps || {};
    btnProps.className = btnProps.className || "btn btn-danger";

    return <button {...btnProps} onClick={onSubmit}>
        {children ? children : <Fragment>
            <i className="fas fa-trash m-r-sm" /> {text || "Remove"}
        </Fragment>}
    </button>
}

RemoveComponent.propTypes = {
    classname: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    text: PropTypes.string,
    btnProps: PropTypes.object,
    onSuccess: PropTypes.func,
    onFailed: PropTypes.func,
    validationText: PropTypes.string,
}