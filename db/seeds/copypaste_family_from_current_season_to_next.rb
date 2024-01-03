current_season = Season.current;
next_season = Season.next;
FamilyMemberUser.transaction do
    to_create = []
    FamilyMemberUser.where(season_id: current_season).each{|fmu|  
        to_create.append({
            user_id: fmu.user_id, 
            member_id: fmu.member_id, 
            link: fmu.link, 
            season_id: next_season.id, 
            is_accompanying: fmu.is_accompanying, 
            is_paying_for: fmu.is_paying_for, 
            is_legal_referent: fmu.is_legal_referent, 
            is_to_call: fmu.is_to_call, 
        }) 
    };
    FamilyMemberUser.create!(to_create)
end