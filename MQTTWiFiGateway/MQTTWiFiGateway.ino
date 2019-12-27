
#include <ESP8266WiFi.h>
#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <Wire.h>
#include <PubSubClient.h>

#define BOOT 0
#define LED 2

void log(const char *s, boolean newline=true);
void log(int n, boolean newline=true);


IPAddress defaultIP = IPAddress(10,0,0,200);

const char* mqtt_server = "your_mqtt_server";
const char* mqtt_username = "mqtt_user";
const char* mqtt_password = "mqtt_password";

int mqtt_port = 8883;
WiFiClientSecure espClient;
// int mqtt_port = 1883;
//WiFiClient espClient;
PubSubClient mqtt_client(espClient);
char data[128];

// Connect to MQTT broker
void mqtt_connect() {
  // Loop until we're reconnected
  while (!mqtt_client.connected()) {
    log("Connecting to MQTT...");
    // Attempt to connect
    String mqtt_clientId = "mqtt_gateway-";
    mqtt_clientId += String(random(0xffff), HEX);
    if (mqtt_client.connect(mqtt_clientId.c_str(), mqtt_username, mqtt_password)) {
      log("connected");
    } else {
      log("failed, rc=", false);
      log(mqtt_client.state());
      delay(2000);
    }
  }
}

void checkFactoryReset() {
  // Hold BOOT button to enable factory reset.
  delay(200);
  if (digitalRead(BOOT) == LOW) {
    digitalWrite(LED, LOW);
    // wait for button release
    while (digitalRead(BOOT) == LOW) {
      digitalWrite(LED, LOW);
      delay(20);
      digitalWrite(LED, HIGH);
      delay(40);
    }

    // press again to do factory reset. Press reset button to skip.
    while (digitalRead(BOOT) == HIGH) {
      digitalWrite(LED, LOW);
      delay(20);
      digitalWrite(LED, HIGH);
      delay(40);
    }
    digitalWrite(LED, LOW);
    if (digitalRead(BOOT) == LOW) {
      digitalWrite(LED, HIGH);
      boolean erased = ESP.eraseConfig();
      if (erased) {
        log("erase success");
      } else {
        log("failed to erase flash!");
      }

      delay(1000);
      ESP.reset();
    }
  }
}

void setup()   {
  pinMode(2, OUTPUT); // ESP8266 LED
  digitalWrite(2, LOW);
  delay(200);
  digitalWrite(2, HIGH);

  Serial.begin(115200);
  while (!Serial);
  log("setup...");

  checkFactoryReset();

  WiFiManager wifiManager;
  wifiManager.setAPStaticIPConfig(defaultIP, defaultIP, IPAddress(255,255,255,0));
  wifiManager.autoConnect("MQTTWiFiGateway", NULL);

  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    log(".", false);
  }
  log("");
  log("connected");

  mqtt_client.setServer(mqtt_server, mqtt_port);
  mqtt_connect();
}

void log(const char *s, boolean newline) {
  Serial.print(s);
  if (newline) {
    Serial.println();
  }
}

void log(int n, boolean newline) {
  char s[8];
  sprintf(s, "%d", n);
  log(s, newline);
}

void loop() {
  if (!mqtt_client.connected()) {
    mqtt_connect();
  }
  mqtt_client.loop();

  delay(50); // Give the ESP time to handle network.

  if (Serial.available()) {
    Serial.setTimeout(100);
    String s = Serial.readStringUntil('\n');
    log(s.c_str());
    String topic;
    String data;
    int colon = s.indexOf(':');
    int end = s.indexOf('\r');
    if (colon > 0) {
      topic = s.substring(0, colon);
      data = s.substring(colon+1, end);
      log("publish to topic ", false);
      log(topic.c_str(), false);
      log(": ", false);
      log(data.c_str());
      mqtt_client.publish(topic.c_str(), data.c_str());
    }
  }
}
