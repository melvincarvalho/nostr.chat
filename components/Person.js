import {
  html,
  Component
} from '../js/preacthtm.js'

import Tick from '../components/Tick.js'

class Person extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.clickPerson = this.clickPerson.bind(this)
  }

  clickPerson(id) {
    console.log('clickPerson', id)
    di.data[1].currentchatid = id
    var d = document.getElementById('data')
    console.log('d', d)
    var messages = di.data[0].messages
    di.data[0].messages = []
    d.innerHTML = JSON.stringify(di.data, null, 2)
    di.data[0].messages = messages
    d.innerHTML = JSON.stringify(di.data, null, 2)
  }

  render() {
    return html`
      <li
        class="flex flex-no-wrap items-center pr-3 text-black ${this.props.roster?.id === di.data[1].currentchatid ? 'bg-gray-200' : ''} rounded-lg cursor-pointer mt-200 py-65 hover:bg-gray-200"
        style="padding-top: 0.65rem; padding-bottom: 0.65rem"
        title="${this.props.roster?.id}"
        onClick=${() => {
        this.clickPerson(this.props.roster?.id)
      }}
        id="${this.props.roster?.id}"
      >
        <div class="flex justify-between w-full focus:outline-none">
          <div class="flex justify-between w-full">
            <div
              class="relative flex items-center justify-center w-12 h-12 ml-2 mr-3 text-xl font-semibold text-white bg-blue-500 rounded-full flex-no-shrink"
            >
              <img
                class="object-cover w-12 h-12 rounded-full"
                src="${this.props.roster?.image}"
                alt=""
              />
              <div
                class="absolute bottom-0 right-0 flex items-center justify-center bg-white rounded-full"
                style="width: 0.80rem; height: 0.80rem"
              >
                <div
                  class="bg-green-500 rounded-full"
                  style="width: 0.6rem; height: 0.6rem"
                ></div>
              </div>
            </div>
            <div class="items-center flex-1 min-w-0">
              <div class="flex justify-between mb-1">
                <h2 class="text-sm font-semibold text-black">
                  ${this.props.roster?.name}
                </h2>
                <div class="flex">
                  <${Tick} type="${!this.props.roster?.unread || 'double'}" />
                  <span class="ml-1 text-xs font-medium text-gray-600"
                    >${this.props.roster?.unread ? this.props.roster?.lastMessage : ''}</span
                  >
                </div>
              </div>
              <div class="flex justify-between text-sm leading-none truncate">
                <span class="ml-1 text-xs font-medium text-gray-500"
                  >${this.props.roster?.blurb}</span
                >
                <span
                  v-else
                  class="flex ${this.props.roster?.unread === 0
        ? ''
        : 'bg-green-500'} items-center justify-center w-5 h-5 text-xs text-right text-white  rounded-full"
                  >${this.props.roster?.unread || ''}</span
                >
              </div>
            </div>
          </div>
        </div>
      </li>
    `
  }
}

export default Person
