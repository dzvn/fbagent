import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://100.90.217.46:9001";

interface ApiContextType {
  API_BASE: string;
  stats: any;
  rules: any[];
  kbItems: any[];
  models: any[];
  currentConfig: any;
  useLLM: boolean;
  setUseLLM: (value: boolean) => void;
  fetchStats: () => Promise<void>;
  fetchRules: () => Promise<void>;
  fetchKB: () => Promise<void>;
  fetchModels: () => Promise<void>;
  testLangGraph: (message: string) => Promise<any>;
  testLLMAgent: (message: string) => Promise<any>;
  testOldAutoReply: (message: string) => Promise<any>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [kbItems, setKbItems] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [useLLM, setUseLLM] = useState(true);

  useEffect(() => {
    console.log("API_BASE:", API_BASE);
    fetchStats();
    fetchRules();
    fetchKB();
    fetchModels();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`);
      setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auto-reply/rules`);
      setRules(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKB = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/knowledge`);
      setKbItems(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/models`);
      const data = await res.json();
      setModels(data.models);
      setCurrentConfig(data.currentConfig);
    } catch (e) {
      console.error(e);
    }
  };

  const testLangGraph = async (message: string) => {
    const res = await fetch(`${API_BASE}/api/langgraph/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        senderId: "frontend_user",
        pageId: "frontend_page",
        useLLM,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  };

  const testLLMAgent = async (message: string) => {
    const res = await fetch(`${API_BASE}/api/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationHistory: [] }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  };

  const testOldAutoReply = async (message: string) => {
    const res = await fetch(`${API_BASE}/api/auto-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  };

  return (
    <ApiContext.Provider
      value={{
        API_BASE,
        stats,
        rules,
        kbItems,
        models,
        currentConfig,
        useLLM,
        setUseLLM,
        fetchStats,
        fetchRules,
        fetchKB,
        fetchModels,
        testLangGraph,
        testLLMAgent,
        testOldAutoReply,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
}
