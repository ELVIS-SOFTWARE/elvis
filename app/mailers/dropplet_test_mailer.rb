# frozen_string_literal: true
require_relative 'liquid_drops/application_drop'
require_relative 'liquid_drops/activity_drop'

class DroppletTestMailer < LayoutMailer

  def droppletTest(user, token, application, activity)
    @application = LiquidDrops::ApplicationDrop.new(application.as_json(include: {user: {}, season: {}}))
    @activity = LiquidDrops::ActivityDrop.new(activity.as_json(include: {activity_ref: {}, teacher: {}, room: {}, time_interval: {}}))
    # @user_drop = DynamicDrop.new(user)

    # puts activity.as_json(include: {activity_ref: {}, teacher: {}, room: {}, time_interval: {}}).awesome_inspect
    # puts "========================================="
    # puts application.as_json(include: {user: {}, season: {}}).awesome_inspect

    mail(to: user.email, subject: "Test Dropplet Liquid")
  end

end
