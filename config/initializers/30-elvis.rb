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

    unless Parameter.find_by(label: "app.cache.enabled")
      Parameter.create(label: "app.cache.enabled", value: "false", value_type: "boolean")
    end

    unless Parameter.find_by(label: "app.cache.default_duration")
      Parameter.create(label: "app.cache.default_duration", value: "5.minutes", value_type: "duration")
    end

    unless Parameter.find_by(label: "app.cache.max_price.duration")
      Parameter.create(label: "app.cache.max_price.duration", value: "5.minutes", value_type: "duration")
    end
  rescue ActiveRecord::NoDatabaseError => e
    # ignore this error for init script
  rescue StandardError => e
    pp e
  end
end

