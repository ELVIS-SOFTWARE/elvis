ActivityApplication.all.each do |app|
    app.update(begin_at: app.season.start)
end