# frozen_string_literal: true

# ne devrais pas être utilisé si les utilisateurs font bien leurs boulot ou si la possibilité de faire ce script est intégré à ziggy pour les admins

# la saison souhaiter. Lors de la création du script c'etait la saison 2021-2022
s = Season.find(5)
holidays_dates = s.holidays.map { |h| h.date.to_date } # il faut que la liste soit à jour evidemment

# ne selectionne que les activité qui ont 1 seul instance. => on ne replique pas celle qui sont déjà répliquer
activities = Activity.joins(:time_interval).where({ time_intervals: { start: (s.start...s.end) } }).where("(select count(*) from activity_instances ai where ai.activity_id = activities.id) = 1")

# on include les dependances et on la parcourt par pacquet de 50 afin de ne pas trop surchargé le serveur
Activity.includes(:time_interval, teachers_activities: { teacher: { planning: :time_intervals } }, activity_instances: :time_interval, students: { user: { planning: :time_intervals } }).where(id: activities.ids).find_each(batch_size: 50) do |a|
  instance = a.activity_instances.first # on récupère la première instance d'activité
  d = a.time_interval.start + 1.week # on ajoute 1 semaine à la date de l'instance
  duration = a.time_interval.end - a.time_interval.start # on calcule la durée (en générale de 30min à 2h en secondes)
  instances = []

  while d <= s.end # on parcourt toutes les dates en ajoutant 1 semaines à chaque fois. Jusqu'as la fin de la saison
    if holidays_dates.include?(d.to_date) # si jours de vacances, on passe
      d += 1.week
      next
    end

    new_instance = instance.dup # on duplique l'instance pour ne pas avoir à réécrire toutes les infos
    new_instance.time_interval = instance.time_interval.dup # pareil
    new_instance.time_interval.start = d # on met la date qui change à chaque boucles
    new_instance.time_interval.end = d + duration # pareil pour la date de fin
    new_instance.student_attendances << a.students.map(&:user).map { |u| StudentAttendance.new(user: u) } # r"écupère les élèves"
    new_instance.teachers_activity_instances.new(teacher: a.teacher) # et aussi les profs

    instances << new_instance # on stock l'instance => ne met pas dans la bdd

    d += 1.week
  end

  a.activity_instances << instances # enregistre dans la bdd
  a.teacher.planning.time_intervals << instances.map(&:time_interval) # met à jour le planning des profs
  a.students.map(&:user).map(&:planning).each { |p| p.time_intervals << instances.map(&:time_interval) } # et celui des élèves
end

