module.exports = {
    cube : cube
}

function cube(message){
    let content = message.content.substring(6)
    content = content.split(' ')

    if(content.length !== 2){
        return message.channel.send(`Invalid format`)
    }

    if(!(content[0].startsWith('<')) || !(content[0].endsWith('>'))){
        return message.channel.send('Invalid emoji')
    }

    amount = parseInt(content[1]);

    if(amount < 0){
        return message.channel.send('Invalid number')
    }

    if(amount <= 0){
        return message.channel.send('Invalid number')
    }

    let line = content[0].repeat(amount)
    let cube = ''
    
    for(i = 0; i < amount; i++){
        cube += line + '\n'
        
    }

    if(cube.length > 2000){
        return message.channel.send('Cube size exceeds Discord limit.')
    }

    message.channel.send(`${cube}`);
}