import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import WhyBoth from "@/components/WhyBoth";
import AISandwich from "@/components/AISandwich";
import HowItWorks from "@/components/HowItWorks";
import BeforeAfter from "@/components/BeforeAfter";
import ProvenAtScale from "@/components/ProvenAtScale";
import WhoItsFor from "@/components/WhoItsFor";
import HowItScales from "@/components/HowItScales";
import CodeExample from "@/components/CodeExample";
import SchemaTypes from "@/components/SchemaTypes";
import Bundles from "@/components/Bundles";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <WhyBoth />
        <AISandwich />
        <HowItWorks />
        <BeforeAfter />
        <ProvenAtScale />
        <WhoItsFor />
        <HowItScales />
        <CodeExample />
        <SchemaTypes />
        <Bundles />
      </main>
      <Footer />
    </>
  );
}
