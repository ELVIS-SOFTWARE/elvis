class AuthorizationEndpoint
  attr_accessor :app, :account, :client, :redirect_uri, :response_type, :scopes, :_request_, :request_uri, :request_object
  delegate :call, to: :app

  def initialize(current_account, allow_approval = false, approved = false)
    @account = current_account
    @app = Rack::OAuth2::Server::Authorize.new do |req, res|
      @client = OidcClient.find_by_identifier(req.client_id) || req.bad_request!
      res.redirect_uri = @redirect_uri = req.verify_redirect_uri!(@client.redirect_uris)
      if res.protocol_params_location == :fragment && req.nonce.blank?
        req.invalid_request! 'nonce required'
      end
      @scopes = req.scope.inject([]) do |_scopes_, scope|
        _scope_ = OidcScope.find_by_name(scope)
        if _scope_
          _scopes_ << _scope_
        else
          # ignore
          # req.invalid_scope! "Unknown scope: #{scope}")
        end
        _scopes_
      end
      @request_object = if (@_request_ = req.request).present?
        OpenIDConnect::RequestObject.decode req.request, nil # @client.secret
      elsif (@request_uri = req.request_uri).present?
        OpenIDConnect::RequestObject.fetch req.request_uri, nil # @client.secret
      end
      if OidcClient.available_response_types.include? Array(req.response_type).collect(&:to_s).join(' ')
        if allow_approval
          if approved
            approved! req, res
          else
            req.access_denied!
          end
        else
          @response_type = req.response_type
        end
      else
        req.unsupported_response_type!
      end
    end
  end

  def approved!(req, res)
    OidcClient.transaction do
      response_types = Array(req.response_type)
      if response_types.include? :code
        authorization = account.oidc_authorizations.create!(oidc_client: @client, redirect_uri: res.redirect_uri, nonce: req.nonce)
        authorization.oidc_scopes << scopes
        if @request_object
          authorization.create_oidc_authorization_request_object!(
            request_object: RequestObject.new(
              jwt_string: @request_object.to_jwt(@client.secret, :HS256)
            )
          )
        end
        res.code = authorization.code
      end
      if response_types.include? :token
        access_token = account.oidc_access_tokens.create!(client: @client)
        access_token.oidc_scopes << scopes
        if @request_object
          access_token.create_access_token_request_object!(
            request_object: RequestObject.new(
              jwt_string: @request_object.to_jwt(@client.secret, :HS256)
            )
          )
        end
        res.access_token = access_token.to_bearer_token
      end
      if response_types.include? :id_token
        _id_token_ = account.id_tokens.create!(
          client: @client,
          nonce: req.nonce
        )
        if @request_object
          _id_token_.create_id_token_request_object!(
            request_object: RequestObject.new(
              jwt_string: @request_object.to_jwt(@client.secret, :HS256)
            )
          )
        end
        res.id_token = _id_token_.to_jwt(
          code: (res.respond_to?(:code) ? res.code : nil),
          access_token: (res.respond_to?(:access_token) ? res.access_token : nil)
        )
      end
      res.approve!
    end
  end
end
