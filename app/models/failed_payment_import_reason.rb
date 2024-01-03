# == Schema Information
#
# Table name: failed_payment_import_reasons
#
#  id    :bigint           not null, primary key
#  code  :string           not null
#  label :string           not null
#  color :string
#

class FailedPaymentImportReason < ApplicationRecord

  def self.display_class_name(singular = true)
    singular ? "motif d'import d'échecs de paiements" : "motifs d'import d'échecs de paiements"
  end

  def self.class_name_gender
    return :M
  end

end
