# == Schema Information
#
# Table name: desired_activities
#
#  id                      :bigint           not null, primary key
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#  activity_ref_id         :bigint
#  activity_application_id :bigint
#  is_validated            :boolean          default(FALSE)
#  activity_id             :integer
#  payment_frequency       :integer
#  pricing_id              :bigint
#  prorata                 :integer
#  prorata_amount          :decimal(, )
#  deleted_at              :datetime
#

class DesiredActivity < ApplicationRecord
  acts_as_paranoid

  belongs_to :activity_ref
  belongs_to :activity_ref_csv, -> { select(:id, :label) }, class_name: "ActivityRef", required: false
  belongs_to :activity_application
  belongs_to :activity, optional: true
  belongs_to :pricing_category, optional: true

  has_many :options, dependent: :destroy

  has_one :user, through: :activity_application
  has_one :discount, as: :discountable, dependent: :destroy


  def self.display_class_name(singular = true)
    singular ? "activité souhaitée" : "activités souhaitées"
  end

  def self.class_name_gender
    return :F
  end

  def add_option(activity_id)
    options.find_or_create_by!(activity_id: activity_id)
  end

  def remove_option(activity_id)
    options.destroy(Option.find_by(activity_id: activity_id))
  end

  def get_price
    amount = 0
    case payment_frequency
    when 1, 12
      amount = activity_ref.annual_price
    when 3
      amount = activity_ref.quarterly_price
    when 10
      amount = activity_ref.monthly_price
    when 11
      amount = activity_ref.special_price
    when 13
      amount = floor2(activity_ref.annual_price * 0.95, 2)
    else
      amount = 0
    end

    amount
  end

  def get_price_format
    format = "annuel"
    case payment_frequency
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

    format
  end

  private

  def floor2(value, exp = 0)
    multiplier = 10**exp
    (value * multiplier).floor.to_f / multiplier.to_f
  end

  def pre_destroy
    Activity.find(activity_id).remove_student(id) if is_validated
    additional_student = AdditionalStudent.find_by(desired_activity_id: id)
    additional_student&.delete
  end
end
