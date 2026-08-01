import React, { useEffect, useState } from "react";
import {
  Sparkles, Code, ArrowRight, CheckCircle2, Cpu, FlaskConical,
  Map, HelpCircle, PlayCircle, ChevronRight, XCircle
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { ReflectionModal } from "../components/ReflectionModal";
import { SkeletonCard } from "../components/ui/Skeleton";
import { apiService } from "../api";
import type { VisualizerConcept } from "../api/types";

const TABS = [
  { id: "simulation", label: "Simulation", icon: <Cpu size={15} /> },
  { id: "code",       label: "Code Sandbox", icon: <Code size={15} /> },
  { id: "quiz",       label: "Quiz", icon: <HelpCircle size={15} /> },
  { id: "mindmap",    label: "Mind Map", icon: <Map size={15} /> },
];

const MINDMAP_NODES = [
  { id: "root", label: "Vector Embeddings", x: 50, y: 50, size: "lg" },
  { id: "n1", label: "Cosine Similarity", x: 15, y: 25, size: "md" },
  { id: "n2", label: "HNSW Indexing", x: 80, y: 20, size: "md" },
  { id: "n3", label: "Dot Product Math", x: 10, y: 65, size: "sm" },
  { id: "n4", label: "KNN Search", x: 85, y: 65, size: "sm" },
  { id: "n5", label: "RAG Pipelines", x: 50, y: 82, size: "sm" },
  { id: "n6", label: "Identity Vectors", x: 30, y: 15, size: "sm" },
];

export const LearningLabPage: React.FC = () => {
  const [concepts, setConcepts] = useState<VisualizerConcept[]>([]);
  const [activeConceptIdx, setActiveConceptIdx] = useState(0);
  const [activeStep, setActiveStep] = useState(1);
  const [activeTab, setActiveTab] = useState("simulation");
  const [loading, setLoading] = useState(true);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [reflectionOpen, setReflectionOpen] = useState(false);

  useEffect(() => {
    apiService.getVisualizerNotes().then(setConcepts).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12"><SkeletonCard rows={8} /></div>
  );
  if (!concepts.length) return null;

  const concept = concepts[activeConceptIdx];
  const quiz = concept.quizQuestions?.[quizIdx];

  const handleConceptChange = (idx: number) => {
    setActiveConceptIdx(idx);
    setActiveStep(1);
    setQuizAnswer(null);
    setQuizIdx(0);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-gray-900">Learning <span>Lab</span></h1>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-600" />
            <span>Interactive simulations, code sandboxes, quizzes & mind maps — all in one place.</span>
          </p>
        </div>
        <button
          onClick={() => setReflectionOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400 text-amber-950 text-xs hover:bg-amber-300 transition-colors cursor-pointer"
        >
          <FlaskConical size={14} />Log Reflection
        </button>
      </div>

      {/* Concept selector */}
      <div className="flex gap-2 flex-wrap">
        {concepts.map((c, idx) => (
          <button key={c.id} onClick={() => handleConceptChange(idx)}
            className={`px-4 py-2 rounded-full text-xs cursor-pointer transition-all border ${
              activeConceptIdx === idx
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white/60 text-gray-700 border-white/80 hover:bg-white/80"
            }`}>
            {c.concept}
          </button>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-white/80 w-fit">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs cursor-pointer transition-all ${
              activeTab === tab.id ? "bg-black text-white shadow-sm" : "text-gray-600 hover:bg-black/5"
            }`}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main content area */}
        <div className="lg:col-span-8">
          <Card className="space-y-5 border-white/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-2xs uppercase tracking-wider">{concept.concept}</span>
                <h2 className="text-xl text-gray-900 mt-1">{concept.title}</h2>
              </div>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {TABS.find(t => t.id === activeTab)?.label}
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{concept.description}</p>

            {/* ── Simulation Tab ── */}
            {activeTab === "simulation" && concept.executionTrace && (
              <div className="p-4 bg-zinc-900 rounded-2xl text-white space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
                  <span className="flex items-center gap-1.5"><Cpu size={14} className="text-amber-400" />PACER Execution Trace</span>
                  <span>Step {activeStep} of {concept.executionTrace.length}</span>
                </div>
                <div className="space-y-2">
                  {concept.executionTrace.map(item => {
                    const isCurrent = item.step === activeStep;
                    const isDone = item.step < activeStep;
                    return (
                      <div key={item.step} onClick={() => setActiveStep(item.step)}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isCurrent ? "bg-amber-400/20 border-amber-400 text-amber-200"
                          : isDone ? "bg-zinc-800/50 border-zinc-700 text-zinc-400"
                          : "bg-zinc-950 border-zinc-800 text-zinc-600"
                        }`}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-2xs">{item.step}</span>
                          <div><p>{item.title}</p><p className="text-2xs text-zinc-400">{item.detail}</p></div>
                        </div>
                        <span className="text-2xs font-mono bg-zinc-800 px-2 py-0.5 rounded text-amber-300 shrink-0 ml-2">{item.memoryState}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button disabled={activeStep <= 1} onClick={() => setActiveStep(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 text-xs disabled:opacity-40 cursor-pointer">Prev</button>
                  <button
                    disabled={activeStep >= concept.executionTrace.length}
                    onClick={() => {
                      if (activeStep < concept.executionTrace.length) setActiveStep(p => p + 1);
                      else setReflectionOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-full bg-amber-400 text-amber-950 text-xs hover:bg-amber-300 flex items-center gap-1 cursor-pointer">
                    {activeStep >= concept.executionTrace.length ? <><PlayCircle size={12} />Complete & Reflect</> : <><span>Step Forward</span><ArrowRight size={14} /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Code Sandbox Tab ── */}
            {activeTab === "code" && (
              <div className="p-4 bg-zinc-900 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
                  <span className="flex items-center gap-1.5 text-amber-400"><Code size={16} />Dry-Run Python Sandbox</span>
                  <span>Python 3.12</span>
                </div>
                <pre className="text-xs text-emerald-300 leading-relaxed overflow-x-auto p-2 bg-zinc-950/80 rounded-xl">
                  {concept.interactiveCodeSnippet}
                </pre>
                <button onClick={() => setReflectionOpen(true)}
                  className="w-full py-2 rounded-full bg-amber-400 text-amber-950 text-xs hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <PlayCircle size={14} />Mark Complete & Reflect
                </button>
              </div>
            )}

            {/* ── Quiz Tab ── */}
            {activeTab === "quiz" && (
              <div className="space-y-4">
                {quiz ? (
                  <>
                    <div className="p-4 bg-white/60 rounded-2xl border border-black/5">
                      <div className="text-2xs text-gray-500 uppercase tracking-wider mb-2">
                        Question {quizIdx + 1} of {concept.quizQuestions!.length}
                      </div>
                      <p className="text-sm text-gray-900">{quiz.question}</p>
                    </div>
                    <div className="space-y-2">
                      {quiz.options.map((opt, i) => {
                        const isSelected = quizAnswer === i;
                        const isCorrect = quizAnswer !== null && i === quiz.correctIndex;
                        const isWrong = quizAnswer !== null && isSelected && i !== quiz.correctIndex;
                        return (
                          <button key={i} onClick={() => setQuizAnswer(i)}
                            className={`w-full text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                              isCorrect ? "bg-emerald-100 border-emerald-400 text-emerald-900"
                              : isWrong ? "bg-red-100 border-red-400 text-red-900"
                              : isSelected ? "bg-amber-100 border-amber-400 text-amber-900"
                              : "bg-white/60 border-gray-200 hover:border-black/20"
                            }`}>
                            <span className="mr-2 font-mono">{String.fromCharCode(65 + i)}.</span>{opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizAnswer !== null && (
                      <div className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${quizAnswer === quiz.correctIndex ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                        {quizAnswer === quiz.correctIndex
                          ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                          : <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />}
                        <div>
                          <strong>{quizAnswer === quiz.correctIndex ? "Correct!" : "Incorrect."}</strong> {quiz.explanation}
                        </div>
                      </div>
                    )}
                    {quizAnswer !== null && quizIdx < concept.quizQuestions!.length - 1 && (
                      <button onClick={() => { setQuizIdx(q => q + 1); setQuizAnswer(null); }}
                        className="flex items-center gap-1 text-xs text-gray-700 hover:text-black cursor-pointer">
                        Next Question <ChevronRight size={14} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 text-sm text-gray-500">No quiz available for this concept yet.</div>
                )}
              </div>
            )}

            {/* ── Mind Map Tab ── */}
            {activeTab === "mindmap" && (
              <div className="relative w-full" style={{ height: 320 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
                  className="absolute inset-0 pointer-events-none">
                  {MINDMAP_NODES.slice(1).map(n => (
                    <line key={n.id} x1="50" y1="50" x2={n.x} y2={n.y}
                      stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="1,1" />
                  ))}
                </svg>
                {MINDMAP_NODES.map(n => {
                  const sizeClass = n.size === "lg" ? "w-20 h-20 text-xs" : n.size === "md" ? "w-16 h-16 text-2xs" : "w-12 h-12 text-2xs";
                  const colorClass = n.size === "lg" ? "bg-zinc-900 text-white" : n.size === "md" ? "bg-amber-400 text-amber-950" : "bg-white/80 text-gray-800 border border-gray-300";
                  return (
                    <div key={n.id} className={`absolute ${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-center p-1 cursor-pointer hover:scale-110 transition-transform shadow-sm`}
                      style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%,-50%) scale(1)" }}>
                      {n.label}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Key Takeaways */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs text-gray-900 uppercase tracking-wider">Key Insights</h3>
              {concept.keyTakeaways.map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />{t}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar — concept library */}
        <div className="lg:col-span-4">
          <Card className="space-y-3">
            <h3 className="text-sm text-gray-900">Simulation Library</h3>
            {concepts.map((c, idx) => (
              <div key={c.id} onClick={() => handleConceptChange(idx)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  activeConceptIdx === idx ? "bg-amber-50 border-amber-300 shadow-sm" : "bg-white/60 border-gray-200/80 hover:border-black/20"
                }`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs text-gray-900">{c.title}</h4>
                  <span className="text-2xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full shrink-0 ml-1">{c.concept}</span>
                </div>
                <p className="text-2xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <ReflectionModal open={reflectionOpen} lessonTitle={concept.title} onClose={() => setReflectionOpen(false)} />
    </div>
  );
};
