
# Iridium Satellite Signal Strength Monitoring

This repo has the project code for the [Iridium Signal Strength Monitoring](https://nootropicdesign.com/projectlab/2019/12/27/iridium-signal-monitoring/) project. See the full project for details.

There are 3 major components of this project: IridiumSignalQualityMonitor, MQTTWiFiGateway, and the NodeJS web server.

## IridiumSignalQualityMonitor

Arduino code for SAMD21 microcontroller (e.g. Arduino Zero, SparkFun SAMD21 mini breakout board, etc.)
The basis for this software is [this project](https://nootropicdesign.com/projectlab/2019/09/21/arduino-satellite-communication)

This code asks the RockBLOCK 9603 modem for the current signal strength and writes that information over serial to an ESP8266 running the MQTTWiFiGateway firmware (see below).

### Dependencies:

* [IridiumSBD library](https://github.com/mikalhart/IridiumSBD) - Arduino library for Iridium Short Data Burst messages
* [Adafruit GPS library](https://github.com/adafruit/Adafruit_GPS) - Arduino GPS library for NMEA sentence parsing
* [Adafruit ZeroTimer library](https://github.com/adafruit/Adafruit_ZeroTimer) - Timer library for SAMD21
* [Adafruit GFX library](https://github.com/adafruit/Adafruit-GFX-Library) - Core library for displays
* [Adafruit SSD1306 library](https://github.com/adafruit/Adafruit_SSD1306) - Library for our Monochrome OLEDs based on SSD1306 drivers

## MQTTWiFiGateway

Arduino code for ESP8266 that reads from serial and publishes data to MQTT.

Set your MQTT server and credentials in `MQTTWiFiGateway.ino`:

```
const char* mqtt_server = "your_mqtt_server";
const char* mqtt_username = "mqtt_user";
const char* mqtt_password = "mqtt_password";
```

### Dependencies:

* [WiFiManager](https://github.com/tzapu/WiFiManager) - WiFi Manager for ESP8266
* [PubSubClient](https://github.com/Imroy/pubsubclient) - MQTT library for ESP8266

## NodeJS Web Server

Set your MQTT server and credentials in `server.js`:

```
var options = {
        host: 'your_mqtt_server',
        port: 1883,
        username: 'mqtt_user',
        password: 'mqtt_password'
    }
```

Set your Cesium Ion access token in `app.js`:
```
Cesium.Ion.defaultAccessToken = 'YOUR_CESIUM_ION_ACCESS_TOKEN';
```

To use the MapBox dark imagery like I did, you'll need a MapBox access token. Also set in `app.js`:

```
imageryProvider : new Cesium.MapboxImageryProvider({
    mapId: 'mapbox.dark',
    accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN'
})
```
Installation and startup:

```
cd webserver
npm install
npm start
```

