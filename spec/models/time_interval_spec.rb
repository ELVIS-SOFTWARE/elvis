require 'rails_helper'

RSpec.describe TimeInterval, type: :model do
  context 'when the season begins on Monday and the time interval is the first day of the season' do

    describe '#convert_to_first_week_of_season' do
      let(:season) { Season.new(
        start: "2023-09-04".to_datetime.in_time_zone,
        end: "2024-06-30".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2023-09-04T09:00:00".to_datetime.in_time_zone,
        end: "2023-09-04T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-09-04T09:00:00".to_datetime.in_time_zone)
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-09-04T10:00:00".to_datetime.in_time_zone)
      end
    end
  end

  context 'when the season begins on Monday and when the time interval is in the middle of the season' do

    describe '#convert_to_first_week_of_season' do
      let(:season) { Season.new(
        start: "2023-09-04".to_datetime.in_time_zone,
        end: "2024-06-30".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2023-09-12T09:00:00".to_datetime.in_time_zone,
        end: "2023-09-12T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-09-05T09:00:00".to_datetime.in_time_zone)
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-09-05T10:00:00".to_datetime.in_time_zone)
      end
    end
  end

  context 'when the season begins on Monday and when the time interval is past the end of season' do

    describe '#convert_to_first_week_of_season' do
      let(:season) { Season.new(
        start: "2023-09-04".to_datetime.in_time_zone,
        end: "2024-06-30".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2024-09-12T09:00:00".to_datetime.in_time_zone,  # thursday
        end: "2024-09-12T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-09-07T09:00:00".to_datetime.in_time_zone) # first thursday of the season
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-09-07T10:00:00".to_datetime.in_time_zone)
      end
    end
  end

  context 'when the season begins on Monday and when the time interval is before the start of season' do

    describe '#convert_to_first_week_of_season' do
      let(:season) { Season.new(
        start: "2023-09-04".to_datetime.in_time_zone,
        end: "2024-06-30".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2023-08-31T09:00:00".to_datetime.in_time_zone,  # thursday
        end: "2023-08-31T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-09-07T09:00:00".to_datetime.in_time_zone) # first thursday of the season
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-09-07T10:00:00".to_datetime.in_time_zone)
      end
    end
  end


  context 'when the season begins on Tuesday and the time interval is the first day of the season' do

    describe '#convert_to_first_week_of_season' do
      let(:season) { Season.new(
        start: "2023-09-05".to_datetime.in_time_zone,
        end: "2024-06-30".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2023-09-05T09:00:00".to_datetime.in_time_zone,
        end: "2023-09-05T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-09-05T09:00:00".to_datetime.in_time_zone)
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-09-05T10:00:00".to_datetime.in_time_zone)
      end
    end
  end

  context 'when the season begins on Tuesday and when the time interval is on Tuesday in the middle of the season' do

    describe '#convert_to_first_week_of_season' do
      let(:season) { Season.new(
        start: "2023-09-05".to_datetime.in_time_zone,
        end: "2024-06-30".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2023-09-12T09:00:00".to_datetime.in_time_zone,
        end: "2023-09-12T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-09-05T09:00:00".to_datetime.in_time_zone)
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-09-05T10:00:00".to_datetime.in_time_zone)
      end
    end
  end

  context 'when the season begins on Tuesday and when the time interval is on Monday in the middle of the season' do

    describe '#convert_to_first_week_of_season' do
      let(:season) { Season.new(
        start: "2023-09-05".to_datetime.in_time_zone,
        end: "2024-06-30".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2023-09-18T09:00:00".to_datetime.in_time_zone,
        end: "2023-09-18T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-09-11T09:00:00".to_datetime.in_time_zone)
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-09-11T10:00:00".to_datetime.in_time_zone)
      end
    end
  end

  context 'when the season begins on Monday and when the time interval is past the end of season' do

    describe '#convert_to_first_week_of_season' do
      let(:season) { Season.new(
        start: "2023-08-31".to_datetime.in_time_zone,
        end: "2024-05-31".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2023-08-28T09:00:00".to_datetime.in_time_zone,  # thursday
        end: "2023-08-28T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-09-04T09:00:00".to_datetime.in_time_zone) # first thursday of the season
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-09-04T10:00:00".to_datetime.in_time_zone)
      end
    end
  end

  context 'when the season begins on Monday and when the time interval is before the start of season' do

    describe '#convert_to_first_week_of_season without ensure_day_in_season' do
      let(:season) { Season.new(
        start: "2023-08-31".to_datetime.in_time_zone,
        end: "2024-05-31".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2023-08-28T09:00:00".to_datetime.in_time_zone,  # thursday
        end: "2023-08-28T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season, false)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-08-28T09:00:00".to_datetime.in_time_zone) # first thursday of the season
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-08-28T10:00:00".to_datetime.in_time_zone)
      end
    end

    describe '#convert_to_first_week_of_season with ensure_day_in_season' do
      let(:season) { Season.new(
        start: "2023-08-31".to_datetime.in_time_zone,
        end: "2024-05-31".to_datetime.in_time_zone
      ) }
      let(:time_interval) { TimeInterval.new(
        start: "2023-08-28T09:00:00".to_datetime.in_time_zone,  # thursday
        end: "2023-08-28T10:00:00".to_datetime.in_time_zone)
      }

      before do
        time_interval.convert_to_first_week_of_season(season, true)
      end

      it 'modifies the start date correctly' do
        expect(time_interval.start).to eq("2023-09-04T09:00:00".to_datetime.in_time_zone) # first thursday of the season
      end

      it 'modifies the end date correctly' do
        expect(time_interval.end).to eq("2023-09-04T10:00:00".to_datetime.in_time_zone)
      end
    end
  end

end