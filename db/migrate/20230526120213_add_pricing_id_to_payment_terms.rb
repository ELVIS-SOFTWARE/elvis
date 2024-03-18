class AddPricingIdToPaymentTerms < ActiveRecord::Migration[6.1]
  def change
    add_reference :payment_terms, :pricing, foreign_key: true if Object.const_defined?(:Pricing)
  end
end
