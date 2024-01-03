# frozen_string_literal: true
class DuePaymentController < ApplicationController
  def create
    authorize! :create, DuePayment.new

    if (params[:due_payment][:payment_schedule_id]).zero?
      status = PaymentScheduleStatus.find_by(label: "En attente de règlement")
      season = Season.find params[:season_id]
      schedule = PaymentSchedule.create!(payable_id: params[:due_payment][:payer][:id], payable_type: "User", payment_schedule_status: status, season: season)
    else
      schedule = PaymentSchedule.find params[:due_payment][:payment_schedule_id]
    end

    due_payment = DuePayment.create!({
                                       previsional_date: params[:due_payment][:previsional_date],
                                       amount: params[:due_payment][:amount],
                                       payment_schedule: schedule,
                                       payment_method_id: params[:due_payment][:payment_method_id],
                                       number: params[:due_payment][:isAdhesionDue] ? 0 : schedule.get_due_payment_number,
                                       due_payment_status_id: DuePaymentStatus::UNPAID_ID
                                     })

    render json: schedule.as_json({
                                    include: {
                                      due_payments: {
                                        include: :payment_method,
                                        methods: :adjusted_amount
                                      },
                                      comments: {
                                        include: [:user]
                                      }
                                    }
                                  })
  end

  def update
    due_payment = DuePayment.includes(:due_payment_status).find params[:id]
    authorize! :update, due_payment

    due_payment.update!(due_payment_params)

    if due_payment.payments&.any?
      due_payment.reevaluate_status
      due_payment.payments.update_all(payment_status_id: params[:due_payment][:due_payment_status_id])
    end

    render json: due_payment.as_json({
                                       include: :due_payment_status
                                     })
  end

  def destroy
    due_payment = DuePayment.find params[:id]
    authorize! :destroy, due_payment
    due_payment.destroy
  end

  def generate_payments
    schedule = PaymentSchedule.find params[:id]

    dues = DuePayment.where(id: params[:targets])

    dues.each do |dp|
      p = Payment.find_by(due_payment_id: dp.id)
      next unless p.nil?
      dp.create_related_payment
    end

    render json: dues.as_json({
                                include: {
                                  payment_method: {},
                                  payments: {
                                    methods: :adjusted_amount
                                  }
                                }
                              })
  end

  def list
    query_res = get_query_from_params
    query = query_res[0]
    payment_method_filter = query_res[1]

    respond_to do |format|
      format.json { render json: payments_list_json(query, payment_method_filter) }
    end
  end

  def send_payment_mail
    if params[:targets].length == 1
      dp = DuePayment.find(params[:targets][0])
      unless dp.nil?
        if dp.due_payment_status_id == DuePaymentStatus::UNPAID_ID
          if dp.previsional_date <= Date.today
            PaymentReminderMailer.send_payment_reminder(dp.payment_schedule.user, [dp]).deliver_later
          end
        end
      end
    else
      selected_users = params[:targets].map { |id| User.find(DuePayment.find(id).payment_schedule.payable_id) }.uniq

      selected_users.each do |user|
        due_payments = user.payment_schedules.map(&:due_payments).flatten.select { |dp| dp.due_payment_status_id == DuePaymentStatus::UNPAID_ID }
        due_payments = due_payments.select { |dp| dp.previsional_date <= Date.today }
        PaymentReminderMailer.send_payment_reminder(user, due_payments).deliver_later
      end
    end

    respond_to do |format|
      format.json { render json: {
        status: "success"
      } }
    end
  end

  def bulkedit
    due_payments = if params[:mode] == "general" && params[:targets] == "all"
                     get_query_from_params(params[:filter])[0]
                   else
                     DuePayment.where(id: params[:targets])
                   end

    due_payments.update_all(bulk_params.to_h)

    if params[:mode] == "user"
      if bulk_params.include? "due_payment_status_id"
        due_payments.each do |p|
          if !p.payments.nil? && p.payments.any?
            p.payments.update(payment_status_id: params[:due_payment_status_id])
          end
        end
      end

      due_payments.compact.each(&:reevaluate_status)

      @due_payments = due_payments.as_json(include: {
        payments: {
          methods: :adjusted_amount
        }
      })

      render json: @due_payments
    end
  end

  def bulkdelete
    due_payments = DuePayment.where(id: params["targets"])

    due_payments.each { |dp| dp.payments.each(&:destroy) }
    due_payments.destroy_all
  end

  def edit_status
    id = params[:id].to_i
    status_id = params[:status].to_i

    due_payment = DuePayment.find(id)
    new_status = DuePaymentStatus.find(status_id)

    due_payment.update due_payment_status: new_status if !due_payment.nil? && !new_status.nil?
  end

  def mark_past_unpaid
    ((Date.today - 180)..Date.today).each do |date|
      DuePayment.mark_unpaid(date)
    end
  end

  def renumber
    PaymentSchedule.all.each do |schedule|
      next unless schedule.due_payments.where(number: nil).any?
      i = 1
      adhesion_fee_set = false
      dues = schedule.due_payments.order(:previsional_date)
      dues.each do |dp|

        # TODO quelle est la logique métier ici ?
        if !dp.amount.nil? && (dp.amount % 15).zero? && dp.amount <= 60.0 && !adhesion_fee_set
          dp.number = 0
          adhesion_fee_set = true
        else
          dp.number = i
          i += 1
        end

        dp.save!
      end
    end

    render plain: "ok!"
  end

  def export_selected
    query = DuePayment.all
                      .includes(:due_payment_status, :payments, payment_schedule: :user)
                      .joins(payment_schedule: :user)
                      .where(payment_schedules: { payable_type: "User" })
                      .where(payment_schedules: {
                        users: {
                          deleted_at: nil
                        }
                      })

    if params[:list]
      list = JSON.parse(params[:list])
      query = query.where(id: list) if list.is_a? Array
    else
      JSON.parse(params[:filtered], symbolize_names: true).each do |filter|
        prop = filter[:id]
        val = filter[:value]

        if prop == "payer_name"
          query = query.joins(payment_schedule: :user).where("users.first_name ILIKE '%#{val}%' or users.last_name ILIKE '%#{val}%'")
        elsif prop == "number"
          case val
          when "t"
            query = query.where(number: 0)
          when "f"
            query = query.where.not(number: 0)
          end
        elsif prop == "validity"
          case val
          when "N" # NONE
            query = query.where("(SELECT COUNT(*) FROM payments WHERE payments.due_payment_id = due_payments.id) = 0")
          when "NE" # NONEQUAL
            query = query.where("ABS((
                            SELECT SUM(adjusted_amount(payments.operation, payments.amount))
                            FROM payments
                            WHERE payments.due_payment_id = due_payments.id
                        ) - adjusted_amount(due_payments.operation, due_payments.amount)) >= 0.01")
          when "E" # EQUAL
            query = query.where("ABS((
                            SELECT SUM(adjusted_amount(payments.operation, payments.amount))
                            FROM payments
                            WHERE payments.due_payment_id = due_payments.id
                        ) - adjusted_amount(due_payments.operation, due_payments.amount)) < 0.01")
          end
        elsif prop == "payment_payment_method_id"
          query = query
                    .joins("LEFT OUTER JOIN payments AS outer_payments ON outer_payments.due_payment_id = due_payments.id")
          query = if val == "null"
                    query.where("outer_payments.payment_method_id is NULL OR outer_payments.payment_method_id = 0")
                  else
                    query.where("outer_payments.payment_method_id = ?", val)
                  end
        elsif prop == "payment_method_id"
          query = if val.include? "null"
                    query.where("due_payments.payment_method_id is null OR due_payments.payment_method_id = 0")
                  else
                    query.where(payment_method_id: val)
                  end
        elsif prop == "due_payment_status_id" || prop == "location_id" && val.match?(/\d+/)
          if val == "null"
            query = query.where("due_payments.#{prop} is null OR due_payments.#{prop} = 0")
          else
            payment_method_filter = val
            query = query.where("due_payments.#{prop} = #{val}")
          end
        elsif prop == "previsional_date"
          if val[:start] && val[:end]
            query = query.where("due_payments.previsional_date >= ?::date", val[:start])
            query = query.where("due_payments.previsional_date <= ?::date", val[:end])
          elsif val[:start] || val[:end]
            day = val[:start] || val[:end]
            query = query.where("due_payments.previsional_date = ?::date", day)
          end
        elsif prop == "cashing_date"
          if val[:start] && val[:end]
            query = query.where("(SELECT COUNT(*) FROM payments p WHERE p.due_payment_id = due_payments.id AND p.cashing_date BETWEEN ?::date AND ?::date) > 0", val[:start], val[:end])
          elsif val[:start] || val[:end]
            day = val[:start] || val[:end]
            query = query.where("(SELECT COUNT(*) FROM payments p WHERE p.due_payment_id = due_payments.id AND p.cashing_date = ?::date) > 0", day)
          end
        elsif prop == "season_id"
          s = Season.find(val)

          query = query.joins(:payment_schedule).where({ payment_schedules: { season: s } })
        end
      end
      # query = query.where.not(payment_method_id: PaymentMethod::BANK_TRANSFER_ID, payment_status_id: PaymentStatus::FAILED_ID)
    end

    totals = {}
    headers = %w(Montant\ initial Cours Adhésion Total)
    block = Proc.new do |step, h |
      case step
      when 1 # initialisation ; h est un array avec les en-têtes
        h.each { |k|
          totals[k] =  headers.include?(k) ? 0 : nil }
      when 2 # itération ; h est un hash avec les valeurs issues de la sérialisation
        totals['Montant initial'] += h['Montant initial'].to_f
        totals['Cours'] += h['Cours'].to_f
        totals['Adhésion'] += h['Adhésion'].to_f
        totals['Total'] += h['Total'].to_f
      when 3 # ligne des totaux ; on doit renvoyer
        totals.each do |k, v|
          totals[k] = v.to_s(:rounded, precision: 2, locale: :fr) if headers.include?(k)
        end
        totals
      end
    end

    render csv: query,
           filename: "Export_echeances_#{Time.zone.now.to_s(:number)}.csv",
           serializer: Templates::DuePaymentSerializer,
           stream: false,
           block: block
  end

  private

  def get_query_from_params(json_query = params)
    query = DuePayment.all
                      .includes(:due_payment_status, :payments, payment_schedule: :user)
                      .joins(payment_schedule: :user)
                      .where(payment_schedules: { payable_type: "User" })
                      .where(payment_schedules: {
                        users: {
                          deleted_at: nil
                        }
                      })

    payment_method_filter = nil

    json_query[:filtered].each do |filter|
      prop = filter[:id]
      val = filter[:value]

      if prop == "payer_name"
        query = query.joins(payment_schedule: :user).where("users.first_name ILIKE '%#{val}%' or users.last_name ILIKE '%#{val}%'")
      elsif prop == "number"
        case val
        when "t"
          query = query.where(number: 0)
        when "f"
          query = query.where.not(number: 0)
        end
      elsif prop == "validity"
        case val
        when "N" # NONE
          query = query.where("(SELECT COUNT(*) FROM payments WHERE payments.due_payment_id = due_payments.id) = 0")
        when "NE" # NONEQUAL
          query = query.where("ABS((
                            SELECT SUM(adjusted_amount(payments.operation, payments.amount))
                            FROM payments
                            WHERE payments.due_payment_id = due_payments.id
                        ) - adjusted_amount(due_payments.operation, due_payments.amount)) >= 0.01")
        when "E" # EQUAL
          query = query.where("ABS((
                            SELECT SUM(adjusted_amount(payments.operation, payments.amount))
                            FROM payments
                            WHERE payments.due_payment_id = due_payments.id
                        ) - adjusted_amount(due_payments.operation, due_payments.amount)) < 0.01")
        end
      elsif prop == "payment_payment_method_id"
        query = query
                  .joins("LEFT OUTER JOIN payments AS outer_payments ON outer_payments.due_payment_id = due_payments.id")
        query = if val == "null"
                  query.where("outer_payments.payment_method_id is NULL OR outer_payments.payment_method_id = 0")
                else
                  query.where("outer_payments.payment_method_id = ?", val)
                end
      elsif prop == "payment_method_id"
        query = if val.include? "null"
                  query.where("due_payments.payment_method_id is null OR due_payments.payment_method_id = 0")
                else
                  query.where(payment_method_id: val)
                end
      elsif prop == "due_payment_status_id" || prop == "location_id" && val.match?(/\d+/)
        if val == "null"
          query = query.where("due_payments.#{prop} is null OR due_payments.#{prop} = 0")
        else
          payment_method_filter = val
          query = query.where("due_payments.#{prop} = #{val}")
        end
      elsif prop == "previsional_date"
        if val[:start] && val[:end]
          query = query.where("due_payments.previsional_date >= ?::date", val[:start])
          query = query.where("due_payments.previsional_date <= ?::date", val[:end])
        elsif val[:start] || val[:end]
          day = val[:start] || val[:end]
          query = query.where("due_payments.previsional_date = ?::date", day)
        end
      elsif prop == "cashing_date"
        if val[:start] && val[:end]
          query = query.where("(SELECT COUNT(*) FROM payments p WHERE p.due_payment_id = due_payments.id AND p.cashing_date BETWEEN ?::date AND ?::date) > 0", val[:start], val[:end])
        elsif val[:start] || val[:end]
          day = val[:start] || val[:end]
          query = query.where("(SELECT COUNT(*) FROM payments p WHERE p.due_payment_id = due_payments.id AND p.cashing_date = ?::date) > 0", day)
        end
      elsif prop == "season_id"
        s = Season.find(val)

        query = query.joins(:payment_schedule).where({ payment_schedules: { season: s } })
      end
    end

    [query, payment_method_filter]
  end

  def payments_list_json(query, payment_method_id)
    totalDueAmount = query.distinct.pluck(:id, Arel.sql("adjusted_amount(due_payments.operation, due_payments.amount)")).map { |pair| pair[1] }.compact.sum

    total_paid_query = query

    total_paid_query = query.where(payments: { payment_method_id: payment_method_id }) if payment_method_id

    totalPaidAmount = total_paid_query
                        .distinct
                        .pluck("payments.id", Arel.sql("adjusted_amount(payments.operation, payments.amount)"))
                        .map { |pair| pair[1] }
                        .compact
                        .sum

    rows_count = query.count

    sort_order = params[:sorted][:desc] ? :desc : :asc

    query = (
      if params[:sorted][:id] == "payer_name"
        query.order("users.last_name #{sort_order}").order("users.first_name #{sort_order}")
      else
        query.order("#{params[:sorted][:id]} #{sort_order}")
      end).joins(payment_schedule: :user)

    query = query
              .page(params[:page] + 1)
              .per(params[:pageSize])

    pages = query.total_pages

    payments = query.as_json(include: {
      payments: {
        methods: :adjusted_amount
      },
      due_payment_status: {},
      payment_schedule: {
        include: [:user]
      }
    })
    authorize! :read, payments

    {
      payments: payments,
      pages: pages,
      rowsCount: rows_count,
      totalDueAmount: totalDueAmount,
      totalPaidAmount: totalPaidAmount
    }
  end

  def due_payment_params
    params.require(:due_payment).permit(:previsional_date, :operation, :amount, :payment_method_id, :due_payment_status_id)
  end

  def bulk_params
    params.require(:due_payment).permit(:previsional_date, :operation, :amount, :payment_method_id, :due_payment_status_id)
  end
end
