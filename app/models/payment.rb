# == Schema Information
#
# Table name: payments
#
#  id                :bigint           not null, primary key
#  payable_id        :bigint
#  payment_method_id :bigint
#  reception_date    :datetime
#  cashing_date      :date
#  amount            :decimal(, )
#  direction         :boolean
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  due_payment_id    :bigint
#  check_number      :string
#  payable_type      :string
#  check_issuer_name :string
#  payment_status_id :bigint
#  location_id       :bigint
#  operation         :string(1)        default("+")
#  check_status      :boolean          default(FALSE)
#

class Payment < ApplicationRecord
  belongs_to :user, foreign_key: :payable_id, optional: true

  belongs_to :due_payment, optional: true
  belongs_to :payment_method, optional: true

  belongs_to :payment_status, optional: true

  belongs_to :location, optional: true

  def self.display_class_name(singular= true)
    singular ? "règlement" : "règlements"
  end

  def self.class_name_gender
    return :M
  end

  def adjusted_amount
    case operation
    when "-"
      -amount
    when "0"
      0
    when "+"
      amount
    end
  end

  def self.update_payer
    Payment.all.each do |p|
      old_payable = p.payable
      old_payable = User.find(p.payable_id) if old_payable.nil?

      next if old_payable.instance_of?(Contact)

      new_payable = old_payable.get_paying_family_member

      p.payable = new_payable
      p.save!
    end
  end

  def as_json(options = {})
    super options.merge(methods: :adjusted_amount)
  end

  # Instruction permettant de supprimer un objet utilisant la classe courante
  # @param [ApplicationRecord] source_object objet qui a appelé la méthode
  # @return [Hash{Symbol => String, Boolean}]
  def undeletable_instruction(source_object = nil)
    case source_object
    when User
      { instruction: "Il a déjà effectué des paiements", possible: false }
    else
      super
    end
  end
end
