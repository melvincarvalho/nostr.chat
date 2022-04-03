import { html, Component } from 'https://unpkg.com/htm/preact/standalone.module.js'
import secp256k1 from 'https://cdn.skypack.dev/noble-secp256k1'
import hexToArrayBuffer from 'https://cdn.skypack.dev/hex-to-array-buffer'
import sha256 from 'https://cdn.skypack.dev/sha256'

// import { Buffer } from 'https://cdn.skypack.dev/buffer'
// import createHash from 'https://cdn.skypack.dev/create-hash'

var authenticatedUser

// get me i.e. public key
async function me() {
  if (authenticatedUser) {
    return authenticatedUser
  }


  const delay = t => new Promise(resolve => setTimeout(resolve, t));

  var nos2x = await delay(100).then(() => window.nostr?.getPublicKey())

  if (nos2x) {
    authenticatedUser = nos2x
  }

  return authenticatedUser
  //  || qs.user || _('#me').pubkey
}

function verifySignature(event) {
  return secp256k1.schnorr.verify(event.sig, event.id, event.pubkey)
}

function getEventHash(event) {
  let eventHash = createHash('sha256')
    .update(Buffer.from(serializeEvent(event)))
    .digest()
  return Buffer.from(eventHash).toString('hex')
}

function getRelays() {
  var relays = di.data[0].relay.filter(i => i.mode === 'rw').map(i => i.id)
  return relays
}

function sendToRelay(relay, msg) {
  var ws = new WebSocket(relay)
  ws.onopen = function (e) {
    console.log('connected to', relay)
    console.log('sending', msg)
    ws.send(msg)
    var timeout = 1000
    setTimeout(() => ws.close(), timeout)
  }
}

async function generateKey(rawKey) {
  var usages = ['encrypt', 'decrypt']
  var extractable = false

  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-CBC' },
    extractable,
    usages
  )
}

function _base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64)
  var len = binary_string.length
  var bytes = new Uint8Array(len)
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i)
  }
  return bytes.buffer
}

function _arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

class Message extends Component {
  constructor(props) {
    super(props)
    this.setState({})
    this.sendMessage = this.sendMessage.bind(this)

  }

  async componentDidMount() {
    var priv = localStorage.getItem('key')
  }

  async sendMessage(e) {



    if (e.keyCode === 13) {
      // var priv = localStorage.getItem('key')
      // if (!priv) {
      //   alert(`localStorage.setIem('key', <privkey>)`)
      //   return
      // }

      if (!window.nostr?.signEvent) {
        alert(`nos2x required to send messages`)
        return
      }


      var created_at = Math.floor(new Date().getTime() / 1000.0)
      console.log('e', e.target.value)
      console.log('keycode', e.keyCode)

      var kind = 4
      var pubkey = di.data[1].currentchatid
      var authenticatedUser = await me()

      // var sharedPoint = secp256k1.getSharedSecret(priv, '02' + pubkey)
      // var shared = sharedPoint.substr(2, 64)
      // var genkey = await generateKey(hexToArrayBuffer(shared))
      // var iv = await window.crypto.getRandomValues(new Uint8Array(16))
      // let enc = new TextEncoder();
      // var encoded = enc.encode(e.target.value);
      // var content = await window.crypto.subtle.encrypt(
      //   {
      //     name: "AES-CBC",
      //     iv
      //   },
      //   genkey,
      //   encoded
      // )
      // content = _arrayBufferToBase64(content)
      // iv = _arrayBufferToBase64(iv)
      // var comb = content + '?iv=' + iv

      // console.log('shared', shared)
      // console.log('content', content)
      // console.log('iv', iv)
      // console.log('comb', comb)

      var comb = await window.nostr.nip04.encrypt(pubkey, e.target.value)


      var canonical = []
      canonical.push(0)
      canonical.push(authenticatedUser)
      canonical.push(created_at)
      canonical.push(kind)
      canonical.push([["p", pubkey]])
      canonical.push(comb)
      var sha = sha256(JSON.stringify(canonical))

      console.log('canonical', JSON.stringify(canonical))


      var event = {
        id: sha,
        pubkey: authenticatedUser,
        created_at: created_at,
        kind: kind,
        tags: [["p", pubkey]],
        content: comb
      }

      console.log('event', event)


      // event.sig = await secp256k1.schnorr.sign(sha, priv)
      event.sig = await window.nostr.signEvent(event)

      console.log('event', event)

      // remove noble dep. I know it verifies
      // var verify = await verifySignature(event)
      // console.log('verified', verify)

      console.log('Sending...', JSON.stringify(['EVENT', event], di.data[0].relay[1].id))

      this.setState({ message: '' })

      var relays = getRelays()
      console.log('relays', relays)
      sendToRelay(relays[0], JSON.stringify(['EVENT', event]))
    }

  }

  render() {
    return html`

    <div
      class="overflow-y-scroll relative flex items-center self-center w-full max-w-xl p-4 overflow-hidden text-gray-600 focus-within:text-gray-400"
    >
      <div class="w-full">
        <span
          class="absolute inset-y-0 left-0 flex items-center pl-6"
        >
          <button
            type="submit"
            class="p-1 focus:outline-none focus:shadow-none"
          >
            <svg
              class="w-6 h-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill-rule="nonzero"
                d="M9.5,3 C13.0898509,3 16,5.91014913 16,9.5 C16,10.9337106 15.5358211,12.2590065 14.7495478,13.3338028 L19.7071068,18.2928932 C20.0976311,18.6834175 20.0976311,19.3165825 19.7071068,19.7071068 C19.3466228,20.0675907 18.7793918,20.0953203 18.3871006,19.7902954 L18.2928932,19.7071068 L13.3338028,14.7495478 C12.2590065,15.5358211 10.9337106,16 9.5,16 C5.91014913,16 3,13.0898509 3,9.5 C3,5.91014913 5.91014913,3 9.5,3 Z M9.5,5 C7.01471863,5 5,7.01471863 5,9.5 C5,11.9852814 7.01471863,14 9.5,14 C11.9852814,14 14,11.9852814 14,9.5 C14,7.01471863 11.9852814,5 9.5,5 Z"
              />
            </svg>
          </button>
        </span>
        <span
          class="absolute inset-y-0 right-0 flex items-center pr-6"
        >
          <button
            type="submit"
            class="p-1 focus:outline-none focus:shadow-none hover:text-blue-500"
            onClick=${this.sendMessage}
          >
            <svg
              class="w-6 h-6 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill-rule="nonzero"
                d="M6.43800037,12.0002892 L6.13580063,11.9537056 C5.24777712,11.8168182 4.5354688,11.1477159 4.34335422,10.2699825 L2.98281085,4.05392998 C2.89811796,3.66698496 2.94471512,3.2628533 3.11524595,2.90533607 C3.53909521,2.01673772 4.60304421,1.63998415 5.49164255,2.06383341 L22.9496381,10.3910586 C23.3182476,10.5668802 23.6153089,10.8639388 23.7911339,11.2325467 C24.2149912,12.1211412 23.8382472,13.1850936 22.9496527,13.6089509 L5.49168111,21.9363579 C5.13415437,22.1068972 4.73000953,22.1534955 4.34305349,22.0687957 C3.38131558,21.8582835 2.77232686,20.907987 2.9828391,19.946249 L4.34336621,13.7305987 C4.53547362,12.8529444 5.24768451,12.1838819 6.1356181,12.0469283 L6.43800037,12.0002892 Z M5.03153725,4.06023585 L6.29710294,9.84235424 C6.31247211,9.91257291 6.36945677,9.96610109 6.44049865,9.97705209 L11.8982869,10.8183616 C12.5509191,10.9189638 12.9984278,11.5295809 12.8978255,12.182213 C12.818361,12.6977198 12.4138909,13.1022256 11.8983911,13.1817356 L6.44049037,14.0235549 C6.36945568,14.0345112 6.31247881,14.0880362 6.29711022,14.1582485 L5.03153725,19.9399547 L21.6772443,12.0000105 L5.03153725,4.06023585 Z"
              />
            </svg>
          </button>
        </span>
        <input
          type="search"
          value=${this.state.message} onKeyUp=${this.sendMessage}
          class="w-full py-2 pl-10 text-sm bg-white border border-transparent appearance-none rounded-tg placeholder-gray-800 focus:bg-white focus:outline-none focus:border-blue-500 focus:text-gray-900 focus:shadow-outline-blue"
          style="border-radius: 25px"
          placeholder="Message..."
          autocomplete="off"
          autofocus          
        />
      </div>
    </div>
    `


  }
}

export default Message
