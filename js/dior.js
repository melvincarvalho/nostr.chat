;(() => {
  globalThis.di = new Proxy(
    Array.from(
      document.querySelectorAll(
        '[type="application/ld+json"], [type="application/json"]'
      )
    )
      .map(island => [island.id, JSON.parse(island.text)])
      .reduce((obj, item) => {
        obj[item[0]] = item[1]
        return obj
      }, {}),
    {
      set: (obj, prop, value) => {
        obj[prop] = value
        var island = document.getElementById(prop)
        island.text = JSON.stringify(value, null, 2)
        return true
      }
    }
  )
})()
