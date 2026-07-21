import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Headphones, FileText, Mic, ChevronRight, 
  CheckCircle, XCircle, ArrowRight, Volume2, RotateCcw,
  Play, Square, Loader
} from 'lucide-react';

export default function PracticeArena({ token, API_URL, user, updateCoinsAndXP, triggerAchievementModal }) {
  const [category, setCategory] = useState(localStorage.getItem('selected_practice_category') || 'Reading');
  const [difficulty, setDifficulty] = useState(localStorage.getItem('selected_practice_difficulty') || 'All');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 });
  const [writingText, setWritingText] = useState('');
  const [speakingState, setSpeakingState] = useState('idle'); // idle, recording, submitted
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioIntervalRef = useRef(null);
  const autoNextTimeoutRef = useRef(null);
  const [autoNextCountdown, setAutoNextCountdown] = useState(null);

  const categories = [
    { id: 'Reading', label: 'Reading', icon: <BookOpen size={16} /> },
    { id: 'Listening', label: 'Listening', icon: <Headphones size={16} /> },
    { id: 'Writing', label: 'Writing', icon: <FileText size={16} /> },
    { id: 'Speaking', label: 'Speaking', icon: <Mic size={16} /> },
  ];

  useEffect(() => {
    const savedCat = localStorage.getItem('selected_practice_category');
    if (savedCat) setCategory(savedCat);
    const savedDiff = localStorage.getItem('selected_practice_difficulty');
    if (savedDiff) setDifficulty(savedDiff);

    return () => {
      if (autoNextTimeoutRef.current) clearInterval(autoNextTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    fetchQuestions();
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setFeedback(null);
    setWritingText('');
    setSpeakingState('idle');
    setSessionScore({ correct: 0, total: 0 });
    stopAudio();
    
    // Cleanup speech synthesis on unmount
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [category, difficulty]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/questions?category=${category}&difficulty=${difficulty}&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Backend returns { total, questions } or direct array
        setQuestions(Array.isArray(data) ? data : (data.questions || []));
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (option) => {
    if (isAnswered || submitting) return;
    const q = questions[currentIndex];
    setSelectedOption(option);
    setIsAnswered(true);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/questions/${q.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userAnswer: option })
      });
      if (res.ok) {
        const data = await res.json();
        // Backend returns isCorrect, correctOption, explanation, newCoins, newXP, newLevel
        const feedbackData = {
          correct: data.isCorrect,
          correctOption: data.correctOption,
          explanation: data.explanation,
          xpGained: data.xpGained,
          coinsGained: data.coinsGained,
        };
        setFeedback(feedbackData);
        if (data.isCorrect) {
          setSessionScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        } else {
          setSessionScore(prev => ({ ...prev, total: prev.total + 1 }));
        }
        if (data.newCoins !== undefined) {
          updateCoinsAndXP(data.newCoins, data.newXP, data.newLevel);
        }
        if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
          triggerAchievementModal(data.unlockedAchievements[0]);
        }
        // Start 3s auto-advance timer for Reading/Listening
        startAutoNextTimer(3);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const submitWriting = async () => {
    if (!writingText.trim() || submitting) return;
    const q = questions[currentIndex];
    setSubmitting(true);
    setIsAnswered(true);

    try {
      const res = await fetch(`${API_URL}/questions/${q.id}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userAnswer: writingText })
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback({
          isWriting: true,
          evaluation: data.evaluation,
          bandScore: data.bandScore,
          criteria: data.criteria,
          suggestions: data.suggestions,
          xpGained: data.xpGained,
          coinsGained: data.coinsGained
        });
        if (data.newCoins !== undefined) {
          updateCoinsAndXP(data.newCoins, data.newXP, data.newLevel);
        }
        if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
          triggerAchievementModal(data.unlockedAchievements[0]);
        }
        setSessionScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        // Start 10s auto-advance timer for Writing
        startAutoNextTimer(10);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Evaluation failed');
        setIsAnswered(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred during evaluation');
      setIsAnswered(false);
    } finally {
      setSubmitting(false);
    }
  };

  const submitSpeaking = async () => {
    const q = questions[currentIndex];
    setSpeakingState('submitted');
    setIsAnswered(true);
    setSubmitting(true);

    const mockTranscript = "In my opinion, taking a memorable journey is a great way to expand one's horizons. Last year, I traveled to Samarkand by the high-speed Afrosiyob train. I went with my family and friends, and we visited the historic Registan square. It was highly memorable because of the stunning ancient Islamic architecture and the warm hospitality of local people.";

    try {
      const res = await fetch(`${API_URL}/questions/${q.id}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userAnswer: mockTranscript })
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback({
          isSpeaking: true,
          evaluation: data.evaluation,
          bandScore: data.bandScore,
          criteria: data.criteria,
          suggestions: data.suggestions,
          xpGained: data.xpGained,
          coinsGained: data.coinsGained
        });
        if (data.newCoins !== undefined) {
          updateCoinsAndXP(data.newCoins, data.newXP, data.newLevel);
        }
        if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
          triggerAchievementModal(data.unlockedAchievements[0]);
        }
        setSessionScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        // Start 10s auto-advance timer for Speaking
        startAutoNextTimer(10);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Evaluation failed');
        setIsAnswered(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred during evaluation');
      setIsAnswered(false);
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (autoNextTimeoutRef.current) {
      clearInterval(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }
    setAutoNextCountdown(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      fetchQuestions();
      setCurrentIndex(0);
    }
    setSelectedOption(null);
    setIsAnswered(false);
    setFeedback(null);
    setWritingText('');
    setSpeakingState('idle');
    stopAudio();
    setAudioProgress(0);
  };

  const startAutoNextTimer = (seconds) => {
    setAutoNextCountdown(seconds);
    if (autoNextTimeoutRef.current) clearInterval(autoNextTimeoutRef.current);
    
    autoNextTimeoutRef.current = setInterval(() => {
      setAutoNextCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(autoNextTimeoutRef.current);
          autoNextTimeoutRef.current = null;
          nextQuestion();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert("Your browser does not support text-to-speech!");
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const q = questions[currentIndex];
    const textToRead = q?.passage || "No audio text available.";

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'en-GB'; // British English for IELTS
    utterance.rate = 0.9;

    utterance.onend = () => {
      setAudioPlaying(false);
      setAudioProgress(100);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };

    utterance.onerror = () => {
      setAudioPlaying(false);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };

    window.speechSynthesis.speak(utterance);
    setAudioPlaying(true);
    setAudioProgress(0);

    // Estimate duration based on average speaking rate (150 words per min)
    const words = textToRead.split(' ').length;
    const estimatedDurationMs = (words / 150) * 60 * 1000;
    const intervalMs = estimatedDurationMs / 100;

    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    audioIntervalRef.current = setInterval(() => {
      setAudioProgress(prev => {
        if (prev >= 99 || !window.speechSynthesis.speaking) {
          clearInterval(audioIntervalRef.current);
          return 100;
        }
        return prev + 1;
      });
    }, intervalMs || 100);
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    setAudioPlaying(false);
  };

  const switchCategory = (cat) => {
    localStorage.setItem('selected_practice_category', cat);
    setCategory(cat);
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', position: 'relative', minHeight: '400px', justifyContent: 'center' }}>
        <div className="scanner-line" />
        <h3 className="text-gradient" style={{ fontSize: '20px' }}>Loading IELTS Arena...</h3>
        <p style={{ color: 'var(--text-muted)' }}>Fetching {category} questions from database</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No questions found for {category}</h3>
        <button onClick={fetchQuestions} className="glow-btn" style={{ marginTop: '16px' }}>
          <RotateCcw size={16} /> Retry
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];
  let parsedOptions = [];
  try {
    if (Array.isArray(q.options)) {
      parsedOptions = q.options;
    } else if (q.options) {
      parsedOptions = JSON.parse(q.options);
    }
  } catch(e) { 
    parsedOptions = []; 
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fade-in 0.3s ease' }}>
      
      {/* Category Tabs */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => switchCategory(cat.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '20px', border: 'none',
                background: category === cat.id ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                color: category === cat.id ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer', fontWeight: '600', fontSize: '13px',
                transition: 'all 0.2s ease',
                boxShadow: category === cat.id ? '0 4px 12px var(--primary-glow)' : 'none'
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            value={difficulty}
            onChange={(e) => {
              const diff = e.target.value;
              localStorage.setItem('selected_practice_difficulty', diff);
              setDifficulty(diff);
            }}
            style={{
              padding: '6px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '13px', outline: 'none', cursor: 'pointer'
            }}
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Elementary">Elementary</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <span style={{ color: '#10b981', fontWeight: '700' }}>{sessionScore.correct}</span>
            <span> / {sessionScore.total} correct this session</span>
          </div>
        </div>
      </div>

      {/* Question Workspace */}
      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Question Header */}
        <div className="arena-header">
          <div>
            <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {q.category} · {q.subCategory} · <span style={{ color: '#fbbf24' }}>{q.difficulty || 'Intermediate'}</span>
            </span>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '4px' }}>{q.title}</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Q {currentIndex + 1} / {questions.length}</span>
            <div style={{ fontSize: '13px', color: '#fbbf24', fontWeight: '700', marginTop: '2px' }}>+{q.points} pts</div>
          </div>
        </div>

        {/* Listening Audio Player */}
        {category === 'Listening' && (
          <div className="mock-audio-player">
            <button
              onClick={audioPlaying ? stopAudio : playAudio}
              style={{ 
                background: audioPlaying ? 'rgba(239,68,68,0.2)' : 'var(--primary-gradient)',
                border: 'none', color: 'white', borderRadius: '50%',
                width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {audioPlaying ? <Square size={18} /> : <Play size={18} />}
            </button>
            <Volume2 size={18} style={{ color: 'var(--text-muted)' }} />
            <div className="audio-progress-bar">
              <div className="audio-progress-fill" style={{ width: `${audioProgress}%` }} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '40px' }}>
              {audioPlaying ? `${Math.floor(audioProgress * 0.25)}s` : audioProgress === 100 ? 'Done' : '0:25'}
            </span>
          </div>
        )}

        <div className="workspace-container">
          {/* Passage Panel */}
          <div className="glass-panel passage-panel">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              {category === 'Listening' ? '🎧 Audio Transcript / Context' : category === 'Writing' ? '📝 Task Prompt' : category === 'Speaking' ? '🎙️ Cue Card' : '📖 Passage'}
            </span>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#e2e8f0' }}>{q.passage}</p>
          </div>

          {/* Answer Panel */}
          <div className="question-panel glass-panel">
            <div>
              <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px', lineHeight: '1.5' }}>{q.questionText}</p>

              {/* MCQ Options */}
              {parsedOptions.length > 0 && category !== 'Writing' && category !== 'Speaking' && (
                <div className="options-list">
                  {parsedOptions.map((opt, i) => {
                    let cls = 'option-button';
                    if (isAnswered) {
                      const letter = String.fromCharCode(65 + i);
                      if (letter === q.correctOption) cls += ' correct';
                      else if (opt === selectedOption || letter === selectedOption) cls += ' wrong';
                    } else if (selectedOption === opt || selectedOption === String.fromCharCode(65 + i)) {
                      cls += ' selected';
                    }
                    return (
                      <button
                        key={i}
                        className={cls}
                        disabled={isAnswered}
                        onClick={() => submitAnswer(String.fromCharCode(65 + i))}
                      >
                        {isAnswered && String.fromCharCode(65 + i) === q.correctOption && (
                          <CheckCircle size={16} style={{ color: '#10b981', marginRight: '8px', display: 'inline' }} />
                        )}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Writing Input */}
              {category === 'Writing' && (
                <div style={{ marginTop: '16px' }}>
                  <textarea
                    className="writing-textarea"
                    value={writingText}
                    onChange={(e) => setWritingText(e.target.value)}
                    placeholder="Write your IELTS Task 2 essay here... (minimum 250 words)"
                    disabled={isAnswered}
                    style={{ height: '280px' }}
                  />
                  <div className="word-count-badge">
                    {writingText.split(/\s+/).filter(Boolean).length} words
                    {writingText.split(/\s+/).filter(Boolean).length >= 250 && (
                      <span style={{ color: '#10b981', marginLeft: '8px' }}>✓ Minimum reached</span>
                    )}
                  </div>
                </div>
              )}

              {/* Speaking Section */}
              {category === 'Speaking' && (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: speakingState === 'recording' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `3px solid ${speakingState === 'recording' ? '#ef4444' : 'var(--border-color)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: speakingState === 'recording' ? '0 0 30px rgba(239,68,68,0.4)' : 'none',
                    transition: 'all 0.3s ease',
                    animation: speakingState === 'recording' ? 'pulse-glow 1.5s infinite' : 'none'
                  }}>
                    <Mic size={40} style={{ color: speakingState === 'recording' ? '#ef4444' : 'var(--text-muted)' }} />
                  </div>
                  {speakingState === 'idle' && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Prepare for 1 minute, then press Record to simulate speaking
                    </p>
                  )}
                  {speakingState === 'recording' && (
                    <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: '700', textAlign: 'center' }}>
                      🔴 Recording... Speak naturally for 2 minutes
                    </p>
                  )}
                  {speakingState === 'submitted' && submitting && (
                    <p style={{ fontSize: '13px', color: 'var(--primary)', textAlign: 'center' }}>
                      <Loader size={14} style={{ display: 'inline', marginRight: '6px' }} />
                      Saving your response...
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isAnswered ? (
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                {category === 'Writing' && (
                  <button
                    onClick={submitWriting}
                    disabled={writingText.split(/\s+/).filter(Boolean).length < 50 || submitting}
                    className="glow-btn"
                    style={{ width: '100%' }}
                  >
                    {submitting ? <><Loader size={16} /> Saving...</> : 'Submit Essay'}
                  </button>
                )}
                {category === 'Speaking' && (
                  <div style={{ width: '100%', display: 'flex', gap: '12px' }}>
                    {speakingState === 'idle' && (
                      <button
                        onClick={() => setSpeakingState('recording')}
                        className="glow-btn"
                        style={{ flex: 1 }}
                      >
                        <Mic size={16} /> Start Recording
                      </button>
                    )}
                    {speakingState === 'recording' && (
                      <button
                        onClick={submitSpeaking}
                        style={{ 
                          flex: 1, background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444',
                          color: '#ef4444', borderRadius: '10px', padding: '12px', cursor: 'pointer',
                          fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                      >
                        <Square size={16} /> Stop & Save
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Feedback */
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {feedback && (
                  <div style={{
                    padding: '16px',
                    background: feedback.correct ? 'rgba(16,185,129,0.1)' : feedback.isWriting || feedback.isSpeaking ? 'rgba(99,102,241,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${feedback.correct ? '#10b981' : feedback.isWriting || feedback.isSpeaking ? 'var(--primary)' : '#ef4444'}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {(feedback.isWriting || feedback.isSpeaking) ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                          <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '16px' }}>
                            {feedback.isWriting ? '✍️ Writing Simulator Result' : '🎙️ Speaking Lounge Result'}
                          </span>
                          {feedback.bandScore && (
                            <span style={{ background: 'var(--primary-gradient)', color: 'white', padding: '6px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '15px', boxShadow: '0 0 10px var(--primary-glow)' }}>
                              IELTS Band {feedback.bandScore}
                            </span>
                          )}
                        </div>
                        
                        <p style={{ color: '#e2e8f0', whiteSpace: 'pre-line', marginBottom: '16px', fontWeight: '500' }}>
                          {feedback.evaluation}
                        </p>

                        {feedback.criteria && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Criteria Assessment</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                              <div><strong>Coherence & Fluency:</strong> <span style={{ color: '#cbd5e1', fontSize: '13px', display: 'block' }}>{feedback.criteria.coherence}</span></div>
                              <div><strong>Lexical Resource:</strong> <span style={{ color: '#cbd5e1', fontSize: '13px', display: 'block' }}>{feedback.criteria.lexical}</span></div>
                              <div><strong>Grammar Accuracy:</strong> <span style={{ color: '#cbd5e1', fontSize: '13px', display: 'block' }}>{feedback.criteria.grammar}</span></div>
                              <div><strong>Task Achievement:</strong> <span style={{ color: '#cbd5e1', fontSize: '13px', display: 'block' }}>{feedback.criteria.task}</span></div>
                            </div>
                          </div>
                        )}

                        {feedback.suggestions && feedback.suggestions.length > 0 && (
                          <div style={{ background: 'rgba(251,191,36,0.05)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.2)', marginBottom: '12px' }}>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Dr. Diana's Suggestions</span>
                            <ul style={{ paddingLeft: '20px', margin: '0', display: 'flex', flexDirection: 'column', gap: '6px', color: '#e2e8f0' }}>
                              {feedback.suggestions.map((sug, sidx) => (
                                <li key={sidx} style={{ fontSize: '13px' }}>{sug}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '700' }}>
                          <span style={{ color: 'var(--primary)' }}>+{feedback.xpGained || 20} XP Earned</span>
                          <span style={{ color: '#fbbf24' }}>+{feedback.coinsGained || 10} Coins Received</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          {feedback.correct ? <CheckCircle size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                          <span style={{ fontWeight: '700', color: feedback.correct ? '#10b981' : '#ef4444' }}>
                            {feedback.correct ? 'Correct! +' + q.points + ' pts' : 'Incorrect'}
                          </span>
                        </div>
                        {!feedback.correct && feedback.correctOption && (
                          <div style={{ marginBottom: '12px', padding: '10px', background: 'rgba(16,185,129,0.15)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                            <span style={{ fontWeight: '700', color: '#10b981', display: 'block', marginBottom: '4px' }}>To'g'ri javob:</span>
                            <span style={{ color: '#fff' }}>
                              {parsedOptions && parsedOptions.length > 0 && typeof feedback.correctOption === 'string'
                                ? parsedOptions[feedback.correctOption.charCodeAt(0) - 65] || feedback.correctOption
                                : feedback.correctOption}
                            </span>
                          </div>
                        )}
                        <p style={{ color: '#e2e8f0' }}>{q.explanation || feedback.explanation}</p>
                      </>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', alignSelf: 'flex-end' }}>
                  {autoNextCountdown !== null && (
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontWeight: '600'
                    }}>
                      ⏱ {autoNextCountdown}s da o'tadi
                    </span>
                  )}
                  <button onClick={nextQuestion} className="glow-btn">
                    Keyingi savol <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
