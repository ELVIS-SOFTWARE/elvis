# spec/models/activity_ref_pricing_spec.rb

require 'rails_helper'

RSpec.describe ActivityRefPricing, type: :model do
  describe '#overlaps?' do
    let(:existing_pricing) do
      ActivityRefPricing.create(
        activity_ref_id: 15,
        from_season_id: 2,
        to_season_id: 2,
        price: 420,
        pricing_category_id: 5
      )
    end

    context 'when there is an overlap' do
      let(:overlapping_pricing) do
        described_class.new(
          activity_ref_id: 15,
          from_season_id: 1,
          to_season_id: 3,
          price: 420,
          pricing_category_id: 5
        )
      end

      it 'returns true' do
        expect(overlapping_pricing.overlaps?(existing_pricing)).to be true
      end
    end

    context 'when there is no overlap' do
      let(:non_overlapping_pricing) do
        described_class.new(
          activity_ref_id: 15,
          from_season_id: 1,
          to_season_id: 1,
          price: 420,
          pricing_category_id: 5
        )
      end

      it 'returns true' do
        expect(non_overlapping_pricing.overlaps?(existing_pricing)).to be false
      end
    end

    context 'when there is overlap' do
      let(:non_overlapping_pricing) do
        described_class.new(
          activity_ref_id: 15,
          from_season_id: 2,
          to_season_id: 3,
          price: 420,
          pricing_category_id: 5
        )
      end

      it 'returns true' do
        expect(non_overlapping_pricing.overlaps?(existing_pricing)).to be true
      end
    end
  end
end
