import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HelpCircle, MessageCircle, Trash2, Send, Loader2, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceQuestions() {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['pending-questions'],
    queryFn: () => api.get('/ecommerce/products/questions/pending').then(res => res.data),
    refetchInterval: 30000,
  });

  const answerMutation = useMutation({
    mutationFn: ({ productId, questionId, answer }) =>
      api.put(`/ecommerce/products/${productId}/questions/${questionId}/answer`, { answer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-questions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ productId, questionId }) =>
      api.delete(`/ecommerce/products/${productId}/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-questions'] });
    },
  });

  const pendingQuestions = data?.questions || [];

  const handleAnswer = (productId, questionId) => {
    const answer = answers[questionId];
    if (!answer?.trim()) return;
    answerMutation.mutate({ productId, questionId, answer });
    setAnswers({ ...answers, [questionId]: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-7 h-7 text-indigo-600" /> Product Q&A
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Answer customer questions about your products</p>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Pending</p>
            <p className="text-xl font-bold text-amber-600">{pendingQuestions.length}</p>
          </div>
        </div>
      </div>

      {/* Questions list */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : pendingQuestions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="font-bold text-gray-400">All caught up! No pending questions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingQuestions.map(q => (
            <div key={q._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white">{q.question}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {q.askerName && <span>{q.askerName}</span>}
                    {q.askerEmail && <span>· {q.askerEmail}</span>}
                    <span>· {new Date(q.createdAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="text-sm text-indigo-600 font-bold mt-2">Product: {q.productTitle}</p>
                </div>
                <button
                  onClick={() => { if (confirm('Delete this question?')) deleteMutation.mutate({ productId: q.productId, questionId: q._id }); }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2 pl-13">
                <textarea
                  value={answers[q._id] || ''}
                  onChange={e => setAnswers({ ...answers, [q._id]: e.target.value })}
                  placeholder="Type your answer..."
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm resize-none"
                />
                <button
                  onClick={() => handleAnswer(q.productId, q._id)}
                  disabled={!answers[q._id]?.trim() || answerMutation.isPending}
                  className="self-end px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={14} /> Answer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
