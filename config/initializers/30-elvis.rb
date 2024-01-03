# frozen_string_literal: true

Rails.application.config.after_initialize do
  begin
    MenuGenerator.generate_side_menu
    MenuGenerator.generate_my_menu
  rescue StandardError => e
    pp e
  end

  if ENV["kube_env"] == "start"
    PluginInitJob.perform_later
  else
    PluginInitJob.perform_now
  end
end

