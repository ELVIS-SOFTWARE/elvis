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

  begin
    unless Parameter.find_by(label: "app.clean_big_tables.max_nb_lines")
      Parameter.create(label: "app.clean_big_tables.max_nb_lines", value: "300000", value_type: "int")
    end

    unless Parameter.find_by(label: "app.clean_big_tables.tables_to_clean")
      Parameter.create(label: "app.clean_big_tables.tables_to_clean", value: "event_store_events,error_histories", value_type: "string")
    end
  rescue ActiveRecord::NoDatabaseError => e
    # ignore this error for init script
  rescue StandardError => e
    pp e
  end
end

