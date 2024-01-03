def or_reduce(arr, field)
    arr.reduce(false){|acc, member| acc or member[field]}
end

flags = [:is_legal_referent, :is_to_call, :is_paying_for, :is_accompanying]

duplicate_members = FamilyMemberUser
    .all
    .group_by{|m| m.user_id.to_s + m.member_id.to_s}
    .select{|k,v|v.count > 1}

FamilyMemberUser.transaction do
    duplicate_members.each do |k, v|
        updates_h = Hash[flags.zip(flags.map{|f| or_reduce(v, f)})]
        
        v.first.update!(updates_h)
        v[1..v.count].each(&:destroy!)
    end
end