"use client";

import {
  MessageSquare,
  FileText,
  Layers,
  Workflow,
  Brain,
  // ChevronRight,
  Upload,
  Code,
  Database,
} from "lucide-react";
import Link from "next/link";
import { Toaster } from "sonner";
import Logo from "@/components/mwa-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Authorized } from "@/components/auth/authorized";
import { UserButton } from "@/components/auth/user-button";
import { Unauthorized } from "@/components/auth/unauthorized";
import { GetStartedButton } from "@/components/get-started-button";

const features = [
  {
    icon: <FileText className="w-8 h-8 text-indigo-500" />,
    title: "Document Management",
    description:
      "Upload and manage multiple document types including PDFs, DOCXs, and TXTs to augment your AI.",
    link: "/rag/manage",
    linkText: "Manage Documents",
  },
  {
    icon: <Layers className="w-8 h-8 text-purple-500" />,
    title: "Text Chunk Editing",
    description:
      "Edit and refine text chunks before embedding to improve the quality of RAG responses.",
    link: "/rag/manage/doc1/chunks",
    linkText: "Edit Chunks",
  },
  {
    icon: <Workflow className="w-8 h-8 text-blue-500" />,
    title: "Data Flow Visualization",
    description:
      "Visualize the RAG processing pipeline from document upload to vector indexing.",
    link: "/rag/dataflow/doc1",
    linkText: "View Data Flow",
  },
  {
    icon: <Brain className="w-8 h-8 text-green-500" />,
    title: "AI Chatbot",
    description:
      "Interact with an AI chatbot that leverages your documents to provide context-aware responses.",
    link: "/chat",
    linkText: "Open Chat",
  },
];

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Logo>Prompt พร้อม</Logo>
          </div>
          <div className="flex items-center gap-2">
            <Authorized>
              <Button variant="ghost" size="sm" asChild>
                {/* <Link href="/docs">Documentation</Link> */}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                {/* <Link href="/settings">Settings</Link> */}
              </Button>
              <Button size="sm" asChild>
                {/* <Link href="/prompt-chat">Prompt Chat</Link> */}
              </Button>
              <UserButton />
            </Authorized>
            <Unauthorized>
              <GetStartedButton />
            </Unauthorized>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="bg-gradient-to-b from-slate-50 to-white py-20 dark:from-slate-950 dark:to-slate-900">
          <div className="container mx-auto px-4 text-center">
            {/* <h1 className="text-4xl md:text-5xl font-bold mb-6">
              MWA AI with Retrieval-Augmented Generation
              </h1> */}
            {/* <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Upload your documents, edit text chunks, and create a chatbot with
              accurate, context-aware responses backed by your own data.
              </p> */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              AI Insight with RAG
              <span className="text-2xl opacity-80">
                <br />
                (Retrieval Augmented Generation)
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              อัปโหลดเอกสาร ปรับแก้คำในข้อความ แบ่งส่วนของข้อมูล
              <br />
              {/* เพื่อสร้างแชทบอทให้คำตอบที่แม่นยำ */}
              สามารถตอบคำถามได้แม่นยำ ด้วยความเข้าใจบริบทข้อมูลของคุณ
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Authorized>
                <Button size="lg" asChild>
                  {/* <Link href="/rag/manage">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Documents
                  </Link> */}
                  <Link href="/prompt-chat">Prompt Chat</Link>
                </Button>
              </Authorized>
              <Unauthorized>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/auth/login">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Try the Chatbot
                  </Link>
                </Button>
              </Unauthorized>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">
              Key Features
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">
                    {feature.description}
                  </p>
                  {/* <Button variant="outline" size="sm" asChild>
                    <Link href={feature.link}>
                      {feature.linkText}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button> */}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-10 items-center">
              <div className="lg:w-1/2">
                <h2 className="text-3xl font-bold mb-6">How It Works</h2>
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="rounded-full bg-primary/10 p-2 mt-1">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        Upload Your Documents
                      </h3>
                      <p className="text-muted-foreground">
                        Start by uploading PDFs, DOCXs, or TXTs to extract
                        knowledge.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="rounded-full bg-primary/10 p-2 mt-1">
                      <Code className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        Process & Edit Chunks
                      </h3>
                      <p className="text-muted-foreground">
                        Documents are split into chunks that you can edit and
                        refine.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="rounded-full bg-primary/10 p-2 mt-1">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Generate Embeddings</h3>
                      <p className="text-muted-foreground">
                        Text chunks are converted to vector embeddings for
                        efficient retrieval.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="rounded-full bg-primary/10 p-2 mt-1">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Chat with Context</h3>
                      <p className="text-muted-foreground">
                        Chat with an AI that uses your documents as context for
                        better answers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <Button className="mt-8" asChild>
                  <Link href="/rag/manage">Get Started</Link>
                </Button> */}
              </div>

              <div className="lg:w-1/2 border rounded-lg overflow-hidden">
                <div className="bg-muted p-4 border-b flex items-center justify-between">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs font-medium">MWA Chatbot</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6">
                  <div className="space-y-4">
                    <div className="bg-primary/10 p-4 rounded-lg max-w-[80%]">
                      <p className="text-sm font-medium">
                        How does your RAG system process PDFs?
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg max-w-[80%] ml-auto">
                      <p className="text-sm">
                        Our system processes PDFs in several steps: First, we
                        extract text content while preserving layout structure.
                        Then, the text is split into semantic chunks that
                        maintain context. You can review and edit these chunks
                        before they&apos;re converted to vector embeddings.
                        During retrieval, the most relevant chunks are selected
                        to provide context for the AI&apos;s response.
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <p>Sources:</p>
                        <ul className="list-disc list-inside ml-2">
                          <li>Annual Report 2023.pdf (p.12)</li>
                          <li>Technical Documentation.pdf (p.45-47)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo>MWA Chatbot Platform</Logo>
            </div>
            {/* <div>
              <nav className="flex gap-4 items-center text-sm text-muted-foreground">
                <Link
                  href="/rag/manage"
                  className="hover:text-foreground transition-colors"
                >
                  Documents
                </Link>
                <Link
                  href="/chat"
                  className="hover:text-foreground transition-colors"
                >
                  Chat
                </Link>
                <Link
                  href="/docs"
                  className="hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
                <Link
                  href="/settings"
                  className="hover:text-foreground transition-colors"
                >
                  Settings
                </Link>
              </nav>
            </div> */}
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
