
# == Schema Information
#
# Table name: payment_statuses
#
#  id         :bigint           not null, primary key
#  label      :string
#  color      :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  built_in   :boolean          default(FALSE)
#

class PaymentStatus < ApplicationRecord
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
    UNPAID_ID = 4
    #########################################################
    #########################################################

    BUILTIN_IDS = [PAID_ID, FAILED_ID, PENDING_ID, UNPAID_ID].freeze

    PAID = find_or_create_by!(id: PAID_ID, label: "Validé", color: "#1ab394")
    FAILED = find_or_create_by!(id: FAILED_ID, label: "Echoué", color: "#f8ac59")
    PENDING = find_or_create_by!(id: PENDING_ID, label: "En attente", color: "#23c6c8")
    UNPAID = find_or_create_by!(id: UNPAID_ID, label: "Impayé", color: "#f8ac59")

    BUILTINS = [PAID, FAILED, PENDING, UNPAID].freeze

    mark_as_built_in

    # réinitialise, si besoin, la séquence de l'ID pour permettre de créer des prochains objets en base
    reset_pk_sequence

    def self.display_class_name(singular = true)
        singular ? "statut de paiement" : "statut de paiement"
    end

    def self.class_name_gender
        return :M
    end


end
