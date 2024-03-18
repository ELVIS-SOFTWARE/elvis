# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2024_03_07_132834) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
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

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "activities", force: :cascade do |t|
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

  create_table "activities_instruments", force: :cascade do |t|
    t.bigint "activity_id"
    t.bigint "instrument_id"
    t.bigint "user_id"
    t.boolean "is_validated", default: false
    t.datetime "attempt_date"
  end

  create_table "activity_application_statuses", force: :cascade do |t|
    t.string "label"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_stopping", default: false
    t.boolean "is_active", default: true
  end

  create_table "activity_applications", force: :cascade do |t|
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "activity_application_status_id"
    t.datetime "deleted_at"
    t.bigint "season_id"
    t.boolean "mail_sent", default: false
    t.datetime "status_updated_at"
    t.bigint "referent_id"
    t.datetime "stopped_at"
    t.datetime "begin_at"
    t.string "reason_of_refusal"
    t.index ["activity_application_status_id"], name: "index_activity_applications_on_activity_application_status_id"
    t.index ["deleted_at"], name: "index_activity_applications_on_deleted_at"
    t.index ["user_id"], name: "index_activity_applications_on_user_id"
  end

  create_table "activity_instances", force: :cascade do |t|
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

  create_table "activity_ref_cycles", force: :cascade do |t|
    t.bigint "from_activity_ref_id"
    t.bigint "to_activity_ref_id"
  end

  create_table "activity_ref_kinds", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.boolean "is_for_child", default: false
    t.datetime "deleted_at"
  end

  create_table "activity_ref_pricings", force: :cascade do |t|
    t.bigint "activity_ref_id", null: false
    t.float "price", null: false
    t.bigint "pricing_category_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.bigint "from_season_id"
    t.bigint "to_season_id"
    t.datetime "deleted_at"
    t.index ["activity_ref_id"], name: "index_activity_ref_pricings_on_activity_ref_id"
    t.index ["deleted_at"], name: "index_activity_ref_pricings_on_deleted_at"
    t.index ["pricing_category_id"], name: "index_activity_ref_pricings_on_pricing_category_id"
  end

  create_table "activity_refs", force: :cascade do |t|
    t.string "label", null: false
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
    t.boolean "is_lesson", default: true
    t.boolean "is_visible_to_admin", default: false
    t.datetime "deleted_at"
    t.integer "from_age", null: false
    t.integer "to_age", null: false
    t.boolean "is_evaluable", default: false
    t.boolean "is_unpopular", default: false
    t.boolean "is_work_group", default: false
    t.bigint "activity_ref_kind_id", null: false
    t.integer "activity_type"
    t.boolean "allows_timeslot_selection", default: false
    t.integer "nb_lessons"
    t.index ["activity_ref_kind_id"], name: "index_activity_refs_on_activity_ref_kind_id"
    t.index ["is_lesson"], name: "index_activity_refs_on_is_lesson"
  end

  create_table "activity_refs_instruments", force: :cascade do |t|
    t.bigint "activity_ref_id"
    t.bigint "instrument_id"
  end

  create_table "activity_refs_pricings", id: false, force: :cascade do |t|
    t.bigint "pricing_id", null: false
    t.bigint "activity_ref_id", null: false
    t.float "price"
    t.index ["activity_ref_id"], name: "index_activity_refs_pricings_on_activity_ref_id"
    t.index ["pricing_id"], name: "index_activity_refs_pricings_on_pricing_id"
  end

  create_table "additional_students", force: :cascade do |t|
    t.bigint "desired_activity_id"
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["desired_activity_id"], name: "index_additional_students_on_desired_activity_id"
    t.index ["user_id"], name: "index_additional_students_on_user_id"
  end

  create_table "addresses", force: :cascade do |t|
    t.string "street_address"
    t.string "postcode"
    t.string "city"
    t.string "department"
    t.string "country"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "kind"
  end

  create_table "adhesion_prices", force: :cascade do |t|
    t.string "label"
    t.float "price"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.bigint "season_id"
    t.index ["season_id"], name: "index_adhesion_prices_on_season_id"
  end

  create_table "adhesions", force: :cascade do |t|
    t.bigint "user_id"
    t.date "validity_start_date"
    t.date "validity_end_date"
    t.boolean "is_active"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "deleted_at"
    t.datetime "last_reminder"
    t.bigint "season_id"
    t.integer "adhesion_price_id"
    t.index ["deleted_at"], name: "index_adhesions_on_deleted_at"
    t.index ["season_id"], name: "index_adhesions_on_season_id"
    t.index ["user_id"], name: "index_adhesions_on_user_id"
  end

  create_table "answers", force: :cascade do |t|
    t.bigint "question_id"
    t.bigint "answerable_id"
    t.text "value"
    t.string "answerable_type"
  end

  create_table "application_change_questionnaires", force: :cascade do |t|
    t.bigint "activity_id"
    t.bigint "user_id"
    t.bigint "season_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "application_urls", force: :cascade do |t|
    t.string "url"
    t.boolean "is_main"
    t.datetime "last_used_at"
  end

  create_table "band_types", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "bands", force: :cascade do |t|
    t.string "name", null: false
    t.boolean "blacklisted", default: false, null: false
    t.bigint "music_genre_id"
    t.bigint "band_type_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["band_type_id"], name: "index_bands_on_band_type_id"
    t.index ["music_genre_id"], name: "index_bands_on_music_genre_id"
  end

  create_table "bands_users", force: :cascade do |t|
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

  create_table "comments", force: :cascade do |t|
    t.string "content"
    t.bigint "user_id"
    t.bigint "commentable_id"
    t.string "commentable_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "conflicts", force: :cascade do |t|
    t.datetime "ts"
    t.string "kind"
    t.boolean "is_resolved"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "activity_instance_id"
    t.index ["activity_instance_id"], name: "index_conflicts_on_activity_instance_id"
  end

  create_table "consent_document_users", force: :cascade do |t|
    t.bigint "consent_document_id", null: false
    t.bigint "user_id", null: false
    t.boolean "has_consented"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["consent_document_id"], name: "index_consent_document_users_on_consent_document_id"
    t.index ["user_id"], name: "index_consent_document_users_on_user_id"
  end

  create_table "consent_documents", force: :cascade do |t|
    t.string "title"
    t.string "content"
    t.string "attached_file"
    t.boolean "expected_answer"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "index"
  end

  create_table "coupons", force: :cascade do |t|
    t.string "label"
    t.float "percent_off"
    t.boolean "enabled", default: true
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.datetime "deleted_at"
    t.index ["deleted_at"], name: "index_coupons_on_deleted_at"
  end

  create_table "desired_activities", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "activity_ref_id"
    t.bigint "activity_application_id"
    t.boolean "is_validated", default: false
    t.integer "activity_id"
    t.integer "payment_frequency"
    t.integer "prorata"
    t.decimal "prorata_amount"
    t.datetime "deleted_at"
    t.bigint "pricing_category_id"
    t.index ["activity_application_id"], name: "index_desired_activities_on_activity_application_id"
    t.index ["activity_id"], name: "index_desired_activities_on_activity_id"
    t.index ["activity_ref_id"], name: "index_desired_activities_on_activity_ref_id"
    t.index ["deleted_at"], name: "index_desired_activities_on_deleted_at"
  end

  create_table "desired_locations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "activity_application_id"
    t.bigint "location_id"
    t.index ["activity_application_id"], name: "index_desired_locations_on_activity_application_id"
    t.index ["location_id"], name: "index_desired_locations_on_location_id"
  end

  create_table "desired_teachers", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "activity_application_id"
    t.bigint "user_id"
    t.index ["activity_application_id"], name: "index_desired_teachers_on_activity_application_id"
    t.index ["user_id"], name: "index_desired_teachers_on_user_id"
  end

  create_table "desired_time_intervals", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "activity_application_id"
    t.bigint "time_interval_id"
    t.index ["activity_application_id"], name: "index_desired_time_intervals_on_activity_application_id"
    t.index ["time_interval_id"], name: "index_desired_time_intervals_on_time_interval_id"
  end

  create_table "discounts", force: :cascade do |t|
    t.bigint "coupon_id", null: false
    t.string "discountable_type", null: false
    t.bigint "discountable_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["coupon_id"], name: "index_discounts_on_coupon_id"
    t.index ["discountable_type", "discountable_id"], name: "index_discounts_on_discountable"
    t.index ["discountable_type", "discountable_id"], name: "index_discounts_on_discountable_type_and_discountable_id", unique: true
  end

  create_table "due_payment_statuses", force: :cascade do |t|
    t.string "label"
    t.string "color"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "built_in", default: false
  end

  create_table "due_payments", force: :cascade do |t|
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
    t.boolean "created_by_payer_payment_term", default: false
    t.index ["payment_method_id"], name: "index_due_payments_on_payment_method_id"
    t.index ["payment_schedule_id"], name: "index_due_payments_on_payment_schedule_id"
  end

  create_table "error_codes", force: :cascade do |t|
    t.string "name"
    t.string "code"
    t.string "user_message"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["code"], name: "index_error_codes_on_code", unique: true
  end

  create_table "error_histories", force: :cascade do |t|
    t.string "message"
    t.jsonb "stack_trace", default: "[]", null: false
    t.jsonb "related_objects", default: "{}", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.bigint "error_code_id", null: false
    t.index ["error_code_id"], name: "index_error_histories_on_error_code_id"
  end

  create_table "evaluation_appointments", force: :cascade do |t|
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

  create_table "evaluation_level_refs", force: :cascade do |t|
    t.integer "value"
    t.string "label"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "can_continue", default: false
  end

  create_table "event_rules", force: :cascade do |t|
    t.string "name"
    t.boolean "sendSMS"
    t.boolean "sendMail"
    t.string "event"
    t.string "eventName"
    t.string "subject"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "templateName"
    t.string "carbon_copy"
  end

  create_table "event_store_events", force: :cascade do |t|
    t.uuid "event_id", null: false
    t.string "event_type", null: false
    t.jsonb "metadata"
    t.jsonb "data", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "valid_at", precision: 6
    t.index ["created_at"], name: "index_event_store_events_on_created_at"
    t.index ["event_id"], name: "index_event_store_events_on_event_id", unique: true
    t.index ["event_type"], name: "index_event_store_events_on_event_type"
    t.index ["valid_at"], name: "index_event_store_events_on_valid_at"
  end

  create_table "event_store_events_in_streams", force: :cascade do |t|
    t.string "stream", null: false
    t.integer "position"
    t.uuid "event_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.index ["created_at"], name: "index_event_store_events_in_streams_on_created_at"
    t.index ["stream", "event_id"], name: "index_event_store_events_in_streams_on_stream_and_event_id", unique: true
    t.index ["stream", "position"], name: "index_event_store_events_in_streams_on_stream_and_position", unique: true
  end

  create_table "event_subscriptions", force: :cascade do |t|
    t.string "event_group"
    t.string "event"
    t.boolean "async", default: false
    t.string "event_class"
    t.json "serialized_params", default: []
    t.json "serialized_params_types", default: []
    t.string "subscribe_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "export_templates", force: :cascade do |t|
    t.string "name", limit: 30, null: false
    t.string "model", null: false
    t.string "content", null: false
    t.bigint "user_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "failed_payment_import_reasons", force: :cascade do |t|
    t.string "code", null: false
    t.string "label", null: false
    t.string "color"
  end

  create_table "failed_payment_imports", force: :cascade do |t|
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

  create_table "family_member_users", force: :cascade do |t|
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

  create_table "flat_rates", force: :cascade do |t|
    t.string "name", null: false
    t.boolean "enable", default: false, null: false
    t.integer "nb_hour", default: 0, null: false
    t.integer "solo_duo_rate", default: 0, null: false
    t.integer "group_rate", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "holidays", force: :cascade do |t|
    t.date "date"
    t.bigint "season_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "label"
    t.string "kind"
    t.index ["season_id"], name: "index_holidays_on_season_id"
  end

  create_table "hours_sheets", primary_key: ["user_id", "year", "month"], force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "year", null: false
    t.integer "month", null: false
    t.jsonb "json_sheet"
    t.boolean "is_complete", default: true
    t.index ["user_id"], name: "index_hours_sheets_on_user_id"
  end

  create_table "instruments", force: :cascade do |t|
    t.string "label"
  end

  create_table "levels", force: :cascade do |t|
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

  create_table "locations", force: :cascade do |t|
    t.string "label"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "materials", force: :cascade do |t|
    t.string "name", null: false
    t.boolean "active", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.float "prix"
  end

  create_table "message_recipients", force: :cascade do |t|
    t.bigint "message_id", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "messages", force: :cascade do |t|
    t.text "title", null: false
    t.text "content", null: false
    t.boolean "is_sms", null: false
    t.boolean "is_email", null: false
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "music_genres", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "new_student_level_questionnaires", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "season_id"
    t.bigint "activity_ref_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "notification_templates", primary_key: "path", id: :string, force: :cascade do |t|
    t.text "body"
    t.string "locale"
    t.string "handler"
    t.boolean "partial", default: false
    t.string "format"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.string "name"
    t.string "json"
  end

  create_table "oidc_access_token_request_objects", force: :cascade do |t|
    t.bigint "oidc_access_token_id"
    t.bigint "oidc_request_object_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["oidc_access_token_id"], name: "oidc_acc_tok_req_obj_index_on_oidc_acc_tok_id"
    t.index ["oidc_request_object_id"], name: "oidc_acc_tok_req_obj_index_on_oidc_req_obj_id"
  end

  create_table "oidc_access_token_scopes", force: :cascade do |t|
    t.bigint "oidc_access_token_id"
    t.bigint "oidc_scope_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["oidc_access_token_id"], name: "index_oidc_access_token_scopes_on_oidc_access_token_id"
    t.index ["oidc_scope_id"], name: "index_oidc_access_token_scopes_on_oidc_scope_id"
  end

  create_table "oidc_access_tokens", force: :cascade do |t|
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

  create_table "oidc_authorization_request_objects", force: :cascade do |t|
    t.bigint "oidc_authorization_id"
    t.bigint "oidc_request_object_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["oidc_authorization_id"], name: "oidc_auth_req_obj_index_on_oidc_auth_id"
    t.index ["oidc_request_object_id"], name: "oidc_auth_req_obj_index_on_oidc_req_obj_id"
  end

  create_table "oidc_authorization_scopes", force: :cascade do |t|
    t.bigint "oidc_authorization_id"
    t.bigint "oidc_scope_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["oidc_authorization_id"], name: "index_oidc_authorization_scopes_on_oidc_authorization_id"
    t.index ["oidc_scope_id"], name: "index_oidc_authorization_scopes_on_oidc_scope_id"
  end

  create_table "oidc_authorizations", force: :cascade do |t|
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

  create_table "oidc_clients", force: :cascade do |t|
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

  create_table "oidc_id_token_request_objects", force: :cascade do |t|
    t.bigint "oidc_id_token_id"
    t.bigint "oidc_request_object_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["oidc_id_token_id"], name: "index_oidc_id_token_request_objects_on_oidc_id_token_id"
    t.index ["oidc_request_object_id"], name: "index_oidc_id_token_request_objects_on_oidc_request_object_id"
  end

  create_table "oidc_id_tokens", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "oidc_client_id"
    t.string "nonce"
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["oidc_client_id"], name: "index_oidc_id_tokens_on_oidc_client_id"
    t.index ["user_id"], name: "index_oidc_id_tokens_on_user_id"
  end

  create_table "oidc_request_objects", force: :cascade do |t|
    t.text "jwt_string"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "oidc_scopes", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_oidc_scopes_on_name", unique: true
  end

  create_table "options", force: :cascade do |t|
    t.integer "desired_activity_id"
    t.integer "activity_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "deleted_at"
    t.index ["activity_id"], name: "index_options_on_activity_id"
    t.index ["desired_activity_id"], name: "index_options_on_desired_activity_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name"
    t.string "reg_number"
    t.jsonb "tax_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "packs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "activity_ref_pricing_id", null: false
    t.bigint "season_id", null: false
    t.bigint "lessons_remaining", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["activity_ref_pricing_id"], name: "index_packs_on_activity_ref_pricing_id"
    t.index ["season_id"], name: "index_packs_on_season_id"
    t.index ["user_id"], name: "index_packs_on_user_id"
  end

  create_table "parameters", force: :cascade do |t|
    t.string "label"
    t.string "value"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "value_type", default: "string"
  end

  create_table "payer_payment_terms", force: :cascade do |t|
    t.integer "day_for_collection"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.datetime "deleted_at"
    t.bigint "payer_id", null: false
    t.bigint "payment_schedule_options_id", null: false
    t.bigint "season_id", null: false
    t.bigint "payment_method_id"
    t.index ["payer_id"], name: "index_payer_payment_terms_on_payer_id"
    t.index ["payment_method_id"], name: "index_payer_payment_terms_on_payment_method_id"
    t.index ["payment_schedule_options_id"], name: "index_payer_payment_terms_on_payment_schedule_options_id"
    t.index ["season_id"], name: "index_payer_payment_terms_on_season_id"
  end

  create_table "payment_methods", force: :cascade do |t|
    t.string "label"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "is_special"
    t.boolean "is_credit_note", default: false
    t.boolean "built_in", default: false
    t.boolean "show_payment_method_to_user", default: false
  end

  create_table "payment_schedule_options", force: :cascade do |t|
    t.string "label"
    t.integer "payments_number"
    t.jsonb "payments_months"
    t.jsonb "available_payments_days"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.datetime "deleted_at"
    t.bigint "pricing_category_id"
    t.integer "index"
    t.index ["pricing_category_id"], name: "index_payment_schedule_options_on_pricing_category_id"
  end

  create_table "payment_schedule_statuses", force: :cascade do |t|
    t.string "label"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "payment_schedules", force: :cascade do |t|
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

  create_table "payment_statuses", force: :cascade do |t|
    t.string "label"
    t.string "color"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "built_in", default: false
  end

  create_table "payments", force: :cascade do |t|
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

  create_table "planning_conflicts", force: :cascade do |t|
    t.bigint "planning_id"
    t.bigint "conflict_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["conflict_id"], name: "index_planning_conflicts_on_conflict_id"
    t.index ["planning_id"], name: "index_planning_conflicts_on_planning_id"
  end

  create_table "plannings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.float "hours_count", default: 0.0
    t.boolean "is_locked", default: false
    t.index ["user_id"], name: "index_plannings_on_user_id"
  end

  create_table "plugins", id: :serial, force: :cascade do |t|
    t.string "name", limit: 30, default: "", null: false
    t.string "download_gem_link"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.datetime "activated_at"
    t.boolean "hidden", default: false, null: false
    t.string "display_name"
    t.string "author"
    t.string "description"
    t.string "tag"
    t.string "url"
    t.string "author_url"
    t.string "partial"
    t.string "image"
    t.string "logo"
  end

  create_table "practice_room_parameters", force: :cascade do |t|
    t.integer "room_id"
    t.time "duration"
    t.integer "practice_room_planning_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "practice_room_plannings", force: :cascade do |t|
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

  create_table "practice_sessions", force: :cascade do |t|
    t.integer "band_id"
    t.integer "time_interval_id"
    t.integer "room_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "pre_application_activities", force: :cascade do |t|
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

  create_table "pre_application_desired_activities", force: :cascade do |t|
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

  create_table "pre_applications", force: :cascade do |t|
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "season_id"
    t.index ["user_id"], name: "index_pre_applications_on_user_id"
  end

  create_table "pricing_categories", force: :cascade do |t|
    t.string "name", null: false
    t.integer "number_lessons"
    t.boolean "is_a_pack", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "questions", force: :cascade do |t|
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

  create_table "room_activities", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "room_id"
    t.bigint "activity_ref_id"
    t.index ["activity_ref_id"], name: "index_room_activities_on_activity_ref_id"
    t.index ["room_id"], name: "index_room_activities_on_room_id"
  end

  create_table "room_features", force: :cascade do |t|
    t.string "name"
    t.boolean "active", default: false
  end

  create_table "room_room_features", force: :cascade do |t|
    t.bigint "room_id"
    t.bigint "room_features_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["room_features_id"], name: "index_room_room_features_on_room_features_id"
    t.index ["room_id"], name: "index_room_room_features_on_room_id"
  end

  create_table "rooms", force: :cascade do |t|
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

  create_table "schools", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.bigint "address_id"
    t.string "phone_number"
    t.string "email"
    t.string "logo"
    t.string "academy"
    t.string "zone"
    t.string "siret_rna"
    t.string "legal_entity"
    t.bigint "planning_id"
    t.boolean "entity_subject_to_vat", default: false
    t.boolean "activities_not_subject_to_vat", default: false
    t.string "rcs"
    t.index ["address_id"], name: "index_schools_on_address_id"
    t.index ["planning_id"], name: "index_schools_on_planning_id"
  end

  create_table "seasons", force: :cascade do |t|
    t.string "label"
    t.datetime "start"
    t.datetime "end"
    t.boolean "is_current"
    t.boolean "is_off"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "closing_date_for_applications"
    t.integer "nb_lessons", default: 31
    t.datetime "opening_date_for_applications"
    t.datetime "opening_date_for_new_applications"
    t.datetime "date_for_teacher_planning_validation"
    t.bigint "next_season_id"
    t.index ["next_season_id"], name: "index_seasons_on_next_season_id"
  end

  create_table "settings", id: :serial, force: :cascade do |t|
    t.string "name", limit: 100, default: "", null: false
    t.text "value"
  end

  create_table "student_attendances", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "activity_instance_id"
    t.integer "attended"
    t.text "comment"
    t.boolean "is_option", default: false
    t.boolean "is_pack", default: false
    t.index ["id"], name: "index_student_attendances_on_id"
    t.index ["user_id", "activity_instance_id"], name: "index_student_attendances_on_user_id_and_activity_instance_id"
  end

  create_table "student_evaluations", force: :cascade do |t|
    t.bigint "activity_id"
    t.bigint "teacher_id"
    t.bigint "student_id"
    t.bigint "season_id"
  end

  create_table "students", force: :cascade do |t|
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

  create_table "teacher_seasons", force: :cascade do |t|
    t.bigint "season_id", null: false
    t.bigint "user_id", null: false
    t.index ["season_id", "user_id"], name: "index_teacher_seasons_on_season_id_and_user_id"
  end

  create_table "teachers_activities", id: false, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "activity_id", null: false
    t.boolean "is_main"
    t.index ["activity_id"], name: "index_teachers_activities_on_activity_id"
    t.index ["user_id"], name: "index_teachers_activities_on_user_id"
  end

  create_table "teachers_activity_instances", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "activity_instance_id", null: false
    t.boolean "is_main"
  end

  create_table "teachers_activity_refs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "activity_ref_id"
    t.bigint "user_id"
    t.index ["activity_ref_id"], name: "index_teachers_activity_refs_on_activity_ref_id"
    t.index ["user_id"], name: "index_teachers_activity_refs_on_user_id"
  end

  create_table "telephones", force: :cascade do |t|
    t.string "number"
    t.string "label"
    t.bigint "phonable_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "phonable_type"
    t.index ["phonable_id"], name: "index_telephones_on_phonable_id"
  end

  create_table "time_interval_preferences", force: :cascade do |t|
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

  create_table "time_intervals", force: :cascade do |t|
    t.datetime "start"
    t.datetime "end"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "kind"
    t.boolean "is_validated", default: false
  end

  create_table "time_slots", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "time_interval_id"
    t.bigint "planning_id"
    t.index ["planning_id"], name: "index_time_slots_on_planning_id"
    t.index ["time_interval_id"], name: "index_time_slots_on_time_interval_id"
  end

  create_table "user_addresses", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "address_id", null: false
  end

  create_table "users", force: :cascade do |t|
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
    t.serial "adherent_number", null: false
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
    t.bigint "organization_id"
    t.boolean "is_creator", default: false
    t.string "identification_number"
    t.bigint "attached_to_id"
    t.index ["address_id"], name: "index_users_on_address_id"
    t.index ["attached_to_id"], name: "index_users_on_attached_to_id"
    t.index ["authentication_token"], name: "index_users_on_authentication_token", unique: true
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["deleted_at"], name: "index_users_on_deleted_at"
    t.index ["email", "adherent_number"], name: "index_users_on_email_and_adherent_number", unique: true
    t.index ["email"], name: "index_users_on_email"
    t.index ["evaluation_level_ref_id"], name: "index_users_on_evaluation_level_ref_id"
    t.index ["identification_number"], name: "index_users_on_identification_number", unique: true
    t.index ["organization_id"], name: "index_users_on_organization_id"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "users_instruments", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "instrument_id"
  end

  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "activity_instances", "activities"
  add_foreign_key "activity_instances", "locations"
  add_foreign_key "activity_instances", "rooms"
  add_foreign_key "activity_instances", "time_intervals"
  add_foreign_key "activity_ref_pricings", "activity_refs"
  add_foreign_key "activity_ref_pricings", "pricing_categories"
  add_foreign_key "activity_ref_pricings", "seasons", column: "from_season_id"
  add_foreign_key "activity_ref_pricings", "seasons", column: "to_season_id"
  add_foreign_key "activity_refs", "activity_ref_kinds"
  add_foreign_key "adhesion_prices", "seasons"
  add_foreign_key "adhesions", "adhesion_prices"
  add_foreign_key "bands", "band_types"
  add_foreign_key "bands", "music_genres"
  add_foreign_key "consent_document_users", "consent_documents"
  add_foreign_key "consent_document_users", "users"
  add_foreign_key "desired_activities", "pricing_categories", on_delete: :restrict
  add_foreign_key "discounts", "coupons"
  add_foreign_key "due_payments", "payment_schedules"
  add_foreign_key "error_histories", "error_codes"
  add_foreign_key "evaluation_appointments", "activity_applications"
  add_foreign_key "export_templates", "users"
  add_foreign_key "holidays", "seasons"
  add_foreign_key "levels", "seasons"
  add_foreign_key "packs", "activity_ref_pricings"
  add_foreign_key "packs", "seasons"
  add_foreign_key "packs", "users"
  add_foreign_key "payer_payment_terms", "payment_methods"
  add_foreign_key "payer_payment_terms", "payment_schedule_options", column: "payment_schedule_options_id"
  add_foreign_key "payer_payment_terms", "seasons"
  add_foreign_key "payer_payment_terms", "users", column: "payer_id"
  add_foreign_key "payment_schedule_options", "pricing_categories"
  add_foreign_key "planning_conflicts", "conflicts"
  add_foreign_key "planning_conflicts", "plannings"
  add_foreign_key "room_room_features", "room_features", column: "room_features_id"
  add_foreign_key "room_room_features", "rooms"
  add_foreign_key "rooms", "locations"
  add_foreign_key "schools", "plannings"
  add_foreign_key "seasons", "seasons", column: "next_season_id"
  add_foreign_key "time_interval_preferences", "activity_applications"
  add_foreign_key "time_interval_preferences", "activity_refs"
  add_foreign_key "time_interval_preferences", "seasons"
  add_foreign_key "time_interval_preferences", "time_intervals"
  add_foreign_key "time_interval_preferences", "users"
  add_foreign_key "users", "organizations"
  add_foreign_key "users", "users", column: "attached_to_id"
end
