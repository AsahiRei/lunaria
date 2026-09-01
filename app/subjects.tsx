import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Search, X } from "lucide-react-native";
import { Colors } from "../constants/theme";
import { FadeIn } from "../components/Stagger";
import { SubjectCard } from "../components/SubjectCard";
import { TopAppBar } from "../components/TopAppBar";
import { useReviewerStore } from "../store/useReviewerStore";

export default function SubjectsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const allSubjects = useReviewerStore((s) => s.subjects);

  const filtered = allSubjects.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-midnight">
      <TopAppBar title="All Subjects" />

      <View className="px-5 mt-4 mb-2">
        <View className="flex-row items-center gap-2 bg-surface rounded-xl px-3 py-1.5 border border-midnight-border">
          <Search size={18} color={Colors.silverDark} />
          <TextInput
            className="flex-1 text-sm text-ltext"
            placeholder="Search subjects..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={16} color={Colors.silverDark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mt-2 mb-4">
          <Text className="text-sm text-ltext-secondary">
            {filtered.length} subject{filtered.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <View className="gap-3 pb-8">
          {filtered.map((subject, index) => (
            <FadeIn key={subject.id} delay={index * 80}>
              <SubjectCard
                subject={subject}
                onPress={() => router.push({ pathname: "/reviewer/[id]", params: { id: subject.id } })}
              />
            </FadeIn>
          ))}
          {filtered.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-sm text-ltext-secondary">No subjects found.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
