import React from "react";
import Modal from "react-modal";
import swal from "sweetalert2";

export default function PluginActivationModal({
                                                  isOpen,
                                                  plugins,
                                                  activatedPlugins,
                                                  onCancel,
                                                  onClose,
                                                  handleSaveAndRestart
                                              }) {
    const firstPluginID = Object.keys(plugins)[0];
    const isActivated = firstPluginID && activatedPlugins[firstPluginID] === true;
    const rollbackContainerStyle = {
        display: isActivated ? 'none' : 'flex',
        justifyContent: 'flex-end', // Aligner à droite
        marginBottom: '3rem',
    };

    async function handleConfirm() {
        try {
            await handleSaveAndRestart();
            onClose();
        } catch (error) {
            console.error("Erreur lors de la confirmation:", error);
            swal("Erreur inattendue", "Une erreur inattendue s'est produite lors de la confirmation.", "error");
            onCancel();
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            contentLabel="Activation/Deactivation Confirmation Modal"
            className="position-relative"
        >
            <h2>Êtes-vous sûr(e) de vouloir {!isActivated ? "désactiver" : "activer"} ce plugin ?</h2>
            <p>Le redémarrage de la page va prendre un instant.</p>
            <div className="mt-5" style={rollbackContainerStyle}>
                <input className="my-auto" id="rollback" name="rollback" type="checkbox"/>
                <label className="my-auto ml-2" htmlFor="rollback">Supprimer les données du plugin</label>
            </div>
            <div className="d-flex justify-content-between mt-5">
                <button className="btn" onClick={onCancel}>Annuler</button>
                <button className="btn btn-primary" onClick={handleConfirm}>Confirmer</button>
            </div>

        </Modal>
    );
}