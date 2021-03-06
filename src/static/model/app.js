import EventEmitter from 'eventemitter2';
class Model extends EventEmitter {
    getConnection() {
        if(!this.connectionPromise) {
            this.connectionPromise = new Promise((resolve, reject) => {
                this.connection = new WebSocket(`wss://${window.location.host}/test`);
                this.connection.addEventListener("open", () => {
                    resolve(this.connection);
                });
                this.connection.addEventListener("message", (...args) => {
                    this.handleMessage(...args);
                });
                this.connection.addEventListener("onerror", (err) => {
                    reject(err);
                });
            });
        }
        return this.connectionPromise;
    }
    async send(topic, content) {
        const connection = await this.getConnection();
        console.log("sending ", topic, content);
        const message = JSON.stringify({topic, content});
        console.log("raw message to send", message);
        connection.send(message);
    }
    handleMessage(rawMessage) {
        try {
            const message = JSON.parse(rawMessage.data);
            console.log("received", message);
            this.emit(message.topic, message.content);
        } catch (error) {
            console.error("Error receiving message", error, rawMessage);
        }
    }
    setLanguage(language) {
        return this.send("api.setLanguage", language);
    }
    setUserType(userType) {
        return this.send("api.setUserType", userType);
    }
    setOnlineStatus(status) {
        return this.send("api.setOnlineStatus", status);
    }
    setUserInformation(userInformation) {
        return this.send("api.setUserInformation", userInformation);
    }
    requestCall(call) {
        const callId = Math.floor(Math.random() * 1000000);
        return this.send("api.requestCall", {callId, ...call});
    }
    acceptCall() {
        return this.send("api.acceptCall");
    }
}
export default new Model();
