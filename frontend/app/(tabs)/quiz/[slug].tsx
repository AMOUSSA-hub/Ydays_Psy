import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { WebContainer } from '@/components/ui/web-container';
import { listQuestionnaires, submitQuestionnaire } from '@/lib/repositories';
import type { QuestionnaireRow } from '@/types/database';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function QuizDetailScreen() {
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Match Home page colors
  const mainBg = isDark ? '#6B6588' : '#9896D4';
  const cardBg = '#F2F2F7';

  const [quiz, setQuiz] = useState<QuestionnaireRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{ score: number; summary: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listQuestionnaires();
      const found = all.find((q) => q.slug === slug);
      if (found) setQuiz(found);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const onAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    if (quiz && step < quiz.schema.questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const finish = async () => {
    if (!user || !quiz) return;
    let totalScore = 0;
    quiz.schema.questions.forEach((q) => {
      const ansId = answers[q.id];
      const opt = q.options.find((o) => o.id === ansId);
      if (opt) totalScore += opt.score;
    });

    const summary = totalScore < 2 
      ? "Vos réponses suggèrent un état équilibré. Continuez à prendre soin de vous !" 
      : "Ces résultats indiquent certains points d'attention. N'hésitez pas à en parler à un professionnel si cela persiste.";
    
    try {
      await submitQuestionnaire(user.id, quiz.id, answers, totalScore, summary);
      setResults({ score: totalScore, summary });
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer vos résultats.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: mainBg }}>
        <ActivityIndicator color="white" size="large" />
      </View>
    );
  }

  if (!quiz) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: mainBg }}>
        <ThemedText className="text-white">Quizz introuvable</ThemedText>
        <TouchableOpacity onPress={() => router.replace('/quiz')} className="mt-4 px-6 py-2 rounded-full" style={{ backgroundColor: cardBg }}>
          <ThemedText className="text-black font-bold">RETOUR À LA LISTE</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (results) {
    return (
      <View className="flex-1" style={{ backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0 }}>
        <WebContainer maxWidth={800} className="flex-1 px-6 items-center justify-center">
          <View className="w-full rounded-[40px] p-10 shadow-sm items-center border border-neutral-100" style={{ backgroundColor: cardBg }}>
            <ThemedText className="text-4xl mb-4">✨</ThemedText>
            <ThemedText className="text-2xl font-black text-black text-center mb-2">Bilan terminé</ThemedText>
            <View className="h-24 w-24 rounded-full bg-white items-center justify-center mb-6 shadow-sm border border-neutral-200">
               <ThemedText className="text-4xl font-black text-black">{results.score}</ThemedText>
            </View>
            <ThemedText className="text-lg text-neutral-700 text-center mb-10 leading-7">
              {results.summary}
            </ThemedText>
            <TouchableOpacity 
              onPress={() => router.replace('/home')} 
              className="bg-black w-full py-5 rounded-full shadow-lg"
            >
              <ThemedText className="text-white text-center font-black tracking-widest uppercase">RETOUR À L'ACCUEIL</ThemedText>
            </TouchableOpacity>
          </View>
        </WebContainer>
      </View>
    );
  }

  const currentQuestion = quiz.schema.questions[step];
  const progress = ((step + 1) / quiz.schema.questions.length) * 100;

  return (
    <View className="flex-1" style={{ backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0, paddingTop: isWeb ? 20 : insets.top }}>
      <WebContainer maxWidth={800} className="flex-1 px-6 py-10">
        {/* Progress Header */}
        <View className="mb-10">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity 
              onPress={() => router.replace('/quiz')} 
              className="h-12 w-12 items-center justify-center rounded-2xl shadow-sm"
              style={{ backgroundColor: cardBg }}
            >
              <ThemedText className="text-black text-xl font-black">←</ThemedText>
            </TouchableOpacity>
            <View className="rounded-full px-6 py-2 shadow-sm" style={{ backgroundColor: cardBg }}>
              <ThemedText className="text-black font-black uppercase tracking-widest text-[10px]">
                Question {step + 1} / {quiz.schema.questions.length}
              </ThemedText>
            </View>
            <View className="w-12" />
          </View>
          <View className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
            <View 
              className="h-full bg-white rounded-full" 
              style={{ width: `${progress}%` }} 
            />
          </View>
        </View>

        {/* Question Card */}
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[45px] p-10 shadow-sm border border-neutral-100 min-h-[400px] justify-center" style={{ backgroundColor: cardBg }}>
            <ThemedText className="text-2xl font-black text-black mb-12 text-center leading-10 tracking-tight">
              {currentQuestion.text}
            </ThemedText>

            <View className="gap-4">
              {currentQuestion.options.map((opt) => {
                const isSelected = answers[currentQuestion.id] === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => onAnswer(currentQuestion.id, opt.id)}
                    className={cn(
                      "w-full py-6 px-8 rounded-[35px] border-2 transition-all",
                      isSelected ? "bg-black border-black" : "bg-white border-transparent shadow-sm"
                    )}
                  >
                    <ThemedText className={cn(
                      "text-center font-bold text-lg",
                      isSelected ? "text-white" : "text-black"
                    )}>
                      {opt.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Nav */}
        <View className="mt-8 flex-row justify-between gap-4">
          {step > 0 && (
            <TouchableOpacity 
              onPress={() => setStep(step - 1)}
              className="flex-1 py-5 rounded-full shadow-sm"
              style={{ backgroundColor: cardBg }}
            >
              <ThemedText className="text-center font-black text-black tracking-widest text-[10px]">PRÉCÉDENT</ThemedText>
            </TouchableOpacity>
          )}
          {step === quiz.schema.questions.length - 1 && answers[currentQuestion.id] && (
            <TouchableOpacity 
              onPress={finish}
              className="flex-1 py-5 rounded-full bg-black shadow-xl"
            >
              <ThemedText className="text-center font-black text-white tracking-widest text-[10px]">TERMINER</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </WebContainer>
    </View>
  );
}
