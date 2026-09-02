import { Tabs } from "expo-router";
import { Home, PlusCircle, BarChart3, Info } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradient } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.silverDark,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: Colors.surfaceBorder,
          height: 70,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={[...Gradient.tabBar]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
          />
        ),
        ...({ contentStyle: { backgroundColor: "#0a0a1a" } } as any),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          letterSpacing: 0.05,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-pdf"
        options={{
          title: "Add PDF",
          tabBarIcon: ({ color, size }) => (
            <PlusCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color, size }) => <Info size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
