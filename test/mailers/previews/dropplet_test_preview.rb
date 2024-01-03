# frozen_string_literal: true

class DroppletTestPreview < ActionMailer::Preview
  def droppletTest
    user = User.last
    token = user.reset_password_token ? user.reset_password_token : "fake_token"
    application = ActivityApplication.last
    activity = Activity.last

    # mail
    DroppletTestMailer.droppletTest(user, token, application, activity)
  end
end
