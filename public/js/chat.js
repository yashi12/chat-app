let socket = io();

function scrollToBottom() {
    let messages = document.querySelector('#messages').lastElementChild;
    messages.scrollIntoView();
}

socket.on('connect', () => {
    let searchQuery = window.location.search.substring(1);
    let params = JSON.parse('{"' + decodeURI(searchQuery).replace(/&/g, '","').replace(/\+/g, ' ').replace(/=/g, '":"') + '"}');

    socket.emit('join',params,(err)=>{
        if(err){
            alert(err);
            window.location.href = '/';
        }
        else{
            console.log('no err');
        }
    });
    console.log('connected to server');
});

socket.on('disconnect', () => {
    console.log('disconnected from server');
});

socket.on('updateUsersList',(users)=>{
    let ol = document.createElement('ol');
    users.forEach(user=>{
        let li =document.createElement('li');
        li.innerHTML = user;
        ol.appendChild(li);
    });
    let userList = document.querySelector('#users');
    userList.innerHTML = "";
    userList.appendChild(ol);
});

socket.on('newMessage', function (message) {
    const formattedTime = moment(message.createdAt).format('LT');
    const template = document.querySelector('#message-template').innerHTML;
    const html = Mustache.render(template, {
        from: message.from,
        text: message.text,
        createdAt: formattedTime
    });

    const div = document.createElement('div');
    div.innerHTML = html

    document.querySelector('#messages').appendChild(div);
    scrollToBottom();
});

socket.on('notRegistered',(message)=>{
    if(message.err){
        alert(message.err);
        window.location.href = '/';
    }
    else{
        console.log('no err');
    }
});

socket.on('oldMessage', function (message) {
    const formattedTime = moment(message.createdAt).add(5.5,'hours').format('LT');
    const template = document.querySelector('#message-template').innerHTML;
    const html = Mustache.render(template, {
        from: message.from,
        text: message.text,
        createdAt: formattedTime
    });

    const div = document.createElement('div');
    div.innerHTML = html

    document.querySelector('#messages').appendChild(div);
    scrollToBottom();
    });

    


document.querySelector('#submit-btn').addEventListener('click', function (e) {
    e.preventDefault();

    socket.emit("createMessage", {
        from: "User",
        text: document.querySelector('input[name="message"]').value
    }, function () {
        document.querySelector('input[name="message"]').value = '';
    })
})

document.querySelector('#send-location').addEventListener('click', function (e) {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    navigator.geolocation.getCurrentPosition(function (position) {
        socket.emit('createLocationMessage', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        })
    }, function () {
        alert('Unable to fetch location.')
    })
});
