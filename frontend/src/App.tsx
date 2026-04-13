import { useState, useEffect } from "react";

const API_BASE = "http://localhost:9001";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [kbItems, setKbItems] = useState<any[]>([]);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchRules();
    fetchKB();
  }, []);

  const fetchStats = async () => {
    const res = await fetch(`${API_BASE}/api/admin/stats`);
    setStats(await res.json());
  };

  const fetchRules = async () => {
    const res = await fetch(`${API_BASE}/api/auto-reply/rules`);
    setRules(await res.json());
  };

  const fetchKB = async () => {
    const res = await fetch(`${API_BASE}/api/knowledge`);
    setKbItems(await res.json());
  };

  const testAutoReply = async () => {
    const res = await fetch(`${API_BASE}/api/auto-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: testMessage })
    });
    setTestResponse(await res.json());
  };

  return (
    <div style={{ fontFamily: "Inter, sans-serif", minHeight: "100vh", background: "#f4f4f4" }}>
      <header style={{ background: "#1E3A5F", color: "white", padding: "20px" }}>
        <h1 style={{ margin: 0 }}>🤖 FB Agent Dashboard</h1>
        <p style={{ margin: "5px 0 0", opacity: 0.8 }}>Auto-reply Manager for Facebook Pages</p>
      </header>

      <nav style={{ background: "white", padding: "10px 20px", borderBottom: "1px solid #ddd" }}>
        {["dashboard", "knowledge", "rules", "test", "settings"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              margin: "0 5px",
              border: "none",
              background: activeTab === tab ? "#C9A945" : "#f0f0f0",
              color: activeTab === tab ? "#1E3A5F" : "#333",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      <main style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
        {activeTab === "dashboard" && stats && (
          <div>
            <h2 style={{ color: "#1E3A5F" }}>📊 Dashboard</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginTop: "20px" }}>
              <StatCard title="Conversations" value={stats.totalConversations} color="#1E3A5F" />
              <StatCard title="Messages" value={stats.totalMessages} color="#C9A945" />
              <StatCard title="Auto-Replies" value={stats.autoRepliesSent} color="#27ae60" />
              <StatCard title="KB Articles" value={kbItems.length} color="#e74c3c" />
            </div>
          </div>
        )}

        {activeTab === "knowledge" && (
          <div>
            <h2 style={{ color: "#1E3A5F" }}>📚 Knowledge Base</h2>
            <p>Total articles: {kbItems.length}</p>
            {kbItems.length === 0 ? (
              <p style={{ color: "#666" }}>No knowledge base items yet. Add some via API.</p>
            ) : (
              <div style={{ marginTop: "20px" }}>
                {kbItems.map(item => (
                  <div key={item.id} style={{ background: "white", padding: "15px", borderRadius: "8px", marginBottom: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    <h3 style={{ margin: "0 0 10px", color: "#1E3A5F" }}>{item.title}</h3>
                    <p style={{ margin: 0, color: "#666" }}>{item.content.substring(0, 150)}...</p>
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

        {activeTab === "test" && (
          <div>
            <h2 style={{ color: "#1E3A5F" }}>🧪 Test Auto-Reply</h2>
            <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a test message..."
                style={{ width: "100%", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "14px", minHeight: "100px", fontFamily: "inherit" }}
              />
              <button
                onClick={testAutoReply}
                style={{ marginTop: "15px", padding: "12px 30px", background: "#C9A945", color: "#1E3A5F", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
              >
                Test Reply
              </button>
              {testResponse && (
                <div style={{ marginTop: "20px", padding: "15px", background: "#f0f0f0", borderRadius: "8px" }}>
                  <strong>Response:</strong>
                  <p style={{ margin: "10px 0", color: "#333" }}>{testResponse.response}</p>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    Source: {testResponse.source} | Confidence: {(testResponse.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h2 style={{ color: "#1E3A5F" }}>⚙️ Settings</h2>
            <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              <p>Configure Facebook integration and auto-reply settings.</p>
              <p style={{ color: "#666", fontSize: "14px" }}>Settings page coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div style={{ background: "white", padding: "25px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>{title}</div>
      <div style={{ fontSize: "32px", fontWeight: "700", color }}>{value}</div>
    </div>
  );
}

export default App;
