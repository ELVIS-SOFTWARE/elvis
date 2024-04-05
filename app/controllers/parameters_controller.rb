# frozen_string_literal: true
require 'mimemagic'

class ParametersController < ApplicationController
  before_action :set_base_parameters, only: %i[index]

  # pour les plugins, il faudras faire append_before_action :method_name, only: %i[index] afin d'ajouter des catégories/params
  def index
    @parameters.each_key { |key| @parameters[key].each { |e| e[:text] = e[:text].to_s[0..(54 * 2)] } }
  end

  def school_parameters_edit
    @current_user = current_user

    @evaluation_intervals_step_parameter = Parameter.find_by(label: "INTERVAL_STEPS")
    @evaluation_intervals_step = nil

    if @evaluation_intervals_step_parameter
      @evaluation_intervals_step = JSON.parse(@evaluation_intervals_step_parameter.value)["e"]
    end

    # charger les données si elles existent
    @school_informations = School.includes(:address).first
    @school_address = @school_informations&.address
    @countries = ISO3166::Country.all_names_with_codes

    @min_score_recaptcha = Parameter.get_value("recaptcha.score_min") || 0.7
    @evaluation_interval = Parameter.get_value("INTERVAL_STEPS")
    @bank_holidays_zone = Parameter.get_value("BANK_HOLIDAYS_ZONE")
    @bank_holidays_zones = Holidays::BankHolidays::ZONES

    @zones = Holidays::SchoolHolidays.fetch_all_zones

    @zone_set_by_user = Parameter.get_value("ZONE_SET_BY_USER") || false

    authorize! :manage, @current_user.is_admin
  end

  def school_parameters_update
    school_params = params

    # save adhesion fee
    adhesion_fee = Parameter.find_or_create_by(label: "ADHESION_FEE", value_type: "float")
    adhesion_fee.value = school_params["adhesionFee"]
    adhesion_fee.save

    # save bank holidays zone
    bankHolidaysZone = Parameter.find_or_create_by(label: "BANK_HOLIDAYS_ZONE", value_type: "string")
    bankHolidaysZone.value = school_params["bankHolidaysZone"]
    bankHolidaysZone.save

    # captcha score
    min_captcha_score = Parameter.find_or_create_by label: "recaptcha.score_min", value_type: "float"
    min_captcha_score.value = school_params["recaptcha_score_min"] || 0.7
    min_captcha_score.save

    # get academy and zone
    academy = "#{params[:academy]}"
    zone = "#{params[:zone]}"

    # if front send undefined or null, we set it to empty
    %w[undefined null].each do |value|
      academy = "" if academy == value
      zone = "" if zone == value
    end

    if zone.empty? || academy.empty?
      if school_params["street"] != "" && school_params["postalCode"] != "" && school_params["city"] != ""
        address = "#{school_params["street"]} #{school_params["postalCode"]} #{school_params["city"]}"
        location = Holidays::SchoolHolidays.fetch_location_for_address(address)

        unless location.nil?
          academy = "#{Holidays::SchoolHolidays.fetch_academie_from_location(location)}"
          zone = Holidays::SchoolHolidays.new(Season.current.start.year, academy).fetch_school_zone if academy
        end
      end
    end

    # record school infos
    school = School.includes(:address).first

    if school.nil?
      new_address = Address.new({ city: school_params["city"], street_address: school_params["street"],
                                  postcode: school_params["postalCode"], country: school_params['countryCode'] })
      new_school = School.new name: school_params["schoolName"], phone_number: school_params["contactPhone"],
                              email: school_params["email"], address: new_address

      new_school.logo.attach(school_params["picture"]) if school_params[:picture] != "undefined"

      unless academy.empty?
        new_school[:academy] = academy
        new_school[:zone] = zone
      end

      new_school.save!
      school = new_school
    else
      school.name = school_params["schoolName"]
      school.phone_number = school_params["contactPhone"]
      school.email = school_params["email"]
      school.address = Address.new if school.address.nil?
      school.address.city = school_params["city"]
      school.address.street_address = school_params["street"]
      school.address.postcode = school_params["postalCode"]
      school.address.country = school_params['countryCode']

      school.siret_rna = school_params["siret_rna"]
      school.rcs = school_params["rcs"]
      school.activities_not_subject_to_vat = school_params["activities_not_subject_to_vat"] == "true"
      school.entity_subject_to_vat = school_params["entity_subject_to_vat"] == "true"

      school.logo.attach(school_params["picture"]) if school_params[:picture] != "undefined"

      unless academy.empty?
        school.academy = academy
        school.zone = zone
      end

      school.save!
      school.address.save!
    end

    set_zone_by_user_param = Parameter.find_or_create_by label: "ZONE_SET_BY_USER", value_type: "boolean"
    set_zone_by_user_param.value = (params[:zone_set_by_user] == "true").to_s
    set_zone_by_user_param.save!

    render json: { zone: zone, academy: academy, picture: school.logo.attached? ? url_for(school.logo) : nil }
  end

  def mails_parameters_edit
    @current_user = current_user

    @mail_settings = {
      from: Parameter.get_value("app.application_mailer.default_from") || "",
      address: Parameter.get_value("app.email.address") || "",
      authentication: Parameter.get_value("app.email.authentication") || "",
      domain: Parameter.get_value("app.email.domain") || ENV["SMTP_URL"] || "",
      password: Parameter.get_value("app.email.password").nil? ? "" : "*",
      port: (Parameter.get_value("app.email.port") || ENV["SMTP_PORT"] || "587").to_i,
      redirect: Parameter.get_value("app.email.redirect") || [],
      user_name: Parameter.get_value("app.email.username") || ENV["SMTP_ACCESS_KEY"] || "",
    }

    ssl_tls = Parameter.get_value("app.email.ssl_tls")
    @mail_settings['sslTls'] = true if ssl_tls=="true"

  end

  def mails_parameters_update
    settings = params[:mail_settings]

    user_name = Parameter.find_or_create_by label: "app.email.username", value_type: "string"
    password  = Parameter.find_or_create_by label: "app.email.password", value_type: "string"
    domain    = Parameter.find_or_create_by label: "app.email.domain"  , value_type: "string"
    port      = Parameter.find_or_create_by label: "app.email.port"    , value_type: "integer"
    redirect  = Parameter.find_or_create_by label: "app.email.redirect", value_type: "json"
    from      = Parameter.find_or_create_by label: "app.application_mailer.default_from", value_type: "string"
    address = Parameter.find_or_create_by label: "app.email.address", value_type: "string"
    authentication = Parameter.find_or_create_by label: "app.email.authentication", value_type: "string"
    ssl_tls = Parameter.find_or_create_by label: "app.email.ssl_tls", value_type: "string"

    user_name.value       = settings[:user_name]
    domain.value          = settings[:domain]
    port.value            = settings[:port]
    redirect.value        = (settings[:redirect] || []).to_a.map(&:to_s).filter(&:present?).to_json
    from.value            = settings[:from]
    address.value         = settings[:address]
    authentication.value  = settings[:authentication]
    ssl_tls.value         = settings[:ssl_tls] ? "true" : "false"

    password.value = settings[:password].to_s.encrypt if settings.has_key?(:password) && !settings[:password].blank?

    user_name.save!
    password.save!
    redirect.save!
    domain.save!
    port.save!
    from.save!
    address.save!
    authentication.save!
    ssl_tls.save!

    render json: { success: true }
  end

  def rules_parameters_edit
    @current_user = current_user
    @rules_url = Parameter.get_value("school.rules_of_procedure.url")
    @method_selected = Parameter.get_value("school.rules_of_procedure.method")

    blob = ActiveStorage::Blob.find_by(id: Parameter.get_value("school.rules_of_procedure.blob_id"))
    unless blob.nil?
      @pdf_file = blob.filename
      @document_url = rails_blob_url(blob, only_path: false)
    end
  end

  def rules_parameters_update
    @current_user = current_user
    @errors = []

    method_selected = Parameter.find_or_create_by(label: "school.rules_of_procedure.method", value_type: "string")
    method_selected.value = params[:selected]
    method_selected.save!

    if params[:selected] == "URL"
      if !params[:rules_url].empty?
        rules_url = Parameter.find_or_create_by(label: "school.rules_of_procedure.url", value_type: "string")
        rules_url.value = params[:rules_url]
        rules_url.save!
      else
        @errors = "L'url ne peut pas être vide"
      end
    end

    if params[:selected] == "PDF"
      if params[:document_cleared]
        rules_PDF = Parameter.find_or_create_by(label: "school.rules_of_procedure.blob_id", value_type: "int")
        rules_PDF.value = nil
        rules_PDF.save!
      end

      if !params[:document_cleared] && !params[:pdf_file]
        @errors = "ne peut pas être vide"
      end

      if params[:pdf_file]
        if params[:pdf_file] != "empty"
          if MimeMagic.by_magic(File.open(params[:pdf_file])).type == "application/pdf"
            file = params[:pdf_file].open
            blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: params[:pdf_file].original_filename)
            blob_ID = ActiveStorage::Blob.find_by(key: blob.key).id

            rules_PDF = Parameter.find_or_create_by(label: "school.rules_of_procedure.blob_id", value_type: "int")
            rules_PDF.value = blob_ID
            rules_PDF.save!
          else
            @errors = "Mauvais format"
          end
        else
          @errors = "aaa"
        end
      end
    end

    # if params[:selected] == "NIL"
    #   Parameter.destroy_by(label: "school.rules_of_procedure.url", value_type: "string")
    #   Parameter.destroy_by(label: "school.rules_of_procedure.blob_id", value_type: "int")
    # end

    puts @errors.inspect
    if @errors.empty?
      render json: { success: true }, status: 200
    else
      render json: { error: true }, status: 401
    end
  end

  def csv_parameters_edit
    @current_user = current_user

    @csv_settings = {
      col_sep: Parameter.get_value("app.csv_export.col_sep") || ";",
      encoding: Parameter.get_value("app.csv_export.encoding") || "utf-8",
    }

  end

  def csv_parameters_update
    settings = params[:csv_settings]

    separator = Parameter.find_or_create_by label: "app.csv_export.col_sep", value_type: "string"
    separator.value  = settings[:col_sep]
    separator.save!

    encoding = Parameter.find_or_create_by label: "app.csv_export.encoding", value_type: "string"
    encoding.value   = settings[:encoding]
    if Setting::ENCODINGS.include?(encoding.value)
      encoding.save!
      render json: { success: true }
    else
      render status:500, json: { success: false }
    end
  end

  private

  def set_base_parameters
    @parameters ||= {}

    @parameters[:général] ||= []
    @parameters[:personnalisation] ||= []

    @parameters[:général].prepend({
                                    title: "Votre école",
                                    text: "Définissez les informations générales de votre école: nom, adresse postale, etc.",
                                    link: url_for(action: :school_parameters_edit, only_path: true)
                                  })

    @parameters[:personnalisation].prepend({
                                             title: "Emails",
                                             text: "Paramétrez votre serveur d'envoi de mails, l'adresse de l'expéditeur et vos destinataires.",
                                             link: url_for(action: :mails_parameters_edit, only_path: true)
                                           },
                                           {
                                             title: "Exports CSV",
                                             text: "Paramétrez vos exports CSV.",
                                             link: url_for(action: :csv_parameters_edit, only_path: true)
                                           })
  end
end
