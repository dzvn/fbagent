import { useApi } from "./ApiContext";

export default function ModelsList() {
  const { models, currentConfig } = useApi();

  const getProviderColor = (provider: string) => {
    if (provider === "deepseek") return "#ff6b6b";
    if (provider === "openai") return "#4ecdc4";
    if (provider === "anthropic") return "#ffeaa7";
    return "#a29bfe";
  };

  return (
    <div>
      <h2 style={{ color: "#1E3A5F" }}>📦 Available Models</h2>
      <p>
        Current: <strong>
          {currentConfig?.provider}/{currentConfig?.model}
        </strong>
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "15px",
          marginTop: "20px",
        }}
      >
        {models.map((model) => (
          <div
            key={model.id}
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              borderLeft: `4px solid ${getProviderColor(model.provider)}`,
            }}
          >
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "16px",
                color: "#1E3A5F",
              }}
            >
              {model.name}
            </h3>
            <p style={{ margin: "5px 0", fontSize: "13px", color: "#666" }}>
              {model.description}
            </p>
            <div style={{ marginTop: "10px", fontSize: "12px", color: "#999" }}>
              <span
                style={{
                  background: "#f0f0f0",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  marginRight: "5px",
                }}
              >
                {model.provider}
              </span>
              <span
                style={{
                  background: "#f0f0f0",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                {model.model}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
