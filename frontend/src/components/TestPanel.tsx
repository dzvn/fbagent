import { useState } from "react";
import { useApi } from "./ApiContext";

interface TestPanelProps {
  activeTab: string;
}

const examples = [
  "i want to buy product",
  "i want to buy, call 0912345678",
  "what is the price?",
  "where is your location?",
  "opening hours?",
  "i want to return product",
  "i need human support",
  "hello how are you?",
  "tell me about your products",
];

export default function TestPanel({ activeTab }: TestPanelProps) {
  const { testLangGraph, testLLMAgent, testOldAutoReply } = useApi();
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getTitle = () => {
    if (activeTab === "langgraph") return "🧠 Test LangGraph (LLM + Rules)";
    if (activeTab === "llm-agent") return "🤖 Test LLM ReAct Agent";
    return "📝 Test Old Auto-Reply";
  };

  const getPlaceholder = () => {
    if (activeTab === "langgraph")
      return 'Try: "i want to buy product" or "giá bao nhiêu"';
    if (activeTab === "llm-agent") return "Ask anything to LLM...";
    return "Test old rule-based reply...";
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === "langgraph") {
        response = await testLangGraph(testMessage);
      } else if (activeTab === "llm-agent") {
        response = await testLLMAgent(testMessage);
      } else {
        response = await testOldAutoReply(testMessage);
      }
      setTestResponse(response);
    } catch (e) {
      setTestResponse({
        error: e instanceof Error ? e.message : "Unknown error",
        source: "error",
      });
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ color: "#1E3A5F" }}>{getTitle()}</h2>
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <textarea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder={getPlaceholder()}
          style={{
            width: "100%",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            fontSize: "14px",
            minHeight: "100px",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={handleTest}
          disabled={loading || !testMessage.trim()}
          style={{
            marginTop: "15px",
            padding: "12px 30px",
            background:
              loading || !testMessage.trim() ? "#ccc" : "#C9A945",
            color: "#1E3A5F",
            border: "none",
            borderRadius: "8px",
            fontWeight: "600",
            cursor:
              loading || !testMessage.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⏳ Processing..." : "🚀 Test"}
        </button>

        {testResponse && (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              background: testResponse.error ? "#ffebee" : "#e8f5e9",
              borderRadius: "8px",
              border: testResponse.error
                ? "1px solid #f44336"
                : "1px solid #4caf50",
            }}
          >
            <strong>Response:</strong>
            <p style={{ margin: "10px 0", color: "#333", fontSize: "16px" }}>
              {testResponse.response || testResponse.error}
            </p>
            <div
              style={{
                fontSize: "13px",
                color: "#666",
                display: "flex",
                gap: "15px",
                flexWrap: "wrap",
              }}
            >
              {testResponse.source && (
                <span>
                  📍 Source: <strong>{testResponse.source}</strong>
                </span>
              )}
              {testResponse.intent && (
                <span>
                  🎯 Intent: <strong>{testResponse.intent}</strong>
                </span>
              )}
              {testResponse.orderDetected !== undefined && (
                <span>
                  🛒 Order: <strong>
                    {testResponse.orderDetected ? "Yes" : "No"}
                  </strong>
                </span>
              )}
              {testResponse.orderInfo?.phone && (
                <span>
                  📱 Phone: <strong>{testResponse.orderInfo.phone}</strong>
                </span>
              )}
              {testResponse.model && (
                <span>
                  🤖 Model: <strong>{testResponse.model}</strong>
                </span>
              )}
              {testResponse.needsHumanHandoff !== undefined && (
                <span>
                  👤 Human Handoff: <strong>
                    {testResponse.needsHumanHandoff ? "Yes" : "No"}
                  </strong>
                </span>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <strong>💡 Try these examples:</strong>
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              marginTop: "10px",
            }}
          >
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => setTestMessage(example)}
                style={{
                  padding: "8px 16px",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
