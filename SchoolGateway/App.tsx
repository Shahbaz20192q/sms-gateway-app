import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import DirectSms from 'react-native-direct-sms';

const API_URL = 'https://alrehmanmodelschool-1.vercel.app/api/sms/sync';

function App(): React.JSX.Element {
  const [status, setStatus] = useState('Idle');

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.SEND_SMS);
    }
  };

  const syncSMS = async () => {
    setStatus('Checking for SMS...');
    try {
      const response = await fetch(API_URL);
      const json = await response.json();

      if (json.success && json.data) {
        const { id, phone, message } = json.data;
        setStatus('Sending to ' + phone + '...');
        DirectSms.sendDirectSms(phone, message);
        await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'sent' }),
        });
        setStatus('SMS Sent Successfully! ✅');
      } else {
        setStatus('No pending SMS found.');
      }
    } catch (error) {
      console.log(error);
      setStatus('Error connecting to server ❌');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>School SMS Gateway</Text>
      <View style={styles.card}>
        <Text style={styles.status}>Status: {status}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={syncSMS}>
        <Text style={styles.btnText}>CHECK & SEND SMS</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#38bdf8', marginBottom: 40, textAlign: 'center' },
  card: { backgroundColor: '#1f2937', padding: 20, borderRadius: 10, marginBottom: 30, alignItems: 'center' },
  status: { fontSize: 18, color: '#e5e7eb' },
  button: { backgroundColor: '#38bdf8', padding: 15, borderRadius: 50, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});

export default App;
