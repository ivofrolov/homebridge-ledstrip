// https://github.com/sarfata/pi-blaster.js/blob/master/pi-blaster.js

const fs = require('fs');

const PI_BLASTER_PATH = '/dev/pi-blaster';

function writeCommand(cmd) {
    var buffer = Buffer.from(`${cmd}\n`);
    return new Promise((resolve, reject) => {
        fs.open(PI_BLASTER_PATH, 'w', (err, fd) => {
            if (err)
                return reject(err);
            fs.write(fd, buffer, 0, buffer.length, -1, (err, bytesWritten, buffer) => {
                if (err)
                    return reject(err);
                fs.close(fd, resolve);
            });
        });
    });
}

function pwm(...pins_values) {
    return writeCommand(pins_values.map(item => `${item[0]}=${item[1]}`).join(' '));
}

function on(...pins) {
    return pwm(...pins.map(pin => [pin, 1]));
}

function off(...pins) {
    return pwm(...pins.map(pin => [pin, 0]));
}

function release(pin) {
    return writeCommand(`release ${pin}`);
}

module.exports = { pwm, on, off, release }