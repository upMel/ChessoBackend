const path = require('path')
const User = require('./models/userModel')
const { instrument } = require("@socket.io/admin-ui");
const express = require('express')
const dotenv = require('dotenv')
const colors = require('colors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
// const fileupload = require('express-fileupload')
// const mongoSanitize = require('express-mongo-sanitize')
// const helmet = require('helmet')
// const xss = require('xss-clean')
// const rateLimit = require('express-rate-limit')
// const hpp = require('hpp')
const cors = require('cors')
const { addUser,makeid, removeUser,circlePlayers,getUserInTounament, getUser,changePlayerStatus,getColor,getActiveTournaments,getInfoTournament,getPlayersInTournament, addPlayerTournament, game,createTournament, getUsersInRoom } = require("./Users");
const { Server } = require("socket.io");
const errorHandler = require('./middleware/error')

const DBConnection = require('./config/db')

dotenv.config({ path: '.env' })//path it is .env and not ../.env because if you look at package.json
// dotenv.config()
DBConnection()

const uploadRoutes = require('./routes/uploadRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const { createServer } = require('http')

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: ['https://admin.socket.io', 'http://localhost:3000'],
        credentials: true,            //access-control-allow-credentials:true
        optionSuccessStatus: 200,
    }
})
instrument(io, {
    auth: false
});


// app.use(function(req, res, next) {
//     res.header('Access-Control-Allow-Credentials', true)
//     res.header('Access-Control-Allow-Origin', req.headers.origin)
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS')
//     res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept')
//     next()
//   })
app.use(express.json())

app.use(express.urlencoded({ extended: false }))

app.use(cookieParser())

// app.use(multer({dest:__dirname+'./routes/authRoutes/'}).single('file'))

if (process.env.NODE_ENV = 'development') {
    app.use(morgan('dev'))
}
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,            //access-control-allow-credentials:true
    optionSuccessStatus: 200,

}))
// app.use(cors())
// app.use("./public/images", express.static(path.join(__dirname, "/public/images")));
// app.use("/images", express.static(path.join(__dirname, "/images")));
app.use('/public', express.static(__dirname + '/public'))

//extra apps
// // File uploading
// app.use(fileupload())

// // Sanitize data
// app.use(mongoSanitize())

// // Set security headers
// app.use(helmet())

// // Prevent XSS attacks
// app.use(xss())

// // Enable CORS
// app.use(cors())

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 mins
//   max: 100 // 100 request per 10 mins
// })

// app.use(limiter)

// // Prevent http param pollution
// app.use(hpp())

//This is for uploading some files to public folder
// app.use(express.static(path.join(__dirname, 'public')))

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, __dirname+'/public')
//     },
//     filename: (req, file, cb) => {
//       cb(null,'giwrgos.png' );
//       console.log('req.body.name')
//     },
//   });

// const upload = multer({storage : storage});

// app.post("/api/upload",upload.single("file"),(req,res)=>{
//     res.status(200).json("file uploaded")
// })


const versionOne = routeName => `/api/${routeName}`

app.use(versionOne('upload'), uploadRoutes)
app.use(versionOne('auth'), authRoutes)
app.use(versionOne('users'), userRoutes)

app.get('/',(req,res)=>{
    res.send('Welcome to chesso API')
})

io.on("connection", (socket) => {
    let players = [];
    socket.on('waiting', async (player) => {
        let { email } = player
        const user = await User.findOne({ email })
        if (!user.inQueue) {
            user.inQueue = true
            await user.save()
            socket.join('waitingRoom')
        }
        const waitingPlayers = io.sockets.adapter.rooms.get('waitingRoom')
        console.log(waitingPlayers)
        io.to('waitingRoom').emit('waitingRoomData', { waiting: [...waitingPlayers] })
        players = await User.find({ inQueue: 'true' })
        if (players.length >= 2) {
            for (let i = 0; i <= players.length - 1; i++) {
                for (let j = i + 1; j <= players.length - 1; j++)
                    if (Math.abs(players[i].elo - players[j].elo) <= 200) {
                        io.to('waitingRoom').emit('matchFound', {
                            player1: players[i],
                            player2: players[j],
                            code: Date.now()
                        })
                    }
            }

        }

    })

    socket.on('waitingDisconnection', async (player) => {
        if (player !== undefined) {
            let email = player.email
            const user = await User.findOne({ email })
            user.inQueue = false
            await user.save()
        }

        socket.leave('waitingRoom')
        const waitingClients = io.sockets.adapter.rooms.get('waitingRoom')
        if (waitingClients) {
            io.to('waitingRoom').emit('waitingRoomData', { waiting: [...waitingClients] })
            socket.emit('waitingRoomData', { waiting: [...waitingClients] })
        }
        else {
            io.to('waitingRoom').emit('waitingRoomData', { waiting: [] })
            socket.emit('waitingRoomData', { waiting: [] })
        }
    })


    //axreiasto giati kalei esti kai alliws sto frontend to cleanup pou kanei fire to waitingdisconnection

    // socket.on('disconnect', (id) =>{
    //     console.log(io.sockets.adapter,'HEHHEHEHEH')
    //     socket.leave('waitingRoom')
    //     console.log(io.sockets.adapter.rooms,'HEHHEHEHEH2222222222')

    // })

    // socket.on('forceDisconnect', function () {
    //     console.log(socket.rooms);
    //     socket.disconnect(true);
    //     console.log(socket.rooms);
    // });
    socket.on('getTournaments',()=>{
        socket.emit('allActiveTournaments',getActiveTournaments())
    })

    socket.on('createTournament',(noPlayers,clockTime,privacy,creator,room)=>{
        // console.log(noPlayers,clockTime,privacy,creator,room)

        const { password}= createTournament({
            noPlayers: noPlayers,
            time : clockTime,
            privacy : privacy,
            creator: creator,
            room : room
        })
        io.emit('allActiveTournaments',getActiveTournaments())

    })
    socket.on('joinedTournament',(player,room)=>{
        const { password,time,noPlayers,creator,gamers,alreadyExists }= addPlayerTournament({
            room:room,
            player: player
        })

        // console.log(password)
        socket.join(room)
        if(!alreadyExists){
            
            io.to(room).emit('info',password,time,noPlayers,creator,gamers)
            io.emit('allActiveTournaments',getActiveTournaments())
            return ;
        }
        // console.log(getInfoTournament(room))
        io.to(room).emit('refreshPlayers',getInfoTournament(room))
        io.emit('allActiveTournaments',getActiveTournaments())
    })

    socket.on('statusChange',(status,room,id)=>{
        io.to(room).emit('statusChanged',changePlayerStatus(status,room,id))
    })

    socket.on('startRound',(players,round,room)=>{
        console.log(players.length,round)
        console.log(socket.id)
        console.log(round)
        if(round<= players.length-1){

            for(i=0; i<players.length/2; i++){
                io.to(room).emit('roundStart',{
                    player1: players[i],
                    player2: players[players.length -1-i],
                    code: makeid(4),
                    room:room
                })
            }
            circlePlayers(room)                
        }
  
   
    // const {time,password}=getInfoTournament(room)
    // socket.emit('Roundinfo',time,password,room)
})

    socket.on('getInfo',(room)=>{
        console.log(room)
        const {time,password} = getInfoTournament(room)
        socket.emit('Roundinfo',time,password)
    })

    socket.on('roundOver', async (color, room, outcome,tournamentroom,concede)=>{
        console.log(color, room, outcome,concede,tournamentroom)
        const users= getUsersInRoom(room)
        // console.log(users)
        if(users[0].color === color ){
            if(outcome === 1){
                let id = users[0].id
                getUserInTounament(id,outcome,tournamentroom)
                
            }else{
                let id = users[0].id
                getUserInTounament(id,outcome,tournamentroom)
            }
        }else{
            if(outcome === 1){
                let id = users[1].id
                getUserInTounament(id,outcome,tournamentroom)
            }else{
                let id = users[1].id
                getUserInTounament(id,outcome,tournamentroom)
            }
        }
        if(concede){
            socket.broadcast.to(room).emit('opponentConcede',color)
        }
    })

    socket.on('joinedGame', (player, room, callback) => {
        
        let color
       
        const { error, newPlayer, opponent } = addUser({
            id: player.id,
            name: player.username,
            elo: player.elo,
            room: room.room,
        })
        
        if (error) {
            return callback({ error: error })
        }
        
        socket.join(room.room)
        
        io.to(room.room).emit('roomData', { users: getUsersInRoom(room.room)})
        socket.broadcast.to(room.room).emit('opponentJoined',(room.room))
        const color1 = getColor(player.id,room.room)
        
        socket.emit('color',color1)
        
    })
    socket.on('loadfen',(fen,pgn)=>{
      
        socket.broadcast.emit('fen',fen,pgn)
    })
    socket.on('move',(from , to , room)=>{
        console.log('eeee',room)
        socket.broadcast.to(room).emit('opponentMove', (from) ,(to))
    })

    socket.on('gameOver', async (color, room, outcome,concede)=>{
        console.log(color, room, outcome,concede)
        const users= getUsersInRoom(room)
        // console.log(users)
        if(users[0].color === color ){
            if(outcome === 1){
                let id = users[0].id
                const user = await User.findById(id)
                // console.log(user)
                let Ea = (1/(1+10**((users[1].elo-users[0].elo)/400)))
                console.log(Ea)
                let Ra= user.elo +32*(outcome - Ea)
                console.log(Ra)
                user.elo = Math.round(Ra)
                console.log(user.elo)
                await user.save()
                socket.emit('elo',user.elo)
            }else{
                let id = users[0].id
                const user = await User.findById(id)
                let Ea = (1/(1+10**((users[1].elo-users[0].elo)/400)))
                let Ra= user.elo +32*(outcome - Ea)
                user.elo = Math.round(Ra)
                await user.save()
                socket.emit('elo',user.elo)
            }
        }else{
            if(outcome === 1){
                let id = users[1].id
                const user = await User.findById(id)
                console.log(user)
                let Ea = (1/(1+10**((users[0].elo-users[1].elo)/400)))
                let Ra= user.elo +32*(outcome - Ea)
                user.elo = Math.round(Ra)
                await user.save()
                socket.emit('elo',user.elo)
            }else{
                let id = users[1].id
                const user = await User.findById(id)
                let Ea = (1/(1+10**((users[0].elo-users[1].elo)/400)))
                console.log(Ea)
                let Ra= user.elo +32*(outcome - Ea)
                console.log(Ra)
                user.elo = Math.round(Ra)
                console.log(user.elo)
                await user.save()
                socket.emit('elo',user.elo)
            }
        }
        if(concede){
            socket.broadcast.to(room).emit('opponentConcede',color)
        }
    })
   
    socket.on('playerDisconnected', (playerID) => {
        const user = removeUser(playerID);
    })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = httpServer.listen(PORT, () => {
    console.log(
        `We are live on ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
    )
})

//Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error : ${err.stack, err.message}`.red)
    //close server and exit process
    server.close(() => process.exit(1))
})