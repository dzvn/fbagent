import { useState, useEffect } from "react";

// Use host IP instead of localhost for Docker
const API_BASE = import.meta.env.VITE_API_URL || "http://100.90.217.46:9001";

function App() {
  const [activeTab, setActiveTab] = useState("langgraph");
  const [stats, setStats] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [kbItems, setKbItems] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [currentConfig, setCurrentConfig] = useState<any>(null);

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
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auto-reply/rules`);
      setRules(await res.json());
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    }
  };

  const fetchKB = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/knowledge`);
      setKbItems(await res.json());
    } catch (error) {
      console.error("Failed to fetch KB:", error);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/models`);
      const data = await res.json();
      setModels(data.models);
      setCurrentConfig(data.currentConfig);
    } catch (error) {
      console.error("Failed to fetch models:", error);
    }
  };

  const testLangGraph = async () => {
    setLoading(true);
    try {
      console.log("Calling LangGraph API:", `${API_BASE}/api/langgraph/process`);
      const res = await fetch(`${API_BASE}/api/langgraph/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: testMessage,
          senderId: "frontend_user",
          pageId: "frontend_page"
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTestResponse(await res.json());
    } catch (error) {
      console.error("LangGraph error:", error);
      setTestResponse({ error: error instanceof Error ? error.message : "Unknown error", source: "error" });
    }
    setLoading(false);
  };

  const testLLMAgent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: testMessage,
          conversationHistory: []
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTestResponse(await res.json());
    } catch (error) {
      console.error("LLM Agent error:", error);
      setTestResponse({ error: error instanceof Error ? error.message : "Unknown error", source: "error" });
    }
    setLoading(false);
  };

  const testOldAutoReply = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auto-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMessage })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTestResponse(await res.json());
    } catch (error) {
      console.error("Auto-reply error:", error);
      setTestResponse({ error: error instanceof Error ? error.message : "Unknown error", source: "error" });
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100vh", background: "#f4f4f4" }}>
      <header style={{ background: "#1E3A5F", color: "white", padding: "20px" }}>
        <h1 style={{ margin: 0 }}>🤖 FB Agent Dashboard v0.2.0</h1>
        <p style={{ margin: "5px 0 0", opacity: 0.8 }}>LangChain + LangGraph Integration</p>
        <div style={{ marginTop: "10px", fontSize: "13px", background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "8px" }}>
          🔗 API: <strong>{API_BASE}</strong> | 
          📦 Model: <strong>{currentConfig?.provider}/{currentConfig?.model}</strong> | 
          Temp: {currentConfig?.temperature}
        </div>
      </header>

      <nav style={{ background: "white", padding: "10px 20px", borderBottom: "1px solid #ddd", display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {["langgraph", "llm-agent", "old-reply", "knowledge", "rules", "models"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: activeTab === tab ? "#C9A945" : "#f0f0f0",
              color: activeTab === tab ? "#1E3A5F" : "#333",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              textTransform: "capitalize"
            }}
          >
            {tab === "llm-agent" ? "🤖 LLM Agent" : tab === "old-reply" ? "📝 Old Reply" : tab === "langgraph" ? "🧠 LangGraph" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
        {(activeTab === "langgraph" || activeTab === "llm-agent" || activeTab === "old-reply") && (
          <div>
            <h2 style={{ color: "#1E3A5F" }}>
              {activeTab === "langgraph" ? "🧠 Test LangGraph Workflow" : 
               activeTab === "llm-agent" ? "🤖 Test LLM ReAct Agent" : "📝 Test Old Auto-Reply"}
            </h2>
            <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder={activeTab === "langgraph" ? "Try: \"i want to buy product\" or \"giá bao nhiêu\"" : 
                           activeTab === "llm-agent" ? "Ask anything to LLM..." : "Test old rule-based reply..."}
                style={{ width: "100%", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", minHeight: "100px", fontFamily: "inherit" }}
              />
              <button
                onClick={activeTab === "langgraph" ? testLangGraph : activeTab === "llm-agent" ? testLLMAgent : testOldAutoReply}
                disabled={loading || !testMessage.trim()}
                style={{ 
                  marginTop: "15px", 
                  padding: "12px 30px", 
                  background: loading || !testMessage.trim() ? "#ccc" : "#C9A945", 
                  color: "#1E3A5F", 
                  border: "none", 
                  borderRadius: "8px", 
                  fontWeight: "600", 
                  cursor: loading || !testMessage.trim() ? "not-allowed" : "pointer" 
                }}
              >
                {loading ? "⏳ Processing..." : "🚀 Test"}
              </button>
              {testResponse && (
                <div style={{ marginTop: "20px", padding: "15px", background: testResponse.error ? "#ffebee" : "#e8f5e9", borderRadius: "8px", border: testResponse.error ? "1px solid #f44336" : "1px solid #4caf50" }}>
                  <strong>Response:</strong>
                  <p style={{ margin: "10px 0", color: "#333", fontSize: "16px" }}>{testResponse.response || testResponse.error}</p>
                  <div style={{ fontSize: "13px", color: "#666", display: "flex", gap: "15px", flexWrap: "wrap" }}>
                    {testResponse.source && <span>📍 Source: <strong>{testResponse.source}</strong></span>}
                    {testResponse.intent && <span>🎯 Intent: <strong>{testResponse.intent}</strong></span>}
                    {testResponse.orderDetected !== undefined && <span>🛒 Order: <strong>{testResponse.orderDetected ? "Yes" : "No"}</strong></span>}
                    {testResponse.orderInfo?.phone && <span>📱 Phone: <strong>{testResponse.orderInfo.phone}</strong></span>}
                    {testResponse.model && <span>🤖 Model: <strong>{testResponse.model}</strong></span>}
                    {testResponse.confidence !== undefined && <span>📊 Confidence: <strong>{(testResponse.confidence * 100).toFixed(0)}%</strong></span>}
                    {testResponse.needsHumanHandoff !== undefined && <span>👤 Human Handoff: <strong>{testResponse.needsHumanHandoff ? "Yes" : "No"}</strong></span>}
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: "20px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
                <strong>💡 Try these examples:</strong>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "10px" }}>
                  {["i want to buy product", "i want to buy, call 0912345678", "what is the price?", "where is your location?", "opening hours?", "i want to return product", "i need human support"].map(example => (
                    <button
                      key={example}
                      onClick={() => setTestMessage(example)}
                      style={{ padding: "8px 16px", background: "white", border: "1px solid #ddd", borderRadius: "20px", cursor: "pointer", fontSize: "13px" }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "models" && (
          <div>
            <h2 style={{ color: "#1E3A5F" }}>📦 Available Models</h2>
            <p>Current: <strong>{currentConfig?.provider}/{currentConfig?.model}</strong></p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px", marginTop: "20px" }}>
              {models.map(model => (
                <div key={model.id} style={{ background: "white", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", borderLeft: `4px solid ${model.provider === "deepseek" ? "#ff6b6b" : model.provider === "openai" ? "#4ecdc4" : model.provider === "anthropic" ? "#ffeaa7" : "#a29bfe"}` }}>
                  <h3 style={{ margin: "0 0 10px", fontSize: "16px", color: "#1E3A5F" }}>{model.name}</h3>
                  <p style={{ margin: "5px 0", fontSize: "13px", color: "#666" }}>{model.description}</p>
                  <div style={{ marginTop: "10px", fontSize: "12px", color: "#999" }}>
                    <span style={{ background: "#f0f0f0", padding: "4px 8px", borderRadius: "4px", marginRight: "5px" }}>{model.provider}</span>
                    <span style={{ background: "#f0f0f0", padding: "4px 8px", borderRadius: "4px" }}>{model.model}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "knowledge" && (
          <div>
            <h2 style={{ color: "#1E3A5F" }}>📚 Knowledge Base</h2>
            <p>Total articles: {kbItems.length}</p>
            {kbItems.length === 0 ? (
              <p style={{ color: "#666" }}>No knowledge base items yet.</p>
            ) : (
              <div style={{ marginTop: "20px" }}>
                {kbItems.map(item => (
                  <div key={item.id} style={{ background: "white", padding: "15px", borderRadius: "8px", marginBottom: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    <h3 style={{ margin: "0 0 10px", color: "#1E3A5F" }}>{item.title}</h3>
                    <p style={{ margin: 0, color: "#666" }}>{item.content}</p>
                    <div style={{ marginTop: "10px", fontSize: "12px", color: "#999" }}>
                      Source: {item.source} | Tags: {item.tags.join(", ") || "none"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "rules" && (
          <div>
            <h2 style={{ color: "#1E3A5F" }}>🤖 Auto-Reply Rules</h2>
            <p>Active rules: {rules.filter(r => r.enabled).length} / {rules.length}</p>
            <div style={{ marginTop: "20px" }}>
              {rules.map(rule => (
                <div key={rule.id} style={{ background: "white", padding: "15px", borderRadius: "8px", marginBottom: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", opacity: rule.enabled ? 1 : 0.6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, color: "#1E3A5F" }}>Rule: {rule.id}</h3>
                    <span style={{ background: rule.enabled ? "#27ae60" : "#95a5a6", color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px" }}>
                      {rule.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p style={{ margin: "10px 0", color: "#666" }}>
                    <strong>Keywords:</strong> {rule.keywords.join(", ")}
                  </p>
                  <p style={{ margin: 0, color: "#333", background: "#f9f9f9", padding: "10px", borderRadius: "4px" }}>
                    {rule.response}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
