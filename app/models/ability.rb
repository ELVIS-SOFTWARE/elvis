class Ability
  include CanCan::Ability

  def initialize(user)
    # Define abilities for the passed in user here. For example:
    #
    #   user ||= User.new # guest user (not logged in)
    #   if user.admin?
    #     can :manage, :all
    #   else
    #     can :read, :all
    #   end
    #
    # The first argument to `can` is the action you are giving the user
    # permission to do.
    # If you pass :manage it will apply to every action. Other common actions
    # here are :read, :create, :update and :destroy.
    #
    # The second argument is the resource the user can perform the action on.
    # If you pass :all it will apply to every resource. Otherwise pass a Ruby
    # class of the resource.
    #
    # The third argument is an optional hash of conditions to further filter the
    # objects.
    # For example, here the user can only update published articles.
    #
    #   can :update, Article, :published => true
    #
    # See the wiki for details:
    # https://github.com/CanCanCommunity/cancancan/wiki/Defining-Abilities

    # user ||= User.new
    if user.admin?
      can :manage, :all
        # can :manage, Message
        # can :manage, PracticeSession
    elsif user.teacher?
      can [:read, :edit], Planning, user_id: user.id
        can :manage, User, id: user.id
        can [:read], User
    end
    # for all users :
    family_ids = user.family.uniq.pluck(:id)
    family_ids.append(user.id)

    attached_account_ids = user.attached_accounts.pluck(:id)

    can :manage, User, id: user.id
    can :manage, User, id: family_ids
    can :manage, User, id: attached_account_ids
    can :create, Payment, payable_id: user.id
    can :manage, ActivityApplication, user_id: family_ids
    can :manage, ActivityApplication, user_id: attached_account_ids
    can :create, ActivityApplication, user_id: 0
    can :read, Planning, user: user

    user_activity_ref_ids = user.activity_refs.pluck(:id)

    can [:read, :edit], ActivityApplication, true do |activity_application|
      false if activity_application.season_id != Season.current_apps_season.id

      activity_application.desired_activities.pluck(:activity_ref_id).any? { |daarid| user_activity_ref_ids.any? {|aid| aid == daarid } }
    end if user.is_teacher
  end
end
