/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    const email = $os.getenv("PB_SUPERUSER_EMAIL")
    const password = $os.getenv("PB_SUPERUSER_PASSWORD")

    if (!email || !password) {
        return
    }

    let record

    try {
        record = app.findAuthRecordByEmail("_superusers", email)
    } catch {
        record = new Record(app.findCollectionByNameOrId("_superusers"))
        record.set("email", email)
    }

    record.set("password", password)

    app.save(record)
})
