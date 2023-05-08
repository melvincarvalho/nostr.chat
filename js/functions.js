import awaitNostr from './awaitnostr.js'

export { me }

let authenticatedUser

// get me i.e. public key
async function me () {
  if (authenticatedUser) {
    return authenticatedUser
  }

  const delay = t => new Promise(resolve => setTimeout(resolve, t))

  console.log('awaiting nostr')
  await awaitNostr()
  console.log('awaited nostr')
  console.log(window.nostr)
  let nos2x
  try {
    nos2x = await window.nostr?.getPublicKey()
  } catch (e) {
    console.log('error', e)
  }
  console.log('nos2x', nos2x)

  if (nos2x) {
    // if (navigator.userAgent.indexOf("Firefox") > 0) {
    //   nos2x = nos2x.split(/(..)/g).filter(i => i).map(i => String.fromCharCode(parseInt(i, 16))).join('')
    // }
    authenticatedUser = nos2x
  }

  return qs.pubkey || authenticatedUser
  //  || qs.user || _('#me').pubkey
}
