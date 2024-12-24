export async function onRequest(context) {
    let u = context.request.url
    let pr = u.split('?')
    let p = pr[1]
    let r = await fetch('https://www.radiofrance.fr/fip/api/live?' + p)
    return r
  }