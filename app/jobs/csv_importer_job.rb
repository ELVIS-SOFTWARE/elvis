# frozen_string_literal: true

class CsvImporterJob < ApplicationJob
  include ActiveJob::Status

  def perform(file_path, handler_class_name)
    status[:step] = "Initialisation"

    setup file_path, handler_class_name

    # on compte le nombre de lignes du fichier pour pouvoir afficher la progression
    count = 0
    CSV.foreach(@file_path, "r:bom|UTF-8", col_sep: ";") { count += 1 }
    progress.total = count

      # démarrer l'importation
    import_csv
  end

  private

  def setup(file_path, handler_class_name)
    @file_path = file_path

    begin
      import_handler_class = handler_class_name.constantize
      @import_handler = import_handler_class.new
    rescue NameError => e
      Rails.logger.error "Handler class not found: #{e.message}\n#{e.backtrace&.join("\n")}"
      return { status: :unprocessable_entity, error: "Le handler spécifié est introuvable." }
    rescue StandardError => e
      Rails.logger.error "Error initializing handler: #{e.message}\n#{e.backtrace&.join("\n")}"
      return { status: :unprocessable_entity, error: "Une erreur est survenue lors de l'initialisation du handler." }
    end
  end

  def import_csv

    # utiliser le module CSV pour lire la première ligne et obtenir les en-têtes
    # utiliser le séparateur ; pour les fichiers CSV
    begin
      headers = CSV.open(@file_path, "r:bom|UTF-8", col_sep: ";", &:readline).map(&:strip)
    rescue StandardError => e
      Rails.logger.error "Could not import activity applications : #{e.message}\n#{e.backtrace&.join("\n")} "
      return { status: :unprocessable_entity, error: "Le format du fichier ne convient pas. Veuillez importer
      un fichier au format CSV." }
    end

    # vérifier que les en-têtes sont corrects
    unless @import_handler.check_valid_headers(headers)
      Rails.logger.error "Could not import activity applications : headers do not match expected headers."
      return { status: :unprocessable_entity, error: "Le fichier CSV n'a pas les en-têtes attendus." }
    end

    # lire le reste du fichier
    csv = CSV.open(@file_path, "r:bom|UTF-8", col_sep: ";", headers: true)

    current_line = 0
    total_activity_applications_created = 0
    total_ignored_activities = 0
    errors = []

    # itérer sur chaque ligne
    csv.each do |row|
      current_line += 1

      begin

        res = @import_handler.handle_row(row, current_line)
        total_ignored_activities += res[:ignored_activities]
        total_activity_applications_created += res[:activity_applications_created]
        errors += res[:errors]
        status[:step] = "#{current_line} lignes traitées"

      rescue StandardError => e
        Rails.logger.error "Error while handling line #{current_line} : #{e.message}\n#{e.backtrace&.join("\n")} "
        errors << { line: current_line, message: e.message }
      ensure
        progress.increment
      end

    end

    message = "#{current_line} lignes traitées - #{total_activity_applications_created} inscriptions créées et #{total_ignored_activities} inscriptions existantes ignorées."
    status[:step] = message
    status[:errors] = errors

    progress.finish
  end

end
