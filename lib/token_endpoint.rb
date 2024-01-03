class TokenEndpoint
  attr_accessor :app
  delegate :call, to: :app

  def initialize
    @app = Rack::OAuth2::Server::Token.new do |req, res|
      client = OidcClient.find_by_identifier(req.client_id) || req.invalid_client!
      client.secret == req.client_secret || req.invalid_client!
      case req.grant_type
      when :client_credentials
        res.access_token = client.oidc_access_tokens.create!.to_bearer_token
      when :authorization_code
        authorization = client.oidc_authorizations.where("expires_at >= ?", Time.zone.now).find_by_code(req.code)
        req.invalid_grant! if authorization.blank? || !authorization.valid_redirect_uri?(req.redirect_uri)
        access_token = authorization.access_token
        res.access_token = access_token.to_bearer_token

        if access_token.accessible?(OidcScope.find_by_name("openid"))
          res.id_token = access_token.user.oidc_id_tokens.create!(
            oidc_client: access_token.oidc_client,
            nonce: authorization.nonce,
            oidc_request_object: authorization.oidc_request_object
          ).to_jwt
        end
      else
        req.unsupported_grant_type!
      end
    end
  end
end

module Rack
  module OAuth2
    class AccessToken
      class Bearer < AccessToken
        def token_response(options = {})
          response = super
          response[:token_type] = 'Bearer' # NOTE: ALB OIDC gateway currently cannot accept "bearer".
          Rails.logger.info(response)
          response
        end
      end
    end
  end
end
