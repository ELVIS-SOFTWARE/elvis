import React from "react";

export default function MessageModal({ id, onChange, onSend, message, recipients, }) {
    return <div className="modal inmodal"
        id={id}
        tabIndex="-1"
        role="dialog">
        <div className="modal-dialog">
            <div className="modal-content animated">
                <div className="modal-header">
                    <h2>Envoi d'un rappel</h2>
                </div>
                <div className="modal-body">
                    <h3>Titre</h3>
                    <input
                        type="text"
                        name="title"
                        className="form-control"
                        size="60"
                        placeholder="Votre titre ici..."
                        onChange={onChange}
                        value={message.title}/>
                    <h3>Destinataire.s</h3>
                    <p>{recipients}</p>
                    <h3>Message</h3>
                    <textarea
                        resizable="false"
                        className="form-control"
                        cols="60"
                        rows="4"
                        placeholder="Votre message ici..."
                        name="content"
                        onChange={onChange}
                        value={message.content}>
                    </textarea>

                    {/*<h3>Envoi par</h3>*/}
                    <div className="flex">
                        <input
                            type="hidden"
                            name="isEmail"
                            id="emailSelectRadio"
                            value="email"
                            checked={true}
                            readOnly={true}
                        />
                    {/*    <div className="form-check m-r">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="isEmail"
                                id="emailSelectRadio"
                                value="email"
                                onChange={onChange}
                                checked={message.isEmail || true} />
                            <label className="form-check-label" htmlFor="emailSelectRadio">
                                    Email
                            </label>
                        </div>*/}
                        {/*<div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="isSMS"
                                id="smsSelectRadio"
                                value="sms"
                                disabled
                                onChange={onChange}
                                value={message.isSMS} />
                            <label className="form-check-label" htmlFor="emailSelectRadio">
                                SMS
                            </label>
                        </div>*/}
                    </div>
                </div>
                <div className="modal-footer flex flex-space-between-justified">
                    <button
                        type="button"
                        className="btn"
                        data-dismiss="modal">
                        <i className="fas fa-times m-r-sm"></i>
                        Annuler
                    </button>
                    <button
                        onClick={onSend}
                        className="btn btn-primary"
                        data-dismiss="modal">
                        <i className="fas fa-paper-plane m-r-sm"></i>
                        Envoyer
                </button>
                </div>
            </div>
        </div>
    </div>;
}