import { useApi } from "./ApiContext";

export default function KnowledgeList() {
  const { kbItems } = useApi();

  return (
    <div>
      <h2 style={{ color: "#1E3A5F" }}>📚 Knowledge Base</h2>
      <p>Total articles: {kbItems.length}</p>
      {kbItems.length === 0 ? (
        <p style={{ color: "#666" }}>No knowledge base items yet.</p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {kbItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "10px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ margin: "0 0 10px", color: "#1E3A5F" }}>
                {item.title}
              </h3>
              <p style={{ margin: 0, color: "#666" }}>{item.content}</p>
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#999" }}>
                Source: {item.source} | Tags: {item.tags.join(", ") || "none"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
