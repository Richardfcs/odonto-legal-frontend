import * as React from 'react';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert, ActivityIndicator } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const API_URL = 'https://odonto-legal-backend.onrender.com';

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha ambos os campos');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await AsyncStorage.multiSet([
          ['token', result.token],
          ['role', result.role],
        ]);

        Alert.alert('Sucesso', result.msg || 'Login bem-sucedido!');
        
        switch(result.role) {
          case 'admin':
            navigation.navigate('AdminHome');
            break;
          case 'perito':
          case 'assistente':
            navigation.navigate('MainHome');
            break;
          default:
            Alert.alert('Aviso', 'Perfil não reconhecido, redirecionando...');
            navigation.navigate('DefaultHome');
        }
      } else {
        if (response.status === 401 || response.status === 403) {
          await AsyncStorage.multiRemove(['token', 'role']);
          Alert.alert('Erro', 'Sessão expirada ou não autorizada');
          navigation.navigate('Welcome');
          return;
        }
        Alert.alert('Erro', result.msg || `Erro no login (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        label="Senha"
        mode="outlined"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        style={styles.input}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        disabled={loading}
        style={styles.button}
        labelStyle={styles.buttonLabel}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          'Entrar'
        )}
      </Button>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  buttonLabel: {
    fontSize: 16,
    height: 24,
  },
});