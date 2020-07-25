import React from "react";

const Index = (props) => {
  return (
    <div>
      <input type="text" id="username" size={22} />

      <input type="text" value="room1" id="channel" size={22} />
      <input type="checkbox" checked id="shareVideo" />

      <input type="checkbox" checked id="shareAudio" />
      <div>
        <video muted controls autoplay max-width={200}></video>
        <video muted controls autoplay max-width={200}></video>
        <video controls></video>
      </div>
      <button> Join Roomt</button>
    </div>
  );
};

export default Index;

/*

<header>
      <input type='text' id='username' size=22></input>

      <input type='text' value='room1' id='channel' size=22></input>
      <input type='checkbox' checked id='shareVideo'>Share Video</input>
      <input type='checkbox' checked id='shareAudio'>Share Audio</input>
    </header>
    <main> 
      <div>
            <input type='text' id='username' size=22></input>

      <input type='text' value='room1' id='channel' size=22></input>
      <input type='checkbox' checked id='shareVideo'>Share Video</input>
      <input type='checkbox' checked id='shareAudio'>Share Audio</input>
        <video muted controls autoplay max-width=200></video>        
        <video muted controls autoplay  max-width=200></video>
<br>
        <video controls></video>
      </div>


      <div id='peerView'>as</div>
        <div><button> Join Roomt</button></div>
    </main>


    const joinServer = function(udid, previewVideo){
      return new Promise((resolve,reject)=>{
        log("joining as "+udid);
        const signal = new WebSocket("wss://localhost:443/signal?udid="+udid);
        signal.onmessage=({data})=> {
          try{
            data = JSON.parse(data);
          }catch(e){
            data = data;
          }
          if(data.udid) {
            localStorage.setItem("udid", data.udid);
          }
          log(data);
          peer = new Peer(data.udid, signal,log,previewVideo,theirVideo);
          peer.joinChannel(channelInput.value);
          resolve();
        }
      })
    }
  
    btnOpenRoom.onclick = async () =>{
        try{
          await joinServer(userNameInput.value, myVideo);
          await joinServer(userNameInput.value+"mirror",myVideo2);

         

        
        }catch(e){
          logError(e.message);
        }
    }
    setInterval(()=>{
      if(peer){
        peer.renderPeerView(peerView);
      }
    },1000)

    const toSignal = (json)=> signal.send(JSON.stringify(json));
    */
