import React, {Fragment, useRef} from 'react';
import {Field, Form, } from "react-final-form";
import {required} from "../../tools/validators";
import Input from "../common/Input";
import {csrfToken} from "../utils";
import swal from "sweetalert2";
import {EmailEditor} from "react-email-editor";

export default function TemplateCreator() {
    const emailEditorRef = useRef();

    const onSubmit = (values) => {
        try {
            emailEditorRef.current.editor.exportHtml((data) => {
            fetch(
                `/notification_templates/`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        name: values.name,
                        path: values.path,
                        html: data.html,
                        json: data.design
                    }),
                }
            ).then(response => {
                if (!response.ok)
                    swal("Erreur", "Erreur lors de l'acheminement", "error")

                return response.json()
            }).then(json => {
                swal("Réussite", "Template créé", "success")
                .then(() => {
                    window.location.href = "/notification_templates";
                });
            });
        });
        } catch (error) {
            swal('Erreur', error.message, 'error');
        }
    };

    return (
        <Fragment>
        <div className="row wrapper border-bottom white-bg page-heading">
            <h1>  Creation de templates  </h1>
        </div>

        <div className="col-sm-12">
            <div className="col-12">
                <div className="form-group">
                    <Form
                        onSubmit={onSubmit}
                        render={({ handleSubmit }) => (
                            <form onSubmit={handleSubmit} className="p-lg">
                                <div className="d-inline-flex row justify-content-center">
                                    <div className="pl-4">
                                        <Field
                                            label="Nom du template"
                                            name="name"
                                            type="text"
                                            validate={required}
                                            required
                                            render={Input}
                                        />
                                    </div>

                                    <div className="pl-4">
                                        <Field
                                            label="Chemin (Path)"
                                            name="path"
                                            type="text"
                                            validate={required}
                                            required
                                            render={Input}
                                        />
                                    </div>
                                </div>

                                <EmailEditor
                                    ref={emailEditorRef}
                                    // onLoad={onLoad}
                                    // onReady={onReady}
                                />

                                <div className="text-center mt-3">
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg btn-block"
                                    >
                                        Valider
                                    </button>
                                </div>
                            </form>
                        )}
                    />
                </div>
                <a
                    href="/notification_templates"
                    className="btn btn-primary mt-4 ml-5"
                >
                    Revenir à l'édition
                </a>
            </div>
        </div>
    </Fragment>
    );
};
