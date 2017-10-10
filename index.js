const blaster = require('./pi-blaster');

const ONOFF_PIN =  4;
const RED_PIN   = 27;
const GREEN_PIN = 17;
const BLUE_PIN  = 22;

var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("ledstrip-plugin", "LEDStrip", LEDStrip);
}

class LEDStrip {
    constructor(log, config) {
        this.log = log;
        this.config = config;
    }

    getServices() {
        let informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, 'DIY')
            .setCharacteristic(Characteristic.Model, 'LED Strip Light')
            .setCharacteristic(Characteristic.SerialNumber, '1');
        
        let ledstripService = new Service.Lightbulb('LED Strip Light');
        ledstripService.getCharacteristic(Characteristic.On)
            .on('set', this.onSetLEDStripOnCharacteristic.bind(this));
        [Characteristic.Hue, Characteristic.Saturation, Characteristic.Brightness]
            .forEach(characteristic => {
                ledstripService.getCharacteristic(characteristic)
                    .on('change', this.onChangeLEDStripHSVCharacteristics.bind(this));
            });
        
        this.informationService = informationService;
        this.ledstripService = ledstripService;
        
        return [informationService, ledstripService];
    }

    onSetLEDStripOnCharacteristic(on, callback) {
        if (on) {
            blaster.on(ONOFF_PIN)
                .then(callback)
                .then(() => this.onChangeLEDStripHSVCharacteristics())
                .catch(this.log)
        } else {
            blaster.off(ONOFF_PIN)
                .then(callback)
                .then(() => blaster.pwm([RED_PIN, 0], [GREEN_PIN, 0], [BLUE_PIN, 0]))
                .catch(this.log)
        }
    }

    onChangeLEDStripHSVCharacteristics() {
        let [h, s, v] = [Characteristic.Hue, Characteristic.Saturation, Characteristic.Brightness]
            .map(characteristic => this.ledstripService.getCharacteristic(characteristic).value);
        let [r, g, b] = this.convertHSVtoRGB(h, s / 100, v / 100);
        blaster.pwm([RED_PIN, r], [GREEN_PIN, g], [BLUE_PIN, b]).catch(this.log);
    }

    convertHSVtoRGB(hue, saturation, value) {
        let c = value * saturation,
            h = hue / 60,
            x = c * (1 - Math.abs(h % 2 - 1)),
            m = value - c;
        let r, g, b;
        switch (true) {
            case 0 <= h && h <= 1: r = c; g = x; b = 0; break;
            case 1 <= h && h <= 2: r = x; g = c; b = 0; break;
            case 2 <= h && h <= 3: r = 0; g = c; b = x; break;
            case 3 <= h && h <= 4: r = 0; g = x; b = c; break;
            case 4 <= h && h <= 5: r = x; g = 0; b = c; break;
            case 5 <= h && h <  6: r = c; g = 0; b = x; break;
            default: r = 0; g = 0; b = 0;
        }
        return [r + m, g + m, b + m];
    }
}