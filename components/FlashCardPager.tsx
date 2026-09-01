import { useState } from "react";
import { View, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Shadows, Gradient, Colors } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HORIZONTAL_PADDING = 40;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING;

type FlashCardPagerItem = {
  frontLabel: string;
  frontValue: string;
  backLabel: string;
  backValue: string;
  accentColor?: string;
};

type FlashCardPagerProps = {
  items: FlashCardPagerItem[];
};

function FlipCard({
  frontLabel,
  frontValue,
  backLabel,
  backValue,
  accentColor = "#818cf8",
}: FlashCardPagerItem) {
  const [flipped, setFlipped] = useState(false);
  const progress = useSharedValue(0);

  const toggle = () => {
    const to = flipped ? 0 : 1;
    progress.value = withTiming(to, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    setFlipped(!flipped);
  };

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(toggle)();
  });

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [0, 180]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [1, 0, 0]);
    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(progress.value, [0, 1], [-180, 0]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]);
    return {
      transform: [{ perspective: 800 }, { rotateY: `${rotateY}deg` }],
      opacity,
    };
  });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={{ width: CARD_WIDTH }} className="h-44">
        <Animated.View
          style={[frontStyle, { position: "absolute", width: "100%", height: "100%" }]}
        >
          <LinearGradient
            colors={[...Gradient.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="flex-1 rounded-2xl p-5 border border-midnight-border items-center justify-center"
            style={Shadows.card}
          >
            <Text className="text-xs text-ltext-secondary mb-2">{frontLabel}</Text>
            <Text
              className="text-xl font-bold text-center leading-7"
              style={{ color: accentColor }}
            >
              {frontValue}
            </Text>
            <Text className="text-[10px] text-ltext-secondary mt-3 opacity-50">
              Tap to reveal
            </Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={[backStyle, { position: "absolute", width: "100%", height: "100%" }]}
        >
          <LinearGradient
            colors={["#1a1040", "#151530"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="flex-1 rounded-2xl p-5 border border-midnight-border items-center justify-center"
            style={Shadows.glow}
          >
            <Text className="text-xs text-ltext-secondary mb-2">{backLabel}</Text>
            <Text className="text-sm text-ltext leading-5 text-center px-3">
              {backValue}
            </Text>
            <Text className="text-[10px] text-ltext-secondary mt-3 opacity-50">
              Tap to flip back
            </Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

export function FlashCardPager({ items }: FlashCardPagerProps) {
  const scrollX = useSharedValue(0);
  const [currentPage, setCurrentPage] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onMomentumScrollEnd = (e: any) => {
    const x = e?.contentOffset?.x ?? e?.nativeEvent?.contentOffset?.x ?? 0;
    const page = Math.round(x / CARD_WIDTH);
    setCurrentPage(page);
  };

  return (
    <View>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
      >
        {items.map((item, i) => (
          <View key={i} style={{ width: CARD_WIDTH }} className="items-center pr-4">
            <FlipCard {...item} />
          </View>
        ))}
      </Animated.ScrollView>

      <View className="flex-row justify-center items-center gap-2 mt-4">
        {items.map((_, i) => {
          const isActive = i === currentPage;
          return (
            <Animated.View
              key={i}
              style={{
                width: isActive ? 20 : 6,
                backgroundColor: isActive ? Colors.primaryLight : Colors.surfaceBorder,
              }}
              className="h-1.5 rounded-full"
            />
          );
        })}
      </View>

      <Text className="text-center text-xs text-ltext-secondary mt-2">
        {currentPage + 1} / {items.length}
      </Text>
    </View>
  );
}
