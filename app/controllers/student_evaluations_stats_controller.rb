class StudentEvaluationsStatsController < ApplicationController
  def stats
    @current_user = current_user

    authorize! :manage, @current_user.is_admin

    @current_season = Season.current
    @stats = StudentEvaluations::Stats::CalculateStats
             .new(User.teachers, @current_season, Season.next)
             .execute
  end
end
