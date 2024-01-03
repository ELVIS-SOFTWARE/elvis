module Users
    class DeleteUser
        def initialize(id)
            @id = id
            @user = User.find(id)
        end

        def execute
            User.transaction do
                FamilyMemberUser.where("member_id = #{@user.id} OR user_id = #{@user.id}").destroy_all
                ActivityApplication.where(user_id: @user.id).destroy_all
                Adhesion.where(user_id: @user.id).destroy_all
        
                return @user.destroy
            end
        end
    end
end