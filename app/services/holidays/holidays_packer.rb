module Holidays
  class HolidaysPacker
    def self.pack_holidays(season)
      tmp = {}

      season.holidays.map { |h| { label: h.label, date: h.date } }.each do |h|
        tmp[h[:label]] = { start: h[:date], end: h[:date] } if tmp[h[:label]].nil?

        tmp[h[:label]][:start] = h[:date] if h[:date] < tmp[h[:label]][:start]
        tmp[h[:label]][:end]   = h[:date] if h[:date] > tmp[h[:label]][:end]
      end

      tmp.map { |h| { label: h[0], start: h[1][:start], end: h[1][:end] } }
    end

    def self.unpack_holidays; end
  end
end
