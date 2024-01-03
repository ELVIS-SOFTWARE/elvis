# frozen_string_literal: true
# to see mailers previews :
# `http://localhost:5000/rails/mailers`

class ActivityAssignedPreview < ActionMailer::Preview
  def activity_accepted
    user = User.last
    token = user.reset_password_token ? user.reset_password_token : "fake_token"
    activity = Activity.last
    # mail
    ActivityAcceptedMailer.activity_accepted(user, token, activity)
  end

  def activity_assigned
    user = User.last
    token = user.reset_password_token ? user.reset_password_token : "fake_token"
    application = ActivityApplication.last
    activity = Activity.last

    # mail
    ActivityAssignedMailer.activity_assigned(user, token, application, activity)
  end

  def activity_proposed
    user = User.last
    token = user.reset_password_token ? user.reset_password_token : "fake_token"
    application = ActivityApplication.last
    activity = Activity.last

    # mail
    ActivityProposedMailer.activity_proposed(user, token, application, activity)
  end
end
