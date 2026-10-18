"use client";

import { LangProvider } from "@/components/lang-context";

/**
 * Клієнтська обгортка провайдера мови.
 *
 * Чому окремий файл: layout.tsx — серверний компонент, і його власний
 * <html lang="uk"> уже задає мову SSR-документа. Провайдер лише вмикає
 * контекст для клієнтських компонентів і виставляє збережений вибір
 * (localStorage) після хідратації. Серверний lang="uk" не чіпаємо:
 * uk — основна мова за замовчуванням.
 */
export default function LangProviderClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LangProvider>{children}</LangProvider>;
}
