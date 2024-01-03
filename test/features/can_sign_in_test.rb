require "test_helper"

feature "Can Login" do
    # scenario "Visitor can register" do
    #     visit new_user_registration_path

    #     fill_in("last_name", with: "Example")
    #     fill_in("first_name", with: "Test")
    #     fill_in("user_login", with: "test@example.com")
    #     fill_in("Password", with: "password")
    #     fill_in("Password confirmation", with: "password")

    #     click_on "Inscription"

    #     assert_current_path root_path
    # end

    # scenario "User can login" do
    #     @user = users :one
    #     visit new_user_session_path

    #     fill_in('user_login', with: @user.email)
    #     fill_in('Password', with: "password")
    #     check('Remember me')

    #     click_on('Connexion')

    #     assert_current_path authenticated_root_path
    #     assert page.has_content?("Paul Leroux")
    # end

    scenario "Redirection sign up" do
        visit new_user_session_path


        click_on "Inscription"

        assert_current_path new_user_registration_path
    end
end
