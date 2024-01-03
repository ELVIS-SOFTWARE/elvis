# == Schema Information
#
# Table name: time_intervals
#
#  id           :bigint           not null, primary key
#  start        :datetime
#  end          :datetime
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  kind         :string
#  is_validated :boolean          default(FALSE)
#
require 'test_helper'
require 'pp'

class TimeIntervalTest < ActiveSupport::TestCase
    test "the truth" do
        ti = TimeInterval.new(start: "2022-05-23T09:00:00", end: "2022-05-23T10:00:00")
        assert true
        pp ti
        pp ti.to_iso
    end
    
    test "first week of season" do
        ti = TimeInterval.new(start: "2022-05-23T09:00:00", end: "2022-05-23T10:00:00")
        pp ti
        season = Season.from_interval(ti).first

        ti.convert_to_first_week_of_season(season)
        pp ti
        assert true
    end

    test "check_and_adjust_range" do
        ti = TimeInterval.new(start: "2022-05-23T09:00:00", end: "2022-05-23T10:00:00")
        pp ti
        from_date, to_date = ti.check_and_adjust_range(nil, "2023-06-01").values
        pp from_date
        pp to_date

    end

end
