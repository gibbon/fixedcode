import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactPage from "@/components/ContactPage";

export const metadata = {
  title: "Speaking & Consultancy - FixedCode",
  description:
    "Book the author of FixedCode for conference talks, meetups, company engineering events, and corporate consultancy on enterprise AI engineering patterns.",
};

export default function Contact() {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        <ContactPage />
      </main>
      <Footer />
    </>
  );
}
