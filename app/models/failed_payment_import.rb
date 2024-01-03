# == Schema Information
#
# Table name: failed_payment_imports
#
#  id                              :bigint           not null, primary key
#  first_name                      :string
#  last_name                       :string
#  due_date                        :string
#  cashing_date                    :string
#  amount                          :decimal(, )
#  created_at                      :datetime         not null
#  updated_at                      :datetime         not null
#  reason                          :string
#  failed_payment_import_reason_id :bigint
#  user_id                         :bigint
#

class FailedPaymentImport < ApplicationRecord
    belongs_to :failed_payment_import_reason
    belongs_to :user, optional: true

    def self.display_class_name(singular = true)
        singular ? "import d'échecs de paiements" : "imports d'échecs de paiements"
    end

    def self.class_name_gender
        return :M
    end

end
