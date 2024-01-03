# frozen_string_literal: true
require 'concurrent'
require 'rails_event_store'

class Event
  def initialize(name)
    @semaphore = Mutex.new
    @name = name

    event_name = "event_#{@name.underscore}".camelcase
    Object.const_set event_name, Class.new(RailsEventStore::Event)
    @event_class =  eval(event_name)

    @unsubscribe_procs = {}
  end

  # @return [String] id de l'évènement pour désouscrire => a sauvegardé
  def subscribe(async = false, &block)
    id = Digest::UUID.uuid_v4

    parameters = block.parameters

    if parameters.length != 2 || parameters.any? { |p| p[0] != :keyreq } || parameters[0][1] != :sender || parameters[1][1] != :args
      raise "block must have 2 parameters: sender: Object, args: Hash"
    end

    if async
      # create a new class for each async event with a unique name
      event_class_async_name = "active_job_#{@name}_#{id}".underscore.camelcase

      # define the new class name in constant for later use
      Object.const_set event_class_async_name, Class.new(BaseEventJob)
      event_class_async = eval(event_class_async_name)

      event_class_async.block = block
      event_class_async.custom_class_name = "active_job_#{@name}"

      proc = event_store.subscribe(
        event_class_async,
        to: [@event_class]
      )
    else
      proc = event_store.subscribe(to: [@event_class]) do |event|
        block.call(sender: event.data[:sender], args: event.data[:args])
      rescue StandardError => e
        Rails.logger.error e
      end
    end

    @unsubscribe_procs[id] = proc

    id
  end

  def name
    @name
  end

  # @return [Boolean] true si l'évènement a été désouscrit
  def unsubscribe(id)
    proc = @unsubscribe_procs[id]

    return false if proc.nil?

    proc.call

    @unsubscribe_procs.delete(id)

    true
  end

  def trigger_classic(sender = nil, args = {})

    # @type [RailsEventStore::Event]
    event = @event_class.new(
      data: {
        sender: sender,
        args: args,
      })

    event_store.publish(
      event,
      expected_version: :any,
    )

    event
  end

  # @return [RailsEventStore::JSONClient]
  def event_store
    Rails.configuration.event_store
  end

  def trigger(sender: nil, args: {})
    trigger_classic(sender, args)
  end
end
