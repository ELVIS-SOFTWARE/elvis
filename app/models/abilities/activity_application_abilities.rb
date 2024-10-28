# frozen_string_literal: true

module Abilities
  class ActivityApplicationAbilities
    class << self

      # define the abilities to a teacher to edit assigned activity applications
      # only for the current opened season
      # @param [CanCan::Ability] ability
      # @param [User] teacher
      def teacher_can_edit_assigned_for_current_season(ability, teacher)

        # cached for a very short time => cache opnly for multiple call in the same request
        user_activity_ref_ids = Elvis::CacheUtils.cache_block_if_enabled("user_activity_ref_ids_#{teacher.id}", expires_in: 1.minutes) do
          teacher.activity_refs.pluck(:id)
        end

        ability.can [:read, :edit], ActivityApplication, true do |activity_application|
          false if activity_application.season_id != Season.current_apps_season.id

          is_activity_application_concern_any_activity_ref?(activity_application, user_activity_ref_ids)
        end

      end

      def is_activity_application_concern_any_activity_ref?(activity_application, user_activity_ref_ids)
        desired_activity_activity_ref_ids = Elvis::CacheUtils.cache_block_if_enabled("desired_activity_activity_ref_ids_#{activity_application.id}") do
          activity_application.desired_activities.pluck(:activity_ref_id)
        end

        desired_activity_activity_ref_ids.any? { |daarid| user_activity_ref_ids.any? {|aid| aid == daarid } }
      end
    end
  end
end
