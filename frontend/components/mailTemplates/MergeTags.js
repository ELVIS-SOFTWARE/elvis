export const APPLICATION_TAGS = {
    first_name: {
        name: "Prénom de l'utilisateur",
        value: "{{first_name}}",
        sample: "Prénom"
    },

    last_name: {
        name: "Nom de l'utilisateur",
        value: "{{last_name}}",
        sample: "Nom"
    },

    activity_label: {
        name: "Nom de l'activité",
        value: "{{activity.label}}",
        sample: "Nom de l'activité"
    },

    applicationId: {
        name: "ID de L'application",
        value: "{{application.id}}",
        sample: "ID de l'application"
    },

    application_first_name: {
        name: "Prénom de l'application",
        value: "{{application.first_name}}",
        sample: "Prénom de l'application"
    },

    application_last_name: {
        name: "Nom de l'application",
        value: "{{application.last_name}}",
        sample: "Nom de l'application"
    },

    application_season_label: {
        name: "Saison de l'application",
        value: "{{application.season_label}}",
        sample: "Saison de l'application"
    }
}

export const ACTIVITY_TAGS = {
    activity_start_date: {
        name: "Date de début de l'activité",
        value: "{{activity.startDate}}",
        sample: "Date de début de l'activité"
    },

    activity_start_hour: {
        name: "Heure de début de l'activité",
        value: "{{activity.activity_start}}",
        sample: "Heure de début de l'activité"
    },

    activity_end: {
        name: "Heure de fin de l'activité",
        value: "{{activity.activity_end}}",
        sample: "Heure de fin de l'activité"
    },

    activity_teacher_first_name: {
        name: "Prénom du professeur",
        value: "{{activity.teacher_first_name}}",
        sample: "Prénom du professeur"
    },

    activity_teacher_last_name: {
        name: "Nom du professeur",
        value: "{{activity.teacher_last_name}}",
        sample: "Nom du professeur"
    }
}

export const PAYMENT_TAGS = {

    payment_schedule_id: {
        name: "payment_schedule_id",
        value: "{{payments.payment_schedule_id}}",
        sample: "payment_schedule_id"
    },

    season_label: {
        name: "Saison du paiement",
        value: "{{payments.season_of_payment}}",
        sample: "Saison du paiement"
    },

    previsional_date: {
        name: "Date du paiement",
        value: "{{payment.previsional_date}}",
        sample: "Date du paiement"
    },

    amount: {
        name: "Montant du paiement",
        value: "{{payment.amount}}",
        sample: "Montant du paiement"
    },

    status: {
        name: "Statut du paiement",
        value: "{{payment.status}}",
        sample: "Statut du paiement"
    },

    paymentsLoop: {
        name : "Paiements",
        rules: {
            repeat: {
                name: "Répeter pour chaque paiement",
                before: "{% for payment in due_payments %}",
                after: "{% endfor %}"
            }
        }
    }
}

export const REGLEMENTS_TAGS = {

    reglement_id: {
        name: "reglement_id",
        value: "{{reglements.reglement_id}}",
        sample: "reglement_id"
    },

    reglement_payable_id: {
        name: "reglement_payable_id",
        value: "{{reglements.reglement_payable_id}}",
        sample: "reglement_payable_id"
    },

    reglement_reception_date: {
        name: "reglement_reception_date",
        value: "{{reglements.reglement_reception_date}}",
        sample: "reglement_reception_date"
    },

    reglement_cashing_date: {
        name: "reglement_cashing_date",
        value: "{{reglement.['cashing_date']}}",
        sample: "reglement_cashing_date"
    },

    reglement_amount: {
        name: "reglement_amount",
        value: "{{reglement['amount']}}",
        sample: "reglement_amount"
    },

    reglement_status: {
        name: "reglement_status",
        value: "{{reglement['status']}}",
        sample: "reglement_status"
    },

    reglementsLoop: {
        name : "Règlements",
        rules: {
            repeat: {
                name: "Répeter pour chaque règlement",
                before: "{% for reglement in reglements %}",
                after: "{% endfor %}"
            }
        }
    }
}

export const UTILS_TAGS = {
    button_school_link: {
        name: "Bouton vers le site de l'école",
        value: "{{school_link}}",
        sample: "Bouton vers le site de l'école"
    },

    img_school_logo: {
        name: "Logo de l'école",
        value: "{{school_logo}}",
        sample: "Logo de l'école"
    },
}