require "test_helper"
def login_user
    connected_user = FactoryBot.create(:user)
    connected_user.confirmed_at = Time.now
    connected_user.save
    login_as(connected_user, :scope => :user, :run_callbacks => false)
end

feature "Can Create User" do
    # scenario "Connected User can create user" do
    #     login_user

    #     visit new_user_path

    #     fill_in("last_name", with: "Admin")
    #     fill_in("first_name", with: "Test")
    #     fill_in("email", with: "test@example.com")
    #     fill_in("Password", with: "password")
    #     fill_in("Password confirmation", with: "password")

    #     click_on "Créer un Nouvel Utilisateur"

    #     assert_current_path user_path
    #     assert page.has_content?("Admin Test")
    # end
end

# feature "Can Edit User" do
#     scenario "Name edition" do
#         user = users :one
#         visit edit_user_path(user)

#         fill_in("last_name", with: "Banana")
#         fill_in("first_name", with: "Orange")

#         click_on "Editer"

#         assert_current_path user_path(user)
#         assert page.has_content?("Orange Banana")
#     end

#     scenario "Email edition" do
#         user = users :one
#         visit edit_user_path(user)

#         fill_in("email", with: "new@example.com")

#         click_on "Editer"

#         assert_current_path user_path(user)
#         assert page.has_content?("new@example.com")
#     end
# end
