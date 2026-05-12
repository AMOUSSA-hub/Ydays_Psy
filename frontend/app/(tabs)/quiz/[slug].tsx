import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { WebContainer } from '@/components/ui/web-container';
import { listQuestionnaires, submitQuestionnaire } from '@/lib/repositories';
import type { QuestionnaireRow } from '@/types/database';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

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

  const navigation = useNavigation();

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const hasStarted = Object.keys(answers).length > 0;
      if (!hasStarted || results) return;

      e.preventDefault();

      if (Platform.OS === 'web') {
        if (confirm('Voulez-vous vraiment quitter ? Vos réponses seront perdues.')) {
          navigation.dispatch(e.data.action);
        }
      } else {
        Alert.alert(
          'Quitter le bilan ?',
          'Voulez-vous vraiment quitter ? Vos réponses seront perdues.',
          [
            { text: 'Rester', style: 'cancel', onPress: () => {} },
            {
              text: 'Quitter',
              style: 'destructive',
              onPress: () => navigation.dispatch(e.data.action),
            },
          ]
        );
      }
    });

    return unsubscribe;
  }, [navigation, answers, results]);

  useEffect(() => {
    const hasStarted = Object.keys(answers).length > 0;
    if (hasStarted && !results && Platform.OS === 'web') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [answers, results]);

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

  const restart = () => {
    setResults(null);
    setStep(0);
    setAnswers({});
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
      <View className="flex-1" style={{ backgroundColor: mainBg }}>
        <WebContainer maxWidth={800} className="flex-1 px-6 items-center justify-start pt-2 pb-32">
          <View className="w-full rounded-[40px] p-10 shadow-sm items-center border border-neutral-100" style={{ backgroundColor: cardBg }}>
            <ThemedText className="text-4xl mb-2">✨</ThemedText>
            <ThemedText className="text-2xl font-black text-black text-center mb-1">Bilan terminé</ThemedText>
            <View className="h-24 w-24 rounded-full bg-white items-center justify-center mb-3 shadow-sm border border-neutral-200">
               <ThemedText className="text-4xl font-black text-black">{results.score}</ThemedText>
            </View>
            <ThemedText className="text-lg text-neutral-700 text-center mb-5 leading-7">
              {results.summary}
            </ThemedText>
            <TouchableOpacity 
              onPress={() => router.replace('/home')} 
              className="bg-black w-full py-5 rounded-full shadow-lg"
            >
              <ThemedText className="text-white text-center font-black tracking-widest uppercase">RETOUR À L'ACCUEIL</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={restart} 
              className="mt-4 w-full py-5 rounded-full border-2 border-black"
            >
              <ThemedText className="text-black text-center font-black tracking-widest uppercase">RECOMMENCER</ThemedText>
            </TouchableOpacity>
          </View>
        </WebContainer>
      </View>
    );
  }

  const currentQuestion = quiz.schema.questions[step];
  const progress = ((step + 1) / quiz.schema.questions.length) * 100;

  return (
    <View className="flex-1" style={{ backgroundColor: mainBg }}>
      <WebContainer maxWidth={800} className="flex-1 px-6 pt-0 pb-38">
        {/* Progress header aligned with settings button */}
        <View 
          style={{ 
            marginTop: isWeb ? 24 : insets.top + 16, 
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 44,
          }}
        >
          <TouchableOpacity 
            onPress={() => router.replace('/quiz')} 
            className="h-11 w-11 items-center justify-center rounded-full shadow-sm bg-[#F2F2F7]"
          >
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>
          <View className="rounded-full px-6 py-2 shadow-sm flex-1 mx-4 bg-[#F2F2F7]">
            <ThemedText className="text-black font-black uppercase tracking-widest text-[10px] text-center">
              Question {step + 1} / {quiz.schema.questions.length}
            </ThemedText>
          </View>
          <View className="w-11" />
        </View>

        <View className="mb-8 h-2 w-full bg-white/20 rounded-full overflow-hidden">
          <View 
            className="h-full bg-white rounded-full" 
            style={{ width: `${progress}%` }} 
          />
        </View>

        {/* Question Card */}
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', paddingTop: 0, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-[45px] p-10 shadow-sm border border-neutral-100 min-h-[400px] justify-center" style={{ backgroundColor: cardBg }}>
            <ThemedText className="text-2xl font-black text-black mb-6 text-center leading-10 tracking-tight">
              {currentQuestion.text}
            </ThemedText>

            <View className="gap-2">
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
        <View className="mt-4">
          <View className="flex-row justify-between gap-2">
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
          
          {(step > 0 || Object.keys(answers).length > 0) && !results && (
            <TouchableOpacity 
              onPress={restart}
              className="mt-3 self-center"
            >
              <ThemedText className="text-white/60 font-black text-[10px] uppercase tracking-widest">Recommencer le bilan</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </WebContainer>
    </View>
  );
}
