class FailedPaymentImportsController < ApplicationController
    def index
        @failed_imports = FailedPaymentImport.all
        @reasons = FailedPaymentImportReason.all
        @current_user = current_user
    end

    def delete
        import = FailedPaymentImport.find(params[:id].to_i)
        if import.nil?
            head :not_found
        else
            import.destroy
        end

        head :ok
    end

    def import_single
        failed_id = params[:id].to_i
        failed = FailedPaymentImport.find(failed_id)

        if failed.nil?
            head :not_found, details: "import"
        end

        payer_not_found = FailedPaymentImportReason.find_or_create_by(code: "payer_not_found", label: "Payeur introuvable")
        payer_without_schedule = FailedPaymentImportReason.find_or_create_by(code: "payer_without_schedule", label: "Payeur sans échéancier")
        due_not_found = FailedPaymentImportReason.find_or_create_by(code: "due_not_found", label: "Échéance introuvable")
        different_amounts = FailedPaymentImportReason.find_or_create_by(code: "different_amounts", label: "Montants différents")

        le_french_format = "%d/%m/%Y"

        due_date = Date.strptime(params[:due_date], le_french_format)
        cashing_date = Date.strptime(params[:cashing_date], le_french_format)
        amount = params[:amount].to_f
        first_name = params[:first_name]
        last_name = params[:last_name]

        payer = User.where(
            "translate(LOWER(trim(last_name)), '-éàçäëïöüâêîôû''', ' eacaeiouaeiou') = translate(LOWER(trim(?)), '-éàçäëïöüâêîôû''', ' eacaeiouaeiou') AND translate(LOWER(trim(first_name)), '-éàçäëïöüâêîôû''', ' eacaeiouaeiou') = translate(LOWER(trim(?)), '-éàçäëïöüâêîôû''', ' eacaeiouaeiou')",
            last_name,
            first_name
        ).first

        # We look into contacts if the user wasn't found
        if payer.nil?
            failed.update(failed_payment_import_reason: payer_not_found)
            render :json => { success: false, message: "Le.a payeur.se n'a pas été trouvé.e", failed_payment_import: failed }
            return
        end

        if payer.payment_schedule.nil?
            failed.update(failed_payment_import_reason: payer_without_schedule, user_id: payer.id, first_name: first_name, last_name: last_name)
            render :json => { success: false, message: "Le.a payeur.se n'a pas d'échéancier", failed_payment_import: failed }
            return
        end

        # Looks for due payments from two days after the day the bank gave to two days before
        # And groups them by date in a Hash
        due_payment_candidates = payer
            .payment_schedule
            .due_payments
            .where("DATE(previsional_date) >= ? AND DATE(previsional_date) <= ?", due_date - 2, due_date + 2)
            .to_a
            .reduce({}) do |h, due|
                key = due.previsional_date.strftime("%Y-%m-%d")
                if !h[key].nil?
                    h[key] << due
                else
                    h[key] = [due]
                end
                h
            end

        if due_payment_candidates.nil? || due_payment_candidates.empty?
            failed.update(failed_payment_import_reason: due_not_found, user_id: payer.id, first_name: first_name, last_name: last_name)
            render :json => { success: false, message: "L'échéance n'a pas été trouvée", failed_payment_import: failed }
            return
        end

        due_payments = []

        due_payment_candidates.keys.sort_by!{ |d| (due_date - Date.strptime(d, "%Y-%m-%d")).abs }.each do |k|
            date_candidates = due_payment_candidates[k]

            amount_sum = date_candidates.reduce(0.0){ |acc, due| acc + due.amount }
            if (amount_sum - amount).abs < 0.01
                due_payments = date_candidates
                break
            else
                target_dues = date_candidates.select { |due| (due.amount - amount).abs < 0.01 }
                if !target_dues.empty?
                    due_payments = [target_dues.first]
                    break
                end
            end
        end

        if due_payments.empty?
            failed.update(failed_payment_import_reason: different_amounts, user_id: payer.id, first_name: first_name, last_name: last_name)
            render :json => { success: false, message: "Les montants diffèrent", failed_payment_import: failed }
            return
        end

        if Payment.where(due_payment_id: due_payments.map{ |d| d.id }).none?
            Payment.transaction do
                due_payments.each do |due|
                    Payment.create(
                        due_payment_id: due.id,
                        payable_id: payer.id,
                        payable_type: "User",
                        payment_method_id: due.payment_method_id,
                        cashing_date: due.previsional_date,
                        amount: due.amount,
                    )
                    due.update(due_payment_status_id: nil)
                end

                failed.destroy
            end

            render :json => { success: true, message: "Import réussi !" }
            return
        end

        failed.destroy
        render :json => { success: true, message: "Règlement déjà existant, suppression de l'import..." }
    end

    def create_reasons
        payer_not_found = FailedPaymentImportReason.find_or_create_by(code: "payer_not_found", label: "Payeur introuvable")
        payer_without_schedule = FailedPaymentImportReason.find_or_create_by(code: "payer_without_schedule", label: "Payeur sans échéancier")
        due_not_found = FailedPaymentImportReason.find_or_create_by(code: "due_not_found", label: "Échéance introuvable")
        different_amounts = FailedPaymentImportReason.find_or_create_by(code: "different_amounts", label: "Montants différents")
        render html: helpers.tag.h1("Insertions réussies")
    end

    def bulkdelete
        if(params[:all])
            @to_delete = FailedPaymentImport.all
        else
            @to_delete = FailedPaymentImport.where(id: params[:targets])
        end

        @to_delete.destroy_all
    end

    def bulkdelete_by_reason
        @to_delete = FailedPaymentImport.where(failed_payment_import_reason_id: params[:reasonId])
        @to_delete.destroy_all
    end

    def migrate_reasons
        wrong_status = FailedPaymentImportReason.find_or_create_by(code: "wrong_status", label: "Statut incorrect")
        payer_not_found = FailedPaymentImportReason.find_or_create_by(code: "payer_not_found", label: "Payeur introuvable")
        due_not_found = FailedPaymentImportReason.find_or_create_by(code: "due_not_found", label: "Échéance introuvable")
        payment_found = FailedPaymentImportReason.find_or_create_by(code: "payment_found", label: "Paiement déjà existant")

        FailedPaymentImport.all.each do |import|
            case import.reason
            when "payer_not_found"
                import.failed_payment_import_reason = payer_not_found
            when "due_not_found"
                import.failed_payment_import_reason = due_not_found
            when "payment_found"
                import.failed_payment_import_reason = payment_found
            when "wrong_status"
            else
                import.failed_payment_import_reason = wrong_status
            end

            import.save
        end

        render html: helpers.tag.h1("Migration réussie")
    end
end