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
        >
            <h1>Confirmation</h1>
            <p>Êtes-vous sûr de vouloir {!isActivated ? "désactiver" : "activer"} ce plugin ?</p>
            <p>Le redémarrage de la page va prendre un instant.</p>
            <div style={rollbackContainerStyle}>
                <input className="my-auto" id="rollback" name="rollback" type="checkbox"/>
                <label className="my-auto ml-2" htmlFor="rollback">Supprimer les données du plugin</label>
            </div>
            <button onClick={handleConfirm}>Confirmer</button>
            <button onClick={onCancel}>Annuler</button>
        </Modal>
    );
}