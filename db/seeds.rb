def create_season(year, is_current)
  Season.create!(
    label: "Saison #{year}-#{year + 1}",
    start: "#{year}-09-01",
    end: "#{year + 1}-06-01",
    closing_date_for_applications: "#{year + 1}-05-01",
    opening_date_for_applications: "#{year}-06-15",
    opening_date_for_new_applications: "#{year}-07-01",
    date_for_teacher_planning_validation: "#{year}-06-01",
    nb_lessons: 31,
    is_current: is_current
  )
end

# PARAMETERS
Parameter.create!(label: "INTERVAL_STEPS", value: "{}", value_type: "json")
Parameter.create!(label: "app.name", value: "Elvis", value_type: "string")
Parameter.create!(label: "app.devise.config.mailer_sender", value: "no-reply@callingelvis.com", value_type: "string")
Parameter.create!(label: "app.application_mailer.default_from", value: "no-reply@callingelvis.com",
                  value_type: "string")
Parameter.create!(label: "app.email.footer", value: "Elvis", value_type: "string")

# =============================================================================
# CREATE QUESTIONS
Question.create!([
                   { field_type: "select", name: "recommanded_level_for_next_season",
                     label: "Niveau de cours préconisé pour la prochaine saison", radio_values: nil, select_target: "evaluation_level_refs", default_value: nil, order: 0, is_multiple_select: false, is_required: true, is_level_assignment: true, select_values: nil, condition: nil, question_type: "student_evaluations", placeholder: nil },
                   { field_type: "radio", name: "pursue_on_next_season", label: "L'élève continue la saison prochaine",
                     radio_values: "Oui:true;Non:false;Incertain:null", select_target: nil, default_value: nil, order: 1, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: nil, question_type: "student_evaluations", placeholder: nil },
                   { field_type: "radio", name: "was_progression_rate_satisfying",
                     label: "Le rythme de progression a-t-il été satisfaisant ?", radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 2, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: nil, question_type: "student_evaluations", placeholder: nil },
                   { field_type: "radio", name: "should_change_activity", label: "Un changement de cours doit-il être envisagé ?",
                     radio_values: "Conseillé:advised;Obligatoire:mandatory;Non:no", select_target: nil, default_value: nil, order: 4, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: nil, question_type: "student_evaluations", placeholder: nil },
                   { field_type: "select", name: "groups_he_could_be_in_next_season",
                     label: "Dans quel.s groupe.s peut-il être intégré ?", radio_values: nil, select_target: "activities", default_value: nil, order: 5, is_multiple_select: true, is_required: true, is_level_assignment: false, select_values: "Pas de groupe possible:static_0;Groupes possibles, mais le jour ne convient pas:static_1", condition: "should_change_activity!=no", question_type: "student_evaluations", placeholder: nil },
                   { field_type: "radio", name: "informed_in_due_time_of_change",
                     label: "L'élève ou le parent (si élève mineur) a-t-il validé le changement ?", radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 6, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: "should_change_activity!=no", question_type: "student_evaluations", placeholder: nil },
                   { field_type: "radio", name: "is_student_able_to_attend_sessions",
                     label: "Compte tenu des aptitudes minimums requises, cet élève est-il en capacité d’intégrer un atelier ?", radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 7, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: nil, question_type: "student_evaluations", placeholder: nil },
                   { field_type: "radio", name: "already_practiced_instrument",
                     label: "Avez-vous déjà pratiqué cet.te instrument/activité ?", radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 0, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: nil, question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "select", name: "how_long_target_instrument", label: "Combien de temps ?", radio_values: nil,
                     select_target: nil, default_value: nil, order: 1, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: "1 an:1;2 ans:2;3 ans:3;4 ans:4;5 ans:5;6 ans:6;7 ans:7;8 ans et plus:8plus", condition: "already_practiced_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "radio", name: "lessons_taken_target_instrument", label: "Avez-vous pris des cours ?",
                     radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 2, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: "already_practiced_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "text", name: "where_target_instrument", label: "Où ?", radio_values: nil, select_target: nil,
                     default_value: nil, order: 3, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: "lessons_taken_target_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "select", name: "how_long_lessons_target_instrument", label: "Combien de temps ?", radio_values: nil,
                     select_target: nil, default_value: nil, order: 4, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: "1 an:1;2 ans:2;3 ans:3;4 ans:4;5 ans:5;6 ans:6;7 ans:7;8 ans et plus:8plus", condition: "lessons_taken_target_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "radio", name: "individual_or_collective_lesson_target_instrument",
                     label: "En individuel ou collectif ?", radio_values: "Individuel:ind;Collectif:col", select_target: nil, default_value: nil, order: 5, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: "lessons_taken_target_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "radio", name: "played_in_band_target_instrument",
                     label: "Jouez-vous ou avez-vous joué dans un groupe ?", radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 6, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: "already_practiced_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "radio", name: "practiced_other_instrument", label: "Avez-vous déjà pratiqué un autre instrument ?",
                     radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 7, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: nil, question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "text", name: "which_other_instrument", label: "Lequel ?", radio_values: nil, select_target: nil,
                     default_value: nil, order: 8, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: "practiced_other_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "select", name: "how_long_other_instrument", label: "Combien de temps ?", radio_values: nil,
                     select_target: nil, default_value: nil, order: 9, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: "1 an:1;2 ans:2;3 ans:3;4 ans:4;5 ans:5;6 ans:6;7 ans:7;8 ans et plus:8plus", condition: "practiced_other_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "radio", name: "lessons_taken_other_instrument", label: "Avez vous pris des cours ?",
                     radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 10, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: "practiced_other_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "text", name: "where_other_instrument", label: "Où ?", radio_values: nil, select_target: nil,
                     default_value: nil, order: 11, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: "lessons_taken_other_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "select", name: "how_long_lessons_other_instrument", label: "Combien de temps ?", radio_values: nil,
                     select_target: nil, default_value: nil, order: 12, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: "1 an:1;2 ans:2;3 ans:3;4 ans:4;5 ans:5;6 ans:6;7 ans:7;8 ans et plus:8plus", condition: "lessons_taken_other_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "radio", name: "individual_or_collective_lesson_other_instrument",
                     label: "En individuel ou collectif ?", radio_values: "Individuel:ind;Collectif:col", select_target: nil, default_value: nil, order: 13, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: "lessons_taken_other_instrument=true", question_type: "new_student_level_questionnaire", placeholder: nil },
                   { field_type: "radio", name: "change_teacher", label: "Voulez vous changer de professeur ?",
                     radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 0, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: nil, question_type: "application_change_questionnaire", placeholder: nil },
                   { field_type: "radio", name: "change_time_interval", label: "Voulez vous changer d'horaire ?",
                     radio_values: "Oui:true;Non:false", select_target: nil, default_value: nil, order: 1, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: nil, condition: nil, question_type: "application_change_questionnaire", placeholder: nil },
                   { field_type: "select", name: "change_location", label: "Préfèreriez vous un lieu ?", radio_values: nil,
                     select_target: "locations", default_value: nil, order: 2, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: "Indifférent:static_0", condition: nil, question_type: "application_change_questionnaire", placeholder: nil },
                   { field_type: "select", name: "slow_progression_rate_reason", label: "Si non, quels ont été les obstacles ?",
                     radio_values: nil, select_target: nil, default_value: nil, order: 3, is_multiple_select: false, is_required: true, is_level_assignment: false, select_values: "Assiduité:0;Difficulté de compréhension:1;Investissement / engagement:2;Relationnel dans le cours collectif:3;Élève particulièrement engagé et motivé:4;Difficulté de motricité / coordination:5;Ne possède pas d'instrument:6", condition: "was_progression_rate_satisfying=false", question_type: "student_evaluations", placeholder: nil }
                 ])
# =============================================================================

# =============================================================================
EvaluationLevelRef.create!([
                             { value: 0, label: "DEBUTANT", can_continue: false },
                             { value: 1, label: "1 AN", can_continue: false },
                             { value: 2, label: "2 ANS", can_continue: false },
                             { value: 3, label: "3 ANS", can_continue: false },
                             { value: 4, label: "4 ANS", can_continue: false },
                             { value: 5, label: "5 ANS", can_continue: false },
                             { value: 6, label: "6 ANS", can_continue: false },
                             { value: 7, label: "7 ANS", can_continue: false },
                             { value: 8, label: "8 ANS", can_continue: false },
                             { value: 9, label: "9 ANS", can_continue: false }
                           ])

# =============================================================================
PaymentScheduleStatus.create!([
                                { label: "En attente de règlement" },
                                { label: "Réglé" }
                              ])

# =============================================================================

PricingCategory.create!([
                          { name: "Annuel", is_a_pack: false },
                          { name: "Trimestriel", is_a_pack: false },
                          { name: "Mensuel", is_a_pack: false }
                        ])

# =============================================================================

ConsentDocument.create!([
                          { title: "RGPD", expected_answer: true, index: 1, content: "Je consens à ce que mes données personnelles soient utilisées à des fins de traitements associés au fonctionnement de la plateforme comme décrits dans la politique de confidentialité et traitement des données personnelles par {schoolName}" },
                          { title: "Droit à l'image", expected_answer: false, index: 2, content: "J'autorise {schoolName} à utiliser mon image sur ses différents supports de communication (site Internet, formulaires divers, réseaux sociaux, communiqués de presse, newsletters et ce, uniquement dans l'idée de valoriser la pratique musicale." },
                          { title: " Inscription newsletter", expected_answer: false, index: 3, content: "J'autorise {schoolName} à me tenir à jour de son activité par newsletter." }
                        ])

# =============================================================================

#  SEASONS CREATION
year = if DateTime.now.month >= 9
         DateTime.now.year
       else
         DateTime.now.year - 1
       end

previous_season = create_season(year - 1, false)
current_season = create_season(year, true)
next_season = create_season(year + 1, false)

previous_season.next_season_id = current_season.id
previous_season.save!

current_season.next_season_id = next_season.id
current_season.save!

# =============================================================================

# Payment method creation

[PaymentMethod::CASH,
 PaymentMethod::CHECK,
 PaymentMethod::CREDIT_CARD].each { |m| m.update!(show_payment_method_to_user: true) }

# =============================================================================

# =============================================================================
# Create default coupons
percent_off_values = [10, 15, 20, 25, 50]

percent_off_values.each do |percent|
  Coupon.create!(
    label: "Remise de #{percent}%",
    percent_off: percent,
    enabled: true
  )
end
# =============================================================================

Chewy.strategy(:bypass)

Parameter.create!(label: "bank_holidays_zone", value: "metropole", value_type: "string")

# ENSURE adjusted_amount FUNCTION IS PRESENT "
pgr = ActiveRecord::Base.connection.execute <<-SQL
  CREATE OR REPLACE FUNCTION adjusted_amount(op text, amount real) RETURNS REAL AS $$
    BEGIN
      CASE op
        WHEN '-' THEN
          RETURN -1 * amount;
        WHEN '0' THEN
          RETURN 0;
        ELSE
          RETURN amount;
      END CASE;
    END;
  $$ LANGUAGE plpgsql;
SQL