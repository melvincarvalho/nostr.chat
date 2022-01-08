import { html } from 'https://unpkg.com/htm/preact/standalone.module.js'

var Message = props => {
  return html`
    <div class="self-${props.side === 'r' ? 'end' : 'start'} w-3/4 my-2">
      <div
        class="p-4 text-sm bg-white rounded-t-lg rounded-${props.side}-lg shadow"
      >
        ${props.message.description}
      </div>
    </div>
  `
}

export default Message
