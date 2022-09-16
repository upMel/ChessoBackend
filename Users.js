const users = [];
const games = {};
const tournaments = {};


function makeid(length) {
    var result           = '';
    //var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

class Player {
    constructor(name, elo, color, id, room) {
        this.name = name;
        this.color = color;
        this.elo = elo;
        this.id = id;
        this.room = room;
    }
}

class Tournament {
    constructor(creator,time,noPlayers,privacy,room){
        this.creator = creator;
        this.time = time;
        this.noPlayers = noPlayers;
        this.privacy = privacy;
        this.room = room;
        this.players = [];
    }
}

const addUser = ({ id, name, elo, room }) => {
    // console.log(games)
    if (!games[room]) {
        const color = Math.random() <= 0.5 ? 'white' : 'black';
        const newPlayer = new Player(name, elo, color, id, room)
        games[room] = [newPlayer];
        return {
            opponent: null,
            newPlayer
        }
    }
    if (games[room].length >= 2) {
            if (games[room][0].id === id || games[room][1].id === id) {
                return {error: null};
            }
            return { error: 'This game room is full' }


    }
    if(games[room][0].id === id ){
        return {error: null};
    }
    const opponent = games[room][0];
    const color = opponent.color === 'white' ? 'black' : 'white';
    const newPlayer = new Player(name, elo, color, id, room)
    games[room].push(newPlayer);
    // console.log(games)
    return {
        opponent,
        newPlayer,
    }
   
}

const removeUser = (id) => {
    for (const game in games) {
		let players = games[game];
		const index = players.findIndex((pl) => pl.id === id);
		

		if (index !== -1) {
			return players.splice(index, 1)[0];
		}
	}
}
const game = (id) => games[id];

const getColor = (id,room)=>{
    if(games[room]){
        let players = games[room];
	    const index = players.findIndex((pl) => pl.id === id);
        return players[index].color;
}
}

const getUser = (id) => {
    return users.find(user => user.id === id)
}

const getUsersInRoom = (room) => {
    // console.log(games[room])
    return games[room]
}

const createTournament = ({noPlayers,time,privacy,creator,room})=>{
    let password
    // console.log(room)
    if(privacy){
        password = makeid(5)
        // console.log(password)
    }else{
        password = false
    }
    const newTournament = new Tournament(creator, time, noPlayers, password,room)
    tournaments[room]=[newTournament]
    // console.log(tournaments)
    // tournaments[room][0].players.push(creator)
    // console.log(tournaments[room][0])
    return {password};
}

const addPlayerTournament = ({room,player})=>{
    // console.log(tournaments)
    if(!tournaments[room]){
        return {password:null,gamers:[]};
    }
    if(tournaments[room][0].players.some(pl=> pl.id === player.id )){
        console.log('uparxw hdh')
       return {alreadyExists:true}
    }
    if(tournaments[room][0].players.length>tournaments[room][0].noPlayers){
        console.log('to tournoua gemise')

        return {tournamentIsFull : 'Tournament is full'}
    }
    // console.log(tournaments[room][0].players.length)
    tournaments[room][0].players.push(player)
    let password = tournaments[room][0].privacy
    let noPlayers = tournaments[room][0].noPlayers
    let time = tournaments[room][0].time
    let creator = tournaments[room][0].creator.username
    let gamers = tournaments[room][0].players
    
    return {password,time,creator,noPlayers,gamers};
}


const getPlayersInTournament = (room)=>{
    return tournaments[room][0].players
}

const getActiveTournaments = ()=>{
    let tour=[]
    for(const tournament in tournaments){
        tour.push(tournaments[tournament][0])
        
    }
    return tour ;
    // return tournaments;
}
const changePlayerStatus =(status,room,id)=>{
    // console.log(status)
    if(!status){
        status = 'Ready'
    }else if(status){
        status = 'Pending'
    }
    if(!tournaments[room]){
        return {status:null,gamers:[]};
    }
    let index =tournaments[room][0].players.findIndex(pl=> pl.id === id )
    
    tournaments[room][0].players[index].status=status
    // console.log(tournaments[room][0].players)
    let gamers = tournaments[room][0].players
    return {gamers , status}
}

const getInfoTournament = (room)=>{
    if(!tournaments[room]){
        return {};
    }
    let password = tournaments[room][0].privacy
    let noPlayers = tournaments[room][0].noPlayers
    let time = tournaments[room][0].time
    let creator = tournaments[room][0].creator.username
    let gamers = tournaments[room][0].players
    // console.log(noPlayers)
    return {password,time,creator,noPlayers,gamers};
}

const getUserInTounament = (id,outcome,room)=>{
    // let tour=[]
    // for(const tournament in tournaments){
    //     // let room = tournaments[tournament].findIndex(tour => tour.players[].id === id)
        
    // }
    // return tour ;
    let index =tournaments[room][0].players.findIndex(pl=> pl.id === id )
    // if(outcome = 0.5){
    //     if(tournaments[room][0].players[index].hasOwnProperty('wins')){

    //     }

    // }
    if(tournaments[room][0].players[index].hasOwnProperty('wins')){
        if(outcome === 0.5){
            tournaments[room][0].players[index].wins += 0
            tournaments[room][0].players[index].totalPoints += outcome
        }else{

            tournaments[room][0].players[index].wins += outcome
            tournaments[room][0].players[index].totalPoints += outcome
        }

    }else{
        if(outcome === 0.5){
            tournaments[room][0].players[index].wins = 0
            tournaments[room][0].players[index].totalPoints = outcome
        }else{

            tournaments[room][0].players[index].wins = outcome
            tournaments[room][0].players[index].totalPoints = outcome
        }
    }
}

const circlePlayers = (room)=>{
    console.log(tournaments[room][0].players)
    let players =tournaments[room][0].players
    tournaments[room][0].players.splice(1,0,players[players.length-1])
    tournaments[room][0].players.pop()
    console.log(tournaments[room][0].players)
}
//sto jointournament prepei na valw tournaments[room].players.push(newPlayer)
module.exports = { addUser,circlePlayers,makeid,getUserInTounament, changePlayerStatus,removeUser,getInfoTournament,getActiveTournaments,getPlayersInTournament, getUser, addPlayerTournament, getColor, getUsersInRoom ,createTournament};

