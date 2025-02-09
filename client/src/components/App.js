import React, { useState } from 'react';
import Login from './Login';

function App() {
  const [username, setUsername] = useState()

  return (
    <>
      {username}
      <Login onUsernameSubmit={setUsername} />
    </>
  )
}

export default App;
