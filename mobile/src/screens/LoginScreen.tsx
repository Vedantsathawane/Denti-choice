import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Text, Card } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please fill in email and password fields.');
      return;
    }
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid email or password.');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.cardContent}>
          <Title style={styles.title}>Denti-Choice SaaS</Title>
          <Text style={styles.subtitle}>Mobile Operator Portal</Text>

          <TextInput
            label="Operator Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            outlineColor="#E2E8F0"
            activeOutlineColor="#0066FF"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
            outlineColor="#E2E8F0"
            activeOutlineColor="#0066FF"
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor="#0066FF"
          >
            Authorize Access
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  cardContent: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 30,
  },
  input: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    width: '100%',
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 4,
  },
});
