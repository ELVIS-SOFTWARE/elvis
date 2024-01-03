# frozen_string_literal: true
module Templates
  class PaymentSerializer < ActiveModel::Serializer
    attribute "cashing_date", key: "date d'encaissement" do
      object.cashing_date&.strftime('%d/%m/%Y')
    end

    attribute "payer_name", key: "Titulaire du RIB"  do
      payer.nil? ? "?" : "#{payer.first_name} #{payer.last_name}"
    end

    attribute "adherent_numbers", key: "N° d'adhérent(s)"

    attribute "amount", key: "Montant initial"

    attribute "operation", key: "Opération (+, -, 0)"

    attribute "lesson_amount", key: "Cours" do
      object.due_payment&.number&.zero? ?
        0 :
        amount
    end

    attribute "adh_amount", key: "Adhésion" do
      object.due_payment&.number&.zero? ?
        amount :
        0
    end

    attribute "total", key: "Total" do
      amount
    end


    def adherent_numbers
      return if payer.nil?

      payer
        .get_list_of_activities(season)
        .map(&:user)
        .pluck(:adherent_number)
        .uniq
        .join(", ")
    end

    def amount
      @amount ||= object.amount.to_s(:rounded, precision: 2, locale: :fr)
    end

    private
    def payer
      @payer ||= object.due_payment&.payment_schedule&.user
    end

    def season
      @season ||= object.due_payment&.payment_schedule&.season
    end
  end

end