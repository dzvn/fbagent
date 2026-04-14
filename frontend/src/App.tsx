import { useState } from "react";
import { ApiProvider } from "./components/ApiContext";
import Header from "./components/Header";
import TabNav from "./components/TabNav";
import TestPanel from "./components/TestPanel";
import KnowledgeList from "./components/KnowledgeList";
import RulesList from "./components/RulesList";
import ModelsList from "./components/ModelsList";

function App() {
  const [activeTab, setActiveTab] = useState("langgraph");

  const renderContent = () => {
    if (["langgraph", "llm-agent", "old-reply"].includes(activeTab)) {
      return <TestPanel activeTab={activeTab} />;
    }
    if (activeTab === "knowledge") return <KnowledgeList />;
    if (activeTab === "rules") return <RulesList />;
    if (activeTab === "models") return <ModelsList />;
    return null;
  };

  return (
    <ApiProvider>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          minHeight: "100vh",
          background: "#f4f4f4",
        }}
      >
        <Header />
        <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main
          style={{
            padding: "30px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {renderContent()}
        </main>
      </div>
    </ApiProvider>
  );
}

export default App;
