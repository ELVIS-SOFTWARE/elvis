class AddShowPaymentMethodToUserOnPaymentMethod < ActiveRecord::Migration[6.1]
  def change
    add_column :payment_methods, :show_payment_method_to_user, :boolean, default: false, if_not_exists: true
  end
end
