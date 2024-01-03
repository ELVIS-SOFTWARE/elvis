#==============================
# Import des niveaux
#==============================
require 'csv'

# nom;prénom;Type de cours;Niveau;Changement de cours
next_season = Season.next

CSV.read("levels.csv", headers: false, col_sep: ";").each do |row|
  u = User
    .includes(:levels)
    .where("translate(LOWER(trim(users.last_name)), '-éàçäëïöüâêîôû''', ' eacaeiouaeiou') =
      translate(LOWER(trim(?)), '-éàçäëïöüâêîôû''', ' eacaeiouaeiou')
      AND translate(LOWER(trim(users.first_name)), '-éàçäëïöüâêîôû''', ' eacaeiouaeiou') =
      translate(LOWER(trim(?)), '-éàçäëïöüâêîôû''', ' eacaeiouaeiou')", row[0], row[1])
    .select{ |u| u.levels.select{ |l| l.activity_ref.kind.include?(row[2])}.any? }
    .first
  
  if !u.nil? && !row[3].nil?
    evaluation_level_ref = EvaluationLevelRef.where("translate(trim(label), '-éàçäëïöüâêîôû''', ' eacaeiouaeiou') ILIKE translate(?, '-éàçäëïöüâêîôû''', ' eacaeiouaeiou')", "%#{row[3].strip}%").first
    level = u.levels.select {|l| l.activity_ref.kind.include?(row[2]) && l.season_id != next_season.id}.first

    if evaluation_level_ref.nil?
      pp "======="
      pp "REF NOT FOUND"
      pp row
    end

    # Avoid duplicate levels
    unless level.nil?
      new_level = u.levels.select{|l| l.season == next_season && l.activity_ref.kind.include?(row[2])}.first
      found = true

      if new_level.nil? #aucun niveau existant trouvé
        found = false
        new_level = level.deep_clone
      end

      new_level.season = next_season
      case row[4]
      when "O"
          new_level.can_continue = false
      when "N"
          new_level.can_continue = true
      else
          new_level.can_continue = nil
      end
      new_level.evaluation_level_ref = evaluation_level_ref
      new_level.save
      if !found 
        u.levels << new_level
        u.save
      end
    end

    if level && !row[3] && !row[4]
      level.destroy
      pp "======="
      pp "DESTROYED"
      pp row
    end
  else
    pp "======="
    pp "NOT FOUND"
    pp row
  end
end