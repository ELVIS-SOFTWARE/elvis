# frozen_string_literal: true
#
require 'json'

class SearchController < ApplicationController
  def index
    value = params[:search_value]

    query = Chewy::Search::Request.new(UsersIndex, ActivityApplicationsIndex, AdhesionsIndex, ActivitiesIndex, SallesIndex)
    results = query.limit(15).query(multi_match: {
                                      query: value,
                                      analyzer: "search",
                                      operator: "and",
                                      type: "cross_fields",
                                      fields: %w[user_first_name user_last_name user_email user_adherent_number application_id application_status
                                                 application_first_name application_last_name adhesion_adherent_number adhesion_first_name adhesion_last_name activity_name
                                                 room_name]
                                    })

    total = results.response.total

    respond_to do |format|
      format.json do
        render json: {
          results: results,
          total: total
        }
      end
    end
  end

  def advanced_search
    @current_user = current_user

    authorize! :manage, @current_user.is_admin
  end

  def advanced_search_query
    query = params[:query]

    query = UsersIndex.query(query)
    results = query.objects
    results_count = query.count

    @current_user = current_user
    respond_to do |format|
      format.json { render json: { results: results, count: results_count } }
    end
  end

  def indexation
    UsersIndex.create
    UsersIndex.import

    ActivityApplicationsIndex.create
    ActivityApplicationsIndex.import
  end
end
