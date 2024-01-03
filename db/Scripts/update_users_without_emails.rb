updated_rows = []

ActiveRecord::Base.transaction do
  user_without_email = User.where(email: '').to_a

  user_without_email.each do |user|
    user = user
    fmas = user.family_member_users.to_a
    user.inverse_family_members.to_a.each { |fm| fmas << fm }

    fmas.each do |family_member_user|
      updated_rows.push(user.dup)

      if family_member_user.user_id == user.id
        user.update_column(:email, family_member_user.member.email) if family_member_user.member&.email
      else
        user.update_column(:email, family_member_user.user.email) if family_member_user.user&.email
      end
    end
  end

  File.open("updated_rows.txt", "w") do |f|
    f.write(updated_rows)
  end
end