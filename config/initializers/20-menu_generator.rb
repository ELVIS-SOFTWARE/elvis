module MenuGenerator
  def self.generate_menus
    generate_side_menu
    generate_my_menu
  end

  def self.generate_side_menu
    Elvis::MenuManager.add_menu :side_menu

    if Plugin.visible.any? && !Elvis::MenuManager.plugin_item?
      parent_menu = Elvis::MenuManager::MenuItem.new(
        :plugins,
        "plugins",
        "index",
        { caption: "Plugins", icon:"fa-puzzle-piece", user_role:"admin", position: 8 }
      )

      Elvis::MenuManager.insert_menu_item :side_menu, parent_menu
    end

    #admin menu

    users = Elvis::MenuManager::MenuItem.new(
      :users,
      "users",
      "index",
      { caption: "Utilisateurs", icon: "fa-user-friends", user_role: "admin", position: 0 }
    )

    inscriptions = Elvis::MenuManager::MenuItem.new(
      :inscriptions,
      "inscriptions",
      "",
      { caption: "Inscriptions", icon: "fa-table", user_role: "admin", position: 1 }
    )
    inscriptions.add(Elvis::MenuManager::MenuItem.new(
      :adherents,
      "adhesion",
      "index",
      { caption: "Adhésions" }
    ))
    inscriptions.add(Elvis::MenuManager::MenuItem.new(
      :activities_applications,
      "activities_applications",
      "index",
      { caption: "Demandes d'inscription" }
    ))

    inscriptions.add(Elvis::MenuManager::MenuItem.new(
      :monitor_students,
      "packs",
      "index",
      { caption: "Packs", icon: "fa-user-graduate", user_role: "admin" }
    ))
    inscriptions.add(Elvis::MenuManager::MenuItem.new(
      :new_activities_applications,
      "activities_applications",
      "new",
      { caption: "Nouvelle inscription" }
    ))
    inscriptions.add(Elvis::MenuManager::MenuItem.new(
      :status_activities_applications,
      "parameters/activity_application_parameters",
      "index",
      { caption: "Paramétrage" }
    ))

    plannings = Elvis::MenuManager::MenuItem.new(
      :plannings,
      "plannings",
      "",
      { caption: "Plannings", icon: "fa-calendar", user_role: "admin", position: 2 }
    )

    #----------------------------------------------------------------------------------------

    plannings.add(Elvis::MenuManager::MenuItem.new(
      :admin_presence_sheet,
      "users",
      "presence_sheet",
      { caption: "Présences", icon: "fa-check", user_role: "teacher", position: 1 }
    ) do
      { id: current_user&.id, date: Date.today.strftime("%F") }
    end)

    #----------------------------------------------------------------------------------------


    plannings.add(Elvis::MenuManager::MenuItem.new(
      :seasons,
      "seasons",
      "index",
      { caption: "Gestion des saisons" }
    ))
    plannings.add(Elvis::MenuManager::MenuItem.new(
      :activity,
      "activity",
      "index",
      { caption: "Liste des cours" }
    ))
    plannings.add(Elvis::MenuManager::MenuItem.new(
      :planning_teachers,
      "planning",
      "index_for_teachers",
      { caption: "Professeurs" }
    ))
    plannings.add(Elvis::MenuManager::MenuItem.new(
      :planning_rooms,
      "planning",
      "index_for_rooms",
      { caption: "Salles de cours" }
    ))
    plannings.add(Elvis::MenuManager::MenuItem.new(
      :scripts,
      "scripts",
      "replicate_week_activities",
      { caption: "Répliquer des cours" }
    ))
    plannings.add(Elvis::MenuManager::MenuItem.new(
      :planning_parameters,
      "parameters/planning_parameters",
      "index",
      { caption: "Paramétrage" }
    ))

    payments = Elvis::MenuManager::MenuItem.new(
      :payments,
      "payments",
      "",
      { caption: "Paiements", icon: "fa-euro-sign", user_role: "admin", position: 3 }
    )
    payments.add(Elvis::MenuManager::MenuItem.new(
      :payment,
      "payments",
      "index",
      { caption: "Paiements" }
    ))
    payments.add(Elvis::MenuManager::MenuItem.new(
      :payments_parameters,
      "parameters/payments_parameters",
      "index",
      { caption: "Paramétrage" }
    ))

    locations = Elvis::MenuManager::MenuItem.new(
      :rooms,
      "parameters/rooms_parameters",
      "index",
      { caption: "Salles et sites", icon: "fa-calendar", user_role: "admin", position: 4 }
    )

    activities = Elvis::MenuManager::MenuItem.new(
      :activities,
      "activities",
      "",
      { caption: "Activités musicales", icon: "fa-music", user_role: "admin", position: 5 }
    )
    activities.add(Elvis::MenuManager::MenuItem.new(
      :activity_ref_kind,
      "activity_ref_kind",
      "index",
      { caption: "Famille d'activités" }
    ))
    activities.add(Elvis::MenuManager::MenuItem.new(
      :instruments,
      "instruments",
      "index",
      { caption: "Instruments" }
    ))
    activities.add(Elvis::MenuManager::MenuItem.new(
      :activity_ref,
      "activity_ref",
      "index",
      { caption: "Activités" }
    ))
    activities.add(Elvis::MenuManager::MenuItem.new(
      :formule,
      "formules",
      "index",
      { caption: "Formules" }
    ))

    evaluations = Elvis::MenuManager::MenuItem.new(
      :evaluations,
      "evaluations",
      "",
      { caption: "Évaluation", icon: "fa-graduation-cap", user_role: "admin", position: 6 }
    )
    evaluations.add(Elvis::MenuManager::MenuItem.new(
      :student_evaluations_stats,
      "student_evaluations_stats",
      "stats",
      { caption: "Synthèse des évaluations" }
    ))
    evaluations.add(Elvis::MenuManager::MenuItem.new(
      :evaluation_appointments,
      "evaluation_appointments",
      "index",
      { caption: "Gestion des évaluations" }
    ))
    evaluations.add(Elvis::MenuManager::MenuItem.new(
      :evaluation_appointments_incomplete,
      "evaluation_appointments",
      "incomplete",
      { caption: "Élèves sans crénaux" }
    ))
    evaluations.add(Elvis::MenuManager::MenuItem.new(
      :evaluation_parameters,
      "parameters/evaluation_parameters",
      "index",
      { caption: "Paramètre" }
    ))

    parameters = Elvis::MenuManager::MenuItem.new(
      :parameters,
      "parameters",
      "index",
      { caption: "Paramètres", icon: "fa-cog", user_role: "admin", position: 10 }
    )


    Elvis::MenuManager.insert_menu_item :side_menu, users
    Elvis::MenuManager.insert_menu_item :side_menu, inscriptions
    Elvis::MenuManager.insert_menu_item :side_menu, plannings
    Elvis::MenuManager.insert_menu_item :side_menu, payments
    Elvis::MenuManager.insert_menu_item :side_menu, locations
    Elvis::MenuManager.insert_menu_item :side_menu, activities
    Elvis::MenuManager.insert_menu_item :side_menu, evaluations
    Elvis::MenuManager.insert_menu_item :side_menu, parameters

    #teacher menu
    planning = Elvis::MenuManager::MenuItem.new(
      :planning,
      "planning",
      "show_simple",
      { caption: "Mon planning", icon: "fa-calendar", user_role: "!!teacher", position: 0 }
    )

    teacher_inscriptions = Elvis::MenuManager::MenuItem.new(
      :teachers_activities_applications,
      "activities_applications",
      "index",
      { caption: "Demandes d'inscription", icon: "fa-table", user_role: "!!teacher", position: 1 }
    )

    attendences = Elvis::MenuManager::MenuItem.new(
      :users,
      "users",
      "presence_sheet",
      { caption: "Présences", icon: "fa-check", user_role: "!!teacher", position: 2 }
    ) do
      { id: current_user&.id, date: Date.today.strftime("%F") }
    end

    disponibility = Elvis::MenuManager::MenuItem.new(
      :plannings,
      "planning",
      "show_availabilities",
      { caption: "Mes disponibilités", icon: "fa-calendar-check", user_role: "!!teacher", position: 3 }
    )

    evaluation = Elvis::MenuManager::MenuItem.new(
      :evaluations,
      "users",
      "season_activities",
      { caption: "Mes évaluations", icon: "fa-graduation-cap", user_role: "!!teacher", position: 4 }
    ) do
      { id: current_user&.id }
    end


    planning_simulation = Elvis::MenuManager::MenuItem.new(
      :planning_simulation,
      "users",
      "previsional_groups",
      { caption: "Simulation de planning", icon: "fa-users", user_role: "!!teacher", position: 5 }
    ) do
      { id: current_user&.id }
    end


    Elvis::MenuManager.prepend_menu_item :side_menu, planning
    Elvis::MenuManager.prepend_menu_item :side_menu, teacher_inscriptions if Parameter.get_value("activity_applications.authorize_teachers", default: false)
    Elvis::MenuManager.prepend_menu_item :side_menu, attendences
    Elvis::MenuManager.prepend_menu_item :side_menu, disponibility
    Elvis::MenuManager.prepend_menu_item :side_menu, evaluation
    Elvis::MenuManager.prepend_menu_item :side_menu, planning_simulation

    # User menu

    homepage = Elvis::MenuManager::MenuItem.new(
      :user_homepage,
      "my_activities",
      "show",
      { caption: "Accueil", icon: "fa-home", user_role: "simple", position: 1 },
      ) do
      { id: current_user&.id }
    end

    applications = Elvis::MenuManager::MenuItem.new(
      :user_applications,
      "users",
      "new_application",
      { caption: "Mes demandes d'inscription", icon: "fa-table", user_role: "simple", position: 2 },
      ) do
      { id: current_user&.id }
    end

    Elvis::MenuManager.prepend_menu_item :side_menu, applications
    Elvis::MenuManager.prepend_menu_item :side_menu, homepage
  end

  def self.generate_my_menu
    Elvis::MenuManager.add_menu :my_menu

    my_profile = Elvis::MenuManager::MenuItem.new(
      :my_profile,
      "users",
      "show",
      { caption: "Mon profil", icon: "fa-user", position: 1 }
    ) do
      { id: current_user&.id }
    end

    divider = Elvis::MenuManager::MenuItem.new(
      :divider,
      "",
      "",
      { user_role: "admin" }
    )

    disconnect = Elvis::MenuManager::MenuItem.new(
      :disconnect,
      "sessions",
      "destroy",
      { caption: "Se déconnecter", icon:"fa-sign-out-alt", position: 100, a_options: { "data-method": "delete" } }
    )


    Elvis::MenuManager.insert_menu_item :my_menu, my_profile
    Elvis::MenuManager.insert_menu_item :my_menu, divider
    Elvis::MenuManager.insert_menu_item :my_menu, disconnect

  end

  def self.regenerate_menus
    Elvis::MenuManager.clear_menus

    generate_side_menu
    generate_my_menu

    Plugin.where.not(activated_at: nil).each do |plugin|
      config_file = File.read(File.join(plugin.absolute_path, "config", "config.json"))
      config = JSON.parse(config_file)

      plugin.register_settings(config["settings"]) if plugin.configurable?

      menus = if Module.const_defined?(plugin.name.camelcase) && (plugin_module = Module.const_get(plugin.name.camelcase)) && plugin_module.respond_to?(:menu_is_to_add?)
                config["menus"].filter { |m| plugin_module.menu_is_to_add?(m) }
              else
                config["menus"]
              end

      # inscription des menus du plugin
      Plugin.register_menus(menus)
    end
  end
end
