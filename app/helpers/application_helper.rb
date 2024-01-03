module ApplicationHelper
  include Elvis::Hook::Helper

  def component(component_name, locals = {}, &block)
    name = component_name.split("_").first
    render("components/#{name}/#{component_name}", locals, &block)
  end

  # Méthode permettant de corrigé une erreure lors de l'ajout de romm_feature.
  # Le formulaire cherche automatiquement une methode de ce nom au lieu de "practice_room_features_path"
  def practice_room_features_index_path(d)
    practice_room_features_path d
  end

  def payment_methods_path(pm = {})

    return payment_method_index_path(pm) if pm[:id].nil?

    payment_method_path(pm)
  end

  # @param [ActiveRecord::Querying] query
  # @param [Array<Hash>] column
  def self.generate_csv(query, columns = nil)
    return "" unless query.any?

    columns = query.first.attributes.keys.map { |key| { col_key: key, display_name: key.humanize }.as_json } if columns.nil?

    CSV.generate nil, col_sep: ";" do |csv|
      csv << columns.map { |col_hash| col_hash["display_name"] }

      query.each do |row|
        csv_row = []

        columns.each do |col_hash|
          csv_row << if col_hash["col_key"].include?("password")
                       "********"
                     elsif !col_hash["col_key"].include?("id") && ApplicationHelper.authorized_type?(row[col_hash["col_key"]])
                       row[col_hash["col_key"]]
                     else
                       nil
                     end
        end

        csv << csv_row
      end
    end
  end

  alias c component

  def self.authorized_type?(value)
    value.is_a?(String) ||
      value.is_a?(Integer) ||
      value.is_a?(Float) ||
      value.is_a?(BigDecimal) ||
      value.is_a?(Date) ||
      value.is_a?(Time) ||
      value.is_a?(TrueClass) ||
      value.is_a?(FalseClass) ||
      value.is_a?(NilClass)
  end
end
