# frozen_string_literal: true
module Templates
  class UserSerializer < ActiveModel::Serializer
    attribute "adherent_number", key: "Numéro d'adhérent"
    attribute "last_name", key: "Nom"
    attribute "first_name", key: "Prénom"
    attribute "email", key: "Email"
    attribute "phone", key: "Téléphone"
    attribute "birthday", key: "Date de naissance"

    ConsentDocument.all.each do |consent_document|
      id = consent_document.title.tr(" ", "_").underscore

      attribute id, key: consent_document.title

      define_method id do
        consented = object.consent_document_users.where(consent_document_id: consent_document.id).first&.has_consented

        case
        when consented.nil?
          "?"
        when consented
          "Oui"
        else
          "Non"
        end
      end
    end

    def phone
      phone = object.telephones.find_by(label: "portable") || object.telephones.first
      phone&.number || "?"
    end

    def birthday
      object.birthday && object.birthday.strftime("%d/%m/%Y") || "?"
    end
  end

end