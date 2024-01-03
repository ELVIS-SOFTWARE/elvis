# frozen_string_literal: true

class LayoutMailer < ActionMailer::Base
  # panoramic path : layouts/layout_mailer
  prepend_view_path NotificationTemplate.resolver

  def getSchoolLogo
    # return "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg"
    @school_informations = School.first
    if @school_informations&.logo&.attached?
      logo_url = Rails.env.kubernetes? ? "https://#{ENV['DOMAIN']}/rails/active_storage/blobs/redirect/#{@school_informations.logo.signed_id}/#{@school_informations.logo.filename}" : rails_blob_url(@school_informations.logo)
      "<img align='center' border='0' src='#{logo_url}' alt='' title='' style='outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: inline-block !important;border: none;height: auto;float: none;width: 35%;max-width: 168px;' width='168'/>"
    end
  end

  def get_button_school_link(text = "Se rendre sur Elvis")
    "<a href='#{Rails.env.kubernetes? ? "https://#{ENV['DOMAIN']}/" : root_url}' target='_blank' class='v-button' style='box-sizing: border-box;display: inline-block;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #000000; background-color: #86d69e; border-radius: 4px;-webkit-border-radius: 4px; -moz-border-radius: 4px; width:auto; max-width:100%; overflow-wrap: break-word; word-break: break-word; word-wrap:break-word; mso-border-alt: none;font-size: 14px;'>
      <span style='display:block;padding:10px 20px;line-height:120%;'>
        <span style='line-height: 16.8px;'>
          #{text}<br />
        </span>
      </span>
    </a>"
  end

end
