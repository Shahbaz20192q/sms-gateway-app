import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import DirectSms from 'react-native-direct-sms';

// ⚠️ REPLACE THIS WITH YOUR VERCEL URL
const API_URL = 'https://alrehmanmodelschool-1.vercel.app/api/sms/sync'; 

function App(): React.JSX.Element {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState('Idle');

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${text}`, ...prev.slice(0, 50)]);
  };

  useEffect(() => {
    async function requestPermissions() {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SEND_SMS
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            addLog('✅ SMS Permission Granted');
            startPolling();
          } else {
            addLog('❌ SMS Permission Denied');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    }
    requestPermissions();
  }, []);

  const startPolling = () => {
    setStatus('Running...');
    setInterval(async () => {
      try {
        setStatus('Checking...');
        // 1. Ask Server for SMS
        const response = await fetch(API_URL);
        const json = await response.json();

        if (json.success && json.data) {
          const {id, phone, message} = json.data;
          addLog(`📨 Sending to ${phone}...`);

          // 2. Send SMS Directly
          DirectSms.sendDirectSms(phone, message);

          // 3. Tell Server "Done"
          await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id, status: 'sent'}),
          });
          
          addLog(`✅ Sent!`);
        }
      } catch (error) {
        setStatus('Error connecting');
      }
    }, 5000); // Check every 5 seconds
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>School SMS Gateway</Text>
      <Text style={styles.status}>Status: {status}</Text>
      <ScrollView style={styles.logBox}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#111827', padding: 20},
  title: {fontSize: 24, fontWeight: 'bold', color: '#38bdf8', marginBottom: 10, textAlign: 'center'},
  status: {fontSize: 16, color: '#e5e7eb', textAlign: 'center', marginBottom: 20},
  logBox: {flex: 1, backgroundColor: '#000', borderRadius: 10, padding: 15},
  logText: {color: '#4ade80', fontFamily: 'monospace', marginBottom: 5, fontSize: 12},
});

export default App;