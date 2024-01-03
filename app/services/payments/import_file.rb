module Payments
  # Service class for file import
  # Reads and parses a csv file to
  class ImportFile
    def initialize(bank_payments)
      @bank_payments = bank_payments
    end

    def execute
      #  Preparing meta data for import
      #  TODO Refactor, we should only load them, they are supposed to exist already
      payer_not_found = FailedPaymentImportReason.find_or_create_by(code: "payer_not_found",
                                                                    label: "Payeur introuvable")
      payer_without_schedule = FailedPaymentImportReason.find_or_create_by(code: "payer_without_schedule",
                                                                           label: "Payeur sans échéancier")
      due_not_found = FailedPaymentImportReason.find_or_create_by(code: "due_not_found",
                                                                  label: "Échéance introuvable")
      different_amounts = FailedPaymentImportReason.find_or_create_by(code: "different_amounts",
                                                                      label: "Montants différents")

      payment_unpaid_status = PaymentStatus::UNPAID
      payment_failed_status = PaymentStatus::FAILED

      due_payment_unpaid_status = DuePaymentStatus::UNPAID
      due_payment_failed_status = DuePaymentStatus::FAILED

      # On initialise quelque variable utiles
      french_date_format = "%d/%m/%y"
      total_inserted = 0
      total_ignored = 0
      failed_imports = []

      # On itère sur chaque ligne du CSV
      @bank_payments.each do |bank_payment|
        #  Extraction des données qui nous intéresse dans le fichier csv
        due_date = Date.strptime(bank_payment["Date d’échéance"], french_date_format)
        due_status = bank_payment["Statut échéance"]
        unless bank_payment["Date d’opération"].nil?
          cashing_date = Date.strptime(bank_payment["Date d’opération"],
                                       french_date_format)
        end
        amount = bank_payment["Montant en €"].tr(",", ".").to_f
        first_name = bank_payment["Prénom OU SIREN"]
        last_name = bank_payment["Nom OU Raisons Sociale"]

        payer = User.where(
          "translate(
            LOWER(trim(last_name)),
            '-éàçäëïöüâêîôû''',
            ' eacaeiouaeiou'
          ) = translate(
            LOWER(trim(?)),
            '-éàçäëïöüâêîôû''',
            ' eacaeiouaeiou'
          ) AND translate(
            LOWER(trim(first_name)),
            '-éàçäëïöüâêîôû''',
            ' eacaeiouaeiou'
          ) = translate(
            LOWER(trim(?)),
            '-éàçäëïöüâêîôû''',
            ' eacaeiouaeiou'
          )",
          last_name,
          first_name
        ).first

        # We look into contacts if the user wasn't found
        if payer.nil?
          failed_imports.push([first_name, last_name, due_date, cashing_date, amount, payer_not_found, nil])
          next
        end

        if payer.payment_schedules.none?
          failed_imports.push([first_name, last_name, due_date, cashing_date, amount,
                               payer_without_schedule, payer.id])
          next
        end

        due_payment_candidates = nil

        # Looks for due payments from two days around the date the bank gave
        # And groups them by date in a Hash
        due_payment_candidates = DuePayment
                                 .where(payment_schedule_id: payer.payment_schedules.select(:id))
                                 .where(
                                   "DATE(previsional_date) >= ? AND DATE(previsional_date) <= ?",
                                   due_date - 2,
                                   due_date + 2
                                 )
                                 .to_a
                                 .each_with_object({}) do |due, h|
          key = due.previsional_date.strftime("%Y-%m-%d")
          if !h[key].nil?
            h[key] << due
          else
            h[key] = [due]
          end
        end

        if due_payment_candidates.nil? || due_payment_candidates.empty?
          failed_imports.push([first_name, last_name, due_date, cashing_date, amount, due_not_found,
                               payer.id])
          next
        end

        due_payments = []

        due_payment_candidates.keys.sort_by! { |d| (due_date - Date.strptime(d, "%Y-%m-%d")).abs }.each do |k|
          date_candidates = due_payment_candidates[k]

          amount_sum = date_candidates.reduce(0.0) { |acc, due| acc + due.amount }
          if (amount_sum - amount).abs < 0.01
            due_payments = date_candidates
            break
          else
            target_dues = date_candidates.select { |due| (due.amount - amount).abs < 0.01 }
            unless target_dues.empty?
              due_payments = [target_dues.first]
              break
            end
          end
        end

        if due_payments.empty?
          failed_imports.push([first_name, last_name, due_date, cashing_date, amount, different_amounts,
                               payer.id])
          next
        end

        if Payment.where(due_payment_id: due_payments.map(&:id)).first.nil?
          due_payment_status = nil
          pay_status = nil

          if due_status.downcase != "exécutée"
            due_payment_status = due_payment_unpaid_status
            pay_status = payment_unpaid_status
          end

          if due_status.downcase == "bloquée passée"
            due_payment_status = due_payment_failed_status
            pay_status = payment_failed_status
          end

          Payment.transaction do
            due_payments.each do |due|
              due.update(due_payment_status: due_payment_status)

              Payment.create(
                due_payment_id: due.id,
                payable_id: payer.id,
                payable_type: "User",
                payment_method_id: due.payment_method_id,
                cashing_date: due.previsional_date,
                payment_status: pay_status,
                amount: due.amount
              )
              # due.update(due_payment_status_id: nil) # Why set it to nil here if we update it before ?
            end
          end

          total_inserted += 1
        else
          total_ignored += 1
        end
      end

      unless failed_imports.empty?
        failed_imports = failed_imports.map do |to_insert|
          imp = FailedPaymentImport.find_by(
            first_name: to_insert[0],
            last_name: to_insert[1],
            due_date: to_insert[2],
            cashing_date: to_insert[3],
            amount: to_insert[4],
            failed_payment_import_reason_id: to_insert[5],
            user_id: to_insert[6]
          )

          if !imp.nil?
            total_ignored += 1
            nil
          else
            FailedPaymentImport.create!(
              first_name: to_insert[0],
              last_name: to_insert[1],
              due_date: to_insert[2],
              cashing_date: to_insert[3],
              amount: to_insert[4],
              failed_payment_import_reason: to_insert[5],
              user_id: to_insert[6]
            )
          end
        end
                                       .compact
      end

      { inserted: total_inserted, failed: failed_imports.size, ignored: total_ignored }
    end
  end
end
