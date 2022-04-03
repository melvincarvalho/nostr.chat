import {
  h,
  html,
  Component,
  render
} from '../js/preacthtm.js'

import Person from '../components/Person.js'
import Message from '../components/Message.js'
import MessageBox from '../components/MessageBox.js'
import ReconnectingWebSocket from 'https://cdn.skypack.dev/reconnecting-websocket'
import handleMutation from '../js/handlemutation.js'

import '../js/dior.js'

console.time('nostr.chat')

var startTime = 0
var authenticatedUser

// FUNCTIONS
function sendReq(id, kind, authors, ws, p) {
  reqs++
  if (authors) {
    let req = `["REQ", "${id}", { "kinds": [${kind}], "authors": ${JSON.stringify(authors)} }]`
    console.log('req', reqs, req)
    ws.send(req)
  } else if (p) {
    let req = `["REQ", "${id}", { "kinds": [${kind}], "#p": ${JSON.stringify(p)} }]`
    console.log('req', reqs, req)
    ws.send(req)
  }
}

function debug(debug) {
  var currentTime = new Date();
  var ms = currentTime.getMilliseconds();
  console.log(ms + " !!!! " + debug);
}

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

function findNode(id, currentNode) {
  var i,
    currentChild,
    result;

  if (id == currentNode.id || id == currentNode['@id']) {
    return currentNode;
  } else {

    // Use a for loop instead of forEach to avoid nested functions
    // Otherwise "return" will not work properly
    for (i = 0; i < currentNode.length; i += 1) {
      currentChild = currentNode[i];

      // Search in the current child
      result = findNode(id, currentChild);

      // Return the result if the node has been found
      if (result !== false) {
        return result;
      }
    }

    // The node has not been found and we have no more options
    return false;
  }
}

function _(id) {
  return findNode(id, di.data)
}

// INIT
globalThis.qs = Object.fromEntries(
  new URLSearchParams(document.location.search)
)
globalThis._ = _

var id = Math.random()

var f = []
var reqs = 0

// COMPONENTS
class App extends Component {
  // CONSTRUCTOR
  constructor(props) {
    super(props)
    this.state = {}
    this.processMutation = this.processMutation.bind(this)
    this.queue = []
    this.speed = 2 // ms
    this.lastEvent = 0
    this.processed = 0
  }

  // HANDLERS
  handleClick() {
    console.log('click')
  }

  // QUEUE
  //
  // [[event, ws]]
  addToQueue(event, ws) {
    this.lastEvent = Date.now()
    this.queue.push([event, ws])
  }

  async processQueue() {
    var q = this.queue
    this.processed++

    console.log(this.processed, 'processing queue', 'length', q?.length, 'timestamp', this.lastEvent)
    var elapsed = Date.now() - startTime
    // console.log('time (ms)', elapsed)
    if (!q || q?.length === 0) {
      return
    }

    // return
    var pubkey = await me()

    var item = q?.pop()
    var e = item[0]
    var ws = item[1]

    var json = JSON.parse(e.data)
    var payload = json[2]
    console.log(json)
    var kind = payload.kind
    // console.log('kind', kind)

    // process follows, fetch profile for each user
    if (kind === 3) {
      var followed = json[2].tags
      var authors = []
      followed.forEach(i => {
        authors.push(i[1])
      })
      if (json[1] === 'me') {
        sendReq(id, 0, authors, ws)
      }
      // followed.forEach(i => {
      //   // console.log(i)

      //   // get profiles of follows
      //   sendReq(id, 0, [i[1]], ws)
      // })
      // console.log('event', json)
      // console.log('got followed event', followed)
    }

    // process chat messages
    if (kind === 4) {
      var message = {
        source: payload.pubkey,
        destination: payload.tags[0][1],
        description: payload.content,
        timestamp: payload.created_at
      }
      _('#me').messages.push(message)
    }

    // process profiles
    if (kind === 0) {
      let content = JSON.parse(payload.content)
      if (content.name && content.picture) {
        // payload : , payload)

        var p = this.state.pubKey
        // console.log('p', p)
        // console.log('payload.pubkey', payload.pubkey)

        if (payload.pubkey === p) {
          _('#me').about = content.about
          _('#me').name = content.name
          _('#me').nick = content.nick
          _('#me').fullname = content.name
          _('#me').image = content.picture
          // console.log('about', content.about)
        }

        var p = {
          id: payload.pubkey,
          name: content.name,
          image: content.picture,
          pubkey: payload.pubkey,
          blurb: 'Online',
          about: content.about,
          lastMessage: '12:51',
          unread: Math.floor(Math.random() * 1.7)
        }

        p.unread = 0
        _('#me').messages.forEach(el => {
          if (
            el.source === pubkey &&
            el.destination === payload.pubkey
          )
            p.unread++
          if (
            el.destination === pubkey &&
            el.source === payload.pubkey
          )
            p.unread++
        })

        const found = f.some(
          person => person.pubkey === payload.pubkey
        )
        if (!found) {
          if (p.id !== pubkey) {
            f.push(p)
          }
        }
        f = f.sort((a, b) => {
          return b.unread - a.unread
        })

        // console.log('followed', f)
        _('#me').roster = f


        // REPAINT
        if (elapsed > 2 && q.length === 0) {
          // renderAll()
          di.data.muation = true
          this.setState({ update: Math.random() })

        } else {

        }
      }
    }

    if (q && q.length > 0) {
      proceessQueue()
    }

  }

  // FETCH
  async componentDidMount() {
    // get me from extension or other
    var pub = await me()
    this.setState({ pubKey: pub })
    console.log('pub', pub)
    // console.log('handle mutations')
    handleMutation('data', this.processMutation)

    // FETCH
    // one per relay
    _('#me').relay.map(el => {
      var ws = new ReconnectingWebSocket(el.id)

      startTime = Date.now()

      ws.addEventListener('open', () => {
        console.log('connected to', el)

        // init
        var pubkey = pub

        // get follows
        // this.addToQueue('me', 3, [pubkey], ws)
        if (pubkey) {
          sendReq('me', 3, [pubkey], ws)
        }

        // get user
        // sendReq(id, 0, [pubkey], ws)

        // get encrypted chat
        if (pubkey) {
          sendReq(id, 4, [pubkey], ws)
          sendReq(id, 4, null, ws, [pubkey])
        }

        // process events
        ws.addEventListener('message', e => {
          // init
          this.addToQueue(e, ws)
          this.processQueue()
        })
      })
    })
  }

  processMutation() {
    console.log('mutation!')
    var currentPerson = _('#ui')?.currentchatid
    currentPerson =
      _('#me')?.roster?.find(el => {
        if (el.id === currentPerson) return true
      }) || _('#me')

    var m = []
    var m = _('#me').messages.filter(el => {
      if (
        el.source === currentPerson.id ||
        el.destination === currentPerson.id
      ) {
        return true
      }
    })
    m = m.sort((a, b) => a.timestamp - b.timestamp)

    this.setState({ mutation: true, m: m, currentPerson: currentPerson })
    console.log('setstate m', m)
  }

  render() {
    // init
    var currentPerson = _('#ui')?.currentchatid

    currentPerson =
      _('#me')?.roster?.find(el => {
        if (el.id === currentPerson) return true
      }) || _('#me')
    console.log('currentPerson', currentPerson)

    var m = []
    var m = _('#me').messages.filter(el => {
      if (
        el.source === currentPerson.id ||
        el.destination === currentPerson.id
      ) {
        return true
      }
    })

    console.log('massage', m)

    return html`
            <div
              class="relative flex w-full h-screen overflow-hidden antialiased bg-gray-200"
            >
              <!-- left -->
              <div
                class="relative flex flex-col hidden h-full bg-white border-r border-gray-300 shadow-xl md:block transform transition-all duration-500 ease-in-out"
                style="width: 24rem"
              >
                <div class="flex justify-between px-3 pt-1 text-white">
                  <div class="flex items-center w-full py-2"></div>
                </div>
                <div class="border-b shadow-bot">
                  <ul
                    class="flex flex-row items-center inline-block px-2 list-none select-none"
                  >
                    <li
                      class="flex-auto px-1 mx-1 -mb-px text-center rounded-t-lg cursor-pointer last:mr-0 hover:bg-gray-200"
                    >
                      <a
                        class="flex items-center justify-center block py-2 text-xs font-semibold leading-normal tracking-wide border-b-2 border-transparent"
                      >
                        All
                      </a>
                    </li>
                    <li
                      class="flex-auto px-1 mx-1 -mb-px text-center rounded-t-lg cursor-pointer last:mr-0 hover:bg-gray-200"
                    >
                      <a
                        class="flex items-center justify-center block py-2 text-xs font-semibold leading-normal tracking-wide border-b-2 border-blue-500"
                      >
                        Private
                        <span
                          class="flex items-center justify-center w-5 h-5 ml-1 text-xs text-white bg-blue-500 rounded-full"
                          >8</span
                        >
                      </a>
                    </li>
                    <li
                      class="flex-auto px-1 mx-1 -mb-px text-center rounded-t-lg cursor-pointer last:mr-0 hover:bg-gray-200"
                    >
                      <a
                        class="flex items-center justify-center block py-2 text-xs font-semibold leading-normal tracking-wide border-b-2 border-transparent"
                      >
                        Relays
                      </a>
                    </li>
                  </ul>
                </div>
                <div
                  class="relative mt-2 mb-4 overflow-x-hidden overflow-y-auto scrolling-touch lg:max-h-sm scrollbar-w-2 scrollbar-track-gray-lighter scrollbar-thumb-rounded scrollbar-thumb-gray"
                >
                  <ul
                    class="flex flex-col inline-block w-full h-screen px-2 select-none"
                  >
                    ${_('#me').roster.map(el => {
      return html`
                        <${Person} roster="${el}" />
                      `
    })}
                  </ul>
                </div>
              </div>

              <!-- center -->
              <div class="relative flex flex-col flex-1">
                <div
                  class="z-20 flex flex-grow-0 flex-shrink-0 w-full pr-3 bg-white border-b"
                >
                  <div
                    class="w-12 h-12 mx-4 my-2 bg-blue-500 bg-center bg-no-repeat bg-cover rounded-full cursor-pointer"
                    style="background-image: url(${currentPerson.image})"
                  ></div>
                  <div
                    class="flex flex-col justify-center flex-1 overflow-hidden cursor-pointer"
                  >
                    <div
                      class="overflow-hidden text-base font-medium leading-tight text-gray-600 whitespace-no-wrap"
                    >
                      ${currentPerson.name}
                    </div>
                    <div
                      class="overflow-hidden text-sm font-medium leading-tight text-gray-600 whitespace-no-wrap"
                    >
                      ${currentPerson.status}
                    </div>
                  </div>
                  <button
                    class="flex self-center p-2 ml-2 text-gray-500 rounded-full focus:outline-none hover:text-gray-600 hover:bg-gray-300"
                  >
                    <svg
                      class="w-6 h-6 text-gray-600 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill-rule="nonzero"
                        d="M11,20 L13,20 C13.5522847,20 14,20.4477153 14,21 C14,21.5128358 13.6139598,21.9355072 13.1166211,21.9932723 L13,22 L11,22 C10.4477153,22 10,21.5522847 10,21 C10,20.4871642 10.3860402,20.0644928 10.8833789,20.0067277 L11,20 L13,20 L11,20 Z M3.30352462,2.28241931 C3.6693482,1.92735525 4.23692991,1.908094 4.62462533,2.21893936 L4.71758069,2.30352462 L21.2175807,19.3035246 C21.6022334,19.6998335 21.5927842,20.332928 21.1964754,20.7175807 C20.8306518,21.0726447 20.2630701,21.091906 19.8753747,20.7810606 L19.7824193,20.6964754 L18.127874,18.9919007 L18,18.9999993 L4,18.9999993 C3.23933773,18.9999993 2.77101468,18.1926118 3.11084891,17.5416503 L3.16794971,17.4452998 L5,14.6972244 L5,8.9999993 C5,7.98873702 5.21529462,7.00715088 5.62359521,6.10821117 L3.28241931,3.69647538 C2.89776658,3.3001665 2.90721575,2.66707204 3.30352462,2.28241931 Z M7.00817933,8.71121787 L7,9 L7,14.6972244 C7,15.0356672 6.91413188,15.3676193 6.75167088,15.6624466 L6.66410059,15.8066248 L5.86851709,17 L16.1953186,17 L7.16961011,7.7028948 C7.08210009,8.02986218 7.02771758,8.36725335 7.00817933,8.71121787 Z M12,2 C15.7854517,2 18.8690987,5.00478338 18.995941,8.75935025 L19,9 L19,12 C19,12.5522847 18.5522847,13 18,13 C17.4871642,13 17.0644928,12.6139598 17.0067277,12.1166211 L17,12 L17,9 C17,6.23857625 14.7614237,4 12,4 C11.3902636,4 10.7970241,4.10872043 10.239851,4.31831953 C9.72293204,4.51277572 9.14624852,4.25136798 8.95179232,3.734449 C8.75733613,3.21753002 9.01874387,2.6408465 9.53566285,2.4463903 C10.3171048,2.15242503 11.1488212,2 12,2 Z"
                      />
                    </svg>
                  </button>
                </div>
                <div
                  style="flex-direction: column-reverse;"
                  class="overflow-y-auto top-0 bottom-0 left-0 right-0 flex flex-col flex-1 bg-transparent bg-bottom bg-cover"
                >
                  <div class="self-center flex-1 w-full max-w-xl">
                    <div class="relative flex flex-col px-3 py-1 m-auto">
                      <div
                        class="self-center px-2 py-1 mx-0 my-1 text-sm text-green text-gray-700 bg-white border border-gray-200 rounded-full shadow rounded-tg"
                      >
                        Channel was created
                      </div>
                      <div
                        class="self-center px-2 py-1 mx-0 my-1 text-sm text-green text-gray-700 bg-white border border-gray-200 rounded-full shadow rounded-tg"
                      >
                        Apr 2
                      </div>
                      ${this.state.m?.map(el => {
      return html`
                          <${Message}
                            message="${el}"
                            side=${el.source === this.state.currentPerson
          ? 'l'
          : 'r'}
                            pubkey="${this.state.pubkey}"
                            random="${Math.random()}"
                          />
                        `
    })}
                    </div>
                  </div>
                </div>
                <${MessageBox} />
              </div>

              <!-- right -->
              <nav
                class="right-0 flex flex-col hidden pb-2 bg-white border-l border-gray-300 xl:block"
                style="width: 24rem"
              >
                <div class="flex items-center justify-between w-full p-3">
                  <div class="ml-4 mr-auto text-lg font-medium">Info</div>
                </div>
                <div>
                  <div class="flex justify-center mb-4">
                    <button
                      type="button"
                      class="content-center block w-32 h-32 p-1 overflow-hidden text-center rounded-full focus:outline-none"
                    >
                      <img
                        class="content-center object-cover w-full h-full border-2 border-gray-200 rounded-full"
                        src="${currentPerson.image}"
                        alt=""
                      />
                    </button>
                  </div>
                  <p class="text-lg font-semibold text-center text-gray-800">
                    ${currentPerson.fullname}
                  </p>
                  <p class="text-sm font-medium text-center text-blue-500">
                    ${currentPerson.status}
                  </p>
                </div>
                <div class="flex items-center w-full px-3 mt-6">
                  <div
                    class="px-2 text-gray-500 rounded-full hover:text-gray-600"
                  >
                    <svg
                      class="w-6 h-6 text-gray-600 fill-current"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill-rule="nonzero"
                        d="M12,1 C18.0751322,1 23,5.92486775 23,12 C23,18.0751322 18.0751322,23 12,23 C5.92486775,23 1,18.0751322 1,12 C1,5.92486775 5.92486775,1 12,1 Z M12,3 C7.02943725,3 3,7.02943725 3,12 C3,16.9705627 7.02943725,21 12,21 C16.9705627,21 21,16.9705627 21,12 C21,7.02943725 16.9705627,3 12,3 Z M12,11 C12.5128358,11 12.9355072,11.3860402 12.9932723,11.8833789 L13,12 L13,17 C13,17.5522847 12.5522847,18 12,18 C11.4871642,18 11.0644928,17.6139598 11.0067277,17.1166211 L11,17 L11,12 C11,11.4477153 11.4477153,11 12,11 Z M12,6.5 C12.8284271,6.5 13.5,7.17157288 13.5,8 C13.5,8.82842712 12.8284271,9.5 12,9.5 C11.1715729,9.5 10.5,8.82842712 10.5,8 C10.5,7.17157288 11.1715729,6.5 12,6.5 Z"
                      />
                    </svg>
                  </div>
                  <div class="ml-4">
                    <div
                      class="mt-1 mr-auto text-sm font-semibold leading-none text-gray-600"
                    >
                      About
                    </div>
                    <div class="mr-auto text-sm  text-gray-400">
                      ${currentPerson.about}
                    </div>
                  </div>
                </div>
                <div>
                  <div class="flex items-center w-full px-3 mt-4">
                    <div
                      class="px-2 text-gray-500 rounded-full hover:text-gray-600"
                    >
                      <svg
                        class="w-6 h-6 text-gray-600 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill-rule="nonzero"
                          d="M12,1 C18.0751322,1 23,5.92486775 23,12 C23,15.2534621 21.3575416,17.4078375 19.0415827,17.5042247 C17.5448049,17.5665187 16.2418767,16.729824 15.5433162,15.3661459 C14.6550197,16.3039294 13.3958222,16.8888889 12,16.8888889 C9.29994122,16.8888889 7.11111111,14.7000588 7.11111111,12 C7.11111111,9.29994122 9.29994122,7.11111111 12,7.11111111 C13.1311057,7.11111111 14.1724943,7.49523561 15.000833,8.14015176 L15,8 C15,7.44771525 15.4477153,7 16,7 C16.5128358,7 16.9355072,7.38604019 16.9932723,7.88337887 L17,8 L17,13 C17,14.5880914 17.9057778,15.5497641 18.9584173,15.5059546 C20.0913022,15.4588053 21,14.2668872 21,12 C21,7.02943725 16.9705627,3 12,3 C7.02943725,3 3,7.02943725 3,12 C3,16.9705627 7.02943725,21 12,21 C12.7993259,21 13.583948,20.8960375 14.3403366,20.6929627 C14.8737319,20.549757 15.4222254,20.8660682 15.5654311,21.3994635 C15.7086368,21.9328588 15.3923256,22.4813523 14.8589303,22.624558 C13.9337959,22.8729377 12.9748353,23 12,23 C5.92486775,23 1,18.0751322 1,12 C1,5.92486775 5.92486775,1 12,1 Z M12,9.11111111 C10.4045107,9.11111111 9.11111111,10.4045107 9.11111111,12 C9.11111111,13.5954893 10.4045107,14.8888889 12,14.8888889 C13.5954893,14.8888889 14.8888889,13.5954893 14.8888889,12 C14.8888889,10.4045107 13.5954893,9.11111111 12,9.11111111 Z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div
                        class="mt-1 ml-4 mr-auto text-sm font-semibold leading-none text-gray-600"
                      >
                        Username / Pubkey
                      </div>
                      <div class="break-all ml-4 mr-auto text-sm text-gray-400">
                        @${currentPerson.name}<br /><br />
                        ${currentPerson.id}
                      </div>
                    </div>
                  </div>
                </div>
                <div></div>
                <div>
                  <div class="flex items-center w-full px-3 mt-4 mb-2">
                    <div class="px-2 text-gray-500 cursor-pointer">
                      <svg
                        class="w-6 h-6 text-blue-500 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill-rule="nonzero"
                          d="M18,3 C19.6568542,3 21,4.34314575 21,6 L21,18 C21,19.6568542 19.6568542,21 18,21 L6,21 C4.34314575,21 3,19.6568542 3,18 L3,6 C3,4.34314575 4.34314575,3 6,3 L18,3 Z M17.2928932,7.29289322 L10,14.5857864 L6.70710678,11.2928932 C6.31658249,10.9023689 5.68341751,10.9023689 5.29289322,11.2928932 C4.90236893,11.6834175 4.90236893,12.3165825 5.29289322,12.7071068 L9.29289322,16.7071068 C9.68341751,17.0976311 10.3165825,17.0976311 10.7071068,16.7071068 L18.7071068,8.70710678 C19.0976311,8.31658249 19.0976311,7.68341751 18.7071068,7.29289322 C18.3165825,6.90236893 17.6834175,6.90236893 17.2928932,7.29289322 Z"
                        />
                      </svg>
                    </div>
                    <div class="ml-4">
                      <div class="mr-auto text-sm font-semibold text-gray-800">
                        Notifications
                      </div>
                      <div
                        class="mt-1 mr-auto text-sm leading-none text-gray-400"
                      >
                        Enabled
                      </div>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
          `
  }
}

render(
  html`
          <${App} />
        `,
  document.body
)
