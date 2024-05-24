# frozen_string_literal: true
module ActivityApplications

  class TesImporter < CsvImporter
    def initialize(file)
      super file
    end

    def call
      # ouverture du fichier csv
      csv_file = @file

      # utiliser le module CSV pour lire la première ligne et obtenir les en-têtes
      # utiliser le séparateur ; pour les fichiers CSV
      begin
        headers = CSV.open(csv_file.path, "r:bom|UTF-8", col_sep: ";", &:readline).map(&:strip)
      rescue StandardError => e
        return { status: :unprocessable_entity, error: "Le format du fichier ne convient pas. Veuillez importer
      un fichier au format CSV." }
      end

      # vérifier que les en-têtes sont corrects par rapport à AA_CSV_HEADERS
      if headers != AA_CSV_HEADERS
        return { status: :unprocessable_entity, error: "Le fichier CSV n'a pas les en-têtes attendus." }

      end

      # lire le reste du fichier
      csv = CSV.open(csv_file.path, "r:UTF-8", col_sep: ";", headers: true)

      current_line = 1
      total_line_imported = 0
      errors = []

      # itérer sur chaque ligne
      csv.each do |row|
        ActivityApplication.transaction do
          # Etape 1 : création / mise à jour de l'utilisateur sur la base de l'email
          user = User.find_or_initialize_by(email: row["email"])
          user.first_name = row["prenom"]
          user.last_name = row["nom"]
          user.birthday = map_birthday(row["date_naissance"])
          user.sex = map_civilite_to_sex(row["civilite"])
          user.profession = row["profession"]
          # user.employer = row["employeur"]
          user.checked_gdpr = row["aut_util_img"] == "Oui"

          # enregistrement de tel_1, tel_2, tel_3 comme téléphones
          telephones = []
          telephones << get_clean_phone(row['tel_1'], "Tel 1", user)
          telephones << get_clean_phone(row['tel_2'], "Tel 2", user)
          telephones << get_clean_phone(row['tel_3'], "Tel 3", user)
          user.telephones = telephones.compact

          # enregistrement de l'adresse
          user.addresses = [Address.new(
            street_address: row["adresse"],
            postcode: row["cp"],
            city: row["ville"],
            country: "France"
          )]

          user.save!

          # Etape 2 : création de l'inscription
          default_aa_status = Parameter.find_by(label: "activityApplication.default_status")
          initial_aa_status = ActivityApplicationStatus.find(default_aa_status&.parse&.positive? ? default_aa_status.parse : ActivityApplicationStatus::TREATMENT_PENDING_ID)

          # 2.1 Détermination des activités souhaitées
          activity_ref_ids = []
          3.times do |i|
            activity_ref_and_level = guess_activity_ref_and_level row["activite_#{i + 1}"], row["instrument_#{i + 1}"]
            activity_ref_id, level = activity_ref_and_level.values_at(:activity_ref_id, :level) if activity_ref_and_level.present?

            next if activity_ref_id.nil?

            activity_ref_ids << activity_ref_id

            if level.present?
              evaluation_level_ref_id = EvaluationLevelRef
                                          .where("lower(label) = ?", level.downcase)
                                          .pick(:id)
              if evaluation_level_ref_id.present?
                user.levels <<
                  Level.new(
                    activity_ref_id: activity_ref_id,
                    evaluation_level_ref_id: evaluation_level_ref_id,
                    season_id: Season.current_apps_season.id
                  )
              end
            end
          end

          if activity_ref_ids.empty?
            errors << { line: current_line, message: "Impossible d'identifier l'activité demandée par l'élève dans le référentiel d'activités" }
            next
          end

          # 2.2 Création de l'inscription
          activity_application = ActivityApplication.create!(
            user: user,
            activity_application_status: initial_aa_status,
            season: Season.current_apps_season,
            begin_at: Season.current_apps_season.start,
          )

          # 2.3 Ajout des activités souhaitées
          activity_application.add_activities(activity_ref_ids.compact, nil, user.family)

          # 2.4 Ajout des commentaires
          content = row["observations"]
          activity_application.comments << Comment.new(user_id: user.id, content: content) if content.present?

          activity_application.save!

          total_line_imported += 1

          # TODO
          # 2.5 Faut-il créer une pre_application ??

        rescue StandardError => e
          Rails.logger.error "#{e.message}\n#{e.backtrace&.join("\n")} "
          errors << { line: current_line, message: e.message }
        end

        current_line += 1
      end

      message = "Importation terminée. #{total_line_imported} lignes importées."
      return { status: :ok, message: message, errors: errors }
    end

    private

    def get_clean_phone(phone_number, label, user)
      return if phone_number.nil?
      return if phone_number.downcase == "n/a"

      phone_number = phone_number.phony_formatted normalize: :FR

      Telephone.new(number: phone_number, label: label) if user.telephones.none? { |t| t.number == phone_number }
    end

    AA_CSV_HEADERS = %w[
num_adh
ajout_lg
date_insc
civilite
prenom
nom
adresse
cp
ville
tel_1
tel_2
tel_3
email
date_naissance
profession
employeur
activite_1
instrument_1
activite_2
instrument_2
activite_3
instrument_3
solfege_gratuit
frais_adh
frais_insc
cout_annuel
cout_trimestriel
cout_total
details_reglement
annee_ok
1er_tri_ok
2e_tri_ok
3e_tri_ok
avoir
observations
absences
inscription_cours
adherent
dispos_cours
souhaits_cours
dispos_atelier
aut_util_img
form
].freeze

    def map_civilite_to_sex(civilite)
      civilite_to_sex = {
        "M" => "M",
        "M." => "M",
        "Mr" => "M",
        "Mme" => "F",
        "Mlle" => "F"
      }

      civilite_to_sex[civilite]
    end

    def map_birthday(birthday_str)
      begin
        birthday = birthday_str.to_date
      rescue ArgumentError => e
        birthday = nil
      end
      birthday
    end

    def guess_activity_ref_and_level(activite, instrument)
      return if activite.nil?

      # instrument détermine la famille d'activité
      if instrument.present?
        # au préalable, nettoyer en extrayant le niveau
        match_data = instrument.match(/(?<ark_name>[^\(]+)(\((?<level>(\d+)\s+ans?)\))?/)
        return if match_data.nil?

        level = match_data[:level]

        activity_ref_kind = ActivityRefKind
                              .where("lower(name) = ?", match_data[:ark_name].strip.downcase)
                              .first
        return if activity_ref_kind.nil?

        # activite détermine alors l'activité dans cette famille
        # au préalable, extraite la durée de l'activité
        match_data = activite.match(/(?<ar_name>[^\d]+)((?<duration>\d+)\s+mn)?/)
        return if match_data.nil?

        ar_label = "#{activity_ref_kind.name.strip.downcase} - #{match_data[:ar_name].strip.downcase}"
        ar_label += " - #{match_data[:duration]} minutes" if match_data[:duration].present?

        return {
          activity_ref_id:
            ActivityRef
              .where('lower(label) = ?', ar_label)
              .where(activity_ref_kind: activity_ref_kind)
              .pick(:id),
          level:
            level
        }

      else
        # quand instrument est vide, on suppose que c'est un cours collectif
        # dans ce cas, activite est de la forme "Cours collectif <instrument>"
        # on extrait l'instrument
        match_data = activite.match(/Cours collectif\s+(?<ark_name>\w+)/)
        return if match_data.nil?

        activity_ref_kind = ActivityRefKind
                              .where("lower(name)= ?", match_data[:ark_name])
                              .first
        return if activity_ref_kind.nil?

        # on renvoie l'activité cours collectif de cet instrument
        ar_label = "#{match_data[:ark_name].strip.downcase} - cours collectif"
        return {
          activity_ref_id:
            ActivityRef
              .where('lower(label) = ?', ar_label)
              .where(activity_ref_kind: activity_ref_kind)
              .pick(:id),
          level:
            nil
        }

      end

      return if activity_ref_kind.nil?
    end
  end
end