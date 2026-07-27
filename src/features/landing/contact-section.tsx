import { Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ContactLine, ContactLink } from "@/components/site/contact-line";
import { PillLink } from "@/components/site/pill-link";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { InstagramIcon, TikTokIcon } from "@/components/site/social-icons";
import { termsPath } from "@/content/site-content";

export function ContactSection() {
  const { t } = useTranslation();

  return (
    <footer
      id="contact"
      className="mx-auto max-w-6xl px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 md:pb-8"
    >
      <ScrollReveal>
        <div className="relative grid gap-8 rounded-[1.35rem] border border-blush/55 bg-card/80 p-6 pb-8 md:grid-cols-[1fr_1fr] md:overflow-hidden">
          <div className="floral-mark floral-mark-start" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-4xl">{t("contact.title")}</h2>
            <p className="mt-2 max-w-sm text-sm leading-5 text-foreground/62">
              {t("contact.body")}
            </p>
            <PillLink href="mailto:noyas2703@gmail.com" className="mt-4 max-w-52">
              {t("contact.cta")}
            </PillLink>
          </div>
          <div className="relative z-10 grid gap-4 text-sm text-foreground/74">
            <ContactLine icon={<Mail />} text="noyas2703@gmail.com" />
            <ContactLink
              href="https://www.instagram.com/noyashlomo?utm_source=qr"
              icon={<InstagramIcon />}
              text="Instagram"
            />
            <ContactLink
              href="https://www.tiktok.com/@noyalachan?_r=1&_t=ZS-96pJauUzNoO"
              icon={<TikTokIcon />}
              text="TikTok"
            />
            <ContactLine icon={<MapPin />} text={t("contact.studios")} />
            <ContactLine icon={<MapPin />} text={t("contact.reformerPilatesStudio")} />
          </div>
        </div>
      </ScrollReveal>
      <ScrollReveal delay={100}>
        <div className="mt-5 rounded-t-md bg-blush px-4 py-3 text-center text-xs text-primary-foreground">
          <p>{t("footer")}</p>
          <nav className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            <a className="underline-offset-4 hover:underline" href={termsPath}>
              {t("footerLinks.terms")}
            </a>
          </nav>
        </div>
      </ScrollReveal>
    </footer>
  );
}
