/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    let settings = app.settings()

    settings.meta.appName = "Flowline · Gestionale Gibboni"
    settings.meta.appURL = $os.getenv("PB_APP_URL") || "http://localhost:3000"
    settings.meta.hideControls = false

    settings.logs.maxDays = 7
    settings.logs.minLevel = 0
    settings.logs.logIP = true

    settings.trustedProxy.headers = [
        "X-Real-IP",
        "X-Forwarded-For",
        "CF-Connecting-IP",
    ]

    app.save(settings)
})
