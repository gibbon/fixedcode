import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import HowItWorks from "@/components/HowItWorks";
import CodeExample from "@/components/CodeExample";
import SchemaTypes from "@/components/SchemaTypes";
import WhoItsFor from "@/components/WhoItsFor";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <CodeExample />
        <SchemaTypes />
        <WhoItsFor />
      </main>
      <Footer />
    </>
  );
}
