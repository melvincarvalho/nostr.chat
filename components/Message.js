import { html, Component } from 'https://unpkg.com/htm/preact/standalone.module.js'
import secp256k1 from 'https://cdn.skypack.dev/noble-secp256k1'
import hexToArrayBuffer from 'https://cdn.skypack.dev/hex-to-array-buffer'
import moment from 'https://cdn.skypack.dev/moment'


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

class Message extends Component {
  constructor(props) {
    super(props)
    var id = props.pubkey === props.message.source ? props.message.destination : props.message.source
    this.setState({ id: id })
  }

  async componentDidMount() {
    let split = this.props.message.description?.split('?iv=')
    console.log('chat message', split[0])
    console.log('iv', split[1])
    var cyphertext = split[0]
    var iv = split[1]
    var pub = this.state.id
    console.log('pub', this.props.message)
    var priv = localStorage.getItem('key')
    if (!priv) return
    var sharedPoint = secp256k1.getSharedSecret(priv, '02' + pub)
    var shared = sharedPoint.substr(2, 64)

    console.log('shared', shared)

    var cyphertext = _base64ToArrayBuffer(cyphertext)
    var iv = _base64ToArrayBuffer(iv)
    var genkey = await generateKey(hexToArrayBuffer(shared))
    var decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      genkey,
      cyphertext
    )
    console.log(decrypted)
    console.log('decrypted', new TextDecoder().decode(decrypted))
    var decoded = new TextDecoder().decode(decrypted)
    this.setState({ decrypted: decoded })

  }

  async didComponentUpdate() {
    console.log('UPDATE!')
    let split = this.props.message.description?.split('?iv=')
    console.log('chat message', split[0])
    console.log('iv', split[1])
    var cyphertext = split[0]
    var iv = split[1]
    var pub = this.state.id
    console.log('pub', this.props.message)
    var priv = localStorage.getItem('key')
    if (!priv) return
    var sharedPoint = secp256k1.getSharedSecret(priv, '02' + pub)
    var shared = sharedPoint.substr(2, 64)

    console.log('shared', shared)

    var cyphertext = _base64ToArrayBuffer(cyphertext)
    var iv = _base64ToArrayBuffer(iv)
    var genkey = await generateKey(hexToArrayBuffer(shared))
    var decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv: iv },
      genkey,
      cyphertext
    )
    console.log(decrypted)
    console.log('decrypted', new TextDecoder().decode(decrypted))
    var decoded = new TextDecoder().decode(decrypted)
    console.log('#####', decoded)
    if (this.state.decrypted != decoded) {
      // this.setState({ decrypted: decoded })
      console.log("NEEDS UPDATE!")
    }

  }

  render() {


    return html`
      <div class="self-${this.props.side === 'r' ? 'end' : 'start'} w-3/4 my-2">
        <div
          class="p-4 text-sm bg-white rounded-t-lg rounded-${this.props.side}-lg shadow"
        >
          ${this.state.decrypted} <span class="ml-1 text-xs font-medium text-gray-600">${moment(new Date(this.props.message.timestamp * 1000)).fromNow()}</span>
        </div>
      </div>
    `


  }
}

export default Message
