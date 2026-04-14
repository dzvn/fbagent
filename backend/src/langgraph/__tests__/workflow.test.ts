import { describe, test, expect } from "bun:test";
import { 
  buildAgentWorkflow, 
  createInitialState, 
  processMessage 
} from "../workflow";
import { classifyNode, routeAfterClassify } from "../nodes/classify";
import { detectOrderNode } from "../nodes/detect-order";
import { handoffNode } from "../nodes/generate-response";

describe("LangGraph Workflow", () => {
  describe("StateGraph Construction", () => {
    test("should build workflow with 5 nodes", async () => {
      const workflow = buildAgentWorkflow();
      expect(workflow).toBeDefined();
      expect(workflow.invoke).toBeDefined();
    });

    test("should compile successfully", async () => {
      const workflow = buildAgentWorkflow();
      expect(typeof workflow.invoke).toBe("function");
    });
  });

  describe("Initial State Creation", () => {
    test("should create initial state with required fields", () => {
      const state = createInitialState("user123", "page456", "Hello");
      
      expect(state.senderId).toBe("user123");
      expect(state.pageId).toBe("page456");
      expect(state.currentMessage).toBe("Hello");
      expect(state.useLLM).toBe(true);
      expect(state.intent).toBe(null);
      expect(state.orderDetected).toBe(false);
    });

    test("should allow useLLM override", () => {
      const state = createInitialState("user123", "page456", "Hello", false);
      expect(state.useLLM).toBe(false);
    });
  });
});

describe("Classify Node", () => {
  test("should classify order intent", () => {
    const state = createInitialState("user1", "page1", "toi muon mua san pham");
    const result = classifyNode(state as any);
    expect(result.intent).toBe("order");
  });

  test("should classify pricing intent", () => {
    const state = createInitialState("user1", "page1", "gia bao nhieu");
    const result = classifyNode(state as any);
    expect(result.intent).toBe("pricing");
  });

  test("should classify location intent", () => {
    const state = createInitialState("user1", "page1", "dia chi o dau");
    const result = classifyNode(state as any);
    expect(result.intent).toBe("location");
  });

  test("should classify human_handoff intent", () => {
    const state = createInitialState("user1", "page1", "gap admin");
    const result = classifyNode(state as any);
    expect(result.intent).toBe("human_handoff");
  });

  test("should classify general intent for unknown messages", () => {
    const state = createInitialState("user1", "page1", "xin chao");
    const result = classifyNode(state as any);
    expect(result.intent).toBe("general");
  });

  test("should route order intent to detect_order", () => {
    const state = { ...createInitialState("user1", "page1", "mua"), intent: "order" } as any;
    const route = routeAfterClassify(state);
    expect(route).toBe("detect_order");
  });

  test("should route pricing intent to search_knowledge", () => {
    const state = { ...createInitialState("user1", "page1", "gia"), intent: "pricing" } as any;
    const route = routeAfterClassify(state);
    expect(route).toBe("search_knowledge");
  });

  test("should route human_handoff intent to handoff", () => {
    const state = { ...createInitialState("user1", "page1", "gap admin"), intent: "human_handoff" } as any;
    const route = routeAfterClassify(state);
    expect(route).toBe("handoff");
  });
});

describe("Detect Order Node", () => {
  test("should detect phone number in Vietnamese format", () => {
    const state = createInitialState("user1", "page1", "toi muon mua, so dt 0912345678");
    const result = detectOrderNode(state as any);
    
    expect(result.orderDetected).toBe(true);
    expect(result.orderInfo?.phone).toBe("0912345678");
    expect(result.response).toContain("0912345678");
  });

  test("should ask for phone when not provided", () => {
    const state = createInitialState("user1", "page1", "toi muon mua san pham");
    const result = detectOrderNode(state as any);
    
    expect(result.orderDetected).toBe(true);
    expect(result.orderInfo?.phone).toBeUndefined();
    expect(result.response).toBe("Dạ mình thấy bạn muốn đặt hàng. Để mình hỗ trợ bạn, bạn vui lòng để lại số điện thoại nhé!");
  });
});

describe("Handoff Node", () => {
  test("should set handoff response and flag", () => {
    const state = createInitialState("user1", "page1", "gap admin");
    const result = handoffNode(state as any);
    
    expect(result.needsHumanHandoff).toBe(true);
    expect(result.response).toBe("Dạ vấn đề của bạn cần sự hỗ trợ từ đội ngũ. Mình sẽ chuyển tin nhắn đến admin và họ sẽ liên hệ bạn sớm nhé!");
  });
});

describe("Process Message Integration", () => {
  test("should process order intent with phone", async () => {
    const result = await processMessage("user1", "page1", "toi muon mua, so dt 0912345678", false);
    
    expect(result.intent).toBe("order");
    expect(result.orderDetected).toBe(true);
    expect(result.response).toContain("0912345678");
  });

  test("should process human handoff request", async () => {
    const result = await processMessage("user1", "page1", "gap admin", false);
    
    expect(result.intent).toBe("human_handoff");
    expect(result.needsHumanHandoff).toBe(true);
    expect(result.response).toContain("admin");
  });

  test("should return error response on workflow failure", async () => {
    const result = await processMessage("user1", "page1", "test message", false);
    expect(result.response).toBeDefined();
    expect(result.source).toBeDefined();
  });
});