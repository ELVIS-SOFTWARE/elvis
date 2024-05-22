require 'rails_helper'

RSpec.describe ActivityApplications::TesImporter, type: :service do
  describe '#guess_activity_ref' do
    before do
      @service = ActivityApplications::TesImporter.new nil

      FactoryBot.create(:activity_ref_kind, name: "Guitare")
      FactoryBot.create(:activity_ref, label: "Guitare - cours individuel - 30 minutes", activity_ref_kind: ActivityRefKind.find_by(name: "Guitare"))
      FactoryBot.create(:activity_ref, label: "Guitare - cours duo", activity_ref_kind: ActivityRefKind.find_by(name: "Guitare"))
      FactoryBot.create(:activity_ref, label: "Guitare - cours collectif", activity_ref_kind: ActivityRefKind.find_by(name: "Guitare"))

      FactoryBot.create(:activity_ref_kind, name: "Piano / Clavier")
      FactoryBot.create(:activity_ref, label: "Piano / Clavier - cours individuel - 30 minutes", activity_ref_kind: ActivityRefKind.find_by(name: "Piano / Clavier"))
      FactoryBot.create(:activity_ref, label: "Piano / Clavier - cours duo", activity_ref_kind: ActivityRefKind.find_by(name: "Piano / Clavier"))
      FactoryBot.create(:activity_ref, label: "Piano / Clavier - cours collectif", activity_ref_kind: ActivityRefKind.find_by(name: "Piano / Clavier"))

    end

    context 'when instrument does not contain level' do
      let(:instrument) { 'Guitare' }

      context 'when activite contains duration' do
        let(:activite) { 'Cours Individuel 30 mn' }

        it 'returns the correct activity reference' do

          result = @service.send(:guess_activity_ref_and_level, activite, instrument)
          ar = ActivityRef.find_by(label: "Guitare - cours individuel - 30 minutes")
          expect(result).to eq({activity_ref_id: ar.id, level: nil})
        end
      end

      context 'when activite contains cours duo' do
        let(:activite) { 'Cours Duo' }

        it 'returns the correct activity reference' do

          result = @service.send(:guess_activity_ref_and_level, activite, instrument)
          ar = ActivityRef.find_by(label: "Guitare - cours duo")
          expect(result).to eq({activity_ref_id: ar.id, level: nil})
        end
      end

    end

    context 'when instrument contains level' do
      let(:instrument) { 'Guitare (2 ans)' }

      context 'when activite contains duration' do
        let(:activite) { 'Cours Individuel 30 mn' }

        it 'returns the correct activity reference' do

          result = @service.send(:guess_activity_ref_and_level, activite, instrument)
          ar = ActivityRef.find_by(label: "Guitare - cours individuel - 30 minutes")
          expect(result).to eq({activity_ref_id: ar.id, level: '2 ans'})
        end
      end

      context 'when activite contains cours duo' do
        let(:activite) { 'Cours Duo' }

        it 'returns the correct activity reference' do

          result = @service.send(:guess_activity_ref_and_level, activite, instrument)
          ar = ActivityRef.find_by(label: "Guitare - cours duo")
          expect(result).to eq({activity_ref_id: ar.id, level: '2 ans'})
        end
      end

    end

    context 'when instrument contains level 1 an' do
      let(:instrument) { 'Guitare (1 an)' }

      context 'when activite contains duration' do
        let(:activite) { 'Cours Individuel 30 mn' }

        it 'returns the correct activity reference' do

          result = @service.send(:guess_activity_ref_and_level, activite, instrument)
          ar = ActivityRef.find_by(label: "Guitare - cours individuel - 30 minutes")
          expect(result).to eq({activity_ref_id: ar.id, level: '1 an'})
        end
      end

      context 'when activite contains cours duo' do
        let(:activite) { 'Cours Duo' }

        it 'returns the correct activity reference' do

          result = @service.send(:guess_activity_ref_and_level, activite, instrument)
          ar = ActivityRef.find_by(label: "Guitare - cours duo")
          expect(result).to eq({activity_ref_id: ar.id, level: '1 an'})
        end
      end

    end

    context 'when instrument is not present' do
      let(:instrument) { nil }
      let(:activite) { 'Cours collectif guitare' }

      it 'returns the correct activity reference' do

        result = @service.send(:guess_activity_ref_and_level, activite, instrument)
        ar = ActivityRef.find_by(label: "Guitare - cours collectif")
        expect(result).to eq({activity_ref_id: ar.id, level: nil})
      end
    end
  end
end