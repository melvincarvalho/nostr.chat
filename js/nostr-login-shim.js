// index.js

(function () {
  // Inject the shim container into the DOM
  const shimContainer = document.createElement('div')
  shimContainer.id = 'shim-container'
  shimContainer.innerHTML = `
    <div class="shim-content">
      <h1>Please log in</h1>
      <button id="nostr-login-shim" class="button">Login</button>
    </div>
  `
  document.body.appendChild(shimContainer)

  // Inject the CSS styles for the shim container
  const shimStyles = `
  #shim-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, #83a4d4, #b6fbff);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .shim-content {
    text-align: center;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .button {
    background: linear-gradient(45deg, #4facfe, #00f2fe);
    border: none;
    color: white;
    padding: 12px 24px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
    border-radius: 12px;
    transition: all 0.3s ease;
  }
  .button:hover {
    background: linear-gradient(45deg, #00f2fe, #4facfe);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }
`

  const style = document.createElement('style')
  style.type = 'text/css'
  style.appendChild(document.createTextNode(shimStyles))
  document.head.appendChild(style)

  // Add event listener for the login button
  shimContainer.querySelector('.button').addEventListener('click', login)

  async function login() {
    // Simulate checking for an extension
    const isExtensionInstalled = await checkForExtension()

    if (isExtensionInstalled) {
      // Hide the shim container after a successful login
      shimContainer.style.display = 'none'
    } else {
      alert('Please install nostr extension (alby or nos2x) to log in.')
    }
  }

  async function checkForExtension() {
    // Check if window.nostr exists and has a getPublicKey method
    if (window.nostr && typeof window.nostr.getPublicKey === 'function') {
      try {
        const publicKey = await window.nostr.getPublicKey()
        if (publicKey) {
          // Extension is installed and a public key is returned
          return true
        }
      } catch (error) {
        console.error('Error while checking for extension:', error)
      }
    }
    // Extension is not installed or an error occurred
    return false
  }
})()
