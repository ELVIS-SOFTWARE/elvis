import React, {Fragment, useEffect, useState} from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import {toast} from "react-toastify";
import {EditorState, convertToRaw, convertFromRaw, ContentState} from 'draft-js';
import {Editor} from 'react-draft-wysiwyg';

export default function ApplicationStepParameters() {
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    const [visibilityActivated, setVisibilityActivated] = useState(false);
    const [init, setInit] = useState(true);

    useEffect(() => {
        api.set()
            .success(res => {
                setVisibilityActivated(res.activated);
                setInit(false)

                let savedContentRaw = null;
                let savedContentState = null;
                if (res.display_text !== null) {
                    try {
                        savedContentRaw = JSON.parse(res.display_text);
                        savedContentState = convertFromRaw(savedContentRaw);
                    } catch (e) {
                        savedContentState = ContentState.createFromText(res.display_text);
                    }
                    setEditorState(EditorState.createWithContent(savedContentState));
                }
            })
            .error(err => {
                swal("Une erreur est survenue lors du chargement des paramètres du parcours d'inscription", res.error, "error");
            })
            .get("activity_application_parameters/get_application_step_parameters", {});
    }, []);

    useEffect(() => {
        if (!init) {
            api.set()
                .error(res => {
                    swal("Une erreur est survenue lors de la sauvegarde des paramètres du parcours d'inscription", res.error, "error");
                })
                .post("activity_application_parameters/change_activated_param", {activated: visibilityActivated});
        }
    }, [visibilityActivated]);

    const onSaveDisplayText = () => {
        api.set()
            .success(res => {
                toast.success("Les paramètres du parcours d'inscription ont été sauvegardés avec succès.");
            })
            .error(res => {
                swal("Une erreur est survenue lors de la sauvegarde des paramètres du parcours d'inscription", res.error, "error");
            })
            .post("activity_application_parameters/change_display_text_param", {display_text: JSON.stringify(convertToRaw(editorState.getCurrentContent()))});
    }


    return <div className="m-3">
        <div className="mb-5">
            <h3>Visibilité</h3>
            <div className="checkbox checkbox-primary">
                <input
                    type="checkbox"
                    id={"paymentScheduleOptionsActivated"}
                    className=""
                    checked={visibilityActivated}
                    onChange={(e) => setVisibilityActivated(e.target.checked)}
                />
                <label htmlFor={"paymentScheduleOptionsActivated"}>Afficher le texte dans le parcours d'inscription.</label>
            </div>
        </div>

        <div>
            <h3>Choix de l'activité</h3>
            <form onSubmit={e => {e.preventDefault();onSaveDisplayText()}}>
                <p>Editer le texte présent dans l'étape 3.</p>

                <div className="form-group mb-5">
                    <Editor
                        wrapperStyle={{border: "1px solid #e7eaec", padding: "5px", borderRadius: "5px"}}
                        editorState={editorState}
                        onEditorStateChange={setEditorState}
                        toolbarClassName="toolbarClassName"
                        wrapperClassName="wrapperClassName"
                        editorClassName="editorClassName"
                        toolbar={{
                            options: ['inline', 'blockType', 'emoji', 'list',],
                            inline: {
                                options: ['bold', 'italic', 'underline', 'strikethrough'],
                            },
                            blockType: {
                                inDropdown: true,
                                options: ['Normal', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'Blockquote'],
                            },
                        }}
                    />
                </div>

                <div className="text-right">
                    <button className="btn btn-primary" type="submit">Enregistrer</button>
                </div>
            </form>
        </div>

    </div>
}