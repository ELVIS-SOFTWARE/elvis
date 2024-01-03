# frozen_string_literal: true

class EventsRulesController < ApplicationController

  def index
    # n'existera plus dans la phase finale, uniquement pour les tests
    # EventRules.add_sample

    @template_names = NotificationTemplate.all
    if @template_names.length != 0
      @template_names = @template_names.select([:id, :name]).map {|e| {value: e.id, label: e.name} }
    end
  end

  def update
    if params != nil

      event = EventRules.find(params[:id])
      event.update(name: params[:name], templateName: params[:templateName].to_json, sendMail: false, sendSMS: false, carbon_copy: params[:sendTo].to_json)

      if params[:events_rule][:action].present?
        params[:events_rule][:action].each do |a|
          case a[:value]
          when "sendSMS"
            event.sendSMS = true
          when "sendMail"
            event.sendMail = true
          end
        end
      end
      event.save!

      render json: {status: "ok"}, status: 200
    else
      render json: {status: "not ok"}, status: 500
    end
  end

  def destroy
    if params != nil
      rule = EventRules.find(params[:id])
      rule.delete
      render json: {status: "ok"}, status: 200
    else
      render json: {status: "not ok"}, status: 500
    end
  end

  def new

  end

  def create
    if params != nil
      event = EventRules.new(name: params[:name], sendSMS: false, sendMail: false, event: params[:event].to_json, subject: "", eventName: params[:event][:value])

      params[:events_rule][:action].each do |a|
        case a[:value]
        when "sendSMS"
          event.sendSMS = true
        when "sendMail"
          event.sendMail = true
        end
      end

      event.save!
      render json: {status: "ok"}, status: 200
    else
      render json: {status: "not ok"}, status: 500
    end
  end

  def list
    @all_rules = EventRules.all

    respond_to do |format|
      format.json { render json: events_list_json(@all_rules) }
    end
  end

  def events_list_json(rules)
    query = rules
              .page(params[:page] + 1)
              .per(params[:pageSize])

    pages = query.total_pages
    total = rules.count

    {
      rules: query,
      pages: pages,
      total: total,
    }
  end

  def searchUser
    list = User.where("last_name like ?", "%"+ params[:last_name] +"%")

    respond_to do |format|
      format.json { render json: list }
    end
  end

end

# todo
# onclick => remplir les fields OK
# modifier le controlleur de template OK
# pouvoir affecter un template à un évènement OK
# changer les modal de la page event rules OK
# Passer l'action dans l'url pour donner les bons merge tags à unlayer OK