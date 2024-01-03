class ConfirmationsController < Devise::ConfirmationsController
    # layout "devise"

    def show
        with_unconfirmed_confirmable do
            if @confirmable.has_no_password?
                do_show
            else
                do_confirm
            end
        end

        unless @confirmable.errors.empty?
            self.resource = @confirmable
            render "confirmations/show"
        end
    end

    def confirm
        with_unconfirmed_confirmable do
            if @confirmable.has_no_password?
                @confirmable.attempt_set_password(params[:user]) if params[:user].present?
                if @confirmable.valid? and @confirmable.password_match?
                    do_confirm
                else
                    do_show
                end
            else
                @confirmable.errors.add(:email, :password_already_set)
                do_show
            end
        end
    end

    protected
    def with_unconfirmed_confirmable
        if params[:confirmation_token].present?
            @original_token = params[:confirmation_token]
        elsif params[resource_name].try(:[], :confirmation_token).present?
            @original_token = params[resource_name][:confirmation_token]
        end

        if params[resource_name].try(:[], :id).present?
            @confirmable = User.find(params[resource_name][:id])
        else
            @confirmable = User.find(params[:format])
        end

        
        if !@confirmable.confirmation_token.present? || @confirmable.confirmation_token != @original_token
            return
        end

        if !@confirmable.new_record?
            @confirmable.only_if_unconfirmed {yield}
        end

    end

    def do_show
        if params[:confirmation_token].present?
            @original_token = params[:confirmation_token]
        elsif params[resource_name].try(:confirmation_token).present?
            @original_token = params[resource_name][:confirmation]
        end

        @confirmable = User.find_or_initialize_with_error_by(:confirmation_token, @original_token) unless @confirmable
        @requires_password = true
        self.resource = @confirmable
        render 'confirmations/show'
    end

    def do_confirm
        @confirmable.confirm
        set_flash_message :notice, :confirmed
        sign_in_and_redirect(resource_name, @confirmable)
    end
end
