"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "@/lib/SidebarContext";
import {
  TrendingUp,
  Database,
  MessageSquare,
  Users,
  FileText,
  Brain,
  Activity,
  BarChart3,
  Loader,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface DetailedStats {
  knowledgeBase: {
    byType: {
      [key: string]: {
        totalDocuments: number;
        completedDocuments: number;
        processingDocuments: number;
        failedDocuments: number;
        totalChunks: number;
      };
    };
    overall: {
      totalDocuments: number;
      completedDocuments: number;
      totalChunks: number;
      avgChunksPerDocument: number;
    };
  };
  conversations: {
    byType: {
      [key: string]: {
        totalConversations: number;
        totalMessages: number;
        avgMessagesPerConversation: number;
      };
    };
    overall: {
      totalConversations: number;
      totalMessages: number;
      avgMessagesPerConversation: number;
    };
  };
}

export default function Statistics() {
  const { isDarkMode } = useSidebar();
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const kbResponse = await fetch(`${API_BASE_URL}/api/knowledge-base/stats`);
      const kbData = await kbResponse.json();

      const chatResponse = await fetch(`${API_BASE_URL}/api/chatbot/stats`);
      const chatData = await chatResponse.json();

      const processedStats: DetailedStats = {
        knowledgeBase: {
          byType: {},
          overall: {
            totalDocuments: 0,
            completedDocuments: 0,
            totalChunks: 0,
            avgChunksPerDocument: 0,
          },
        },
        conversations: {
          byType: {},
          overall: {
            totalConversations: 0,
            totalMessages: 0,
            avgMessagesPerConversation: 0,
          },
        },
      };

      if (kbData.success && kbData.data) {
        kbData.data.forEach((item: any) => {
          processedStats.knowledgeBase.byType[item._id] = {
            totalDocuments: item.totalDocuments,
            completedDocuments: item.completedDocuments,
            processingDocuments: item.processingDocuments,
            failedDocuments: item.failedDocuments,
            totalChunks: item.totalChunks,
          };

          processedStats.knowledgeBase.overall.totalDocuments += item.totalDocuments;
          processedStats.knowledgeBase.overall.completedDocuments += item.completedDocuments;
          processedStats.knowledgeBase.overall.totalChunks += item.totalChunks;
        });

        processedStats.knowledgeBase.overall.avgChunksPerDocument =
          processedStats.knowledgeBase.overall.totalDocuments > 0
            ? Math.round(
                processedStats.knowledgeBase.overall.totalChunks /
                  processedStats.knowledgeBase.overall.totalDocuments
              )
            : 0;
      }

      if (chatData.success && chatData.data) {
        chatData.data.forEach((item: any) => {
          processedStats.conversations.byType[item._id] = {
            totalConversations: item.totalConversations,
            totalMessages: item.totalMessages,
            avgMessagesPerConversation: Math.round(item.avgMessagesPerConversation || 0),
          };

          processedStats.conversations.overall.totalConversations += item.totalConversations;
          processedStats.conversations.overall.totalMessages += item.totalMessages;
        });

        processedStats.conversations.overall.avgMessagesPerConversation =
          processedStats.conversations.overall.totalConversations > 0
            ? Math.round(
                processedStats.conversations.overall.totalMessages /
                  processedStats.conversations.overall.totalConversations
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
      <div className={`border-b px-8 py-6 ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}>
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">AI Chatbot Statistics</h1>
            <p className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              Detailed analytics and performance metrics for your AI chatbot
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
            <Database className="w-10 h-10 mb-4 opacity-80" />
            <h3 className="text-3xl font-bold mb-1">
              {stats?.knowledgeBase.overall.totalDocuments || 0}
            </h3>
            <p className="text-sm text-blue-100">Total Documents</p>
            <div className="mt-3 text-xs opacity-90">
              {stats?.knowledgeBase.overall.completedDocuments || 0} completed
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <MessageSquare className="w-10 h-10 mb-4 opacity-80" />
            <h3 className="text-3xl font-bold mb-1">
              {stats?.conversations.overall.totalConversations || 0}
            </h3>
            <p className="text-sm text-green-100">Total Conversations</p>
            <div className="mt-3 text-xs opacity-90">
              {stats?.conversations.overall.totalMessages || 0} messages
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <Brain className="w-10 h-10 mb-4 opacity-80" />
            <h3 className="text-3xl font-bold mb-1">
              {stats?.knowledgeBase.overall.totalChunks || 0}
            </h3>
            <p className="text-sm text-purple-100">Knowledge Chunks</p>
            <div className="mt-3 text-xs opacity-90">
              {stats?.knowledgeBase.overall.avgChunksPerDocument || 0} avg per doc
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
            <Activity className="w-10 h-10 mb-4 opacity-80" />
            <h3 className="text-3xl font-bold mb-1">
              {stats?.conversations.overall.avgMessagesPerConversation || 0}
            </h3>
            <p className="text-sm text-orange-100">Avg Messages/Conv</p>
            <div className="mt-3 text-xs opacity-90">Engagement metric</div>
          </div>
        </div>

        {/* Knowledge Base by Type */}
        <div className={`rounded-xl shadow-sm p-6 mb-8 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Knowledge Base by Type</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <th className={`text-left py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Chatbot Type
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Documents
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Completed
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Processing
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Failed
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Chunks
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Coverage
                  </th>
                </tr>
              </thead>
              <tbody>
                {chatbotTypes.map((type) => {
                  const typeStats = stats?.knowledgeBase.byType[type.key];
                  const coveragePercent = stats?.knowledgeBase.overall.totalDocuments
                    ? Math.round(
                        ((typeStats?.totalDocuments || 0) /
                          stats.knowledgeBase.overall.totalDocuments) *
                          100
                      )
                    : 0;

                  return (
                    <tr
                      key={type.key}
                      className={`border-b ${
                        isDarkMode
                          ? "border-gray-700 hover:bg-gray-700/50"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
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
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">
                        {typeStats?.totalDocuments || 0}
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          {typeStats?.completedDocuments || 0}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {typeStats?.processingDocuments || 0}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          {typeStats?.failedDocuments || 0}
                        </span>
                      </td>
                      <td className={`text-center py-4 px-4 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {typeStats?.totalChunks || 0}
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <div className={`w-20 rounded-full h-2 ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}>
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${coveragePercent}%` }}
                            />
                          </div>
                          <span className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {coveragePercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversations by Type */}
        <div className={`rounded-xl shadow-sm p-6 mb-8 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Conversations by Type</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <th className={`text-left py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Chatbot Type
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Conversations
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Total Messages
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Avg Msgs/Conv
                  </th>
                  <th className={`text-center py-3 px-4 font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Engagement
                  </th>
                </tr>
              </thead>
              <tbody>
                {chatbotTypes.map((type) => {
                  const typeStats = stats?.conversations.byType[type.key];
                  const engagementPercent = stats?.conversations.overall.totalConversations
                    ? Math.round(
                        ((typeStats?.totalConversations || 0) /
                          stats.conversations.overall.totalConversations) *
                          100
                      )
                    : 0;

                  return (
                    <tr
                      key={type.key}
                      className={`border-b ${
                        isDarkMode
                          ? "border-gray-700 hover:bg-gray-700/50"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
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
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-4 font-semibold">
                        {typeStats?.totalConversations || 0}
                      </td>
                      <td className={`text-center py-4 px-4 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {typeStats?.totalMessages || 0}
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          {typeStats?.avgMessagesPerConversation || 0}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <div className={`w-20 rounded-full h-2 ${
                            isDarkMode ? "bg-gray-700" : "bg-gray-200"
                          }`}>
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${engagementPercent}%` }}
                            />
                          </div>
                          <span className={`text-sm ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {engagementPercent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Knowledge Base Health */}
          <div className={`rounded-xl shadow-sm p-6 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Knowledge Base Health</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Completion Rate
                  </span>
                  <span className="font-semibold">
                    {stats?.knowledgeBase.overall.totalDocuments
                      ? Math.round(
                          (stats.knowledgeBase.overall.completedDocuments /
                            stats.knowledgeBase.overall.totalDocuments) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}>
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        stats?.knowledgeBase.overall.totalDocuments
                          ? Math.round(
                              (stats.knowledgeBase.overall.completedDocuments /
                                stats.knowledgeBase.overall.totalDocuments) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Avg Chunks per Document
                  </span>
                  <span className="font-semibold">
                    {stats?.knowledgeBase.overall.avgChunksPerDocument || 0}
                  </span>
                </div>
                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Higher is better - more detailed knowledge extraction
                </p>
              </div>

              <div className={`pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    Total Vector Embeddings:
                  </span>
                  <span className="font-semibold">
                    {stats?.knowledgeBase.overall.totalChunks || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Metrics */}
          <div className={`rounded-xl shadow-sm p-6 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">Conversation Metrics</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Engagement Score
                  </span>
                  <span className="font-semibold">
                    {stats?.conversations.overall.avgMessagesPerConversation || 0}/10
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}>
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((stats?.conversations.overall.avgMessagesPerConversation || 0) / 10) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Based on average messages per conversation
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    Total Interactions
                  </span>
                  <span className="font-semibold">
                    {stats?.conversations.overall.totalMessages || 0}
                  </span>
                </div>
                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                  Combined user and AI messages
                </p>
              </div>

              <div className={`pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    Active Conversations:
                  </span>
                  <span className="font-semibold">
                    {stats?.conversations.overall.totalConversations || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
