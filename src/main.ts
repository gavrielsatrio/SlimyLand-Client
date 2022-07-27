import './style.css';
import { WebSocketMessage } from './WebSocketMessage';

const gameMap: HTMLElement = document.querySelector("#gameMap")!;
const btnJoin: HTMLElement = document.querySelector("#btnJoin")!;
const popUpBackground: HTMLElement = document.querySelector("#popUpBackground")!;
const popUpDialogNickname: HTMLElement = document.querySelector("#popUpDialogNickname")!;
const formNickname: HTMLElement = document.querySelector("#formNickname")!;
const txtNickname: HTMLInputElement = document.querySelector("#txtNickname")!;

let chatContainer: HTMLElement | null;
let txtChat: HTMLInputElement | null;

const color: Array<string> = ["Blue", "Green", "Grey", "Orange", "Red", "Yellow", "Brown"];

let yourPlayer: HTMLElement | null;
let playerJoined: boolean = false;
let yourPlayerID: number = -1;
let yourPlayerFace: string = "left";
let chatToggle: string = "off";


const url: string = "ws://localhost:950";
const webSocketConnection = new WebSocket(url);

webSocketConnection.addEventListener("open", () =>
{
    console.log("You are now connected");
});

webSocketConnection.addEventListener("close", () =>
{
    resetSlimyLand();

    console.log("You are disconnected");
});

webSocketConnection.addEventListener("error", () =>
{
    alert("You are not connected to the server !");
    console.log("Error");
});

webSocketConnection.addEventListener("message", (e) =>
{
    const jsonObject: WebSocketMessage = JSON.parse(e.data);

    if(jsonObject.type == "loadMap")
    {
        if(jsonObject.value.playerID != yourPlayerID)
        {
            loadPlayer(jsonObject);
        }
    }
    else if(jsonObject.type == "newPlayerRegisterInformation")
    {
        // Triggered when you newly joined to the land
        // Load your own player

        loadPlayer(jsonObject);

        // Load the chat container and the chat input text box
        gameMap.innerHTML += `
        <div class="p-3 w-100 align-self-end bg-white position-absolute slideDown" id="chatContainer">
            <input type="text" class="form-control" id="txtChat">
        </div>`;


        // Load your player element to the variable
        if(yourPlayerID == -1 && playerJoined == true)
        {
            yourPlayerID = jsonObject.value.playerID!;
            yourPlayer = document.querySelector(`#player${yourPlayerID}`);
            txtChat = document.querySelector("#txtChat");
            chatContainer = document.querySelector("#chatContainer");
        }



        // Announce to all player that you have joined
        webSocketConnection.send(JSON.stringify(
            {
                type : "newPlayerJoined",
                value : 
                {
                    playerID : jsonObject.value.playerID!
                }
            }
        ));
    }
    else if(jsonObject.type == "newPlayerJoined")
    {
        // Triggered when another player joined to the land

        // Load another player that has just joined
        if(jsonObject.value.playerID != yourPlayerID)
        {
            loadPlayer(jsonObject);
        }
    }
    else if(jsonObject.type == "playerPosition")
    {
        // Triggered when another player makes any movement

        if(jsonObject.value.playerID != yourPlayerID)
        {
            const anotherPlayer: HTMLElement = document.querySelector(`#player${jsonObject.value.playerID}`)!;
            anotherPlayer.style.top = `${jsonObject.value.y}px`;
            anotherPlayer.style.left = `${jsonObject.value.x}px`;

            changePlayerFaceTo(anotherPlayer, jsonObject.value.playerFace!);

            const anotherPlayerNickname: HTMLElement = document.querySelector(`#playerNickname${jsonObject.value.playerID}`)!;
            anotherPlayerNickname.style.top = `${jsonObject.value.y!}px`;
            anotherPlayerNickname.style.left = `${jsonObject.value.x! + 16}px`;
        }
    }
    else if(jsonObject.type == "playerRemoved")
    {
        // Triggered when another player is left

        const playerRemoved: HTMLElement = document.querySelector(`#player${jsonObject.value.playerID}`)!;
        playerRemoved.remove();
    }
    else if(jsonObject.type == "clearMap")
    {
        gameMap.innerHTML = "";
        yourPlayer = null;
        chatContainer = null;
        txtChat = null;
    }
    else if(jsonObject.type == "mapUpdates")
    {
        loadPlayer(jsonObject);

        gameMap.innerHTML += `
        <div class="p-3 w-100 align-self-end bg-white position-absolute slideDown" id="chatContainer">
            <input type="text" class="form-control" id="txtChat">
        </div>`;

        yourPlayer = document.querySelector(`#player${yourPlayerID}`);
        chatContainer = document.querySelector("#chatContainer");
        txtChat = document.querySelector("#txtChat");
    }
    else if(jsonObject.type == "playerChat")
    {
        // Triggered when another player chat

        if(jsonObject.value.playerID != yourPlayerID)
        {
            addBubbleChat(jsonObject.value.playerFace!, jsonObject.value.chatText!, jsonObject.value.x!, jsonObject.value.y!);
        }
    }
});


const loadPlayer = (jsonObject: WebSocketMessage) =>
{
    const player = document.createElement("img");
    player.id = "player" + jsonObject.value.playerID!;
    player.src = `/src/Assets/Slime_${color[(jsonObject.value.playerID! - 1) % 7]}.png`;
    player.classList.add("players");
    player.style.top = `${jsonObject.value.y!}px`;
    player.style.left = `${jsonObject.value.x!}px`;

    const playerNickname = document.createElement("span");
    playerNickname.id = "playerNickname" + jsonObject.value.playerID!;
    playerNickname.classList.add("playersNickname");
    playerNickname.innerHTML = jsonObject.value.playerNickname!;
    playerNickname.style.top = `${jsonObject.value.y!}px`;
    playerNickname.style.left = `${jsonObject.value.x! + 16}px`;

    changePlayerFaceTo(player, jsonObject.value.playerFace!);

    gameMap.appendChild(playerNickname);
    gameMap.appendChild(player);
};

const resetSlimyLand = () =>
{
    gameMap.innerHTML = "";
    yourPlayerID = -1;
    playerJoined = false;
    yourPlayerFace = "left";
    yourPlayer = null;

    txtChat = null;
    chatContainer = null;

    window.removeEventListener("keydown", gameMapOnKey);
    window.removeEventListener("keyup", gameMapOnKey);

    btnJoin.classList.remove("btn-danger");
    btnJoin.classList.add("btn-primary");
    btnJoin.innerHTML = "Join";
};

const moveYourPlayer = (newX: number, newY: number) =>
{
    yourPlayer!.style.left = `${newX}px`;
    yourPlayer!.style.top = `${newY}px`;

    const yourPlayerNickname: HTMLElement = document.querySelector("#playerNickname" + yourPlayerID)!;
    yourPlayerNickname.style.left = `${newX + 16}px`;
    yourPlayerNickname.style.top = `${newY}px`;

    webSocketConnection.send(JSON.stringify(
        {
            type : "playerPosition",
            value :
            {
                playerID : yourPlayerID,
                playerFace : yourPlayerFace,
                x : newX,
                y : newY
            }
        }
    ));
};

const changePlayerFaceTo = (element: HTMLElement, face: string) =>
{
    if(face == "right")
    {
        element.style.transform = "scaleX(-1)";
    }
    else if(face == "left")
    {
        element.style.transform = "scaleX(1)";
    }

    if(element == yourPlayer)
    {
        yourPlayerFace = face;
    }
};

const addBubbleChat = (face: string, chatText: string, x: number, y: number) =>
{
    const bubbleChat = document.createElement("span");
    bubbleChat.classList.add("bubbleChat");
    bubbleChat.classList.add("border");
    bubbleChat.classList.add("d-inline-block");
    bubbleChat.classList.add("position-absolute");
    bubbleChat.classList.add("bg-white");
    bubbleChat.innerHTML = chatText;

    gameMap.appendChild(bubbleChat);

    bubbleChat.style.top = `${y}px`;
    if(face == "left")
    {
        bubbleChat.style.textAlign = "right";
        bubbleChat.style.left = `${x - bubbleChat.clientWidth - 12}px`;
    }
    else
    {
        bubbleChat.style.textAlign = "left";
        bubbleChat.style.left = `${x + 42}px`;
    }

    setTimeout(() =>
    {
        bubbleChat.remove();
    }, 1500);
};

const gameMapKeyObject: { [key: string]: boolean } = { "default" : false };

const gameMapOnKey = (e: KeyboardEvent) =>
{
    e.preventDefault();

    gameMapKeyObject[e.key] = e.type == "keydown";

    
    // In this case, your player already been added to the game map.
    // The chat container and the chat text box is already added too
    // So you can re-declare it with not null state
    yourPlayer = yourPlayer!;
    chatContainer = chatContainer!;
    txtChat = txtChat!;

    const currentX = Number(yourPlayer.style.left.split("p")[0]);
    const currentY = Number(yourPlayer.style.top.split("p")[0]);
    const playerSpeed = 5;

    let newX = currentX;
    let newY = currentY;

    // Check if the player is in the chat state or not
    // Players should can't move while doing chat
    if(chatToggle == "off")
    {
        if(gameMapKeyObject["w"] == true && gameMapKeyObject["a"] == true || (gameMapKeyObject["ArrowUp"] == true && gameMapKeyObject["ArrowLeft"] == true))
        {
            // Move left and up
            newY -= playerSpeed;
            newX -= playerSpeed;

            changePlayerFaceTo(yourPlayer, "left");
        }
        else if(gameMapKeyObject["w"] == true && gameMapKeyObject["d"] == true || (gameMapKeyObject["ArrowUp"] == true && gameMapKeyObject["ArrowRight"] == true))
        {
            // Move right and up
            newY -= playerSpeed;
            newX += playerSpeed;

            changePlayerFaceTo(yourPlayer, "right");
        }
        else if(gameMapKeyObject["s"] == true && gameMapKeyObject["a"] == true || (gameMapKeyObject["ArrowDown"] == true && gameMapKeyObject["ArrowLeft"] == true))
        {
            // Move left and down
            newY += playerSpeed;
            newX -= playerSpeed;

            changePlayerFaceTo(yourPlayer, "left");
        }
        else if(gameMapKeyObject["s"] == true && gameMapKeyObject["d"] == true || (gameMapKeyObject["ArrowDown"] == true && gameMapKeyObject["ArrowRight"] == true))
        {
            // Move right and down
            newY += playerSpeed;
            newX += playerSpeed;

            changePlayerFaceTo(yourPlayer, "right");
        }
        else if(gameMapKeyObject["w"] == true || gameMapKeyObject["ArrowUp"] == true)
        {
            // Move up
            newY -= playerSpeed;
        }
        else if(gameMapKeyObject["a"] == true || gameMapKeyObject["ArrowLeft"] == true)
        {
            // Move left
            newX -= playerSpeed;

            changePlayerFaceTo(yourPlayer, "left");
        }
        else if(gameMapKeyObject["s"] == true || gameMapKeyObject["ArrowDown"] == true)
        {
            // Move down
            newY += playerSpeed;
        }
        else if(gameMapKeyObject["d"] == true || gameMapKeyObject["ArrowRight"] == true)
        {
            // Move right
            newX += playerSpeed;

            changePlayerFaceTo(yourPlayer, "right");
        }
        else if(gameMapKeyObject["t"] == true)
        {
            // Player enters chat mode

            chatContainer.classList.remove("slideDown");
            txtChat.focus();

            chatToggle = "on";
            txtChat.value = "";
        }
    }
    else
    {
        // Check if the keys are down or up
        if(gameMapKeyObject[e.key] == true)
        {
            // Only allows the text based keyCode to be valid entered to the chat text box
            // e.g. alphabet, number, symbol, etc
            if(e.keyCode == 32 || (e.keyCode >= 48 && e.keyCode <= 90) || (e.keyCode >= 96 && e.keyCode <= 111) || (e.keyCode >= 186 && e.keyCode <= 222))
            {
                // Check if the "T" key is pressed
                if(gameMapKeyObject["t"] == true)
                {
                    // If the chat text box is empty
                    // Close the chat text box and leave the chat mode
                    if(txtChat.value.trim() == "")
                    {
                        chatContainer.classList.add("slideDown");
                        gameMap.focus();

                        chatToggle = "off";
                        txtChat.value = "";

                        return;
                    }
                }

                txtChat.value += e.key;
            }
            else if(e.key == "Enter")
            {
                // Triggered when the player send the chat by pressing the "Enter" key
                addBubbleChat(yourPlayerFace, txtChat.value, currentX, currentY);

                webSocketConnection.send(JSON.stringify(
                    {
                        type : "playerChat",
                        value : 
                        {
                            playerID : yourPlayerID,
                            playerFace : yourPlayerFace,
                            chatText : txtChat.value,
                            x : currentX,
                            y : currentY
                        }
                    }
                ));

                chatContainer.classList.add("slideDown");
                gameMap.focus();

                chatToggle = "off";
                txtChat.value = "";

                return;
            }
            else if(e.keyCode == 8)
            {
                txtChat.value = txtChat.value.substring(0, txtChat.value.length - 1);
            }
        }
    }

    moveYourPlayer(newX, newY);
}


btnJoin.addEventListener("click", () =>
{
    if(btnJoin.innerHTML == "Join")
    {
        popUpBackground.classList.remove("d-none");
        popUpDialogNickname.classList.remove("d-none");

        txtNickname.focus();

        setTimeout(() => 
        {
            popUpBackground.classList.add("opacity-50");
            popUpDialogNickname.classList.add("show");
        }, 0);
    }
    else
    {
        webSocketConnection.send(JSON.stringify(
            {
                type : "playerRemoved",
                value :
                {
                    playerID : yourPlayerID
                }
            }
        ));

        resetSlimyLand();
    }
});


formNickname.addEventListener("submit", (e) =>
{
    e.preventDefault();

    if(txtNickname.value.trim() == "")
    {
        alert("Please fill in your nickname ...");
        return;
    }

    popUpBackground.classList.remove("opacity-50");
    popUpDialogNickname.classList.remove("show");

    setTimeout(() => 
    {
        popUpBackground.classList.add("d-none");
        popUpDialogNickname.classList.add("d-none");
    }, 400);

    playerJoined = true;

    webSocketConnection.send(JSON.stringify(
        {
            type : "newPlayerRegister",
            value :
            {
                playerNickname : txtNickname.value.trim()
            }
        }
    ));

    window.focus();
    window.addEventListener("keydown", gameMapOnKey);
    window.addEventListener("keyup", gameMapOnKey);

    btnJoin.classList.remove("btn-primary");
    btnJoin.classList.add("btn-danger");
    btnJoin.innerHTML = "Leave";
});