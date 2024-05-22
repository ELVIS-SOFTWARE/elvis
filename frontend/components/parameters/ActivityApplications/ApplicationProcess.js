import React, {Fragment, useEffect, useState} from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import {toast} from "react-toastify";
import {EditorState, convertToRaw, convertFromRaw, ContentState} from 'draft-js';
import {Editor} from 'react-draft-wysiwyg';

export default function ApplicationProcess() {
    return <div className="m-3">
        {/*Choix de l'activitié ------------------------------------------------------------------------------------*/}
        <h3>Choix de l'activité</h3>
        <div>
            <p className="card-title">Editer le texte présent sur l'étape 3 dans le parcours d'inscription.</p>
            <form>
                <div className="form-group">
                    <Editor
                        wrapperStyle={{border: "1px solid #e7eaec", padding: "5px", borderRadius:"5px"}}
                        editorState={EditorState.createWithContent(ContentState.createFromText("Bonjour"))}
                        toolbarClassName="toolbarClassName"
                        wrapperClassName="wrapperClassName"
                        editorClassName="editorClassName"
                        onEditorStateChange={(e) => console.log(e)}
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
            </form>
        </div>

        {/*Visibilité ------------------------------------------------------------------------------------*/}
        <h3>Visibilité</h3>
        <div>
            <div className="checkbox checkbox-primary">
                <input
                    type="checkbox"
                    id={"paymentScheduleOptionsActivated"}
                    className=""
                    checked= {true}
                    onChange={(e) => console.log(e.target.checked)}
                />
                <label htmlFor={"paymentScheduleOptionsActivated"}>Afficher le texte dans le parcours d'inscription.</label>
            </div>
        </div>

        <div>
            <button className="btn btn-primary" onClick={() => console.log("Save")}>Enregistrer</button>
        </div>

    </div>
}