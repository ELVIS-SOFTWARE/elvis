# == Schema Information
#
# Table name: payment_schedules
#
#  id                         :bigint           not null, primary key
#  payable_id                 :bigint
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#  payable_type               :string
#  location_id                :bigint
#  season_id                  :bigint
#  payment_schedule_status_id :bigint
#

class PaymentSchedule < ApplicationRecord
    has_many :due_payments, dependent: :destroy

    has_many :comments, as: :commentable

    belongs_to :payment_schedule_status

    # belongs_to :payable, :polymorphic => true
    belongs_to :user, :foreign_key => :payable_id

    belongs_to :location, optional: true
    belongs_to :season, optional: true

    def self.display_class_name(singular= true)
      singular ? "échéancier" : "échéanciers"
    end

    def self.class_name_gender
      return :M
    end

    def get_due_payment_number
        prev = self.due_payments.pluck(:number).compact.max
        prev.nil? ? 1 : prev + 1
    end

    def deep_location_update(location)
      self.update(location_id: location.id)
      self.due_payments.update_all(location_id: location.id)
      self.due_payments.each do |due_payment|
        due_payment.payments.update_all(location_id: location.id)
      end
    end

    # Instruction permettant de supprimer un objet utilisant la classe courante
    # @param [ApplicationRecord] source_object objet qui a appelé la méthode
    # @return [{ instruction: String, possible: Boolean }]
    def undeletable_instruction(source_object = nil)
      case source_object
      when Season
        { instruction: "des paiements sont reliés à cette saison", possible: false }
      else
        super
      end
    end
end
