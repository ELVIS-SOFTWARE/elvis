
module Activities
  class ConflictsChecker
    def initialize(instances_to_check)
      @instances_to_check = instances_to_check
    end

    def execute
      results = { conflicts: [], success: 0 }

      @instances_to_check.each do |instance|
        if instance.check_for_conflict
          c = instance.check_for_conflict
          results[:conflicts] << c
        else
          results[:success] += 1
        end
      end

      results
    end
  end

end
