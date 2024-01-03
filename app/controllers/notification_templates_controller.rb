# frozen_string_literal: true

class NotificationTemplatesController < ApplicationController
  before_action -> { @current_user = current_user }

  def index
  end

  def edit_template
    @event = params[:event]
    @template = NotificationTemplate.find(params[:id])

    respond_to do |format|
      format.html

      format.json {
        render json: {
          template: @template,
          event: @event,
        }
      }
    end
  end

  def update
    if params != nil
      template = NotificationTemplate.find(params[:id])
      template.body = params[:html]
      template.json = params[:json].to_json
      template.save!
      render json: {status: "ok"}, status: 200
    else
      render json: {status: "not ok"}, status: 500
    end
  end

  def destroy
    if params != nil
      template = NotificationTemplate.find(params[:id])
      template.delete
      render json: {status: "ok"}, status: 200
    else
      render json: {status: "not ok"}, status: 500
    end
  end

  def new

  end

  def create
    if params != nil
      template = NotificationTemplate.new(name: params[:name], body: params[:html], path: params[:path], json: params[:json].to_json, partial: false, format: "html", handler: "liquid")
      template.save!

      render json: {status: "ok"}, status: 200
    else
      render json: {status: "not ok"}, status: 500
    end
  end

  def list
    @all_templates = NotificationTemplate.all

    respond_to do |format|
      format.json { render json: templates_list_json(@all_templates) }
    end
  end

  def templates_list_json(templates)

    query = templates
              .page(params[:page] + 1)
              .per(params[:pageSize])

    pages = query.total_pages
    total = templates.count

    {
      templates: query,
      pages: pages,
      total: total,
    }
  end
end
