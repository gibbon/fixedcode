"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface FileNode {
  name: string;
  type: "file" | "dir";
  children?: FileNode[];
  highlight?: boolean;
  comment?: string;
}

const examples = [
  {
    id: "service",
    label: "Domain Service",
    specFile: "order.yaml",
    spec: `schema: ddd/1.0
boundedContext: Order

aggregates:
  Order:
    attributes:
      orderId!: uuid
      customerId!: uuid
      status: string = OrderStatus
      totalAmount: decimal
    commands:
      - PlaceOrder{customerId!, items!}
          -> OrderPlaced
      - CancelOrder(orderId!)
          -> OrderCancelled
    queries:
      - GetOrder(orderId!) -> Order
      - SearchOrders(page, size, filters)
          -> PagedList
    entities:
      LineItem:
        lineItemId!: uuid
        productId!: uuid
        quantity!: int`,
    tree: [
      {
        name: "order-service/",
        type: "dir" as const,
        children: [
          { name: "api/", type: "dir" as const, children: [
            { name: "OrderController.kt", type: "file" as const },
            { name: "openapi.yaml", type: "file" as const },
          ]},
          { name: "application/", type: "dir" as const, children: [
            { name: "OrderCommandService.kt", type: "file" as const },
            { name: "OrderQueryService.kt", type: "file" as const },
            { name: "OrderValidator.kt", type: "file" as const, comment: "interface" },
          ]},
          { name: "domain/", type: "dir" as const, children: [
            { name: "Order.kt", type: "file" as const },
            { name: "LineItem.kt", type: "file" as const },
            { name: "events/", type: "dir" as const, children: [
              { name: "OrderPlaced.kt", type: "file" as const },
              { name: "OrderCancelled.kt", type: "file" as const },
            ]},
          ]},
          { name: "infrastructure/", type: "dir" as const, children: [
            { name: "OrderRepository.kt", type: "file" as const },
            { name: "db/migration/", type: "dir" as const, children: [
              { name: "V1__create_order.sql", type: "file" as const },
            ]},
          ]},
          { name: "auth/", type: "dir" as const, children: [
            { name: "OrderPolicyEngine.kt", type: "file" as const },
          ]},
          { name: "events/", type: "dir" as const, children: [
            { name: "OrderOutboxPublisher.kt", type: "file" as const },
          ]},
          { name: "tests/", type: "dir" as const, children: [
            { name: "OrderCommandTests.kt", type: "file" as const },
            { name: "OrderApiTests.ts", type: "file" as const, comment: "black-box" },
          ]},
          { name: "extensions/", type: "dir" as const, children: [
            { name: "OrderValidator.kt", type: "file" as const, highlight: true, comment: "you write this" },
          ]},
        ],
      },
    ] as FileNode[],
    caption: "~20 lines of YAML → complete service with auth, audit, events, tests. Same engine, different bundle.",
  },
  {
    id: "agent",
    label: "AI Agent",
    specFile: "ops-agent.yaml",
    spec: `schema: agent/1.0
name: OpsAgent
description: "Database query assistant"

agent:
  maxTurns: 10
  streaming: true
  model: claude-sonnet-4-6
  middleware:
    - correlation-id
    - auth0:
        requiredPermission: "admin:query"
  tools:
    - operation: QueryDatabase
      type: database
      config:
        readOnly: true
        databases:
          - name: orders
            envPrefix: DB_ORDERS`,
    tree: [
      {
        name: "ops-agent/",
        type: "dir" as const,
        children: [
          { name: "app/", type: "dir" as const, children: [
            { name: "main.py", type: "file" as const },
            { name: "agent.py", type: "file" as const },
            { name: "config.py", type: "file" as const },
          ]},
          { name: "tools/", type: "dir" as const, children: [
            { name: "query_database.py", type: "file" as const },
            { name: "tool_registry.py", type: "file" as const },
          ]},
          { name: "middleware/", type: "dir" as const, children: [
            { name: "correlation_id.py", type: "file" as const },
            { name: "auth0.py", type: "file" as const },
          ]},
          { name: "tests/", type: "dir" as const, children: [
            { name: "test_agent.py", type: "file" as const },
            { name: "test_tools.py", type: "file" as const },
          ]},
          { name: "Dockerfile", type: "file" as const },
          { name: "requirements.txt", type: "file" as const },
          { name: "extensions/", type: "dir" as const, children: [
            { name: "custom_tools.py", type: "file" as const, highlight: true, comment: "you write this" },
          ]},
        ],
      },
    ] as FileNode[],
    caption: "Same engine, different spec format + bundle. Agent with auth, tools, middleware. All generated.",
  },
  {
    id: "orchestrator",
    label: "Orchestrator",
    specFile: "pipeline.yaml",
    spec: `schema: orchestrator/1.0
name: PRPipeline
description: "Automated PR workflow"

orchestrator:
  routingMode: sequential
  agents:
    - name: Triage
      spec: triage-agent.yaml
    - name: Implement
      spec: implement-agent.yaml
      contextFrom: [Triage]
    - name: Review
      spec: review-agent.yaml
      contextFrom: [Implement]
    - name: Ship
      spec: ship-agent.yaml
      contextFrom: [Review]`,
    tree: [
      {
        name: "pr-pipeline/",
        type: "dir" as const,
        children: [
          { name: "app/", type: "dir" as const, children: [
            { name: "main.py", type: "file" as const },
            { name: "orchestrator.py", type: "file" as const },
            { name: "router.py", type: "file" as const },
          ]},
          { name: "agents/", type: "dir" as const, children: [
            { name: "triage/", type: "dir" as const, children: [
              { name: "agent.py", type: "file" as const },
            ]},
            { name: "implement/", type: "dir" as const, children: [
              { name: "agent.py", type: "file" as const },
            ]},
            { name: "review/", type: "dir" as const, children: [
              { name: "agent.py", type: "file" as const },
            ]},
            { name: "ship/", type: "dir" as const, children: [
              { name: "agent.py", type: "file" as const },
            ]},
          ]},
          { name: "context/", type: "dir" as const, children: [
            { name: "shared_context.py", type: "file" as const },
          ]},
          { name: "tests/", type: "dir" as const, children: [
            { name: "test_pipeline.py", type: "file" as const },
          ]},
          { name: "Dockerfile", type: "file" as const },
          { name: "extensions/", type: "dir" as const, children: [
            { name: "custom_routing.py", type: "file" as const, highlight: true, comment: "you write this" },
          ]},
        ],
      },
    ] as FileNode[],
    caption: "4-agent sequential pipeline from one spec. Same engine, same regeneration contract.",
  },
];

function RenderTree({ nodes, depth = 0 }: { nodes: FileNode[]; depth?: number }) {
  return (
    <>
      {nodes.map((node, i) => (
        <div key={`${depth}-${i}`}>
          <div
            className={`flex items-center gap-1 ${
              node.highlight ? "text-cyan-400" : node.type === "dir" ? "text-blue-400" : "text-gray-400"
            }`}
            style={{ paddingLeft: `${depth * 14}px` }}
          >
            {depth > 0 && (
              <span className="text-gray-600 mr-1">
                {i === nodes.length - 1 ? "└──" : "├──"}
              </span>
            )}
            <span className={node.type === "dir" ? "font-medium" : ""}>{node.name}</span>
            {node.comment && (
              <span className="text-gray-600 ml-2 text-xs">
                {node.highlight ? "← " : "# "}{node.comment}
              </span>
            )}
          </div>
          {node.children && <RenderTree nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </>
  );
}

export default function CodeExample() {
  const [active, setActive] = useState(0);
  const example = examples[active];

  return (
    <section id="code-example" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            From <span className="text-gradient">spec to code</span> in seconds
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Same engine. Different spec format + bundle. Click the tabs to see what one spec produces.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {examples.map((ex, i) => (
            <button
              key={ex.id}
              onClick={() => setActive(i)}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                active === i
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-500 hover:text-gray-300 border border-transparent"
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <motion.div
          key={example.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Left: YAML spec */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-gray-500 font-mono">{example.specFile}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-wider">
                Spec
              </span>
            </div>
            <pre className="p-4 text-[13px] font-mono text-gray-300 overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto">
              {example.spec}
            </pre>
          </div>

          {/* Right: Generated output */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-gray-500 font-mono">output</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 uppercase tracking-wider">
                Generated
              </span>
            </div>
            <div className="p-4 text-[12px] font-mono overflow-x-auto leading-relaxed max-h-[400px] overflow-y-auto">
              <RenderTree nodes={example.tree} />
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-6 text-gray-400 text-sm"
        >
          {example.caption}
        </motion.p>
      </div>
    </section>
  );
}
