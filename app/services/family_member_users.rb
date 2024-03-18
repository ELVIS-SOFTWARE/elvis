# frozen_string_literal: true
module FamilyMemberUsers
  def self.inverse_link(link, sex)
    case link
    when "père", "mère"
      "enfant"
    when "grand-mère", "grand-père"
      "petit-enfant"
    when "petit-enfant"
      if sex == "M"
        "grand-père"
      else
        "grand-mère"
      end
    when "enfant"
      if sex == "M"
        "père"
      else
        "mère"
      end
    when "frère", "soeur"
      if sex == "M"
        "frère"
      else
        "soeur"
      end
    when "époux"
      "époux"
    else
      "autre"
    end
  end

  def self.addFamilyMemberWithConfirmation(family, user, season, send_confirmation: true)
    #is_created = false
    family&.each do |member|
      fmu = if member[:id]
             User.find(member[:id])
            else
              # on ne change pas le lien d'attachement ici...
             User.new(
               attached_to_id: member[:attach_to_user] ? user.id : nil,
             )
           end

      #is_created ||= member[:id].nil?

      fmu.email = if fmu.attached? && fmu.email == user.email
                    nil
                  else
                    member[:email]
                  end
      fmu.first_name = member[:first_name]
      fmu.last_name = member[:last_name]
      fmu.birthday = member[:birthday]

      link = member[:link]

      # Pas la meilleur façon de faire. Mais la plus rapide (à coder)
      fmu.sex = if %w[père grand-père frère].include? link
                 "M"
               else
                 %w[mère grand-mère soeur].include? link ? "F" : ""
               end

      if fmu.save! && send_confirmation && member[:id].nil? && fmu.email != user.email
        begin
          Devise::Mailer.confirmation_instructions(fmu, fmu.confirmation_token).deliver_now
        rescue StandardError => e
          Rails.logger.error "Error while sending confirmation email to #{fmu.email} : #{e.message}"
        end
      end

      phones = []
      member[:telephones]&.each do |p|
        phones << Telephone.new({ number: p[:number], label: p[:label]})
      end
      fmu.telephones = phones

      fmu.update_addresses member[:addresses] unless member[:addresses].nil?
      user_id = user.id
      member_id = fmu.id
      initial_is_inverse = !member[:initial_is_inverse].nil? ? member[:initial_is_inverse] : member[:is_inverse]

      user_id, member_id = member_id, user_id if initial_is_inverse

      family_member = FamilyMemberUser
                        .order(:season_id)
                        .where(user_id: user_id, member_id: member_id, season_id: season.id)
                        .first_or_create!(user_id: user_id, member_id: member_id, season_id: season.id)

      if initial_is_inverse != member[:is_inverse]
        family_member.user_id = member_id
        family_member.member_id = user_id
      end

      family_member.is_accompanying = member[:is_accompanying]
      family_member.is_paying_for = member[:is_paying_for]
      family_member.is_legal_referent = member[:is_legal_referent]
      family_member.is_to_call = member[:is_to_call]
      family_member.link = member[:is_inverse] ? FamilyMemberUsers.inverse_link(member[:link], member[:sex]) : member[:link]
      family_member.save!
    end
  end
end
