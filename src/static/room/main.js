import React, {Component} from "react";
import ReactDOM from "react-dom";
import Header from "./header";

class Main extends Component {
    constructor(props) {
        super(props);
        const roomId = location.hash.substring(1);
        this.state = {
            roomId,
            localStream: false,
            remoteStream: false
        };
        
        this.drone = new ScaleDrone("pc4Iz2ZtevnIoWfg");
        this.roomName = "observable-" + roomId;
        this.configuration = {
            iceServers: [{
                urls: "stun:stun.l.google.com:19302"
            }]
        };
        this.room = null;
        this.pc = null;
    }

    componentDidMount() {
        this.drone.on("open", error => {
            if(error) {
                return console.error(error);
            }
            this.room = this.drone.subscribe(this.roomName);
            this.room.on("open", error => {
                if(error) {
                    console.error(error);                           
                }
            });
            // We"re connected to the room and received an array of "members"
            // connected to the room (including us). Signaling server is ready.
            this.room.on("members", members => {
                console.log("MEMBERS", members);
                // If we are the second user to connect to the room we will be creating the offer
                const isOfferer = members.length === 2;
                this.startWebRTC(isOfferer);
            });
        });
    }

    sendMessage = message => {
        this.drone.publish({room: this.roomName, message});
    }

    startWebRTC = isOfferer => {
        this.pc = new RTCPeerConnection(this.configuration);
    
        // "onicecandidate" notifies us whenever an ICE agent needs to deliver a
        // message to the other peer through the signaling server
        this.pc.onicecandidate = event => {
            if(event.candidate) {
                this.sendMessage({"candidate": event.candidate});
            }
        };
    
        // If user is offerer let the "negotiationneeded" event create the offer
        if(isOfferer) {
            this.pc.onnegotiationneeded = () => {
                this.pc.createOffer().then(this.localDescCreated.bind(this)).catch(error => console.error(error));
            }
        }
    
        // When a remote stream arrives display it in the remote video element
        this.pc.ontrack = event => {
            const stream = event.streams[0];
            const remote = ReactDOM.findDOMNode(this.refs.remote);
            if(!remote.srcObject || remote.srcObject.id !== stream.id) {
                console.log("Set Remote Stream");
                this.setState({remoteStream: true});
                remote.srcObject = stream;
            }
        };

        navigator.mediaDevices.getUserMedia({audio: true, video: true})
            .then(stream => {
                console.log("Set Local Stream");
                this.setState({localStream: true});
                // Display your local video in local video element
                const local = ReactDOM.findDOMNode(this.refs.local);
                local.srcObject = stream;
                // Add your stream to be sent to the conneting peer
                stream.getTracks().forEach(track => this.pc.addTrack(track, stream));
            }, error => console.log(error));
    
        // Listen to signaling data from Scaledrone
        this.room.on("data", (message, client) => {
            // Message was sent by us
            if(client.id === this.drone.clientId) {
                return;
            }
    
            if(message.sdp) {
                // This is called after receiving an offer or answer from another peer
                this.pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
                    // When receiving an offer lets answer it
                    if(this.pc.remoteDescription.type === "offer") {
                        this.pc.createAnswer().then(this.localDescCreated.bind(this)).catch(error => console.log(error));
                    }
                }, error => console.log(error));
            } else if(message.candidate) {
                // Add the new ICE candidate to our connections remote description
                this.pc.addIceCandidate(
                    new RTCIceCandidate(message.candidate), () => {}, error => console.log(error)
                );
            }
        });
    }

    localDescCreated = desc => {
        this.pc.setLocalDescription(desc, () => this.sendMessage({"sdp": this.pc.localDescription}), error => console.error(error));
    }

    render() {
        const {roomId, localStream, remoteStream} = this.state;
        return (
            <div>
                <Header roomId={roomId} />
                <div className="container">
                    <video ref="local" autoPlay muted controls={localStream} />
                    <video ref="remote" autoPlay />
                </div>
                {!remoteStream &&
                    <div className="wait">
                        Invite someone to join this room: <a href={location.href}>{location.href}</a>
                    </div>
                }
            </div>
        );
    }
}

export default Main;
