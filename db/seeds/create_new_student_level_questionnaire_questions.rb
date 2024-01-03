Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "radio",
    name: "already_practiced_instrument",
    label: "Avez-vous déjà pratiqué cet.te instrument/activité ?",
    radio_values: "Oui:true;Non:false",
    order: 0,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "select",
    select_values: "1 an:1;2 ans:2;3 ans:3;4 ans:4;5 ans:5;6 ans:6;7 ans:7;8 ans et plus:8plus",
    name: "how_long_target_instrument",
    label: "Combien de temps ?",
    condition: "already_practiced_instrument=true",
    order: 1,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "radio",
    radio_values: "Oui:true;Non:false",
    name: "lessons_taken_target_instrument",
    label: "Avez-vous pris des cours ?",
    condition: "already_practiced_instrument=true",
    order: 2,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    name: "where_target_instrument",
    label: "Où ?",
    condition: "lessons_taken_target_instrument=true",
    order: 3,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "select",
    select_values: "1 an:1;2 ans:2;3 ans:3;4 ans:4;5 ans:5;6 ans:6;7 ans:7;8 ans et plus:8plus",
    name: "how_long_lessons_target_instrument",
    label: "Combien de temps ?",
    condition: "lessons_taken_target_instrument=true",
    order: 4,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "radio",
    radio_values: "Individuel:ind;Collectif:col",
    name: "individual_or_collective_lesson_target_instrument",
    label: "En individuel ou collectif ?",
    condition: "lessons_taken_target_instrument=true",
    order: 5,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "radio",
    radio_values: "Oui:true;Non:false",
    name: "played_in_band_target_instrument",
    label: "Jouez-vous ou avez-vous joué dans un groupe ?",
    condition: "already_practiced_instrument=true",
    order: 6,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "radio",
    radio_values: "Oui:true;Non:false",
    name: "practiced_other_instrument",
    label: "Avez-vous déjà pratiqué un autre instrument ?",
    order: 7,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    name: "which_other_instrument",
    label: "Lequel ?",
    condition: "practiced_other_instrument=true",
    order: 8,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "select",
    select_values: "1 an:1;2 ans:2;3 ans:3;4 ans:4;5 ans:5;6 ans:6;7 ans:7;8 ans et plus:8plus",
    name: "how_long_other_instrument",
    label: "Combien de temps ?",
    condition: "practiced_other_instrument=true",
    order: 9,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "radio",
    radio_values: "Oui:true;Non:false",
    name: "lessons_taken_other_instrument",
    label: "Avez vous pris des cours ?",
    condition: "practiced_other_instrument=true",
    order: 10,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    name: "where_other_instrument",
    label: "Où ?",
    condition: "lessons_taken_other_instrument=true",
    order: 11,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "select",
    select_values: "1 an:1;2 ans:2;3 ans:3;4 ans:4;5 ans:5;6 ans:6;7 ans:7;8 ans et plus:8plus",
    name: "how_long_lessons_other_instrument",
    label: "Combien de temps ?",
    condition: "lessons_taken_other_instrument=true",
    order: 12,
)

Question.create!(
    question_type: "new_student_level_questionnaire",
    field_type: "radio",
    radio_values: "Individuel:ind;Collectif:col",
    name: "individual_or_collective_lesson_other_instrument",
    label: "En individuel ou collectif ?",
    condition: "lessons_taken_other_instrument=true",
    order: 13,
)