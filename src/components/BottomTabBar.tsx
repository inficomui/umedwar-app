import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "react-native-paper";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type TabKey = "home" | "about" | "news" | "gallery" | "contact";

interface TabItemConfig {
  key: TabKey;
  label: string;
  route: string;
  activeIcon: string;
  inactiveIcon: string;
  iconSize?: number;
}

const TABS: TabItemConfig[] = [
  {
    key: "home",
    label: "होम",
    route: "/home",
    activeIcon: "home",
    inactiveIcon: "home-outline",
    iconSize: 23,
  },
  {
    key: "about",
    label: "माझ्याबद्दल",
    route: "/about",
    activeIcon: "account",
    inactiveIcon: "account-outline",
    iconSize: 23,
  },
  {
    key: "news",
    label: "बातम्या",
    route: "/news",
    activeIcon: "newspaper-variant",
    inactiveIcon: "newspaper-variant-outline",
    iconSize: 23,
  },
  {
    key: "gallery",
    label: "गॅलरी",
    route: "/gallery",
    activeIcon: "image",
    inactiveIcon: "image-outline",
    iconSize: 23,
  },
  {
    key: "contact",
    label: "संपर्क",
    route: "/contact",
    activeIcon: "phone",
    inactiveIcon: "phone-outline",
    iconSize: 22,
  },
];

interface BottomTabBarProps {
  currentTab: TabKey;
}

function BottomTabBarComponent({ currentTab }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleTabPress = (tab: TabItemConfig) => {
    if (currentTab === tab.key) return;
    router.replace(tab.route as any);
  };

  return (
    <View
      style={[
        styles.bottomTabBar,
        {
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = currentTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Icon
                source={isActive ? tab.activeIcon : tab.inactiveIcon}
                size={tab.iconSize ?? 23}
                color={isActive ? "#E05300" : "#78716C"}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabActiveLabel : styles.tabInactiveLabel,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const BottomTabBar = memo(BottomTabBarComponent);
export default BottomTabBar;

const styles = StyleSheet.create({
  bottomTabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    paddingTop: 6,
    paddingHorizontal: 6,
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    minHeight: 46,
  },
  iconContainer: {
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: 2,
    textAlign: "center",
  },
  tabInactiveLabel: {
    color: "#78716C",
    fontWeight: "500",
  },
  tabActiveLabel: {
    color: "#E05300",
    fontWeight: "800",
  },
});
