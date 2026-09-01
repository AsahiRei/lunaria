import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { View } from "react-native";
import { Colors, Gradient } from "../constants/theme";

type GradientHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function GradientHeader({ children, className }: GradientHeaderProps) {
  return (
    <LinearGradient
      colors={[...Gradient.header]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={className}
    >
      {children}
    </LinearGradient>
  );
}

type GradientCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "accent";
};

export function GradientCard({
  children,
  className,
  variant = "default",
}: GradientCardProps) {
  const gradients = {
    default: Gradient.card,
    elevated: ["#1a1a3e", "#12122a"] as const,
    accent: Gradient.accent,
  };

  return (
    <LinearGradient
      colors={[...gradients[variant]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className={`rounded-xl border border-midnight-border ${className ?? ""}`}
    >
      {children}
    </LinearGradient>
  );
}

type GlowCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlowCard({ children, className }: GlowCardProps) {
  return (
    <View className={`relative ${className ?? ""}`}>
      {/* Glow effect behind card */}
      <View
        className="absolute inset-0 rounded-xl"
        style={{
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 8,
        }}
      />
      <LinearGradient
        colors={[...Gradient.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="rounded-xl border border-midnight-border relative"
      >
        {children}
      </LinearGradient>
    </View>
  );
}
