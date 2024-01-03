# == Schema Information
#
# Table name: due_payments
#
#  id                            :bigint           not null, primary key
#  payment_schedule_id           :bigint
#  number                        :integer
#  previsional_date              :date
#  amount                        :decimal(, )
#  created_at                    :datetime         not null
#  updated_at                    :datetime         not null
#  payment_method_id             :bigint
#  due_payment_status_id         :bigint
#  location_id                   :bigint
#  operation                     :string(1)        default("+")
#  created_by_payer_payment_term :boolean          default(FALSE)
#

require 'test_helper'
require 'pp'

class DuePaymentTest < ActiveSupport::TestCase
    test "unpaid due" do
        unpaid_status = DuePaymentStatus::UNPAID

        due1 = DuePayment.new
        due1.amount = 50.2

        marked_dues = DuePayment._test_mark_unpaid([due1])

        assert_equal(marked_dues[0].due_payment_status, unpaid_status)
    end

    test "underpaid due" do
        unpaid_status = DuePaymentStatus::UNPAID

        due1 = DuePayment.new
        due1.amount = 50.2

        pay1 = Payment.new
        pay1.amount = 10
        pay2 = Payment.new
        pay2.amount = 40

        due1.payments << pay1
        due1.payments << pay2

        marked_dues = DuePayment._test_mark_unpaid([due1])

        assert_equal(marked_dues[0].due_payment_status, unpaid_status)
    end

    test "paid in one payment" do
        unpaid_status = DuePaymentStatus::UNPAID

        due1 = DuePayment.new
        due1.amount = 50.2

        pay1 = Payment.new
        pay1.amount = 50.2

        due1.payments << pay1

        marked_dues = DuePayment._test_mark_unpaid([due1])

        assert_nil marked_dues[0].due_payment_status
    end

    test "paid in several payments" do
        unpaid_status = DuePaymentStatus::UNPAID

        due1 = DuePayment.new
        due1.amount = 50.2

        pay1 = Payment.new
        pay1.amount = 10
        pay2 = Payment.new
        pay2.amount = 40.2

        due1.payments << pay1
        due1.payments << pay2

        marked_dues = DuePayment._test_mark_unpaid([due1])

        assert_nil marked_dues[0].due_payment_status
    end

    test "overpaid" do
        unpaid_status = DuePaymentStatus::UNPAID

        due1 = DuePayment.new
        due1.amount = 50.2

        pay1 = Payment.new
        pay1.amount = 100
        pay2 = Payment.new
        pay2.amount = 40.2

        due1.payments << pay1
        due1.payments << pay2

        marked_dues = DuePayment._test_mark_unpaid([due1])

        assert_nil marked_dues[0].due_payment_status
    end

    test "under one cent difference between due and payments amounts" do
        unpaid_status = DuePaymentStatus::UNPAID

        due1 = DuePayment.new
        due1.amount = 50

        pay1 = Payment.new
        pay1.amount = 10.99
        pay2 = Payment.new
        pay2.amount = 39.005

        assert_in_epsilon(due1.amount, pay1.amount + pay2.amount, 0.01)

        due1.payments << pay1
        due1.payments << pay2

        marked_dues = DuePayment._test_mark_unpaid([due1])

        assert_nil marked_dues[0].due_payment_status
    end
end
