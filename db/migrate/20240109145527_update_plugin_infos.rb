class UpdatePluginInfos < ActiveRecord::Migration[6.1]
  def change
    plugin_six = Plugin.find_by(id: 6)
    plugin_seven = Plugin.find_by(id: 7)

    if plugin_six
      plugin_six.update(image: "/plugin_assets/elvis_plugin_student_payments/images/plugin-facturation.png")
      plugin_six.update(logo: "/plugin_assets/elvis_plugin_student_payments/images/stripe_Logo.png")
      plugin_six.update(display_name: "Facturation")
      plugin_six.update(description: "Gérez votre facturation : créer vos produits, des devis et des factures facilement.")
    end

    if plugin_seven
      plugin_seven.update(image: "/plugin_assets/plugin_stats_metabase/images/plugin-statistiques.png")
      plugin_seven.update(logo: "/plugin_assets/plugin_stats_metabase/images/metabase_logo.png")
      plugin_seven.update(display_name: "Statistiques")
      plugin_seven.update(description: "Consultez les statistiques de vos demandes d’inscription par saison")
    end
  end
end
