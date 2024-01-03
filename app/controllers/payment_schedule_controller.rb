class PaymentScheduleController < ApplicationController
    def show
        @current_user = current_user

        @school = School.first
        @schedule = PaymentSchedule.includes({ due_payments: [:payment_method], user: [] }).find(params[:id])
        @activities = @schedule.user.get_list_of_activities
        @due_payments = @schedule.due_payments.sort_by { |dp| dp.number }
        @total_due = @schedule.due_payments.sum { |dp| dp.amount }

        respond_to do |format|
            format.html
            format.pdf do
                render pdf: "échéancier_#{@schedule.id}_#{@schedule.user.first_name}_#{@schedule.user.last_name}",
                    template: "payment_schedule/show.html.erb",
                    layout: "pdf.html",
                    encoding: "utf8",
                    show_as_html: false
            end
        end
    end

    def create
        if params[:schedule_id] != nil
            # Soit on met à jour le schedule
            schedule = PaymentSchedule.find(params[:schedule_id])
            params[:schedule][:duePayments].each do |dp|
                newDue = DuePayment.create({
                    number: dp[:id],
                    amount: dp[:amount],
                    previsional_date: dp[:date],
                    payment_method_id: dp[:payment_method_id]
                })
                newDue.reevaluate_status
                schedule.due_payments << newDue
            end

            schedule.save!

            render :json => schedule.as_json({
                include: {
                    :due_payments => {
                        include: {
                          :payments => {
                            :methods => :adjusted_amount,
                          },
                        },
                        :methods => :adjusted_amount,
                    },
                }
            })

        else # Soit on en crée un nouveau
            schedule = PaymentSchedule.new
            params[:schedule][:duePayments].each do |dp|
                newDue = DuePayment.create({
                    number: dp[:id],
                    amount: dp[:amount],
                    previsional_date: dp[:date],
                    payment_method_id: dp[:payment_method_id]
                })
                newDue.reevaluate_status
                schedule.due_payments << newDue
            end
            schedule.payable_id = params[:schedule][:payer][:id]
            schedule.season_id = params[:schedule][:season_id]
            schedule.payable_type = params[:schedule][:payer][:class_name]
            schedule.payment_schedule_status = PaymentScheduleStatus.find_by(label: "En attente de règlement")

            schedule.save!
            render :json => schedule.as_json(include: {
              :due_payments => {
                :methods => :adjusted_amount,
              },
            })
        end
    end

    ############################################
    #  Méthode plus utilisée ??

    # def migrate_locations_to_payments
    #   location = Location.find_by(label: "Le Havre")
    #   ActivityApplication.all.each do |activity_application|
    #     ActivityApplication.transaction do
    #       first_desired_activity = activity_application.desired_activities.first

    #       if !first_desired_activity.nil? and !first_desired_activity.activity.nil?
    #         location = first_desired_activity.activity.location unless first_desired_activity.activity.location.nil?

    #         activity_application.user.get_co_payers.each do |payer|
    #           unless payer.payment_schedule.nil?
    #             payer.payment_schedule.deep_location_update(location.id)
    #           end
    #         end
    #       end
    #     end
    #   end

    #   PaymentSchedule.where("location_id is null").find_each do |schedule|
    #     schedule.deep_location_update(location.id)
    #   end
    # end

    
    def change_owner
      schedule = PaymentSchedule.find(params[:id])
      owner = schedule.user
      new_owner = User.find(params[:user_id])

      authorize! :destroy, schedule
      begin
      PaymentSchedule.transaction do
        new_owner_schedule = new_owner
          .payment_schedules
          .create_with(payment_schedule_status_id: schedule.payment_schedule_status_id, payable_type: "User")
          .find_or_create_by!(season: schedule.season)

        # retrieve original owners paying members
        schedule
          .user
          .get_users_paying_for_self(schedule.season)
          .each do |u|
            if u != new_owner
              # link new owner to payees
              FamilyMemberUser.find_or_create_by!(user_id: u.id, member_id: new_owner.id, season: schedule.season, is_paying_for: true)
            end
          end

        (new_owner_schedule.due_payments << schedule.due_payments)
          .includes(:payments)
          .map(&:payments)
          .flatten
          .each do |p|
          p.update!(payable_id: new_owner.id)
        end

        schedule.delete

        render :json => new_owner_schedule
      end
      rescue 
        render :json => {
          errors: "default",
        }
      end
    end

    def change_location
        location = Location.find(params[:locationId])
        schedules = PaymentSchedule.includes(:location).where(id: params[:schedulesIds])

        schedules.each do |sch|
            sch.deep_location_update(location)
        end
    end

    def update
      payment_schedule = PaymentSchedule.find params[:id]
      status = PaymentScheduleStatus.find params[:schedule_status_id]
      payment_schedule.payment_schedule_status = status
      payment_schedule.save
    end

    def destroy
      payment_schedule = PaymentSchedule.find params[:id]

      payment_schedule.destroy
    end
end
