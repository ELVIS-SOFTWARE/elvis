# frozen_string_literal: true

## input data

class_to_use = User
id_to_keep = 8
id_to_delete = 1
classes_to_exclude = [TeachersActivity]


## script

objects = class_to_use.associations_that_reference_me
              .filter { |reflection| reflection.active_record != class_to_use } # on ignore les auto références
              .filter { |reflection| !reflection.through_reflection? } # on ignore les associations qui sont faite via une autre association
              .filter { |reflection| !reflection.foreign_key.include?("_csv") }

un = class_to_use.find id_to_delete
huit = class_to_use.find id_to_keep

ActiveRecord::Base.transaction do
  un.objects_that_reference_me.each do |o|
    puts "######################## #{o.class.name} ###########################"

    next if classes_to_exclude.include? o.class

    assos = objects.filter {|a| a.active_record == o.class}.first
    key = assos.foreign_key
    o.send("#{key}=", huit.id)
    o.update_columns(key => huit.id)
  end
end

