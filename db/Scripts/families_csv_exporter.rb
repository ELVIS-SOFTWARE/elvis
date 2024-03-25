# frozen_string_literal: true

class FamiliesCsvExporter
  def initialize
    @season = Season.current
    @activities = Activity.for_season(@season)
    @activities_ids = @activities.map { |activity| activity.id }
  end

  def call
    #pass1
    pass2
  end

  def pass1
    # Passe 1 :
    # regrouper tous les utilisateurs qui possèdent la même adresse e-mail

    dupl_emails = find_duplicate_emails @activities_ids

    # open a file for csv output
    CSV.open("tmp/duplicates.csv", "wb:UTF-8", col_sep: ';') do |csv|
      csv << ["id", "first_name", "last_name", "email", "age", "is_paying", "payers", "payees", "is_student_for_season", "attach_to", "ambiguous", "step"]

      dupl_emails.each do |email|
        next unless email.present?

        users_list = handle_duplicate_email(email, 1)
        # output to csv
        users_list.each do |user|
          csv << [
            user[:id],
            user[:first_name],
            user[:last_name],
            user[:email],
            user[:age],
            user[:is_paying],
            user[:payers]&.join(','),
            user[:payees]&.join(','),
            user[:is_student_for_season],
            user[:attach_to]&.join(','),
            user[:ambiguous],
            user[:step]
          ]
        end

      end

    end

  end

  def pass2

    users = User.all
    families = []

    CSV.open("tmp/families.csv", "wb:UTF-8", col_sep: ';') do |csv|
      csv << ["family_id", "id", "first_name", "last_name", "email", "age", "is_paying", "payers", "legal_referents", "payees", "is_student_for_season", "attach_to", "ambiguous", "step"]

      users.find_each do |user|

        # pour chaque user, trouver "sa" famille
        family = user.whole_family
        # derive a unique value for this family from the ids of each member
        family_id = "--" + family.map(&:id).sort.join('-') + "--"
        # if we've already processed this family, skip it
        next if families.include?(family_id)

        # otherwise, process it
        families << family_id

        # 1ère étape : pour chaque utilisateur, on liste ses payeurs, ses référents légaux et ses bénéficiaires
        # for each user in the family, find their payers and payees
        users_list = []
        qualify_users(family, users_list)

        # 2ème étape : on devine "le" compte principal pour chacun
        guess_main_account_for_family users_list

        output_family_to_csv(csv, family_id, users_list)

      end
    end

  end

  private

  def output_family_to_csv(csv, family_id, users_list)
    has_student_for_season = users_list.any? { |user| user[:is_student_for_season] }
    ambiguous = users_list.any? { |user| user[:attach_to] && user[:attach_to].size > 1 }

    # Ligne de synthèse
    csv << [
      family_id,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      has_student_for_season,
      '',
      ambiguous,
      ''
    ]

    # Lignes des utilisateurs
    users_list.each do |user|
      csv << [
        family_id,
        user[:id],
        user[:first_name],
        user[:last_name],
        user[:email],
        user[:age],
        user[:is_paying],
        user[:payers]&.join(','),
        user[:legal_referents]&.join(','),
        user[:payees]&.join(','),
        user[:is_student_for_season],
        user[:attach_to]&.join(','),
        ambiguous,
        2
      ]
    end
  end

  def qualify_users(family, users_list)
    family.each do |user|
      payers = user.get_users_paying_for_self(@season).pluck(:id)
      legal_referents = user.get_legal_referent_users(@season).pluck(:id)
      payees = user.get_users_self_is_paying_for(@season).pluck(:id)
      users_list << {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        age: user.age,
        is_paying: user.is_paying,
        payers: payers,
        legal_referents: legal_referents,
        payees: payees,
        is_student_for_season: Student.where(user_id: user.id, activity_id: @activities_ids).exists?,
        step: 2
      }
    end
  end

  def guess_main_account_for_family(users_list)
    # lister les payeurs de la famille
    payers = users_list
               .map { |user| user[:payers] }
               .flatten
               .compact
               .uniq

    # lister les responsables légaux de la famille
    legal_referents = users_list
                        .map { |user| user[:legal_referents] }
                        .flatten
                        .compact
                        .uniq

    # les comptes de rattachement potentiels sont, avant tout, les payeurs
    # s'il n'y a pas de payeur, on prend les responsables légaux
    main_accounts = payers.present? ? payers : legal_referents

    # on va chercher un compte de rattachement pour les utilisateurs
    users_list.each do |user|
      next if main_accounts.size == 1 && main_accounts.include?(user[:id])

      user[:attach_to] = main_accounts
    end
  end

  def find_duplicate_emails(activities_ids = nil)
    users = User.all

    if activities_ids.present?
      sql = <<-SQL
          SELECT email
          FROM users
          where id in (select distinct user_id
                       from students
                       WHERE students.activity_id IN
                             (#{activities_ids.join(',')}))
          GROUP BY email
          HAVING count(email) > 1
      SQL

    else
      sql = <<-SQL
          SELECT email
          FROM users
          GROUP BY email
          HAVING count(email) > 1
      SQL
    end

    ActiveRecord::Base.connection
                      .execute(sql)
                      .pluck 'email'
  end

  def guess_main_account_for_dupl_email(users_list)
    # la "meilleure" hypothèse de compte principal
    # est l'un des comptes portant la meme adresse email
    # qui est un payeur
    # s'il y a plusieurs payeurs, on ne prend pas de décision
    payers = users_list
               .select { |user| user[:payees].present? }
               .map { |user| user[:id] }
               .flatten
               .compact
               .uniq

    users_list.each do |user|
      user[:attach_to] = payers
    end
  end

  def handle_duplicate_email(email, step)
    # Lister les utilisateurs :
    users = User.where(email: email)
    main_accounts = []

    # 1ere etape : pour chaque utilisateur, on liste ses payeurs et ses bénéficiaires
    users_list = users.map { |user|
      payers = user.get_users_paying_for_self(@season).pluck(:id)
      payees = user.get_users_self_is_paying_for(@season).pluck(:id)

      main_accounts << payers

      {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        age: user.age,
        is_paying: user.is_paying,
        payers: payers,
        payees: payees,
        is_student_for_season: Student.where(user_id: user.id, activity_id: @activities_ids).exists?,
        step: step
      }
    }

    # 2eme etape : on devine le compte principal
    guess_main_account_for_dupl_email users_list

    users_list

    # Identifier les actifs = inscrit en 2023 ou payeur d'un inscrit en 2023
    # Rattacher les inscrits au payeur s'il n'y en a qu'un seul ; sinon, proposer les 2 au CEM
    # Si pas de payeur, l’indiquer (c’est sans doute un auto-payeur)
    # Pour les utilisateurs non-inscrits en 2023 et non payeurs en 2023 : même méthode

  end
end
