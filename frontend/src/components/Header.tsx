import { useApi } from "./ApiContext";

export default function Header() {
  const { API_BASE, currentConfig, useLLM, setUseLLM } = useApi();

  return (
    <header style={{ background: "#1E3A5F", color: "white", padding: "20px" }}>
      <h1 style={{ margin: 0 }}>🤖 FB Agent Dashboard v0.2.1</h1>
      <p style={{ margin: "5px 0 0", opacity: 0.8 }}>
        LLM-Powered Auto-Reply with DeepSeek
      </p>
      <div
        style={{
          marginTop: "10px",
          fontSize: "13px",
          background: "rgba(255,255,255,0.1)",
          padding: "10px",
          borderRadius: "8px",
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span>
          🔗 API: <strong>{API_BASE}</strong>
        </span>
        <span>
          📦 Model: <strong>
            {currentConfig?.provider}/{currentConfig?.model}
          </strong>
        </span>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={useLLM}
            onChange={(e) => setUseLLM(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          🧠 Use LLM for responses
        </label>
      </div>
    </header>
  );
}
