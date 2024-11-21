module Utils
    def Utils.format_for_suggestion(user, activity, from_date)
        instance = activity.closest_instance(from_date)

        result = activity.as_json(include: {
                                    evaluation_level_ref: {},
                                    teacher: {},
                                    options: {
                                      include: {
                                        desired_activity: {
                                          include: {
                                            activity_application: {
                                              include: :user
                                            }
                                          }
                                        }
                                      }
                                    },
                                    location: {},
                                    #room: {},
                                    time_interval: {
                                      include: :time_interval_preferences
                                    },
                                    activity_ref: { include: [:activity_ref_kind] },
                                    activities_instruments: {
                                      include: :user
                                    }
                                  })

        time_pref = result.dig("time_interval", "time_interval_preferences").find{|tp| tp["user_id"] == user.id}
        result['rank'] = time_pref ?
                           time_pref["rank"] + 1
                           : 0

        result["closest_lesson"] = instance&.time_interval&.start
        result["closest_lesson_end"] = instance&.time_interval&.end

        instance_users = activity.users&.includes({
                                                    levels: {
                                                      activity_ref: :activity_ref_kind,
                                                      evaluation_level_ref: {}
                                                    },
                                                    activity_applications: {
                                                      desired_activities: {}
                                                    }
                                                  })&.to_a || []
        inactive_users_ids = instance&.inactive_students&.pluck(:id)&.to_a || []

        result["users"] = instance_users.filter { |u| !inactive_users_ids.include?(u.id) }.as_json(include: {
                                                               levels: {
                                                                 include: {
                                                                   activity_ref: { include: [:activity_ref_kind] },
                                                                   evaluation_level_ref: {}
                                                                 }
                                                               }
                                                             }) || []
        result["inactive_users"] = instance_users.filter { |u| inactive_users_ids.include?(u.id) }.as_json(include: {
                                                                          activity_applications: {
                                                                            include: {
                                                                              desired_activities: {}
                                                                            }
                                                                          }
                                                                        }) || []

        result
    end
end