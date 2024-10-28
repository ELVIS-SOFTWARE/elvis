import React, {Fragment, useEffect, useState} from "react";
import * as api from "../../../tools/api";
import swal from "sweetalert2";
import ConsentDocumentModal from "./ConsentDocumentModal";
import {csrfToken} from "../../utils";
import Modal from "react-modal";

export default function ConsentDocumentsList() {

    const [isFetching, setIsFetching] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [editedDocument, setEditedDocument] = useState(null);
    const [documentSaved, setDocumentSaved] = useState(true);

    function didMount() {
        fetchDocuments();
        Modal.setAppElement('body');
    }

    function fetchDocuments() {
        api.set()
            .before(() => setIsFetching(true))
            .success(documents => {
                setIsFetching(false);
                setDocuments(documents);
            })
            .error(() => {
                setIsFetching(false);
                swal({
                    title: "Erreur lors de la récupération des données",
                    type: "error",
                });
            })
            .get(`/consent_documents`);
    }

    function deleteDocument(documentId) {
        setDocumentSaved(false);
        api.set()
            //.before(() => this.setState({isFetching: true}))
            .before(() => setIsFetching(true))
            .success(() => {
                setIsFetching(false);

                const index = documents.findIndex(doc => doc.id === documentId);
                setDocuments(documents.splice(index, index));
                setEditedDocument(null);
                setDocumentSaved(true);
            })
            .error(() => {
                setIsFetching(false);
                swal({
                    title: "Erreur lors de la suppresion",
                    type: "error",
                });
            })
            .del(`/consent_documents/${documentId}`);
    }

    function updateDocument(document, file, fileHasChanged) {

        setDocumentSaved(false);

        let formData = new FormData();
        formData.append("_method", "PATCH");
        formData.append("id", document.id);
        formData.append("title", document.title);
        formData.append("content", document.content);
        formData.append("expected_answer", document.expected_answer);
        formData.append("attached_file_has_changed", fileHasChanged);
        if (fileHasChanged)
            formData.append("attached_file", file);

        fetch(`/consent_documents/${document.id}`, {
            method: "post",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
            },
            body: formData
        }).then(res => {
            if (res.ok) {
                res.json().then(updatedDocument => {
                    setIsFetching(false);

                    const index = documents.findIndex(doc => doc.id === document.id);
                    documents[index] = updatedDocument;
                    setDocuments(documents);
                    setEditedDocument(null);
                    setDocumentSaved(true);
                })
            } else {
                console.error("error");
            }
        });
    }

    function createDocument(document, file) {
        setDocumentSaved(false);

        let formData = new FormData();
        formData.append("title", document.title);
        formData.append("content", document.content);
        formData.append("expected_answer", document.expected_answer);
        formData.append("attached_file", file);

        fetch(`/consent_documents/`, {
            method: "post",
            credentials: "same-origin",
            headers: {
                "X-CSRF-Token": csrfToken,
            },
            body: formData
        }).then(res => {
            if (res.ok) {
                res.json().then(updatedDocument => {
                    setIsFetching(false);
                    document = res;
                    documents.push(document);
                    setDocuments(documents);
                    setEditedDocument(null);
                    setDocumentSaved(true);
                })
            } else {
                console.error("error");
            }
        });
    }

    function handleEdit(id) {
        setEditedDocument(documents.find(doc => doc.id === id));
    }

    function handleCancel() {
        setEditedDocument(null);
    }

    function handleAdd() {
        let document = {
            title: "",
            content: "",
            expected_answer: false
        }
        setEditedDocument(document);
    }

    function handleSubmit(document, file, fileHasChanged) {
        if (document.id)
            updateDocument(document, file, fileHasChanged);
        else
            createDocument(document, file, true);
    }

    function handleMoveUp(docId) {
        api.set()
            .before(() => setIsFetching(true))
            .success(documents => {
                setIsFetching(false);
                setDocuments(documents);
            })
            .error(() => {
                setIsFetching(false);
                swal({
                    title: "Erreur lors de la récupération des données",
                    type: "error",
                });
            })
            .post(`/consent_documents/move_up`,
                {id: docId}
            );
    }

    function handleMoveDown(docId) {
        api.set()
            .before(() => setIsFetching(true))
            .success(documents => {
                setIsFetching(false);
                setDocuments(documents);
            })
            .error(() => {
                setIsFetching(false);
                swal({
                    title: "Erreur lors de la récupération des données",
                    type: "error",
                });
            })
            .post(`/consent_documents/move_down`,
                {id: docId}
            );    }

    function compareIndices(d1, d2) {
        if (d1.index && d2.index)
            return d1.index - d2.index;
        else
            return 0;
    }

    useEffect(didMount, [documents.length]);

    return <Fragment>
        <p className="mb-5">
            Ajoutez des documents à faire valider à vos élèves avant leur inscription. Renseignez les documents
            ci-dessous.
        </p>

        <div className="text-right mb-5">
            <button className="btn btn-primary m-t" onClick={handleAdd}>
                <i className="fas fa-plus"></i>
                Ajouter un document
            </button>
        </div>

        {
            documents
                .sort(compareIndices)
                .map((doc) => {
                    return <DocumentItem document={doc}
                                         key={doc.id}
                                         isFirst={doc.index === 1}
                                         isLast={doc.index === documents.length}
                                         onEdit={handleEdit}
                                         onDelete={deleteDocument}
                                         onMoveUp={handleMoveUp}
                                         onMoveDown={handleMoveDown}
                    />
                })
        }

        <ConsentDocumentModal
            document={editedDocument}
            isOpen={!!editedDocument}
            isFetching={isFetching}
            onRequestClose={handleCancel}
            onSubmit={handleSubmit}
        />

    </Fragment>
}

function DocumentItem({document, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown}) {
    return document ?
        <div className="row mx-0 my-3 border-hover" style={{
            backgroundColor: "#E2EDF3",
            color: "black",
            borderColor: "black",
            borderWidth: "2px",
            borderStyle: "solid",
            borderRadius: "5px",
        }}>

            <div className="col-sm-1">
                <div className="btn btn-md"
                     onClick={() => isFirst ? "" : onMoveUp(document.id)}>
                    {isFirst || <i className="fas fa-chevron-up"></i>}&nbsp;
                </div>
                <div
                    className="btn btn-md"
                    onClick={() => isLast ? "" : onMoveDown(document.id)}>
                    {isLast || <i className="fas fa-chevron-down"></i>}&nbsp;
                </div>
            </div>


            <div className="col-sm-10" style={{
                padding: "15px 20px",
                display: "inline-block",
                fontSize: "1.6rem",
                fontWeight: "normal",
                cursor: "pointer",
            }}
                 onClick={() => onEdit(document.id)}>
                <div className="text-left">
                    {document.title}
                </div>
            </div>

            <div className="col-sm-1 text-right btn btn-lg">
                <i className="fas fa-times"
                   onClick={() => onDelete(document.id)}
                ></i>
            </div>
        </div>
        :
        null;
}