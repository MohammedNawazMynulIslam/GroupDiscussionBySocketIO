const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server =  http.createServer(app)

const io = new Server(server,{
    cors:{
        origin:"*",
        methods:["GET","POST"]
},
}
)


io.on("connection",(socket)=>{
    console.log(`User Connected: ${socket.id}`)

    socket.on("join_room",(room)=>{
        socket.join(room)
        console.log(`User with ID: ${socket.id} joined ${room}`)
    })

    socket.on("send_message",(data)=>{
        socket.to(data.room).emit("receive_message",data)
    })

    socket.on("typing",({username, room})=>{
        socket.to(room).emit("user_is_typing", { username })
    })

    socket.on("disconnect",()=>{
        console.log("User Disconnected", socket.id)
    })   
    
})


server.listen(3001,()=>{
    console.log("server is running on port 3001")
})