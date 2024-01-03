# == Schema Information
#
# Table name: questions
#
#  id                  :bigint           not null, primary key
#  field_type          :text             default("text")
#  name                :text             default("field")
#  label               :text             default("Form field")
#  radio_values        :text
#  select_target       :text
#  default_value       :text
#  order               :integer
#  is_multiple_select  :boolean          default(FALSE)
#  is_required         :boolean          default(TRUE)
#  is_level_assignment :boolean          default(FALSE)
#  select_values       :string
#  condition           :string
#  question_type       :string           default("student_evaluations")
#  placeholder         :string
#

class Question < ApplicationRecord
    scope :student_evaluation_questions, -> { where(question_type: "student_evaluations") }
    scope :new_student_level_questionnaire, -> { where(question_type: "new_student_level_questionnaire") }
    scope :application_change_questionnaire, -> { where(question_type: "application_change_questionnaire") }

    def self.display_class_name(singular = true)
        singular ? "question" : "questions"
    end

    def self.class_name_gender
        return :F
    end

end
