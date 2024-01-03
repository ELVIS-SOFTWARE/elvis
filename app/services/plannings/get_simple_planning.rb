module Plannings
    class GetSimplePlanning
        def initialize(user, day)
            @user = user
            @day = !day.nil? ? Date.parse(day) : DateTime.now.to_date;
        end

        def execute
            planning = @user.planning
                
            includes = {
              :activity_instance => {
                :activity => [
                  :activity_ref,
                  :room,
                  :teachers,
                  :evaluation_level_ref
                ],
                :room => {},
                :cover_teacher => {}
              },
              :evaluation_appointment => {
                :student => {},
                :activity_ref => {}
              }
            }
      
            json_includes = {
              :include => {
                :activity_instance => {
                  :include => {
                    :activity => {
                      :include => [:activity_ref, :room, :teachers, :evaluation_level_ref],
                    }
                  },
                  :room => {},
                  :cover_teacher => {},
                },
                :evaluation_appointment => {
                  :include => {
                    :student => {
                      only: [:id, :first_name, :last_name]
                    },
                    :activity_ref => {}
                  }
                }
              }
            }
      
            time_intervals = planning.time_intervals
              .includes(includes)
              .where({ start: (@day.beginning_of_week..(@day.end_of_week+1.day)), is_validated: true })

            empty_students = { active: [], inactive: [], options: [] }
            students = @user.is_admin || @user.is_teacher ? Activities::FindStudents.new(time_intervals).execute : nil

            data = time_intervals.reduce({}){ |days, ti|
              wday = ti.start.wday
              days[wday] = [] if days[wday].nil?

              ti_json = ti.as_json(json_includes)

              if ti.kind != "e" && !ti.activity_instance.nil?
                ti_json[:students] =  students.nil? ? empty_students : students[ti.activity_instance.activity_id]
              end    
      
              days[wday] << ti_json
      
              days
            }

            result = { data: data, day: @day.beginning_of_week }

            result
        end
    end
end