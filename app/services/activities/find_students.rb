module Activities
    class FindStudents
        def initialize(time_intervals)
            @time_intervals = time_intervals
                .select{ |ti| !ti.activity_instance.nil? }
                .index_by{ |ti| ti.activity_instance.activity_id }
        end

        def execute
            activity_ids = @time_intervals.keys
            
            # Map students by activity
            activities = Activity.includes(:users, :options => { :desired_activity => :user }).where(id: activity_ids)
            activity_students = activities.reduce({}){ |h, activity|
                h[activity.id] = activity.users
                
                h
            }
            activity_options = activities.reduce({}){ |h, activity|
                h[activity.id] = activity.options
                    .map{ |opt| opt.desired_activity.user }
                    .compact

                h
            }

            # Map applications by users
            applications = ActivityApplication
                .joins(:desired_activities)
                .where({ user: activity_students.values.flatten,  desired_activities: { activity_id: activity_ids } })
                .index_by(&:user_id)

            result = {}
            activity_students.each do |activity_id, students|
                result[activity_id] = {}

                level_includes = {
                    :include => {
                        :levels => {
                            :include => :evaluation_level_ref,
                        }
                    },
                    except: %i[authentication_token]
                }

                # Inactives
                result[activity_id][:inactive] = (students.select{ |s|
                    application = applications[s.id]
                    lesson_time = @time_intervals[activity_id].start

                    is_inactive = application.nil? || (!application.stopped_at.nil? && application.stopped_at <= lesson_time) || (application.begin_at > lesson_time)

                    is_inactive
                }).as_json(level_includes)

                # Actives
                result[activity_id][:active] = (students - result[activity_id][:inactive]).as_json(level_includes)

                # Options
                result[activity_id][:options] = (activity_options[activity_id].as_json(level_includes) - result[activity_id][:active]).as_json(level_includes)
            end
            
            result
        end
    end
end