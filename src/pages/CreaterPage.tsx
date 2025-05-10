  return (
    <>
      {!connected ? (
        <div className="unconnected-container">
          <div id="Connection-message-wrapper">
            <p>Welcome to the Creator portal! </p>
            <span id="Connection-message">Connect your wallet to start minting your CPOP Tokens! 🤘 </span>
          </div>
        </div>
      ) : (
        <>
          <div className="titleBody">
            {/* ... existing title body code ... */}
          </div>
          <div className="creator-container">
            {/* ... existing container content ... */}
          </div>
        </>
      )}

      {/* Move Modal outside of all containers and add portal wrapper */}
      <div className="modal-portal">
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Minted successfully!"
        >
          <p>Your modal content goes here</p>
        </Modal>
      </div>
    </>
  ); 