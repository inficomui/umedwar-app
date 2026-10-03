import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  ToastAndroid,
  Dimensions,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type ToastType = "error" | "success" | "warning" | "info";

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions | string) => void;
  error: (message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  hide: () => void;
}

// Global listener for calling toast from outside React components (e.g., authApi.ts)
type ToastListener = (options: ToastOptions) => void;
let globalToastListener: ToastListener | null = null;

export const toast = {
  show: (options: ToastOptions | string) => {
    const opts: ToastOptions =
      typeof options === "string" ? { message: options, type: "info" } : options;
    if (globalToastListener) {
      globalToastListener(opts);
    }
    // Also trigger Android native toast as additional guarantee
    if (Platform.OS === "android" && opts.message) {
      try {
        ToastAndroid.show(opts.message, ToastAndroid.SHORT);
      } catch {
        // ignore if not available
      }
    }
  },
  error: (message: string, title: string = "सर्व्हर त्रुटी (Error)") => {
    toast.show({ type: "error", title, message, duration: 4500 });
  },
  success: (message: string, title: string = "यशस्वी (Success)") => {
    toast.show({ type: "success", title, message, duration: 3500 });
  },
  warning: (message: string, title: string = "सूचना (Notice)") => {
    toast.show({ type: "warning", title, message, duration: 4000 });
  },
  info: (message: string, title: string = "माहिती (Info)") => {
    toast.show({ type: "info", title, message, duration: 3500 });
  },
  hide: () => {
    if (globalToastListener) {
      globalToastListener({ message: "", type: "info", duration: 0 });
    }
  },
};

const ToastContext = createContext<ToastContextValue>({
  show: toast.show,
  error: toast.error,
  success: toast.success,
  warning: toast.warning,
  info: toast.info,
  hide: toast.hide,
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null);
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentToast(null);
    });
  }, [translateY, opacity]);

  const showToastInternal = useCallback(
    (options: ToastOptions) => {
      if (!options.message) {
        hideToast();
        return;
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      setCurrentToast(options);

      translateY.setValue(-120);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = options.duration || 4000;
      hideTimerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [translateY, opacity, hideToast]
  );

  useEffect(() => {
    globalToastListener = showToastInternal;
    return () => {
      globalToastListener = null;
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [showToastInternal]);

  // Swipe up to dismiss gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy < -5;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -15) {
          hideToast();
        }
      },
    })
  ).current;

  const getTheme = (type: ToastType = "info") => {
    switch (type) {
      case "error":
        return {
          bg: "#1C1917",
          border: "#EF4444",
          badgeBg: "#450A0A",
          icon: "alert-circle" as const,
          iconColor: "#EF4444",
          titleColor: "#FCA5A5",
          accentStripe: "#DC2626",
        };
      case "success":
        return {
          bg: "#1C1917",
          border: "#10B981",
          badgeBg: "#064E3B",
          icon: "check-circle" as const,
          iconColor: "#10B981",
          titleColor: "#6EE7B7",
          accentStripe: "#059669",
        };
      case "warning":
        return {
          bg: "#1C1917",
          border: "#F59E0B",
          badgeBg: "#451A03",
          icon: "alert" as const,
          iconColor: "#F59E0B",
          titleColor: "#FCD34D",
          accentStripe: "#D97706",
        };
      case "info":
      default:
        return {
          bg: "#1C1917",
          border: "#EA580C",
          badgeBg: "#431407",
          icon: "information" as const,
          iconColor: "#EA580C",
          titleColor: "#FDBA74",
          accentStripe: "#EA580C",
        };
    }
  };

  const theme = getTheme(currentToast?.type);
  const topPosition = Math.max(insets.top + 8, 16);

  return (
    <ToastContext.Provider
      value={{
        show: toast.show,
        error: toast.error,
        success: toast.success,
        warning: toast.warning,
        info: toast.info,
        hide: hideToast,
      }}
    >
      {children}

      {/* Floating Animated Toast Banner */}
      {currentToast && (
        <View
          pointerEvents="box-none"
          style={[styles.overlayContainer, { top: topPosition }]}
        >
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.toastCard,
              {
                backgroundColor: theme.bg,
                borderColor: theme.border,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            {/* Left Accent Color Stripe */}
            <View
              style={[
                styles.accentStripe,
                { backgroundColor: theme.accentStripe },
              ]}
            />

            {/* Icon Badge */}
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: theme.badgeBg },
              ]}
            >
              <MaterialCommunityIcons
                name={theme.icon}
                size={22}
                color={theme.iconColor}
              />
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              {Boolean(currentToast.title) && (
                <Text
                  style={[styles.toastTitle, { color: theme.titleColor }]}
                  numberOfLines={1}
                >
                  {currentToast.title}
                </Text>
              )}
              <Text style={styles.toastMessage} numberOfLines={3}>
                {currentToast.message}
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={hideToast}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  overlayContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999999,
    elevation: 999999,
  },
  toastCard: {
    width: Math.min(screenWidth - 32, 480),
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.4)",
      },
    }),
  },
  accentStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  toastMessage: {
    fontSize: 13,
    color: "#F9FAFB",
    lineHeight: 18,
    fontWeight: "500",
  },
  closeBtn: {
    padding: 6,
    marginLeft: 6,
  },
});
