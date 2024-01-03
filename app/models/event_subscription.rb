# == Schema Information
#
# Table name: event_subscriptions
#
#  id                      :bigint           not null, primary key
#  event_group             :string
#  event                   :string
#  async                   :boolean          default(FALSE)
#  event_class             :string
#  serialized_params       :json
#  serialized_params_types :json
#  subscribe_id            :string
#  created_at              :datetime         not null
#  updated_at              :datetime         not null
#
class EventSubscription < ApplicationRecord

  # @!attribute event_group
  #  @return [String]
  validates :event_group, presence: true

  # @!attribute event
  # @return [String]
  validates :event, presence: true

  # @!attribute event_class
  # @return [String]
  validates :event_class, presence: true

  validate :params_types_as_same_size
  validate :event_class_exists_and_respond_to_execute

  def self.display_class_name(singular = true)
    singular ? "souscription d'événement" : "souscriptions d'événement"
  end

  def self.class_name_gender
    return :F
  end


  def params
    serialized_params_types.each_with_index.map do |type, index|
      type.constantize.new(serialized_params[index])
    end
  end

  def params_types_as_same_size
    if serialized_params_types.size != serialized_params.size
      errors.add(:serialized_params_types, "must be the same size as serialized_params")
    end
  end

  def event_class_exists_and_respond_to_execute
    c = event_class.constantize

    if c.nil?
      errors.add(:event_class, "does not exist")
    elsif !c.new.respond_to?(:execute)
      errors.add(:event_class, "does not respond to execute")
    else
      execute_parameters = c.new.method(:execute).parameters

      if execute_parameters.size != 3
        errors.add(:event_class, "execute method must have 3 parameters")
      elsif execute_parameters.map(&:last) != [:sender, :args, :sauv_params]
        errors.add(:event_class, "execute method must have :sender, :args, :sauv_params as parameters")
      elsif !execute_parameters.map(&:first).all? { |p| p == :key }
        errors.add(:event_class, "execute method declared like this: def execute(sender:, args:, sauv_params:)")
      end
    end
  end

  # Subscribe to [EventHandler] class corresponding to [self.event_name] and [self.event_type]
  # the [self.event_class] will be executed with the [params] as parameters when the event is triggered
  # for this, class must respond to execute method and have 3 parameters: sender:, args:, sauv_params:
  #   sender: the sender of the event (can be nil)
  #   args: the arguments of the event (tab of dynamic size)
  #   sauv_params: the parameters of the event subscription (tab)
  # @return [nil]
  def subscribe
    return nil unless self.subscribe_id.nil?

    event_group = self.event_group
    event = self.event
    event_class = self.event_class.constantize

    execute_instance = event_class.new

    if execute_instance.respond_to?(:execute)
      execute_parameters = execute_instance.method(:execute).parameters

      if execute_parameters.size == 3 && execute_parameters.map(&:last) == [:sender, :args, :sauv_params] && execute_parameters.map(&:first).all? { |p| p == :key }
        self.subscribe_id = EventHandler.send(event_group).send(event).subscribe(self.async) do |sender:, args:|
          ei = event_class.new

          ei.execute(sender: sender, args: args, sauv_params: self.params)
        end

        unless self.save
          EventHandler.send(self.event_group).send(self.event).unsubscribe(self.subscribe_id)
        end
      end
    end

    nil
  end

  def unsubscribe
    return nil if self.subscribe_id.nil?

    id = self.subscribe_id
    self.subscribe_id = nil

    self.save!

    EventHandler.send(self.event_group).send(self.event).unsubscribe(id)
  end
end
