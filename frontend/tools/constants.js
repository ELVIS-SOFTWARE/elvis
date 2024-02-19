export const API_ERRORS_MESSAGES = {
    default: "Une erreur s'est produite lors de la récupération des données",
    err_interval_validated: "Ce créneau a déjà été validé.",
    err_interval_creation_failed:
        "Le créneau n'a pas pu être ajouté. Un ou plusieurs créneaux existent déjà sur cette plage horaire.",
    err_interval_creation_partial:
        "Le ou les créneaux ont été partiellement créés en raison de conflits avec le planning.",
    err_interval_bounds:
        "Le créneau spécifié est invalide. L'heure de début doit être inférieure à l'heure de fin.",
    err_interval_not_found:
        "Ce créneau ne peut être supprimé. Il a déjà été validé ou supprimé par un permanent.",
    err_group_name_exists:
        "Le groupe existe déjà pour cette saison et ce professeur.",
    err_group_name_empty: "Le nom du groupe ne peut être vide.",
    err_evaluation_interval_already_taken:
        "Ce créneau d'évaluation est déjà pris, veuillez en choisir un autre.",
};

export const PRE_APPLICATION_ACTIONS = {
    NEW: 0,
    RENEW: 1,
    CHANGE: 2,
    STOP: 3,
    PURSUE_CHILDHOOD: 4,
    CHAM: 5
};

export const PRE_APPLICATION_ACTION_LABELS = {
    new: "Nouvelle inscription",
    renew: "Renouvellement",
    change: "Changement",
    stop: "Arrêt",
    pursue_childhood: "Poursuite enfance",
    cham: "Inscription CHAM"
};

export const WEEKDAYS = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
];

export const MONTHS = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
];

export const INTERVAL_KINDS = {
    AVAILABILITY: "p",
    LESSON: "c",
    EVALUATION: "e",
    OPTION: "o",
};

export const KINDS_LABEL = {
    [INTERVAL_KINDS.AVAILABILITY]: "Disponibilité",
    [INTERVAL_KINDS.LESSON]: "Cours",
    [INTERVAL_KINDS.EVALUATION]: "Evaluation",
    [INTERVAL_KINDS.OPTION]: "Option",
};

export const TIME_STEPS = [
    { label: "1h", value: 1 },
    { label: "45min", value: 0.75 },
    { label: "30min", value: 0.5 },
    { label: "15min", value: 0.25 },
];

export const modalStyle = {
    overlay: {
        overflowY: "auto",
        alignItems: "flex-start",
    },
    content: {
        bottom: "initial",
        maxHeight: "max-content",
        top: "20px",
        left: "20px",
        right: "20px",
        transform: "none",
    },
};

export const MESSAGES = {
    no_answer: "PAS DE RÉPONSE",
    err_min_length: length => `Ce champ doit comporter au minimum ${length} caractères`,
    err_exact_length: length => `Ce champ doit comporter exactement ${length} caractères`,
    err_starts_with: str => `Ce champ n'a pas le bon préfixe`,
    err_required: "Cette information est requise.",
    err_is_invalid: "Des erreurs de saisies ont été détectées. Veuillez vérifier les informations renseignées.",
    err_is_invalid_id: "La combinaison de Nom - Prénom - date de naissance est déjà prise, vous possédez déjà un compte chez nous. Veuillez vous connecter sur votre espace personel ",
    err_agreement_gdpr: "Pour continuer l'inscription, vous devez exprimer votre consentement sur la collecte de vos données personnelles.",
    err_agreement_image_right: "Pour continuer l'inscription, vous devez nous autoriser à utiliser votre image.",
    err_must_have_payer: "Un payeur doit être déclaré.",
    err_must_check_rules: "Pour continuer, vous devez accepter le règlement intérieur",
    err_phone_format: "Le numéro de téléphone est invalide.",
    err_at_least_one_phone: "Pour continuer l'inscription, vous devez renseigner au moins un numéro de téléphone.",
    err_at_least_one_address: "Pour continuer l'inscription, vous devez renseigner au moins une adresse postale.",
    err_postal_code: "Le code postal est invalide.",
    err_must_select_user: "Veuillez sélectionner un utilisateur avant de continuer.",
    err_must_choose_slot:"Veuillez choisir un créneau avant de continuer.",
    err_must_choose_activity:"Veuillez choisir une activité avant de continuer.",
    err_must_choose_teacher:"Veuillez choisir un professeur avant de continuer.",
    err_must_choose_room:"Veuillez choisir une salle avant de continuer.",
    err_negative_date_range: "Les dates de début et de fin renseignées sont invalides.",
    err_negative_hour_range: "Les heures de début et de fin renseignées sont invalides.",
    err_data_missing: "Impossible de continuer, des données obligatoires sont manquantes.",
    err_invalid_age: "La date de naissance ne peut être saisie à l'avance.",
    err_invalid_NN: "Le numéro de registre national est invalide.",
    err_invalid_email: "L'adresse mail saisie est invalide.",
    err_links_missing: "Vous devez préciser le lien de parenté pour chaque membre de la famille.",
    err_interval_integrity: "Le début doit être inférieur à la fin",
    err_ord_gte: mark => `La valeur doit être supérieure ou égale à ${mark}`,
    err_ord_gt: mark => `La valeur doit être supérieure à ${mark}`,
    err_ord_lte: mark => `La valeur doit être inférieure à ${mark}`,
    err_ord_lt: mark => `La valeur doit être inférieure ou égale à ${mark}`,
    err_must_check_consent: "Vous devez donner votre consentement pour continuer.",
    err_must_respond: "Vous devez répondre pour continuer.",
    err_must_select_price: "Sélectionnez un tarif ou supprimez la ligne.",
    err_cannot_duplicate_price: "Impossible d'ajouter deux fois le même produit avec le même tarif.",
    err_must_select_payment_terms: "veuillez sélectionnez les modalités de paiement.",
};
