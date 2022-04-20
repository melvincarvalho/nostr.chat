export { me }

var authenticatedUser

// get me i.e. public key
async function me() {
  if (authenticatedUser) {
    return authenticatedUser
  }

  const delay = t => new Promise(resolve => setTimeout(resolve, t));

  var nos2x = await delay(100).then(() => window.nostr?.getPublicKey())

  if (nos2x) {
    // if (navigator.userAgent.indexOf("Firefox") > 0) {
    //   nos2x = nos2x.split(/(..)/g).filter(i => i).map(i => String.fromCharCode(parseInt(i, 16))).join('')
    // }
    authenticatedUser = nos2x
  }

  return authenticatedUser
  //  || qs.user || _('#me').pubkey
}