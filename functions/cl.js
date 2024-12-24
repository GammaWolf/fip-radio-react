export async function onRequest(context) {
    let u = context.request.url
    let pr = u.split('?')
    let p = pr[1]
    let r = await fetch('http://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?' + p)
    return r
  }