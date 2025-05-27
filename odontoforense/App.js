import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/login'
// import AdminHomeScreen from './screensAdm/home'
import MainHomeScreen from './screens/home'

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* <Stack.Screen name="AdminHome" component={AdminHomeScreen} /> */}
        <Stack.Screen name="MainHome" component={MainHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}