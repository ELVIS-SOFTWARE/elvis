class PricingApiController < ApplicationController
    def create
        @newPricing = Pricing.create(pricing_params)

        respond_to do |format|
            format.json do
                if @newPricing.valid?
                    render json: @newPricing
                else
                    render json: @newPricing.errors.full_messages.join(", "), status: :unprocessable_entity
                end
            end

            format.html do
                redirect_to "#{parameters_payment_parameters_path}#tab-2"
            end
        end
    end

    def migrate_old_pricing_choices
        @annual = Pricing.find_or_create_by(label: "Annuel")
        @quarterly = Pricing.find_or_create_by(label: "Trimestriel")
        @monthly = Pricing.find_or_create_by(label: "Mensuel")
        @special = Pricing.find_or_create_by(label: "Spécial")
        @two_pers = Pricing.find_or_create_by(label: "2 personnes de la même famille")
        @three_pers = Pricing.find_or_create_by(label: "-5% (3+ personnes de la même famille)")

        DesiredActivity.all.each do |des|
            ref = des.activity_ref

            case des.payment_frequency
            when 1
                des.update!(pricing: ref.pricings.find(@annual.id))
            when 3
                des.update!(pricing: ref.pricings.find(@quarterly.id))
            when 10
                des.update!(pricing: ref.pricings.find(@monthly.id))
            when 11
                des.update!(pricing: ref.pricings.find(@special.id))
            when 12
                des.update!(pricing: ref.pricings.find(@two_pers.id))
            when 13
                des.update!(pricing: ref.pricings.find(@three_pers.id))
            else
            end
        end
    end

    private
    def pricing_params
        params.require(:pricing).permit(:label)
    end
end
