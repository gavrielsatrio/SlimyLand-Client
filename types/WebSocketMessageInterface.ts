export interface WebSocketMessageInterface {
    type: string,
    value: {
        playerID? : number,
        playerFace? : string,
        playerNickname? : string,
        chatText? : string,
        x? : number,
        y? : number
    }
}