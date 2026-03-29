"use client";

import { motion } from "framer-motion";

const yamlSpec = `schema: ddd/1.0
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
      - UpdateOrder(orderId!){items!}
          -> OrderUpdated
      - CancelOrder(orderId!)
          -> OrderCancelled
    queries:
      - GetOrder(orderId!)
          -> Order
      - SearchOrders(page, size, filters)
          -> PagedList
    entities:
      LineItem:
        lineItemId!: uuid
        productId!: uuid
        quantity!: int`;

interface FileNode {
  name: string;
  type: "file" | "dir";
  children?: FileNode[];
  highlight?: boolean;
  comment?: string;
}

const fileTree: FileNode[] = [
  {
    name: "order-service/",
    type: "dir",
    children: [
      {
        name: "api/",
        type: "dir",
        children: [{ name: "OrderController.kt", type: "file" }],
      },
      {
        name: "application/",
        type: "dir",
        children: [
          { name: "OrderCommandService.kt", type: "file" },
          { name: "OrderQueryService.kt", type: "file" },
          { name: "OrderValidator.kt", type: "file", comment: "interface" },
          { name: "DefaultOrderValidator.kt", type: "file" },
        ],
      },
      {
        name: "domain/",
        type: "dir",
        children: [
          { name: "Order.kt", type: "file" },
          { name: "LineItem.kt", type: "file" },
          {
            name: "events/",
            type: "dir",
            children: [
              { name: "OrderPlaced.kt", type: "file" },
              { name: "OrderCancelled.kt", type: "file" },
            ],
          },
        ],
      },
      {
        name: "infrastructure/",
        type: "dir",
        children: [
          { name: "OrderRepository.kt", type: "file" },
          {
            name: "db/migration/",
            type: "dir",
            children: [{ name: "V1__create_order.sql", type: "file" }],
          },
        ],
      },
      {
        name: "extensions/",
        type: "dir",
        children: [
          {
            name: "OrderValidator.kt",
            type: "file",
            highlight: true,
            comment: "you write this",
          },
        ],
      },
    ],
  },
];

function RenderTree({
  nodes,
  depth = 0,
}: {
  nodes: FileNode[];
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node, i) => (
        <div key={`${depth}-${i}`}>
          <div
            className={`flex items-center gap-1 ${
              node.highlight ? "text-cyan-400" : node.type === "dir" ? "text-blue-400" : "text-gray-400"
            }`}
            style={{ paddingLeft: `${depth * 16}px` }}
          >
            {depth > 0 && (
              <span className="text-gray-600 mr-1">
                {i === nodes.length - 1 ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500"}
              </span>
            )}
            <span className={node.type === "dir" ? "font-medium" : ""}>
              {node.name}
            </span>
            {node.comment && (
              <span className="text-gray-600 ml-2 text-xs">
                {node.highlight ? "\u2190 " : "# "}
                {node.comment}
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
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
              <span className="text-xs text-gray-500 font-mono">
                order.yaml
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 uppercase tracking-wider">
                Your Spec
              </span>
            </div>
            <pre className="p-4 text-[13px] font-mono text-gray-300 overflow-x-auto leading-relaxed">
              {yamlSpec}
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
                Generated Output
              </span>
            </div>
            <div className="p-4 text-[13px] font-mono overflow-x-auto leading-relaxed">
              <RenderTree nodes={fileTree} />
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-8 text-gray-400 text-lg"
        >
          ~20 lines of YAML. Auth, audit, logging, events, tests — all generated.{" "}
          <span className="text-gradient font-semibold">Teams write business logic, not infrastructure.</span>
        </motion.p>
      </div>
    </section>
  );
}
