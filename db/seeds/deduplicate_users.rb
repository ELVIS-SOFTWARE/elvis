query = nil
total = 0
duplicatas = []
User.transaction do 
    User.group("lower(last_name)","lower(first_name)", :birthday).where.not(birthday: nil).count.select{ |k,v| v > 1 }.each{ |k,v|
        query = User.where("lower(last_name) = ? AND lower(first_name) = ? AND birthday = ?",k[0],k[1], k[2]).order(updated_at: :desc)
        total += 1
        u_first = query.first
        u_to_delete = query.second
        duplicatas << [u_first[:last_name].downcase, u_first[:first_name].downcase, u_first[:id], u_first[:adherent_number]]
        Users::MergeUsers.new(u_first, u_to_delete, with_delete: true).execute
    }
end
pp "Duplicatas :"
pp duplicatas
pp "Total de duplicatas à traiter :" 
pp total
