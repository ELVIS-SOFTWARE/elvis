import React from "react";
import AlertYesNoRadio from "../common/AlertYesNoRadio";

const NewsLetter = ({ ignoreValidate, schoolName }) => <AlertYesNoRadio
    name="checked_newsletter"
    alertType="info"
    ignoreValidate={ignoreValidate}
    text={`J'autorise ${schoolName} à me tenir à jour de son activité par newsletter.`} />;

export default NewsLetter;
