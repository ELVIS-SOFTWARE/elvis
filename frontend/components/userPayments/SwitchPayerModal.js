import React, { useState } from "react";
import { optionMapper, USER_OPTIONS } from "../utils";

export default function SwitchPayerModal({ payer, payers, onSubmit }) {
    const [newPayerId, setNewPayerId] = useState("");

    const payersOptions = payer && payers
        .filter(p => p.id !== payer.id)
        .map(optionMapper(USER_OPTIONS));

    return <div className="modal" id="switch-payer-modal">
        <div className="modal-dialog">
            <div className="modal-content">
                <div className="modal-header">
                    <div className="flex flex-space-between-justified flex-center-aligned p">
                        <h2 className="modal-title">Changement de payeur</h2>
                        <button
                            type="button"
                            className="close"
                            style={{fontSize:"2em"}}
                            data-dismiss="modal"
                            aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <hr/>
                </div>
                <div className="modal-body">
                    {payer && <div>
                        <h4>Remplacer le payeur {payer.first_name} {payer.last_name} par</h4>
                        <select
                            className="form-control"
                            onChange={e => setNewPayerId(e.target.value)}
                            value={newPayerId}>
                            <option value="">CHOISISSEZ LE NOUVEAU PAYEUR</option>
                            {payersOptions}
                        </select>
                    </div>}
                </div>
                <div className="modal-footer">
                    <button
                        onClick={() => onSubmit(newPayerId)}
                        disabled={!newPayerId}
                        className="btn btn-primary pull-right">
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    </div>;
}