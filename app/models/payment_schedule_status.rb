# == Schema Information
#
# Table name: payment_schedule_statuses
#
#  id         :bigint           not null, primary key
#  label      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class PaymentScheduleStatus < ApplicationRecord

  def self.display_class_name(singular = true)
    singular ? "statut d'échéancier" : "status d'échéancier"
  end

  def self.class_name_gender
    return :M
  end

end
