module ActivityApplications

  class TesImportHandler
    def initialize

    end

    def check_valid_headers(headers)
      headers == AA_CSV_HEADERS
    end

    def handle_row(row, current_line)
      ignored_activities = 0
      activity_applications_created = 0
      errors = []

      ActivityApplication.transaction do
        # Etape 1 : création / mise à jour de l'utilisateur sur la base de l'email
        user = User.where("LOWER(email) = ?", row["email"].downcase).first_or_initialize

        # duplicate user if first_name or last_name is modified after import
        # not possible to prevent duplicates with provided data
        # If duplicate user is created, use merge tool to merge them
        if user.id.positive? && (user.first_name != row["prenom"] || user.last_name != row["nom"])
          user = User.new(
            email: nil,
            attached_to_id: user.id,
          )
        else
          user.email = row["email"].downcase
        end

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
        default_aa_status = Parameter.find_by(label: "activityApplication.default_status")&.parse
        initial_aa_status = ActivityApplicationStatus.find(default_aa_status&.positive? ? default_aa_status : ActivityApplicationStatus::TREATMENT_PENDING_ID)

        3.times do |i|
          # 2.1 Détermination de l'activité souhaitée
          activite = row["activite_#{i + 1}"]
          instrument = row["instrument_#{i + 1}"]
          next if activite.nil?

          activity_refs_and_level = guess_activity_ref_and_level activite, instrument

          activity_refs_and_level.each do |activity_ref_and_level|
            activity_ref_id, instrument_names, is_workshop, level = activity_ref_and_level.values_at(:activity_ref_id, :instrument_names, :is_workshop, :level)

            if activity_ref_id.nil?
              errors << { line: current_line, message: "Impossible d'identifier l'activité demandée par l'élève dans le référentiel d'activités (#{activite} / #{instrument})" }
              next
            end

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

            # S'il existe déjà une inscription pour cette activité et pour la saison concernée, on ne la recrée pas
            if user.activity_applications.any? { |aa|
              aa.season_id == Season.current_apps_season.id &&
                aa.activity_refs.any? { |ar| ar.id == activity_ref_id }
            }
              ignored_activities += 1
              next
            end

            # 2.2 Création d'une inscription pour cette activité
            activity_application = ActivityApplication.create!(
              user: user,
              activity_application_status: initial_aa_status,
              season: Season.current_apps_season,
              begin_at: Season.current_apps_season.start
            )
            activity_application.add_activity activity_ref_id

            activity_application.created_at = row["date_insc"].to_date if row["date_insc"].present?

            # 2.3 Ajout des commentaires
            activity_application.comments << Comment.new(user_id: user.id, content: row["observations"]) if row["observations"].present?
            activity_application.comments << Comment.new(user_id: user.id, content: "Instrument(s) : #{instrument_names}") if is_workshop
            activity_application.save!

            activity_applications_created += 1
          end

        end

      rescue StandardError => e
        Rails.logger.error "Error while handling line #{current_line} : #{e.message}\n#{e.backtrace&.join("\n")} "
        errors << { line: current_line, message: e.message }
      end

      {
        ignored_activities: ignored_activities,
        activity_applications_created: activity_applications_created,
        errors: errors
      }
    end

    private

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

    def get_clean_phone(phone_number, label, user)
      return if phone_number.nil?
      return if phone_number.downcase == "n/a"

      phone_number = phone_number.phony_formatted normalize: :FR

      Telephone.new(number: phone_number, label: label) if user.telephones.none? { |t| t.number == phone_number }
    end

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

      #----------------------------------------------------------
      # si instrument est présent, il détermine la famille d'activité
      #----------------------------------------------------------
      if instrument.present?
        # au préalable, nettoyer en extrayant le niveau
        match_data = instrument.match(/(?<ark_name>[^\(]+)(\((?<level>(\d+)\s+ans?)\))?/)
        return [] if match_data.nil?

        instrument_names = match_data[:ark_name].strip
        level = match_data[:level]

        if activite == "Atelier"
          activity_ref_kind = ActivityRefKind
                                .where("lower(name) = ?", "atelier")
                                .first
          return [] if activity_ref_kind.nil?
          ar_label = "atelier"
          return [{
                    activity_ref_id: ActivityRef
                                       .where('lower(label) = ?', ar_label)
                                       .where(activity_ref_kind: activity_ref_kind)
                                       .pick(:id),

                    instrument_names: instrument_names,
                    is_workshop: activity_ref_kind.name == "Atelier",
                    level: level
                  }]

        else
          res = []
          instrument_names.split(",").map(&:strip).each do |instrument_name|
            activity_ref_kind = ActivityRefKind
                                  .where("lower(name) = ?", instrument_name.downcase)
                                  .first
            return [] if activity_ref_kind.nil?

            # activite détermine alors l'activité dans cette famille
            # au préalable, extraite la durée de l'activité
            match_data = activite.match(/(?<ar_name>[^\d]+)((?<duration>\d+)\s+mn)?/)
            return [] if match_data.nil?

            ar_label = "#{activity_ref_kind.name.strip.downcase} - #{match_data[:ar_name].strip.downcase}"
            ar_label += " - #{match_data[:duration]} minutes" if match_data[:duration].present?

            res << {
              activity_ref_id: ActivityRef
                                 .where('lower(label) = ?', ar_label)
                                 .where(activity_ref_kind: activity_ref_kind)
                                 .pick(:id),
              level: level
            }
          end
          return res

        end

        #----------------------------------------------------------
        # Si pas d'instrument
        #----------------------------------------------------------
      else

        # Définir une structure de données pour les cas possibles
        cases = [
          { match: /eveil musical/i, ark_name: "eveil musical 5-7 ans", label: "eveil musical (5 à 7 ans)" },
          { match: /chorale musiques actuelles/i, ark_name: "chant", label: "chorale musiques actuelles ados / adultes" },
          { match: /solfège gratuit/i, ark_name: "solfège", label: "solfège gratuit (mercredi 14h-15h)" },
          { match: /solfège en ligne/i, ark_name: "solfège", label: "solfège en ligne" },
        ]

        # Itérer sur les cas
        ar_label = nil
        cases.each do |case_data|
          if activite.match(case_data[:match])
            activity_ref_kind = ActivityRefKind.where("lower(name) = ?", case_data[:ark_name]).first
            return [] if activity_ref_kind.nil?
            ar_label = case_data[:label]
            break
          end
        end

        # quand on n'a trouvé aucune correspondance, on essaie d'autres patterns
        if ar_label.nil?

          # c'est peut-être un cours collectif
          # dans ce cas, activite est de la forme "Cours collectif <instrument>"
          # on extrait l'instrument
          if !!(match_data = activite.match(/Cours collectif\s+(?<ark_name>\w+)/))
            activity_ref_kind = ActivityRefKind
                                  .where("lower(name)= ?", match_data[:ark_name])
                                  .first
            return [] if activity_ref_kind.nil?

            # on renvoie l'activité cours collectif de cet instrument
            ar_label = "#{match_data[:ark_name].strip.downcase} - cours collectif"

            # sinon c'est peut-être un cours duo
            # dans ce cas, activite est de la forme "Cours duo <instrument>"
            # on extrait l'instrument
          elsif !!(match_data = activite.match(/Cours duo\s+(?<ark_name>\w+)/))
            activity_ref_kind = ActivityRefKind
                                  .where("lower(name)= ?", match_data[:ark_name])
                                  .first
            return [] if activity_ref_kind.nil?

            # on renvoie l'activité cours duo de cet instrument
            ar_label = "#{match_data[:ark_name].strip.downcase} - cours duo"

          else
            # sinon, on ne sait pas
            return []

          end
        end

        return [{
                  activity_ref_id:
                    ActivityRef
                      .where('lower(label) = ?', ar_label)
                      .where(activity_ref_kind: activity_ref_kind)
                      .pick(:id),
                  level:
                    nil
                }]

      end

      return [] if activity_ref_kind.nil?
    end
  end

end