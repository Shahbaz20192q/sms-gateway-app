import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import DirectSms from 'react-native-direct-sms';
import BackgroundService from 'react-native-background-actions';

// ⚠️ YOUR VERCEL URL
const API_URL = 'https://alrehmanmodelschool-1.vercel.app/api/sms/sync';

const sleep = (time: number) => new Promise((resolve) => setTimeout(() => resolve(true), time));

// This function runs in the background forever
const veryIntensiveTask = async (taskDataArguments: any) => {
  const { delay } = taskDataArguments;

  await new Promise(async (resolve) => {
    while (BackgroundService.isRunning()) {
      try {
        // 1. Check Server for SMS
        console.log('Checking server...');
        const response = await fetch(API_URL);
        const json = await response.json();

        if (json.success && json.data) {
          const { id, phone, message } = json.data;
          
          // 2. Send SMS
          DirectSms.sendDirectSms(phone, message);
          
          // 3. Confirm to Server
          await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'sent' }),
          });
          
          // Update notification text (optional)
          await BackgroundService.updateNotification({
            taskDesc: `Last sent to: ${phone}`,
          });
        }
      } catch (error) {
        console.log('Error:', error);
      }

      // Wait 5 seconds before next check
      await sleep(delay);
    }
  });
};

const options = {
  taskName: 'SchoolSMS',
  taskTitle: 'School SMS Gateway',
  taskDesc: 'Service is running in background...',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  parameters: {
    delay: 5000, // 5 Seconds
  },
};

function App(): React.JSX.Element {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.SEND_SMS);
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
  };

  const toggleBackgroundService = async () => {
    if (running) {
      await BackgroundService.stop();
      setRunning(false);
    } else {
      await BackgroundService.start(veryIntensiveTask, options);
      setRunning(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>School SMS Gateway</Text>
      
      <View style={styles.card}>
        <Text style={styles.status}>
          Service is: {running ? <Text style={styles.on}>RUNNING 🟢</Text> : <Text style={styles.off}>STOPPED 🔴</Text>}
        </Text>
        <Text style={styles.info}>
          {running 
            ? "You can now close the app. It will run in the background." 
            : "Click Start to enable background mode."}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, running ? styles.stopBtn : styles.startBtn]} 
        onPress={toggleBackgroundService}
      >
        <Text style={styles.btnText}>{running ? 'STOP SERVICE' : 'START SERVICE'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#38bdf8', marginBottom: 40, textAlign: 'center' },
  card: { backgroundColor: '#1f2937', padding: 20, borderRadius: 10, marginBottom: 30, alignItems: 'center' },
  status: { fontSize: 20, color: '#e5e7eb', marginBottom: 10 },
  on: { color: '#4ade80', fontWeight: 'bold' },
  off: { color: '#ef4444', fontWeight: 'bold' },
  info: { color: '#9ca3af', textAlign: 'center' },
  button: { padding: 15, borderRadius: 50, alignItems: 'center' },
  startBtn: { backgroundColor: '#38bdf8' },
  stopBtn: { backgroundColor: '#ef4444' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});

export default App;