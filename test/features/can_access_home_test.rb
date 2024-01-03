require "test_helper"

feature "CanAccessHome" do
  scenario "the test is sound" do
    visit root_path
    page.must_have_content "Connexion"
    page.wont_have_content "Goodbye All!"
  end
end
