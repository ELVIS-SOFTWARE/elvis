ActiveModelSerializers.config.default_includes = '**'
require 'active_model_serializers'
ActiveSupport::Notifications.unsubscribe(ActiveModelSerializers::Logging::RENDER_EVENT)
