Season.all.each do |s, i|
    FamilyMemberUser.all.each do |fm|
        if i == 0
            fm.update(season_id: s.id)
        else
            FamilyMemberUser.find_or_create_by!(
                is_paying_for: fm.is_paying_for,
                is_legal_referent: fm.is_legal_referent,
                is_to_call: fm.is_to_call,
                is_accompanying: fm.is_accompanying,
                link: fm.link,
                user_id: fm.user_id,
                member_id: fm.member_id,
                season_id: s.id,
            )
        end
    end
end