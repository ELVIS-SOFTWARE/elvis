FactoryBot.define do
    factory :user do
        email { "test@example.com" }
        password { 'fake_password' }
        first_name { "pablo" }
        last_name { "villa" }
    end
end
