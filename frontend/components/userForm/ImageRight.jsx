import React from "react";
import AlertYesNoRadio from "../common/AlertYesNoRadio";

const ImageRight = ({ ignoreValidate, schoolName }) => <AlertYesNoRadio
    name="checked_image_right"
    alertType="info"
    ignoreValidate={ignoreValidate}
    text={
        `J'autorise ${schoolName} à utiliser mon image sur ses différents
        supports de communication (site Internet, formulaires divers,
        réseaux sociaux, communiqués de presse, newsletters et ce,
        uniquement dans l'idée de valoriser la pratique musicale.`
    } />;

export default ImageRight;
