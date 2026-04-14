interface TabNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: "langgraph", label: "🧠 LangGraph" },
  { id: "llm-agent", label: "🤖 LLM Agent" },
  { id: "old-reply", label: "📝 Old Reply" },
  { id: "knowledge", label: "Knowledge" },
  { id: "rules", label: "Rules" },
  { id: "models", label: "Models" },
];

export default function TabNav({ activeTab, setActiveTab }: TabNavProps) {
  return (
    <nav
      style={{
        background: "white",
        padding: "10px 20px",
        borderBottom: "1px solid #ddd",
        display: "flex",
        flexWrap: "wrap",
        gap: "5px",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: "10px 20px",
            border: "none",
            background: activeTab === tab.id ? "#C9A945" : "#f0f0f0",
            color: activeTab === tab.id ? "#1E3A5F" : "#333",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            textTransform: "capitalize",
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
