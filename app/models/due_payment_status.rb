
# == Schema Information
#
# Table name: due_payment_statuses
#
#  id         :bigint           not null, primary key
#  label      :string
#  color      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  built_in   :boolean          default(FALSE)
#

class DuePaymentStatus < ApplicationRecord
    extend Elvis::ConstantLike

    def self.mark_as_built_in
        BUILTINS.map do |c|
            c.update! built_in: true
        end
    end


    #########################################################
    # /!\ conserver ces identifiants                      /!\
    #########################################################
    PAID_ID = 1
    FAILED_ID = 2
    PENDING_ID = 3
    REFUNDED_ID = 4
    UNPAID_ID = 5
    #########################################################
    #########################################################

    BUILTIN_IDS = [PAID_ID, FAILED_ID, PENDING_ID, REFUNDED_ID, UNPAID_ID].freeze

    PAID = find_or_create_by!(id: PAID_ID, label: "Payée", color: "#1ab394")
    FAILED = find_or_create_by!(id: FAILED_ID, label: "Echouée", color: "#f8ac59")
    PENDING = find_or_create_by!(id: PENDING_ID, label: "En Attente", color: "#23c6c8")
    REFUNDED = find_or_create_by!(id: REFUNDED_ID, label: "Remboursée", color: "")
    UNPAID = find_or_create_by!(id: UNPAID_ID, label: "Impayée", color: "#f8ac59")

    BUILTINS = [PAID, FAILED, PENDING, REFUNDED, UNPAID].freeze

    mark_as_built_in

    # réinitialise, si besoin, la séquence de l'ID pour permettre de créer des prochains objets en base
    reset_pk_sequence

    def self.display_class_name(singular = true)
        singular ? "statut d'échéance" : "statuts d'échéance"
    end

    def self.class_name_gender
        return :M
    end


end
