Question.create!(
    question_type: "student_evaluations",
    field_type: "select",
    name: "recommanded_level_for_next_season",
    label: "Niveau de cours préconisé pour la prochaine saison",
    select_target: "evaluation_level_refs",
    default_value: nil,
    is_level_assignment: true,
    order: 0,
)

Question.create!(
    question_type: "student_evaluations",
    field_type: "radio",
    name: "pursue_on_next_season",
    label: "L'élève continue la saison prochaine",
    radio_values: "Oui:true;Non:false;Incertain:null",
    default_value: nil,
    order: 1,
)

Question.create!(
    question_type: "student_evaluations",
    field_type: "radio",
    name: "was_progression_rate_satisfying",
    label: "Le rythme de progression a-t-il été satisfaisant ?",
    radio_values: "Oui:true;Non:false",
    default_value: nil,
    order: 2,
)

Question.create!(
    question_type: "student_evaluations",
    field_type: "select",
    name: "slow_progression_rate_reason",
    label: "Si non, quels ont été les obstacles ?",
    select_target: nil,
    select_values: "Assiduité:0;Difficulté de compréhension:1;Investissement / engagement:2;Relationnel dans le cours collectif:3;Élève particulièrement engagé et motivé:4",
    default_value: nil,
    condition: "was_progression_rate_satisfying=false",
    order: 3,
)

Question.create!(
    question_type: "student_evaluations",
    field_type: "radio",
    name: "should_change_activity",
    label: "Un changement de cours doit-il être envisagé ?",
    radio_values: "Conseillé:advised;Obligatoire:mandatory;Non:no",
    default_value: nil,
    order: 4,
)

Question.create!(
    question_type: "student_evaluations",
    field_type: "select",
    name: "groups_he_could_be_in_next_season",
    label: "Dans quel.s groupe.s peut-il être intégré ?",
    select_target: "activities",
    select_values: "Pas de groupe possible:static_0;Groupes possibles, mais le jour ne convient pas:static_1",
    is_multiple_select: true,
    default_value: nil,
    condition: "should_change_activity!=no",
    order: 5,
)

Question.create!(
    question_type: "student_evaluations",
    field_type: "radio",
    name: "informed_in_due_time_of_change",
    label: "L'élève ou le parent (si élève mineur) a-t-il validé le changement ?",
    radio_values: "Oui:true;Non:false",
    default_value: nil,
    condition: "should_change_activity!=no",
    order: 6,
)

Question.create!(
    question_type: "student_evaluations",
    field_type: "radio",
    name: "is_student_able_to_attend_sessions",
    label: "Compte tenu des aptitudes minimums requises, cet élève est-il en capacité d’intégrer un atelier ?",
    radio_values: "Oui:true;Non:false",
    default_value: nil,
    order: 7,
)