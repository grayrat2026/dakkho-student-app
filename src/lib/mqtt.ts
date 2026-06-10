import mqtt from 'mqtt';

let mqttClient: mqtt.MqttClient | null = null;

export function getMqttClient(): Promise<mqtt.MqttClient> {
  return new Promise((resolve, reject) => {
    if (mqttClient && mqttClient.connected) {
      resolve(mqttClient);
      return;
    }

    const client = mqtt.connect(process.env.MQTT_BROKER_URL!, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      protocolVersion: 4,
    });

    client.on('connect', () => {
      mqttClient = client;
      resolve(client);
    });

    client.on('error', (err) => {
      reject(err);
    });

    setTimeout(() => {
      reject(new Error('MQTT connection timeout'));
    }, 10000);
  });
}

export async function broadcastConfigUpdate(config: Record<string, unknown>) {
  try {
    const client = await getMqttClient();
    client.publish('dakkho/config-updated', JSON.stringify(config), { qos: 1 });
    return true;
  } catch (error) {
    console.error('MQTT broadcast failed:', error);
    return false;
  }
}
