# == Schema Information
#
# Table name: students
#
#  id                :bigint           not null, primary key
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  user_id           :bigint
#  activity_id       :bigint
#  payment_frequency :integer
#  payment_method_id :bigint
#  payment_location  :string           default("lh")
#

class Student < ApplicationRecord
    belongs_to :user
    belongs_to :activity
    belongs_to :payment_method, optional: true

    def self.display_class_name(singular = true)
        singular ? "élève" : "élèves"
    end

    def self.class_name_gender
        return :M
    end


    def get_price
        amount = 0
        case self.payment_frequency
        when 1, 12
            amount = self.activity.activity_ref.annual_price
        when 3
            amount = self.activity.activity_ref.quarterly_price
        when 10
            amount = self.activity.activity_ref.monthly_price
        when 11
            amount = self.activity.activity_ref.special_price
        when 13
            amount = floor2(self.activity.activity_ref.annual_price * 0.95, 2)
        else
            amount = 1111
        end

        return amount
    end

    def get_price_format
        format = "annuel"
        case self.payment_frequency
        when 1, 12
            format = "annuel"
        when 3
            format = "trimestriel"
        when 10
            format = "mensuel"
        when 11
            format = "annuel"
        when 13
            format = "annuel -5%"
        else
            format = "annuel"
        end

        return format
    end

    private
        def floor2(value, exp = 0)
            multiplier = 10 ** exp
            ((value * multiplier).floor).to_f/multiplier.to_f
        end
end
