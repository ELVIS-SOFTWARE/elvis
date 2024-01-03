#delete user nil in level
ActiveRecord::Base.transaction do
  nil_user = Level.where(user_id: nil)

  nil_user.delete_all

  #update level season_id
  before_updated = Level.where(season_id: nil).order(id: :asc).to_a

  level_nil = before_updated.dup

  list_updated =[]
  level_nil.each do |ln|

    s = Season.where( "? >= seasons.start AND ? <= seasons.end", ln.updated_at, ln.updated_at )
    if s.empty?
      next_season = Season.where("seasons.start > ?",ln.updated_at).order(start: :asc)

      list_updated.push(  { id: ln.id, evaluation_level_ref_id: ln.evaluation_level_ref_id, activity_ref_id: ln.activity_ref_id,
                            user_id: ln.user_id, created_at: ln.created_at.to_s, updated_at: ln.updated_at.to_s,
                            season_id: ln.season_id, can_continue: ln.can_continue})
      ln.season_id = next_season[0].id

      ln.save(:validate => false)
    else
      list_updated.push(  { id: ln.id, evaluation_level_ref_id: ln.evaluation_level_ref_id, activity_ref_id: ln.activity_ref_id,
                            user_id: ln.user_id, created_at: ln.created_at.to_s, updated_at: ln.updated_at.to_s,
                            season_id: ln.season_id, can_continue: ln.can_continue})
      ln.season_id=s[0].id

      ln.save(:validate => false)
    end
  end

  #doublon

  test3 = Level.all.to_a


  list_double =[]
  test3.each_with_index do |t, index|
    if test3.select {|test| test.user_id == t.user_id && test.activity_ref_id == t.activity_ref_id && test.season_id == t.season_id}.length > 1
      list_double << t.id
    end
  end

  list_double = Level.where(id: list_double).to_a

  list_uniq = list_double.uniq { |e| [e.user_id, e.activity_ref_id, e.evaluation_level_ref_id, e.season_id] }

  list_delete_double = list_double-list_uniq

  list_delete=[]
  list_delete_double.each do |ldd|
    ldd.destroy
    list_delete.push({ id: ldd.id, evaluation_level_ref_id: ldd.evaluation_level_ref_id, activity_ref_id: ldd.activity_ref_id,
                       user_id: ldd.user_id, created_at: ldd.created_at.to_s, updated_at: ldd.updated_at.to_s,
                       season_id: ldd.season_id, can_continue: ldd.can_continue})
  end

  #delete
  list_uniq.each do |t|
    double = list_uniq.select {|test| test.user_id == t.user_id && test.activity_ref_id == t.activity_ref_id && test.season_id == t.season_id}

    test = false
    double.each{|d| test = d.destroyed? if d.destroyed? == true}

    if double.length > 1 && !test
      double = double.sort_by{|d| d.updated_at}
      double.delete(double.last)

      double.each do |d|
        d.destroy
        list_delete.push({ id: d.id, evaluation_level_ref_id: d.evaluation_level_ref_id, activity_ref_id: d.activity_ref_id,
                           user_id: d.user_id, created_at: d.created_at.to_s, updated_at: d.updated_at.to_s,
                           season_id: d.season_id, can_continue: d.can_continue})
      end

    end
  end

  #LOGS

  File.open("updated_rows.txt", "w") do |f|
    f.write(list_updated)
  end

  File.open("deleted_rows.txt", "w") do |f|
    f.write(list_delete)
  end
end