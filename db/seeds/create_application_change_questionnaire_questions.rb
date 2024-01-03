Question.create!(
    question_type: "application_change_questionnaire",
    is_required: true,
    name: "change_teacher",
    label: "Voulez vous changer de professeur ?",
    field_type: "radio",
    radio_values: "Oui:true;Non:false",
    order: 0,
)

Question.create!(
    question_type: "application_change_questionnaire",
    is_required: true,
    name: "change_time_interval",
    label: "Voulez vous changer d'horaire ?",
    field_type: "radio",
    radio_values: "Oui:true;Non:false",
    order: 1,
)

Question.create!(
    question_type: "application_change_questionnaire",
    is_required: true,
    name: "change_location",
    label: "Préfèreriez vous un lieu ?",
    field_type: "select",
    select_target: "locations",
    select_values: "Indifférent:static_0",
    order: 2,
)