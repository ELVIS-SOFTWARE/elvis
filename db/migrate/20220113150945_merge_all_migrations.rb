class MergeAllMigrations < ActiveRecord::Migration[6.1]
  def change
    create_table "active_storage_attachments", if_not_exists: true do |t|
      t.string "name", null: false
      t.string "record_type", null: false
      t.bigint "record_id", null: false
      t.bigint "blob_id", null: false
      t.datetime "created_at", null: false
      t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
      t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
    end

    create_table "active_storage_blobs", if_not_exists: true do |t|
      t.string "key", null: false
      t.string "filename", null: false
      t.string "content_type"
      t.text "metadata"
      t.bigint "byte_size", null: false
      t.string "checksum", null: false
      t.datetime "created_at", null: false
      t.string "service_name", null: false
      t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
    end

    create_table "active_storage_variant_records", if_not_exists: true do |t|
      t.bigint "blob_id", null: false
      t.string "variation_digest", null: false
      t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
    end

    create_table "activities", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "time_interval_id"
      t.bigint "activity_ref_id"
      t.bigint "room_id"
      t.bigint "location_id"
      t.string "group_name"
      t.bigint "evaluation_level_ref_id"
      t.bigint "next_season_evaluation_level_ref_id"
      t.index ["activity_ref_id"], name: "index_activities_on_activity_ref_id"
      t.index ["location_id"], name: "index_activities_on_location_id"
      t.index ["room_id"], name: "index_activities_on_room_id"
      t.index ["time_interval_id"], name: "index_activities_on_time_interval_id"
    end

    create_table "activities_instruments", if_not_exists: true do |t|
      t.bigint "activity_id"
      t.bigint "instrument_id"
      t.bigint "user_id"
      t.boolean "is_validated", default: false
      t.datetime "attempt_date"
    end

    create_table "activity_application_statuses", if_not_exists: true do |t|
      t.string "label"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.boolean "is_stopping", default: false
      t.boolean "is_active", default: true
    end

    create_table "activity_applications", if_not_exists: true do |t|
      t.bigint "user_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.integer "activity_ref_id"
      t.bigint "activity_application_status_id"
      t.datetime "deleted_at"
      t.bigint "season_id"
      t.boolean "mail_sent", default: false
      t.datetime "status_updated_at"
      t.bigint "referent_id"
      t.datetime "stopped_at"
      t.datetime "begin_at"
      t.index ["activity_application_status_id"], name: "index_activity_applications_on_activity_application_status_id"
      t.index ["deleted_at"], name: "index_activity_applications_on_deleted_at"
      t.index ["user_id"], name: "index_activity_applications_on_user_id"
    end

    create_table "activity_instances", if_not_exists: true do |t|
      t.bigint "time_interval_id"
      t.bigint "room_id"
      t.bigint "location_id"
      t.bigint "activity_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "cover_teacher_id"
      t.boolean "are_hours_counted", default: true
      t.index ["activity_id"], name: "index_activity_instances_on_activity_id"
      t.index ["location_id"], name: "index_activity_instances_on_location_id"
      t.index ["room_id"], name: "index_activity_instances_on_room_id"
      t.index ["time_interval_id"], name: "index_activity_instances_on_time_interval_id"
    end

    create_table "activity_ref_cycles", if_not_exists: true do |t|
      t.bigint "from_activity_ref_id"
      t.bigint "to_activity_ref_id"
    end

    create_table "activity_ref_kinds", if_not_exists: true do |t|
      t.string "name"
      t.datetime "created_at", precision: 6, null: false
      t.datetime "updated_at", precision: 6, null: false
    end

    if Object.const_defined?(:ActivityRefSeasonPricing)
      create_table "activity_ref_season_pricings", if_not_exists: true do |t|
        t.bigint "activity_ref_id", null: false
        t.bigint "season_id", null: false
        t.bigint "pricing_id"
        t.float "price", default: 0.0
        t.index ["activity_ref_id", "season_id", "pricing_id"], name: "activity_ref_season_pricing_index_on_associations"
      end
    end

    create_table "activity_refs", if_not_exists: true do |t|
      t.string "kind"
      t.string "label"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "image"
      t.integer "occupation_limit"
      t.integer "occupation_hard_limit"
      t.integer "monthly_price"
      t.integer "quarterly_price"
      t.integer "annual_price"
      t.integer "special_price"
      t.boolean "has_additional_student", default: false
      t.boolean "is_lesson"
      t.boolean "is_visible_to_admin", default: false
      t.datetime "deleted_at"
      t.integer "from_age"
      t.integer "to_age"
      t.boolean "is_evaluable", default: false
      t.boolean "is_unpopular", default: false
      t.boolean "is_work_group", default: false
      t.bigint "activity_ref_kind_id", null: false
      t.index ["activity_ref_kind_id"], name: "index_activity_refs_on_activity_ref_kind_id"
      t.index ["is_lesson"], name: "index_activity_refs_on_is_lesson"
    end

    create_table "activity_refs_instruments", if_not_exists: true do |t|
      t.bigint "activity_ref_id"
      t.bigint "instrument_id"
    end

    create_table "activity_refs_pricings", id: false, if_not_exists: true do |t|
      t.bigint "pricing_id", null: false
      t.bigint "activity_ref_id", null: false
      t.float "price"
      t.index ["activity_ref_id"], name: "index_activity_refs_pricings_on_activity_ref_id"
      t.index ["pricing_id"], name: "index_activity_refs_pricings_on_pricing_id"
    end

    create_table "additional_students", if_not_exists: true do |t|
      t.bigint "desired_activity_id"
      t.bigint "user_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["desired_activity_id"], name: "index_additional_students_on_desired_activity_id"
      t.index ["user_id"], name: "index_additional_students_on_user_id"
    end

    create_table "addresses", if_not_exists: true do |t|
      t.string "street_address"
      t.string "postcode"
      t.string "city"
      t.string "department"
      t.string "country"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "adhesions", if_not_exists: true do |t|
      t.bigint "user_id"
      t.date "validity_start_date"
      t.date "validity_end_date"
      t.boolean "is_active"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.datetime "deleted_at"
      t.datetime "last_reminder"
      t.bigint "season_id"
      t.index ["deleted_at"], name: "index_adhesions_on_deleted_at"
      t.index ["season_id"], name: "index_adhesions_on_season_id"
      t.index ["user_id"], name: "index_adhesions_on_user_id"
    end

    create_table "answers", if_not_exists: true do |t|
      t.bigint "question_id"
      t.bigint "answerable_id"
      t.text "value"
      t.string "answerable_type"
    end

    create_table "application_change_questionnaires", if_not_exists: true do |t|
      t.bigint "activity_id"
      t.bigint "user_id"
      t.bigint "season_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "band_types", if_not_exists: true do |t|
      t.string "name", null: false
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "bands", if_not_exists: true do |t|
      t.string "name", null: false
      t.boolean "blacklisted", default: false, null: false
      t.bigint "music_genre_id"
      t.bigint "band_type_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["band_type_id"], name: "index_bands_on_band_type_id"
      t.index ["music_genre_id"], name: "index_bands_on_music_genre_id"
    end

    create_table "bands_users", if_not_exists: true do |t|
      t.bigint "band_id"
      t.bigint "user_id"
      t.bigint "instrument_id"
      t.date "joined_at"
      t.date "left_at"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "first_name"
      t.string "last_name"
      t.string "email"
      t.index ["band_id"], name: "index_bands_users_on_band_id"
      t.index ["instrument_id"], name: "index_bands_users_on_instrument_id"
      t.index ["user_id"], name: "index_bands_users_on_user_id"
    end

    create_table "comments", if_not_exists: true do |t|
      t.string "content"
      t.bigint "user_id"
      t.bigint "commentable_id"
      t.string "commentable_type"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["user_id"], name: "index_comments_on_user_id"
    end

    create_table "conflicts", if_not_exists: true do |t|
      t.datetime "ts"
      t.string "kind"
      t.boolean "is_resolved"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "activity_instance_id"
      t.index ["activity_instance_id"], name: "index_conflicts_on_activity_instance_id"
    end

    create_table "contacts", if_not_exists: true do |t|
      t.string "first_name"
      t.string "last_name"
      t.string "email"
      t.string "profession"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "address_id"
      t.boolean "deleted"
      t.index ["address_id"], name: "index_contacts_on_address_id"
    end

    create_table "desired_activities", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "activity_ref_id"
      t.bigint "activity_application_id"
      t.boolean "is_validated", default: false
      t.integer "activity_id"
      t.integer "payment_frequency"
      t.bigint "pricing_id"
      t.integer "prorata"
      t.decimal "prorata_amount"
      t.datetime "deleted_at"
      t.index ["activity_application_id"], name: "index_desired_activities_on_activity_application_id"
      t.index ["activity_id"], name: "index_desired_activities_on_activity_id"
      t.index ["activity_ref_id"], name: "index_desired_activities_on_activity_ref_id"
      t.index ["deleted_at"], name: "index_desired_activities_on_deleted_at"
      t.index ["pricing_id"], name: "index_desired_activities_on_pricing_id"
    end

    create_table "desired_locations", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "activity_application_id"
      t.bigint "location_id"
      t.index ["activity_application_id"], name: "index_desired_locations_on_activity_application_id"
      t.index ["location_id"], name: "index_desired_locations_on_location_id"
    end

    create_table "desired_teachers", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "activity_application_id"
      t.bigint "user_id"
      t.index ["activity_application_id"], name: "index_desired_teachers_on_activity_application_id"
      t.index ["user_id"], name: "index_desired_teachers_on_user_id"
    end

    create_table "desired_time_intervals", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "activity_application_id"
      t.bigint "time_interval_id"
      t.index ["activity_application_id"], name: "index_desired_time_intervals_on_activity_application_id"
      t.index ["time_interval_id"], name: "index_desired_time_intervals_on_time_interval_id"
    end

    create_table "due_payment_statuses", if_not_exists: true do |t|
      t.string "label"
      t.string "color"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "due_payments", if_not_exists: true do |t|
      t.bigint "payment_schedule_id"
      t.integer "number"
      t.date "previsional_date"
      t.decimal "amount"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "payment_method_id"
      t.bigint "due_payment_status_id"
      t.bigint "location_id"
      t.string "operation", limit: 1, default: "+"
      t.index ["payment_method_id"], name: "index_due_payments_on_payment_method_id"
      t.index ["payment_schedule_id"], name: "index_due_payments_on_payment_schedule_id"
    end

    create_table "evaluation_appointments", if_not_exists: true do |t|
      t.bigint "student_id"
      t.bigint "teacher_id"
      t.bigint "time_interval_id"
      t.bigint "season_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "activity_ref_id"
      t.bigint "activity_application_id"
      t.bigint "room_id"
      t.index ["activity_application_id"], name: "index_evaluation_appointments_on_activity_application_id"
    end

    create_table "evaluation_level_refs", if_not_exists: true do |t|
      t.integer "value"
      t.string "label"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.boolean "can_continue", default: false
    end

    create_table "failed_payment_import_reasons", if_not_exists: true do |t|
      t.string "code", null: false
      t.string "label", null: false
      t.string "color"
    end

    create_table "failed_payment_imports", if_not_exists: true do |t|
      t.string "first_name"
      t.string "last_name"
      t.string "due_date"
      t.string "cashing_date"
      t.decimal "amount"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "reason"
      t.bigint "failed_payment_import_reason_id"
      t.bigint "user_id"
      t.index ["failed_payment_import_reason_id"], name: "index_failed_payment_import_reason"
    end

    create_table "family_member_contacts", if_not_exists: true do |t|
      t.bigint "user_id"
      t.bigint "contact_id"
      t.string "link"
      t.boolean "is_accompanying"
      t.boolean "is_paying"
      t.boolean "is_legal_referent"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["contact_id"], name: "index_family_member_contacts_on_contact_id"
      t.index ["user_id"], name: "index_family_member_contacts_on_user_id"
    end

    create_table "family_member_users", if_not_exists: true do |t|
      t.bigint "user_id"
      t.bigint "member_id"
      t.string "link"
      t.boolean "is_accompanying"
      t.boolean "is_paying_for"
      t.boolean "is_legal_referent"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.datetime "deleted_at"
      t.boolean "is_to_call", default: false
      t.bigint "season_id"
      t.index ["deleted_at"], name: "index_family_member_users_on_deleted_at"
      t.index ["member_id"], name: "index_family_member_users_on_member_id"
      t.index ["user_id"], name: "index_family_member_users_on_user_id"
    end

    create_table "family_members", if_not_exists: true do |t|
      t.string "link"
      t.bigint "user_id"
      t.bigint "linkable_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.boolean "is_accompanying"
      t.boolean "is_paying"
      t.boolean "is_legal_referent"
      t.string "linkable_type"
      t.index ["linkable_id"], name: "index_family_members_on_linkable_id"
      t.index ["user_id", "linkable_id"], name: "index_family_members_on_user_id_and_linkable_id", unique: true
      t.index ["user_id"], name: "index_family_members_on_user_id"
    end

    create_table "flat_rates", if_not_exists: true do |t|
      t.string "name", null: false
      t.boolean "enable", default: false, null: false
      t.integer "nb_hour", default: 0, null: false
      t.integer "solo_duo_rate", default: 0, null: false
      t.integer "group_rate", default: 0, null: false
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "holidays", if_not_exists: true do |t|
      t.date "date"
      t.bigint "season_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "label"
      t.string "kind"
      t.index ["season_id"], name: "index_holidays_on_season_id"
    end

    create_table "hours_sheets", primary_key: ["user_id", "year", "month"], if_not_exists: true do |t|
      t.bigint "user_id", null: false
      t.integer "year", null: false
      t.integer "month", null: false
      t.jsonb "json_sheet"
      t.boolean "is_complete", default: true
      t.index ["user_id"], name: "index_hours_sheets_on_user_id"
    end

    create_table "instruments", if_not_exists: true do |t|
      t.string "label"
    end

    create_table "levels", if_not_exists: true do |t|
      t.integer "evaluation_level_ref_id"
      t.integer "activity_ref_id"
      t.integer "user_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "season_id"
      t.boolean "can_continue"
      t.index ["activity_ref_id"], name: "index_levels_on_activity_ref_id"
      t.index ["evaluation_level_ref_id"], name: "index_levels_on_evaluation_level_ref_id"
      t.index ["season_id"], name: "index_levels_on_season_id"
      t.index ["user_id"], name: "index_levels_on_user_id"
    end

    create_table "locations", if_not_exists: true do |t|
      t.string "label"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "materials", if_not_exists: true do |t|
      t.string "name", null: false
      t.boolean "active", default: false, null: false
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.float "prix"
    end

    create_table "message_recipients", if_not_exists: true do |t|
      t.bigint "message_id", null: false
      t.bigint "user_id", null: false
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "messages", if_not_exists: true do |t|
      t.text "title", null: false
      t.text "content", null: false
      t.boolean "is_sms", null: false
      t.boolean "is_email", null: false
      t.bigint "user_id", null: false
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "music_genres", if_not_exists: true do |t|
      t.string "name", null: false
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "new_student_level_questionnaires", if_not_exists: true do |t|
      t.bigint "user_id"
      t.bigint "season_id"
      t.bigint "activity_ref_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "oidc_access_token_request_objects", if_not_exists: true do |t|
      t.bigint "oidc_access_token_id"
      t.bigint "oidc_request_object_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["oidc_access_token_id"], name: "oidc_acc_tok_req_obj_index_on_oidc_acc_tok_id"
      t.index ["oidc_request_object_id"], name: "oidc_acc_tok_req_obj_index_on_oidc_req_obj_id"
    end

    create_table "oidc_access_token_scopes", if_not_exists: true do |t|
      t.bigint "oidc_access_token_id"
      t.bigint "oidc_scope_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["oidc_access_token_id"], name: "index_oidc_access_token_scopes_on_oidc_access_token_id"
      t.index ["oidc_scope_id"], name: "index_oidc_access_token_scopes_on_oidc_scope_id"
    end

    create_table "oidc_access_tokens", if_not_exists: true do |t|
      t.bigint "user_id"
      t.bigint "oidc_client_id"
      t.string "token"
      t.datetime "expires_at"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["oidc_client_id"], name: "index_oidc_access_tokens_on_oidc_client_id"
      t.index ["token"], name: "index_oidc_access_tokens_on_token", unique: true
      t.index ["user_id"], name: "index_oidc_access_tokens_on_user_id"
    end

    create_table "oidc_authorization_request_objects", if_not_exists: true do |t|
      t.bigint "oidc_authorization_id"
      t.bigint "oidc_request_object_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["oidc_authorization_id"], name: "oidc_auth_req_obj_index_on_oidc_auth_id"
      t.index ["oidc_request_object_id"], name: "oidc_auth_req_obj_index_on_oidc_req_obj_id"
    end

    create_table "oidc_authorization_scopes", if_not_exists: true do |t|
      t.bigint "oidc_authorization_id"
      t.bigint "oidc_scope_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["oidc_authorization_id"], name: "index_oidc_authorization_scopes_on_oidc_authorization_id"
      t.index ["oidc_scope_id"], name: "index_oidc_authorization_scopes_on_oidc_scope_id"
    end

    create_table "oidc_authorizations", if_not_exists: true do |t|
      t.bigint "user_id"
      t.bigint "oidc_client_id"
      t.string "code"
      t.string "nonce"
      t.string "redirect_uri"
      t.datetime "expires_at"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["code"], name: "index_oidc_authorizations_on_code", unique: true
      t.index ["oidc_client_id"], name: "index_oidc_authorizations_on_oidc_client_id"
      t.index ["user_id"], name: "index_oidc_authorizations_on_user_id"
    end

    create_table "oidc_clients", if_not_exists: true do |t|
      t.bigint "user_id"
      t.string "identifier"
      t.string "secret"
      t.string "name"
      t.string "jwks_uri"
      t.string "sector_identifier"
      t.string "redirect_uris"
      t.boolean "dynamic", default: false
      t.boolean "native", default: false
      t.boolean "ppid", default: false
      t.datetime "expires_at"
      t.text "raw_registered_json"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["identifier"], name: "index_oidc_clients_on_identifier", unique: true
      t.index ["user_id"], name: "index_oidc_clients_on_user_id"
    end

    create_table "oidc_id_token_request_objects", if_not_exists: true do |t|
      t.bigint "oidc_id_token_id"
      t.bigint "oidc_request_object_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["oidc_id_token_id"], name: "index_oidc_id_token_request_objects_on_oidc_id_token_id"
      t.index ["oidc_request_object_id"], name: "index_oidc_id_token_request_objects_on_oidc_request_object_id"
    end

    create_table "oidc_id_tokens", if_not_exists: true do |t|
      t.bigint "user_id"
      t.bigint "oidc_client_id"
      t.string "nonce"
      t.datetime "expires_at"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["oidc_client_id"], name: "index_oidc_id_tokens_on_oidc_client_id"
      t.index ["user_id"], name: "index_oidc_id_tokens_on_user_id"
    end

    create_table "oidc_request_objects", if_not_exists: true do |t|
      t.text "jwt_string"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "oidc_scopes", if_not_exists: true do |t|
      t.string "name"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["name"], name: "index_oidc_scopes_on_name", unique: true
    end

    create_table "options", if_not_exists: true do |t|
      t.integer "desired_activity_id"
      t.integer "activity_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.datetime "deleted_at"
      t.index ["activity_id"], name: "index_options_on_activity_id"
      t.index ["desired_activity_id"], name: "index_options_on_desired_activity_id"
    end

    create_table "parameters", if_not_exists: true do |t|
      t.string "label"
      t.string "value"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "value_type", default: "string"
    end

    create_table "payment_methods", if_not_exists: true do |t|
      t.string "label"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.boolean "is_special"
      t.boolean "is_credit_note", default: false
    end

    create_table "payment_schedule_statuses", if_not_exists: true do |t|
      t.string "label"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "payment_schedules", if_not_exists: true do |t|
      t.bigint "payable_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "payable_type"
      t.bigint "location_id"
      t.bigint "season_id"
      t.bigint "payment_schedule_status_id"
      t.index ["payable_id"], name: "index_payment_schedules_on_payable_id"
      t.index ["payment_schedule_status_id"], name: "index_payment_schedules_on_payment_schedule_status_id"
    end

    create_table "payment_statuses", if_not_exists: true do |t|
      t.string "label"
      t.string "color"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "payments", if_not_exists: true do |t|
      t.bigint "payable_id"
      t.bigint "payment_method_id"
      t.datetime "reception_date"
      t.date "cashing_date"
      t.decimal "amount"
      t.boolean "direction"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "due_payment_id"
      t.string "check_number"
      t.string "payable_type"
      t.string "check_issuer_name"
      t.bigint "payment_status_id"
      t.bigint "location_id"
      t.string "operation", limit: 1, default: "+"
      t.boolean "check_status", default: false
      t.index ["due_payment_id"], name: "index_payments_on_due_payment_id"
      t.index ["payable_id"], name: "index_payments_on_payable_id"
      t.index ["payment_method_id"], name: "index_payments_on_payment_method_id"
    end

    create_table "planning_conflicts", if_not_exists: true do |t|
      t.bigint "planning_id"
      t.bigint "conflict_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["conflict_id"], name: "index_planning_conflicts_on_conflict_id"
      t.index ["planning_id"], name: "index_planning_conflicts_on_planning_id"
    end

    create_table "plannings", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "user_id"
      t.float "hours_count", default: 0.0
      t.boolean "is_locked", default: false
      t.index ["user_id"], name: "index_plannings_on_user_id"
    end

    create_table "practice_room_parameters", if_not_exists: true do |t|
      t.integer "room_id"
      t.time "duration"
      t.integer "practice_room_planning_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "practice_room_plannings", if_not_exists: true do |t|
      t.string "room_id"
      t.boolean "monday_is_open", default: true
      t.boolean "tuesday_is_open", default: true
      t.boolean "wednesday_is_open", default: true
      t.boolean "thursday_is_open", default: true
      t.boolean "friday_is_open", default: true
      t.boolean "saturday_is_open", default: false
      t.boolean "sunday_is_open", default: false
      t.integer "monday_time_interval_id"
      t.integer "tuesday_time_interval_id"
      t.integer "wednesday_time_interval_id"
      t.integer "thursday_time_interval_id"
      t.integer "friday_time_interval_id"
      t.integer "saturday_time_interval_id"
      t.integer "sunday_time_interval_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "practice_sessions", if_not_exists: true do |t|
      t.integer "band_id"
      t.integer "time_interval_id"
      t.integer "room_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
    end

    create_table "pre_application_activities", if_not_exists: true do |t|
      t.boolean "status"
      t.string "comment"
      t.string "action"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "pre_application_id"
      t.bigint "activity_id"
      t.bigint "activity_application_id"
      t.index ["activity_application_id"], name: "index_pre_application_activities_on_activity_application_id"
      t.index ["activity_id"], name: "index_pre_application_activities_on_activity_id"
      t.index ["pre_application_id"], name: "index_pre_application_activities_on_pre_application_id"
    end

    create_table "pre_application_desired_activities", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "pre_application_id"
      t.bigint "desired_activity_id"
      t.boolean "status"
      t.string "action", default: "new"
      t.bigint "activity_application_id"
      t.index ["activity_application_id"], name: "pre_app_des_act_app"
      t.index ["desired_activity_id"], name: "index_pre_application_desired_activities_on_desired_activity_id"
      t.index ["pre_application_id"], name: "index_pre_application_desired_activities_on_pre_application_id"
    end

    create_table "pre_applications", if_not_exists: true do |t|
      t.bigint "user_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "season_id"
      t.index ["user_id"], name: "index_pre_applications_on_user_id"
    end

    if Object.const_defined?(:Pricing)
      create_table "pricings", if_not_exists: true do |t|
        t.string "label", null: false
      end
    end

    create_table "questions", if_not_exists: true do |t|
      t.text "field_type", default: "text"
      t.text "name", default: "field"
      t.text "label", default: "Form field"
      t.text "radio_values"
      t.text "select_target"
      t.text "default_value"
      t.integer "order"
      t.boolean "is_multiple_select", default: false
      t.boolean "is_required", default: true
      t.boolean "is_level_assignment", default: false
      t.string "select_values"
      t.string "condition"
      t.string "question_type", default: "student_evaluations"
      t.string "placeholder"
    end

    create_table "room_activities", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "room_id"
      t.bigint "activity_ref_id"
      t.index ["activity_ref_id"], name: "index_room_activities_on_activity_ref_id"
      t.index ["room_id"], name: "index_room_activities_on_room_id"
    end

    create_table "room_features", if_not_exists: true do |t|
      t.string "name"
      t.boolean "active", default: false
    end

    create_table "room_room_features", if_not_exists: true do |t|
      t.bigint "room_id"
      t.bigint "room_features_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.index ["room_features_id"], name: "index_room_room_features_on_room_features_id"
      t.index ["room_id"], name: "index_room_room_features_on_room_id"
    end

    create_table "rooms", if_not_exists: true do |t|
      t.string "label"
      t.string "kind"
      t.integer "floor"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "image"
      t.bigint "location_id"
      t.boolean "is_practice_room"
      t.float "area", default: 0.0
      t.index ["location_id"], name: "index_rooms_on_location_id"
    end

    create_table "seasons", if_not_exists: true do |t|
      t.string "label"
      t.datetime "start"
      t.datetime "end"
      t.boolean "is_current"
      t.boolean "is_next"
      t.boolean "is_off"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.datetime "closing_date_for_applications"
      t.integer "nb_lessons", default: 31
      t.datetime "opening_date_for_applications"
      t.datetime "opening_date_for_new_applications"
    end

    create_table "student_attendances", if_not_exists: true do |t|
      t.bigint "user_id"
      t.bigint "activity_instance_id"
      t.integer "attended"
      t.text "comment"
      t.boolean "is_option", default: false
      t.index ["id"], name: "index_student_attendances_on_id"
      t.index ["user_id", "activity_instance_id"], name: "index_student_attendances_on_user_id_and_activity_instance_id"
    end

    create_table "student_evaluations", if_not_exists: true do |t|
      t.bigint "activity_id"
      t.bigint "teacher_id"
      t.bigint "student_id"
      t.bigint "season_id"
    end

    create_table "students", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "user_id"
      t.bigint "activity_id"
      t.integer "payment_frequency"
      t.bigint "payment_method_id"
      t.string "payment_location", default: "lh"
      t.index ["activity_id"], name: "index_students_on_activity_id"
      t.index ["payment_method_id"], name: "index_students_on_payment_method_id"
      t.index ["user_id"], name: "index_students_on_user_id"
    end

    create_table "teacher_seasons", if_not_exists: true do |t|
      t.bigint "season_id", null: false
      t.bigint "user_id", null: false
      t.index ["season_id", "user_id"], name: "index_teacher_seasons_on_season_id_and_user_id"
    end

    create_table "teachers_activities", id: false, if_not_exists: true do |t|
      t.bigint "user_id", null: false
      t.bigint "activity_id", null: false
      t.boolean "is_main"
      t.index ["activity_id"], name: "index_teachers_activities_on_activity_id"
      t.index ["user_id"], name: "index_teachers_activities_on_user_id"
    end

    create_table "teachers_activity_instances", if_not_exists: true do |t|
      t.bigint "user_id", null: false
      t.bigint "activity_instance_id", null: false
      t.boolean "is_main"
    end

    create_table "teachers_activity_refs", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "activity_ref_id"
      t.bigint "user_id"
      t.index ["activity_ref_id"], name: "index_teachers_activity_refs_on_activity_ref_id"
      t.index ["user_id"], name: "index_teachers_activity_refs_on_user_id"
    end

    create_table "telephones", if_not_exists: true do |t|
      t.string "number"
      t.string "label"
      t.bigint "phonable_id"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "phonable_type"
      t.index ["phonable_id"], name: "index_telephones_on_phonable_id"
    end

    create_table "time_interval_preferences", if_not_exists: true do |t|
      t.bigint "user_id"
      t.bigint "season_id"
      t.bigint "time_interval_id"
      t.bigint "activity_ref_id"
      t.integer "rank"
      t.bigint "activity_application_id"
      t.index ["activity_application_id"], name: "index_time_interval_preferences_on_activity_application_id"
      t.index ["activity_ref_id"], name: "index_time_interval_preferences_on_activity_ref_id"
      t.index ["season_id"], name: "index_time_interval_preferences_on_season_id"
      t.index ["time_interval_id"], name: "index_time_interval_preferences_on_time_interval_id"
      t.index ["user_id"], name: "index_time_interval_preferences_on_user_id"
    end

    create_table "time_intervals", if_not_exists: true do |t|
      t.datetime "start"
      t.datetime "end"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "kind"
      t.boolean "is_validated", default: false
    end

    create_table "time_slots", if_not_exists: true do |t|
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.bigint "time_interval_id"
      t.bigint "planning_id"
      t.index ["planning_id"], name: "index_time_slots_on_planning_id"
      t.index ["time_interval_id"], name: "index_time_slots_on_time_interval_id"
    end

    create_table "user_addresses", if_not_exists: true do |t|
      t.bigint "user_id", null: false
      t.bigint "address_id", null: false
    end

    create_table "users", if_not_exists: true do |t|
      t.string "email", default: ""
      t.string "encrypted_password", default: "", null: false
      t.string "reset_password_token"
      t.datetime "reset_password_sent_at"
      t.datetime "remember_created_at"
      t.integer "sign_in_count", default: 0, null: false
      t.datetime "current_sign_in_at"
      t.datetime "last_sign_in_at"
      t.inet "current_sign_in_ip"
      t.inet "last_sign_in_ip"
      t.datetime "created_at", null: false
      t.datetime "updated_at", null: false
      t.string "confirmation_token"
      t.datetime "confirmed_at"
      t.datetime "confirmation_sent_at"
      t.string "first_name"
      t.string "last_name"
      t.string "sex"
      t.string "profession"
      t.string "school"
      t.boolean "is_admin", default: false
      t.boolean "is_teacher", default: false
      t.date "birthday"
      t.integer "self_level"
      t.boolean "solfege"
      t.boolean "handicap", default: false
      t.string "handicap_description"
      t.serial "adherent_number"
      t.bigint "evaluation_level_ref_id"
      t.boolean "is_paying"
      t.boolean "is_accompanying"
      t.integer "address_id"
      t.datetime "deleted_at"
      t.text "authentication_token"
      t.datetime "authentication_token_created_at"
      t.boolean "first_connection", default: true
      t.boolean "has_verified_infos", default: false
      t.boolean "checked_gdpr", default: false
      t.boolean "checked_image_right"
      t.boolean "checked_newsletter"
      t.index ["address_id"], name: "index_users_on_address_id"
      t.index ["authentication_token"], name: "index_users_on_authentication_token", unique: true
      t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
      t.index ["deleted_at"], name: "index_users_on_deleted_at"
      t.index %w[email adherent_number], name: "index_users_on_email_and_adherent_number", unique: true
      t.index ["email"], name: "index_users_on_email"
      t.index ["evaluation_level_ref_id"], name: "index_users_on_evaluation_level_ref_id"
      t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    end

    create_table "users_instruments", if_not_exists: true do |t|
      t.bigint "user_id"
      t.bigint "instrument_id"
    end

    add_foreign_key :activity_instances, :activities unless foreign_key_exists? :activity_instances, :activities
    add_foreign_key :active_storage_variant_records, :active_storage_blobs, column: :blob_id unless foreign_key_exists? :active_storage_variant_records, :active_storage_blobs, column: :blob_id
    add_foreign_key :activity_instances, :locations unless foreign_key_exists? :activity_instances, :locations
    add_foreign_key :activity_instances, :rooms unless foreign_key_exists? :activity_instances, :rooms
    add_foreign_key :activity_instances, :time_intervals unless foreign_key_exists? :activity_instances, :time_intervals
    add_foreign_key :activity_refs, :activity_ref_kinds unless foreign_key_exists? :activity_refs, :activity_ref_kinds
    add_foreign_key :bands, :band_types unless foreign_key_exists? :bands, :band_types
    add_foreign_key :bands, :music_genres unless foreign_key_exists? :bands, :music_genres
    add_foreign_key :desired_activities, :pricings unless foreign_key_exists? :desired_activities, :pricings if Object.const_defined?(:Pricing)
    add_foreign_key :due_payments, :payment_schedules unless foreign_key_exists? :due_payments, :payment_schedules
    add_foreign_key :evaluation_appointments, :activity_applications unless foreign_key_exists? :evaluation_appointments, :activity_applications
    add_foreign_key :holidays, :seasons unless foreign_key_exists? :holidays, :seasons
    add_foreign_key :levels, :seasons unless foreign_key_exists? :levels, :seasons
    add_foreign_key :planning_conflicts, :conflicts unless foreign_key_exists? :planning_conflicts, :conflicts
    add_foreign_key :planning_conflicts, :plannings unless foreign_key_exists? :planning_conflicts, :plannings
    add_foreign_key :room_room_features, :room_features, column: :room_features_id unless foreign_key_exists? :room_room_features, :room_features, column: :room_features_id
    add_foreign_key :room_room_features, :rooms unless foreign_key_exists? :room_room_features, :rooms
    add_foreign_key :rooms, :locations unless foreign_key_exists? :rooms, :locations
    add_foreign_key :time_interval_preferences, :activity_applications unless foreign_key_exists? :time_interval_preferences, :activity_applications
    add_foreign_key :time_interval_preferences, :activity_refs unless foreign_key_exists? :time_interval_preferences, :activity_refs
    add_foreign_key :time_interval_preferences, :seasons unless foreign_key_exists? :time_interval_preferences, :seasons
    add_foreign_key :time_interval_preferences, :time_intervals unless foreign_key_exists? :time_interval_preferences, :time_intervals
    add_foreign_key :time_interval_preferences, :users unless foreign_key_exists? :time_interval_preferences, :users

    Payment.connection.execute("CREATE OR REPLACE FUNCTION adjusted_amount(op text, amount real) RETURNS REAL AS $$
        BEGIN
          CASE op
            WHEN '-' THEN
              RETURN -1 * amount;
            WHEN '0' THEN
              RETURN 0;
            ELSE
              RETURN amount;
          END CASE;
        END;
      $$ LANGUAGE plpgsql;")
  end
end
