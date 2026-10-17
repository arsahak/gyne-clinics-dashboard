"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  MessageSquare,
  TrendingUp,
  FileText,
  Brain,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  ArrowRight,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Stats {
  knowledgeBase: {
    totalDocuments: number;
    completedDocuments: number;
    processingDocuments: number;
    failedDocuments: number;
    totalChunks: number;
  };
  conversations: {
    totalConversations: number;
    totalMessages: number;
    avgMessagesPerConversation: number;
  };
  byType: {
    [key: string]: {
      documents: number;
      conversations: number;
    };
  };
}

export default function AIChatbotDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const kbResponse = await fetch(`${API_BASE_URL}/api/knowledge-base/stats`);
      const kbData = await kbResponse.json();

      const chatResponse = await fetch(`${API_BASE_URL}/api/chatbot/stats`);
      const chatData = await chatResponse.json();

      const processedStats: Stats = {
        knowledgeBase: {
          totalDocuments: 0,
          completedDocuments: 0,
          processingDocuments: 0,
          failedDocuments: 0,
          totalChunks: 0,
        },
        conversations: {
          totalConversations: 0,
          totalMessages: 0,
          avgMessagesPerConversation: 0,
        },
        byType: {},
      };

      if (kbData.success && kbData.data) {
        kbData.data.forEach((item: any) => {
          processedStats.knowledgeBase.totalDocuments += item.totalDocuments;
          processedStats.knowledgeBase.completedDocuments += item.completedDocuments;
          processedStats.knowledgeBase.processingDocuments += item.processingDocuments;
          processedStats.knowledgeBase.failedDocuments += item.failedDocuments;
          processedStats.knowledgeBase.totalChunks += item.totalChunks;

          processedStats.byType[item._id] = {
            documents: item.totalDocuments,
            conversations: 0,
          };
        });
      }

      if (chatData.success && chatData.data) {
        chatData.data.forEach((item: any) => {
          processedStats.conversations.totalConversations += item.totalConversations;
          processedStats.conversations.totalMessages += item.totalMessages;

          if (processedStats.byType[item._id]) {
            processedStats.byType[item._id].conversations = item.totalConversations;
          } else {
            processedStats.byType[item._id] = {
              documents: 0,
              conversations: item.totalConversations,
            };
          }
        });

        processedStats.conversations.avgMessagesPerConversation =
          processedStats.conversations.totalConversations > 0
            ? Math.round(
                processedStats.conversations.totalMessages /
                  processedStats.conversations.totalConversations
              )
            : 0;
      }

      setStats(processedStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const chatbotTypes = [
    { key: "general", label: "General Gynaecology", color: "blue" },
    { key: "urogynaecology", label: "Urogynaecology", color: "purple" },
    { key: "aesthetic", label: "Aesthetic Gynaecology", color: "pink" },
    { key: "menopause", label: "Menopause", color: "orange" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Chatbot Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your AI knowledge base and monitor chatbot conversations
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-blue-500" />
              <span className="text-xs font-semibold text-blue-500 bg-blue-100 px-2 py-1 rounded-full">
                KB
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.knowledgeBase.totalDocuments || 0}
            </h3>
            <p className="text-sm text-gray-600">Total Documents</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">
                {stats?.knowledgeBase.completedDocuments || 0} completed
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-green-500" />
              <span className="text-xs font-semibold text-green-500 bg-green-100 px-2 py-1 rounded-full">
                CHAT
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.conversations.totalConversations || 0}
            </h3>
            <p className="text-sm text-gray-600">Conversations</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">
                {stats?.conversations.avgMessagesPerConversation || 0} avg msgs/conv
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-purple-500" />
              <span className="text-xs font-semibold text-purple-500 bg-purple-100 px-2 py-1 rounded-full">
                CHUNKS
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.knowledgeBase.totalChunks || 0}
            </h3>
            <p className="text-sm text-gray-600">Knowledge Chunks</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-gray-600">Vector embeddings stored</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-orange-500" />
              <span className="text-xs font-semibold text-orange-500 bg-orange-100 px-2 py-1 rounded-full">
                TOTAL
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {stats?.conversations.totalMessages || 0}
            </h3>
            <p className="text-sm text-gray-600">Total Messages</p>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <MessageSquare className="w-4 h-4 text-orange-500" />
              <span className="text-gray-600">User & AI messages</span>
            </div>
          </div>
        </div>

        {/* Processing Status */}
        {stats && stats.knowledgeBase.processingDocuments > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader className="w-5 h-5 text-blue-500 animate-spin" />
              <div>
                <h3 className="font-semibold text-blue-900">Processing Documents</h3>
                <p className="text-sm text-blue-700">
                  {stats.knowledgeBase.processingDocuments} document(s) are currently being
                  processed. This may take a few minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Failed Documents Alert */}
        {stats && stats.knowledgeBase.failedDocuments > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-lg">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-900">Failed Processing</h3>
                <p className="text-sm text-red-700">
                  {stats.knowledgeBase.failedDocuments} document(s) failed to process. Please
                  check and re-upload.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/ai-chatbot/knowledge-base">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
              <Database className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Train AI</h3>
              <p className="text-sm text-blue-100 mb-4">
                Upload PDFs to expand the chatbot's knowledge base
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                Upload Documents <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/ai-chatbot/conversations">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
              <MessageSquare className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Conversations</h3>
              <p className="text-sm text-green-100 mb-4">
                View and analyze user conversations with the AI
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                View History <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/ai-chatbot/stats">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white hover:shadow-lg transition-shadow cursor-pointer">
              <TrendingUp className="w-10 h-10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Statistics</h3>
              <p className="text-sm text-purple-100 mb-4">
                Detailed analytics and performance metrics
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold">
                View Stats <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>

        {/* Chatbot Types Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Chatbot Types Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {chatbotTypes.map((type) => {
              const typeStats = stats?.byType[type.key];
              return (
                <div
                  key={type.key}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">{type.label}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Documents:</span>
                      <span className="font-semibold text-gray-900">
                        {typeStats?.documents || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Conversations:</span>
                      <span className="font-semibold text-gray-900">
                        {typeStats?.conversations || 0}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full`}
                        style={{
                          width: `${
                            typeStats?.documents
                              ? Math.min(
                                  (typeStats.documents /
                                    (stats?.knowledgeBase.totalDocuments || 1)) *
                                    100,
                                  100
                                )
                              : 0
                          }%`,
                          backgroundColor:
                            type.color === "blue"
                              ? "#3b82f6"
                              : type.color === "purple"
                              ? "#a855f7"
                              : type.color === "pink"
                              ? "#ec4899"
                              : "#f97316",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Setup Guide (if no documents) */}
        {stats && stats.knowledgeBase.totalDocuments === 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 mb-2">Get Started with AI Chatbot</h3>
                <p className="text-sm text-yellow-800 mb-4">
                  You haven't uploaded any documents yet. Upload PDFs to train your AI chatbot:
                </p>
                <ol className="text-sm text-yellow-800 space-y-2 mb-4 list-decimal list-inside">
                  <li>
                    Go to <strong>Train AI</strong> page
                  </li>
                  <li>
                    Select chatbot type (General, Urogynaecology, Aesthetic, or Menopause)
                  </li>
                  <li>Upload PDF documents (medical guides, FAQs, treatment info)</li>
                  <li>Wait for processing to complete</li>
                  <li>Test the chatbot on your website!</li>
                </ol>
                <Link
                  href="/ai-chatbot/knowledge-base"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold text-sm transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Upload Your First Document
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
