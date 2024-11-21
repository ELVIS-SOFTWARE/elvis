import React, { useState, useRef } from 'react';
import { csrfToken } from '../utils';
import swal from 'sweetalert2';
import { EmailEditor } from 'react-email-editor';

export default function ElvisEditor(props) {
    const [json, setJson] = useState(JSON.parse(props.templateJson));
    const [html, setHtml] = useState(props.templateBody);
    const emailEditorRef = useRef();

    const handleProcess = () => {
        emailEditorRef.current.editor.exportHtml((data) => {
            setJson(data.design);
            setHtml(data.html);

            fetch(`/notification_templates/${encodeURIComponent(props.templateId)}`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    json: data.design,
                    html: data.html,
                }),
            })
                .then(response => {
                    if (!response.ok) {
                        swal('Erreur', 'Erreur lors de l\'acheminement', 'error');
                    }

                    return response.json();
                })
                .then(json => {
                    swal('Réussite', 'Template modifié', 'success');
                });
        });
    };

    const handleDeleteProcess = (e) => {
        e.preventDefault();
        swal({
            title: 'Êtes vous sûr de supprimer ce template ?',
            type: 'warning',
            confirmButtonText: 'Oui !',
            cancelButtonText: 'Annuler',
            showCancelButton: true,
        }).then(a => {
            if (a.value) {
                fetch(`/notification_templates/${encodeURIComponent(props.templateId)}`, {
                    method: 'DELETE',
                    credentials: 'same-origin',
                    headers: {
                        'X-CSRF-Token': csrfToken,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: props.templateId,
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        swal('Erreur', 'Erreur lors de l\'acheminement', 'error');
                    }

                    swal('Réussite', 'Template supprimé', 'success')
                    .then(() => {
                        window.location.href = "/notification_templates";
                    });
                })

            }
        });
    };

    const onLoad = () => {
        const unlayer = emailEditorRef.current.editor;

        unlayer.setAppearance({
            theme: 'light',
            panels: {
                tools: {
                    dock: 'right',
                },
            },
            loader: {
                url:
                    'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_300,w_300,f_auto,q_auto/1632721/882276_138965.png',
            },
        });

        unlayer.loadDesign(json);
        unlayer.setMergeTags(props.mergeTags);
    };

    const onReady = () => {
        console.log('onReady');
    };

    return (
        <div className="form-group">
            <EmailEditor
                style={{ minHeight: '700px' }}
                ref={emailEditorRef}
                onLoad={onLoad}
                onReady={onReady}
                options={{ locale: 'fr-FR' }}
            />

            <div className="mt-3">
                <button
                    onClick={handleProcess}
                    className="btn btn-primary pull-right mt-3"
                >
                    Modifier le template
                </button>
            </div>
        </div>
    );
};
