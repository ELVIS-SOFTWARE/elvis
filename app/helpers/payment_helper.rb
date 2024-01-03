# frozen_string_literal: true

module PaymentHelper

  def self.generate_payer_payment_summary_data(user, season)
    family = (user.whole_family(season.id) << user).uniq

    desired_activities = family.first&.get_desired_activities_for_family(season)
    students = family.map { |u| u.get_list_of_activities(season) }.flatten.uniq

    data = []

    students.each do |student|
      activity = student.activity
      desired  = desired_activities.find { |da| da.activity_id == activity.id && da.activity_application.user_id == user.id }

      next unless desired

      activity_nb_lesson = activity.intended_nb_lessons
      price_association  = activity.activity_ref.activity_ref_pricing.find do |act_s_p|
        act_s_p.pricing_id == desired.pricing_id && act_s_p.season_id == season.id
      end

      amount = 0

      if price_association&.price
        amount = ((price_association.price / activity_nb_lesson) * (desired.prorata || activity_nb_lesson)).round(2)
      end

      data << {
        id: desired.id,
        activity: "#{activity.activity_ref.label} (#{activity.activity_ref.kind})",
        prorata: desired.prorata,
        user_full_name: user.full_name,
        amount: amount || 0,
        intended_nb_lessons: activity_nb_lesson,
        type: :des
      }

    end

    if Adhesion.enabled
      users = students.map(&:user)
      adhesion_objects = users.map(&:adhesions).flatten.filter { |ad| ad.season_id == season.id }.uniq(&:id)

      adhesion_objects.each do |adhesion|
        user = users.find { |u| u.id == adhesion.user_id }

        next if user.nil?

        adhesion_price = adhesion.adhesion_price

        if adhesion_price
          data << {
            id: adhesion.id,
            activity: "Adhésion de #{user.first_name} #{user.last_name}",
            amount: adhesion_price.price || 0,
            user_full_name: user.full_name,
            type: :adh
          }
        end
      end
    end

    data
  end

end
