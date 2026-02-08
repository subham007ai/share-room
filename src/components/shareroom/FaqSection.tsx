import { motion } from 'framer-motion';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export const FaqSection = () => {
    const fadeInUp = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5 }
    };

    const faqItems = [
        {
            question: "Do I need to create an account?",
            answer: "No. ShareRoom does not use accounts or logins. You can create and join rooms without signing up."
        },
        {
            question: "How long do rooms last?",
            answer: "Rooms are temporary and expire automatically. Once a room expires, its data is no longer accessible through the application."
        },
        {
            question: "What happens when a room expires?",
            answer: "After expiry, messages and shared files become inaccessible. Expired data is removed automatically as part of routine cleanup."
        },
        {
            question: "Is ShareRoom anonymous?",
            answer: "ShareRoom does not require personal information or accounts. However, it does not claim to provide strong anonymity guarantees."
        },
        {
            question: "Can I recover messages or files later?",
            answer: "No. ShareRoom is designed for temporary sharing only. Once a room expires, its data cannot be recovered."
        },
        {
            question: "Is ShareRoom meant for long-term conversations or storage?",
            answer: "No. ShareRoom is designed for one-time or short-lived sharing, not permanent chat or file storage."
        }
    ];

    return (
        <section id="faq" className="w-full max-w-2xl mx-auto py-12 space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-white tracking-tight">Frequently asked questions</h2>
                <p className="text-neutral-400">Short answers about how ShareRoom works.</p>
            </div>

            <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-white/10">
                        <AccordionTrigger className="text-white hover:text-indigo-300 hover:no-underline text-left">
                            {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-neutral-400 leading-relaxed">
                            {item.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
};
