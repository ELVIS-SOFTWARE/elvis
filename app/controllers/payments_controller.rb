# frozen_string_literal: false

require "csv"

# Controller for actions related to payments
class PaymentsController < ApplicationController
  def index
    @current_user = current_user

    authorize! :manage, @current_user.is_admin

    @payment_methods = PaymentMethod.all.select(:id, :label)

    @due_statuses = DuePaymentStatus.all.select(:id, :label, :color)
    @payment_statuses = PaymentStatus.all.select(:id, :label, :color)

    @locations = Location.all.each_with_object({}) do |l, h|
      h[l.id] = l
    end

    @failed_count = FailedPaymentImport.count
    @min_year = Payment.select("MIN(reception_date) AS minYear")[0].minyear
    @max_year = Payment.select("MAX(reception_date) AS maxyear")[0].maxyear

    @seasons = Season.all
  end

  def show
    @current_user = current_user

    @payment_methods = PaymentMethod.all.as_json

    user = User.find(params[:id])

    @user = user

    desired_activities = {}
    activities = []

    payers_by_season = Season.all.reduce([]) do |arr, s|
      users = (user.whole_family(s.id) << user).uniq

      desired_activities[s.id] = users.first&.get_desired_activities_for_family(s)

      users.each { |p| activities += p.get_list_of_activities(s) }

      arr << {
        season_id: s.id,
        payers: user.get_users_paying_for_self(s)
      }

      # si l'utilisateur paie pour au moins une autre personne, on l'ajoute aux payeurs
      if user.id == @user.id && !arr.last[:payers].any? { |u| u.id == user.id } && (@user.is_paying || user.any_users_self_is_paying_for?(s))
        arr.last[:payers] << user
      end

      arr.last[:payers].uniq!

      arr
    end

    activities.uniq!

    @desired_activities = desired_activities.transform_values do |des|
      des.as_json({
                    include: {
                      pricing_category: {},
                      discount: {
                        only: :coupon,
                        include: {
                          coupon: {
                            only: %i[id percent_off label]
                          } } },
                      activity_ref: {
                        include: {
                          activity_ref_pricing: {
                            include: {
                              to_season: {},
                              from_season: {}
                            }
                          }
                        }
                      },
                      activity_application: {
                        include: {
                          user: {
                            include: {
                              adhesions: {
                                include: {
                                  discount: {
                                    only: :coupon,
                                    include: {
                                      coupon: {
                                        only: %i[id percent_off label]
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          },
                          season: {} } }
                    }
                  })
    end.as_json

    include_payer_json = {
      methods: %i[class_name address phone_number], include: {
        payer_payment_terms: {
          include: {
            payment_terms: {},
          },
        }
      }
    }

    @payer = user.as_json(include_payer_json)
    @payer[:type] = user.class.to_s
    @payers = payers_by_season.map { |h| h.merge({ payers: h[:payers].as_json(include_payer_json) }) }

    @activities = activities
    @options = user.get_list_of_options.as_json({
                                                  include: {
                                                    activity: {
                                                      include: [:activity_ref],
                                                      methods: :intended_nb_lessons
                                                    },
                                                    desired_activity: {
                                                      include: {
                                                        activity_application: {
                                                          include: {
                                                            user: { include: { adhesions: [] } }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                })

    @activities_json = @activities.as_json({
                                             include: {
                                               user: {},
                                               activity: {
                                                 include: {
                                                   activity_ref: {
                                                     include: {
                                                       activity_ref_pricing: {
                                                         include: {
                                                           to_season: {},
                                                           from_season: {}
                                                         }
                                                       }
                                                     }
                                                   }
                                                 },
                                                 methods: :intended_nb_lessons
                                               }
                                             }
                                           })

    @schedule_statuses = PaymentScheduleStatus.all
    @schedules = {}
    @payments = {}

    payers_by_season.map { |ps| ps[:payers] }.flatten.uniq.each do |payer|
      PaymentSchedule
        .includes({
                    due_payments: {
                      due_payment_status: {},
                      payment_method: {},
                      payments: {
                        payment_method: {}
                      }
                    },
                    comments: []
                  })
        .where.not(season_id: nil)
        .where(payable_id: payer.id, payable_type: payer.class.to_s)
        .each do |payment_schedule|
        @schedules[payment_schedule.season_id] = {} if @schedules[payment_schedule.season_id].nil?

        @payments[payment_schedule.season_id] = {} if @payments[payment_schedule.season_id].nil?

        @payments[payment_schedule.season_id][payer.id] =
          payment_schedule.due_payments.map(&:payments).flatten.as_json(include: :payment_method)

        @schedules[payment_schedule.season_id][payer.id] = payment_schedule.as_json(include: {
          due_payments: {
            include: {
              payment_method: {}
            },
            methods: :adjusted_amount
          },
          comments: {
            include: [:user]
          }
        })
      end
    end

    @locations = Location.all

    @seasons = Season.all.order_by_start.as_json(methods: :previous)
    @current_season = Season.current_apps_season

    @pricings = PricingCategory.all.as_json

    @payment_statuses = PaymentStatus.all.select(:id, :label, :color)
    @due_payment_statuses = DuePaymentStatus.all.select(:id, :label, :color)

    # Récupérer tous les utilisateurs de toutes les @desired_activities
    desired_activities_users = @desired_activities
                                 .values
                                 .flatten
                                 .map { |da| da["activity_application"]["user"] }
                                 .uniq

    # récupérer les adhésions de tous ces utilisateurs
    @adhesions = Adhesion.where(user_id: desired_activities_users.pluck('id'))
                        .includes(user:{}, discount: { coupon: {} })
                        .uniq
                        .as_json({
                                   include: {
                                     user: {
                                       only: %i[id first_name last_name]
                                     },
                                     discount: {
                                       only: :coupon,
                                       include: {
                                         coupon: {
                                           only: %i[id percent_off label]
                                         }
                                       }
                                     }
                                   }
                                 })

    @adhesion_enabled = Adhesion.enabled
    @adhesion_prices = AdhesionPrice.all.as_json

    @coupons = Coupon.all.as_json(
      only: %i[id label percent_off enabled]
    )

    respond_to do |format|
      format.html

      format.pdf do
        begin
          @season = Season.find(params[:season_id])
        rescue ActiveRecord::RecordNotFound
          @season = Season.current
        end

        due_payment_ids = (params[:payer_id].present? ? @schedules.dig(@season.id, params[:payer_id].to_i) : @schedules[@season.id]&.values&.first)&.fetch("due_payments", [])&.map { |d| d["id"] } || []
        payment_ids = (params[:payer_id].present? ? @payments.dig(@season.id, params[:payer_id].to_i
        ) : @payments[@season.id]&.values&.first)&.map { |p| p["id"] } || []

        @due_payments_objects = DuePayment.where(id: due_payment_ids).to_a
        # @type [Array<Payment>]
        @payments_objects = Payment.where(id: payment_ids).to_a

        @data = generate_data_for_payment_summary_table(@season.id)
        @calculated_total = calculate_totals(@due_payments_objects, @payments_objects, @data)

        # @type [School]
        @school = School.first

        @school_name = @school&.name
        render pdf: "facture_#{user[:id]}_#{user[:first_name]}_#{user[:last_name]}",
               template: "payments/bill.html.erb",
               font_size: 50,
               layout: "pdf.html",
               encoding: "utf8",
               show_as_html: false
      end
    end
  end

  def create
    payment = Payment.includes(:payment_method).create(payment_params)

    unless params[:payment][:due_payment_id].nil?
      payment.due_payment = DuePayment.find(params[:payment][:due_payment_id])
    end

    unless params[:payment][:payment_method_id].nil?
      payment.payment_method = PaymentMethod.find(params[:payment][:payment_method_id])
    end

    payment.payable_id = params[:payment][:payer][:id]
    payment.payable_type = params[:payment][:payer][:class_name]

    payment.save!

    payment.due_payment&.reevaluate_status

    render json: payment.as_json({
                                   include: {
                                     payment_method: {},
                                     due_payment: {
                                       methods: :adjusted_amount
                                     }
                                   },
                                   methods: :adjusted_amount
                                 })
  end

  def update
    payment = Payment.includes(:payment_method).find(params[:payment][:id])

    unless params[:payment][:due_payment_id].zero?
      payment.due_payment = DuePayment.find(params[:payment][:due_payment_id])
    end

    unless params[:payment][:payment_method_id].nil? || params[:payment][:payment_method_id].zero?
      payment.payment_method = PaymentMethod.find(params[:payment][:payment_method_id])
    end

    payment.update(payment_params)

    payment&.due_payment&.reevaluate_status

    render json: payment.as_json(include: [:payment_method], methods: :adjusted_amount)
  end

  def update_frequency
    act = DesiredActivity.find(params[:activity])
    act.payment_frequency = params[:frequency]
    act.save
  end

  def update_location
    act = Student.includes({ activity: [:activity_ref] }).find(params[:id])
    act.payment_location = params[:location]
    act.save
    render json: act, include: { activity: { include: [:activity_ref] } }
  end

  def update_method
    if params[:activity].zero?
      adh = Adhesion.find_by(user_id: params[:user_id])
      adh.payment_method_id = params[:payment_method_id]
      adh.save
    else
      act = Student.find(params[:activity])
      act.payment_method_id = params[:payment_method_id]
      act.save
    end
  end

  def destroy
    payment = Payment.find params[:id]
    due = payment.due_payment

    payment.destroy
    due&.reevaluate_status

    render json: due.as_json
  end

  def update_payers
    Payment.update_payer
    PaymentSchedule.update_payer
  end

  def list
    query = Payment.includes(:payment_status, due_payment: {
      payment_schedule: :user
    })
                   .joins(:due_payment)
                   .order("#{params[:sorted][:id]} #{params[:sorted][:desc] ? 'desc' : 'asc'}")
                   .where("(SELECT due_payments.id
                     FROM due_payments
                     WHERE due_payments.id = payments.due_payment_id
                   ) IS NOT NULL")

    params[:filtered].each do |filter|
      prop = filter[:id]
      val = filter[:value]

      if prop == "users.last_name"
        query = query.joins(due_payment: { payment_schedule: :user })
                     .where("users.first_name ILIKE '%#{val}%' or users.last_name ILIKE '%#{val}%'")

      elsif prop == "number"
        case val
        when "t"
          query = query.where(due_payments: { number: 0 })
        when "f"
          query = query.where.not(due_payments: { number: 0 })
        end

      elsif prop == "validity"
        query = query.joins(:due_payment)

        case val
        when "E"
          query = query.where(payment_status_id: PaymentStatus::PAID_ID)
        when "NE"
          query = query.where(payment_status_id: PaymentStatus::PENDING_ID)
        when "F"
          query = query.where(payment_status_id: PaymentStatus::FAILED_ID)
        end

      elsif prop == "payment_status_id"
        query = query.where(payment_status_id: val) if val != "all"

      elsif prop == "payment_method_id"
        query = if val == "null"
                  query.where("payments.payment_method_id is NULL OR payments.payment_method_id = 0")
                else
                  query.where("payments.payment_method_id = ?", val)
                end

      elsif prop == "location_id" && val.match?(/\d+/)
        query = if val == "null"
                  query.where("payments.#{prop} is null OR payments.#{prop} = 0")
                else
                  query.where("payments.#{prop} = #{val}")
                end

      elsif prop == "cashing_date"
        if val[:start] && val[:end]
          query = query.where("payments.cashing_date BETWEEN ?::date AND ?::date", val[:start], val[:end])
        elsif val[:start] || val[:end]
          day = val[:start] || val[:end]
          query = query.where(cashing_date: day)
        end

      elsif prop == "season_id"
        s = Season.find(val)

        query = query.joins(due_payment: :payment_schedule)
                     .where({ due_payments: { payment_schedules: { season: s } } })

      elsif prop == "amount"
        query = query.where("payments.amount::TEXT ILIKE '%#{val}%'")
      end
    end

    respond_to do |format|
      format.json do
        total_amount = query.where.not(amount: nil).sum(:amount)
        rows_count = query.count

        sort_order = params[:sorted][:desc] ? :desc : :asc

        query = query
                  .order(params[:sorted][:id].to_sym => sort_order)
                  .page(params[:page] + 1)
                  .per(params[:pageSize])

        pages = query.total_pages
        payments = query.as_json(include: {
          due_payment: {
            include: {
              payment_schedule: {
                include: :user
              }
            },
            methods: :adjusted_amount
          },
          payment_status: {}
        })

        authorize! :read, payments

        render json: { payments: payments, pages: pages, rowsCount: rows_count, totalAmount: total_amount }
      end
    end
  end

  def export_selected

    query = Payment.includes(:payment_status, due_payment: {
      payment_schedule: :user
    })
                   .joins(:due_payment)
                   .where("(SELECT due_payments.id
                     FROM due_payments
                     WHERE due_payments.id = payments.due_payment_id
                   ) IS NOT NULL")

    if params[:list]
      list = JSON.parse(params[:list])
      query = query.where(id: list) if list.is_a? Array
    else

      JSON.parse(params[:filtered], symbolize_names: true).each do |filter|
        prop = filter[:id]
        val = filter[:value]

        if prop == "users.last_name"
          query = query.joins(due_payment: { payment_schedule: :user })
                       .where("users.first_name ILIKE '%#{val}%' or users.last_name ILIKE '%#{val}%'")
        elsif prop == "number"
          case val
          when "t"
            query = query.where(due_payments: { number: 0 })
          when "f"
            query = query.where.not(due_payments: { number: 0 })
          end
        elsif prop == "validity"
          query = query.joins(:due_payment)
          case val
          when "NE" # NONEQUAL
            query = query.where("ABS(adjusted_amount(payments.operation, payments.amount)
                              - adjusted_amount(due_payments.operation, due_payments.amount)) >= 0.01")
          when "E" # EQUAL
            query = query.where("ABS(adjusted_amount(payments.operation, payments.amount)
                               - adjusted_amount(due_payments.operation, due_payments.amount)) < 0.01")
          end
        elsif prop == "payment_method_id"
          query = if val == "null"
                    query.where("payments.payment_method_id is NULL OR payments.payment_method_id = 0")
                  else
                    query.where("payments.payment_method_id = ?", val)
                  end
        elsif prop == "location_id" && val.match?(/\d+/)
          query = if val == "null"
                    query.where("payments.#{prop} is null OR payments.#{prop} = 0")
                  else
                    query.where("payments.#{prop} = #{val}")
                  end
        elsif prop == "cashing_date"
          if val[:start] && val[:end]
            query = query.where("payments.cashing_date BETWEEN ?::date AND ?::date", val[:start], val[:end])
          elsif val[:start] || val[:end]
            day = val[:start] || val[:end]
            query = query.where(cashing_date: day)
          end
        elsif prop == "season_id"
          s = Season.find(val)

          query = query.joins(due_payment: :payment_schedule)
                       .where({ due_payments: { payment_schedules: { season: s } } })
        elsif prop == "amount"
          query = query.where("payments.amount::TEXT ILIKE '%#{val}%'")
        end
      end
      query = query.where.not(payment_method_id: PaymentMethod::BANK_TRANSFER_ID, payment_status_id: PaymentStatus::FAILED_ID)
    end

    totals = {}
    headers = %w(Montant\ initial Cours Adhésion Total)
    block = Proc.new do |step, h|
      case step
      when 1 # initialisation ; h est un array avec les en-têtes
        h.each do |k|
          totals[k] = headers.include?(k) ? 0 : nil
        end
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
           filename: "Export_paiements_#{Time.zone.now.to_s(:number)}.csv",
           serializer: Templates::PaymentSerializer,
           stream: false,
           block: block
  end

  def checklist
    sum_amount_per_checknumber = Payment.group(:check_number, :payable_id)
                                        .where(payment_method_id: 2)
                                        .sum(:amount)
    query_uniq_checknumber = Payment.select("DISTINCT ON (check_number, payable_id) *")
                                    .where(payment_method_id: 2)
    query = Payment.from(query_uniq_checknumber, :payments) # create an alias for the 'DISTINCT ON' table
                   .includes(:payment_status, due_payment: { # pre-load data
                                                             payment_schedule: :user
                   })
                   .joins(due_payment: { # force inner-join
                                         payment_schedule: :user
                   })
                   .joins("LEFT OUTER JOIN payment_statuses ON payment_statuses.id = payments.payment_status_id")
                   .order("#{params[:sorted][:id]} #{params[:sorted][:desc] ? 'desc' : 'asc'}")
                   .where(payment_method_id: 2)

    params[:filtered].each do |filter|
      prop = filter[:id]
      val = filter[:value]

      if prop == "users.last_name"
        query = query.joins(due_payment: { payment_schedule: :user })
                     .where("users.first_name ILIKE '%#{val}%' or users.last_name ILIKE '%#{val}%'")
      elsif prop == "users.adherent_number"
        query = query.joins("LEFT OUTER JOIN family_member_users fmuInv ON fmuInv.member_id = users.id AND fmuInv.season_id = payment_schedules.season_id
                            LEFT OUTER JOIN family_member_users fmu ON fmu.user_id = users.id AND fmuInv.season_id = payment_schedules.season_id
                            LEFT OUTER JOIN users u3 ON fmuInv.user_id = u3.id
                            LEFT OUTER JOIN users u2 ON fmu.member_id = u2.id")
                     .where("fmu.is_paying_for or fmuInv.is_paying_for or users.adherent_number::TEXT ILIKE '%#{val}%'") # users.adherent_number is check twice, to take into account users whose family is nil
                     .where("u2.adherent_number::TEXT ILIKE '%#{val}%' or u3.adherent_number::TEXT ILIKE '%#{val}%'
                      or users.adherent_number::TEXT ILIKE '%#{val}%'")
      elsif prop == "reference_date"
        reference_date = Date.parse(val)
        query = query.where(
          { cashing_date: reference_date }
        )
      elsif prop == "check_status" && val != "all"
        query = query.where({ check_status: val })
      elsif prop == "check_number"
        query = query.where(
          "payments.check_number::TEXT ILIKE '%#{val}%'"
        )
      elsif prop == "payments.amount"
        tmp = sum_amount_per_checknumber.select { |_key, value| value.to_s.include?(val) }.keys
        query = query.where(
          check_number: tmp.map { |t| t[0] }, payable_id: tmp.map { |t| t[1] }
        )
      end
    end

    init = sum_amount_per_checknumber
    total_amount = 0
    query.where.not(amount: nil)
         .pluck(:check_number, :payable_id, :amount).each do |p|
      total_amount += init[[p[0], p[1]]]
    end
    rows_count = query.count

    query = query
              .page(params[:page] + 1)
              .per(params[:pageSize])

    pages = query.total_pages

    payments = query.as_json(include: {
      due_payment: {
        include: {
          payment_schedule: {
            include: {
              user: {
                methods: %i[students get_users_paying_for_self]
              }
            }
          }
        }
      }
    })
    payments = payments.each { |p| p["amount"] = sum_amount_per_checknumber[[p["check_number"], p["payable_id"]]] }

    authorize! :read, payments

    render json: { payments: payments, pages: pages, rowsCount: rows_count, totalAmount: total_amount }
  end

  def check_status
    id = params[:id].to_i
    check = Payment.find(id)
    check.update!(check_status: params[:check_status])
    head :ok
  end

  def bulkedit
    @payments = Payment.where(id: params[:targets])

    @payments.update_all(operation: params[:operation]) if params.include? "operation"
    @payments.update_all(amount: params[:amount]) if params.include? "amount"
    @payments.update_all(payment_method_id: params[:payment_method_id]) if params.include? "payment_method_id"
    @payments.update_all("reception_date = TIMESTAMP '#{params[:reception_date]}'") if params.include? "reception_date"
    @payments.update_all("cashing_date = TIMESTAMP '#{params[:cashing_date]}'") if params.include? "cashing_date"
    @payments.update_all(check_issuer_name: params[:emitter]) if params.include? "emitter"
    if params.include? "first_check_number"
      (0..params["targets"].length - 1).each do |i|
        Payment.find(params["targets"][i]).update(check_number: params[:first_check_number] + i)
      end
    end
    if params.include? "status_id"
      @payments.update_all(payment_status_id: params[:status_id])
      @payments.each do |p|
        p.due_payment&.reevaluate_status
      end
    end

    @payments.map(&:due_payment).compact.uniq.each(&:reevaluate_status)

    render json: @payments.as_json({
                                     include: {
                                       due_payment: {
                                         methods: :adjusted_amount
                                       }
                                     }
                                   })
  end

  def bulkdelete
    targets = Payment.where(id: params["targets"])
    dues = targets.map(&:due_payment).compact
    targets.destroy_all
    dues.each(&:reevaluate_status)

    render json: dues.as_json
  end

  def import_file
    #  Preparing meta data for import
    #  TODO Refactor, we should only load them, they are supposed to exist already
    payer_not_found = FailedPaymentImportReason.find_or_create_by(code: "payer_not_found",
                                                                  label: "Payeur introuvable")
    payer_without_schedule = FailedPaymentImportReason.find_or_create_by(code: "payer_without_schedule",
                                                                         label: "Payeur sans échéancier")
    due_not_found = FailedPaymentImportReason.find_or_create_by(code: "due_not_found",
                                                                label: "Échéance introuvable")
    different_amounts = FailedPaymentImportReason.find_or_create_by(code: "different_amounts",
                                                                    label: "Montants différents")

    payment_unpaid_status = PaymentStatus::UNPAID
    payment_failed_status = PaymentStatus::FAILED

    due_payment_unpaid_status = DuePaymentStatus::UNPAID
    due_payment_failed_status = DuePaymentStatus::FAILED

    # On initialise quelque variable utiles
    french_date_format = "%d/%m/%y"
    total_inserted = 0
    total_ignored = 0
    failed_imports = []

    #  On charge le fichier en mémoire et on le parse
    file_csv = File.read(params["file"].path)

    tmp = CSV.parse(file_csv, col_sep: ";")

    bank_payments = tmp[1..].map do |row|
      rowTmp = {}.as_json

      tmp[0].each_with_index do |colname, i|
        rowTmp[colname] = row[i]
      end

      rowTmp
    end

    # On itère sur chaque ligne du CSV
    bank_payments.each do |bank_payment|
      #  Extraction des données qui nous intéresse dans le fichier csv
      due_date = Date.strptime(bank_payment["Date d’échéance"], french_date_format)
      due_status = bank_payment["Statut échéance"]
      unless bank_payment["Date d’opération"].nil?
        cashing_date = Date.strptime(bank_payment["Date d’opération"],
                                     french_date_format)
      end
      amount = bank_payment["Montant en €"].tr(",", ".").to_f
      first_name = bank_payment["Prénom OU SIREN"]
      last_name = bank_payment["Nom OU Raisons Sociale"]

      payer = User.where(
        "translate(
          LOWER(trim(last_name)),
          '-éàçäëïöüâêîôû''',
          ' eacaeiouaeiou'
        ) = translate(
          LOWER(trim(?)),
          '-éàçäëïöüâêîôû''',
          ' eacaeiouaeiou'
        ) AND translate(
          LOWER(trim(first_name)),
          '-éàçäëïöüâêîôû''',
          ' eacaeiouaeiou') = translate(
            LOWER(trim(?)),
            '-éàçäëïöüâêîôû''',
            ' eacaeiouaeiou')",
        last_name,
        first_name
      ).first

      # We look into contacts if the user wasn't found
      if payer.nil?
        failed_imports.push([first_name, last_name, due_date, cashing_date, amount, payer_not_found, nil])
        next
      end

      if payer.payment_schedules.none?
        failed_imports.push([first_name, last_name, due_date, cashing_date, amount, payer_without_schedule,
                             payer.id])
        next
      end

      due_payment_candidates = nil

      # Looks for due payments from the date the bank gave to two days before it
      # And groups them by date in a Hash
      due_payment_candidates = DuePayment
                                 .where(payment_schedule_id: payer
                                                               .payment_schedules
                                                               .select(:id))
                                 .where(
                                   "DATE(previsional_date) >= ? AND DATE(previsional_date) <= ?",
                                   due_date - 2,
                                   due_date + 2
                                 )
                                 .to_a
                                 .each_with_object({}) do |due, h|
        key = due.previsional_date.strftime("%Y-%m-%d")
        if !h[key].nil?
          h[key] << due
        else
          h[key] = [due]
        end
      end

      if due_payment_candidates.nil? || due_payment_candidates.empty?
        failed_imports.push([first_name, last_name, due_date, cashing_date, amount, due_not_found, payer.id])
        next
      end

      due_payments = []

      due_payment_candidates.keys.sort_by! { |d| (due_date - Date.strptime(d, "%Y-%m-%d")).abs }.each do |k|
        date_candidates = due_payment_candidates[k]

        amount_sum = date_candidates.reduce(0.0) { |acc, due| acc + due.amount }
        if (amount_sum - amount).abs < 0.01
          due_payments = date_candidates
          break
        else
          target_dues = date_candidates.select { |due| (due.amount - amount).abs < 0.01 }
          unless target_dues.empty?
            due_payments = [target_dues.first]
            break
          end
        end
      end

      if due_payments.empty?
        failed_imports.push([first_name, last_name, due_date, cashing_date, amount, different_amounts,
                             payer.id])
        next
      end

      if Payment.where(due_payment_id: due_payments.map(&:id)).first.nil?
        due_payment_status = nil
        pay_status = nil

        if due_status.downcase != "exécutée"
          due_payment_status = due_payment_unpaid_status
          pay_status = payment_unpaid_status
        end

        if due_status.downcase == "bloquée passée"
          due_payment_status = due_payment_failed_status
          pay_status = payment_failed_status
        end

        Payment.transaction do
          due_payments.each do |due|
            due.update(due_payment_status: due_payment_status)

            Payment.create(
              due_payment_id: due.id,
              payable_id: payer.id,
              payable_type: "User",
              payment_method_id: due.payment_method_id,
              cashing_date: due.previsional_date,
              payment_status: pay_status,
              amount: due.amount
            )
            # due.update(due_payment_status_id: nil) # Why set it to nil here if we update it before ?
          end
        end

        total_inserted += 1
      else
        total_ignored += 1
      end
    end

    unless failed_imports.empty?
      failed_imports = failed_imports.map do |to_insert|
        imp = FailedPaymentImport.find_by(
          first_name: to_insert[0],
          last_name: to_insert[1],
          due_date: to_insert[2],
          cashing_date: to_insert[3],
          amount: to_insert[4],
          failed_payment_import_reason_id: to_insert[5],
          user_id: to_insert[6]
        )

        if !imp.nil?
          total_ignored += 1
          nil
        else
          FailedPaymentImport.create!(
            first_name: to_insert[0],
            last_name: to_insert[1],
            due_date: to_insert[2],
            cashing_date: to_insert[3],
            amount: to_insert[4],
            failed_payment_import_reason: to_insert[5],
            user_id: to_insert[6]
          )
        end
      end
                                     .compact
    end

    render json: { inserted: total_inserted, failed: failed_imports.size, ignored: total_ignored }
  end

  def edit_status
    id = params[:id].to_i
    status_id = params[:status].to_i

    payment = Payment.find(id)
    new_status = PaymentStatus.find(status_id)

    payment.update payment_status: new_status if !payment.nil? && !new_status.nil?
  end

  def send_reglement_mail
    if params[:targets].length == 1
      payment = Payment.find(params[:targets][0])
      unless payment.nil?
        if payment.payment_status_id == PaymentStatus::UNPAID_ID
          if payment.cashing_date.nil? || payment.cashing_date <= DateTime.now
            ReglementReminderMailer.send_reglement_reminder(payment.user, [payment]).deliver_later
          end
        end
      end
    else
      selected_users = params[:targets].map do |id|
        payment = Payment.find(id)
        user = nil

        if payment&.payable_id
          user = User.find(payment.payable_id)
        end

        user
      end

      selected_users.compact!.uniq!

      selected_users.each do |user|
        payments = user.payments.select { |p| p.payment_status_id == PaymentStatus::UNPAID_ID }.uniq
        reglements = payments.select { |p| p.cashing_date.nil? || p.cashing_date <= DateTime.now }
        ReglementReminderMailer.send_reglement_reminder(user, reglements).deliver_later
      end
    end

    respond_to do |format|
      format.json { render json: {
        status: "success"
      } }
    end
  end

  private

  def payment_params
    params.require(:payment).permit(
      :user_id,
      :reception_date,
      :cashing_date,
      :operation,
      :amount,
      :payment_method_id,
      :due_payment_id,
      :check_number,
      :check_issuer_name,
      :payer,
      :payment_status_id
    )
  end

  # @param [Array<DuePayment>] due_payments
  # @param [Array<Payment>] payments
  # @param [Array<Hash>] items_for_payments
  def calculate_totals(due_payments, payments, items_for_payments)
    total_due = items_for_payments
                  .reduce(0.0) { |acc, d| acc + Float(d[:due_total]) }
                  .round(2)

    previsionnal_total = due_payments
                           .reduce(0.0) { |acc, d| acc + d.adjusted_amount }
                           .round(2)

    total_payments = payments
                       .reduce(0.0) { |acc, p| acc + p.adjusted_amount }
                       .round(2)

    total_payback = payments
                      .map { |p| p.adjusted_amount }
                      .compact
                      .reduce(0.0) { |acc, p| acc + p }
                      .round(2)

    total_payments_to_day = payments
                              .filter { |p| p.payment_status_id == PaymentStatus::PAID_ID && p.cashing_date <= DateTime.now }
                              .reduce(0.0) { |acc, p| acc + p.adjusted_amount }
                              .round(2)

    r={
      total_due: total_due,
      previsionnal_total: previsionnal_total,
      total_payments: total_payments,
      total_payback: total_payback,
      total_payments_to_day: total_payments_to_day
    }
    puts "=================="
    puts "r=#{r.inspect}"
    r
  end

  def generate_data_for_payment_summary_table(season_id)
    # ce code est une stricte retranscription en Ruby de la fonction generateDataForPaymentSummaryTable() (userPayments/PaymentsManagement.js)
    data = []
    desired = @desired_activities[season_id.to_s]
    season_activities = @activities_json.select { |act| desired.select { |d| d["activity_id"] == act["activity_id"] } }

    season_activities.each do |act|
      a = act["activity"]
      des = desired.find do |d|
        d["activity_id"] == act["activity_id"] &&
          d["activity_application"]["user_id"] == act["user_id"]
      end
      next unless des

      activity_nb_lessons = a["intended_nb_lessons"]
      price_association = a["activity_ref"]["activity_ref_pricing"].find do |p|
        p["pricing_id"] == des["pricing_id"] && p["season_id"] == season_id
      end
      amount = 0
      if price_association && price_association["price"]
        amount = ((price_association["price"] / activity_nb_lessons) * (des["prorata"] || activity_nb_lessons)).round(2)
        pp amount
      end

      data.push({
                  id: des["id"],
                  activity: "#{a['activity_ref']['label']} (#{a['activity_ref']['kind']})",
                  stopped_at: des["activity_application"]["stopped_at"],
                  des: nil,
                  ref: a["activity_ref"],
                  prorata: des["prorata"],
                  studentId: act["id"],
                  user: act["user"],
                  pricingId: des["pricing_id"],
                  activityId: a["id"],
                  paymentLocation: act["payment_location"],
                  due_total: amount || 0
                })
    end

    taken = data.map { |d| d["activityId"] }
    taken_desired = data.map { |d| d["id"] }

    @options.each do |option|
      next if taken.include? option["activity"]["id"]

      a = option["activity"]
      des = desired.find { |d| d["id"] == option["desired_activity_id"] }

      next unless des && !taken_desired.include?(des["id"])

      taken_desired.push(des.id)
      activity_nb_lessons = a["intended_nb_lessons"]

      price_association = des["activity_ref"]["activity_ref_pricing"].find do |p|
        p["pricing_id"] == des["pricing_id"] && p["season_id"] == season_id
      end
      amount = 0
      if price_association && price_association.price
        amount = ((price_association["price"] / activity_nb_lessons) * (des["prorata"] || activity_nb_lessons)).round(2)
      end

      const formattedOption = {
        id: des["id"],
        activity: "#{a['activity_ref']['label']} (#{a['activity_ref']['kind']})",
        des: nil,
        ref: des["activity_ref"],
        prorata: des["prorata"],
        studentId: option["id"],
        user: option["desired_activity"]["activity_application"]["user"],
        pricingId: des["pricing_id"],
        paymentLocation: option["payment_location"],
        due_total: amount || 0,
        isOption: true
      }
      data.push(formattedOption)
    end

    if Adhesion.enabled
      #users = season_activities.map { |a| a["user"] }
      #adhesion_objects = users.map { |u| u["adhesions"] }.flatten.filter { |a| a["season_id"] == season_id }.uniq { |a| a["id"] }

      @adhesions.each do |adhesion|
        user = User.find(adhesion["user_id"])
        #user = users.find { |u| u["id"] == adhesion["user_id"] }
        #next if user.nil?

        adhesion_price = AdhesionPrice.find_by(id: adhesion["adhesion_price_id"])

        if adhesion_price
          data.push({
                      id: 0,
                      activity: "Adhésion de #{user.first_name} #{user.last_name}",
                      frequency: 1,
                      initial_total: 1,
                      due_total: adhesion_price["price"] || 0,
                      unitPrice: adhesion_price["price"] || 0,
                      user: user,
                      studentId: user.id,
                      adhesionPriceId: adhesion_price["id"],
                      adhesionId: adhesion["id"],
                    })
        end
      end
    end

    data
  end
end
