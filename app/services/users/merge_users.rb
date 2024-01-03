module Users
  # the second user is merge into the first one, before beeing deleted
  class MergeUsers
    def initialize(first_user, second_user, with_delete: false)
      @first = first_user
      @second= second_user
      @with_delete= with_delete
    end

    def execute
      User.transaction do
        # family
        FamilyMemberUser.where(member_id: @second.id).update_all(member_id: @first.id)
        FamilyMemberUser.where(user_id: @second.id).update_all(user_id: @first.id)
        # activities
        ActivityApplication.where(user_id: @second.id).update_all(user_id: @first.id)
        # preApplication
        PreApplication.where(user_id: @second.id).update_all(user_id: @first.id)
        # payment_schedules & payement
        PaymentSchedule.where(payable_id: @second.id).update_all(payable_id: @first.id)
        Payment.where(payable_id: @second.id).update_all(payable_id: @first.id)
        # time_intervals - planning
        Planning.where(user_id: @second.id).update_all(user_id: @first.id)
        TimeIntervalPreference.where(user_id: @second.id).update_all(user_id: @first.id)
        #adhesion
        Adhesion.where(user_id: @second.id).update_all(user_id: @first.id)
        # teachers_activity_refs
        TeachersActivityRef.where(user_id: @second.id).update_all(user_id: @first.id)
        # teachers_activities
        TeachersActivity.where(user_id: @second.id).update_all(user_id: @first.id)
        # teachers_activity_instances
        TeachersActivityInstance.where(user_id: @second.id).update_all(user_id: @first.id)
        #Students
        Student.where(user_id: @second.id).update_all(user_id: @first.id)
        # EvaluationAppointment
        EvaluationAppointment.where(student_id: @second.id).update_all(student_id: @first.id)
        EvaluationAppointment.where(teacher_id: @second.id).update_all(teacher_id: @first.id)
        # levels
        Level.where(user_id: @second.id).update_all(user_id: @first.id)
        # Adhesion
        Adhesion.where(user_id: @second.id).update_all(user_id: @first.id)
        # hours sheet
        HoursSheet.where(user_id: @second.id).update_all(user_id: @first.id)
        # student attendencies
        StudentAttendance.where(user_id: @second.id).update_all(user_id: @first.id)
        # teacher seasons
        TeacherSeason.where(user_id: @second.id).update_all(user_id: @first.id)
        # student evaluations (student_id & teacher_id)
        StudentEvaluation.where(student_id: @second.id).update_all(student_id: @first.id)
        StudentEvaluation.where(teacher_id: @second.id).update_all(teacher_id: @first.id)
        # NewStudentLevelQuestionnaire
        NewStudentLevelQuestionnaire.where(user_id: @second.id).update_all(user_id: @first.id)
        # application_change_questionnaires
        ApplicationChangeQuestionnaire.where(user_id: @second.id).update_all(user_id: @first.id)
        # users_instruments
        UsersInstrument.where(user_id: @second.id).update_all(user_id: @first.id)

        # DELETE SECOND USER HERE
        Users::DeleteUser.new(@second.id).execute if @with_delete
      end
    end
  end
end
