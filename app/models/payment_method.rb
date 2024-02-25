# == Schema Information
#
# Table name: payment_methods
#
#  id                          :bigint           not null, primary key
#  label                       :string
#  created_at                  :datetime         not null
#  updated_at                  :datetime         not null
#  is_special                  :boolean
#  is_credit_note              :boolean          default(FALSE)
#  built_in                    :boolean          default(FALSE)
#  show_payment_method_to_user :boolean          default(FALSE)
#

class PaymentMethod < ApplicationRecord
    #extend Elvis::ConstantLike

    scope :displayable, -> { where(show_payment_method_to_user: true, is_credit_note: false) }

    def self.mark_as_built_in
        BUILTINS.map do |c|
            c.update! built_in: true
        end
    end

    #########################################################
    # /!\ conserver ces identifiants                      /!\
    #########################################################
    CASH_ID = 1
    CHECK_ID = 2
    BANK_DEBIT_ID = 6
    CREDIT_CARD_ID = 8
    BANK_TRANSFER_ID = 12
    #########################################################
    #########################################################

    CASH = find_or_create_by!(id: CASH_ID, label: 'Espèces')
    CHECK = find_or_create_by!(id: CHECK_ID, label: 'Chèque')
    BANK_DEBIT = find_or_create_by!(id: BANK_DEBIT_ID, label: 'Prélèvement')
    CREDIT_CARD = find_or_create_by!(id: CREDIT_CARD_ID, label: 'CB')
    BANK_TRANSFER = find_or_create_by!(id: BANK_TRANSFER_ID, label: 'Virement')

    BUILTINS = [CASH, CHECK, BANK_DEBIT, CREDIT_CARD, BANK_TRANSFER]
    BUILTIN_IDS = [CASH_ID, CHECK_ID, BANK_DEBIT_ID, CREDIT_CARD_ID, BANK_TRANSFER_ID]

    mark_as_built_in

    # réinitialise la séquence de l'ID pour permettre de créer des prochains objets en base
    ActiveRecord::Base.connection.reset_pk_sequence!(table_name)
    #reset_pk_sequence

    def self.display_class_name(singular = true)
        singular ? "moyen de paiement" : "moyens de paiement"
    end

    def self.class_name_gender
        return :F
    end


end
