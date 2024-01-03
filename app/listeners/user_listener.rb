require_relative 'base_listener'# frozen_string_literal: true

class UserListener < BaseListener

  def self.subscribe
    event_ids ||= []

    event_ids << EventHandler.user.create.subscribe(true) do |sender:, args:|
      break if args[:controller_params].nil?

      ctr_params = args[:controller_params].as_json

      user = args[:model]

      EventHandler.notification.user_created.trigger(sender: sender, args: args) if ctr_params&.fetch("user", nil)&.fetch("confirm", nil) || ctr_params&.fetch("confirm", nil)

      Adhesions::CreateAdhesion.new(user.id).execute if ctr_params&.fetch("user", nil)&.fetch("adherent")
    end
  end

end
