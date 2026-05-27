"use client";

import { useEffect, useState } from "react";
import { WelcomePopup } from "./WelcomePopup";

interface HomeWelcomePopupProps {
  locale: string;
  isLoggedIn: boolean;
}

export function HomeWelcomePopup({ locale, isLoggedIn }: HomeWelcomePopupProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoggedIn) return;

    // Solo mostrar una vez por sesión
    const alreadySeen = localStorage.getItem("mangia_welcome_seen");
    if (alreadySeen) return;

    // Mostrar después de 3 segundos
    const timer = setTimeout(() => {
      setShow(true);
      localStorage.setItem("mangia_welcome_seen", "true");
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  if (!show) return null;

  return (
    <WelcomePopup
      locale={locale}
      onClose={() => setShow(false)}
      onContinueAsGuest={() => setShow(false)}
    />
  );
}