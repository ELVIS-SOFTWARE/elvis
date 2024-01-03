# to see mailers previews :
# `http://localhost:5000/rails/mailers`
class DeviseMailerPreview < ActionMailer::Preview
  def confirmation_instructions
    user = User.last
    DeviseMailer.confirmation_instructions(user, user.confirmation_token)
  end

  def reset_password_instructions
    user = User.last
    token = user.reset_password_token ? user.reset_password_token : "fake_token"
    DeviseMailer.reset_password_instructions(user, token)
  end
end