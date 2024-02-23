# frozen_string_literal: true
require 'zip'

class StudentsController < ApplicationController
  def index
    activity_ids = params[:activity_ids]
    unless activity_ids.is_a?(Array) || activity_ids.nil?
      head :bad_request
      return
    end

    teachers_and_activities = TeachersActivity
                                .where(activity_id: activity_ids)
                                .group_by(&:user_id)

    generate_student_list teachers_and_activities
  end

  def generate_student_list(teachers_and_activities)
    teacher_ids = teachers_and_activities.keys

    if teacher_ids.count == 1
      # Générer un seul PDF pour le professeur
      teacher_id = teacher_ids[0]
      teacher = User.find(teacher_id)
      pdf = generate_pdf_for_teacher(teacher, teachers_and_activities[teacher_id])
      send_data pdf, filename: "liste_élèves_#{teacher.first_name}_#{teacher.last_name}.pdf", type: 'application/pdf'
    else
      # Générer un PDF pour chaque professeur et les zipper
      zip_data = Zip::OutputStream.write_buffer do |zip|
        teachers = User.where(id: teacher_ids)
        teachers.each do |teacher|
          pdf = generate_pdf_for_teacher(teacher, teachers_and_activities[teacher.id])
          zip.put_next_entry "liste_élèves_#{teacher.first_name}_#{teacher.last_name}.pdf"
          zip.write pdf
        end
      end
      zip_data.rewind
      send_data zip_data.read, filename: 'liste_élèves.zip', type: 'application/zip'
    end
  end

  private

  def generate_pdf_for_teacher(teacher, teacher_activities)
    activity_ids = teacher_activities.pluck(:activity_id)

    activities_and_students =
      User.joins(
        students: {
          activity: [
            :activity_ref,
            :time_interval,
            :room
          ] })
          .where('students.activity_id IN (?)', activity_ids)
          .select('
            users.id,
            users.first_name,
            users.last_name,
            students.activity_id,
            activity_refs.label as activity_ref,
            time_intervals.start,
            time_intervals.end,
            rooms.label as room')
          .order('time_intervals.start')
          .group_by { |o| o.activity_id }

    render_to_string(wicked_pdf: {}, pdf: "list_#{teacher.last_name}",
                     encoding: 'utf8',
                     template: 'students/index.html.erb',
                     layout: 'pdf.html.erb',
                     locals: {
                       school: School.first,
                       teacher: teacher,
                       activities_and_students: activities_and_students
                     })
  end

end
