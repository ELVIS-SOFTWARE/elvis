module Users
  require "date"
  require "rchardet"
  require "acsv-p"

  class CsvImportHandler

    MANDATORY_VALUES = ["Prenom", "Nom", "Date de naissance", "Email"].freeze
    MANDATORY_HEADERS = ["Prenom", "Nom", "Date de naissance", "Email", "Adresse", "Code postal", "Ville", "Telephone", "Role"].freeze

    def initialize
      @import_report = {
        lines_imported: 0,
        errors: Hash.new { |hash, key| hash[key] = { :lines => [], :message => [] } }
      }
    end

    def valid_date?(date)
      dateFormat = "%d-%m-%Y"
      DateTime.strptime(date, dateFormat)
      true
    rescue ArgumentError
      false
    end

    def addMessageReport(key, message, line)
      @import_report[:errors][key][:lines].push(line)

      if @import_report[:errors][key][:message].empty?
        @import_report[:errors][key][:message].push(message)
      end
    end

    def addErrorRow(errorType, message)
      @row_result.has_key?(errorType) ? @row_result[errorType] += " #{message}" : @row_result[errorType] = message
    end

    def analyse_field(header, field, line)

      if field.nil?
        if MANDATORY_VALUES.any? header
          addErrorRow("Une ou plusieurs valeurs obligatoires sont manquantes", "Les valeurs obligatoires sont celles du nom, du prénom, de la date de naissance et de l'adresse mail de votre utilisateur.")
          return
        else
          field = ""
        end
      else
        field = field.gsub(/\A[[:space:]]+|[[:space:]]+\z/, '')
        if field.empty? && MANDATORY_VALUES.any?(header)
          addErrorRow("Une ou plusieurs valeurs obligatoires sont manquantes", "Les valeurs obligatoires sont celles du nom, du prénom, de la date de naissance et de l'adresse mail de votre utilisateur.")
        end
      end

      if header == "Email" && !field.match(URI::MailTo::EMAIL_REGEXP)
        addErrorRow("Une ou plusieurs adresses email sont invalides", "Veuillez vérifier l'adresse email renseignée.")
      end

      if header == "Telephone" && field.present? && Phonelib.invalid?(field)
        addErrorRow("Un ou plusieurs numéros de téléphone sont invalides", "Veuillez vérifier les numéros de téléphone concernés.")
      end

      if header == "Date de naissance" && field.present?
        field = field.gsub("/", "-")
        if !valid_date?(field)
          addErrorRow("Une ou plusieurs dates de naissance sont invalides", "Une date de naissance valide suit le format suivant: jour-mois-année.")
        elsif Date.parse(field) > Date.today
          addErrorRow("Une ou plusieurs dates de naissance sont invalides", "Une date de naissance valide doit forcément précéder la date actuelle.")
        end
      end

      if header == 'Role'
        if field != "administrateur" && field != "professeur" && field.present?
          addErrorRow("Un ou plusieurs rôles sont invalides", "Le rôle renseigné est invalide. Les options sont soit 'administrateur', soit 'professeur', dans tout autre cas laissez le champ vide.")
        end
      end
    end

    def import_users(file)
      csv_data = ACSV::CSV.read file.path

      # on récupère puis on prépare les en-têtes
      headers = csv_data.shift
      headers.map! { |h| (h.strip! || h).capitalize }

      if headers.sort != MANDATORY_HEADERS.sort.map { |h| h.capitalize }
        addMessageReport("Un ou plusieurs en-têtes sont manquant(s) ou invalide(s)", "Les en-têtes doivent être: Prenom, Nom, Date de naissance, Email, Adresse, Code postal, Ville, Telephone, Role.", 0)
        return @import_report[:errors]
      end

      string_data = csv_data
      line_nb = string_data.length
      hash_of_arrays = Hash.new

      if string_data.present?
        headers.each_with_index do |s, i|
          hash_of_arrays[s] = []
          string_data.each do |line|
            hash_of_arrays[s] << line[i]
          end
        end

        for l in 0...line_nb
          @row_result = Hash.new
          keys = hash_of_arrays.keys

          for c in 0...keys.length
            analyse_field(keys[c], hash_of_arrays[keys[c]][l], l)
          end

          if @row_result.empty?
            user = User.new({
                              birthday: hash_of_arrays['Date de naissance'][l],
                              first_name: hash_of_arrays['Prenom'][l],
                              last_name: hash_of_arrays['Nom'][l],
                              email: hash_of_arrays['Email'][l],
                              is_admin: (hash_of_arrays['Role'][l] == "administrateur"),
                              is_teacher: (hash_of_arrays['Role'][l] == "professeur")
                            })

            user.telephones << Telephone.new({ number: hash_of_arrays['Telephone'][l] })

            user.addresses << Address.new({ city: hash_of_arrays['Ville'][l],
                                            postcode: hash_of_arrays['Code postal'][l],
                                            street_address: hash_of_arrays['Adresse'][l] })

            user.planning = Planning.create

            res = user.save
            if res
              @import_report[:lines_imported] += 1
            else
              addMessageReport("Enregistrement annulé", user.errors.full_messages, l + 2)
            end
          else
            @row_result.each do |key, value|
              value += "\n"
              addMessageReport(key, value, l + 2)
            end
          end
        end
      else
        addMessageReport("Le fichier est vide", "Aucune valeur n'a été trouvée.", 0)
      end

      @import_report

    rescue StandardError => e
      Rails.logger.error(e.message, e.backtrace)

      @import_report[:errors][:error][:message] = "Une erreur inconnue est survenue"
      @import_report[:errors][:error][:lines] = []

      @import_report
    end
  end
end
