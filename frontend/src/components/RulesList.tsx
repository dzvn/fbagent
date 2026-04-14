import { useApi } from "./ApiContext";

export default function RulesList() {
  const { rules } = useApi();

  return (
    <div>
      <h2 style={{ color: "#1E3A5F" }}>🤖 Auto-Reply Rules</h2>
      <p>
        Active rules: {rules.filter((r) => r.enabled).length} / {rules.length}
      </p>
      <div style={{ marginTop: "20px" }}>
        {rules.map((rule) => (
          <div
            key={rule.id}
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "10px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              opacity: rule.enabled ? 1 : 0.6,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, color: "#1E3A5F" }}>
                Rule: {rule.id}
              </h3>
              <span
                style={{
                  background: rule.enabled ? "#27ae60" : "#95a5a6",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              >
                {rule.enabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p style={{ margin: "10px 0", color: "#666" }}>
              <strong>Keywords:</strong> {rule.keywords.join(", ")}
            </p>
            <p
              style={{
                margin: 0,
                color: "#333",
                background: "#f9f9f9",
                padding: "10px",
                borderRadius: "4px",
              }}
            >
              {rule.response}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
