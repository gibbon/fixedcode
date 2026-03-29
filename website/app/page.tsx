import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import AISandwich from "@/components/AISandwich";
import HowItWorks from "@/components/HowItWorks";
import SchemaTypes from "@/components/SchemaTypes";
import CodeExample from "@/components/CodeExample";
import BeforeAfter from "@/components/BeforeAfter";
import Bundles from "@/components/Bundles";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <AISandwich />
        <HowItWorks />
        <SchemaTypes />
        <CodeExample />
        <BeforeAfter />
        <Bundles />
      </main>
      <Footer />
    </>
  );
}
