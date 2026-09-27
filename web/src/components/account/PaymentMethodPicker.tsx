"use client";

import { Check, Phone } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { COUNTRIES, PAYMENT_METHODS, countryOf, priceIn, type CountryCode, type PaymentMethodId } from "@/lib/market";
import { selectCountry, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** `const money = useMoney(); money(4900)` → "4 900 FCFA" in the user's market currency. */
export function useMoney(): (amountXof: number) => string {
  const country = useStore(selectCountry);
  return (amountXof) => priceIn(amountXof, country);
}

export interface PaymentChoice {
  method: PaymentMethodId;
  phone: string;
}

/** Mobile Money first, card last. The phone number is only asked for Mobile Money. */
export function usePaymentChoice(): [PaymentChoice, (patch: Partial<PaymentChoice>) => void] {
  const country = countryOf(useStore(selectCountry));
  const [choice, setChoice] = useState<PaymentChoice>({ method: country.payments[0], phone: "" });
  // Fall back to the first method when the country changes and the old one isn't offered.
  const method = country.payments.includes(choice.method) ? choice.method : country.payments[0];
  return [{ ...choice, method }, (patch) => setChoice((c) => ({ ...c, ...patch }))];
}

export function isPaymentReady(choice: PaymentChoice): boolean {
  return !PAYMENT_METHODS[choice.method].mobile || choice.phone.replace(/\D/g, "").length >= 8;
}

export function paymentSummary(choice: PaymentChoice): string {
  const m = PAYMENT_METHODS[choice.method];
  return m.mobile ? `${m.label} · ${choice.phone}` : m.label;
}

export function PaymentMethodPicker({ value, onChange }: { value: PaymentChoice; onChange: (patch: Partial<PaymentChoice>) => void }) {
  const country = countryOf(useStore(selectCountry));
  const method = PAYMENT_METHODS[value.method];
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[13px] font-medium text-text2 mb-1.5">Moyen de paiement · {country.flag} {country.name}</p>
        <div className="grid grid-cols-2 gap-2">
          {country.payments.map((id) => {
            const m = PAYMENT_METHODS[id];
            const on = value.method === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ method: id })}
                aria-pressed={on}
                className={cn("flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-[13px] transition-colors", on ? "border-accent/60 bg-accent/10 text-text" : "border-border bg-surface text-text2 hover:text-text hover:border-white/25")}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded text-[9px] font-bold text-black" style={{ background: m.color }}>{m.short}</span>
                <span className="flex-1 truncate">{m.label}</span>
                {on && <Check className="size-3.5 text-success" />}
              </button>
            );
          })}
        </div>
      </div>
      {method.mobile && (
        <Input
          label={`Numéro ${method.label}`}
          name="momo-phone"
          inputMode="tel"
          autoComplete="tel"
          leftIcon={<Phone />}
          placeholder={`+${country.dialCode} 07 00 00 00 00`}
          value={value.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          hint="Vous recevrez une demande de confirmation sur votre téléphone."
        />
      )}
    </div>
  );
}

/** Compact country selector (flag + name). Changing it switches currency, payments and languages. */
export function CountrySelect({ className }: { className?: string }) {
  const country = useStore(selectCountry);
  const setCountry = useStore((s) => s.setCountry);
  return (
    <select
      aria-label="Pays"
      value={country}
      onChange={(e) => setCountry(e.target.value as CountryCode)}
      className={cn("h-9 rounded-full border border-border bg-surface px-3 text-[13px] text-text focus:border-accent focus:outline-none", className)}
    >
      {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
    </select>
  );
}
