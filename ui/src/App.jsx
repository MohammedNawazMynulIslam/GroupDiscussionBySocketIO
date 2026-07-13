import { useState } from "react";
import Chatroom from "./components/Chatroom";





function App() {
  const [userName, setUserName] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);

  const joinRoom = () => {

    if(userName && room){
      setJoined(true);
    }
  }
  return (
    <div className="">
      {!joined ? (
        <div>
          <h2> Join Chat Room</h2>
          <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          />
          <input
          type="text"
          placeholder="Enter your room id"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ):(<Chatroom username={userName} room={room}/>)}
    </div>
  );
}

export default App;
 