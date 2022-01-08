export default handleMutation

function handleMutation (id, cb) {
  // Select the node that will be observed for mutations
  const targetNode = document.getElementById(id)

  // Options for the observer (which mutations to observe)
  const config = {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true
  }

  // Callback function to execute when mutations are observed
  const callback = function (mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    for (let mutation of mutationsList) {
      console.log('mutation', mutation)
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        cb()
      }
    }
  }

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback)

  // Start observing the target node for configured mutations
  observer.observe(targetNode, config)
}
