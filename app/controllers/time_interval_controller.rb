class TimeIntervalController < ApplicationController
  skip_before_action :verify_authenticity_token, :only => [:delete]
  rescue_from ActiveRecord::RecordInvalid, with: :rescue_from_invalid

  def has_overlap_room
    interval = TimeInterval.new(start: params[:start], end: params[:end])
    # if there is an overlap, we return the time_interval and room that conflict
    render :json => interval.overlap_room(params[:room_id]), adapter: nil
  end

  def has_overlap_teacher
    interval = TimeInterval.new(start: params[:start], end: params[:end])
    # if there is an overlap, we return the time_interval and room that conflict
    render :json => interval.overlap_teacher(params[:teacher_id]), include: {:plannings => { include: [:user]}}, adapter: nil
  end

  def available_appointments_intervals
    render :json => TimeIntervals.available_appointments(Season.find(params[:season_id]))
  end

  def edit_activity_instance
    room = Room.find(params[:interval][:room_id])
    location = Location.find(params[:interval][:location_id])

    activity = Activity.includes(:activity_ref, :users, :location, { time_interval: [ :plannings ] }).find(params[:interval][:activity][:id])
    activity.change_activity_ref(params[:interval][:activityId])
    activity.room = room
    activity.location = location
    activity.change_teachers(params[:interval][:teachers].to_unsafe_h)
  end

  def details
    interval = TimeInterval
      .includes({
          :comment => {},
          :activity_instance => {
            :student_attendances => {
              :user => {},
            },
            :activity => {
              :options => {
                :desired_activity => {
                  :activity_application =>  [:user]
                }
              },
              :activity_ref => {},
              :users => {
                :levels => [:evaluation_level_ref, :activity_ref],
                :activity_refs => {},
                :teachers_activity_refs => {},
                :activity_applications => {
                  :desired_activities => {},
                },
              },
              :room => {},
              :teachers_activities => {
                :teacher => {}
              },
            },
            :room => {},
            :teachers_activity_instances => {
              :teacher => {},
            },
            :cover_teacher => {},
          },
      })
      .find(params[:id])
    
    @interval = interval.as_json include: {
      :comment => {},
      :activity_instance => {
        :include => {
          :activity => {
            :include => {
              :options => {
                :include => {
                  :desired_activity => {
                    :include => {
                      :activity_application => {
                        :include => :user
                      }
                    }
                  }
                }
              },
              :activity_ref => {},
              :users => {
                :include => {
                  :levels => {
                    :include => [:evaluation_level_ref, :activity_ref],
                  },
                  :activity_refs => {},
                  :teachers_activity_refs => {},
                  :activity_application => {
                    :include => {
                      :desired_activities => {},
                    },
                  },
                },
              },
              :room => {},
              :teacher => {},
              :teachers_activities => {
                :include => {
                  :teacher => {},
                },
              },
              :activity_instances => {
                :only => :id,
                :include => :time_interval
              },
            },
          },
          :cover_teacher => {},
          :student_attendances => {
            :include => {
              :user => {}
            }
          },
          :room => {},
          :teachers_activity_instances => {
            :include => {
              :teacher => {},
            },
          },
        },
        :methods => [:potential_covering_teachers, :inactive_students],
      },
    }

    render json: @interval
  end

  def delete
    begin
      time_interval = TimeInterval.find(params[:id])

      if !current_user.is_admin? && time_interval.is_validated
        raise IntervalTakenError, "err_interval_validated"
      end

      time_interval.destroy

      render json: { id: time_interval.id }, status: :ok
    rescue IntervalTakenError => e
      render json: { errors: ["err_interval_not_found"] }, status: :bad_request
    rescue ActiveRecord::RecordNotFound => e
      render json: { errors: ["err_interval_not_found"] }, status: :not_found
    end
  end

  def check_conflicts_mass_update
    season = Season.current
    time_interval = TimeInterval.find(params[:time_interval_id])
    instance = ActivityInstance.find(params[:instance_id])

    new_time_intervals = time_interval.generate_for_rest_of_season.select { |i| i[:start] != time_interval.start || i[:end] != time_interval.end }

    results = { conflicts: [], success: 0}
    new_time_intervals.each do |interval|
      ti = TimeInterval.new(start: interval[:start], end: interval[:end])
      ti.change_start_and_end(interval[:start], interval[:end])

      # Here we only want to know if there is a conflict
      if (conflict_type = ti.check_for_conflict(instance.teacher, instance.room))
        results[:conflicts] << conflict_type
      else
        results[:success] += 1
      end
    end

    render :json => results.to_json
  end

  # Paramètres :
  # - { activity :
  #  * availabilityTimeIntervalId
  #  * teachers
  #  * activityRefId
  #  * roomId
  #  * groupName
  #  * startTime
  #  * endTime 
  #    }
  # - { activityInstances [] 
  #  * start
  #  * end
  # } 

  def create_activity_instances
    availability = TimeInterval.includes(
        :time_slots, 
        :plannings,
      ).find(params[:activity][:availabilityTimeIntervalId])

    intervals = []
    teacher_id = params[:activity][:teachers].to_unsafe_h.key(true)
    
    Activity.transaction do
      interval = availability.deep_clone
      
      activity_ref = ActivityRef.find(params[:activity][:activityRefId])
      room = Room.find(params[:activity][:roomId])
      location = room.location

      activity = Activity.create!(
        time_interval: interval,
        activity_ref: activity_ref,
        room: room,
        location: location,
        instruments: activity_ref.instruments, # instantiates ref's template positions
      )
      activity.add_teacher(teacher_id, true)

      # NOTE Pourquoi fait-on un reload ici ?
      # Il y avait un problème de synchro de données avec la base
      activity.teachers_activities.reload

      # Mise-à-Jour de l'interval
      # (possibilité de changement entre l'intervale de départ(dispo) et la création(activité))
      interval.activity = activity
      interval.is_validated = true
      interval.kind = "c"
      interval.start = params[:activity][:startTime]
      interval.end = params[:activity][:endTime]
      interval.save

      # Création des instances de l'activité et des time interval correspondant
      intervals = activity.create_instances(params[:activityInstances].map{ |i| {
        start: DateTime.parse(i[:start]),
        end: DateTime.parse(i[:end]),
      } })

      if intervals.select{ |i| i.start == availability.start && i.end == availability.end }.any?
        availability.destroy!
      else
        # front end assumes availability will be deleted
        # give it back if it isn't supposed to be deleted
        intervals << availability
      end
    end

    Activities::AssignGroupsNames
      .new(User.find(teacher_id), Season.from_interval(availability).first)
      .execute

    render :json => intervals, each_serializer: TimeIntervalSerializer
  end

  private
  def rescue_from_invalid(exception)
    render :json => { :errors => exception.record.errors[:base] }, status: 400
  end
end
