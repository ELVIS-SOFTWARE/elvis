# == Route Map

require "token_endpoint"

Rails.application.routes.draw do
  # ===================
  # PLUGINS (at start for override app routes)
  # ===================

  get "/plugins", to: "plugins#index"
  post "/plugins", to: "plugins#changed"

  match 'settings/:name', :controller => 'settings', :action => 'plugin', :via => [:get, :post], :as => 'plugin_settings'

  # ===================
  # FIN PLUGINS
  # ===================

  get "/ping", to: "ping#index"
  get "debug", to: "debug#index"
  post "send_mail", to: "debug#send_mail"
  namespace :parameters do
    get "activity_application_parameters", to: "activity_application_parameters#index"
    post "activity_application_parameters/list_status", to: "activity_application_parameters#list_status"

    get "activity_application_parameters/get_application_step_parameters", to: "activity_application_parameters#get_application_step_parameters"
    post "activity_application_parameters/change_activated_param", to: "activity_application_parameters#change_activated_param"
    post "activity_application_parameters/change_display_text_param", to: "activity_application_parameters#change_display_text_param"

    get "community_parameters", to: "community_parameters#index"

    get "payment_parameters", to: "payments_parameters#index"
    post "payment_parameters/list_status", to: "payments_parameters#list_payments_status"
    post "payment_parameters/list_methods", to: "payments_parameters#list_payments_methods"
    post "payment_parameters/show_adhesion", to: "payments_parameters#show_adhesion"
    post "payment_parameters/update_adhesion", to: "payments_parameters#update_adhesion"

    get "rooms_parameters", to: "rooms_parameters#index"
    post "rooms_parameters/list", to: "rooms_parameters#list"

    get "practice_parameters", to: "pratice_parameters#index"
    post "practice_parameters/list_bands", to: "pratice_parameters#list_bands"
    post "practice_parameters/list_band_types", to: "pratice_parameters#list_band_type"
    post "practice_parameters/list_music_genres", to: "pratice_parameters#list_music_genre"
    post "practice_parameters/list_materials", to: "pratice_parameters#list_materials"
    post "practice_parameters/list_flat_rates", to: "pratice_parameters#list_flat_rates"
    post "practice_parameters/list_features", to: "pratice_parameters#list_features"
    post "practice_parameters/list_instruments", to: "pratice_parameters#list_instruments"

    get "evaluations_parameters", to: "evaluation_parameters#index"
    post "evaluations_parameters/list_levels", to: "evaluation_parameters#list_levels"

    get "planning_parameters", to: "planning_parameters#index"
    post "planning_parameters", to: "planning_parameters#update"

    get "hours_before_cancelling_activity", to: "planning_parameters#get_hours_before_cancelling_activity"
    post "hours_before_cancelling_activity", to: "planning_parameters#save_hours_before_cancelling_activity"

    get "activities_parameters", to: "activities_parameters#index"
  end
  devise_for :users,
             controllers: { sessions: "sessions", registrations: "registrations", confirmations: "confirmations", passwords: "passwords" }, path: "u"
  devise_scope :user do
    get "/sign_up" => "registrations#new"
    patch "/confirm" => "confirmations#confirm"
    get "/confirm" => "confirmations#confirm"
    get "/pick_user/:id" => "sessions#pick_user"
    post "/user_picked" => "sessions#user_picked"
    get "/u/sign_in_with_token" => "sessions#create_with_token"
  end

  namespace :oidc do
    get ".well-known/:id", to: "discovery#show"
    get "jwks.json", to: proc { |_env|
      [200, { "Content-Type" => "application/json" }, [{ keys: OidcIdToken.config[:jwk_set] }.to_json]]
    }
    post "access_tokens", to: proc { |env| TokenEndpoint.new.call(env) }
    match "user_info", to: "user_info#show", via: %i[get post]
    resources :authorizations, only: %i[new create]
  end

  namespace :practice do
    resources :bands
    resources :band_types
    resources :music_genres
    resources :materials
    resources :flat_rates
    resources :planning
    resources :sessions
    resources :rooms
    resources :room_features
  end

  authenticated :user do
    #  We use a custom controller action to route based on ability,
    # An admin doesn't have the same home than a mere user.
    root "users#current_user_root", as: :authenticated_root
  end

  resources :activities_applications, path: "inscriptions"
  post "/inscriptions/create_import_csv", to: "activities_applications#create_import_csv"
  
  get "/get_activity_application_parameters", to: "activities_applications#get_activity_application_parameters"
  post "/set_activity_application_parameters", to: "activities_applications#set_activity_application_parameters"

  # ==================
  # COUPONS
  # ==================
  resources :coupons
  post "/coupons/list", to: "coupons#list"

  # ==================
  # DISCOUNTS
  # ==================
  post "/discounts/upsert", to: "discount#upsert"
  delete "/discounts", to: "discount#destroy"


  # =====================
  # HOURS SHEETS
  # =====================
  get "users/:id/hours_sheet", to: "users#hours_sheet"
  get "users/:id/hours_sheet/:year-:month", to: "users#get_hours_sheet"

  #  =====================
  # ADHESIONS
  #  =====================
  get "adhesions", to: "adhesion#index"
  post "adhesions/list", to: "adhesion#list"
  get "adhesions/update_date_unsafe", to: "adhesion#set_validity_dates"
  post "adhesions/:id/update_adhesion_pricing", to: "adhesion#update_adhesion_pricing"
  post "adhesions/:id/reminder", to: "adhesion#reminder"

  #  =====================
  # SEASONS
  #  =====================
  resources "seasons"
  get "/seasons", to:"seasons#index"
  get "season/weeks", to: "seasons#get_season_weeks"
  get "season/evaluation/weeks", to: "seasons#get_evaluation_weeks"
  get "/seasons/:id/available_evaluation_intervals/:activity_ref_id", to: "seasons#available_evaluation_intervals"
  post "/season/:id/holidays", to: "seasons#create_holidays"
  delete "/season/:id/holidays", to: "seasons#delete_holidays"
  post "/season/:id/fetch_holidays", to: "seasons#fetch_holidays"
  post "/season/:id/make_active", to: "seasons#make_active", as: "make_active_season"

  #  =====================
  # SEARCH
  #  =====================
  post "omnisearch", to: "search#index"
  #get "/recherche_avancee", to: "search#advanced_search", as: "advanced_search"
  post "/advanced_query", to: "search#advanced_search_query"
  get "/indexation", to: "search#indexation"

  #  =====================
  # ACTIVITY APPLICATIONS
  #  =====================
  get "/applications/:id/desired_activities/:des_id/suggestions", to: "activities_applications#find_activity_suggestions"

  # (pour élève/admin) pour un élève déjà inscrit et possédant une préinscription, renvoie vers le Wizard
  get "/inscriptions/new/:user_id/:pre_application_activity_id/:activity_ref_id(/:action_type)",
      to: "activities_applications#new_for_existing_user"

  patch "/inscriptions/:id/add_activity/:activity_ref_id", to: "activities_applications#add_activity"
  delete "/inscriptions/:id/add_activity/:activity_ref_id", to: "activities_applications#remove_activity"
  patch "/inscriptions/:id/add_activities", to: "activities_applications#add_activities"
  post "/inscriptions/list", to: "activities_applications#list"
  post "/inscriptions/bulk", to: "activities_applications#bulk_update"
  delete "/inscriptions", to: "activities_applications#bulk_delete"

  post "/inscriptions/:id/comment", to: "activities_applications#add_comment"
  patch "/inscriptions/:id/comment/edit/:comment_id", to: "activities_applications#edit_comment"

  post "/inscriptions/:id/send_confirmation_mail", to: "activities_applications#send_confirmation_mail"
  post "/inscriptions/send_all_confirmation_mail", to: "activities_applications#send_all_confirmation_mail"

  # (pour admin ??) mise à jour du statut de la préinscription
  patch "/pre_application/:id/process", to: "pre_application_activities#update"

  # (pour élèves) demande d'inscription pour renouveler l'activité
  post "/pre_application/:user_id/renew", to: "activities_applications#renew"

  # (pour admin) lister les demandes d'arrêt de préinscription - utilisé par le composant StopList, appelé par un clic sur le bouton "liste des arrêts" dans la page "Demandes d'inscription"
  get "/pre_application_activities/stop", to: "pre_application_activities#list_stop"

  # (pour admin) vérifier si une préinscription existe - utilisé par un composant qui n'était pas utilisé jusqu'à présent (AddPreAppFromStopApp), pour présinscrire qqun qui avait choisi d'arrêter en cours d'année
  post "/pre_application_activities/exist", to: "pre_application_activities#exist"
  # (pour admin) créer une préinscription à partir d'une activité - utilisé par un composant qui n'était pas utilisé jusqu'à présent (AddPreAppFromStopApp), pour présinscrire qqun qui avait choisi d'arrêter en cours d'année
  patch "/pre_application_activities/create_from_activity", to: "pre_application_activities#create_from_activity"

  get "/time_interval_preferences/:season_id/:activity_ref_id",
      to: "time_interval_preferences#show_available_activities"

  resources "activity_application_statuses"

  #  ===================
  # USERS
  #  ===================
  get "/teachers/index", as: "teachers"
  # get "/teachers/index_with_overlap", to: "teachers#index_with_overlap"
  get "/teachers/:id/with_overlap", to: "teachers#show_with_overlap"
  get "teachers/:id/activities", to: "teachers#list_activities"
  delete "teachers/:id/activity_instances", to: "teachers#delete_upcoming_activity_instances"
  get "/users/adherent_card", to: "users#adherent_card"
  get "/users/:id/adherent_card", to: "users#adherent_card"
  get "/users/:id/presence_sheet/:date", to: "users#presence_sheet", as: "presence_sheet"
  get "/users/:id/applications", to: "users#applications"
  get "/users/payments", to: "user_payments#show_for_current", as: :user_payments_for_current
  put "/users/:id/attach", to: "users#attach_users"
  delete "/users/:id/detach", to: "users#detach_user"
  resources :users
  put "/users/:id/update_family", to: "users#update_family"

  post "/users/resend_confirmation", to: "users#resend_confirmation"
  post "/users/reset_password", to: "users#reset_password"

  get "/u/first_login", to: "users#first_login", as: "welcome"
  patch "/u/update_email", to: "users#update_email", as: "update_email"
  get "/u/edit_password", to: "users#edit_password", as: "edit_password"
  patch "/u/update_password", to: "users#update_password", as: "update_password"

  get "/users/:id/infos", to: "users#infos"
  post "/users/exist", to: "users#exist"
  post "/users/payment_schedules", to: "users#list_schedules"
  get "/users/role/:role", to: "users#index", as: "users_display"
  get "/users/:id/activities", to: "users#edit_activities", as: "edit_user_activities"
  get "/users/:id/season_activities", to: "users#season_activities", as: "user_season_activities"
  get "/users/:id/activity/:activity_id/evaluate", to: "users#evaluate"
  patch "/users/:id/activities", to: "users#update_activities"
  patch "/users/:id/change_address", to: "users#change_address"
  patch "/users/:id/unlink_address", to: "users#unlink_address"
  get "/users/:id/get_addresses", to: "users#get_addresses"
  post "/users/search", to: "users#search_for_user"
  post "/users/search_for_admin", to: "users#search_for_admin"
  post "/users/:id/family_links_with_user", to: "users#get_family_links_with_user"
  post "/users/list", to: "users#list"
  get "/users/:user_id/family", to: "users#family"
   # Utilisé pour peupler un select
  post "/users/simple_list", to: "users#simple_list"
  post "/users/:id/absences_list", to: "users#list_abscences"

  get "users/:id/all_doc_consented", to: "users#all_doc_consented"

  # delete "/users/:id/members/:member_id", to: "family_member_users#destroy"
  delete "/members/:id", to: "family_member_users#destroy"

  post "/users/:id/upload_avatar", to: "users#upload_avatar"

  get "/update_family_members_unsafe", to: "family_members#update_all"

  # (pour élèves/admin) page de demande d'inscription pour la saison prochaine (renouveler/arrêter les activités actuelles + nouvelles activités)
  get "/new_application/:id", to: "users#new_application", as: "new_application"
  get "/create_account/:id", to: "users#create_account"
  patch "/save_new_account/:id", to: "users#save_new_account"
  get "/teachers/:id/previsional_groups", to: "users#previsional_groups", as: :previsional_groups

  post "/users/:id/levels", to: "users#set_level"
  delete "/users/:id/levels/:season_id/:activity_ref_id", to: "users#delete_level"

  post "/users/createStudent", to: "users#createStudent"

  #  ===================
  # ADHESIONS
  #  ===================
  get "/adhesion/new", to: "adhesion#new"
  delete "/adhesions/:id", to: "adhesion#destroy"
  post "/adhesions", to: "adhesion#create"

  # ===================
  # PAYMENTS MANAGEMENT
  # ===================
  get "/payment_schedule", to: "payment_schedule#index"
  get "/payments/summary/:id", to: "payments#show", as: :payment_summary
  get "/payments/failed_imports", to: "failed_payment_imports#index"
  get "/payments/failed_imports/create_reasons", to: "failed_payment_imports#create_reasons"
  delete "/payments/failed_imports/many", to: "failed_payment_imports#bulkdelete"
  delete "/payments/failed_imports/reason/:reasonId", to: "failed_payment_imports#bulkdelete_by_reason"
  post "/payments/edit_status", to: "payments#edit_status"
  post "/payments/failed_imports/import_single", to: "failed_payment_imports#import_single"

  delete "/payments/failed_imports/delete", to: "failed_payment_imports#delete"
  delete "/payments/bulkdelete", to: "payments#bulkdelete"
  get "/payments/export", to: "payments#export_selected"
  resources :payments
  post "/payments/list", "payments#list"
  post "/payments/checklist", "payments#checklist"
  post "/payments/check_status", "payments#check_status"

  resources :payment_schedule
  patch "/payment_schedules/location", to: "payment_schedule#change_location"
  post "/payments/frequency", to: "payments#update_frequency"
  patch "/payments/location/:id/:location", to: "payments#update_location"
  post "/payments/method", to: "payments#update_method"
  post "/payments/bulkedit", to: "payments#bulkedit"
  post "/payments/import_file", to: "payments#import_file"
  post "/payments/send_reglement_mail", to: "payments#send_reglement_mail"

  post "/due_payments", to: "due_payment#create"
  post "/due_payments/bulkedit/:mode", to: "due_payment#bulkedit"
  delete "/due_payments/bulkdelete", to: "due_payment#bulkdelete"
  post "/due_payments/list", to: "due_payment#list"
  post "/due_payments/edit_status", to: "due_payment#edit_status"
  get "/due_payments/renumber", to: "due_payment#renumber"
  patch "/due_payments/:id", to: "due_payment#update"
  delete "/due_payment/:id", to: "due_payment#destroy"
  get "/due_payments/export", to: "due_payment#export_selected"
  post "/due_payments/send_payment_mail", to: "due_payment#send_payment_mail"



  post "/payments/schedule", to: "payment_schedule#create"
  post "/schedule/:id/generate_payments", to: "due_payment#generate_payments"
  post "/payment_schedules/:id/change_owner/:user_id", to: "payment_schedule#change_owner"

  get "/update_payment_unsafe", to: "payments#update_payers"

  #  ===================
  # ADDRESSES
  #  ===================
  get "/addresses/search", to: "addresses#search"
  post "/addresses/new", to: "addresses#new"
  patch "/addresses/:id/update", to: "addresses#update"
  get "/addresses/:id", to: "addresses#get"

  #  ===================
  # MESSAGES
  #  ===================
  post "/messages/create", to: "messages#create"

  #  ===================
  # PLANNINGS
  #  ===================
  get "/room/:id/intervals/:granularity/:date", to: "planning#get_room_intervals"

  get "/planning/simple(/:day)(/:id)", to: "planning#show_simple", as: :planning_simple
  get "/planning/simple/intervals(/:day)(/:id)", to: "planning#get_intervals_simple"
  get "/planning/:id/:day", to: "planning#show"
  get "/planning/:id/intervals/:granularity/:date", to: "planning#get_intervals"
  resources :planning
  get "/plannings/availabilities", to: "planning#show_availabilities", as: :availabilities_portal
  get "/plannings/availabilities/:id(/:date)", to: "planning#show_availabilities_for_date", as: :availabilities_planning
  patch "/plannings/availabilities/:id", to: "planning#update_availabilities"
  patch "/plannings/availabilities/:id/can_update", to: "planning#can_update_availabilities"
  post "/plannings/availabilities/:id/copy", to: "planning#copy_availabilities", as: :copy_planning
  get "/plannings/conflict/:conflict_id", to: "planning#show_for_conflict"
  get "/plannings/all_rooms", to: "planning#show_all_rooms"
  get "/plannings/teachers", to: "planning#index_for_teachers"
  get "/plannings/rooms", to: "planning#index_for_rooms"
  get "/plannings/generic/:id", to: "planning#show_generic", as: :generic_planning
  get "/planning/:id/availabilities/defaults", to: "planning#add_defaults_to_planning"

  get "/plannings/show_incoherent_intervals", to: "planning#incoherent_intervals"
  get "/plannings/remove_incoherent_intervals", to: "planning#remove_incoherent_intervals"

  post "/planning/:id/lock", to: "planning#lock"
  post "/planning/:id/unlock", to: "planning#unlock"
  post "/planning/:id/toggle_lock", to: "planning#toggle_lock"

  post "/planning/overlap", to: "planning#overlap"
  post "/planning/overlap_same_teacher", to: "planning#overlap_same_teacher"
  post "/planning/overlap_same_room", to: "planning#overlap_same_room"

  # patch 'time_intervals', to: "time_interval#update"
  get "/time_interval/:id", to: "time_interval#details"
  post "/time_interval/overlap_room/:room_id", to: "time_interval#has_overlap_room"
  post "/time_interval/overlap_teacher/:teacher_id", to: "time_interval#has_overlap_teacher"
  patch "/time_interval/:id/validate", to: "time_interval#create_activity_instances"
  get "/time_interval/:time_interval_id/check_conflicts/:instance_id", to: "time_interval#check_conflicts_mass_update"
  get "/time_interval/evaluation/available", to: "time_interval#available_evaluations"
  delete "/time_intervals/:id", to: "time_interval#delete"
  get "/time_intervals/available_appointments", to: "time_interval#available_appointments_intervals"

  #  ===================
  # COMMENTS
  #  ===================
  resources :comments

  #  ===================
  # ACTIVITIES
  #  ===================
  get "/activities", to: "activity#index"
  post "/activities", to: "activity#list"
  post "/activities/availabilities", to: "activity#get_availabilities"

  # get "activity/generate", to: "activity#generate_instances"

  post "activity", to: "activity#create"
  get "activity/remove"
  get "activity/:id/users", to: "activity#users_list"
  post "/activity/:id/desired/:desired_activity_id", to: "activity#add_student"
  post "/activity/:id/desired_option/:desired_activity_id", to: "activity#add_student_option"
  delete "/activity/:id/desired/:desired_activity_id", to: "activity#remove_student"
  delete "/activity/:id/desired_option/:desired_activity_id", to: "activity#remove_student_option"
  post "/activity/:id/teacher/:teacher_id", to: "activity#change_teacher"
  post "/activity/:id/teacher/:teacher_id/is_main", to: "activity#change_is_main"
  delete "/activity/:id/teacher/:teacher_id", to: "activity#remove_teacher"
  put "/activity/:id/teacher/:teacher_id", to: "activity#add_teacher"
  post "/activity/:id/activity_instances", to: "activity#update_instances"
  delete "/activity/:id", to: "activity#delete"
  post "/activity/:id", to: "activity#update"
  post "/activity_instance/:id/teacher/:teacher_id", to: "activity_instance#change_teacher"
  post "/activity_instance/:id/cover_teacher/:cover_teacher_id", to: "activity_instance#set_cover_teacher"

  post "/desired_activities/:id", to: "desired_activity#update"
  post "/desired_activities/:id/pricing", to: "desired_activity#set_pricing"
  # post "/desired_activities/:id/prorata/:prorata", to: "desired_activity#set_prorata"

  get "/import_users", to: "users#upload_csv"
  post "/import_users", to: "users#upload_csv"

  get "/activity_time_intervals", to: "activity#activity_time_intervals"

  # Autosuggests
  get "/autosuggest/cities", to: "autosuggest#cities"

  patch "/activity_refs/:id/instruments", to: "activity_ref#set_instruments"

  #  Resources Referentials
  resources :evaluation_level_ref

  get "/rooms", to: "rooms#index"
  get "/rooms/index_with_overlap", to: "rooms#index_with_overlap"
  get "/rooms/:location_id/new", to: "rooms#new"
  get "/rooms/:id/planning", to: "planning#show_for_room", as: "room_planning"
  get "/rooms/:id/activities", to: "rooms#edit_activities"
  patch "/rooms/:id/activities", to: "rooms#update_activities"
  resources :rooms
  delete "/rooms/:id", to: "rooms#destroy", as: "destroy_room"

  patch "/activity_instance/:id/update_all/:time_interval_id", to: "activity_instance#update_all"
  patch "/activity_instance/:id", to: "activity_instance#edit_activity_instance"
  delete "/activity_instance/:id", to: "activity_instance#delete"
  delete "/activity_instances", to: "activity_instance#bulkdelete"

  get "/addCourse", to: "activity#add_course"


  # ==================
  # ADMIN
  # ==================
  get "/admin/get_session_hour", to: "admin#get_session_hour"
  post "/admin/update_logo", to: "admin#update_logo", as: "update_logo"
  post "/admin/update_session_hour", to: "admin#update_session_hour", as: "update_session_hour"

  devise_scope :user do
    root to: "sessions#new"

    # get "switch/:id", to: "sessions#switch"
    post "switch_to", to: "sessions#switch_to"
  end
  # ==================
  # ACTIVITY_REFS
  # ==================
  resources :activity_ref
  post "/activity_ref/:id/update", to: "activity_ref#update"
  post "/activity_ref/:id/picture", to: "activity_ref#save_picture"

  # ==================
  # EVALUATION APPOINTMENTS
  # ==================
  get "/evaluation_appointments/without_interval", to: "evaluation_appointments#without_interval"
  get "/evaluation_incomplete", to: "evaluation_appointments#incomplete",
      as: :incomplete_evaluation_appointments
  resources :evaluation_appointments

  # ==================
  # STUDENT ATTENDANCES
  # ==================
  post "/student_attendances/bulk", to: "student_attendances#update_all"
  post "/student_attendances/:id", to: "student_attendances#update"

  # ==================
  # STUDENTS
  # ==================
  get "/students.pdf", to: "students#index"


  # ==================
  # STUDENT EVALUATIONS
  # ==================
  scope "/student_evaluations" do
    get "/stats", to: "student_evaluations_stats#stats", as: :student_evaluations_stats
  end

  post "/student_evaluations", to: "student_evaluations#create"
  get "/student_evaluations/:id", to: "student_evaluations#get"

  # ==================
  # NEW STUDENT LEVEL QUESTIONNAIRES
  # ==================
  get "/new_student_level_questionnaire", to: "new_student_level_questionnaires#find"
  get "/new_student_level_questionnaire/appointment/:id", to: "new_student_level_questionnaires#find_by_appointment"

  # ==================
  # INSTRUMENTS
  # ==================
  resources :instruments
  post "/instruments/list", to: "instruments#list"

  # ==================
  # ACTIVITY_REF_KINDS
  # ==================
  resources :activity_ref_kind
  get "activity_ref_kinds", to: "activity_ref_kind#index"
  post "activity_ref_kinds", to: "activity_ref_kind#create"
  post "activity_ref_kind/list", to: "activity_ref_kind#list"

  # ==================
  # ACTIVITIES INSTRUMENTS
  # ==================
  resources :activities_instruments

  post "/activities_instruments/:id/option/:desired_activity_id", to: "activities_instruments#add_option"
  delete "/activities_instruments/:id/option/:desired_activity_id", to: "activities_instruments#remove_option"

  post "/activities_instruments/:id/student/:desired_activity_id", to: "activities_instruments#add_student"
  delete "/activities_instruments/:id/student/:desired_activity_id", to: "activities_instruments#remove_student"

  get "scripts/merge_users", to: "scripts#merge_users"
  post "scripts/merge_users/execute", to: "scripts#execute_merge_users"

  get "scripts/replicate_activities", to: "scripts#fix_activities_holidays", as: :replicate_activities
  post "scripts/replicate_activities/execute", to: "scripts#execute_replicate_activities"
  get "scripts/replicate_week_activities", to: "scripts#replicate_week_activities", as: :replicate_week_activities
  post "scripts/replicate_week_activities/execute", to: "scripts#execute_replicate_week_activities"
  #get "scripts/job_status", to: "scripts#get_job_status"

  get "/jobs/:id/status", to: "jobs#show_status"

  resources :payment_statuses
  resources :payment_method
  resources :locations

  resources :consent_documents
  post "/consent_documents/move_up", to: "consent_documents#move_up"
  post "/consent_documents/move_down", to: "consent_documents#move_down"
  post "/consent_documents/:id/has_consented", to: "consent_documents#has_consented"


  namespace :parameters do
  end

  get "/parameters", to: "parameters#index"
  get "/parameters/school", to: "parameters#school_parameters_edit"
  post "/parameters/school", to: "parameters#school_parameters_update"
  get "/parameters/mails", to: "parameters#mails_parameters_edit"
  post "/parameters/mails", to: "parameters#mails_parameters_update"
  get "/parameters/rules_of_procedure", to: "parameters#rules_parameters_edit"
  post "/parameters/rules_of_procedure", to: "parameters#rules_parameters_update"
  get "/parameters/csv_export", to: "parameters#csv_parameters_edit"
  post "/parameters/csv_export", to: "parameters#csv_parameters_update"

  get "/cgu", to: "cgu#index"

  # Templates de mail
  resources :notification_templates
  get "/notification_templates/edit/:id", to: "notification_templates#edit_template"
  post "/notification_templates/list", to: "notification_templates#list"

  # Page des évènements
  resources :events_rules
  post "/events_rules/list", to: "events_rules#list"


  # destroy generic route
  delete "/destroy/:classname/:id", to: "remove#destroy", as: "generic_destroy"
  get "/references/:classname/:id", to: "remove#get_references"

  # ==================
  # PaymentScheduleOptions
  # ==================

  resources :payment_schedule_options, path: "payment_schedule_options"
  post "/payment_schedule_options/activated", to: "payment_schedule_options#change_activated_param"
  post "/payment_schedule_options/display_text", to: "payment_schedule_options#change_term_display_text_param"
  post "/payment_schedule_options/move_up", to: "payment_schedule_options#move_up"
  post "/payment_schedule_options/move_down", to: "payment_schedule_options#move_down"

  resources :organizations
   post "/organizations/update_from_user", to: "organizations#update_from_user"


  resources :adhesion_prices, path: "adhesion-prices", only: [:destroy, :create, :update, :index]

  # ==================
  # New payment user page
  # ==================

  get "/users/:id/payments", to: "user_payments#show_for_user", as: :user_payments_for_user
  get "/users/:id/payments/data", to: "user_payments#get_data_for_season", as: :user_payments_data_for_season
  get "/users/:id/paymentTerms", to: "user_payments#get_user_payment_terms_for_season", as: :user_payment_terms_for_season
  post "/users/:id/paymentTerms", to: "user_payments#update_user_payment_terms_for_season", as: :update_user_payment_terms_for_season

  get "/school/get_zone_by_address", to: "school#get_zone_by_address"

  get "/admin/error-history", to: "admin#error_history"

  # ==================
  # Packs de séances
  # ==================

  get "/my_activities/:id", to: "my_activities#show", as: :my_activity
  get "/get_user_activities_data/my_activities/:user_id", to: "my_activities#get_own_and_possible_user_activities"

  get "/my_activities/:id/bookActivity/:activity_ref_id", to: "my_activities#show_bookings_and_availabilities"
  get "/get_bookings_and_availabilities/my_activities/:user_id/bookActivity/:pack_id", to: "my_activities#get_bookings_and_availabilities"

  get "/my_activities/:id/upcoming", to: "my_activities#show_upcoming_activities"
  get "/get_upcoming_activities/my_activities/:user_id/upcoming", to: "my_activities#get_upcoming_activities_for_user"

  post "/submit_user_wish_list", to: "my_activities#submit_user_wish_list"
  post "/remove_wished_attendance", to: "my_activities#remove_wished_attendance"

  post "/activity_ref_pricing/new_pricing_category", to: "activity_ref_pricing#new_pricing_category"
  resources :pricing_categories
  post "/pricing_categories/list", to: "pricing_categories#list"

  get "/monitorStudentPacks", to: "packs#index"
  post "/get_student_packs_attendance", to: "packs#get_student_packs_attendance"
  post "/get_student_packs_attendance_by_filter", to: "packs#get_student_packs_attendance_by_filter"

  get "/activity_ref_pricing", to: "activity_ref_pricing#index"
  post "/activity_ref_pricings/list", to: "activity_ref_pricing#list"
  get "/activity_ref_pricings/get_seasons_and_pricing_categories", to: "activity_ref_pricing#get_seasons_and_pricing_categories"
  post "/activity_ref_pricings/", to: "activity_ref_pricing#create"
  put "/activity_ref_pricings/:id", to: "activity_ref_pricing#update"
  delete "/activity_ref_pricings/:id", to: "activity_ref_pricing#destroy"

end
