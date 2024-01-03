class ApplicationMailerPreview < ActionMailer::Preview
    def notify_new_application
        # to see mailers previews :
        # `http://localhost:5000/rails/mailers`
        application = ActivityApplication.last
        ApplicationMailer.notify_new_application(application.id)
    end
end