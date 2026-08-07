import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AiAssistantScreen from '../screens/AiAssistantScreen';
import SuperAdminScreen from '../screens/SuperAdminScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  AiAssistant: undefined;
  SuperAdmin: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === 'super_admin' ? (
        <Stack.Screen name="SuperAdmin" component={SuperAdminScreen} />
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="AiAssistant" component={AiAssistantScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
